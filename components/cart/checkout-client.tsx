"use client";

import { useState, useEffect } from "react";
import { useTranslations, useLocale } from "next-intl";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useRouter } from "next/navigation";
import { ArrowLeft, QrCode, CreditCard, Link, Store } from "lucide-react";
import { useCartStore } from "@/lib/cart-store";
import { formatCurrency } from "@/components/ui/format-currency";
import { CafeLoaderOverlay } from "@/components/ui/cafe-loader";

const schema = z.object({
  customerName: z.string().min(2),
  tableLabel: z.string().optional(),
  notes: z.string().optional(),
  paymentMethod: z.enum(["PIX", "CARD_ONLINE", "PAY_LINK", "PAY_AT_COUNTER"]),
});

type FormData = z.infer<typeof schema>;

type PaymentOption = {
  id: FormData["paymentMethod"];
  icon: React.ReactNode;
  labelKey: "pix" | "card" | "payLink" | "counter";
  descKey: "pixDesc" | "cardDesc" | "payLinkDesc" | "counterDesc";
};

// TODO: set PAYMENTS_ENABLED = true when ready to re-enable online payment methods
const PAYMENTS_ENABLED = false;

const PAYMENT_OPTIONS: PaymentOption[] = [
  { id: "PIX", icon: <QrCode size={20} />, labelKey: "pix", descKey: "pixDesc" },
  { id: "CARD_ONLINE", icon: <CreditCard size={20} />, labelKey: "card", descKey: "cardDesc" },
  { id: "PAY_LINK", icon: <Link size={20} />, labelKey: "payLink", descKey: "payLinkDesc" },
  { id: "PAY_AT_COUNTER", icon: <Store size={20} />, labelKey: "counter", descKey: "counterDesc" },
];

type Props = {
  store: {
    id: string;
    slug: string;
    namePt: string;
    nameEn: string | null;
    logoUrl: string | null;
  };
  locale: string;
};

export function CheckoutClient({ store, locale }: Props) {
  const t = useTranslations("checkout");
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);

  const items = useCartStore((s) => s.items);
  const total = useCartStore((s) => s.total());
  const clearCart = useCartStore((s) => s.clearCart);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { paymentMethod: PAYMENTS_ENABLED ? "PIX" : "PAY_AT_COUNTER" },
  });

  const selectedPayment = watch("paymentMethod");

  useEffect(() => {
    if (items.length === 0) {
      router.replace(`/${locale}/${store.slug}`);
    }
  }, [items.length, locale, store.slug, router]);

  if (items.length === 0) return null;

  async function onSubmit(data: FormData) {
    setSubmitting(true);
    try {
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          storeId: store.id,
          storeSlug: store.slug,
          ...data,
          items: items.map((i) => ({
            productId: i.productId,
            productSlug: i.productSlug,
            productNamePt: i.name,
            quantity: i.quantity,
            unitPrice: i.unitPrice,
            totalPrice: i.unitPrice * i.quantity,
            notes: i.notes,
          })),
          subtotal: total,
          total: total,
          channel: "TOTEM",
        }),
      });

      if (!res.ok) throw new Error("Failed to place order");

      const { orderId, pixQrCode, pixCopyPaste, paymentLink } = await res.json();
      clearCart();
      router.push(`/${locale}/${store.slug}/pedido/${orderId}?pix=${encodeURIComponent(pixQrCode ?? "")}&copy=${encodeURIComponent(pixCopyPaste ?? "")}&link=${encodeURIComponent(paymentLink ?? "")}`);
    } catch {
      setSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen" style={{ background: "var(--cream)" }}>
      <CafeLoaderOverlay visible={submitting} />
      <div className="max-w-lg mx-auto px-4 py-6">
        {/* Back */}
        <button
          onClick={() => router.back()}
          className="flex items-center gap-2 text-sm text-text-muted hover:text-text-dark mb-6 transition-colors"
        >
          <ArrowLeft size={16} />
          {t("back")}
        </button>

        <h1 className="text-2xl font-bold text-text-dark mb-6">{t("title")}</h1>

        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-5">
          {/* Name */}
          <div>
            <label className="block text-sm font-semibold text-text-dark mb-1.5">
              {t("name")} *
            </label>
            <input
              {...register("customerName")}
              placeholder={t("namePlaceholder")}
              className="w-full px-4 py-3 rounded-xl border text-sm focus:outline-none focus:ring-2 transition-shadow"
              style={{ borderColor: errors.customerName ? "#ef4444" : "var(--cream-dark)" }}
            />
            {errors.customerName && (
              <p className="text-red-500 text-xs mt-1">{t("required")}</p>
            )}
          </div>

          {/* Table */}
          <div>
            <label className="block text-sm font-semibold text-text-dark mb-1.5">
              {t("table")}
            </label>
            <input
              {...register("tableLabel")}
              placeholder={t("tablePlaceholder")}
              className="w-full px-4 py-3 rounded-xl border text-sm focus:outline-none focus:ring-2 transition-shadow"
              style={{ borderColor: "var(--cream-dark)" }}
            />
          </div>

          {/* Notes */}
          <div>
            <label className="block text-sm font-semibold text-text-dark mb-1.5">
              {t("notes")}
            </label>
            <textarea
              {...register("notes")}
              placeholder={t("notesPlaceholder")}
              rows={2}
              className="w-full px-4 py-3 rounded-xl border text-sm focus:outline-none focus:ring-2 transition-shadow resize-none"
              style={{ borderColor: "var(--cream-dark)" }}
            />
          </div>

          {/* Payment method */}
          {PAYMENTS_ENABLED ? (
            <div>
              <label className="block text-sm font-semibold text-text-dark mb-2">
                {t("payment")}
              </label>
              <div className="grid grid-cols-2 gap-2">
                {PAYMENT_OPTIONS.map((opt) => {
                  const isSelected = selectedPayment === opt.id;
                  return (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() => setValue("paymentMethod", opt.id)}
                      className="flex flex-col items-start gap-1 p-3 rounded-xl border transition-all text-left"
                      style={{
                        borderColor: isSelected ? "var(--orange)" : "var(--cream-dark)",
                        background: isSelected ? "rgba(232,106,26,0.08)" : "white",
                      }}
                    >
                      <span style={{ color: isSelected ? "var(--orange)" : "var(--text-muted)" }}>
                        {opt.icon}
                      </span>
                      <span
                        className="text-sm font-semibold"
                        style={{ color: isSelected ? "var(--orange)" : "var(--text-dark)" }}
                      >
                        {t(opt.labelKey)}
                      </span>
                      <span className="text-xs text-text-muted leading-tight">
                        {t(opt.descKey)}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          ) : (
            <div
              className="flex items-center gap-3 p-3 rounded-xl border"
              style={{ borderColor: "var(--cream-dark)", background: "white" }}
            >
              <Store size={20} style={{ color: "var(--orange)" }} />
              <div>
                <p className="text-sm font-semibold" style={{ color: "var(--text-dark)" }}>
                  {t("counter")}
                </p>
                <p className="text-xs text-text-muted">{t("counterDesc")}</p>
              </div>
            </div>
          )}

          {/* Order summary */}
          <div
            className="rounded-xl p-4 border"
            style={{ background: "white", borderColor: "var(--cream-dark)" }}
          >
            <p className="text-sm font-semibold text-text-dark mb-3">Resumo</p>
            {items.map((item) => (
              <div key={item.id} className="flex justify-between text-sm py-1">
                <span className="text-text-muted">
                  {item.quantity}× {item.name}
                  {item.notes && (
                    <span className="text-xs text-text-muted/60 block">
                      {item.notes}
                    </span>
                  )}
                </span>
                <span className="font-medium text-text-dark">
                  {formatCurrency(item.unitPrice * item.quantity)}
                </span>
              </div>
            ))}
            <div
              className="flex justify-between font-bold text-base mt-3 pt-3 border-t"
              style={{ borderColor: "var(--cream-dark)" }}
            >
              <span style={{ color: "var(--text-dark)" }}>Total</span>
              <span style={{ color: "var(--orange)" }}>{formatCurrency(total)}</span>
            </div>
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={submitting}
            className="w-full py-4 rounded-xl text-white font-bold text-base transition-opacity hover:opacity-90 disabled:opacity-60"
            style={{ background: "var(--orange)" }}
          >
            {submitting ? "Processando..." : t("place")}
          </button>
        </form>
      </div>
    </div>
  );
}
