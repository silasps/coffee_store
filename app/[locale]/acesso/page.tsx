"use client";

import { use, useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Coffee, Eye, EyeOff, ShoppingCart } from "lucide-react";

type Country = { code: string; dial: string; flag: string; name: string };

const COUNTRIES: Country[] = [
  { code: "BR", dial: "+55",  flag: "🇧🇷", name: "Brasil" },
  { code: "PT", dial: "+351", flag: "🇵🇹", name: "Portugal" },
  { code: "US", dial: "+1",   flag: "🇺🇸", name: "EUA" },
  { code: "AR", dial: "+54",  flag: "🇦🇷", name: "Argentina" },
  { code: "CL", dial: "+56",  flag: "🇨🇱", name: "Chile" },
  { code: "CO", dial: "+57",  flag: "🇨🇴", name: "Colômbia" },
  { code: "MX", dial: "+52",  flag: "🇲🇽", name: "México" },
  { code: "PY", dial: "+595", flag: "🇵🇾", name: "Paraguai" },
  { code: "UY", dial: "+598", flag: "🇺🇾", name: "Uruguai" },
  { code: "PE", dial: "+51",  flag: "🇵🇪", name: "Peru" },
  { code: "BO", dial: "+591", flag: "🇧🇴", name: "Bolívia" },
  { code: "EC", dial: "+593", flag: "🇪🇨", name: "Equador" },
  { code: "VE", dial: "+58",  flag: "🇻🇪", name: "Venezuela" },
  { code: "ES", dial: "+34",  flag: "🇪🇸", name: "Espanha" },
  { code: "DE", dial: "+49",  flag: "🇩🇪", name: "Alemanha" },
  { code: "FR", dial: "+33",  flag: "🇫🇷", name: "França" },
  { code: "IT", dial: "+39",  flag: "🇮🇹", name: "Itália" },
  { code: "GB", dial: "+44",  flag: "🇬🇧", name: "Reino Unido" },
  { code: "JP", dial: "+81",  flag: "🇯🇵", name: "Japão" },
  { code: "CN", dial: "+86",  flag: "🇨🇳", name: "China" },
];

function detectCountryCode(): string {
  const lang = (typeof navigator !== "undefined" ? navigator.language : "pt-BR") ?? "pt-BR";
  const region = lang.split("-")[1]?.toUpperCase();
  return COUNTRIES.find((c) => c.code === region) ? (region ?? "BR") : "BR";
}

function maskPhone(digits: string, countryCode: string): string {
  const d = digits.replace(/\D/g, "").slice(0, 11);
  if (countryCode === "BR") {
    if (d.length <= 10)
      return d.replace(/^(\d{0,2})(\d{0,4})(\d{0,4})$/, (_, a, b, c) =>
        [a && `(${a}`, b && `) ${b}`, c && `-${c}`].filter(Boolean).join("").replace(/^\((\d{1,2})$/, "($1")
      );
    return d.replace(/^(\d{2})(\d{5})(\d{0,4})$/, "($1) $2-$3");
  }
  if (countryCode === "US")
    return d.slice(0, 10).replace(/^(\d{0,3})(\d{0,3})(\d{0,4})$/, (_, a, b, c) =>
      [a && `(${a}`, b && `) ${b}`, c && `-${c}`].filter(Boolean).join("")
    );
  // Generic: groups of 4
  return d.replace(/(\d{4})(?=\d)/g, "$1 ");
}

type Props = {
  params: Promise<{ locale: string }>;
};

type Mode = "login" | "signup" | "reset";

type LoginBackground = {
  id: string;
  desktopPosition: string;
  mobilePosition: string;
};

const loginBackgrounds: LoginBackground[] = [
  {
    id: "photo-1501339847302-ac426a4a7cbb",
    desktopPosition: "30% center",
    mobilePosition: "center",
  },
  {
    id: "photo-1521017432531-fbd92d768814",
    desktopPosition: "center",
    mobilePosition: "center",
  },
  {
    id: "photo-1559925393-8be0ec4767c8",
    desktopPosition: "45% center",
    mobilePosition: "center",
  },
  {
    id: "photo-1554118811-1e0d58224f24",
    desktopPosition: "center",
    mobilePosition: "center",
  },
  {
    id: "photo-1495474472287-4d71bcdd2085",
    desktopPosition: "center",
    mobilePosition: "center",
  },
  {
    id: "photo-1517248135467-4c7edcad34c4",
    desktopPosition: "center",
    mobilePosition: "center",
  },
];

function getLoginBackgroundImage(background: LoginBackground, width: number) {
  return `url('https://images.unsplash.com/${background.id}?auto=format&fit=crop&w=${width}&q=85')`;
}

function pickLoginBackground() {
  return loginBackgrounds[Math.floor(Math.random() * loginBackgrounds.length)] ?? loginBackgrounds[0];
}

function isEmailConfirmationError(message: string) {
  const normalized = message.toLowerCase();
  return normalized.includes("email not confirmed") || normalized.includes("not confirmed");
}

function MenuMockup() {
  return (
    <div
      aria-hidden="true"
      className="relative h-[460px] w-[330px] rounded-[2.4rem] border border-white/15 bg-[#111113] p-[14px] shadow-[0_42px_90px_rgba(0,0,0,0.68),inset_0_0_0_1px_rgba(255,255,255,0.12)]"
    >
      {/* Tablet frame details */}
      <div className="absolute left-1/2 top-2.5 z-20 h-2 w-2 -translate-x-1/2 rounded-full bg-black shadow-[inset_0_0_0_1px_rgba(255,255,255,0.16)]" />
      <div className="absolute -left-1 top-28 h-14 w-1 rounded-l-full bg-[#2a2a2d]" />
      <div className="absolute -right-1 top-24 h-20 w-1 rounded-r-full bg-[#2a2a2d]" />
      <div className="absolute bottom-2.5 left-1/2 z-20 h-1 w-16 -translate-x-1/2 rounded-full bg-white/18" />

      {/* Screen */}
      <div
        className="relative h-full overflow-hidden rounded-[1.75rem] border border-black/40"
        style={{ background: "#FDF6EE" }}
      >
        {/* Header */}
        <div className="px-4 pb-3 pt-4" style={{ background: "#3A1A00" }}>
          <div className="mb-3 flex items-center justify-between text-[7px] font-semibold text-white/55">
            <span>9:41</span>
            <span>100%</span>
          </div>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="flex h-7 w-7 items-center justify-center rounded-lg text-[13px]" style={{ background: "#E86A1A" }}>☕</div>
              <div>
                <p className="text-[11px] font-bold leading-none text-white">Café Demo</p>
                <p className="mt-1 text-[7px] font-medium text-white/45">E-Coffee</p>
              </div>
            </div>
            <div className="flex items-center gap-1.5 rounded-full bg-white/10 px-2 py-1">
              <ShoppingCart size={11} className="text-white/70" />
              <span className="text-[9px] font-bold" style={{ color: "#E86A1A" }}>2</span>
            </div>
          </div>
        </div>

        {/* Category pills */}
        <div className="flex gap-1.5 px-3 pb-2 pt-3">
          <span className="rounded-full px-2.5 py-1 text-[7px] font-bold text-white" style={{ background: "#E86A1A" }}>Cafés</span>
          <span className="rounded-full border px-2.5 py-1 text-[7px] font-medium" style={{ color: "#8B6A55", borderColor: "#F5E8D8", background: "white" }}>Gelados</span>
          <span className="rounded-full border px-2.5 py-1 text-[7px] font-medium" style={{ color: "#8B6A55", borderColor: "#F5E8D8", background: "white" }}>Comes</span>
          <span className="rounded-full border px-2.5 py-1 text-[7px] font-medium" style={{ color: "#8B6A55", borderColor: "#F5E8D8", background: "white" }}>Combos</span>
        </div>

        {/* Product grid */}
        <div className="grid grid-cols-2 gap-2 px-3 pb-3">
          {[
            { emoji: "☕", name: "Espresso Duplo", price: "R$ 8,00", tag: "🔥 Popular", bg: "#FEF3C7" },
            { emoji: "🧋", name: "Cold Brew", price: "R$ 15,00", tag: "⭐ Destaque", bg: "#E0F2FE" },
            { emoji: "☕", name: "Cappuccino", price: "R$ 12,00", tag: null, bg: "#FDE8D0" },
            { emoji: "🥐", name: "Croissant", price: "R$ 9,00", tag: "✨ Novo", bg: "#FEF9C3" },
          ].map((item) => (
            <div key={item.name} className="overflow-hidden rounded-xl border shadow-sm" style={{ background: "white", borderColor: "#F5E8D8" }}>
              <div className="relative flex h-[60px] items-center justify-center text-[26px]" style={{ background: item.bg }}>
                {item.emoji}
                {item.tag && (
                  <span className="absolute left-1 top-1 rounded-full bg-white/85 px-1 py-0.5 text-[5px] font-bold text-gray-700">{item.tag}</span>
                )}
              </div>
              <div className="p-1.5">
                <p className="text-[7px] font-bold leading-tight" style={{ color: "#1A0A00" }}>{item.name}</p>
                <p className="text-[7px] font-bold mt-0.5" style={{ color: "#E86A1A" }}>{item.price}</p>
                <div
                  className="mt-1 w-full rounded-md py-[3px] text-center text-[6px] font-bold text-white"
                  style={{ background: "#E86A1A" }}
                >
                  + Adicionar
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Cart bar */}
        <div className="absolute bottom-3 left-3 right-3">
          <div className="flex items-center justify-between rounded-xl px-3 py-2.5 shadow-lg" style={{ background: "#3A1A00" }}>
            <div className="flex items-center gap-1.5">
              <div className="flex h-5 w-5 items-center justify-center rounded-full text-[8px] font-bold text-white" style={{ background: "#E86A1A" }}>2</div>
              <span className="text-[8px] font-medium text-white">itens no carrinho</span>
            </div>
            <span className="text-[8px] font-bold" style={{ color: "#E86A1A" }}>Ver pedido →</span>
          </div>
        </div>

        {/* Screen glare */}
        <div className="pointer-events-none absolute inset-0 rounded-[1.75rem]" style={{ background: "linear-gradient(135deg, rgba(255,255,255,0.16) 0%, rgba(255,255,255,0.03) 34%, transparent 58%)" }} />
      </div>
    </div>
  );
}

export default function LoginPage({ params }: Props) {
  const { locale } = use(params);
  const t = useTranslations("auth");
  const router = useRouter();
  const searchParams = useSearchParams();
  const nextUrl = searchParams.get("next") ?? `/${locale}/painel`;
  const authStatus = searchParams.get("auth");

  const isOffline = searchParams.get("offline") === "1";

  const [mode, setMode] = useState<Mode>("login");
  const [name, setName] = useState("");
  const [dialCode, setDialCode] = useState("+55");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showSignupPassword, setShowSignupPassword] = useState(false);
  const [showSignupConfirmPassword, setShowSignupConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [confirmationHelp, setConfirmationHelp] = useState(false);
  const [resetSent, setResetSent] = useState(false);
  const [resendSent, setResendSent] = useState(false);
  const [signupDone, setSignupDone] = useState(false);
  const [loginBackground, setLoginBackground] = useState<LoginBackground>(loginBackgrounds[0]);

  useEffect(() => {
    setLoginBackground(pickLoginBackground());
    const code = detectCountryCode();
    const country = COUNTRIES.find((c) => c.code === code);
    if (country) setDialCode(country.dial);
  }, []);

  useEffect(() => {
    if (isOffline) return; // servidor não consegue validar sessão — não redirecionar
    const supabase = createClient();
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) router.replace(nextUrl);
    }).catch(() => {});
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOffline]);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setConfirmationHelp(false);
    setResendSent(false);
    const supabase = createClient();

    let authError: { message: string } | null = null;
    for (let attempt = 1; attempt <= 3; attempt++) {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (!error) { authError = null; break; }
      authError = error;
      const isNetwork = error.message === "Failed to fetch" || error.message?.includes("fetch");
      if (!isNetwork || attempt === 3) break;
      setError(`Falha de conexão. Tentando novamente (${attempt}/3)…`);
      await new Promise((r) => setTimeout(r, 1500 * attempt));
    }

    if (authError) {
      const needsConfirmation = isEmailConfirmationError(authError.message);
      setConfirmationHelp(needsConfirmation);
      setError(
        authError.message === "Failed to fetch"
          ? "Não foi possível conectar ao servidor. Verifique sua conexão e tente novamente."
          : needsConfirmation
          ? "Seu e-mail ainda não foi confirmado. Reenvie a confirmação e use o link mais recente."
          : authError.message
      );
      setLoading(false);
      return;
    }
    router.push(nextUrl);
    router.refresh();
  }

  async function handleSignup(e: React.FormEvent) {
    e.preventDefault();
    if (password !== confirmPassword) { setError("As senhas não coincidem."); return; }
    if (password.length < 6) { setError("A senha deve ter pelo menos 6 caracteres."); return; }
    setLoading(true);
    setError(null);
    const supabase = createClient();
    const { error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { name, phone: phone ? `${dialCode}${phone.replace(/\D/g, "")}` : "" },
        emailRedirectTo: `${window.location.origin}/${locale}/auth/callback?next=${encodeURIComponent(nextUrl)}`,
      },
    });
    setLoading(false);
    if (authError) { setError(authError.message); return; }
    setSignupDone(true);
  }

  async function handleResendConfirmation() {
    if (!email) {
      setError("Digite seu e-mail para reenviar a confirmação.");
      return;
    }

    setResending(true);
    setError(null);
    setResendSent(false);

    const supabase = createClient();
    const { error: authError } = await supabase.auth.resend({
      type: "signup",
      email,
      options: {
        emailRedirectTo: `${window.location.origin}/${locale}/auth/callback?next=${encodeURIComponent(nextUrl)}`,
      },
    });

    setResending(false);
    if (authError) { setError(authError.message); return; }
    setResendSent(true);
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

  function switchMode(next: Mode) {
    setMode(next);
    setError(null);
    setConfirmationHelp(false);
    setResetSent(false);
    setResending(false);
    setResendSent(false);
    setSignupDone(false);
  }

  const inputCls =
    "w-full px-4 py-3 rounded-xl text-sm border text-white placeholder-white/30 focus:outline-none transition-all"
    + " bg-white/8 border-white/12 focus:border-white/35 focus:bg-white/12";

  const authSuccess =
    authStatus === "verified"
      ? "E-mail confirmado. Agora entre com sua conta."
      : null;

  const authGuidance =
    confirmationHelp
      ? {
          tone: "warning",
          title: "E-mail ainda não confirmado",
          description: "O cadastro existe, mas o Supabase ainda não liberou o login sem confirmação.",
          steps: [
            "Confira se você digitou o mesmo e-mail usado no cadastro.",
            "Clique em Reenviar confirmação.",
            "Abra o e-mail mais recente recebido e volte para entrar novamente.",
          ],
        }
      : authStatus === "try-login"
      ? {
          tone: "info",
          title: "Confirmação recebida",
          description: "Seu e-mail parece já estar ativado. Entre com a senha que você criou no cadastro.",
          steps: [
            "Digite seu e-mail e senha abaixo.",
            "Clique em Entrar.",
            "Se o login avisar que o e-mail ainda não foi confirmado, use o botão Reenviar confirmação.",
          ],
        }
      : authStatus === "invalid-link"
      ? {
          tone: "warning",
          title: "Link de confirmação expirado",
          description: "Esse link não pode mais ser usado. Sua conta pode já estar ativa, então tente entrar antes de reenviar.",
          steps: [
            "Digite seu e-mail e senha abaixo.",
            "Clique em Entrar.",
            "Se o login não liberar o acesso, clique em Reenviar confirmação e use o e-mail mais recente.",
          ],
        }
      : authStatus === "callback-error"
        ? {
            tone: "warning",
            title: "Não foi possível confirmar agora",
            description: "A confirmação pode já ter sido aplicada, mesmo com erro no retorno da página.",
            steps: [
              "Tente entrar com o e-mail e a senha do cadastro.",
              "Se não conseguir, clique em Reenviar confirmação.",
              "Use somente o link mais recente recebido no e-mail.",
            ],
          }
        : null;

  return (
    <div className="min-h-screen flex flex-col lg:flex-row">

      {/* ── LEFT PANEL: device showcase ── */}
      <div className="hidden lg:flex flex-1 relative items-center justify-center overflow-hidden">
        {/* Café background */}
        <div
          className="absolute inset-0 bg-cover"
          style={{
            backgroundImage: getLoginBackgroundImage(loginBackground, 1600),
            backgroundPosition: loginBackground.desktopPosition,
          }}
        />
        <div
          className="absolute inset-0"
          style={{ background: "linear-gradient(135deg, rgba(20,8,0,0.82) 0%, rgba(58,26,0,0.60) 50%, rgba(20,8,0,0.88) 100%)" }}
        />

        {/* Tablet mockup */}
        <div className="relative z-10 flex flex-col items-center">
          <MenuMockup />
          {/* Glow */}
          <div className="w-48 h-4 mt-2 rounded-full blur-xl opacity-40" style={{ background: "#E86A1A" }} />
        </div>

        {/* Bottom copy */}
        <div className="absolute bottom-12 left-10 right-10 z-10">
          <p className="text-white text-2xl font-bold leading-snug">
            E-Coffee,<br />pedidos em tempo real.
          </p>
          <p className="text-white/45 text-sm mt-2">
            Configure, personalize e venda — tudo em um só lugar.
          </p>
        </div>
      </div>

      {/* ── RIGHT PANEL: form ── */}
      <div
        className="flex-shrink-0 lg:w-[420px] min-h-screen flex items-center justify-center px-6 py-10 relative"
        style={{ background: "#140800" }}
      >
        {/* Mobile subtle bg */}
        <div
          className="lg:hidden absolute inset-0 bg-cover bg-center opacity-20"
          style={{
            backgroundImage: getLoginBackgroundImage(loginBackground, 900),
            backgroundPosition: loginBackground.mobilePosition,
          }}
        />

        <div className="relative z-10 w-full max-w-sm">
          {/* Logo */}
          <div className="mb-8">
            <div className="inline-flex items-center gap-2.5 mb-5">
              <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: "#E86A1A" }}>
                <Coffee size={18} className="text-white" />
              </div>
              <span className="text-white font-bold text-sm tracking-wide">E-Coffee</span>
            </div>
            <h1 className="text-3xl font-bold text-white tracking-tight">
              {mode === "login" && "Bem-vindo"}
              {mode === "signup" && "Criar conta"}
              {mode === "reset" && "Recuperar acesso"}
            </h1>
            <p className="text-white/40 text-sm mt-1">
              {mode === "login" && "Entre para gerenciar sua cafeteria"}
              {mode === "signup" && "Configure sua loja em poucos minutos"}
              {mode === "reset" && "Vamos te ajudar a recuperar o acesso"}
            </p>
          </div>

          {/* ── LOGIN ── */}
          {mode === "login" && (
            <form onSubmit={handleLogin} className="flex flex-col gap-4">
              {isOffline && !error && (
                <div className="rounded-xl px-4 py-3 text-sm text-amber-300 bg-amber-500/10 border border-amber-500/20">
                  Serviço temporariamente indisponível. Faça login para continuar.
                </div>
              )}
              {error && (
                <div className="rounded-xl px-4 py-3 text-sm text-red-300 bg-red-500/10 border border-red-500/20">{error}</div>
              )}
              {!error && authSuccess && (
                <div className="rounded-xl px-4 py-3 text-sm text-green-300 bg-green-500/10 border border-green-500/20">
                  {authSuccess}
                </div>
              )}
              {!error && authGuidance && (
                <div
                  className={
                    authGuidance.tone === "info"
                      ? "rounded-xl px-4 py-4 text-sm text-green-100 bg-green-500/10 border border-green-500/20"
                      : "rounded-xl px-4 py-4 text-sm text-amber-100 bg-amber-500/10 border border-amber-500/20"
                  }
                >
                  <p className={authGuidance.tone === "info" ? "font-bold text-green-200" : "font-bold text-amber-200"}>
                    {authGuidance.title}
                  </p>
                  <p className={authGuidance.tone === "info" ? "mt-1 text-green-100/75" : "mt-1 text-amber-100/75"}>
                    {authGuidance.description}
                  </p>
                  <ol className={authGuidance.tone === "info" ? "mt-3 space-y-2 pl-4 text-green-100/80 list-decimal" : "mt-3 space-y-2 pl-4 text-amber-100/80 list-decimal"}>
                    {authGuidance.steps.map((step) => (
                      <li key={step}>{step}</li>
                    ))}
                  </ol>
                </div>
              )}
              {!error && resendSent && (
                <div className="rounded-xl px-4 py-3 text-sm text-green-300 bg-green-500/10 border border-green-500/20">
                  Novo link enviado. Use o e-mail mais recente que chegar e ignore links anteriores.
                </div>
              )}
              <div>
                <label className="block text-xs font-semibold text-white/50 uppercase tracking-wider mb-2">{t("email")}</label>
                <input type="email" value={email} onChange={(e) => setEmail(e.target.value)}
                  required className={inputCls} placeholder="seu@email.com" />
              </div>
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs font-semibold text-white/50 uppercase tracking-wider">{t("password")}</label>
                  <button type="button" onClick={() => switchMode("reset")}
                    className="text-xs text-white/35 hover:text-white/60 transition-colors">
                    Esqueci a senha
                  </button>
                </div>
                <input type="password" value={password} onChange={(e) => setPassword(e.target.value)}
                  required className={inputCls} placeholder="••••••••" />
              </div>
              <button type="submit" disabled={loading}
                className="mt-1 w-full py-3.5 rounded-xl font-bold text-sm text-white transition-all hover:opacity-90 disabled:opacity-50"
                style={{ background: "#E86A1A" }}>
                {loading ? "Entrando..." : t("login")}
              </button>
              {authGuidance && (
                <div className="rounded-xl border border-white/10 bg-white/5 p-3 text-center">
                  <p className="text-xs text-white/35">
                    O login não funcionou por confirmação pendente?
                  </p>
                  <button
                    type="button"
                    onClick={handleResendConfirmation}
                    disabled={resending}
                    className="mt-2 text-xs font-semibold transition-colors disabled:opacity-50"
                    style={{ color: "#E86A1A" }}
                  >
                    {resending ? "Reenviando confirmação..." : "Reenviar confirmação"}
                  </button>
                </div>
              )}
              <div className="pt-2 text-center">
                <p className="text-xs text-white/30">
                  Ainda não tem conta?{" "}
                  <button type="button" onClick={() => switchMode("signup")}
                    className="font-semibold transition-colors hover:opacity-80" style={{ color: "#E86A1A" }}>
                    Cadastre-se grátis
                  </button>
                </p>
              </div>
            </form>
          )}

          {/* ── SIGNUP ── */}
          {mode === "signup" && (
            <div>
              {signupDone ? (
                <div className="flex flex-col items-center gap-4 py-6 text-center">
                  <div className="w-14 h-14 rounded-full bg-green-500/20 border border-green-500/30 flex items-center justify-center text-green-400 text-2xl">✓</div>
                  <div>
                    <p className="text-white font-bold text-lg">Conta criada!</p>
                    <p className="text-white/40 text-sm mt-1">Confirme seu e-mail para ativar o acesso.</p>
                  </div>
                  <button onClick={() => switchMode("login")}
                    className="text-sm text-white/40 hover:text-white/70 transition-colors underline underline-offset-2">
                    Ir para o login
                  </button>
                </div>
              ) : (
                <form onSubmit={handleSignup} className="flex flex-col gap-4">
                  {error && (
                    <div className="rounded-xl px-4 py-3 text-sm text-red-300 bg-red-500/10 border border-red-500/20">{error}</div>
                  )}
                  <div>
                    <label className="block text-xs font-semibold text-white/50 uppercase tracking-wider mb-2">Nome</label>
                    <input type="text" value={name} onChange={(e) => setName(e.target.value)}
                      required className={inputCls} placeholder="Seu nome" />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-white/50 uppercase tracking-wider mb-2">WhatsApp</label>
                    <div className="flex gap-2">
                      <div className="relative flex-shrink-0">
                        <select
                          value={dialCode}
                          onChange={(e) => { setDialCode(e.target.value); setPhone(""); }}
                          className="appearance-none h-full pl-3 pr-7 rounded-xl text-sm text-white border focus:outline-none focus:border-white/35 bg-white/8 border-white/12"
                          style={{ paddingTop: "0.75rem", paddingBottom: "0.75rem" }}
                        >
                          {COUNTRIES.map((c) => (
                            <option key={c.code} value={c.dial} style={{ background: "#1a0a00" }}>
                              {c.flag} {c.dial}
                            </option>
                          ))}
                        </select>
                        <span className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-white/40 text-xs">▾</span>
                      </div>
                      <input
                        type="tel"
                        value={phone}
                        onChange={(e) => setPhone(maskPhone(e.target.value, COUNTRIES.find((c) => c.dial === dialCode)?.code ?? "BR"))}
                        className={inputCls}
                        placeholder={dialCode === "+55" ? "(11) 99999-0000" : dialCode === "+1" ? "(555) 555-5555" : "999 9999 9999"}
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-white/50 uppercase tracking-wider mb-2">{t("email")}</label>
                    <input type="email" value={email} onChange={(e) => setEmail(e.target.value)}
                      required className={inputCls} placeholder="seu@email.com" />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-white/50 uppercase tracking-wider mb-2">Senha</label>
                    <div className="relative">
                      <input
                        type={showSignupPassword ? "text" : "password"}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                        minLength={6}
                        className={`${inputCls} pr-12`}
                        placeholder="Mínimo 6 caracteres"
                      />
                      <button
                        type="button"
                        onClick={() => setShowSignupPassword((show) => !show)}
                        className="absolute right-3 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-lg text-white/35 transition-colors hover:text-white/65 focus:outline-none focus:ring-2 focus:ring-white/20"
                        aria-label={showSignupPassword ? "Esconder senha" : "Mostrar senha"}
                      >
                        {showSignupPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-white/50 uppercase tracking-wider mb-2">Confirmar senha</label>
                    <div className="relative">
                      <input
                        type={showSignupConfirmPassword ? "text" : "password"}
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        required
                        className={`${inputCls} pr-12`}
                        placeholder="••••••••"
                      />
                      <button
                        type="button"
                        onClick={() => setShowSignupConfirmPassword((show) => !show)}
                        className="absolute right-3 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-lg text-white/35 transition-colors hover:text-white/65 focus:outline-none focus:ring-2 focus:ring-white/20"
                        aria-label={showSignupConfirmPassword ? "Esconder confirmação de senha" : "Mostrar confirmação de senha"}
                      >
                        {showSignupConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                    </div>
                  </div>
                  <button type="submit" disabled={loading}
                    className="mt-1 w-full py-3.5 rounded-xl font-bold text-sm text-white transition-all hover:opacity-90 disabled:opacity-50"
                    style={{ background: "#E86A1A" }}>
                    {loading ? "Criando conta..." : "Criar conta grátis"}
                  </button>
                  <div className="pt-2 text-center">
                    <button type="button" onClick={() => switchMode("login")}
                      className="text-xs text-white/30 hover:text-white/60 transition-colors">
                      ← Já tenho conta
                    </button>
                  </div>
                </form>
              )}
            </div>
          )}

          {/* ── RESET ── */}
          {mode === "reset" && (
            <div>
              {resetSent ? (
                <div className="flex flex-col items-center gap-4 py-6 text-center">
                  <div className="w-14 h-14 rounded-full bg-green-500/20 border border-green-500/30 flex items-center justify-center text-green-400 text-2xl">✓</div>
                  <div>
                    <p className="text-white font-bold text-lg">E-mail enviado!</p>
                    <p className="text-white/40 text-sm mt-1">Verifique sua caixa de entrada e siga o link.</p>
                  </div>
                  <button onClick={() => switchMode("login")}
                    className="text-sm text-white/40 hover:text-white/70 transition-colors underline underline-offset-2">
                    Voltar para o login
                  </button>
                </div>
              ) : (
                <form onSubmit={handleReset} className="flex flex-col gap-4">
                  <p className="text-white/40 text-sm">Digite seu e-mail e enviaremos um link de recuperação.</p>
                  {error && (
                    <div className="rounded-xl px-4 py-3 text-sm text-red-300 bg-red-500/10 border border-red-500/20">{error}</div>
                  )}
                  <div>
                    <label className="block text-xs font-semibold text-white/50 uppercase tracking-wider mb-2">{t("email")}</label>
                    <input type="email" value={email} onChange={(e) => setEmail(e.target.value)}
                      required className={inputCls} placeholder="seu@email.com" />
                  </div>
                  <button type="submit" disabled={loading}
                    className="w-full py-3.5 rounded-xl font-bold text-sm text-white transition-all hover:opacity-90 disabled:opacity-50"
                    style={{ background: "#E86A1A" }}>
                    {loading ? "Enviando..." : "Enviar link de recuperação"}
                  </button>
                  <div className="pt-2 text-center">
                    <button type="button" onClick={() => switchMode("login")}
                      className="text-xs text-white/30 hover:text-white/60 transition-colors">
                      ← Voltar para o login
                    </button>
                  </div>
                </form>
              )}
            </div>
          )}

          <p className="text-center text-white/20 text-xs mt-10">Sistema de Gestão de Cafeterias</p>
        </div>
      </div>
    </div>
  );
}
