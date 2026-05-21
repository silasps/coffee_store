"use client";

import { useTranslations } from "next-intl";
import { X, Minus, Plus, Trash2, ShoppingBag } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import Image from "next/image";
import { useCartStore } from "@/lib/cart-store";
import { formatCurrency } from "@/components/ui/format-currency";
import { useRouter } from "next/navigation";

type Props = {
  open: boolean;
  onClose: () => void;
  storeSlug: string;
  locale: string;
};

export function CartDrawer({ open, onClose, storeSlug, locale }: Props) {
  const t = useTranslations("cart");
  const router = useRouter();

  const items = useCartStore((s) => s.items);
  const total = useCartStore((s) => s.total());
  const updateQuantity = useCartStore((s) => s.updateQuantity);
  const updateNotes = useCartStore((s) => s.updateNotes);
  const removeItem = useCartStore((s) => s.removeItem);

  function handleCheckout() {
    onClose();
    router.push(`/${locale}/${storeSlug}/checkout`);
  }

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 z-50 backdrop-blur-sm"
            onClick={onClose}
          />

          {/* Drawer */}
          <motion.div
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 30, stiffness: 300 }}
            className="fixed right-0 top-0 h-full w-full sm:w-[400px] z-50 flex flex-col shadow-2xl"
            style={{ background: "var(--cream)" }}
          >
            {/* Header */}
            <div
              className="flex items-center justify-between px-5 py-4 border-b"
              style={{ borderColor: "var(--cream-dark)" }}
            >
              <div className="flex items-center gap-2">
                <ShoppingBag size={20} style={{ color: "var(--orange)" }} />
                <h2 className="font-bold text-lg text-text-dark">{t("title")}</h2>
                {items.length > 0 && (
                  <span
                    className="text-xs font-bold px-2 py-0.5 rounded-full text-white"
                    style={{ background: "var(--orange)" }}
                  >
                    {items.length}
                  </span>
                )}
              </div>
              <button
                onClick={onClose}
                className="w-8 h-8 flex items-center justify-center rounded-full text-text-muted hover:text-text-dark hover:bg-cream-dark transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            {/* Items */}
            <div className="flex-1 overflow-y-auto px-5 py-4 flex flex-col gap-4">
              {items.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-center gap-3">
                  <span className="text-5xl">🛒</span>
                  <p className="font-semibold text-text-dark">{t("empty")}</p>
                  <p className="text-sm text-text-muted">{t("emptyDesc")}</p>
                </div>
              ) : (
                items.map((item) => (
                  <div
                    key={item.id}
                    className="rounded-xl p-3 border"
                    style={{
                      background: "white",
                      borderColor: "var(--cream-dark)",
                    }}
                  >
                    <div className="flex gap-3">
                      {/* Image */}
                      <div className="w-14 h-14 rounded-lg overflow-hidden flex-shrink-0 bg-cream-dark">
                        {item.imageUrl ? (
                          <Image
                            src={item.imageUrl}
                            alt={item.name}
                            width={56}
                            height={56}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-2xl">
                            ☕
                          </div>
                        )}
                      </div>

                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-sm text-text-dark truncate">
                          {item.name}
                        </p>
                        <p className="text-sm font-bold" style={{ color: "var(--orange)" }}>
                          {formatCurrency(item.unitPrice * item.quantity)}
                        </p>
                      </div>

                      {/* Remove */}
                      <button
                        onClick={() => removeItem(item.id)}
                        className="flex-shrink-0 w-6 h-6 flex items-center justify-center text-text-muted hover:text-red-500 transition-colors"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>

                    {/* Quantity controls */}
                    <div className="flex items-center gap-2 mt-2.5">
                      <button
                        onClick={() => updateQuantity(item.id, item.quantity - 1)}
                        className="w-7 h-7 flex items-center justify-center rounded-full border text-text-dark hover:bg-cream-dark transition-colors"
                        style={{ borderColor: "var(--cream-dark)" }}
                      >
                        <Minus size={12} />
                      </button>
                      <span className="w-6 text-center text-sm font-bold text-text-dark">
                        {item.quantity}
                      </span>
                      <button
                        onClick={() => updateQuantity(item.id, item.quantity + 1)}
                        className="w-7 h-7 flex items-center justify-center rounded-full border text-white transition-colors"
                        style={{
                          background: "var(--orange)",
                          borderColor: "var(--orange)",
                        }}
                      >
                        <Plus size={12} />
                      </button>

                      <div className="flex-1 ml-1">
                        <input
                          type="text"
                          value={item.notes}
                          onChange={(e) => updateNotes(item.id, e.target.value)}
                          placeholder={t("notesPlaceholder")}
                          className="w-full text-xs px-2 py-1.5 rounded-lg border focus:outline-none focus:ring-1 transition-shadow"
                          style={{
                            borderColor: "var(--cream-dark)",
                            color: "var(--text-dark)",
                          }}
                        />
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Footer */}
            {items.length > 0 && (
              <div
                className="px-5 py-4 border-t flex flex-col gap-3"
                style={{ borderColor: "var(--cream-dark)" }}
              >
                <div className="flex justify-between text-sm text-text-muted">
                  <span>{t("subtotal")}</span>
                  <span className="font-semibold text-text-dark">
                    {formatCurrency(total)}
                  </span>
                </div>
                <div className="flex justify-between text-base font-bold">
                  <span style={{ color: "var(--text-dark)" }}>{t("total")}</span>
                  <span style={{ color: "var(--orange)" }}>
                    {formatCurrency(total)}
                  </span>
                </div>
                <button
                  onClick={handleCheckout}
                  className="w-full py-4 rounded-xl text-white font-bold text-base transition-opacity hover:opacity-90 active:scale-[0.98]"
                  style={{ background: "var(--orange)" }}
                >
                  {t("checkout")} →
                </button>
              </div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
