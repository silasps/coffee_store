"use client";

import { useTranslations } from "next-intl";
import { ShoppingCart, Info } from "lucide-react";
import Image from "next/image";
import { LocaleSwitcher } from "@/components/ui/locale-switcher";
import { useCartStore } from "@/lib/cart-store";
import { useState } from "react";
import { CauseModal } from "./cause-modal";

type Props = {
  logoUrl: string | null;
  name: string;
  slogan: string | null;
  causeTitlePt?: string | null;
  causeTitleEn?: string | null;
  causeTextPt?: string | null;
  causeTextEn?: string | null;
  causeDonationPix?: string | null;
  causePaypalUrl?: string | null;
  onCartClick: () => void;
};

export function PublicHeader({
  logoUrl,
  name,
  slogan,
  causeTitlePt,
  causeTitleEn,
  causeTextPt,
  causeTextEn,
  causeDonationPix,
  causePaypalUrl,
  onCartClick,
}: Props) {
  const t = useTranslations("nav");
  const itemCount = useCartStore((s) => s.itemCount());
  const [showCause, setShowCause] = useState(false);

  return (
    <>
      <header
        className="sticky top-0 z-40 w-full"
        style={{ background: "var(--brown-dark)" }}
      >
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center gap-3">
          {/* Logo */}
          <div className="flex-shrink-0">
            {logoUrl ? (
              <Image
                src={logoUrl}
                alt={name}
                width={48}
                height={48}
                className="w-12 h-12 object-contain rounded-full"
              />
            ) : (
              <div
                className="w-12 h-12 rounded-full flex items-center justify-center text-xl font-bold text-white"
                style={{ background: "var(--orange)" }}
              >
                {name.charAt(0)}
              </div>
            )}
          </div>

          {/* Name + slogan */}
          <div className="flex-1 min-w-0">
            <h1 className="text-white font-bold text-base sm:text-lg leading-tight truncate">
              {name}
            </h1>
            {slogan && (
              <p className="text-cream/60 text-xs leading-tight truncate hidden sm:block">
                {slogan}
              </p>
            )}
          </div>

          {/* Right controls */}
          <div className="flex items-center gap-2 flex-shrink-0">
            {/* Nossa Causa button */}
            <button
              onClick={() => setShowCause(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold text-cream/80 hover:text-cream hover:bg-white/10 transition-colors"
            >
              <Info size={14} />
              <span className="hidden sm:inline">{t("cause")}</span>
            </button>

            {/* Language switcher */}
            <LocaleSwitcher />

            {/* Cart */}
            <button
              onClick={onCartClick}
              className="relative flex items-center justify-center w-10 h-10 rounded-full text-white hover:bg-white/10 transition-colors"
              aria-label={t("cart")}
            >
              <ShoppingCart size={20} />
              {itemCount > 0 && (
                <span
                  className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] flex items-center justify-center rounded-full text-white text-[10px] font-bold px-1"
                  style={{ background: "var(--orange)" }}
                >
                  {itemCount > 99 ? "99+" : itemCount}
                </span>
              )}
            </button>
          </div>
        </div>
      </header>

      <CauseModal
        open={showCause}
        onClose={() => setShowCause(false)}
        titlePt={causeTitlePt}
        titleEn={causeTitleEn}
        textPt={causeTextPt}
        textEn={causeTextEn}
        donationPix={causeDonationPix}
        paypalUrl={causePaypalUrl}
      />
    </>
  );
}
