"use client";

import { useTranslations, useLocale } from "next-intl";
import { X, Heart } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";

type Props = {
  open: boolean;
  onClose: () => void;
  titlePt?: string | null;
  titleEn?: string | null;
  textPt?: string | null;
  textEn?: string | null;
  donationPix?: string | null;
  paypalUrl?: string | null;
};

export function CauseModal({
  open,
  onClose,
  titlePt,
  titleEn,
  textPt,
  textEn,
  donationPix,
  paypalUrl,
}: Props) {
  const t = useTranslations("cause");
  const locale = useLocale();

  const title = locale === "pt" ? titlePt : titleEn;
  const text = locale === "pt" ? textPt : textEn;

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 z-50 backdrop-blur-sm"
            onClick={onClose}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="fixed inset-x-4 top-1/2 -translate-y-1/2 z-50 max-w-md mx-auto rounded-2xl overflow-hidden shadow-2xl"
            style={{ background: "var(--brown-dark)" }}
          >
            {/* Header */}
            <div className="relative p-6 pb-4">
              <button
                onClick={onClose}
                className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center rounded-full text-cream/60 hover:text-cream hover:bg-white/10 transition-colors"
              >
                <X size={18} />
              </button>

              <div
                className="w-12 h-12 rounded-full flex items-center justify-center mb-4"
                style={{ background: "var(--orange)" }}
              >
                <Heart size={22} className="text-white" fill="white" />
              </div>

              <h2 className="text-white font-bold text-xl leading-tight mb-1">
                {title ?? t("title")}
              </h2>
              <p className="text-cream/60 text-sm">{t("subtitle")}</p>
            </div>

            {/* Body */}
            <div className="px-6 pb-4">
              <p className="text-cream/80 text-sm leading-relaxed">
                {text ?? t("body")}
              </p>
            </div>

            {/* Donation CTAs */}
            {(donationPix || paypalUrl) && (
              <div className="px-6 pb-6 flex flex-col gap-3">
                <p className="text-cream/60 text-xs font-semibold uppercase tracking-wider">
                  {t("donate")}
                </p>

                {donationPix && (
                  <div
                    className="rounded-xl p-4"
                    style={{ background: "var(--brown-mid)" }}
                  >
                    <p className="text-cream/60 text-xs mb-1">{t("donateDesc")}</p>
                    <p
                      className="font-mono text-sm font-semibold break-all"
                      style={{ color: "var(--orange-light)" }}
                    >
                      {donationPix}
                    </p>
                  </div>
                )}

                {paypalUrl && (
                  <a
                    href={paypalUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full py-3 rounded-xl text-center text-sm font-semibold text-white transition-opacity hover:opacity-90"
                    style={{ background: "var(--orange)" }}
                  >
                    PayPal →
                  </a>
                )}
              </div>
            )}

            {/* Close */}
            <div className="px-6 pb-6">
              <button
                onClick={onClose}
                className="w-full py-3 rounded-xl text-center text-sm font-semibold text-cream/60 hover:text-cream transition-colors"
                style={{ background: "var(--brown-mid)" }}
              >
                {t("close")}
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
