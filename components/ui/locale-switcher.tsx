"use client";

import { useLocale } from "next-intl";
import { Link, usePathname } from "@/i18n/navigation";

const LOCALES = [
  { code: "pt", flag: "🇧🇷", label: "PT" },
  { code: "en", flag: "🇺🇸", label: "EN" },
  { code: "es", flag: "🇪🇸", label: "ES" },
];

export function LocaleSwitcher() {
  const locale = useLocale();
  const pathname = usePathname();

  return (
    <div className="flex items-center gap-1">
      {LOCALES.map((l) => (
        <Link
          key={l.code}
          href={pathname}
          locale={l.code as "pt" | "en" | "es"}
          className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs font-semibold transition-colors ${
            locale === l.code
              ? "bg-orange text-white"
              : "text-cream/70 hover:text-cream hover:bg-white/10"
          }`}
          aria-label={`Switch to ${l.label}`}
        >
          <span className="text-base leading-none">{l.flag}</span>
          <span className="hidden sm:inline">{l.label}</span>
        </Link>
      ))}
    </div>
  );
}
