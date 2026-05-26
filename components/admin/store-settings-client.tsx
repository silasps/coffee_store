"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { Save, Loader2, Upload, X, Camera, Heart, Users, Eye, EyeOff, Sparkles, MonitorSmartphone, Clock } from "lucide-react";
import { BrandPageContent, type BrandStore } from "@/components/menu/brand-page-content";
import { ImagePicker } from "@/components/admin/image-picker";

// ── Types ──────────────────────────────────────────────────────────────────
type DayHours = { day: number; open: string; close: string; closed: boolean };
type BusinessHoursConfig = { enabled: boolean; timezone: string; days: DayHours[] };

const DEFAULT_DAYS: DayHours[] = [
  { day: 0, open: "08:00", close: "18:00", closed: true },
  { day: 1, open: "08:00", close: "18:00", closed: false },
  { day: 2, open: "08:00", close: "18:00", closed: false },
  { day: 3, open: "08:00", close: "18:00", closed: false },
  { day: 4, open: "08:00", close: "18:00", closed: false },
  { day: 5, open: "08:00", close: "18:00", closed: false },
  { day: 6, open: "08:00", close: "14:00", closed: false },
];
const DAY_NAMES = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];

export type StoreForSettings = {
  id: string; slug: string;
  namePt: string; nameEn: string | null; nameEs: string | null;
  sloganPt: string | null; sloganEn: string | null; sloganEs: string | null;
  logoUrl: string | null;
  primaryColor: string | null; accentColor: string | null;
  defaultLocale: string;
  causeTitlePt: string | null; causeTitleEn: string | null; causeTitleEs: string | null;
  causeTextPt: string | null; causeTextEn: string | null; causeTextEs: string | null;
  causeDonationPix: string | null; causePaypalUrl: string | null;
  brandHeroImageUrl: string | null; brandAboutImageUrl: string | null;
  brandAboutTextPt: string | null; brandAboutTextEn: string | null; brandAboutTextEs: string | null;
  brandJoinTitlePt: string | null; brandJoinTitleEn: string | null; brandJoinTitleEs: string | null;
  brandJoinTextPt: string | null; brandJoinTextEn: string | null; brandJoinTextEs: string | null;
  brandJoinCtaLabel: string | null; brandJoinCtaUrl: string | null;
  brandAboutTitlePt: string | null; brandAboutTitleEn: string | null; brandAboutTitleEs: string | null;
  brandAboutVisible: boolean; brandCauseVisible: boolean; brandJoinVisible: boolean;
  businessHours: unknown;
};

const LANGS: Record<string, string> = { pt: "PT 🇧🇷", en: "EN 🇺🇸", es: "ES 🇪🇸" };

// ── Small helpers ───────────────────────────────────────────────────────────
function Section({
  title, icon, children, visible, onToggleVisible,
}: {
  title: string; icon?: React.ReactNode; children: React.ReactNode;
  visible?: boolean; onToggleVisible?: () => void;
}) {
  return (
    <div
      className="rounded-2xl border p-5 space-y-4 transition-opacity"
      style={{ borderColor: "var(--cream-dark)", background: "#fff", opacity: visible === false ? 0.55 : 1 }}
    >
      <div className="flex items-center justify-between">
        <h2 className="font-semibold text-sm flex items-center gap-2" style={{ color: "var(--brown-dark)" }}>
          {icon}{title}
        </h2>
        {onToggleVisible && (
          <button
            type="button" onClick={onToggleVisible}
            title={visible ? "Ocultar seção na página pública" : "Exibir seção na página pública"}
            className="p-1 rounded-lg transition-colors hover:bg-gray-100"
            style={{ color: visible ? "var(--orange)" : "var(--text-muted)" }}
          >
            {visible ? <Eye size={16} /> : <EyeOff size={16} />}
          </button>
        )}
      </div>
      {children}
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <label className="block text-xs font-medium" style={{ color: "var(--text-muted)" }}>{label}</label>
      {children}
    </div>
  );
}

const inp = "w-full px-3 py-2 rounded-xl border text-sm outline-none focus:ring-2 focus:ring-orange-200 transition-shadow";
const inpStyle = { borderColor: "var(--cream-dark)", background: "var(--cream)" };

function LangTabs({ value, onChange }: { value: string; onChange: (l: string) => void }) {
  return (
    <div className="flex gap-1 mb-2">
      {["pt", "en", "es"].map((l) => (
        <button
          key={l} type="button" onClick={() => onChange(l)}
          className={`px-2 py-1 rounded-lg text-xs font-medium transition-colors ${value === l ? "text-white" : "text-text-muted hover:bg-gray-100"}`}
          style={value === l ? { background: "var(--orange)" } : {}}
        >{LANGS[l]}</button>
      ))}
    </div>
  );
}


// ── Main component ──────────────────────────────────────────────────────────
export function StoreSettingsClient({ store, isPaidPlan = false }: { store: StoreForSettings; isPaidPlan?: boolean }) {
  const router = useRouter();
  const logoRef = useRef<HTMLInputElement>(null);

  // ── Loja state
  const [namePt, setNamePt] = useState(store.namePt);
  const [nameEn, setNameEn] = useState(store.nameEn ?? "");
  const [nameEs, setNameEs] = useState(store.nameEs ?? "");
  const [sloganPt, setSloganPt] = useState(store.sloganPt ?? "");
  const [sloganEn, setSloganEn] = useState(store.sloganEn ?? "");
  const [sloganEs, setSloganEs] = useState(store.sloganEs ?? "");
  const [slug, setSlug] = useState(store.slug);
  const [logoUrl, setLogoUrl] = useState(store.logoUrl ?? "");
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState("");
  const [primaryColor, setPrimaryColor] = useState(store.primaryColor ?? "#3A1A00");
  const [accentColor, setAccentColor] = useState(store.accentColor ?? "#E86A1A");
  const [defaultLocale, setDefaultLocale] = useState(store.defaultLocale);
  const [nameTab, setNameTab] = useState(store.defaultLocale);
  const [sloganTab, setSloganTab] = useState(store.defaultLocale);

  // ── Marca state
  const [brandHeroImageUrl, setBrandHeroImageUrl] = useState(store.brandHeroImageUrl ?? "");
  const [heroFile, setHeroFile] = useState<File | null>(null);
  const [heroPreview, setHeroPreview] = useState("");
  const [brandAboutImageUrl, setBrandAboutImageUrl] = useState(store.brandAboutImageUrl ?? "");
  const [aboutFile, setAboutFile] = useState<File | null>(null);
  const [aboutPreview, setAboutPreview] = useState("");
  const [brandAboutTextPt, setBrandAboutTextPt] = useState(store.brandAboutTextPt ?? "");
  const [brandAboutTextEn, setBrandAboutTextEn] = useState(store.brandAboutTextEn ?? "");
  const [brandAboutTextEs, setBrandAboutTextEs] = useState(store.brandAboutTextEs ?? "");
  const [brandJoinTitlePt, setBrandJoinTitlePt] = useState(store.brandJoinTitlePt ?? "");
  const [brandJoinTitleEn, setBrandJoinTitleEn] = useState(store.brandJoinTitleEn ?? "");
  const [brandJoinTitleEs, setBrandJoinTitleEs] = useState(store.brandJoinTitleEs ?? "");
  const [brandJoinTextPt, setBrandJoinTextPt] = useState(store.brandJoinTextPt ?? "");
  const [brandJoinTextEn, setBrandJoinTextEn] = useState(store.brandJoinTextEn ?? "");
  const [brandJoinTextEs, setBrandJoinTextEs] = useState(store.brandJoinTextEs ?? "");
  const [brandJoinCtaLabel, setBrandJoinCtaLabel] = useState(store.brandJoinCtaLabel ?? "");
  const [brandJoinCtaUrl, setBrandJoinCtaUrl] = useState(store.brandJoinCtaUrl ?? "");
  const [brandAboutTitlePt, setBrandAboutTitlePt] = useState(store.brandAboutTitlePt ?? "");
  const [brandAboutTitleEn, setBrandAboutTitleEn] = useState(store.brandAboutTitleEn ?? "");
  const [brandAboutTitleEs, setBrandAboutTitleEs] = useState(store.brandAboutTitleEs ?? "");
  const [brandAboutVisible, setBrandAboutVisible] = useState(store.brandAboutVisible);
  const [brandCauseVisible, setBrandCauseVisible] = useState(store.brandCauseVisible);
  const [brandJoinVisible, setBrandJoinVisible] = useState(store.brandJoinVisible);
  const [causeTitlePt, setCauseTitlePt] = useState(store.causeTitlePt ?? "");
  const [causeTitleEn, setCauseTitleEn] = useState(store.causeTitleEn ?? "");
  const [causeTitleEs, setCauseTitleEs] = useState(store.causeTitleEs ?? "");
  const [causeTextPt, setCauseTextPt] = useState(store.causeTextPt ?? "");
  const [causeTextEn, setCauseTextEn] = useState(store.causeTextEn ?? "");
  const [causeTextEs, setCauseTextEs] = useState(store.causeTextEs ?? "");
  const [causeDonationPix, setCauseDonationPix] = useState(store.causeDonationPix ?? "");
  const [causePaypalUrl, setCausePaypalUrl] = useState(store.causePaypalUrl ?? "");
  const [aboutTab, setAboutTab] = useState(store.defaultLocale);
  const [causeTab, setCauseTab] = useState(store.defaultLocale);
  const [joinTab, setJoinTab] = useState(store.defaultLocale);

  // ── Horários state
  const initBh = store.businessHours as BusinessHoursConfig | null;
  const [bhEnabled, setBhEnabled] = useState(initBh?.enabled ?? false);
  const [bhTimezone, setBhTimezone] = useState(initBh?.timezone ?? "America/Sao_Paulo");
  const [bhDays, setBhDays] = useState<DayHours[]>(initBh?.days ?? DEFAULT_DAYS);

  function updateDay(idx: number, patch: Partial<DayHours>) {
    setBhDays(prev => prev.map((d, i) => i === idx ? { ...d, ...patch } : d));
  }

  // ── UI state
  const [activeTab, setActiveTab] = useState<"loja" | "marca">("loja");
  const [saving, setSaving] = useState(false);
  const [translating, setTranslating] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [showMobilePreview, setShowMobilePreview] = useState(false);

  function getByLang(lang: string, pt: string, en: string, es: string) {
    return lang === "pt" ? pt : lang === "en" ? en : es;
  }

  async function handleTranslate(
    sectionKey: string,
    targetLang: string,
    sourceFields: { name?: string | null; description?: string | null },
    applyResult: (name: string | null, description: string | null) => void,
  ) {
    if (!sourceFields.name && !sourceFields.description) {
      setError(`Preencha os campos em ${LANGS[defaultLocale]} antes de traduzir.`);
      return;
    }
    setTranslating(`${sectionKey}-${targetLang}`);
    setError("");
    try {
      const res = await fetch("/api/admin/translate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          storeId: store.id, sourceLang: defaultLocale, targetLang,
          fields: { name: sourceFields.name || null, description: sourceFields.description || null },
        }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error ?? "Erro ao traduzir."); return; }
      applyResult(data.name ?? null, data.description ?? null);
    } catch {
      setError("Erro de conexão ao traduzir.");
    } finally {
      setTranslating(null);
    }
  }

  function translateBtn(sectionKey: string, targetLang: string, onTranslate: () => void) {
    const isLoading = translating === `${sectionKey}-${targetLang}`;
    if (isPaidPlan) {
      return (
        <button type="button" onClick={onTranslate} disabled={!!translating}
          className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium w-full justify-center transition-all mb-2"
          style={{ background: "var(--cream-dark)", color: "var(--text-dark)" }}
        >
          {isLoading
            ? <><Loader2 size={12} className="animate-spin" /> Traduzindo...</>
            : <><Sparkles size={12} style={{ color: "var(--orange)" }} /> Traduzir do {LANGS[defaultLocale]} com IA</>}
        </button>
      );
    }
    return (
      <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs w-full justify-center border border-dashed mb-2"
        style={{ borderColor: "var(--cream-dark)", color: "var(--text-muted)" }}>
        <Sparkles size={12} /> Tradução com IA — planos pagos
      </div>
    );
  }

  // ── Logo upload (done at save time)
  function handleLogoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setLogoFile(file);
    setLogoPreview(URL.createObjectURL(file));
    e.target.value = "";
  }

  async function uploadFile(file: File): Promise<string> {
    const form = new FormData();
    form.append("file", file);
    form.append("storeId", store.id);
    const res = await fetch("/api/admin/upload", { method: "POST", body: form });
    if (!res.ok) throw new Error("Erro no upload");
    return (await res.json()).url as string;
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setError(""); setSuccess(false); setSaving(true);
    try {
      let finalLogo = logoUrl;
      if (logoFile) { finalLogo = await uploadFile(logoFile); setLogoUrl(finalLogo); setLogoFile(null); setLogoPreview(""); }

      let finalHero = brandHeroImageUrl;
      if (heroFile) { finalHero = await uploadFile(heroFile); setBrandHeroImageUrl(finalHero); setHeroFile(null); setHeroPreview(""); }

      let finalAbout = brandAboutImageUrl;
      if (aboutFile) { finalAbout = await uploadFile(aboutFile); setBrandAboutImageUrl(finalAbout); setAboutFile(null); setAboutPreview(""); }

      const res = await fetch(`/api/admin/stores/${store.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          namePt, nameEn, nameEs, sloganPt, sloganEn, sloganEs, slug,
          logoUrl: finalLogo, primaryColor, accentColor, defaultLocale,
          causeTitlePt, causeTitleEn, causeTitleEs,
          causeTextPt, causeTextEn, causeTextEs,
          causeDonationPix, causePaypalUrl,
          brandHeroImageUrl: finalHero, brandAboutImageUrl: finalAbout,
          brandAboutTextPt, brandAboutTextEn, brandAboutTextEs,
          brandJoinTitlePt, brandJoinTitleEn, brandJoinTitleEs,
          brandJoinTextPt, brandJoinTextEn, brandJoinTextEs,
          brandJoinCtaLabel, brandJoinCtaUrl,
          brandAboutTitlePt, brandAboutTitleEn, brandAboutTitleEs,
          brandAboutVisible, brandCauseVisible, brandJoinVisible,
          businessHours: { enabled: bhEnabled, timezone: bhTimezone, days: bhDays },
        }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error ?? "Erro ao salvar"); return; }
      setSlug(data.slug);
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
      router.refresh();
    } catch { setError("Erro inesperado. Tente novamente."); }
    finally { setSaving(false); }
  }

  // ── Preview data (live)
  const previewStore: BrandStore = {
    namePt, nameEn: nameEn || null, nameEs: nameEs || null,
    sloganPt: sloganPt || null, sloganEn: sloganEn || null, sloganEs: sloganEs || null,
    logoUrl: logoPreview || logoUrl || null, slug,
    brandHeroImageUrl: heroPreview || brandHeroImageUrl || null,
    brandAboutImageUrl: aboutPreview || brandAboutImageUrl || null,
    brandAboutTextPt: brandAboutTextPt || null, brandAboutTextEn: brandAboutTextEn || null, brandAboutTextEs: brandAboutTextEs || null,
    brandJoinTitlePt: brandJoinTitlePt || null, brandJoinTitleEn: brandJoinTitleEn || null, brandJoinTitleEs: brandJoinTitleEs || null,
    brandJoinTextPt: brandJoinTextPt || null, brandJoinTextEn: brandJoinTextEn || null, brandJoinTextEs: brandJoinTextEs || null,
    brandJoinCtaLabel: brandJoinCtaLabel || null, brandJoinCtaUrl: brandJoinCtaUrl || null,
    brandAboutTitlePt: brandAboutTitlePt || null, brandAboutTitleEn: brandAboutTitleEn || null, brandAboutTitleEs: brandAboutTitleEs || null,
    brandAboutVisible, brandCauseVisible, brandJoinVisible,
    causeTitlePt: causeTitlePt || null, causeTitleEn: causeTitleEn || null, causeTitleEs: causeTitleEs || null,
    causeTextPt: causeTextPt || null, causeTextEn: causeTextEn || null, causeTextEs: causeTextEs || null,
    causeDonationPix: causeDonationPix || null, causePaypalUrl: causePaypalUrl || null,
  };

  const displayLogo = logoPreview || logoUrl;

  return (
    <form onSubmit={handleSave} className="flex flex-col h-full">
      {/* ── Tab navigation ── */}
      <div className="px-4 pt-5 pb-0 flex-shrink-0">
        <h1 className="text-xl font-bold mb-4" style={{ color: "var(--brown-dark)" }}>Configurações</h1>
        <div className="flex gap-1 border-b" style={{ borderColor: "var(--cream-dark)" }}>
          {(["loja", "marca"] as const).map((tab) => (
            <button
              key={tab} type="button" onClick={() => setActiveTab(tab)}
              className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${activeTab === tab ? "border-orange-500 text-orange-600" : "border-transparent text-gray-500 hover:text-gray-700"}`}
            >
              {tab === "loja" ? "Configurações da loja" : "Sobre a marca"}
            </button>
          ))}
        </div>
      </div>

      {/* ── Loja tab ── */}
      {activeTab === "loja" && (
        <div className="flex-1 overflow-y-auto px-4 py-5 space-y-5">
          {/* Logo */}
          <Section title="Logo">
            <input ref={logoRef} type="file" accept="image/*" className="hidden" onChange={handleLogoChange} />
            <div className="flex items-center gap-4">
              <div
                className="w-20 h-20 rounded-2xl border flex items-center justify-center overflow-hidden flex-shrink-0 cursor-pointer"
                style={{ borderColor: "var(--cream-dark)", background: "var(--cream)" }}
                onClick={() => logoRef.current?.click()}
              >
                {displayLogo
                  // eslint-disable-next-line @next/next/no-img-element
                  ? <img src={displayLogo} alt="Logo" className="w-full h-full object-contain" />
                  : <Camera size={24} style={{ color: "var(--text-muted)" }} className="opacity-40" />}
              </div>
              <div className="flex flex-col gap-2">
                <button type="button" onClick={() => logoRef.current?.click()}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-xl border text-xs font-medium transition-colors hover:bg-gray-50"
                  style={{ borderColor: "var(--cream-dark)", color: "var(--text-muted)" }}
                ><Upload size={13} /> {displayLogo ? "Trocar logo" : "Enviar logo"}</button>
                {displayLogo && (
                  <button type="button" onClick={() => { setLogoUrl(""); setLogoFile(null); setLogoPreview(""); }}
                    className="flex items-center gap-1.5 px-3 py-2 rounded-xl border text-xs font-medium transition-colors hover:bg-red-50 hover:text-red-500"
                    style={{ borderColor: "var(--cream-dark)", color: "var(--text-muted)" }}
                  ><X size={13} /> Remover</button>
                )}
              </div>
            </div>
          </Section>

          {/* Identidade */}
          <Section title="Identidade">
            <div>
              <label className="block text-xs font-medium mb-1.5" style={{ color: "var(--text-muted)" }}>
                Nome da loja
                <span className="ml-1.5 font-normal opacity-60">· replica automaticamente nas outras línguas</span>
              </label>
              <LangTabs value={nameTab} onChange={setNameTab} />
              {nameTab === "pt" && <input className={inp} style={inpStyle} value={namePt}
                onChange={(e) => {
                  const v = e.target.value;
                  setNamePt(v);
                  if ("pt" === defaultLocale) {
                    if (nameEn === namePt || !nameEn) setNameEn(v);
                    if (nameEs === namePt || !nameEs) setNameEs(v);
                  }
                }} placeholder="Nome em português *" required={defaultLocale === "pt"} />}
              {nameTab === "en" && <input className={inp} style={inpStyle} value={nameEn}
                onChange={(e) => {
                  const v = e.target.value;
                  setNameEn(v);
                  if ("en" === defaultLocale) {
                    if (namePt === nameEn || !namePt) setNamePt(v);
                    if (nameEs === nameEn || !nameEs) setNameEs(v);
                  }
                }} placeholder="Name in English" required={defaultLocale === "en"} />}
              {nameTab === "es" && <input className={inp} style={inpStyle} value={nameEs}
                onChange={(e) => {
                  const v = e.target.value;
                  setNameEs(v);
                  if ("es" === defaultLocale) {
                    if (namePt === nameEs || !namePt) setNamePt(v);
                    if (nameEn === nameEs || !nameEn) setNameEn(v);
                  }
                }} placeholder="Nombre en español" required={defaultLocale === "es"} />}
            </div>
            <div>
              <label className="block text-xs font-medium mb-1.5" style={{ color: "var(--text-muted)" }}>Slogan</label>
              <LangTabs value={sloganTab} onChange={setSloganTab} />
              {sloganTab !== defaultLocale && translateBtn("slogan", sloganTab, () =>
                handleTranslate("slogan", sloganTab,
                  { name: getByLang(defaultLocale, sloganPt, sloganEn, sloganEs) },
                  (name) => {
                    if (!name) return;
                    if (sloganTab === "pt") setSloganPt(name);
                    else if (sloganTab === "en") setSloganEn(name);
                    else setSloganEs(name);
                  }
                )
              )}
              {sloganTab === "pt" && <input className={inp} style={inpStyle} value={sloganPt} onChange={(e) => setSloganPt(e.target.value)} placeholder="Slogan em português" />}
              {sloganTab === "en" && <input className={inp} style={inpStyle} value={sloganEn} onChange={(e) => setSloganEn(e.target.value)} placeholder="Slogan in English" />}
              {sloganTab === "es" && <input className={inp} style={inpStyle} value={sloganEs} onChange={(e) => setSloganEs(e.target.value)} placeholder="Slogan en español" />}
            </div>
            <Field label="Slug (URL da loja)">
              <div className="flex items-center">
                <span className="text-xs px-2 py-2 rounded-l-xl border border-r-0 bg-gray-50 text-gray-400" style={{ borderColor: "var(--cream-dark)" }}>/</span>
                <input
                  className="flex-1 px-3 py-2 rounded-r-xl border text-sm outline-none focus:ring-2 focus:ring-orange-200"
                  style={{ borderColor: "var(--cream-dark)", background: "var(--cream)" }}
                  value={slug} onChange={(e) => setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ""))}
                  placeholder="minha-cafeteria"
                />
              </div>
            </Field>
          </Section>

          {/* Aparência */}
          <Section title="Aparência">
            <Field label="Idioma padrão do cardápio">
              <select className={inp} style={inpStyle} value={defaultLocale} onChange={(e) => setDefaultLocale(e.target.value)}>
                <option value="pt">Português 🇧🇷</option>
                <option value="en">English 🇺🇸</option>
                <option value="es">Español 🇪🇸</option>
              </select>
            </Field>
            <div className="flex gap-4">
              <Field label="Cor primária">
                <div className="flex items-center gap-2">
                  <input type="color" value={primaryColor} onChange={(e) => setPrimaryColor(e.target.value)}
                    className="w-10 h-10 rounded-lg border cursor-pointer" style={{ borderColor: "var(--cream-dark)" }} />
                  <input className={inp} style={inpStyle} value={primaryColor} onChange={(e) => setPrimaryColor(e.target.value)} maxLength={7} />
                </div>
              </Field>
              <Field label="Cor de destaque">
                <div className="flex items-center gap-2">
                  <input type="color" value={accentColor} onChange={(e) => setAccentColor(e.target.value)}
                    className="w-10 h-10 rounded-lg border cursor-pointer" style={{ borderColor: "var(--cream-dark)" }} />
                  <input className={inp} style={inpStyle} value={accentColor} onChange={(e) => setAccentColor(e.target.value)} maxLength={7} />
                </div>
              </Field>
            </div>
          </Section>

          {/* Horários de funcionamento */}
          <Section title="Horários de funcionamento" icon={<Clock size={14} style={{ color: "var(--orange)" }} />}>
            <div className="flex items-center justify-between">
              <span className="text-xs" style={{ color: "var(--text-muted)" }}>
                Bloquear pedidos fora do horário
              </span>
              <button
                type="button"
                onClick={() => setBhEnabled(v => !v)}
                className={`relative w-10 h-5 rounded-full transition-colors ${bhEnabled ? "bg-orange-500" : "bg-gray-200"}`}
              >
                <span className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform ${bhEnabled ? "translate-x-[18px]" : "translate-x-0"}`} />
              </button>
            </div>
            {bhEnabled && (
              <div className="space-y-2 pt-1">
                <div className="space-y-1">
                  {bhDays.map((d, i) => (
                    <div key={d.day} className="flex items-center gap-2">
                      <span className="text-xs font-medium w-7 flex-shrink-0" style={{ color: "var(--text-muted)" }}>{DAY_NAMES[d.day]}</span>
                      <button
                        type="button"
                        onClick={() => updateDay(i, { closed: !d.closed })}
                        className={`text-xs px-2 py-1 rounded-lg flex-shrink-0 transition-colors ${d.closed ? "bg-gray-100 text-gray-400" : "text-white"}`}
                        style={d.closed ? {} : { background: "var(--orange)" }}
                      >
                        {d.closed ? "Fechado" : "Aberto"}
                      </button>
                      {!d.closed && (
                        <>
                          <input
                            type="time" value={d.open}
                            onChange={e => updateDay(i, { open: e.target.value })}
                            className="text-xs px-2 py-1 rounded-lg border flex-1 min-w-0 outline-none focus:ring-1 focus:ring-orange-200"
                            style={{ borderColor: "var(--cream-dark)", background: "var(--cream)" }}
                          />
                          <span className="text-xs" style={{ color: "var(--text-muted)" }}>às</span>
                          <input
                            type="time" value={d.close}
                            onChange={e => updateDay(i, { close: e.target.value })}
                            className="text-xs px-2 py-1 rounded-lg border flex-1 min-w-0 outline-none focus:ring-1 focus:ring-orange-200"
                            style={{ borderColor: "var(--cream-dark)", background: "var(--cream)" }}
                          />
                        </>
                      )}
                    </div>
                  ))}
                </div>
                <Field label="Fuso horário">
                  <select
                    className={inp} style={inpStyle}
                    value={bhTimezone} onChange={e => setBhTimezone(e.target.value)}
                  >
                    <option value="America/Sao_Paulo">Brasília (GMT-3)</option>
                    <option value="America/Manaus">Manaus (GMT-4)</option>
                    <option value="America/Belem">Belém (GMT-3)</option>
                    <option value="America/Fortaleza">Fortaleza (GMT-3)</option>
                    <option value="America/Noronha">Fernando de Noronha (GMT-2)</option>
                    <option value="America/Porto_Velho">Porto Velho (GMT-4)</option>
                    <option value="America/Rio_Branco">Rio Branco (GMT-5)</option>
                  </select>
                </Field>
              </div>
            )}
          </Section>

          {/* Feedback + save */}
          {error && <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-xl px-4 py-3">{error}</p>}
          {success && <p className="text-sm text-green-700 bg-green-50 border border-green-200 rounded-xl px-4 py-3">Configurações salvas!</p>}
          <button type="submit" disabled={saving}
            className="w-full flex items-center justify-center gap-2 py-3 rounded-2xl text-sm font-semibold text-white transition-opacity disabled:opacity-60"
            style={{ background: "var(--orange)" }}
          >
            {saving ? <><Loader2 size={16} className="animate-spin" /> Salvando…</> : <><Save size={16} /> Salvar configurações</>}
          </button>
        </div>
      )}

      {/* ── Mobile preview overlay ── */}
      {showMobilePreview && (
        <div className="fixed inset-0 z-50 flex flex-col md:hidden" style={{ background: "var(--cream)" }}>
          <div className="sticky top-0 z-10 flex items-center justify-between px-4 py-3 border-b" style={{ background: "var(--cream-dark)", borderColor: "var(--cream-dark)" }}>
            <div className="flex items-center gap-2 text-xs font-semibold" style={{ color: "var(--text-muted)" }}>
              <span className="w-2 h-2 rounded-full bg-green-400 inline-block" /> Preview — página pública
            </div>
            <button
              type="button"
              onClick={() => setShowMobilePreview(false)}
              className="flex items-center justify-center w-8 h-8 rounded-full transition-colors hover:bg-black/10"
              style={{ color: "var(--text-muted)" }}
              aria-label="Fechar preview"
            >
              <X size={18} />
            </button>
          </div>
          <div className="flex-1 overflow-y-auto">
            <BrandPageContent store={previewStore} locale="pt" isPreview />
          </div>
        </div>
      )}

      {/* ── Marca tab ── */}
      {activeTab === "marca" && (
        <div className="flex-1 overflow-hidden flex flex-col md:flex-row gap-0 min-h-0">
          {/* Form panel */}
          <div className="w-full md:w-[380px] flex-1 md:flex-none min-h-0 overflow-y-auto px-4 py-5 space-y-5 border-r" style={{ borderColor: "var(--cream-dark)" }}>
            {/* Hero image */}
            <Section title="Imagem de capa">
              <p className="text-xs" style={{ color: "var(--text-muted)" }}>Aparece como fundo da seção principal. Após selecionar, ajuste o enquadramento.</p>
              <ImagePicker
                aspect={16 / 9}
                currentUrl={heroPreview || brandHeroImageUrl}
                onFileReady={(f) => { setHeroFile(f); setHeroPreview(URL.createObjectURL(f)); }}
                onClear={() => { setHeroFile(null); setHeroPreview(""); setBrandHeroImageUrl(""); }}
              />
              {heroFile && <p className="text-xs" style={{ color: "var(--orange)" }}>Imagem selecionada — será enviada ao salvar</p>}
            </Section>

            {/* Sobre / História */}
            <Section
              title="Nossa história"
              visible={brandAboutVisible}
              onToggleVisible={() => setBrandAboutVisible((v) => !v)}
            >
              <div>
                <label className="block text-xs font-medium mb-1.5" style={{ color: "var(--text-muted)" }}>Título da seção</label>
                <LangTabs value={aboutTab} onChange={setAboutTab} />
                {aboutTab !== defaultLocale && translateBtn("about", aboutTab, () =>
                  handleTranslate("about", aboutTab,
                    {
                      name: getByLang(defaultLocale, brandAboutTitlePt, brandAboutTitleEn, brandAboutTitleEs),
                      description: getByLang(defaultLocale, brandAboutTextPt, brandAboutTextEn, brandAboutTextEs),
                    },
                    (name, description) => {
                      if (name) {
                        if (aboutTab === "pt") setBrandAboutTitlePt(name);
                        else if (aboutTab === "en") setBrandAboutTitleEn(name);
                        else setBrandAboutTitleEs(name);
                      }
                      if (description) {
                        if (aboutTab === "pt") setBrandAboutTextPt(description);
                        else if (aboutTab === "en") setBrandAboutTextEn(description);
                        else setBrandAboutTextEs(description);
                      }
                    }
                  )
                )}
                {aboutTab === "pt" && <input className={inp} style={inpStyle} value={brandAboutTitlePt} onChange={(e) => setBrandAboutTitlePt(e.target.value)} placeholder="Nossa história" />}
                {aboutTab === "en" && <input className={inp} style={inpStyle} value={brandAboutTitleEn} onChange={(e) => setBrandAboutTitleEn(e.target.value)} placeholder="Our story" />}
                {aboutTab === "es" && <input className={inp} style={inpStyle} value={brandAboutTitleEs} onChange={(e) => setBrandAboutTitleEs(e.target.value)} placeholder="Nuestra historia" />}
              </div>
              <ImagePicker
                aspect={4 / 3}
                currentUrl={aboutPreview || brandAboutImageUrl}
                onFileReady={(f) => { setAboutFile(f); setAboutPreview(URL.createObjectURL(f)); }}
                onClear={() => { setAboutFile(null); setAboutPreview(""); setBrandAboutImageUrl(""); }}
              />
              {aboutFile && <p className="text-xs" style={{ color: "var(--orange)" }}>Imagem selecionada — será enviada ao salvar</p>}
              <div>
                <label className="block text-xs font-medium mb-1.5" style={{ color: "var(--text-muted)" }}>Texto</label>
                {aboutTab === "pt" && <textarea className={inp} style={inpStyle} rows={5} value={brandAboutTextPt} onChange={(e) => setBrandAboutTextPt(e.target.value)} placeholder="Conte a história da loja (PT)…" />}
                {aboutTab === "en" && <textarea className={inp} style={inpStyle} rows={5} value={brandAboutTextEn} onChange={(e) => setBrandAboutTextEn(e.target.value)} placeholder="Tell the store story (EN)…" />}
                {aboutTab === "es" && <textarea className={inp} style={inpStyle} rows={5} value={brandAboutTextEs} onChange={(e) => setBrandAboutTextEs(e.target.value)} placeholder="Cuente la historia de la tienda (ES)…" />}
              </div>
            </Section>

            {/* Causa */}
            <Section
              title="Nossa causa" icon={<Heart size={14} style={{ color: "var(--orange)" }} />}
              visible={brandCauseVisible}
              onToggleVisible={() => setBrandCauseVisible((v) => !v)}
            >
              <div>
                <label className="block text-xs font-medium mb-1.5" style={{ color: "var(--text-muted)" }}>Título e texto</label>
                <LangTabs value={causeTab} onChange={setCauseTab} />
                {causeTab !== defaultLocale && translateBtn("cause", causeTab, () =>
                  handleTranslate("cause", causeTab,
                    {
                      name: getByLang(defaultLocale, causeTitlePt, causeTitleEn, causeTitleEs),
                      description: getByLang(defaultLocale, causeTextPt, causeTextEn, causeTextEs),
                    },
                    (name, description) => {
                      if (name) {
                        if (causeTab === "pt") setCauseTitlePt(name);
                        else if (causeTab === "en") setCauseTitleEn(name);
                        else setCauseTitleEs(name);
                      }
                      if (description) {
                        if (causeTab === "pt") setCauseTextPt(description);
                        else if (causeTab === "en") setCauseTextEn(description);
                        else setCauseTextEs(description);
                      }
                    }
                  )
                )}
                {causeTab === "pt" && (
                  <div className="space-y-2">
                    <input className={inp} style={inpStyle} value={causeTitlePt} onChange={(e) => setCauseTitlePt(e.target.value)} placeholder="Título da causa (PT)" />
                    <textarea className={inp} style={inpStyle} rows={3} value={causeTextPt} onChange={(e) => setCauseTextPt(e.target.value)} placeholder="Descrição (PT)" />
                  </div>
                )}
                {causeTab === "en" && (
                  <div className="space-y-2">
                    <input className={inp} style={inpStyle} value={causeTitleEn} onChange={(e) => setCauseTitleEn(e.target.value)} placeholder="Cause title (EN)" />
                    <textarea className={inp} style={inpStyle} rows={3} value={causeTextEn} onChange={(e) => setCauseTextEn(e.target.value)} placeholder="Description (EN)" />
                  </div>
                )}
                {causeTab === "es" && (
                  <div className="space-y-2">
                    <input className={inp} style={inpStyle} value={causeTitleEs} onChange={(e) => setCauseTitleEs(e.target.value)} placeholder="Título de la causa (ES)" />
                    <textarea className={inp} style={inpStyle} rows={3} value={causeTextEs} onChange={(e) => setCauseTextEs(e.target.value)} placeholder="Descripción (ES)" />
                  </div>
                )}
              </div>
              <Field label="Chave PIX para doação">
                <input className={inp} style={inpStyle} value={causeDonationPix} onChange={(e) => setCauseDonationPix(e.target.value)} placeholder="email@exemplo.com ou CPF/CNPJ" />
              </Field>
              <Field label="Link PayPal (opcional)">
                <input className={inp} style={inpStyle} value={causePaypalUrl} onChange={(e) => setCausePaypalUrl(e.target.value)} placeholder="https://paypal.me/…" type="url" />
              </Field>
            </Section>

            {/* Faça parte */}
            <Section
              title="Faça parte" icon={<Users size={14} style={{ color: "var(--orange)" }} />}
              visible={brandJoinVisible}
              onToggleVisible={() => setBrandJoinVisible((v) => !v)}
            >
              <div>
                <label className="block text-xs font-medium mb-1.5" style={{ color: "var(--text-muted)" }}>Título e texto</label>
                <LangTabs value={joinTab} onChange={setJoinTab} />
                {joinTab !== defaultLocale && translateBtn("join", joinTab, () =>
                  handleTranslate("join", joinTab,
                    {
                      name: getByLang(defaultLocale, brandJoinTitlePt, brandJoinTitleEn, brandJoinTitleEs),
                      description: getByLang(defaultLocale, brandJoinTextPt, brandJoinTextEn, brandJoinTextEs),
                    },
                    (name, description) => {
                      if (name) {
                        if (joinTab === "pt") setBrandJoinTitlePt(name);
                        else if (joinTab === "en") setBrandJoinTitleEn(name);
                        else setBrandJoinTitleEs(name);
                      }
                      if (description) {
                        if (joinTab === "pt") setBrandJoinTextPt(description);
                        else if (joinTab === "en") setBrandJoinTextEn(description);
                        else setBrandJoinTextEs(description);
                      }
                    }
                  )
                )}
                {joinTab === "pt" && (
                  <div className="space-y-2">
                    <input className={inp} style={inpStyle} value={brandJoinTitlePt} onChange={(e) => setBrandJoinTitlePt(e.target.value)} placeholder="Ex: Faça parte da nossa comunidade" />
                    <textarea className={inp} style={inpStyle} rows={3} value={brandJoinTextPt} onChange={(e) => setBrandJoinTextPt(e.target.value)} placeholder="Convide as pessoas a participar (PT)…" />
                  </div>
                )}
                {joinTab === "en" && (
                  <div className="space-y-2">
                    <input className={inp} style={inpStyle} value={brandJoinTitleEn} onChange={(e) => setBrandJoinTitleEn(e.target.value)} placeholder="Ex: Join our community" />
                    <textarea className={inp} style={inpStyle} rows={3} value={brandJoinTextEn} onChange={(e) => setBrandJoinTextEn(e.target.value)} placeholder="Invite people to join (EN)…" />
                  </div>
                )}
                {joinTab === "es" && (
                  <div className="space-y-2">
                    <input className={inp} style={inpStyle} value={brandJoinTitleEs} onChange={(e) => setBrandJoinTitleEs(e.target.value)} placeholder="Ex: Únete a nuestra comunidad" />
                    <textarea className={inp} style={inpStyle} rows={3} value={brandJoinTextEs} onChange={(e) => setBrandJoinTextEs(e.target.value)} placeholder="Invita a la gente a unirse (ES)…" />
                  </div>
                )}
              </div>
              <Field label="Texto do botão (CTA)">
                <input className={inp} style={inpStyle} value={brandJoinCtaLabel} onChange={(e) => setBrandJoinCtaLabel(e.target.value)} placeholder="Ex: Entrar no grupo do WhatsApp" />
              </Field>
              <Field label="Link do botão">
                <input className={inp} style={inpStyle} value={brandJoinCtaUrl} onChange={(e) => setBrandJoinCtaUrl(e.target.value)} placeholder="https://wa.me/… ou qualquer URL" type="url" />
              </Field>
            </Section>

            {error && <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-xl px-4 py-3">{error}</p>}
            {success && <p className="text-sm text-green-700 bg-green-50 border border-green-200 rounded-xl px-4 py-3">Configurações salvas!</p>}
            <button
              type="button"
              onClick={() => setShowMobilePreview(true)}
              className="md:hidden w-full flex items-center justify-center gap-2 py-3 rounded-2xl text-sm font-semibold border transition-colors hover:bg-cream-dark"
              style={{ borderColor: "var(--orange)", color: "var(--orange)" }}
            >
              <MonitorSmartphone size={16} /> Ver preview da página
            </button>
            <button type="submit" disabled={saving}
              className="w-full flex items-center justify-center gap-2 py-3 rounded-2xl text-sm font-semibold text-white transition-opacity disabled:opacity-60"
              style={{ background: "var(--orange)" }}
            >
              {saving ? <><Loader2 size={16} className="animate-spin" /> Salvando…</> : <><Save size={16} /> Salvar</>}
            </button>
          </div>

          {/* Preview panel */}
          <div className="flex-1 overflow-y-auto hidden md:block" style={{ background: "var(--cream-dark)" }}>
            <div className="sticky top-0 z-10 px-4 py-2 text-xs font-semibold border-b flex items-center gap-2"
              style={{ background: "var(--cream-dark)", borderColor: "var(--cream-dark)", color: "var(--text-muted)" }}>
              <span className="w-2 h-2 rounded-full bg-green-400 inline-block" /> Preview — página pública
            </div>
            <div className="overflow-hidden rounded-b-none">
              <BrandPageContent store={previewStore} locale="pt" isPreview />
            </div>
          </div>
        </div>
      )}
    </form>
  );
}
