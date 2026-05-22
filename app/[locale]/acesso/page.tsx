"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { use } from "react";

type Props = {
  params: Promise<{ locale: string }>;
};

export default function LoginPage({ params }: Props) {
  const { locale } = use(params);
  const t = useTranslations("auth");
  const router = useRouter();
  const searchParams = useSearchParams();
  const nextUrl = searchParams.get("next") ?? `/${locale}/painel`;

  const [mode, setMode] = useState<"login" | "reset">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [resetSent, setResetSent] = useState(false);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const supabase = createClient();
    const { error: authError } = await supabase.auth.signInWithPassword({ email, password });

    if (authError) {
      setError(authError.message);
      setLoading(false);
      return;
    }

    router.push(nextUrl);
    router.refresh();
  }

  async function handleReset(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const supabase = createClient();
    const { error: authError } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/${locale}/acesso/nova-senha`,
    });

    setLoading(false);
    if (authError) { setError(authError.message); return; }
    setResetSent(true);
  }

  function switchMode(next: "login" | "reset") {
    setMode(next);
    setError(null);
    setResetSent(false);
  }

  return (
    <div
      className="min-h-screen flex items-center justify-center px-4"
      style={{ background: "var(--brown-dark)" }}
    >
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="text-center mb-8">
          <div
            className="w-16 h-16 rounded-2xl flex items-center justify-center text-2xl font-black text-white mx-auto mb-4"
            style={{ background: "var(--orange)" }}
          >
            ☕
          </div>
          <h1 className="text-2xl font-bold text-white">
            {mode === "login" ? t("loginTitle") : "Recuperar senha"}
          </h1>
          <p className="text-cream/60 text-sm mt-1">Café AT — Sistema de Gestão</p>
        </div>

        {/* ── LOGIN ── */}
        {mode === "login" && (
          <form
            onSubmit={handleLogin}
            className="rounded-2xl p-6 flex flex-col gap-4"
            style={{ background: "var(--brown-mid)" }}
          >
            {error && (
              <div className="rounded-xl p-3 text-sm text-red-300 bg-red-500/10 border border-red-500/20">
                {error}
              </div>
            )}

            <div>
              <label className="block text-sm font-semibold text-cream/80 mb-1.5">{t("email")}</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full px-4 py-3 rounded-xl text-sm bg-white/10 border border-white/10 text-white placeholder-cream/30 focus:outline-none focus:border-orange/50 transition-colors"
                placeholder="seu@email.com"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-sm font-semibold text-cream/80">{t("password")}</label>
                <button
                  type="button"
                  onClick={() => switchMode("reset")}
                  className="text-xs text-cream/50 hover:text-cream/80 transition-colors"
                >
                  Esqueci minha senha
                </button>
              </div>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
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
              {loading ? "Entrando..." : t("login")}
            </button>
          </form>
        )}

        {/* ── RESET ── */}
        {mode === "reset" && (
          <div className="rounded-2xl p-6 flex flex-col gap-4" style={{ background: "var(--brown-mid)" }}>
            {resetSent ? (
              <div className="flex flex-col items-center gap-3 py-4 text-center">
                <div className="w-12 h-12 rounded-full bg-green-500/20 flex items-center justify-center text-green-400 text-xl">
                  ✓
                </div>
                <p className="text-white font-semibold">E-mail enviado!</p>
                <p className="text-cream/60 text-sm">
                  Verifique sua caixa de entrada e siga o link para criar uma nova senha.
                </p>
                <button
                  onClick={() => switchMode("login")}
                  className="mt-2 text-sm text-cream/60 hover:text-cream/90 transition-colors underline underline-offset-2"
                >
                  Voltar para o login
                </button>
              </div>
            ) : (
              <form onSubmit={handleReset} className="flex flex-col gap-4">
                <p className="text-cream/60 text-sm">
                  Digite seu e-mail e enviaremos um link para redefinir sua senha.
                </p>

                {error && (
                  <div className="rounded-xl p-3 text-sm text-red-300 bg-red-500/10 border border-red-500/20">
                    {error}
                  </div>
                )}

                <div>
                  <label className="block text-sm font-semibold text-cream/80 mb-1.5">{t("email")}</label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="w-full px-4 py-3 rounded-xl text-sm bg-white/10 border border-white/10 text-white placeholder-cream/30 focus:outline-none focus:border-orange/50 transition-colors"
                    placeholder="seu@email.com"
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3.5 rounded-xl text-white font-bold text-sm transition-opacity hover:opacity-90 disabled:opacity-60"
                  style={{ background: "var(--orange)" }}
                >
                  {loading ? "Enviando..." : "Enviar link de recuperação"}
                </button>

                <button
                  type="button"
                  onClick={() => switchMode("login")}
                  className="text-sm text-cream/50 hover:text-cream/80 transition-colors text-center"
                >
                  ← Voltar para o login
                </button>
              </form>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
