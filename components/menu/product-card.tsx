"use client";

import { ViewTransition } from "react";
import { useTranslations, useLocale } from "next-intl";
import { Plus, Check, Clock } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import { useParams } from "next/navigation";
import { useCartStore } from "@/lib/cart-store";
import { formatCurrency } from "@/components/ui/format-currency";
import { useState } from "react";

type ComboItem = { productId: string; namePt: string; qty: number; unitPrice: number };

export type ProductCardData = {
  id: string;
  slug: string;
  namePt: string;
  nameEn: string | null;
  nameEs: string | null;
  descriptionPt: string | null;
  descriptionEn: string | null;
  descriptionEs: string | null;
  highlightPt: string | null;
  highlightEn: string | null;
  highlightEs: string | null;
  imageUrl: string | null;
  basePrice: number | null;
  stockQuantity: number | null;
  prepMinutes: number | null;
  isAvailable: boolean;
  tags: string[];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  comboItems?: any;
};

type Props = {
  product: ProductCardData;
  priority?: boolean;
};

export function ProductCard({ product, priority = false }: Props) {
  const t = useTranslations("menu");
  const locale = useLocale();
  const params = useParams<{ storeSlug: string }>();
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
  const comboSavings = product.basePrice != null && comboOriginal > product.basePrice ? comboOriginal - product.basePrice : 0;

  function handleAdd(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
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
  const detailHref = `/${locale}/${params.storeSlug}/produto/${product.slug}`;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={`relative flex flex-col rounded-2xl overflow-hidden shadow-sm border transition-shadow hover:shadow-md ${
        isDisabled ? "opacity-60" : ""
      }`}
      style={{ background: "white", borderColor: "var(--cream-dark)" }}
    >
      {/* Tags badges */}
      {product.tags.length > 0 && (
        <div className="absolute top-2 left-2 z-10 flex flex-wrap gap-1 pointer-events-none">
          {product.tags.includes("POPULAR") && (
            <span
              className="text-[10px] font-bold px-2 py-0.5 rounded-full text-white"
              style={{ background: "var(--orange)" }}
            >
              🔥 {t("popular")}
            </span>
          )}
          {product.tags.includes("FEATURED") && (
            <span
              className="text-[10px] font-bold px-2 py-0.5 rounded-full text-white"
              style={{ background: "var(--brown-mid)" }}
            >
              ⭐ Destaque
            </span>
          )}
          {product.tags.includes("NEW") && (
            <span
              className="text-[10px] font-bold px-2 py-0.5 rounded-full text-white"
              style={{ background: "#059669" }}
            >
              ✨ {t("new")}
            </span>
          )}
        </div>
      )}

      {/* Clickable area: image + text (goes to detail page) */}
      <Link href={detailHref} transitionTypes={["nav-forward"]} className="flex flex-col">
        {/* Image with shared-element morph name */}
        <ViewTransition name={`product-image-${product.id}`} share="morph">
          <div className="relative w-full aspect-[4/3] flex-shrink-0 overflow-hidden bg-cream-dark">
            {product.imageUrl ? (
              <Image
                src={product.imageUrl}
                alt={name}
                fill
                className="object-cover"
                sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
                priority={priority}
              />
            ) : (
              <div
                className="w-full h-full flex items-center justify-center text-5xl"
                style={{ background: "var(--cream-dark)" }}
              >
                ☕
              </div>
            )}

            {isDisabled && (
              <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                <span className="text-white text-sm font-semibold bg-black/60 px-3 py-1 rounded-full">
                  {t("outOfStock")}
                </span>
              </div>
            )}
          </div>
        </ViewTransition>

        {/* Text */}
        <div className="flex flex-col p-3 pb-1.5 gap-1.5">
          {highlight && (
            <p
              className="text-[10px] font-semibold uppercase tracking-wide"
              style={{ color: "var(--orange)" }}
            >
              {highlight}
            </p>
          )}
          <h3 className="font-bold text-sm leading-tight text-text-dark line-clamp-2">
            {name}
          </h3>
          {description && (
            <p className="text-xs text-text-muted line-clamp-2 leading-relaxed">
              {description}
            </p>
          )}
        </div>
      </Link>

      {/* Price + add button (outside link so the button doesn't navigate) */}
      <div className="flex items-center justify-between px-3 pb-3 pt-0">
        <div className="flex flex-col">
          {product.basePrice != null && (
            <div className="flex items-baseline gap-1.5">
              {comboSavings > 0 && (
                <span className="text-[10px] line-through text-text-muted">{formatCurrency(comboOriginal)}</span>
              )}
              <span className="font-bold text-sm" style={{ color: "var(--brown-dark)" }}>
                {formatCurrency(product.basePrice)}
              </span>
            </div>
          )}
          {comboSavings > 0 && (
            <span className="text-[10px] font-semibold text-green-600">
              Economize {formatCurrency(comboSavings)}
            </span>
          )}
          {product.prepMinutes != null && (
            <span className="flex items-center gap-1 text-[10px] text-text-muted">
              <Clock size={10} />
              {t("prep", { min: product.prepMinutes })}
            </span>
          )}
        </div>

        <motion.button
          whileTap={{ scale: 0.9 }}
          onClick={handleAdd}
          disabled={isDisabled}
          className={`flex items-center justify-center w-8 h-8 rounded-full transition-colors flex-shrink-0 ${
            justAdded ? "bg-green-500" : ""
          } ${isDisabled ? "cursor-not-allowed" : "hover:opacity-90"}`}
          style={!justAdded ? { background: "var(--orange)" } : {}}
          aria-label={t("add")}
        >
          {justAdded ? (
            <Check size={16} className="text-white" />
          ) : (
            <Plus size={16} className="text-white" />
          )}
        </motion.button>
      </div>
    </motion.div>
  );
}
