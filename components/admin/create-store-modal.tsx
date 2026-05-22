"use client";

import { useState, useRef, useEffect } from "react";
import { X, Plus, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";

type Props = {
  locale: string;
  onClose: () => void;
};

export function CreateStoreModal({ locale, onClose }: Props) {
  const router = useRouter();
  const [namePt, setNamePt] = useState("");
  const [slug, setSlug] = useState("");
  const [slugEdited, setSlugEdited] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  function slugify(text: string) {
    return text
      .toLowerCase()
      .normalize("NFD")
      .replace(/[̀-ͯ]/g, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "");
  }

  function handleNameChange(value: string) {
    setNamePt(value);
    if (!slugEdited) {
      setSlug(slugify(value));
    }
  }

  function handleSlugChange(value: string) {
    setSlugEdited(true);
    setSlug(slugify(value));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!namePt.trim()) return;

    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/admin/stores", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ namePt: namePt.trim(), slug: slug.trim() || undefined }),
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error ?? "Erro ao criar loja");
        return;
      }

      const store = await res.json();
      router.push(`/${locale}/painel/${store.id}`);
      router.refresh();
    } catch {
      setError("Erro inesperado. Tente novamente.");
    } finally {
      setLoading(false);
    }
  }

  function handleBackdropClick(e: React.MouseEvent<HTMLDivElement>) {
    if (e.target === e.currentTarget) onClose();
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: "rgba(0,0,0,0.5)" }}
      onClick={handleBackdropClick}
    >
      <div
        className="w-full max-w-md rounded-2xl shadow-xl overflow-hidden"
        style={{ background: "white" }}
      >
        {/* Header */}
        <div
          className="flex items-center justify-between px-6 py-4"
          style={{ background: "var(--brown-dark)" }}
        >
          <h2 className="text-white font-bold text-lg">Nova Loja</h2>
          <button
            onClick={onClose}
            className="text-cream/60 hover:text-white transition-colors"
            aria-label="Fechar"
          >
            <X size={20} />
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit} className="px-6 py-5 flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-semibold text-text-dark">
              Nome da loja <span style={{ color: "var(--orange)" }}>*</span>
            </label>
            <input
              ref={inputRef}
              type="text"
              value={namePt}
              onChange={(e) => handleNameChange(e.target.value)}
              placeholder="Ex: Café Central"
              className="w-full border rounded-xl px-4 py-2.5 text-sm outline-none transition-colors"
              style={{
                borderColor: "var(--cream-dark)",
                color: "var(--text-dark)",
              }}
              onFocus={(e) => (e.target.style.borderColor = "var(--orange)")}
              onBlur={(e) => (e.target.style.borderColor = "var(--cream-dark)")}
              disabled={loading}
              required
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-semibold text-text-dark">
              URL (slug)
            </label>
            <div className="flex items-center border rounded-xl overflow-hidden" style={{ borderColor: "var(--cream-dark)" }}>
              <span className="px-3 text-sm text-text-muted bg-gray-50 border-r" style={{ borderColor: "var(--cream-dark)", paddingTop: "0.625rem", paddingBottom: "0.625rem" }}>
                /
              </span>
              <input
                type="text"
                value={slug}
                onChange={(e) => handleSlugChange(e.target.value)}
                placeholder="cafe-central"
                className="flex-1 px-3 py-2.5 text-sm outline-none"
                style={{ color: "var(--text-dark)" }}
                disabled={loading}
              />
            </div>
            <p className="text-xs text-text-muted">
              Endereço público da loja. Gerado automaticamente pelo nome.
            </p>
          </div>

          {error && (
            <p className="text-sm text-red-500 bg-red-50 rounded-xl px-4 py-2.5">{error}</p>
          )}

          <div className="flex gap-3 pt-1">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 rounded-xl text-sm font-semibold border transition-colors hover:bg-gray-50"
              style={{ borderColor: "var(--cream-dark)", color: "var(--text-muted)" }}
              disabled={loading}
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading || !namePt.trim()}
              className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-50"
              style={{ background: "var(--orange)" }}
            >
              {loading ? (
                <Loader2 size={16} className="animate-spin" />
              ) : (
                <Plus size={16} />
              )}
              {loading ? "Criando..." : "Criar loja"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
