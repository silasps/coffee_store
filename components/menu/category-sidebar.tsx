"use client";

import { useTranslations, useLocale } from "next-intl";
import { motion } from "framer-motion";
import { useRef, useState, useEffect, useCallback } from "react";

export type CategoryNav = {
  id: string;
  slug: string;
  namePt: string;
  nameEn: string | null;
  nameEs: string | null;
  iconEmoji: string | null;
  accentColor: string | null;
  productCount: number;
};

type SpecialCategory = {
  id: string;
  label: string;
  icon: string;
};

type Props = {
  categories: CategoryNav[];
  selectedId: string | null;
  onSelect: (id: string | null) => void;
};

const SPECIAL_CATEGORIES: SpecialCategory[] = [
  { id: "__popular", label: "popular", icon: "🔥" },
  { id: "__suggested", label: "suggested", icon: "⭐" },
  { id: "__combos", label: "combos", icon: "🎁" },
  { id: "__new", label: "new", icon: "✨" },
];

export function CategorySidebar({ categories, selectedId, onSelect }: Props) {
  const t = useTranslations("menu");
  const locale = useLocale();
  const scrollRef = useRef<HTMLDivElement>(null);
  const [showRightFade, setShowRightFade] = useState(true);

  const checkScroll = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    const atEnd = el.scrollLeft + el.clientWidth >= el.scrollWidth - 4;
    setShowRightFade(!atEnd);
  }, []);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    checkScroll();
    el.addEventListener("scroll", checkScroll, { passive: true });
    return () => el.removeEventListener("scroll", checkScroll);
  }, [checkScroll]);

  function getCategoryName(cat: CategoryNav) {
    if (locale === "en") return cat.nameEn ?? cat.namePt;
    if (locale === "es") return cat.nameEs ?? cat.namePt;
    return cat.namePt;
  }

  const allItems = [
    ...SPECIAL_CATEGORIES.map((s) => ({
      id: s.id,
      label: t(s.label as "popular" | "suggested" | "combos" | "new"),
      icon: s.icon,
      accent: "var(--orange)",
    })),
    ...categories.map((c) => ({
      id: c.id,
      label: getCategoryName(c),
      icon: c.iconEmoji ?? "☕",
      accent: c.accentColor ?? "var(--brown-mid)",
    })),
  ];

  return (
    <>
      {/* Desktop: vertical sidebar */}
      <aside className="hidden md:flex flex-col w-48 lg:w-56 flex-shrink-0">
        <nav className="sticky top-[72px] flex flex-col gap-1 max-h-[calc(100vh-80px)] overflow-y-auto hide-scrollbar pb-4">
          {allItems.map((item) => {
            const isActive = selectedId === item.id || (!selectedId && item.id === allItems[0]?.id);
            return (
              <button
                key={item.id}
                onClick={() => onSelect(item.id)}
                className={`flex items-center gap-3 px-3 py-3 rounded-xl text-left text-sm font-medium transition-all ${
                  isActive
                    ? "text-white shadow-sm"
                    : "text-text-muted hover:text-text-dark hover:bg-cream-dark"
                }`}
                style={isActive ? { background: item.accent } : {}}
              >
                <span className="text-lg leading-none flex-shrink-0">{item.icon}</span>
                <span className="truncate leading-tight">{item.label}</span>
              </button>
            );
          })}
        </nav>
      </aside>

      {/* Mobile: horizontal pill strip */}
      <div className="md:hidden relative">
        <div
          ref={scrollRef}
          className="flex gap-2 overflow-x-auto hide-scrollbar py-2 px-4"
        >
          {allItems.map((item) => {
            const isActive = selectedId === item.id || (!selectedId && item.id === allItems[0]?.id);
            return (
              <button
                key={item.id}
                onClick={() => onSelect(item.id)}
                className={`flex-shrink-0 flex items-center gap-1.5 px-3 py-2 rounded-full text-sm font-medium transition-all whitespace-nowrap ${
                  isActive ? "text-white shadow-sm" : "text-text-muted bg-cream-dark hover:bg-brown-light/20"
                }`}
                style={isActive ? { background: item.accent } : {}}
              >
                <span className="text-sm">{item.icon}</span>
                <span>{item.label}</span>
              </button>
            );
          })}
        </div>
        {/* Right fade hint — hides when scrolled to end */}
        <div
          className="pointer-events-none absolute inset-y-0 right-0 w-12 transition-opacity duration-300"
          style={{
            background: "linear-gradient(to right, transparent, var(--cream))",
            opacity: showRightFade ? 1 : 0,
          }}
        />
      </div>
    </>
  );
}
