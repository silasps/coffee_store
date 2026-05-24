"use client";

import { useState, useMemo } from "react";
import { useTranslations } from "next-intl";
import { Search, X } from "lucide-react";
import { CategorySidebar, type CategoryNav } from "./category-sidebar";
import { ProductCard, type ProductCardData } from "./product-card";
import { PublicHeader } from "./public-header";
import { CartDrawer } from "@/components/cart/cart-drawer";
import { AnimatePresence, motion } from "framer-motion";
import { useCartStore } from "@/lib/cart-store";

type Props = {
  store: {
    slug: string;
    namePt: string;
    nameEn: string | null;
    nameEs: string | null;
    sloganPt: string | null;
    sloganEn: string | null;
    sloganEs: string | null;
    logoUrl: string | null;
    causeTitlePt: string | null;
    causeTitleEn: string | null;
    causeTextPt: string | null;
    causeTextEn: string | null;
    causeDonationPix: string | null;
    causePaypalUrl: string | null;
  };
  categories: CategoryNav[];
  products: ProductCardData[];
  popularProductIds: string[];
  locale: string;
};

export function MenuBrowser({ store, categories, products, popularProductIds, locale }: Props) {
  const t = useTranslations("menu");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(
    categories.length > 0 ? categories[0].id : null
  );
  const [search, setSearch] = useState("");
  const [cartOpen, setCartOpen] = useState(false);

  // Use cart store to set the storeSlug
  const setStoreSlug = useCartStore((s) => s.setStoreSlug);
  useMemo(() => setStoreSlug(store.slug), [store.slug]);

  const storeName = locale === "en" ? store.nameEn ?? store.namePt
    : locale === "es" ? store.nameEs ?? store.namePt
    : store.namePt;

  const storeSlogan = locale === "en" ? store.sloganEn ?? store.sloganPt
    : locale === "es" ? store.sloganEs ?? store.sloganPt
    : store.sloganPt;

  const filteredProducts = useMemo(() => {
    let list = products;

    if (search.trim()) {
      const norm = (s: string) => s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();
      const q = norm(search);
      list = list.filter(
        (p) =>
          norm(p.namePt).includes(q) ||
          (p.nameEn && norm(p.nameEn).includes(q)) ||
          (p.nameEs && norm(p.nameEs).includes(q)) ||
          (p.descriptionPt && norm(p.descriptionPt).includes(q)) ||
          (p.descriptionEn && norm(p.descriptionEn).includes(q))
      );
    } else if (selectedCategory) {
      if (selectedCategory === "__popular") {
        const pinnedIds = new Set(list.filter((p) => p.tags.includes("POPULAR")).map((p) => p.id));
        const pinned = list.filter((p) => pinnedIds.has(p.id));
        const auto = popularProductIds
          .map((id) => list.find((p) => p.id === id))
          .filter((p): p is ProductCardData => !!p && !pinnedIds.has(p.id));
        list = [...pinned, ...auto].slice(0, 10);
      } else if (selectedCategory === "__suggested") {
        list = list.filter((p) => p.tags.includes("SUGGESTED"));
      } else if (selectedCategory === "__combos") {
        list = list.filter((p) => p.tags.includes("COMBO"));
      } else if (selectedCategory === "__new") {
        list = list.filter((p) => p.tags.includes("NEW"));
      } else {
        // find the category id match from the product list
        // products are filtered server-side by category, so we need to use categoryId
        list = list.filter((p) => (p as ProductCardData & { categoryId: string }).categoryId === selectedCategory);
      }
    }

    return list;
  }, [products, selectedCategory, search]);

  return (
    <div className="flex flex-col min-h-screen" style={{ background: "var(--cream)" }}>
      {/* Header */}
      <PublicHeader
        logoUrl={store.logoUrl}
        name={storeName}
        slogan={storeSlogan}
        storeSlug={store.slug}
        locale={locale}
        causeTitlePt={store.causeTitlePt}
        causeTitleEn={store.causeTitleEn}
        causeTextPt={store.causeTextPt}
        causeTextEn={store.causeTextEn}
        causeDonationPix={store.causeDonationPix}
        causePaypalUrl={store.causePaypalUrl}
        onCartClick={() => setCartOpen(true)}
      />

      {/* Search bar */}
      <div className="sticky top-[72px] z-30 px-4 py-2" style={{ background: "var(--cream)" }}>
        <div className="max-w-6xl mx-auto relative">
          <Search
            size={16}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted"
          />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={t("search")}
            className="w-full pl-9 pr-9 py-2.5 rounded-xl text-sm border focus:outline-none focus:ring-2 transition-shadow"
            style={{
              background: "white",
              borderColor: "var(--cream-dark)",
              color: "var(--text-dark)",
            }}
          />
          {search && (
            <button
              onClick={() => setSearch("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-dark"
            >
              <X size={14} />
            </button>
          )}
        </div>
      </div>

      {/* Main: sidebar + products */}
      <main className="flex-1 max-w-6xl mx-auto w-full px-4 py-3 flex gap-4">
        {/* Category nav — desktop sidebar only (mobile pills rendered below) */}
        {!search && (
          <div className="hidden md:block flex-shrink-0">
            <CategorySidebar
              categories={categories}
              selectedId={selectedCategory}
              onSelect={setSelectedCategory}
            />
          </div>
        )}

        {/* Product grid */}
        <div className="flex-1 min-w-0">
          {/* Mobile category pills */}
          {!search && (
            <div className="md:hidden -mx-4 mb-2">
              <CategorySidebar
                categories={categories}
                selectedId={selectedCategory}
                onSelect={setSelectedCategory}
              />
            </div>
          )}

          {filteredProducts.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <span className="text-4xl mb-3">☕</span>
              <p className="text-text-muted text-sm">{t("empty")}</p>
            </div>
          ) : (
            <motion.div
              layout
              className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3"
            >
              <AnimatePresence mode="popLayout">
                {filteredProducts.map((product, i) => (
                  <ProductCard key={product.id} product={product} priority={i < 4} />
                ))}
              </AnimatePresence>
            </motion.div>
          )}
        </div>
      </main>

      {/* Cart Drawer */}
      <CartDrawer
        open={cartOpen}
        onClose={() => setCartOpen(false)}
        storeSlug={store.slug}
        locale={locale}
      />
    </div>
  );
}
