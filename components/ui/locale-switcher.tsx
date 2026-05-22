"use client";

import { useLocale } from "next-intl";
import { usePathname, useRouter } from "next/navigation";
import { useTransition, useState } from "react";
import { CafeLoaderOverlay } from "@/components/ui/cafe-loader";

const LOCALES = [
  { code: "pt", flag: "🇧🇷", label: "PT" },
  { code: "en", flag: "🇺🇸", label: "EN" },
  { code: "es", flag: "🇪🇸", label: "ES" },
];

export function LocaleSwitcher() {
  const locale = useLocale();
  const pathname = usePathname();
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [pendingLocale, setPendingLocale] = useState<string | null>(null);

  function switchLocale(newLocale: string) {
    if (newLocale === locale || isPending) return;
    const segments = pathname.split("/");
    segments[1] = newLocale;
    setPendingLocale(newLocale);
    startTransition(() => {
      router.push(segments.join("/"));
    });
  }

  return (
    <>
      <CafeLoaderOverlay visible={isPending} />

      <div className="flex items-center gap-1">
        {LOCALES.map((l) => (
          <button
            key={l.code}
            onClick={() => switchLocale(l.code)}
            disabled={isPending}
            className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs font-semibold transition-colors ${
              locale === l.code
                ? "bg-orange text-white"
                : "text-cream/70 hover:text-cream hover:bg-white/10"
            } ${isPending ? "opacity-60 cursor-wait" : ""}`}
            aria-label={`Switch to ${l.label}`}
          >
            <span className="text-base leading-none">{l.flag}</span>
            <span className="hidden sm:inline">{l.label}</span>
          </button>
        ))}
      </div>
    </>
  );
}
