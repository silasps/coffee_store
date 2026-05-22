"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { X, Save, Sparkles, Loader2, Plus, Trash2, Package, ChevronDown, Search } from "lucide-react";
import { ImagePicker } from "@/components/admin/image-picker";
import { formatCurrency } from "@/components/ui/format-currency";
import type { SimpleProduct } from "@/components/admin/products-manager";

type Category = { id: string; namePt: string; area: string };

type ComboItem = {
  productId: string;
  namePt: string;
  qty: number;
  unitPrice: number;
};

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
  stockQuantity: number | null;
  isAvailable: boolean;
  sortOrder: number;
  tags: string[];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  comboItems: any;
};

type Props = {
  storeId: string;
  defaultLocale: string;
  categories: Category[];
  allProducts: SimpleProduct[];
  product?: Product;
  onClose: () => void;
  isPaidPlan?: boolean;
};

const TAG_OPTIONS = [
  { value: "POPULAR", label: "Fixar em Mais Pedidos" },
  { value: "SUGGESTED", label: "Sugestão" },
  { value: "NEW", label: "Novidade" },
  { value: "FEATURED", label: "Destaque" },
];

const LANG_LABELS: Record<string, string> = { pt: "PT 🇧🇷", en: "EN 🇺🇸", es: "ES 🇪🇸" };

function orderedLangs(primary: string) {
  return [primary, ...["pt", "en", "es"].filter((l) => l !== primary)];
}

function parseComboItems(raw: unknown): ComboItem[] {
  if (!Array.isArray(raw)) return [];
  return raw.filter(
    (i): i is ComboItem =>
      typeof i === "object" && i !== null &&
      "productId" in i && "namePt" in i && "qty" in i && "unitPrice" in i
  );
}

export function ProductForm({ storeId, defaultLocale, categories, allProducts, product, onClose, isPaidPlan = false }: Props) {
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
  const [stockQuantity, setStockQuantity] = useState(product?.stockQuantity != null ? String(product.stockQuantity) : "");
  const [isAvailable, setIsAvailable] = useState(product?.isAvailable ?? true);
  const [sortOrder, setSortOrder] = useState(String(product?.sortOrder ?? 0));
  const [tags, setTags] = useState<string[]>((product?.tags ?? []).filter((t: string) => t !== "COMBO"));

  // Combo state
  const [comboItems, setComboItems] = useState<ComboItem[]>(parseComboItems(product?.comboItems));
  const [comboDiscount, setComboDiscount] = useState<string>("");
  const [comboSearch, setComboSearch] = useState("");

  const [saving, setSaving] = useState(false);
  const [translating, setTranslating] = useState<string | null>(null);
  const [error, setError] = useState("");

  const selectedCategory = categories.find((c) => c.id === categoryId);
  const isCombo = selectedCategory?.area === "COMBOS";

  // Sync combo discount from saved basePrice when editing
  useEffect(() => {
    if (isCombo && comboItems.length > 0 && product?.basePrice != null) {
      const original = comboItems.reduce((s, i) => s + i.qty * i.unitPrice, 0);
      const disc = original - product.basePrice;
      if (disc > 0) setComboDiscount(disc.toFixed(2));
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const comboOriginalPrice = comboItems.reduce((s, i) => s + i.qty * i.unitPrice, 0);
  const comboDiscountAmount = Math.max(0, parseFloat(comboDiscount) || 0);
  const comboFinalPrice = Math.max(0, comboOriginalPrice - comboDiscountAmount);
  const comboSavingsPct = comboOriginalPrice > 0
    ? Math.round((comboDiscountAmount / comboOriginalPrice) * 100)
    : 0;

  const availableToAdd = allProducts.filter(
    (p) => p.id !== product?.id && !comboItems.some((i) => i.productId === p.id) &&
      (!comboSearch || p.namePt.toLowerCase().includes(comboSearch.toLowerCase()))
  );

  function addComboItem(p: SimpleProduct) {
    setComboItems((prev) => [...prev, { productId: p.id, namePt: p.namePt, qty: 1, unitPrice: p.basePrice ?? 0 }]);
    setComboSearch("");
  }

  function removeComboItem(productId: string) {
    setComboItems((prev) => prev.filter((i) => i.productId !== productId));
  }

  function setComboQty(productId: string, qty: number) {
    setComboItems((prev) => prev.map((i) => i.productId === productId ? { ...i, qty: Math.max(1, qty) } : i));
  }

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
    if (isCombo && comboItems.length === 0) {
      setError("Adicione ao menos um item ao combo.");
      return;
    }
    setSaving(true);
    setError("");
    try {
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

      const finalTags = isCombo ? [...tags, "COMBO"] : tags;
      const finalBasePrice = isCombo ? comboFinalPrice : (basePrice !== "" ? parseFloat(basePrice) : null);
      const finalComboItems = isCombo ? comboItems : null;

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
            basePrice: finalBasePrice,
            stockQuantity: stockQuantity !== "" ? parseInt(stockQuantity) : null,
            isAvailable, sortOrder: parseInt(sortOrder) || 0,
            tags: finalTags,
            comboItems: finalComboItems,
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

          {/* Category + basic fields */}
          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2">
              <label className="block text-sm font-medium text-text-dark mb-1.5">
                Categoria <span className="text-red-500">*</span>
              </label>
              <select value={categoryId} onChange={(e) => setCategoryId(e.target.value)} className={inputClass} style={inputStyle} required>
                {categories.map((c) => <option key={c.id} value={c.id}>{c.namePt}</option>)}
              </select>
            </div>

            {/* Combo builder — replaces price field when category = COMBOS */}
            {isCombo ? (
              <div className="col-span-2">
                <ComboBuilder
                  comboItems={comboItems}
                  comboSearch={comboSearch}
                  setComboSearch={setComboSearch}
                  availableToAdd={availableToAdd}
                  onAdd={addComboItem}
                  onRemove={removeComboItem}
                  onSetQty={setComboQty}
                  comboDiscount={comboDiscount}
                  setComboDiscount={setComboDiscount}
                  originalPrice={comboOriginalPrice}
                  finalPrice={comboFinalPrice}
                  discountAmount={comboDiscountAmount}
                  savingsPct={comboSavingsPct}
                  inputClass={inputClass}
                  inputStyle={inputStyle}
                />
              </div>
            ) : (
              <>
                <div>
                  <label className="block text-sm font-medium text-text-dark mb-1.5">Preço (R$)</label>
                  <input type="number" min="0" step="0.01" value={basePrice} onChange={(e) => setBasePrice(e.target.value)} placeholder="9.90" className={inputClass} style={inputStyle} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-text-dark mb-1.5">Ordem</label>
                  <input type="number" min="0" value={sortOrder} onChange={(e) => setSortOrder(e.target.value)} className={inputClass} style={inputStyle} />
                </div>
              </>
            )}

            {isCombo && (
              <div>
                <label className="block text-sm font-medium text-text-dark mb-1.5">Ordem</label>
                <input type="number" min="0" value={sortOrder} onChange={(e) => setSortOrder(e.target.value)} className={inputClass} style={inputStyle} />
              </div>
            )}

            <div className={isCombo ? "" : "col-span-2"}>
              <label className="block text-sm font-medium text-text-dark mb-1.5">
                Estoque <span className="text-xs text-text-muted ml-1">deixe vazio para sem controle · 0 = esgotado</span>
              </label>
              <input type="number" min="0" step="1" value={stockQuantity} onChange={(e) => setStockQuantity(e.target.value)} placeholder="Ex: 20" className={inputClass} style={inputStyle} />
            </div>

            <div className={isCombo ? "col-span-2" : "col-span-2"}>
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

          {/* Tags — COMBO is implicit, not shown */}
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
              {isCombo && (
                <span className="px-3 py-1.5 rounded-full text-xs font-medium" style={{ background: "var(--cream-dark)", color: "var(--text-muted)" }}>
                  🎁 Tag Combo adicionada automaticamente
                </span>
              )}
            </div>
          </div>

          {/* Availability */}
          <label className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" checked={isAvailable} onChange={(e) => setIsAvailable(e.target.checked)} className="w-4 h-4 rounded accent-orange-500" />
            <span className="text-sm font-medium text-text-dark">Disponível</span>
          </label>

          {/* Translatable content */}
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
                  isPaidPlan ? (
                    <button type="button" onClick={() => handleTranslate(lang)} disabled={!!translating}
                      className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium w-full justify-center transition-all"
                      style={{ background: "var(--cream-dark)", color: "var(--text-dark)" }}
                    >
                      {translating === lang
                        ? <><Loader2 size={15} className="animate-spin" /> Traduzindo...</>
                        : <><Sparkles size={15} style={{ color: "var(--orange)" }} /> Traduzir do {LANG_LABELS[defaultLocale]} com IA</>}
                    </button>
                  ) : (
                    <div className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm w-full justify-center border border-dashed"
                      style={{ borderColor: "var(--cream-dark)", color: "var(--text-muted)" }}>
                      <Sparkles size={15} />
                      Tradução com IA — disponível nos planos pagos
                    </div>
                  )
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

// ─── Helpers ─────────────────────────────────────────────────────────────────

function formatDiscount(value: string): string {
  if (!value) return "";
  const num = parseFloat(value);
  if (!num) return "";
  const cents = Math.round(num * 100);
  const s = cents.toString().padStart(3, "0");
  return `${parseInt(s.slice(0, -2))},${s.slice(-2)}`;
}

// ─── Combo Builder sub-component ─────────────────────────────────────────────

type ComboBuilderProps = {
  comboItems: ComboItem[];
  comboSearch: string;
  setComboSearch: (v: string) => void;
  availableToAdd: SimpleProduct[];
  onAdd: (p: SimpleProduct) => void;
  onRemove: (id: string) => void;
  onSetQty: (id: string, qty: number) => void;
  comboDiscount: string;
  setComboDiscount: (v: string) => void;
  originalPrice: number;
  finalPrice: number;
  discountAmount: number;
  savingsPct: number;
  inputClass: string;
  inputStyle: React.CSSProperties;
};

function ComboBuilder({
  comboItems, comboSearch, setComboSearch, availableToAdd, onAdd, onRemove, onSetQty,
  comboDiscount, setComboDiscount, originalPrice, finalPrice, discountAmount, savingsPct,
  inputClass, inputStyle,
}: ComboBuilderProps) {
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setShowDropdown(false);
      }
    }
    if (showDropdown) document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [showDropdown]);

  // Group available products by category
  const grouped = availableToAdd.reduce<Record<string, SimpleProduct[]>>((acc, p) => {
    const cat = p.categoryName;
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(p);
    return acc;
  }, {});

  return (
    <div className="rounded-2xl border p-4 space-y-3" style={{ borderColor: "var(--orange)", background: "#FFF8F3" }}>
      <div className="flex items-center gap-2">
        <Package size={16} style={{ color: "var(--orange)" }} />
        <span className="text-sm font-semibold" style={{ color: "var(--brown-dark)" }}>Montar Combo</span>
      </div>

      {/* Dropdown selector */}
      <div className="relative" ref={dropdownRef}>
        {/* Trigger button */}
        <button
          type="button"
          onClick={() => setShowDropdown((v) => !v)}
          className="w-full flex items-center justify-between px-3 py-2.5 text-sm rounded-xl border transition-colors hover:border-orange-300"
          style={{ borderColor: showDropdown ? "var(--orange)" : "var(--cream-dark)", background: "white", color: "var(--text-muted)" }}
        >
          <span>Adicionar produto ao combo…</span>
          <ChevronDown size={15} className={`transition-transform ${showDropdown ? "rotate-180" : ""}`} style={{ color: "var(--orange)" }} />
        </button>

        {/* Dropdown panel */}
        {showDropdown && (
          <div
            className="absolute z-20 top-full left-0 right-0 mt-1 bg-white border rounded-xl shadow-xl flex flex-col"
            style={{ borderColor: "var(--cream-dark)", maxHeight: "260px" }}
          >
            {/* Search inside dropdown */}
            <div className="p-2 border-b flex-shrink-0" style={{ borderColor: "var(--cream-dark)" }}>
              <div className="relative">
                <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-text-muted" />
                <input
                  autoFocus
                  type="text"
                  value={comboSearch}
                  onChange={(e) => setComboSearch(e.target.value)}
                  placeholder="Filtrar por nome…"
                  className="w-full pl-7 pr-3 py-1.5 text-sm rounded-lg border focus:outline-none focus:ring-1 focus:ring-orange-400/50"
                  style={{ borderColor: "var(--cream-dark)", background: "white" }}
                />
              </div>
            </div>

            {/* Product list grouped by category */}
            <div className="overflow-y-auto flex-1">
              {availableToAdd.length === 0 ? (
                <p className="text-xs text-text-muted text-center py-4">Nenhum produto disponível</p>
              ) : (
                Object.entries(grouped).map(([cat, products]) => (
                  <div key={cat}>
                    <div className="px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider sticky top-0" style={{ background: "#F7F0EB", color: "var(--text-muted)" }}>
                      {cat}
                    </div>
                    {products.map((p) => (
                      <button
                        key={p.id}
                        type="button"
                        className="w-full flex items-center justify-between px-3 py-2 text-sm hover:bg-orange-50 transition-colors text-left"
                        onClick={() => { onAdd(p); setComboSearch(""); setShowDropdown(false); }}
                      >
                        <span className="font-medium text-text-dark truncate">{p.namePt}</span>
                        <span className="text-xs font-semibold ml-3 flex-shrink-0" style={{ color: "var(--orange)" }}>
                          {p.basePrice != null ? formatCurrency(p.basePrice) : "—"}
                        </span>
                      </button>
                    ))}
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </div>

      {/* Items list */}
      {comboItems.length === 0 ? (
        <p className="text-xs text-text-muted text-center py-2">Nenhum item adicionado ainda</p>
      ) : (
        <div className="space-y-2">
          {comboItems.map((item) => (
            <div key={item.productId} className="flex items-center gap-2 bg-white rounded-xl px-3 py-2 border" style={{ borderColor: "var(--cream-dark)" }}>
              <span className="flex-1 text-sm font-medium text-text-dark truncate">{item.namePt}</span>
              <div className="flex items-center gap-1">
                <button type="button" onClick={() => onSetQty(item.productId, item.qty - 1)}
                  className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold transition-colors"
                  style={{ background: "var(--cream-dark)", color: "var(--text-dark)" }}>−</button>
                <span className="w-5 text-center text-sm font-semibold">{item.qty}</span>
                <button type="button" onClick={() => onSetQty(item.productId, item.qty + 1)}
                  className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold transition-colors"
                  style={{ background: "var(--cream-dark)", color: "var(--text-dark)" }}>+</button>
              </div>
              <span className="text-xs font-medium w-16 text-right" style={{ color: "var(--brown-dark)" }}>
                {formatCurrency(item.qty * item.unitPrice)}
              </span>
              <button type="button" onClick={() => onRemove(item.productId)} className="text-red-400 hover:text-red-600 transition-colors ml-1">
                <Trash2 size={13} />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Pricing summary */}
      {comboItems.length > 0 && (
        <div className="rounded-xl border p-3 space-y-2.5" style={{ borderColor: "var(--cream-dark)", background: "white" }}>
          <div className="flex justify-between text-sm text-text-muted">
            <span>Total sem desconto</span>
            <span className="font-medium">{formatCurrency(originalPrice)}</span>
          </div>

          <div className="flex items-center gap-2">
            <label className="text-sm text-text-muted flex-shrink-0">Desconto (R$)</label>
            <input
              type="text"
              inputMode="numeric"
              value={formatDiscount(comboDiscount)}
              onChange={(e) => {
                const digits = e.target.value.replace(/\D/g, "");
                const cents = digits ? parseInt(digits) : 0;
                if (cents === 0) { setComboDiscount(""); return; }
                const capped = Math.min(cents, Math.round(originalPrice * 100));
                setComboDiscount((capped / 100).toFixed(2));
              }}
              placeholder="0,00"
              className="flex-1 px-3 py-1.5 text-sm rounded-xl border focus:outline-none focus:ring-2 focus:ring-orange-400/50"
              style={inputStyle}
            />
            {discountAmount > 0 && (
              <span className="text-xs font-semibold text-green-600 flex-shrink-0">{savingsPct}%</span>
            )}
          </div>

          <div className="border-t pt-2" style={{ borderColor: "var(--cream-dark)" }}>
            <div className="flex justify-between items-center">
              <span className="text-sm font-semibold text-text-dark">Preço do combo</span>
              <span className="text-base font-bold" style={{ color: "var(--orange)" }}>{formatCurrency(finalPrice)}</span>
            </div>
            {discountAmount > 0 && (
              <div className="flex items-center gap-1.5 mt-1">
                <Plus size={10} className="rotate-45 text-green-600" />
                <span className="text-xs font-medium text-green-600">
                  Cliente economiza {formatCurrency(discountAmount)} ({savingsPct}%)
                </span>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
