"use client";

import Image from "next/image";
import Link from "next/link";
import { Heart, ExternalLink, ArrowLeft, Copy, Check } from "lucide-react";
import { LocaleSwitcher } from "@/components/ui/locale-switcher";
import { useState } from "react";

function CopyPixButton({ pix }: { pix: string }) {
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    await navigator.clipboard.writeText(pix);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <button
      onClick={handleCopy}
      title="Copiar chave PIX"
      className="flex items-center gap-1.5 mt-3 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all"
      style={{
        background: copied ? "rgba(255,255,255,0.15)" : "rgba(255,255,255,0.08)",
        color: copied ? "#86efac" : "var(--orange-light, #f4a261)",
      }}
    >
      {copied ? <Check size={13} /> : <Copy size={13} />}
      {copied ? "Copiado!" : "Copiar chave"}
    </button>
  );
}

export type BrandStore = {
  namePt: string; nameEn?: string | null; nameEs?: string | null;
  sloganPt?: string | null; sloganEn?: string | null; sloganEs?: string | null;
  logoUrl?: string | null;
  slug: string;
  brandHeroImageUrl?: string | null;
  brandAboutImageUrl?: string | null;
  brandAboutTextPt?: string | null; brandAboutTextEn?: string | null; brandAboutTextEs?: string | null;
  brandJoinTitlePt?: string | null; brandJoinTitleEn?: string | null; brandJoinTitleEs?: string | null;
  brandJoinTextPt?: string | null; brandJoinTextEn?: string | null; brandJoinTextEs?: string | null;
  brandJoinCtaLabel?: string | null; brandJoinCtaUrl?: string | null;
  brandAboutTitlePt?: string | null; brandAboutTitleEn?: string | null; brandAboutTitleEs?: string | null;
  brandAboutVisible?: boolean; brandCauseVisible?: boolean; brandJoinVisible?: boolean;
  causeTitlePt?: string | null; causeTitleEn?: string | null; causeTitleEs?: string | null;
  causeTextPt?: string | null; causeTextEn?: string | null; causeTextEs?: string | null;
  causeDonationPix?: string | null; causePaypalUrl?: string | null;
};

function loc(pt: string | null | undefined, en: string | null | undefined, es: string | null | undefined, locale: string) {
  if (locale === "en") return en || pt || "";
  if (locale === "es") return es || pt || "";
  return pt || "";
}

type Props = { store: BrandStore; locale: string; isPreview?: boolean };

export function BrandPageContent({ store, locale, isPreview = false }: Props) {
  const name    = loc(store.namePt,           store.nameEn,           store.nameEs,           locale);
  const slogan  = loc(store.sloganPt,         store.sloganEn,         store.sloganEs,         locale);
  const about      = loc(store.brandAboutTextPt,  store.brandAboutTextEn,  store.brandAboutTextEs,  locale);
  const aboutTitle = loc(store.brandAboutTitlePt, store.brandAboutTitleEn, store.brandAboutTitleEs, locale) || "Nossa história";
  const joinT   = loc(store.brandJoinTitlePt, store.brandJoinTitleEn, store.brandJoinTitleEs, locale);
  const joinTxt = loc(store.brandJoinTextPt,  store.brandJoinTextEn,  store.brandJoinTextEs,  locale);
  const causeT  = loc(store.causeTitlePt,     store.causeTitleEn,     store.causeTitleEs,     locale);
  const causeTxt= loc(store.causeTextPt,      store.causeTextEn,      store.causeTextEs,      locale);

  const hasCause = (store.brandCauseVisible !== false) && !!(causeT || causeTxt || store.causeDonationPix || store.causePaypalUrl);
  const hasAbout = (store.brandAboutVisible !== false) && !!(about || store.brandAboutImageUrl);
  const hasJoin  = (store.brandJoinVisible  !== false) && !!(joinT || joinTxt || store.brandJoinCtaUrl);

  return (
    <div className="min-h-screen" style={{ background: "var(--brown-dark)", color: "var(--cream)" }}>
      {/* ── HERO ─────────────────────────────── */}
      <section className="relative min-h-[60vh] flex flex-col items-center justify-center text-center px-6 py-20">
        {store.brandHeroImageUrl && (
          <>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={store.brandHeroImageUrl} alt="" className="absolute inset-0 w-full h-full object-cover" />
            <div className="absolute inset-0 bg-black/55" />
          </>
        )}

        {/* back link (only on real page, not preview) */}
        {!isPreview && (
          <Link
            href={`/${locale}/${store.slug}`}
            className="absolute top-5 left-5 flex items-center gap-1.5 text-cream/60 hover:text-cream text-sm transition-colors"
          >
            <ArrowLeft size={15} /> Cardápio
          </Link>
        )}

        {/* locale switcher */}
        {!isPreview && (
          <div className="absolute top-5 right-5">
            <LocaleSwitcher />
          </div>
        )}

        <div className="relative z-10 flex flex-col items-center gap-4 max-w-xl">
          {store.logoUrl && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={store.logoUrl} alt={name} className="w-20 h-20 rounded-full object-contain" style={{ background: "rgba(255,255,255,0.08)" }} />
          )}
          <h1 className="text-4xl sm:text-5xl font-bold text-white leading-tight">{name || "Nome da loja"}</h1>
          {slogan && <p className="text-lg text-cream/70">{slogan}</p>}
          {!isPreview && (
            <Link
              href={`/${locale}/${store.slug}`}
              className="mt-2 px-7 py-3 rounded-full text-sm font-semibold text-white transition-opacity hover:opacity-90"
              style={{ background: "var(--orange)" }}
            >
              Ver cardápio →
            </Link>
          )}
        </div>
      </section>

      {/* ── SOBRE / HISTÓRIA ─────────────────── */}
      {hasAbout && (
        <section className="py-16 px-6" style={{ background: "var(--brown-mid, #4a2800)" }}>
          <div className="max-w-4xl mx-auto">
            <div className={`flex flex-col gap-10 items-center ${store.brandAboutImageUrl ? "md:flex-row" : ""}`}>
              {store.brandAboutImageUrl && (
                <div className="w-full md:w-[45%] flex-shrink-0">
                  <div className="relative aspect-[4/3] rounded-2xl overflow-hidden shadow-xl">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={store.brandAboutImageUrl} alt="Nossa história" className="w-full h-full object-cover" />
                  </div>
                </div>
              )}
              {about && (
                <div className="flex-1 space-y-4">
                  <h2 className="text-2xl font-bold text-white">{aboutTitle}</h2>
                  <p className="text-cream/75 leading-relaxed whitespace-pre-line">{about}</p>
                </div>
              )}
            </div>
          </div>
        </section>
      )}

      {/* ── CAUSA ────────────────────────────── */}
      {hasCause && (
        <section className="py-16 px-6" style={{ background: "var(--brown-dark)" }}>
          <div className="max-w-2xl mx-auto text-center">
            <div
              className="w-14 h-14 rounded-full mx-auto mb-6 flex items-center justify-center"
              style={{ background: "var(--orange)" }}
            >
              <Heart size={26} className="text-white" fill="white" />
            </div>
            {causeT && <h2 className="text-2xl font-bold text-white mb-4">{causeT}</h2>}
            {causeTxt && <p className="text-cream/70 leading-relaxed mb-8 text-left sm:text-center">{causeTxt}</p>}

            {(store.causeDonationPix || store.causePaypalUrl) && (
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                {store.causeDonationPix && (
                  <div className="rounded-2xl px-6 py-5 text-left" style={{ background: "var(--brown-mid, #4a2800)" }}>
                    <p className="text-cream/50 text-xs mb-1 font-semibold uppercase tracking-wider">Chave PIX</p>
                    <p className="font-mono text-sm font-semibold break-all" style={{ color: "var(--orange-light, #f4a261)" }}>
                      {store.causeDonationPix}
                    </p>
                    {!isPreview && <CopyPixButton pix={store.causeDonationPix} />}
                  </div>
                )}
                {store.causePaypalUrl && (
                  <a
                    href={isPreview ? "#" : store.causePaypalUrl}
                    target={isPreview ? undefined : "_blank"}
                    rel="noopener noreferrer"
                    className="flex items-center justify-center gap-2 px-6 py-5 rounded-2xl text-sm font-bold text-white transition-opacity hover:opacity-90"
                    style={{ background: "var(--orange)" }}
                  >
                    PayPal <ExternalLink size={14} />
                  </a>
                )}
              </div>
            )}
          </div>
        </section>
      )}

      {/* ── FAÇA PARTE ───────────────────────── */}
      {hasJoin && (
        <section className="py-20 px-6 text-center" style={{ background: "var(--brown-mid, #4a2800)" }}>
          <div className="max-w-xl mx-auto space-y-5">
            {joinT && <h2 className="text-3xl font-bold text-white">{joinT}</h2>}
            {joinTxt && <p className="text-cream/70 leading-relaxed">{joinTxt}</p>}
            {store.brandJoinCtaUrl && (
              <a
                href={isPreview ? "#" : store.brandJoinCtaUrl}
                target={isPreview ? undefined : "_blank"}
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-8 py-4 rounded-full text-base font-bold text-white transition-opacity hover:opacity-90 mt-2"
                style={{ background: "var(--orange)" }}
              >
                {store.brandJoinCtaLabel || "Saiba mais"} <ExternalLink size={15} />
              </a>
            )}
          </div>
        </section>
      )}

      {/* placeholder when nothing is filled */}
      {isPreview && !hasAbout && !hasCause && !hasJoin && (
        <div className="py-20 text-center text-cream/30 text-sm">
          Preencha os campos ao lado para ver o preview da página
        </div>
      )}
    </div>
  );
}
