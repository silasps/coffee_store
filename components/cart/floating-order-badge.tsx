"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import { ChefHat, CheckCircle, Clock, Package } from "lucide-react";

type OrderStatus = "AWAITING_PAYMENT" | "IN_QUEUE" | "PREPARING" | "READY" | "COMPLETED" | "CANCELLED";

const STATUS_CONFIG: Record<OrderStatus, { label: string; color: string; icon: React.ReactNode }> = {
  AWAITING_PAYMENT: { label: "Aguardando pgto",  color: "#E86A1A", icon: <Clock size={14} /> },
  IN_QUEUE:         { label: "Na fila",           color: "#3B82F6", icon: <CheckCircle size={14} /> },
  PREPARING:        { label: "Em preparo",        color: "#8B5CF6", icon: <ChefHat size={14} /> },
  READY:            { label: "Pronto! 🎉",        color: "#10B981", icon: <Package size={14} /> },
  COMPLETED:        { label: "Entregue",          color: "#6B7280", icon: <CheckCircle size={14} /> },
  CANCELLED:        { label: "Cancelado",         color: "#EF4444", icon: null },
};

const TERMINAL = ["COMPLETED", "CANCELLED"];

type ActiveOrder = {
  orderId: string;
  displayCode: string;
  storeSlug: string;
  locale: string;
};

type Props = { storeSlug: string };

export function FloatingOrderBadge({ storeSlug }: Props) {
  const router = useRouter();
  const [activeOrder, setActiveOrder] = useState<ActiveOrder | null>(null);
  const [status, setStatus] = useState<OrderStatus | null>(null);
  const [pulse, setPulse] = useState(false);
  const prevStatusRef = useRef<OrderStatus | null>(null);

  // Read active order from localStorage on mount
  useEffect(() => {
    try {
      const raw = localStorage.getItem(`active-order-${storeSlug}`);
      if (!raw) return;
      const order: ActiveOrder = JSON.parse(raw);
      setActiveOrder(order);
    } catch {}
  }, [storeSlug]);

  const pollStatus = useCallback(async (orderId: string) => {
    try {
      const res = await fetch(`/api/orders/${orderId}/status`);
      if (!res.ok) return;
      const data = await res.json();
      const newStatus: OrderStatus = data.status;

      if (TERMINAL.includes(newStatus)) {
        // Clear badge when order is done
        localStorage.removeItem(`active-order-${storeSlug}`);
        setActiveOrder(null);
        setStatus(null);
        return;
      }

      if (prevStatusRef.current && newStatus !== prevStatusRef.current) {
        setPulse(true);
        setTimeout(() => setPulse(false), 2000);
      }
      prevStatusRef.current = newStatus;
      setStatus(newStatus);
    } catch {}
  }, [storeSlug]);

  // Start polling once we have an active order
  useEffect(() => {
    if (!activeOrder) return;
    // Fetch immediately on mount
    pollStatus(activeOrder.orderId);
    const interval = setInterval(() => pollStatus(activeOrder.orderId), 5000);
    return () => clearInterval(interval);
  }, [activeOrder, pollStatus]);

  if (!activeOrder || !status) return null;

  const cfg = STATUS_CONFIG[status];

  return (
    <button
      onClick={() =>
        router.push(`/${activeOrder.locale}/${activeOrder.storeSlug}/pedido/${activeOrder.orderId}`)
      }
      className="fixed bottom-24 right-4 z-40 flex items-center gap-2 px-4 py-2.5 rounded-full shadow-lg text-white text-sm font-semibold transition-transform"
      style={{
        background: cfg.color,
        transform: pulse ? "scale(1.12)" : "scale(1)",
        transition: "transform 0.2s ease",
      }}
    >
      {cfg.icon}
      <span>#{activeOrder.displayCode} · {cfg.label}</span>
    </button>
  );
}
