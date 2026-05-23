"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { ShieldCheck, ShoppingBag } from "lucide-react";
import { PhoneInput } from "@/components/ui/phone-input";

type Props = {
  token: string;
  locale: string;
  storeName: string;
  roleLabel: string;
  initialName: string;
  initialPhone: string;
  userEmail: string;
};

export function AcceptInviteClient({ token, locale, storeName, roleLabel, initialName, initialPhone, userEmail }: Props) {
  const router = useRouter();
  const [name, setName] = useState(initialName);
  const [phone, setPhone] = useState(initialPhone);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isAdmin = roleLabel === "Administrador";

  async function handleAccept(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) { setError("Por favor, informe seu nome."); return; }
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/invites/${token}/redeem`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim(), phone: phone || null }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error); return; }
      router.push(`/${locale}/painel/${data.storeId}`);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-6" style={{ background: "var(--cream)" }}>
      <div
        className="rounded-2xl border w-full max-w-sm overflow-hidden"
        style={{ background: "white", borderColor: "var(--cream-dark, #e8ddd3)" }}
      >
        {/* Header */}
        <div className="px-6 pt-6 pb-4 text-center space-y-3">
          <Image src="/ecoffee-icon.svg" alt="E-Coffee" width={44} height={44} className="mx-auto rounded-xl" />
          <div>
            <h1 className="text-lg font-bold" style={{ color: "var(--brown-dark)" }}>Você foi convidado!</h1>
            <p className="text-sm mt-1" style={{ color: "var(--text-muted)" }}>
              Junte-se à loja <strong style={{ color: "var(--brown-dark)" }}>{storeName}</strong>
            </p>
          </div>
          <span
            className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold"
            style={{
              background: isAdmin ? "rgba(232,106,26,0.12)" : "rgba(58,26,0,0.08)",
              color: isAdmin ? "var(--orange)" : "var(--text-muted)",
            }}
          >
            {isAdmin ? <ShieldCheck size={13} /> : <ShoppingBag size={13} />}
            {roleLabel}
          </span>
        </div>

        {/* Form */}
        <form onSubmit={handleAccept} className="px-6 pb-6 space-y-4 border-t pt-4" style={{ borderColor: "var(--cream-dark, #e8ddd3)" }}>
          <p className="text-xs" style={{ color: "var(--text-muted)" }}>
            Complete seu perfil para continuar
          </p>

          {/* Email — read only */}
          <div className="space-y-1">
            <label className="text-xs font-medium" style={{ color: "var(--brown-dark)" }}>E-mail</label>
            <input
              type="email"
              value={userEmail}
              readOnly
              className="w-full px-3 py-2.5 rounded-xl text-sm border cursor-not-allowed"
              style={{ background: "var(--cream)", borderColor: "var(--cream-dark, #e8ddd3)", color: "var(--text-muted)" }}
            />
          </div>

          {/* Name */}
          <div className="space-y-1">
            <label className="text-xs font-medium" style={{ color: "var(--brown-dark)" }}>
              Nome completo <span style={{ color: "var(--orange)" }}>*</span>
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Seu nome"
              required
              className="w-full px-3 py-2.5 rounded-xl text-sm border outline-none focus:ring-2 transition-all"
              style={{ borderColor: "var(--cream-dark, #e8ddd3)", color: "var(--brown-dark)" }}
            />
          </div>

          {/* WhatsApp com DDI + máscara */}
          <PhoneInput value={phone} onChange={setPhone} />

          {error && (
            <p className="text-sm rounded-xl p-3" style={{ background: "rgba(232,106,26,0.1)", color: "var(--orange)" }}>
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading || !name.trim()}
            className="w-full py-3 rounded-xl text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-40"
            style={{ background: "var(--orange)" }}
          >
            {loading ? "Entrando..." : "Aceitar convite e entrar"}
          </button>
        </form>
      </div>
    </div>
  );
}
