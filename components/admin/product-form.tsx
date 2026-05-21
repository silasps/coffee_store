"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Save, Sparkles, Loader2 } from "lucide-react";

type Category = { id: string; namePt: string };

type Product = {
  id: string;
  namePt: string;
  nameEn: string | null;
  nameEs: string | null;
  categoryId: string;
  descriptionPt: string | null;
  descriptionEn: string | null;
  descriptionEs: string | null;
  highlightPt: string | null;
  highlightEn: string | null;
  highlightEs: string | null;
  imageUrl: string | null;
  basePrice: number | null;
  isAvailable: boolean;
  sortOrder: number;
  tags: string[];
};

type Props = {
  storeId: string;
  locale: string;
  defaultLocale: string;
  categories: Category[];
  product?: Product;
};

const TAG_OPTIONS = [
  { value: "POPULAR", label: "Popular" },
  { value: "SUGGESTED", label: "Sugestão" },
  { value: "NEW", label: "Novidade" },
  { value: "COMBO", label: "Combo" },
  { value: "FEATURED", label: "Destaque" },
];

const LANG_LABELS: Record<string, string> = { pt: "PT 🇧🇷", en: "EN 🇺🇸", es: "ES 🇪🇸" };
const ALL_LANGS = ["pt", "en", "es"];

function orderedLangs(primary: string) {
  return [primary, ...ALL_LANGS.filter((l) => l !== primary)];
}

export function ProductForm({ storeId, locale, defaultLocale, categories, product }: Props) {
  const router = useRouter();
  const isEdit = !!product;
  const langs = orderedLangs(defaultLocale);
  const [activeTab, setActiveTab] = useState(defaultLocale);

  // Translatable fields
  const [namePt, setNamePt] = useState(product?.namePt ?? "");
  const [nameEn, setNameEn] = useState(product?.nameEn ?? "");
  const [nameEs, setNameEs] = useState(product?.nameEs ?? "");
  const [descriptionPt, setDescriptionPt] = useState(product?.descriptionPt ?? "");
  const [descriptionEn, setDescriptionEn] = useState(product?.descriptionEn ?? "");
  const [descriptionEs, setDescriptionEs] = useState(product?.descriptionEs ?? "");
  const [highlightPt, setHighlightPt] = useState(product?.highlightPt ?? "");
  const [highlightEn, setHighlightEn] = useState(product?.highlightEn ?? "");
  const [highlightEs, setHighlightEs] = useState(product?.highlightEs ?? "");

  // Non-translatable fields
  const [categoryId, setCategoryId] = useState(product?.categoryId ?? categories[0]?.id ?? "");
  const [imageUrl, setImageUrl] = useState(product?.imageUrl ?? "");
  const [basePrice, setBasePrice] = useState(product?.basePrice != null ? String(product.basePrice) : "");
  const [isAvailable, setIsAvailable] = useState(product?.isAvailable ?? true);
  const [sortOrder, setSortOrder] = useState(String(product?.sortOrder ?? 0));
  const [tags, setTags] = useState<string[]>(product?.tags ?? []);

  const [saving, setSaving] = useState(false);
  const [translating, setTranslating] = useState<string | null>(null); // lang being translated
  const [error, setError] = useState("");

  function toggleTag(tag: string) {
    setTags((prev) => prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]);
  }

  function getField(lang: string, field: "name" | "description" | "highlight") {
    if (lang === "pt") return { name: namePt, description: descriptionPt, highlight: highlightPt }[field];
    if (lang === "en") return { name: nameEn, description: descriptionEn, highlight: highlightEn }[field];
    return { name: nameEs, description: descriptionEs, highlight: highlightEs }[field];
  }

  function setField(lang: string, field: "name" | "description" | "highlight", value: string) {
    if (lang === "pt") {
      if (field === "name") setNamePt(value);
      else if (field === "description") setDescriptionPt(value);
      else setHighlightPt(value);
    } else if (lang === "en") {
      if (field === "name") setNameEn(value);
      else if (field === "description") setDescriptionEn(value);
      else setHighlightEn(value);
    } else {
      if (field === "name") setNameEs(value);
      else if (field === "description") setDescriptionEs(value);
      else setHighlightEs(value);
    }
  }

  async function handleTranslate(targetLang: string) {
    const primaryName = getField(defaultLocale, "name");
    const primaryDesc = getField(defaultLocale, "description");
    const primaryHighlight = getField(defaultLocale, "highlight");

    if (!primaryName && !primaryDesc && !primaryHighlight) {
      setError(`Preencha os campos no idioma principal (${LANG_LABELS[defaultLocale]}) antes de traduzir.`);
      return;
    }

    setTranslating(targetLang);
    setError("");

    try {
      const res = await fetch("/api/admin/translate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          storeId,
          sourceLang: defaultLocale,
          targetLang,
          fields: {
            name: primaryName || null,
            description: primaryDesc || null,
            highlight: primaryHighlight || null,
          },
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error ?? "Erro ao traduzir. Tente novamente.");
        return;
      }

      if (data.name) setField(targetLang, "name", data.name);
      if (data.description) setField(targetLang, "description", data.description);
      if (data.highlight) setField(targetLang, "highlight", data.highlight);
    } catch {
      setError("Erro de conexão ao traduzir. Tente novamente.");
    } finally {
      setTranslating(null);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const primaryName = getField(defaultLocale, "name");
    if (!primaryName.trim() || !categoryId) {
      setError("Nome e categoria são obrigatórios.");
      return;
    }

    setSaving(true);
    setError("");

    const payload = {
      storeId,
      categoryId,
      namePt: namePt.trim() || null,
      nameEn: nameEn.trim() || null,
      nameEs: nameEs.trim() || null,
      descriptionPt: descriptionPt.trim() || null,
      descriptionEn: descriptionEn.trim() || null,
      descriptionEs: descriptionEs.trim() || null,
      highlightPt: highlightPt.trim() || null,
      highlightEn: highlightEn.trim() || null,
      highlightEs: highlightEs.trim() || null,
      imageUrl: imageUrl.trim() || null,
      basePrice: basePrice !== "" ? parseFloat(basePrice) : null,
      isAvailable,
      sortOrder: parseInt(sortOrder) || 0,
      tags,
    };

    try {
      const res = await fetch(
        isEdit ? `/api/admin/products/${product.id}` : "/api/admin/products",
        {
          method: isEdit ? "PATCH" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        }
      );

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data.error ?? "Ocorreu um erro. Tente novamente.");
        return;
      }

      router.push(`/${locale}/painel/${storeId}/produtos`);
      router.refresh();
    } catch {
      setError("Ocorreu um erro. Tente novamente.");
    } finally {
      setSaving(false);
    }
  }

  const inputClass = "w-full px-3 py-2.5 text-sm rounded-xl border focus:outline-none focus:ring-2 focus:ring-orange-400/50";
  const inputStyle = { borderColor: "var(--cream-dark)", background: "white" };

  return (
    <div className="p-6 max-w-2xl">
      <div className="flex items-center gap-3 mb-6">
        <button
          type="button"
          onClick={() => router.back()}
          className="flex items-center gap-1.5 text-sm text-text-muted hover:text-text-dark transition-colors"
        >
          <ArrowLeft size={16} />
          Voltar
        </button>
        <h1 className="text-2xl font-bold text-text-dark">
          {isEdit ? "Editar Produto" : "Novo Produto"}
        </h1>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Non-translatable fields */}
        <div className="grid grid-cols-2 gap-4">
          <div className="col-span-2">
            <label className="block text-sm font-medium text-text-dark mb-1.5">
              Categoria <span className="text-red-500">*</span>
            </label>
            <select
              value={categoryId}
              onChange={(e) => setCategoryId(e.target.value)}
              className={inputClass}
              style={inputStyle}
              required
            >
              {categories.map((c) => (
                <option key={c.id} value={c.id}>{c.namePt}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-text-dark mb-1.5">Preço (R$)</label>
            <input
              type="number"
              min="0"
              step="0.01"
              value={basePrice}
              onChange={(e) => setBasePrice(e.target.value)}
              placeholder="Ex: 9.90"
              className={inputClass}
              style={inputStyle}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-text-dark mb-1.5">Ordem</label>
            <input
              type="number"
              min="0"
              value={sortOrder}
              onChange={(e) => setSortOrder(e.target.value)}
              className={inputClass}
              style={inputStyle}
            />
          </div>

          <div className="col-span-2">
            <label className="block text-sm font-medium text-text-dark mb-1.5">URL da Imagem</label>
            <input
              value={imageUrl}
              onChange={(e) => setImageUrl(e.target.value)}
              placeholder="https://..."
              className={inputClass}
              style={inputStyle}
            />
          </div>
        </div>

        {/* Tags */}
        <div>
          <label className="block text-sm font-medium text-text-dark mb-2">Tags</label>
          <div className="flex flex-wrap gap-2">
            {TAG_OPTIONS.map((t) => {
              const active = tags.includes(t.value);
              return (
                <button
                  key={t.value}
                  type="button"
                  onClick={() => toggleTag(t.value)}
                  className="px-3 py-1.5 rounded-full text-xs font-medium transition-all"
                  style={active
                    ? { background: "var(--orange)", color: "white" }
                    : { background: "white", color: "var(--text-muted)", border: "1px solid var(--cream-dark)" }
                  }
                >
                  {t.label}
                </button>
              );
            })}
          </div>
        </div>

        <div className="flex items-center gap-2">
          <input
            id="isAvailable"
            type="checkbox"
            checked={isAvailable}
            onChange={(e) => setIsAvailable(e.target.checked)}
            className="w-4 h-4 rounded"
          />
          <label htmlFor="isAvailable" className="text-sm font-medium text-text-dark cursor-pointer">
            Disponível
          </label>
        </div>

        {/* Translatable fields — tabs */}
        <div>
          <div className="text-sm font-semibold text-text-dark mb-3">Conteúdo</div>

          {/* Tab headers */}
          <div className="flex gap-1 mb-4 border-b" style={{ borderColor: "var(--cream-dark)" }}>
            {langs.map((lang) => (
              <button
                key={lang}
                type="button"
                onClick={() => setActiveTab(lang)}
                className="px-4 py-2 text-sm font-medium transition-all rounded-t-lg -mb-px"
                style={
                  activeTab === lang
                    ? { background: "white", borderColor: "var(--cream-dark)", borderWidth: "1px 1px 0", color: "var(--orange)" }
                    : { color: "var(--text-muted)" }
                }
              >
                {LANG_LABELS[lang]}
                {lang === defaultLocale && (
                  <span className="ml-1.5 text-xs px-1.5 py-0.5 rounded-full" style={{ background: "var(--orange)", color: "white" }}>
                    Principal
                  </span>
                )}
              </button>
            ))}
          </div>

          {/* Tab content */}
          {langs.map((lang) => (
            <div key={lang} className={lang !== activeTab ? "hidden" : "space-y-4"}>
              {/* AI translate button for non-primary tabs */}
              {lang !== defaultLocale && (
                <button
                  type="button"
                  onClick={() => handleTranslate(lang)}
                  disabled={translating === lang}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all w-full justify-center"
                  style={{ background: "var(--cream-dark)", color: "var(--text-dark)" }}
                >
                  {translating === lang ? (
                    <Loader2 size={15} className="animate-spin" />
                  ) : (
                    <Sparkles size={15} style={{ color: "var(--orange)" }} />
                  )}
                  {translating === lang
                    ? "Traduzindo..."
                    : `Traduzir do ${LANG_LABELS[defaultLocale]} com IA`}
                </button>
              )}

              <div>
                <label className="block text-sm font-medium text-text-dark mb-1.5">
                  Nome {lang === defaultLocale && <span className="text-red-500">*</span>}
                </label>
                <input
                  value={getField(lang, "name")}
                  onChange={(e) => setField(lang, "name", e.target.value)}
                  placeholder={lang === defaultLocale ? "Ex: Cappuccino Clássico" : ""}
                  className={inputClass}
                  style={inputStyle}
                  required={lang === defaultLocale}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-text-dark mb-1.5">Descrição</label>
                <textarea
                  value={getField(lang, "description")}
                  onChange={(e) => setField(lang, "description", e.target.value)}
                  placeholder={lang === defaultLocale ? "Descreva o produto..." : ""}
                  rows={3}
                  className={inputClass + " resize-none"}
                  style={inputStyle}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-text-dark mb-1.5">
                  Destaque
                  <span className="text-xs text-text-muted ml-2">curto, aparece em cards</span>
                </label>
                <input
                  value={getField(lang, "highlight")}
                  onChange={(e) => setField(lang, "highlight", e.target.value)}
                  placeholder={lang === defaultLocale ? "Ex: O favorito da casa" : ""}
                  className={inputClass}
                  style={inputStyle}
                />
              </div>
            </div>
          ))}
        </div>

        {error && (
          <p className="text-sm text-red-500 bg-red-50 px-4 py-2.5 rounded-xl">{error}</p>
        )}

        <button
          type="submit"
          disabled={saving}
          className="flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-50"
          style={{ background: "var(--orange)" }}
        >
          <Save size={16} />
          {saving ? "Salvando..." : "Salvar Produto"}
        </button>
      </form>
    </div>
  );
}
