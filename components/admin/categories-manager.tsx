"use client";

import { useState } from "react";
import { Plus, Edit2, Trash2, ToggleLeft, ToggleRight, X, Check, Sparkles, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";

const AREA_LABELS: Record<string, { label: string; emoji: string }> = {
  HOT_DRINKS:  { label: "Bebidas Quentes", emoji: "☕" },
  COLD_DRINKS: { label: "Bebidas Frias",   emoji: "🧋" },
  FOODS:       { label: "Comidas",          emoji: "🥪" },
  DESSERTS:    { label: "Sobremesas",       emoji: "🍰" },
  SNACKS:      { label: "Salgados",         emoji: "🥐" },
  COMBOS:      { label: "Combos",           emoji: "🎁" },
  CANDY_SHOP:  { label: "Bomboniere",       emoji: "🍬" },
};

const PRESET_EMOJIS = [
  "☕","🍵","🧋","🥤","🍺","🧃",
  "🍰","🎂","🧁","🍩","🍪","🍫",
  "🥐","🥪","🍕","🌮","🥙","🥞",
  "🍬","🍭","🍡","🍮","🍦","🧇",
  "🎁","⭐","🔥","🌟","💝","✨",
];

const PRESET_COLORS = [
  "#8B4513","#A0522D","#D2691E","#CD853F",
  "#FF8C42","#F4A261","#E9C46A","#2A9D8F",
  "#457B9D","#E63946","#6D4C41","#4A1942",
];

const LANG_LABELS: Record<string, string> = { pt: "PT 🇧🇷", en: "EN 🇺🇸", es: "ES 🇪🇸" };

type Category = {
  id: string;
  namePt: string;
  nameEn: string | null;
  nameEs: string | null;
  area: string;
  iconEmoji: string | null;
  accentColor: string | null;
  sortOrder: number;
  isActive: boolean;
  productCount: number;
  createdAt: string;
};

type Props = {
  storeId: string;
  locale: string;
  categories: Category[];
};

type FormState = {
  namePt: string;
  nameEn: string;
  nameEs: string;
  area: string;
  iconEmoji: string;
  accentColor: string;
  sortOrder: number;
};

const EMPTY_FORM: FormState = {
  namePt: "",
  nameEn: "",
  nameEs: "",
  area: "HOT_DRINKS",
  iconEmoji: "",
  accentColor: "",
  sortOrder: 0,
};

export function CategoriesManager({ storeId, categories: initial }: Props) {
  const [categories, setCategories] = useState(initial);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [activeTab, setActiveTab] = useState("pt");
  const [saving, setSaving] = useState(false);
  const [translating, setTranslating] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showCustomEmoji, setShowCustomEmoji] = useState(false);
  const router = useRouter();

  function openNew() {
    setEditingId(null);
    setForm({ ...EMPTY_FORM, sortOrder: categories.length });
    setError(null);
    setActiveTab("pt");
    setShowCustomEmoji(false);
    setShowForm(true);
  }

  function openEdit(cat: Category) {
    setEditingId(cat.id);
    setForm({
      namePt: cat.namePt,
      nameEn: cat.nameEn ?? "",
      nameEs: cat.nameEs ?? "",
      area: cat.area,
      iconEmoji: cat.iconEmoji ?? "",
      accentColor: cat.accentColor ?? "",
      sortOrder: cat.sortOrder,
    });
    setError(null);
    setActiveTab("pt");
    setShowCustomEmoji(cat.iconEmoji ? !PRESET_EMOJIS.includes(cat.iconEmoji) : false);
    setShowForm(true);
  }

  function closeForm() {
    setShowForm(false);
    setEditingId(null);
  }

  async function handleTranslate(targetLang: string) {
    if (!form.namePt.trim()) {
      setError("Preencha o nome em PT antes de traduzir.");
      return;
    }
    setTranslating(targetLang);
    setError(null);
    try {
      const res = await fetch("/api/admin/translate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          storeId,
          sourceLang: "pt",
          targetLang,
          fields: { name: form.namePt, description: null, highlight: null },
        }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error ?? "Erro ao traduzir."); return; }
      if (data.name) {
        setForm((f) => ({ ...f, [targetLang === "en" ? "nameEn" : "nameEs"]: data.name }));
      }
    } catch {
      setError("Erro de conexão ao traduzir.");
    } finally {
      setTranslating(null);
    }
  }

  async function handleSave() {
    if (!form.namePt.trim()) { setError("Nome em português é obrigatório."); return; }
    setSaving(true);
    setError(null);
    try {
      const payload = {
        namePt: form.namePt.trim(),
        nameEn: form.nameEn.trim() || null,
        nameEs: form.nameEs.trim() || null,
        area: form.area,
        iconEmoji: form.iconEmoji || null,
        accentColor: form.accentColor || null,
        sortOrder: form.sortOrder,
      };

      if (editingId) {
        const res = await fetch(`/api/admin/categories/${editingId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        if (!res.ok) throw new Error((await res.json()).error ?? "Erro ao salvar.");
        const updated = await res.json();
        setCategories((prev) => prev.map((c) => (c.id === editingId ? { ...c, ...updated } : c)));
      } else {
        const res = await fetch("/api/admin/categories", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ storeId, ...payload }),
        });
        if (!res.ok) throw new Error((await res.json()).error ?? "Erro ao salvar.");
        const created = await res.json();
        setCategories((prev) => [...prev, { ...created, productCount: 0 }]);
      }
      closeForm();
      router.refresh();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Erro ao salvar.");
    } finally {
      setSaving(false);
    }
  }

  async function toggleActive(cat: Category) {
    setCategories((prev) => prev.map((c) => (c.id === cat.id ? { ...c, isActive: !cat.isActive } : c)));
    try {
      await fetch(`/api/admin/categories/${cat.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: !cat.isActive }),
      });
    } catch {
      setCategories((prev) => prev.map((c) => (c.id === cat.id ? { ...c, isActive: cat.isActive } : c)));
    }
  }

  async function handleDelete(cat: Category) {
    if (cat.productCount > 0) {
      alert(`Essa categoria tem ${cat.productCount} produto(s). Mova-os antes de excluir.`);
      return;
    }
    if (!confirm(`Excluir "${cat.namePt}"?`)) return;
    try {
      const res = await fetch(`/api/admin/categories/${cat.id}`, { method: "DELETE" });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        alert(data.error ?? "Erro ao excluir.");
        return;
      }
      setCategories((prev) => prev.filter((c) => c.id !== cat.id));
    } catch {}
  }

  const inputClass = "w-full px-3 py-2 text-sm rounded-lg border focus:outline-none focus:ring-2 focus:ring-orange-400/40";
  const inputStyle = { borderColor: "var(--brown-light)" };

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: "var(--brown-dark)" }}>Categorias</h1>
          <p className="text-sm text-gray-500 mt-0.5">{categories.length} categoria(s)</p>
        </div>
        <button
          onClick={openNew}
          className="flex items-center gap-2 px-4 py-2 rounded-lg text-white text-sm font-medium"
          style={{ background: "var(--orange)" }}
        >
          <Plus size={16} /> Nova categoria
        </button>
      </div>

      {/* Modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between px-6 py-4 border-b" style={{ borderColor: "var(--brown-light)" }}>
              <h2 className="text-lg font-semibold" style={{ color: "var(--brown-dark)" }}>
                {editingId ? "Editar categoria" : "Nova categoria"}
              </h2>
              <button onClick={closeForm} className="text-gray-400 hover:text-gray-600"><X size={20} /></button>
            </div>

            <div className="px-6 py-4 space-y-5">
              {/* Área */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Área</label>
                <div className="grid grid-cols-2 gap-2">
                  {Object.entries(AREA_LABELS).map(([v, { label, emoji }]) => (
                    <button
                      key={v}
                      type="button"
                      onClick={() => setForm((f) => ({ ...f, area: v }))}
                      className="flex items-center gap-2 px-3 py-2 rounded-lg border text-sm transition-all text-left"
                      style={
                        form.area === v
                          ? { background: "var(--orange)", borderColor: "var(--orange)", color: "white" }
                          : { borderColor: "var(--brown-light)", color: "var(--brown-dark)" }
                      }
                    >
                      <span>{emoji}</span>
                      <span>{label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Emoji */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Ícone (emoji)</label>
                <div className="flex flex-wrap gap-1.5 p-3 rounded-lg border" style={{ borderColor: "var(--brown-light)" }}>
                  {PRESET_EMOJIS.map((e) => (
                    <button
                      key={e}
                      type="button"
                      onClick={() => { setForm((f) => ({ ...f, iconEmoji: f.iconEmoji === e ? "" : e })); setShowCustomEmoji(false); }}
                      className="w-9 h-9 rounded-md text-lg flex items-center justify-center transition-all"
                      style={
                        form.iconEmoji === e
                          ? { background: "var(--orange)", boxShadow: "0 0 0 2px var(--orange)" }
                          : { background: "var(--cream)" }
                      }
                    >
                      {e}
                    </button>
                  ))}
                  <button
                    type="button"
                    onClick={() => setShowCustomEmoji((v) => !v)}
                    className="w-9 h-9 rounded-md text-xs font-bold flex items-center justify-center border transition-all"
                    style={{
                      borderColor: showCustomEmoji ? "var(--orange)" : "var(--brown-light)",
                      color: showCustomEmoji ? "var(--orange)" : "var(--brown-mid)",
                    }}
                    title="Outro emoji"
                  >
                    +
                  </button>
                </div>
                {showCustomEmoji && (
                  <input
                    className={inputClass + " mt-2"}
                    style={inputStyle}
                    value={PRESET_EMOJIS.includes(form.iconEmoji) ? "" : form.iconEmoji}
                    onChange={(e) => setForm((f) => ({ ...f, iconEmoji: e.target.value }))}
                    placeholder="Cole ou digite um emoji..."
                    maxLength={4}
                  />
                )}
              </div>

              {/* Cor */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Cor de destaque
                  <span className="text-xs text-gray-400 ml-2">usada em cards e bordas</span>
                </label>
                <div className="flex flex-wrap gap-2">
                  {PRESET_COLORS.map((c) => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => setForm((f) => ({ ...f, accentColor: f.accentColor === c ? "" : c }))}
                      className="w-8 h-8 rounded-full border-2 transition-all"
                      style={{
                        background: c,
                        borderColor: form.accentColor === c ? "#fff" : "transparent",
                        outline: form.accentColor === c ? `2px solid ${c}` : "none",
                        outlineOffset: "2px",
                      }}
                      title={c}
                    />
                  ))}
                  <button
                    type="button"
                    onClick={() => setForm((f) => ({ ...f, accentColor: "" }))}
                    className="w-8 h-8 rounded-full border-2 flex items-center justify-center text-gray-400 hover:text-gray-600 transition-all"
                    style={{ borderColor: !form.accentColor ? "var(--orange)" : "var(--brown-light)" }}
                    title="Sem cor"
                  >
                    <X size={12} />
                  </button>
                </div>
                {form.accentColor && (
                  <div className="flex items-center gap-2 mt-2">
                    <div className="w-5 h-5 rounded-full" style={{ background: form.accentColor }} />
                    <span className="text-xs text-gray-500">{form.accentColor}</span>
                  </div>
                )}
              </div>

              {/* Ordem */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Posição na lista</label>
                <input
                  type="number"
                  className={inputClass}
                  style={inputStyle}
                  value={form.sortOrder}
                  onChange={(e) => setForm((f) => ({ ...f, sortOrder: Number(e.target.value) }))}
                  min={0}
                  max={categories.length}
                />
                <p className="text-xs text-gray-400 mt-1">
                  0 = primeira posição · {categories.length} {editingId ? categories.length === 1 ? "categoria existente" : "categorias existentes" : "= última posição"}
                </p>
              </div>

              {/* Nome — tabs PT / EN / ES */}
              <div>
                <div className="flex gap-1 border-b mb-3" style={{ borderColor: "var(--brown-light)" }}>
                  {["pt", "en", "es"].map((lang) => (
                    <button
                      key={lang}
                      type="button"
                      onClick={() => setActiveTab(lang)}
                      className="px-4 py-2 text-sm font-medium transition-all rounded-t-lg -mb-px"
                      style={
                        activeTab === lang
                          ? { background: "white", border: "1px solid var(--brown-light)", borderBottom: "1px solid white", color: "var(--orange)" }
                          : { color: "var(--brown-mid)" }
                      }
                    >
                      {LANG_LABELS[lang]}
                      {lang === "pt" && <span className="ml-1.5 text-xs px-1.5 py-0.5 rounded-full text-white" style={{ background: "var(--orange)" }}>Principal</span>}
                    </button>
                  ))}
                </div>

                {["pt", "en", "es"].map((lang) => (
                  <div key={lang} className={lang !== activeTab ? "hidden" : "space-y-3"}>
                    {lang !== "pt" && (
                      <button
                        type="button"
                        onClick={() => handleTranslate(lang)}
                        disabled={!!translating}
                        className="flex items-center gap-2 w-full px-4 py-2 rounded-lg text-sm font-medium justify-center transition-all"
                        style={{ background: "var(--cream)", color: "var(--brown-dark)" }}
                      >
                        {translating === lang
                          ? <><Loader2 size={14} className="animate-spin" /> Traduzindo...</>
                          : <><Sparkles size={14} style={{ color: "var(--orange)" }} /> Traduzir do PT com IA</>}
                      </button>
                    )}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Nome {lang === "pt" && <span className="text-red-500">*</span>}
                      </label>
                      <input
                        className={inputClass}
                        style={inputStyle}
                        value={lang === "pt" ? form.namePt : lang === "en" ? form.nameEn : form.nameEs}
                        onChange={(e) => {
                          const v = e.target.value;
                          setForm((f) => lang === "pt" ? { ...f, namePt: v } : lang === "en" ? { ...f, nameEn: v } : { ...f, nameEs: v });
                        }}
                        placeholder={lang === "pt" ? "ex: Bebidas Especiais" : ""}
                        required={lang === "pt"}
                      />
                    </div>
                  </div>
                ))}
              </div>

              {error && <p className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded-lg">{error}</p>}
            </div>

            <div className="flex gap-3 px-6 py-4 border-t" style={{ borderColor: "var(--brown-light)" }}>
              <button
                onClick={closeForm}
                className="flex-1 px-4 py-2 rounded-lg border text-sm font-medium text-gray-600 hover:bg-gray-50"
                style={{ borderColor: "var(--brown-light)" }}
              >
                Cancelar
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-white text-sm font-medium disabled:opacity-60"
                style={{ background: "var(--orange)" }}
              >
                {saving ? "Salvando..." : <><Check size={14} /> Salvar</>}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Lista */}
      {categories.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <p className="text-lg mb-2">Nenhuma categoria ainda.</p>
          <p className="text-sm">Clique em &quot;Nova categoria&quot; para começar.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {categories.map((cat) => (
            <div
              key={cat.id}
              className="flex items-center gap-4 bg-white rounded-xl border px-4 py-3"
              style={{ borderColor: "var(--brown-light)", borderLeft: cat.accentColor ? `4px solid ${cat.accentColor}` : undefined }}
            >
              <div
                className="w-10 h-10 rounded-lg flex items-center justify-center text-xl flex-shrink-0"
                style={{ background: cat.accentColor ? `${cat.accentColor}22` : "var(--cream)" }}
              >
                {cat.iconEmoji ?? AREA_LABELS[cat.area]?.emoji ?? "📂"}
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5 min-w-0">
                  <span className="font-medium text-sm truncate" style={{ color: "var(--brown-dark)" }}>{cat.namePt}</span>
                  {!cat.isActive && (
                    <span className="text-xs px-1.5 py-0.5 rounded bg-gray-100 text-gray-500 flex-shrink-0">inativa</span>
                  )}
                </div>
                <div className="flex items-center gap-1.5 mt-0.5 text-xs text-gray-400 min-w-0">
                  <span className="truncate">{AREA_LABELS[cat.area]?.label ?? cat.area}</span>
                  <span className="flex-shrink-0 text-gray-300">·</span>
                  <span className="flex-shrink-0">{cat.productCount} prod.</span>
                </div>
              </div>

              <div className="flex items-center gap-1 flex-shrink-0">
                <button onClick={() => toggleActive(cat)} className="p-2 rounded-lg hover:bg-gray-100 transition-colors" title={cat.isActive ? "Desativar categoria" : "Ativar categoria"}>
                  {cat.isActive
                    ? <ToggleRight size={18} className="text-green-500" />
                    : <ToggleLeft size={18} className="text-gray-300" />}
                </button>
                <button onClick={() => openEdit(cat)} className="p-2 rounded-lg hover:bg-gray-100 transition-colors text-gray-500">
                  <Edit2 size={16} />
                </button>
                <button onClick={() => handleDelete(cat)} className="p-2 rounded-lg hover:bg-red-50 transition-colors text-gray-400 hover:text-red-500">
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
