"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { ShieldCheck, ShoppingBag, Eye, EyeOff, Mail } from "lucide-react";
import { PhoneInput } from "@/components/ui/phone-input";
import { createClient } from "@/lib/supabase/client";

type LoggedInUser = { name: string; phone: string; email: string };

type Props = {
  token: string;
  locale: string;
  storeName: string;
  roleLabel: string;
  loggedInUser: LoggedInUser | null;
};

type Mode = "signup" | "login" | "accept" | "confirm-email";

export function AcceptInviteClient({ token, locale, storeName, roleLabel, loggedInUser }: Props) {
  const router = useRouter();
  const isAdmin = roleLabel === "Administrador";

  const [mode, setMode] = useState<Mode>(loggedInUser ? "accept" : "signup");

  // Accept form (already logged in)
  const [name, setName] = useState(loggedInUser?.name ?? "");
  const [phone, setPhone] = useState(loggedInUser?.phone ?? "");
  const [acceptLoading, setAcceptLoading] = useState(false);

  // Signup form
  const [signupName, setSignupName] = useState("");
  const [signupEmail, setSignupEmail] = useState("");
  const [signupPhone, setSignupPhone] = useState("");
  const [signupPassword, setSignupPassword] = useState("");
  const [showSignupPassword, setShowSignupPassword] = useState(false);
  const [confirmedEmail, setConfirmedEmail] = useState("");

  // Login form
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [showLoginPassword, setShowLoginPassword] = useState(false);

  const [authLoading, setAuthLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // ── Accept ──────────────────────────────────────────────────────────────────

  async function handleAccept(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) { setError("Por favor, informe seu nome."); return; }
    setAcceptLoading(true);
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
      setAcceptLoading(false);
    }
  }

  // ── Login then accept ───────────────────────────────────────────────────────

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setAuthLoading(true);
    setError(null);
    try {
      const supabase = createClient();
      const { error: authError } = await supabase.auth.signInWithPassword({
        email: loginEmail,
        password: loginPassword,
      });
      if (authError) { setError(authError.message); return; }

      const res = await fetch(`/api/invites/${token}/redeem`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error); return; }
      router.push(`/${locale}/painel/${data.storeId}`);
    } finally {
      setAuthLoading(false);
    }
  }

  // ── Signup ──────────────────────────────────────────────────────────────────

  async function handleSignup(e: React.FormEvent) {
    e.preventDefault();
    if (!signupName.trim()) { setError("Por favor, informe seu nome."); return; }
    if (signupPassword.length < 6) { setError("A senha deve ter pelo menos 6 caracteres."); return; }
    setAuthLoading(true);
    setError(null);
    try {
      const supabase = createClient();
      const { data, error: authError } = await supabase.auth.signUp({
        email: signupEmail,
        password: signupPassword,
        options: {
          data: { name: signupName.trim(), phone: signupPhone || "" },
          emailRedirectTo: `${window.location.origin}/${locale}/auth/callback?next=${encodeURIComponent(`/${locale}/convite/${token}`)}`,
        },
      });
      if (authError) { setError(authError.message); return; }

      // If Supabase returns a session immediately (email confirmation disabled),
      // accept the invite right away without waiting for the email.
      if (data.session) {
        const res = await fetch(`/api/invites/${token}/redeem`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name: signupName.trim(), phone: signupPhone || null }),
        });
        const resData = await res.json();
        if (!res.ok) { setError(resData.error); return; }
        router.push(`/${locale}/painel/${resData.storeId}`);
        return;
      }

      // Email confirmation required — show check inbox screen
      setConfirmedEmail(signupEmail);
      setMode("confirm-email");
    } finally {
      setAuthLoading(false);
    }
  }

  // ── Shared ──────────────────────────────────────────────────────────────────

  const inputCls = "w-full px-3 py-2.5 rounded-xl text-sm border outline-none focus:ring-2 transition-all";
  const inputStyle = { borderColor: "var(--cream-dark, #e8ddd3)", color: "var(--brown-dark)" };

  function switchMode(next: "signup" | "login") {
    setMode(next);
    setError(null);
  }

  // ── Invite card (always shown) ──────────────────────────────────────────────

  return (
    <div className="min-h-screen flex items-center justify-center p-6" style={{ background: "var(--cream)" }}>
      <div
        className="rounded-2xl border w-full max-w-sm overflow-hidden"
        style={{ background: "white", borderColor: "var(--cream-dark, #e8ddd3)" }}
      >
        {/* Invite header */}
        <div className="px-6 pt-6 pb-4 text-center space-y-3 border-b" style={{ borderColor: "var(--cream-dark, #e8ddd3)" }}>
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

        {/* Body */}
        <div className="px-6 py-5">

          {/* ── Accept (already logged in) ── */}
          {mode === "accept" && (
            <form onSubmit={handleAccept} className="space-y-4">
              <p className="text-xs" style={{ color: "var(--text-muted)" }}>Complete seu perfil para continuar</p>

              <div className="space-y-1">
                <label className="text-xs font-medium" style={{ color: "var(--brown-dark)" }}>E-mail</label>
                <input
                  type="email"
                  value={loggedInUser?.email ?? ""}
                  readOnly
                  className={`${inputCls} cursor-not-allowed`}
                  style={{ background: "var(--cream)", borderColor: "var(--cream-dark, #e8ddd3)", color: "var(--text-muted)" }}
                />
              </div>

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
                  className={inputCls}
                  style={inputStyle}
                />
              </div>

              <PhoneInput value={phone} onChange={setPhone} />

              {error && <ErrorBox message={error} />}

              <button
                type="submit"
                disabled={acceptLoading || !name.trim()}
                className="w-full py-3 rounded-xl text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-40"
                style={{ background: "var(--orange)" }}
              >
                {acceptLoading ? "Entrando..." : "Aceitar convite e entrar"}
              </button>
            </form>
          )}

          {/* ── Signup ── */}
          {mode === "signup" && (
            <form onSubmit={handleSignup} className="space-y-3">
              <div className="space-y-1">
                <label className="text-xs font-medium" style={{ color: "var(--brown-dark)" }}>
                  Nome completo <span style={{ color: "var(--orange)" }}>*</span>
                </label>
                <input
                  type="text"
                  value={signupName}
                  onChange={(e) => setSignupName(e.target.value)}
                  placeholder="Seu nome"
                  required
                  className={inputCls}
                  style={inputStyle}
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-medium" style={{ color: "var(--brown-dark)" }}>
                  E-mail <span style={{ color: "var(--orange)" }}>*</span>
                </label>
                <input
                  type="email"
                  value={signupEmail}
                  onChange={(e) => setSignupEmail(e.target.value)}
                  placeholder="seu@email.com"
                  required
                  className={inputCls}
                  style={inputStyle}
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-medium" style={{ color: "var(--brown-dark)" }}>
                  Senha <span style={{ color: "var(--orange)" }}>*</span>
                </label>
                <div className="relative">
                  <input
                    type={showSignupPassword ? "text" : "password"}
                    value={signupPassword}
                    onChange={(e) => setSignupPassword(e.target.value)}
                    placeholder="Mínimo 6 caracteres"
                    required
                    minLength={6}
                    className={`${inputCls} pr-10`}
                    style={inputStyle}
                  />
                  <button
                    type="button"
                    onClick={() => setShowSignupPassword((v) => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2"
                    style={{ color: "var(--text-muted)" }}
                  >
                    {showSignupPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                </div>
              </div>

              <PhoneInput value={signupPhone} onChange={setSignupPhone} />

              {error && <ErrorBox message={error} />}

              <button
                type="submit"
                disabled={authLoading}
                className="w-full py-3 rounded-xl text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-40"
                style={{ background: "var(--orange)" }}
              >
                {authLoading ? "Criando conta..." : "Criar conta e aceitar convite"}
              </button>

              <p className="text-center text-xs pt-1" style={{ color: "var(--text-muted)" }}>
                Já tem uma conta?{" "}
                <button type="button" onClick={() => switchMode("login")} className="font-semibold" style={{ color: "var(--orange)" }}>
                  Entrar
                </button>
              </p>
            </form>
          )}

          {/* ── Login ── */}
          {mode === "login" && (
            <form onSubmit={handleLogin} className="space-y-3">
              <div className="space-y-1">
                <label className="text-xs font-medium" style={{ color: "var(--brown-dark)" }}>E-mail</label>
                <input
                  type="email"
                  value={loginEmail}
                  onChange={(e) => setLoginEmail(e.target.value)}
                  placeholder="seu@email.com"
                  required
                  className={inputCls}
                  style={inputStyle}
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-medium" style={{ color: "var(--brown-dark)" }}>Senha</label>
                <div className="relative">
                  <input
                    type={showLoginPassword ? "text" : "password"}
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    placeholder="••••••••"
                    required
                    className={`${inputCls} pr-10`}
                    style={inputStyle}
                  />
                  <button
                    type="button"
                    onClick={() => setShowLoginPassword((v) => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2"
                    style={{ color: "var(--text-muted)" }}
                  >
                    {showLoginPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                </div>
              </div>

              {error && <ErrorBox message={error} />}

              <button
                type="submit"
                disabled={authLoading}
                className="w-full py-3 rounded-xl text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-40"
                style={{ background: "var(--orange)" }}
              >
                {authLoading ? "Entrando..." : "Entrar e aceitar convite"}
              </button>

              <p className="text-center text-xs pt-1" style={{ color: "var(--text-muted)" }}>
                Não tem conta?{" "}
                <button type="button" onClick={() => switchMode("signup")} className="font-semibold" style={{ color: "var(--orange)" }}>
                  Criar conta
                </button>
              </p>
            </form>
          )}

          {/* ── Confirm email ── */}
          {mode === "confirm-email" && (
            <div className="flex flex-col items-center text-center gap-3 py-2">
              <div
                className="w-12 h-12 rounded-full flex items-center justify-center"
                style={{ background: "rgba(232,106,26,0.12)", color: "var(--orange)" }}
              >
                <Mail size={22} />
              </div>
              <div>
                <p className="font-semibold" style={{ color: "var(--brown-dark)" }}>Confirme seu e-mail</p>
                <p className="text-sm mt-1" style={{ color: "var(--text-muted)" }}>
                  Enviamos um link para <strong>{confirmedEmail}</strong>. Clique nele e você voltará automaticamente ao convite.
                </p>
              </div>
              <p className="text-xs" style={{ color: "var(--text-muted)" }}>
                Já confirmou?{" "}
                <button type="button" onClick={() => switchMode("login")} className="font-semibold" style={{ color: "var(--orange)" }}>
                  Entrar agora
                </button>
              </p>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}

function ErrorBox({ message }: { message: string }) {
  return (
    <p className="text-sm rounded-xl p-3" style={{ background: "rgba(232,106,26,0.1)", color: "var(--orange)" }}>
      {message}
    </p>
  );
}
