"use client";

import { useState } from "react";
import { Plus, Search, Edit2, Trash2, ToggleLeft, ToggleRight } from "lucide-react";
import { formatCurrency } from "@/components/ui/format-currency";
import Image from "next/image";
import { ProductForm } from "@/components/admin/product-form";

type Product = {
  id: string;
  namePt: string;
  nameEn: string | null;
  nameEs: string | null;
  categoryId: string;
  categoryName: string;
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
  tags: string[];
  sortOrder: number;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  comboItems: any;
};

type Category = { id: string; namePt: string; area: string };

export type SimpleProduct = { id: string; namePt: string; basePrice: number | null; categoryName: string };

type Props = {
  products: Product[];
  categories: Category[];
  storeId: string;
  defaultLocale: string;
  isPaidPlan: boolean;
};

export function ProductsManager({ products: initial, categories, storeId, defaultLocale, isPaidPlan }: Props) {
  const [products, setProducts] = useState(initial);
  const [search, setSearch] = useState("");
  const [selectedCat, setSelectedCat] = useState<string>("all");
  const [modalProduct, setModalProduct] = useState<Product | null | "new">(null);

  async function toggleAvailable(productId: string, current: boolean) {
    try {
      await fetch(`/api/admin/products/${productId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isAvailable: !current }),
      });
      setProducts((prev) => prev.map((p) => (p.id === productId ? { ...p, isAvailable: !current } : p)));
    } catch {}
  }

  async function deleteProduct(productId: string) {
    if (!confirm("Excluir este produto?")) return;
    try {
      await fetch(`/api/admin/products/${productId}`, { method: "DELETE" });
      setProducts((prev) => prev.filter((p) => p.id !== productId));
    } catch {}
  }

  const filtered = products.filter((p) => {
    const matchCat = selectedCat === "all" || p.categoryId === selectedCat;
    const matchSearch =
      !search ||
      p.namePt.toLowerCase().includes(search.toLowerCase()) ||
      (p.descriptionPt?.toLowerCase().includes(search.toLowerCase()) ?? false);
    return matchCat && matchSearch;
  });

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-text-dark">Produtos</h1>
        <button
          onClick={() => setModalProduct("new")}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold text-white transition-opacity hover:opacity-90"
          style={{ background: "var(--orange)" }}
        >
          <Plus size={16} />
          Novo Produto
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 mb-5">
        <div className="relative flex-1 min-w-48">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar produto..."
            className="w-full pl-8 pr-4 py-2.5 text-sm rounded-xl border focus:outline-none"
            style={{ borderColor: "var(--cream-dark)", background: "white" }}
          />
        </div>
        <div className="flex gap-2 flex-wrap">
          <button
            onClick={() => setSelectedCat("all")}
            className="px-3 py-2 rounded-xl text-sm font-medium transition-all"
            style={selectedCat === "all" ? { background: "var(--orange)", color: "white" } : { background: "white", color: "var(--text-muted)", border: "1px solid var(--cream-dark)" }}
          >
            Todos
          </button>
          {categories.map((c) => (
            <button
              key={c.id}
              onClick={() => setSelectedCat(c.id)}
              className="px-3 py-2 rounded-xl text-sm font-medium transition-all"
              style={selectedCat === c.id ? { background: "var(--orange)", color: "white" } : { background: "white", color: "var(--text-muted)", border: "1px solid var(--cream-dark)" }}
            >
              {c.namePt}
            </button>
          ))}
        </div>
      </div>

      {/* Products grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {filtered.length === 0 ? (
          <div className="col-span-full rounded-2xl border p-10 text-center text-sm text-text-muted" style={{ background: "white", borderColor: "var(--cream-dark)" }}>
            Nenhum produto encontrado
          </div>
        ) : (
          filtered.map((product) => (
            <div
              key={product.id}
              className={`rounded-2xl border overflow-hidden transition-opacity ${!product.isAvailable ? "opacity-60" : ""}`}
              style={{ background: "white", borderColor: "var(--cream-dark)" }}
            >
              <div className="relative aspect-[4/3] bg-cream-dark overflow-hidden">
                {product.imageUrl ? (
                  <Image src={product.imageUrl} alt={product.namePt} fill className="object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-4xl">☕</div>
                )}
                {!product.isAvailable && (
                  <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
                    <span className="text-white text-xs font-bold bg-black/50 px-2 py-1 rounded-full">Indisponível</span>
                  </div>
                )}
              </div>

              <div className="p-3">
                <p className="font-semibold text-sm text-text-dark truncate">{product.namePt}</p>
                <p className="text-xs text-text-muted mb-2">{product.categoryName}</p>
                {product.basePrice != null && (
                  <p className="font-bold text-sm" style={{ color: "var(--orange)" }}>
                    {formatCurrency(product.basePrice)}
                  </p>
                )}
                {product.stockQuantity != null && (
                  <p className={`text-xs font-medium mb-1 ${product.stockQuantity === 0 ? "text-red-500" : "text-text-muted"}`}>
                    {product.stockQuantity === 0 ? "Esgotado" : `Estoque: ${product.stockQuantity}`}
                  </p>
                )}
                <div className="flex items-center gap-2 mt-2">
                  <button
                    onClick={() => toggleAvailable(product.id, product.isAvailable)}
                    className="flex items-center gap-1.5 text-xs font-medium transition-colors"
                    style={{ color: product.isAvailable ? "#10B981" : "var(--text-muted)" }}
                  >
                    {product.isAvailable ? <ToggleRight size={16} /> : <ToggleLeft size={16} />}
                    {product.isAvailable ? "Ativo" : "Inativo"}
                  </button>
                  <div className="flex-1" />
                  <button
                    onClick={() => setModalProduct(product)}
                    className="p-1.5 rounded-lg hover:bg-cream-dark transition-colors text-text-muted hover:text-text-dark"
                  >
                    <Edit2 size={14} />
                  </button>
                  <button
                    onClick={() => deleteProduct(product.id)}
                    className="p-1.5 rounded-lg hover:bg-red-50 transition-colors text-text-muted hover:text-red-500"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Product modal */}
      {modalProduct !== null && (
        <ProductForm
          storeId={storeId}
          defaultLocale={defaultLocale}
          categories={categories}
          allProducts={products.map((p) => ({ id: p.id, namePt: p.namePt, basePrice: p.basePrice, categoryName: p.categoryName }))}
          product={modalProduct === "new" ? undefined : modalProduct}
          onClose={() => setModalProduct(null)}
          isPaidPlan={isPaidPlan}
        />
      )}
    </div>
  );
}
