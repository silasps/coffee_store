"use client";

import { ViewTransition } from "react";
import { useTranslations } from "next-intl";
import { ArrowLeft, Clock, Plus, Check, ShoppingBag } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import { useCartStore } from "@/lib/cart-store";
import { formatCurrency } from "@/components/ui/format-currency";
import { useState } from "react";
import type { ProductCardData } from "./product-card";

type ComboItem = { productId: string; namePt: string; qty: number; unitPrice: number };

type Props = {
  product: ProductCardData;
  locale: string;
  storeSlug: string;
};

export function ProductDetailClient({ product, locale, storeSlug }: Props) {
  const t = useTranslations("menu");
  const addItem = useCartStore((s) => s.addItem);
  const items = useCartStore((s) => s.items);
  const [justAdded, setJustAdded] = useState(false);

  const inCart = items.some((i) => i.productId === product.id);

  function getName() {
    if (locale === "en") return product.nameEn ?? product.namePt;
    if (locale === "es") return product.nameEs ?? product.namePt;
    return product.namePt;
  }

  function getDescription() {
    if (locale === "en") return product.descriptionEn ?? product.descriptionPt;
    if (locale === "es") return product.descriptionEs ?? product.descriptionPt;
    return product.descriptionPt;
  }

  function getHighlight() {
    if (locale === "en") return product.highlightEn ?? product.highlightPt;
    if (locale === "es") return product.highlightEs ?? product.highlightPt;
    return product.highlightPt;
  }

  const isOutOfStock = product.stockQuantity === 0;
  const isDisabled = !product.isAvailable || isOutOfStock;

  const comboItems: ComboItem[] = Array.isArray(product.comboItems) ? product.comboItems : [];
  const comboOriginal = comboItems.reduce((s, i) => s + i.qty * i.unitPrice, 0);
  const comboSavings =
    product.basePrice != null && comboOriginal > product.basePrice
      ? comboOriginal - product.basePrice
      : 0;

  function handleAdd() {
    if (isDisabled) return;
    addItem({
      id: product.id,
      productId: product.id,
      productSlug: product.slug,
      name: getName(),
      imageUrl: product.imageUrl,
      unitPrice: product.basePrice ?? 0,
    });
    setJustAdded(true);
    setTimeout(() => setJustAdded(false), 1500);
  }

  const name = getName();
  const description = getDescription();
  const highlight = getHighlight();
  const menuHref = `/${locale}/${storeSlug}`;

  return (
    <div className="flex flex-col min-h-screen" style={{ background: "var(--cream)" }}>
      {/* Top bar */}
      <div
        className="sticky top-0 z-30 flex items-center justify-between px-4 h-14"
        style={{ background: "var(--cream)", borderBottom: "1px solid var(--cream-dark)" }}
      >
        <Link
          href={menuHref}
          transitionTypes={["nav-back"]}
          className="flex items-center gap-2 text-sm font-medium"
          style={{ color: "var(--brown-dark)" }}
        >
          <ArrowLeft size={18} />
          {t("back")}
        </Link>

        {inCart && (
          <span className="flex items-center gap-1 text-xs font-semibold" style={{ color: "var(--orange)" }}>
            <ShoppingBag size={14} />
            {t("added")}
          </span>
        )}
      </div>

      {/* Hero image — same ViewTransition name as the card */}
      <ViewTransition name={`product-image-${product.id}`} share="morph">
        <div className="relative w-full aspect-[4/3] flex-shrink-0 overflow-hidden" style={{ background: "var(--cream-dark)" }}>
          {product.imageUrl ? (
            <Image
              src={product.imageUrl}
              alt={name}
              fill
              className="object-cover"
              sizes="100vw"
              priority
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-7xl">
              ☕
            </div>
          )}

          {isDisabled && (
            <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
              <span className="text-white text-base font-semibold bg-black/60 px-4 py-2 rounded-full">
                {t("outOfStock")}
              </span>
            </div>
          )}
        </div>
      </ViewTransition>

      {/* Content */}
      <ViewTransition
        enter={{ "nav-forward": "slide-up", default: "none" }}
        exit={{ "nav-back": "slide-down", default: "none" }}
        default="none"
      >
        <div className="flex flex-col flex-1 px-5 pt-5 pb-32 gap-4">
          {/* Tags */}
          {product.tags.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {product.tags.includes("POPULAR") && (
                <span className="text-xs font-bold px-3 py-1 rounded-full text-white" style={{ background: "var(--orange)" }}>
                  🔥 {t("popular")}
                </span>
              )}
              {product.tags.includes("FEATURED") && (
                <span className="text-xs font-bold px-3 py-1 rounded-full text-white" style={{ background: "var(--brown-mid)" }}>
                  ⭐ Destaque
                </span>
              )}
              {product.tags.includes("NEW") && (
                <span className="text-xs font-bold px-3 py-1 rounded-full text-white" style={{ background: "#059669" }}>
                  ✨ {t("new")}
                </span>
              )}
            </div>
          )}

          {/* Highlight */}
          {highlight && (
            <p className="text-sm font-semibold uppercase tracking-wide" style={{ color: "var(--orange)" }}>
              {highlight}
            </p>
          )}

          {/* Name */}
          <h1 className="text-2xl font-bold leading-tight" style={{ color: "var(--text-dark)" }}>
            {name}
          </h1>

          {/* Description */}
          {description && (
            <p className="text-sm leading-relaxed" style={{ color: "var(--text-muted)" }}>
              {description}
            </p>
          )}

          {/* Prep time */}
          {product.prepMinutes != null && (
            <span className="flex items-center gap-1.5 text-sm" style={{ color: "var(--text-muted)" }}>
              <Clock size={14} />
              {t("prep", { min: product.prepMinutes })}
            </span>
          )}

          {/* Combo items */}
          {comboItems.length > 0 && (
            <div className="rounded-xl p-4 flex flex-col gap-2" style={{ background: "var(--cream-dark)" }}>
              <p className="text-xs font-bold uppercase tracking-wide" style={{ color: "var(--brown-mid)" }}>
                {t("comboIncludes")}
              </p>
              {comboItems.map((item) => (
                <div key={item.productId} className="flex justify-between text-sm">
                  <span style={{ color: "var(--text-dark)" }}>
                    {item.qty}× {item.namePt}
                  </span>
                  <span style={{ color: "var(--text-muted)" }}>
                    {formatCurrency(item.qty * item.unitPrice)}
                  </span>
                </div>
              ))}
              {comboSavings > 0 && (
                <div className="pt-1 mt-1 border-t flex justify-between text-sm font-semibold" style={{ borderColor: "var(--brown-light)", color: "#059669" }}>
                  <span>{t("savings")}</span>
                  <span>{formatCurrency(comboSavings)}</span>
                </div>
              )}
            </div>
          )}
        </div>
      </ViewTransition>

      {/* Sticky bottom bar */}
      <div
        className="fixed bottom-0 left-0 right-0 z-40 px-5 py-4 flex items-center justify-between gap-4"
        style={{
          background: "white",
          borderTop: "1px solid var(--cream-dark)",
          boxShadow: "0 -4px 16px rgba(58,26,0,0.08)",
        }}
      >
        {/* Price */}
        <div className="flex flex-col">
          {product.basePrice != null && (
            <div className="flex items-baseline gap-2">
              {comboSavings > 0 && (
                <span className="text-sm line-through" style={{ color: "var(--text-muted)" }}>
                  {formatCurrency(comboOriginal)}
                </span>
              )}
              <span className="text-2xl font-bold" style={{ color: "var(--brown-dark)" }}>
                {formatCurrency(product.basePrice)}
              </span>
            </div>
          )}
          {comboSavings > 0 && (
            <span className="text-xs font-semibold text-green-600">
              Economize {formatCurrency(comboSavings)}
            </span>
          )}
        </div>

        {/* Add to cart */}
        <motion.button
          whileTap={{ scale: 0.95 }}
          onClick={handleAdd}
          disabled={isDisabled}
          className={`flex items-center gap-2 px-6 py-3 rounded-2xl font-bold text-sm text-white transition-colors flex-shrink-0 ${
            isDisabled ? "cursor-not-allowed opacity-60" : "hover:opacity-90"
          }`}
          style={{ background: justAdded ? "#059669" : "var(--orange)" }}
        >
          {justAdded ? (
            <>
              <Check size={18} />
              {t("added")}
            </>
          ) : (
            <>
              <Plus size={18} />
              {t("add")}
            </>
          )}
        </motion.button>
      </div>
    </div>
  );
}
