"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { X, Save, Sparkles, Loader2 } from "lucide-react";
import { ImagePicker } from "@/components/admin/image-picker";

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
  defaultLocale: string;
  categories: Category[];
  product?: Product;
  onClose: () => void;
};

const TAG_OPTIONS = [
  { value: "POPULAR", label: "Popular" },
  { value: "SUGGESTED", label: "Sugestão" },
  { value: "NEW", label: "Novidade" },
  { value: "COMBO", label: "Combo" },
  { value: "FEATURED", label: "Destaque" },
];

const LANG_LABELS: Record<string, string> = { pt: "PT 🇧🇷", en: "EN 🇺🇸", es: "ES 🇪🇸" };

function orderedLangs(primary: string) {
  return [primary, ...["pt", "en", "es"].filter((l) => l !== primary)];
}

export function ProductForm({ storeId, defaultLocale, categories, product, onClose }: Props) {
  const router = useRouter();
  const isEdit = !!product;
  const langs = orderedLangs(defaultLocale);
  const [activeTab, setActiveTab] = useState(defaultLocale);

  const [namePt, setNamePt] = useState(product?.namePt ?? "");
  const [nameEn, setNameEn] = useState(product?.nameEn ?? "");
  const [nameEs, setNameEs] = useState(product?.nameEs ?? "");
  const [descriptionPt, setDescriptionPt] = useState(product?.descriptionPt ?? "");
  const [descriptionEn, setDescriptionEn] = useState(product?.descriptionEn ?? "");
  const [descriptionEs, setDescriptionEs] = useState(product?.descriptionEs ?? "");
  const [highlightPt, setHighlightPt] = useState(product?.highlightPt ?? "");
  const [highlightEn, setHighlightEn] = useState(product?.highlightEn ?? "");
  const [highlightEs, setHighlightEs] = useState(product?.highlightEs ?? "");

  const [categoryId, setCategoryId] = useState(product?.categoryId ?? categories[0]?.id ?? "");
  const [imageUrl, setImageUrl] = useState(product?.imageUrl ?? "");
  const [pendingImageFile, setPendingImageFile] = useState<File | null>(null);
  const [pendingImagePreview, setPendingImagePreview] = useState<string>("");
  const [basePrice, setBasePrice] = useState(product?.basePrice != null ? String(product.basePrice) : "");
  const [isAvailable, setIsAvailable] = useState(product?.isAvailable ?? true);
  const [sortOrder, setSortOrder] = useState(String(product?.sortOrder ?? 0));
  const [tags, setTags] = useState<string[]>(product?.tags ?? []);

  const [saving, setSaving] = useState(false);
  const [translating, setTranslating] = useState<string | null>(null);
  const [error, setError] = useState("");

  function toggleTag(tag: string) {
    setTags((prev) => (prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]));
  }

  function getField(lang: string, field: "name" | "description" | "highlight") {
    if (lang === "pt") return { name: namePt, description: descriptionPt, highlight: highlightPt }[field];
    if (lang === "en") return { name: nameEn, description: descriptionEn, highlight: highlightEn }[field];
    return { name: nameEs, description: descriptionEs, highlight: highlightEs }[field];
  }

  function setField(lang: string, field: "name" | "description" | "highlight", value: string) {
    const setters: Record<string, Record<string, (v: string) => void>> = {
      pt: { name: setNamePt, description: setDescriptionPt, highlight: setHighlightPt },
      en: { name: setNameEn, description: setDescriptionEn, highlight: setHighlightEn },
      es: { name: setNameEs, description: setDescriptionEs, highlight: setHighlightEs },
    };
    setters[lang]?.[field]?.(value);
  }

  async function handleTranslate(targetLang: string) {
    const primaryName = getField(defaultLocale, "name");
    const primaryDesc = getField(defaultLocale, "description");
    const primaryHighlight = getField(defaultLocale, "highlight");
    if (!primaryName && !primaryDesc && !primaryHighlight) {
      setError(`Preencha os campos em ${LANG_LABELS[defaultLocale]} antes de traduzir.`);
      return;
    }
    setTranslating(targetLang);
    setError("");
    try {
      const res = await fetch("/api/admin/translate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          storeId, sourceLang: defaultLocale, targetLang,
          fields: { name: primaryName || null, description: primaryDesc || null, highlight: primaryHighlight || null },
        }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error ?? "Erro ao traduzir."); return; }
      if (data.name) setField(targetLang, "name", data.name);
      if (data.description) setField(targetLang, "description", data.description);
      if (data.highlight) setField(targetLang, "highlight", data.highlight);
    } catch {
      setError("Erro de conexão ao traduzir.");
    } finally {
      setTranslating(null);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!getField(defaultLocale, "name").trim() || !categoryId) {
      setError("Nome e categoria são obrigatórios.");
      return;
    }
    setSaving(true);
    setError("");
    try {
      // Upload pending image first
      let finalImageUrl = imageUrl;
      if (pendingImageFile) {
        const fd = new FormData();
        fd.append("file", pendingImageFile);
        fd.append("storeId", storeId);
        const uploadRes = await fetch("/api/admin/upload", { method: "POST", body: fd });
        if (!uploadRes.ok) {
          const d = await uploadRes.json().catch(() => ({}));
          setError(d.error ?? "Erro ao enviar imagem.");
          return;
        }
        const { url } = await uploadRes.json();
        finalImageUrl = url;
      }

      const res = await fetch(
        isEdit ? `/api/admin/products/${product.id}` : "/api/admin/products",
        {
          method: isEdit ? "PATCH" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            storeId, categoryId,
            namePt: namePt.trim() || null, nameEn: nameEn.trim() || null, nameEs: nameEs.trim() || null,
            descriptionPt: descriptionPt.trim() || null, descriptionEn: descriptionEn.trim() || null, descriptionEs: descriptionEs.trim() || null,
            highlightPt: highlightPt.trim() || null, highlightEn: highlightEn.trim() || null, highlightEs: highlightEs.trim() || null,
            imageUrl: finalImageUrl.trim() || null,
            basePrice: basePrice !== "" ? parseFloat(basePrice) : null,
            isAvailable, sortOrder: parseInt(sortOrder) || 0, tags,
          }),
        }
      );
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data.error ?? "Ocorreu um erro.");
        return;
      }
      router.refresh();
      onClose();
    } catch {
      setError("Ocorreu um erro. Tente novamente.");
    } finally {
      setSaving(false);
    }
  }

  const inputClass = "w-full px-3 py-2.5 text-sm rounded-xl border focus:outline-none focus:ring-2 focus:ring-orange-400/50";
  const inputStyle = { borderColor: "var(--cream-dark)", background: "white" };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <form
        onSubmit={handleSubmit}
        className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[92vh] flex flex-col"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b flex-shrink-0" style={{ borderColor: "var(--cream-dark)" }}>
          <h2 className="text-lg font-bold text-text-dark">
            {isEdit ? "Editar Produto" : "Novo Produto"}
          </h2>
          <button type="button" onClick={onClose} className="text-text-muted hover:text-text-dark transition-colors">
            <X size={20} />
          </button>
        </div>

        {/* Scrollable body */}
        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-5">
          {/* Category + price + order + image */}
          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2">
              <label className="block text-sm font-medium text-text-dark mb-1.5">
                Categoria <span className="text-red-500">*</span>
              </label>
              <select value={categoryId} onChange={(e) => setCategoryId(e.target.value)} className={inputClass} style={inputStyle} required>
                {categories.map((c) => <option key={c.id} value={c.id}>{c.namePt}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-text-dark mb-1.5">Preço (R$)</label>
              <input type="number" min="0" step="0.01" value={basePrice} onChange={(e) => setBasePrice(e.target.value)} placeholder="9.90" className={inputClass} style={inputStyle} />
            </div>
            <div>
              <label className="block text-sm font-medium text-text-dark mb-1.5">Ordem</label>
              <input type="number" min="0" value={sortOrder} onChange={(e) => setSortOrder(e.target.value)} className={inputClass} style={inputStyle} />
            </div>
            <div className="col-span-2">
              <label className="block text-sm font-medium text-text-dark mb-1.5">Imagem</label>
              <ImagePicker
                currentUrl={pendingImagePreview || imageUrl}
                onFileReady={(file) => {
                  setPendingImageFile(file);
                  setPendingImagePreview(URL.createObjectURL(file));
                }}
                onClear={() => {
                  setPendingImageFile(null);
                  setPendingImagePreview("");
                  setImageUrl("");
                }}
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
                  <button key={t.value} type="button" onClick={() => toggleTag(t.value)}
                    className="px-3 py-1.5 rounded-full text-xs font-medium transition-all"
                    style={active ? { background: "var(--orange)", color: "white" } : { background: "white", color: "var(--text-muted)", border: "1px solid var(--cream-dark)" }}
                  >
                    {t.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Availability */}
          <label className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" checked={isAvailable} onChange={(e) => setIsAvailable(e.target.checked)} className="w-4 h-4 rounded accent-orange-500" />
            <span className="text-sm font-medium text-text-dark">Disponível</span>
          </label>

          {/* Translatable content — tabs */}
          <div>
            <div className="text-sm font-semibold text-text-dark mb-3">Conteúdo</div>
            <div className="flex gap-1 mb-4 border-b" style={{ borderColor: "var(--cream-dark)" }}>
              {langs.map((lang) => (
                <button key={lang} type="button" onClick={() => setActiveTab(lang)}
                  className="px-4 py-2 text-sm font-medium transition-all rounded-t-lg -mb-px"
                  style={activeTab === lang
                    ? { background: "white", borderColor: "var(--cream-dark)", borderWidth: "1px 1px 0", color: "var(--orange)" }
                    : { color: "var(--text-muted)" }}
                >
                  {LANG_LABELS[lang]}
                  {lang === defaultLocale && (
                    <span className="ml-1.5 text-xs px-1.5 py-0.5 rounded-full" style={{ background: "var(--orange)", color: "white" }}>Principal</span>
                  )}
                </button>
              ))}
            </div>

            {langs.map((lang) => (
              <div key={lang} className={lang !== activeTab ? "hidden" : "space-y-4"}>
                {lang !== defaultLocale && (
                  <button type="button" onClick={() => handleTranslate(lang)} disabled={!!translating}
                    className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium w-full justify-center transition-all"
                    style={{ background: "var(--cream-dark)", color: "var(--text-dark)" }}
                  >
                    {translating === lang
                      ? <><Loader2 size={15} className="animate-spin" /> Traduzindo...</>
                      : <><Sparkles size={15} style={{ color: "var(--orange)" }} /> Traduzir do {LANG_LABELS[defaultLocale]} com IA</>}
                  </button>
                )}
                <div>
                  <label className="block text-sm font-medium text-text-dark mb-1.5">
                    Nome {lang === defaultLocale && <span className="text-red-500">*</span>}
                  </label>
                  <input value={getField(lang, "name")} onChange={(e) => setField(lang, "name", e.target.value)}
                    placeholder={lang === defaultLocale ? "Ex: Cappuccino Clássico" : ""}
                    className={inputClass} style={inputStyle} required={lang === defaultLocale} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-text-dark mb-1.5">Descrição</label>
                  <textarea value={getField(lang, "description")} onChange={(e) => setField(lang, "description", e.target.value)}
                    placeholder={lang === defaultLocale ? "Descreva o produto..." : ""}
                    rows={3} className={inputClass + " resize-none"} style={inputStyle} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-text-dark mb-1.5">
                    Destaque <span className="text-xs text-text-muted ml-1">curto, aparece em cards</span>
                  </label>
                  <input value={getField(lang, "highlight")} onChange={(e) => setField(lang, "highlight", e.target.value)}
                    placeholder={lang === defaultLocale ? "Ex: O favorito da casa" : ""}
                    className={inputClass} style={inputStyle} />
                </div>
              </div>
            ))}
          </div>

          {error && <p className="text-sm text-red-500 bg-red-50 px-4 py-2.5 rounded-xl">{error}</p>}
        </div>

        {/* Footer */}
        <div className="flex gap-3 px-6 py-4 border-t flex-shrink-0" style={{ borderColor: "var(--cream-dark)" }}>
          <button type="button" onClick={onClose}
            className="flex-1 px-4 py-2.5 rounded-xl border text-sm font-medium text-text-muted hover:bg-gray-50 transition-colors"
            style={{ borderColor: "var(--cream-dark)" }}
          >
            Cancelar
          </button>
          <button type="submit" disabled={saving}
            className="flex-1 flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl text-sm font-semibold text-white hover:opacity-90 disabled:opacity-50 transition-opacity"
            style={{ background: "var(--orange)" }}
          >
            <Save size={16} />
            {saving ? "Salvando..." : "Salvar"}
          </button>
        </div>
      </form>
    </div>
  );
}
