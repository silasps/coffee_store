"use client";

import { useEffect, useState, useCallback, useRef } from "react";

import { CheckCircle, Clock, ChefHat, Package, XCircle, Copy, Check, ArrowLeft, Bell, BellOff } from "lucide-react";
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

const STATUS_CONFIG: Record<OrderStatus, {
  icon: React.ReactNode;
  bigIcon: React.ReactNode;
  label: string;
  message: string;
  color: string;
  bgColor: string;
}> = {
  AWAITING_PAYMENT: {
    icon: <Clock size={28} />,
    bigIcon: <Clock size={56} />,
    label: "Aguardando pagamento",
    message: "Seu pedido foi recebido! Confirme o pagamento para entrar na fila.",
    color: "#E86A1A",
    bgColor: "rgba(232,106,26,0.1)",
  },
  IN_QUEUE: {
    icon: <CheckCircle size={28} />,
    bigIcon: <CheckCircle size={56} />,
    label: "Na fila",
    message: "Pagamento confirmado! Seu pedido está na fila de preparo.",
    color: "#3B82F6",
    bgColor: "rgba(59,130,246,0.1)",
  },
  PREPARING: {
    icon: <ChefHat size={28} />,
    bigIcon: <ChefHat size={56} />,
    label: "Em preparo",
    message: "Seu pedido está sendo preparado agora. Aguarde um instante!",
    color: "#8B5CF6",
    bgColor: "rgba(139,92,246,0.1)",
  },
  READY: {
    icon: <Package size={28} />,
    bigIcon: <Package size={56} />,
    label: "Pronto para retirada",
    message: "🎉 Seu pedido está pronto! Pode retirar no balcão.",
    color: "#10B981",
    bgColor: "rgba(16,185,129,0.1)",
  },
  COMPLETED: {
    icon: <CheckCircle size={28} />,
    bigIcon: <CheckCircle size={56} />,
    label: "Entregue",
    message: "Pedido entregue. Obrigado pela preferência!",
    color: "#10B981",
    bgColor: "rgba(16,185,129,0.1)",
  },
  CANCELLED: {
    icon: <XCircle size={28} />,
    bigIcon: <XCircle size={56} />,
    label: "Cancelado",
    message: "Este pedido foi cancelado.",
    color: "#EF4444",
    bgColor: "rgba(239,68,68,0.1)",
  },
};

export function OrderStatusClient({ order: initial, pixQrCode, pixCopyPaste, paymentLink, storeSlug, locale }: Props) {
  const router = useRouter();
  const [order, setOrder] = useState(initial);
  const [copied, setCopied] = useState(false);
  // Modal shows whenever current status differs from last acknowledged status
  const [modalStatus, setModalStatus] = useState<OrderStatus | null>(null);
  const [soundEnabled, setSoundEnabled] = useState(false);
  const prevStatusRef = useRef<OrderStatus>(initial.status);
  const audioCtxRef = useRef<AudioContext | null>(null);

  const lsKey = `order-ack-${initial.id}`;

  // On mount: show modal if status not yet acknowledged by this customer
  useEffect(() => {
    const lastAck = localStorage.getItem(lsKey) as OrderStatus | null;
    if (lastAck !== initial.status) {
      setModalStatus(initial.status);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function dismissModal() {
    if (modalStatus) {
      localStorage.setItem(lsKey, modalStatus);
    }
    setModalStatus(null);
  }

  function enableSound() {
    if (audioCtxRef.current) return;
    const ctx = new AudioContext();
    audioCtxRef.current = ctx;
    playChimeWith(ctx);
    setSoundEnabled(true);
  }

  function playChimeWith(ctx: AudioContext) {
    // Victory fanfare: tu tu-ru tú tu túúúúú
    const notes = [
      { freq: 523.25, dur: 0.11 },  // C5
      { freq: 659.25, dur: 0.08 },  // E5
      { freq: 783.99, dur: 0.08 },  // G5
      { freq: 880.00, dur: 0.13 },  // A5 (accented)
      { freq: 783.99, dur: 0.08 },  // G5
      { freq: 1046.50, dur: 0.48 }, // C6 (long)
    ];
    try {
      const resume = ctx.state === "suspended" ? ctx.resume() : Promise.resolve();
      resume.then(() => {
        let t = ctx.currentTime + 0.04;
        for (const note of notes) {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.type = "triangle";
          osc.frequency.setValueAtTime(note.freq, t);
          gain.gain.setValueAtTime(0.28, t);
          gain.gain.exponentialRampToValueAtTime(0.001, t + note.dur);
          osc.start(t);
          osc.stop(t + note.dur);
          t += note.dur + 0.02;
        }
      }).catch(() => {});
    } catch {}
  }

  const playChime = useCallback(() => {
    const ctx = audioCtxRef.current;
    if (!ctx) return;
    playChimeWith(ctx);
  }, []);

  const pollStatus = useCallback(async () => {
    try {
      const res = await fetch(`/api/orders/${initial.id}/status`);
      if (!res.ok) return;
      const data = await res.json();
      const newStatus: OrderStatus = data.status;

      if (newStatus !== prevStatusRef.current) {
        prevStatusRef.current = newStatus;
        setModalStatus(newStatus);
        if (audioCtxRef.current) playChime();
      }

      setOrder((prev) => ({ ...prev, status: newStatus, paymentStatus: data.paymentStatus }));
    } catch {}
  }, [initial.id, playChime]);

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
  const isActive = !["COMPLETED", "CANCELLED"].includes(order.status);

  return (
    <div className="min-h-screen" style={{ background: "var(--cream)" }}>

      {/* ── Status modal ── */}
      {modalStatus && (
        <div
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4"
          style={{ background: "rgba(0,0,0,0.55)", backdropFilter: "blur(4px)" }}
        >
          <div
            className="w-full max-w-sm rounded-3xl p-8 text-center shadow-2xl"
            style={{ background: "white" }}
          >
            {/* Big icon */}
            <div
              className="w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-5"
              style={{
                background: STATUS_CONFIG[modalStatus].bgColor,
                color: STATUS_CONFIG[modalStatus].color,
              }}
            >
              {STATUS_CONFIG[modalStatus].bigIcon}
            </div>

            <p className="text-xs text-text-muted uppercase tracking-widest mb-1">
              Pedido #{order.displayCode}
            </p>
            <h2 className="text-2xl font-black mb-3" style={{ color: STATUS_CONFIG[modalStatus].color }}>
              {STATUS_CONFIG[modalStatus].label}
            </h2>
            <p className="text-sm text-text-muted leading-relaxed mb-6">
              {STATUS_CONFIG[modalStatus].message}
            </p>

            {/* Sound toggle inside modal */}
            {isActive && (
              <button
                onClick={enableSound}
                className="flex items-center justify-center gap-2 w-full py-2.5 rounded-xl text-sm font-semibold mb-3 transition-colors"
                style={soundEnabled
                  ? { background: "rgba(16,185,129,0.12)", color: "#10B981" }
                  : { background: "var(--cream)", color: "var(--text-muted)" }
                }
              >
                {soundEnabled ? <Bell size={14} /> : <BellOff size={14} />}
                {soundEnabled ? "Som ativado ✓" : "Ativar alertas sonoros"}
              </button>
            )}

            <button
              onClick={dismissModal}
              className="w-full py-4 rounded-2xl text-white font-bold text-base"
              style={{ background: STATUS_CONFIG[modalStatus].color }}
            >
              Entendi
            </button>
          </div>
        </div>
      )}

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
          <h1 className="text-5xl font-black tracking-wider" style={{ color: "var(--brown-dark)" }}>
            #{order.displayCode}
          </h1>
          <p className="text-sm text-text-muted mt-1">Olá, {order.customerName}!</p>
        </div>

        {/* Status card */}
        <div
          className="rounded-2xl p-6 flex flex-col items-center gap-3 mb-4 text-center cursor-pointer"
          style={{ background: statusConfig.bgColor }}
          onClick={() => setModalStatus(order.status)}
          title="Toque para ver o status"
        >
          <div style={{ color: statusConfig.color }}>{statusConfig.icon}</div>
          <p className="font-bold text-lg" style={{ color: statusConfig.color }}>
            {statusConfig.label}
          </p>
          {order.status === "AWAITING_PAYMENT" && (
            <p className="text-xs text-text-muted">Aguardando confirmação do pagamento...</p>
          )}
          {order.status === "READY" && (
            <p className="text-sm font-semibold" style={{ color: "#10B981" }}>
              🎉 Seu pedido está pronto!
            </p>
          )}
          <p className="text-xs text-text-muted opacity-60">Toque para mais detalhes</p>
        </div>

        {/* PIX QR Code */}
        {order.status === "AWAITING_PAYMENT" && order.paymentMethod === "PIX" && pixQrCode && (
          <div
            className="rounded-2xl p-5 mb-4 flex flex-col items-center gap-4 border"
            style={{ background: "white", borderColor: "var(--cream-dark)" }}
          >
            <p className="font-semibold text-sm text-text-dark">Pague com PIX</p>
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
                {copied ? "Copiado!" : "Copiar código PIX"}
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
        <div className="rounded-2xl p-5 border" style={{ background: "white", borderColor: "var(--cream-dark)" }}>
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
                <span className="font-medium text-text-dark">{formatCurrency(item.totalPrice)}</span>
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
