"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { use } from "react";

type Props = {
  params: Promise<{ locale: string }>;
};

export default function NewPasswordPage({ params }: Props) {
  const { locale } = use(params);
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    // Supabase puts the session tokens in the URL hash after the reset link is clicked.
    // onAuthStateChange fires with SIGNED_IN / PASSWORD_RECOVERY when the session is set.
    const supabase = createClient();
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY" || event === "SIGNED_IN") {
        setReady(true);
      }
    });
    return () => subscription.unsubscribe();
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (password !== confirm) { setError("As senhas não coincidem."); return; }
    if (password.length < 6) { setError("A senha deve ter pelo menos 6 caracteres."); return; }

    setLoading(true);
    setError(null);

    const supabase = createClient();
    const { error: authError } = await supabase.auth.updateUser({ password });

    setLoading(false);
    if (authError) { setError(authError.message); return; }
    setDone(true);
    setTimeout(() => router.push(`/${locale}/painel`), 2500);
  }

  return (
    <div
      className="min-h-screen flex items-center justify-center px-4"
      style={{ background: "var(--brown-dark)" }}
    >
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div
            className="w-16 h-16 rounded-2xl flex items-center justify-center text-2xl font-black text-white mx-auto mb-4"
            style={{ background: "var(--orange)" }}
          >
            ☕
          </div>
          <h1 className="text-2xl font-bold text-white">Nova senha</h1>
          <p className="text-cream/60 text-sm mt-1">Café AT — Sistema de Gestão</p>
        </div>

        <div className="rounded-2xl p-6 flex flex-col gap-4" style={{ background: "var(--brown-mid)" }}>
          {done ? (
            <div className="flex flex-col items-center gap-3 py-4 text-center">
              <div className="w-12 h-12 rounded-full bg-green-500/20 flex items-center justify-center text-green-400 text-xl">
                ✓
              </div>
              <p className="text-white font-semibold">Senha alterada!</p>
              <p className="text-cream/60 text-sm">Redirecionando para o painel...</p>
            </div>
          ) : !ready ? (
            <p className="text-cream/60 text-sm text-center py-4">Validando link...</p>
          ) : (
            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              <p className="text-cream/60 text-sm">Escolha uma nova senha para sua conta.</p>

              {error && (
                <div className="rounded-xl p-3 text-sm text-red-300 bg-red-500/10 border border-red-500/20">
                  {error}
                </div>
              )}

              <div>
                <label className="block text-sm font-semibold text-cream/80 mb-1.5">Nova senha</label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={6}
                  className="w-full px-4 py-3 rounded-xl text-sm bg-white/10 border border-white/10 text-white placeholder-cream/30 focus:outline-none focus:border-orange/50 transition-colors"
                  placeholder="mínimo 6 caracteres"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-cream/80 mb-1.5">Confirmar senha</label>
                <input
                  type="password"
                  value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
                  required
                  className="w-full px-4 py-3 rounded-xl text-sm bg-white/10 border border-white/10 text-white placeholder-cream/30 focus:outline-none focus:border-orange/50 transition-colors"
                  placeholder="••••••••"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3.5 rounded-xl text-white font-bold text-sm transition-opacity hover:opacity-90 disabled:opacity-60 mt-2"
                style={{ background: "var(--orange)" }}
              >
                {loading ? "Salvando..." : "Salvar nova senha"}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
