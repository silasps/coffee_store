"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { useTranslations } from "next-intl";
import { CheckCircle, Clock, ChefHat, Package, XCircle, Copy, Check, ArrowLeft } from "lucide-react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { formatCurrency } from "@/components/ui/format-currency";

type OrderStatus = "AWAITING_PAYMENT" | "IN_QUEUE" | "PREPARING" | "READY" | "COMPLETED" | "CANCELLED";

type OrderItem = {
  id: string;
  productNamePt: string;
  quantity: number;
  totalPrice: number | null;
  notes: string | null;
};

type Props = {
  order: {
    id: string;
    displayCode: string;
    customerName: string;
    status: OrderStatus;
    paymentMethod: string;
    paymentStatus: string;
    total: number;
    items: OrderItem[];
  };
  pixQrCode: string | null;
  pixCopyPaste: string | null;
  paymentLink: string | null;
  storeSlug: string;
  locale: string;
};

const STATUS_CONFIG: Record<OrderStatus, { icon: React.ReactNode; color: string; bgColor: string }> = {
  AWAITING_PAYMENT: { icon: <Clock size={32} />, color: "#E86A1A", bgColor: "rgba(232,106,26,0.1)" },
  IN_QUEUE: { icon: <CheckCircle size={32} />, color: "#3B82F6", bgColor: "rgba(59,130,246,0.1)" },
  PREPARING: { icon: <ChefHat size={32} />, color: "#8B5CF6", bgColor: "rgba(139,92,246,0.1)" },
  READY: { icon: <Package size={32} />, color: "#10B981", bgColor: "rgba(16,185,129,0.1)" },
  COMPLETED: { icon: <CheckCircle size={32} />, color: "#10B981", bgColor: "rgba(16,185,129,0.1)" },
  CANCELLED: { icon: <XCircle size={32} />, color: "#EF4444", bgColor: "rgba(239,68,68,0.1)" },
};

// Statuses that warrant a sound alert (meaningful advances for the customer)
const CHIME_STATUSES: OrderStatus[] = ["PREPARING", "READY"];

function playChime() {
  try {
    const ctx = new AudioContext();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.type = "sine";
    osc.frequency.setValueAtTime(880, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(440, ctx.currentTime + 0.4);
    gain.gain.setValueAtTime(0.15, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.4);
    osc.start();
    osc.stop(ctx.currentTime + 0.4);
  } catch {
    // AudioContext blocked or unavailable — skip silently
  }
}

export function OrderStatusClient({ order: initial, pixQrCode, pixCopyPaste, paymentLink, storeSlug, locale }: Props) {
  const t = useTranslations("order");
  const router = useRouter();
  const [order, setOrder] = useState(initial);
  const [copied, setCopied] = useState(false);
  const [justChanged, setJustChanged] = useState(false);
  const prevStatusRef = useRef<OrderStatus>(initial.status);

  const pollStatus = useCallback(async () => {
    try {
      const res = await fetch(`/api/orders/${initial.id}/status`);
      if (res.ok) {
        const data = await res.json();
        const newStatus: OrderStatus = data.status;
        if (newStatus !== prevStatusRef.current) {
          prevStatusRef.current = newStatus;
          setJustChanged(true);
          setTimeout(() => setJustChanged(false), 1000);
          if (CHIME_STATUSES.includes(newStatus)) playChime();
        }
        setOrder((prev) => ({ ...prev, status: newStatus, paymentStatus: data.paymentStatus }));
      }
    } catch {}
  }, [initial.id]);

  useEffect(() => {
    const shouldPoll = !["COMPLETED", "CANCELLED"].includes(order.status);
    if (!shouldPoll) return;

    const interval = setInterval(pollStatus, 5000);
    return () => clearInterval(interval);
  }, [order.status, pollStatus]);

  function copyPixCode() {
    if (!pixCopyPaste) return;
    navigator.clipboard.writeText(pixCopyPaste);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  const statusConfig = STATUS_CONFIG[order.status];

  return (
    <div className="min-h-screen" style={{ background: "var(--cream)" }}>
      <div className="max-w-lg mx-auto px-4 py-6">
        {/* Back to menu */}
        <button
          onClick={() => router.push(`/${locale}/${storeSlug}`)}
          className="flex items-center gap-2 text-sm text-text-muted hover:text-text-dark mb-6 transition-colors"
        >
          <ArrowLeft size={16} />
          Voltar ao menu
        </button>

        {/* Order code */}
        <div className="text-center mb-6">
          <p className="text-xs text-text-muted uppercase tracking-wider mb-1">Pedido</p>
          <h1
            className="text-5xl font-black tracking-wider"
            style={{ color: "var(--brown-dark)" }}
          >
            #{order.displayCode}
          </h1>
          <p className="text-sm text-text-muted mt-1">Olá, {order.customerName}!</p>
        </div>

        {/* Status card */}
        <div
          className={`rounded-2xl p-6 flex flex-col items-center gap-3 mb-4 text-center transition-all duration-300 ${
            justChanged ? "scale-105 ring-2" : ""
          }`}
          style={{
            background: statusConfig.bgColor,
            ...(justChanged ? { "--tw-ring-color": statusConfig.color } as React.CSSProperties : {}),
          }}
        >
          <div style={{ color: statusConfig.color }}>{statusConfig.icon}</div>
          <p className="font-bold text-lg" style={{ color: statusConfig.color }}>
            {t(order.status.toLowerCase() as "awaiting" | "inQueue" | "preparing" | "ready" | "completed" | "cancelled")}
          </p>
          {order.status === "AWAITING_PAYMENT" && (
            <p className="text-xs text-text-muted">
              Aguardando confirmação do pagamento...
            </p>
          )}
          {order.status === "READY" && (
            <p className="text-sm font-semibold" style={{ color: "#10B981" }}>
              🎉 Seu pedido está pronto!
            </p>
          )}
        </div>

        {/* PIX QR Code */}
        {order.status === "AWAITING_PAYMENT" && order.paymentMethod === "PIX" && pixQrCode && (
          <div
            className="rounded-2xl p-5 mb-4 flex flex-col items-center gap-4 border"
            style={{ background: "white", borderColor: "var(--cream-dark)" }}
          >
            <p className="font-semibold text-sm text-text-dark">{t("payPix")}</p>
            <Image
              src={`data:image/png;base64,${pixQrCode}`}
              alt="QR Code PIX"
              width={200}
              height={200}
              className="rounded-xl"
            />
            {pixCopyPaste && (
              <button
                onClick={copyPixCode}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold text-white transition-opacity hover:opacity-90"
                style={{ background: "var(--orange)" }}
              >
                {copied ? <Check size={16} /> : <Copy size={16} />}
                {copied ? t("pixCopied") : t("copyPix")}
              </button>
            )}
          </div>
        )}

        {/* Payment link */}
        {order.paymentMethod === "PAY_LINK" && paymentLink && (
          <a
            href={paymentLink}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-2 w-full py-4 rounded-xl text-white font-bold text-base mb-4 hover:opacity-90 transition-opacity"
            style={{ background: "var(--orange)" }}
          >
            Pagar agora →
          </a>
        )}

        {/* Order summary */}
        <div
          className="rounded-2xl p-5 border"
          style={{ background: "white", borderColor: "var(--cream-dark)" }}
        >
          <p className="text-sm font-semibold text-text-dark mb-3">Itens do pedido</p>
          {order.items.map((item) => (
            <div key={item.id} className="flex justify-between text-sm py-1.5">
              <span className="text-text-muted">
                {item.quantity}× {item.productNamePt}
                {item.notes && (
                  <span className="text-xs block text-text-muted/60">{item.notes}</span>
                )}
              </span>
              {item.totalPrice != null && (
                <span className="font-medium text-text-dark">
                  {formatCurrency(item.totalPrice)}
                </span>
              )}
            </div>
          ))}
          <div
            className="flex justify-between font-bold mt-3 pt-3 border-t"
            style={{ borderColor: "var(--cream-dark)" }}
          >
            <span style={{ color: "var(--text-dark)" }}>Total</span>
            <span style={{ color: "var(--orange)" }}>{formatCurrency(order.total)}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
