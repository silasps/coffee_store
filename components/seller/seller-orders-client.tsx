"use client";

import { useEffect, useState, useCallback } from "react";
import { ChevronDown, ChevronUp, Monitor, Utensils, Store, RefreshCw } from "lucide-react";

type OrderItem = { productNamePt: string; quantity: number; notes?: string | null };

type Order = {
  id: string;
  displayCode: string;
  customerName: string;
  tableLabel: string | null;
  channel: string;
  status: string;
  total: number;
  createdAt: string;
  items: OrderItem[];
};

type Props = { orders: Order[]; storeId: string };

const statusConfig: Record<string, { label: string; color: string }> = {
  AWAITING_PAYMENT: { label: "Aguardando pgto", color: "#E86A1A" },
  IN_QUEUE:         { label: "Na fila",          color: "#3B82F6" },
  PREPARING:        { label: "Em preparo",        color: "#8B5CF6" },
  READY:            { label: "Pronto",            color: "#10B981" },
  COMPLETED:        { label: "Entregue",          color: "#6B7280" },
  CANCELLED:        { label: "Cancelado",         color: "#EF4444" },
};

const ACTIVE = ["IN_QUEUE", "PREPARING", "READY", "AWAITING_PAYMENT"];

const channelLabel: Record<string, { icon: React.ReactNode; label: string }> = {
  TOTEM:   { icon: <Monitor size={12} />,  label: "Totem" },
  TABLE:   { icon: <Utensils size={12} />, label: "Mesa" },
  COUNTER: { icon: <Store size={12} />,    label: "Balcão" },
};

function fmtTime(iso: string) {
  return new Date(iso).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
}

function fmtCurrency(v: number) {
  return v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function OrderRow({ order }: { order: Order }) {
  const [expanded, setExpanded] = useState(false);
  const cfg = statusConfig[order.status] ?? { label: order.status, color: "#6B7280" };
  const ch = channelLabel[order.channel];

  return (
    <li className="border-b last:border-0" style={{ borderColor: "var(--cream-dark)" }}>
      <button
        onClick={() => setExpanded((v) => !v)}
        className="w-full flex items-center gap-3 px-4 py-3 text-left"
      >
        <span className="font-mono font-black text-sm" style={{ color: "var(--orange)" }}>
          #{order.displayCode}
        </span>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold truncate" style={{ color: "var(--brown-dark)" }}>
            {order.customerName}
            {order.tableLabel && (
              <span className="ml-1 text-xs font-normal" style={{ color: "var(--text-muted)" }}>
                · {order.tableLabel}
              </span>
            )}
          </p>
          <div className="flex items-center gap-2 mt-0.5">
            {ch && (
              <span
                className="flex items-center gap-1 text-xs"
                style={{ color: "var(--text-muted)" }}
              >
                {ch.icon} {ch.label}
              </span>
            )}
            <span className="text-xs" style={{ color: "var(--text-muted)" }}>
              {fmtTime(order.createdAt)}
            </span>
          </div>
        </div>
        <span
          className="text-xs font-semibold px-2 py-0.5 rounded-full whitespace-nowrap"
          style={{ color: cfg.color, background: `${cfg.color}18` }}
        >
          {cfg.label}
        </span>
        {expanded ? <ChevronUp size={16} style={{ color: "var(--text-muted)", flexShrink: 0 }} /> : <ChevronDown size={16} style={{ color: "var(--text-muted)", flexShrink: 0 }} />}
      </button>

      {expanded && (
        <div className="px-4 pb-3 space-y-1" style={{ background: "var(--cream)" }}>
          {order.items.map((item, i) => (
            <p key={i} className="text-sm" style={{ color: "var(--brown-dark)" }}>
              <span className="font-semibold">{item.quantity}×</span> {item.productNamePt}
              {item.notes && (
                <span className="text-xs ml-1" style={{ color: "var(--text-muted)" }}>({item.notes})</span>
              )}
            </p>
          ))}
          <p className="text-sm font-bold pt-1" style={{ color: "var(--orange)" }}>
            Total: {fmtCurrency(order.total)}
          </p>
        </div>
      )}
    </li>
  );
}

export function SellerOrdersClient({ orders: initial, storeId }: Props) {
  const [orders, setOrders] = useState<Order[]>(initial);
  const [lastRefresh, setLastRefresh] = useState(new Date());

  const refresh = useCallback(async () => {
    try {
      const res = await fetch(`/api/admin/stores/${storeId}/orders`);
      if (!res.ok) return;
      const data: (Order & { total: number | string })[] = await res.json();
      const mapped: Order[] = data.map((o) => ({
        ...o,
        total: Number(o.total),
      }));
      setOrders(mapped);
      setLastRefresh(new Date());
    } catch {
      // silent
    }
  }, [storeId]);

  useEffect(() => {
    const id = setInterval(refresh, 10000);
    return () => clearInterval(id);
  }, [refresh]);

  const active    = orders.filter((o) => ACTIVE.includes(o.status));
  const completed = orders.filter((o) => !ACTIVE.includes(o.status));

  return (
    <div className="p-4 space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-black" style={{ color: "var(--brown-dark)" }}>
          Pedidos de hoje
        </h1>
        <button
          onClick={refresh}
          className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full border font-medium"
          style={{ color: "var(--text-muted)", borderColor: "var(--cream-dark)" }}
        >
          <RefreshCw size={13} />
          {lastRefresh.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}
        </button>
      </div>

      {/* Active */}
      <section>
        <h2 className="text-xs font-bold uppercase tracking-wide mb-2" style={{ color: "var(--text-muted)" }}>
          Ativos — {active.length}
        </h2>
        <div className="rounded-2xl border overflow-hidden" style={{ background: "white", borderColor: "var(--cream-dark)" }}>
          {active.length === 0 ? (
            <p className="px-4 py-6 text-sm text-center" style={{ color: "var(--text-muted)" }}>
              Nenhum pedido ativo
            </p>
          ) : (
            <ul>{active.map((o) => <OrderRow key={o.id} order={o} />)}</ul>
          )}
        </div>
      </section>

      {/* Completed */}
      {completed.length > 0 && (
        <section>
          <h2 className="text-xs font-bold uppercase tracking-wide mb-2" style={{ color: "var(--text-muted)" }}>
            Concluídos hoje — {completed.length}
          </h2>
          <div className="rounded-2xl border overflow-hidden" style={{ background: "white", borderColor: "var(--cream-dark)" }}>
            <ul>{completed.map((o) => <OrderRow key={o.id} order={o} />)}</ul>
          </div>
        </section>
      )}
    </div>
  );
}
