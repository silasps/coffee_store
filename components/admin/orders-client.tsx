"use client";

import { useState, useEffect } from "react";
import { formatCurrency } from "@/components/ui/format-currency";
import { ChevronDown, ChevronUp } from "lucide-react";

type OrderItem = {
  id: string;
  productNamePt: string;
  quantity: number;
  notes: string | null;
};

type Order = {
  id: string;
  displayCode: string;
  customerName: string;
  tableLabel: string | null;
  notes: string | null;
  channel: string;
  status: string;
  paymentMethod: string;
  paymentStatus: string;
  total: number;
  createdAt: string;
  items: OrderItem[];
};

const COUNTER_METHODS = ["PAY_AT_COUNTER", "CASH_AT_COUNTER", "CARD_AT_COUNTER"];

const PAYMENT_METHOD_LABEL: Record<string, string> = {
  PAY_AT_COUNTER: "Pagar no balcão",
  CASH_AT_COUNTER: "Dinheiro no balcão",
  CARD_AT_COUNTER: "Cartão no balcão",
  PIX: "PIX",
  CARD_ONLINE: "Cartão online",
  PAY_LINK: "Link de pagamento",
};

const STATUS_CONFIG: Record<string, { label: string; color: string }> = {
  AWAITING_PAYMENT: { label: "Aguardando pgto", color: "#E86A1A" },
  IN_QUEUE:         { label: "Na fila",          color: "#3B82F6" },
  PREPARING:        { label: "Em preparo",        color: "#8B5CF6" },
  READY:            { label: "Pronto",            color: "#10B981" },
  COMPLETED:        { label: "Entregue",          color: "#6B7280" },
  CANCELLED:        { label: "Cancelado",         color: "#EF4444" },
};

const NEXT_STATUS: Record<string, string> = {
  AWAITING_PAYMENT: "IN_QUEUE",
  IN_QUEUE:         "PREPARING",
  PREPARING:        "READY",
  READY:            "COMPLETED",
};

const NEXT_LABEL: Record<string, string> = {
  AWAITING_PAYMENT: "Confirmar e colocar na fila",
  IN_QUEUE:         "Iniciar preparo",
  PREPARING:        "Marcar como pronto",
  READY:            "Marcar como entregue",
};

type Props = { orders: Order[]; storeId: string };

export function OrdersClient({ orders: initial, storeId }: Props) {
  const [orders, setOrders] = useState(initial);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const interval = setInterval(async () => {
      try {
        const res = await fetch(`/api/admin/stores/${storeId}/orders`);
        if (res.ok) setOrders(await res.json());
      } catch {}
    }, 5000);
    return () => clearInterval(interval);
  }, [storeId]);

  function patchOrder(id: string, patch: Partial<Order>) {
    setOrders((prev) => prev.map((o) => (o.id === id ? { ...o, ...patch } : o)));
  }

  async function advanceStatus(order: Order) {
    const next = NEXT_STATUS[order.status];
    if (!next || loading) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/orders/${order.id}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: next }),
      });
      if (!res.ok) throw new Error(`Erro ${res.status}`);
      patchOrder(order.id, { status: next });
      // Close card when reaching terminal states
      if (next === "COMPLETED") setSelectedId(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erro ao atualizar pedido");
    } finally {
      setLoading(false);
    }
  }

  async function cancelOrder(order: Order) {
    if (loading) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/orders/${order.id}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "CANCELLED" }),
      });
      if (!res.ok) throw new Error(`Erro ${res.status}`);
      patchOrder(order.id, { status: "CANCELLED" });
      setSelectedId(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erro ao cancelar pedido");
    } finally {
      setLoading(false);
    }
  }

  async function confirmPayment(order: Order) {
    if (loading) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/orders/${order.id}/confirm-payment`, { method: "PATCH" });
      if (!res.ok) throw new Error(`Erro ${res.status}`);
      patchOrder(order.id, { paymentStatus: "PAID", status: "IN_QUEUE" });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erro ao confirmar pagamento");
    } finally {
      setLoading(false);
    }
  }

  // Active orders: oldest first (queue order — first to arrive should be prepared first)
  const activeOrders = orders
    .filter((o) => !["COMPLETED", "CANCELLED"].includes(o.status))
    .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());

  const historyOrders = orders.filter((o) => ["COMPLETED", "CANCELLED"].includes(o.status));

  function toggleCard(id: string) {
    setError(null);
    setSelectedId((prev) => (prev === id ? null : id));
  }

  return (
    <div className="p-4 md:p-6">
      <div className="mb-5">
        <h1 className="text-2xl font-bold text-text-dark">Pedidos</h1>
        <p className="text-sm text-text-muted">
          {activeOrders.length} ativos · atualiza a cada 5s
        </p>
      </div>

      <div className="flex flex-col gap-3 max-w-2xl">
        {activeOrders.length === 0 && (
          <div
            className="rounded-2xl border p-8 text-center text-sm text-text-muted"
            style={{ background: "white", borderColor: "var(--cream-dark)" }}
          >
            Nenhum pedido ativo
          </div>
        )}

        {activeOrders.map((order) => {
          const isOpen = selectedId === order.id;
          const sc = STATUS_CONFIG[order.status];
          const needsPayment = COUNTER_METHODS.includes(order.paymentMethod) && order.paymentStatus !== "PAID";
          const nextLabel = NEXT_LABEL[order.status];
          const canAdvance = !!NEXT_STATUS[order.status];

          return (
            <div
              key={order.id}
              className="rounded-2xl border transition-all duration-200"
              style={{
                background: "white",
                borderColor: isOpen ? "var(--orange)" : "var(--cream-dark)",
                boxShadow: isOpen ? "0 0 0 2px var(--orange)" : undefined,
              }}
            >
              {/* Card header — always visible */}
              <div
                className="p-4 cursor-pointer flex items-start justify-between gap-3"
                onClick={() => toggleCard(order.id)}
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <span className="font-mono font-black text-lg text-text-dark">
                      #{order.displayCode}
                    </span>
                    <span
                      className="text-xs font-semibold px-2 py-0.5 rounded-full"
                      style={{ color: sc.color, background: `${sc.color}18` }}
                    >
                      {sc.label}
                    </span>
                    {COUNTER_METHODS.includes(order.paymentMethod) && (
                      <span
                        className="text-xs font-medium px-2 py-0.5 rounded-full"
                        style={{
                          color: needsPayment ? "#E86A1A" : "#10B981",
                          background: needsPayment ? "#E86A1A18" : "#10B98118",
                        }}
                      >
                        {needsPayment ? PAYMENT_METHOD_LABEL[order.paymentMethod] : "Pago ✓"}
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-text-dark">{order.customerName}</p>
                  {order.tableLabel && (
                    <p className="text-xs text-text-muted">{order.tableLabel}</p>
                  )}
                  <p className="text-xs text-text-muted mt-1">
                    {order.items.length} {order.items.length === 1 ? "item" : "itens"} ·{" "}
                    {new Date(order.createdAt).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}
                  </p>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <p className="font-bold text-sm" style={{ color: "var(--orange)" }}>
                    {formatCurrency(order.total)}
                  </p>
                  {isOpen
                    ? <ChevronUp size={16} className="text-text-muted" />
                    : <ChevronDown size={16} className="text-text-muted" />
                  }
                </div>
              </div>

              {/* Expanded details */}
              {isOpen && (
                <div
                  className="px-4 pb-4 border-t"
                  style={{ borderColor: "var(--cream-dark)" }}
                  onClick={(e) => e.stopPropagation()}
                >
                  {/* Items */}
                  <div className="flex flex-col gap-2 mt-3 mb-3">
                    {order.items.map((item) => (
                      <div key={item.id} className="text-sm">
                        <span className="font-medium text-text-dark">
                          {item.quantity}× {item.productNamePt}
                        </span>
                        {item.notes && (
                          <p className="text-xs text-text-muted">{item.notes}</p>
                        )}
                      </div>
                    ))}
                  </div>

                  {order.notes && (
                    <div
                      className="rounded-xl p-3 mb-3 text-sm text-text-muted"
                      style={{ background: "var(--cream-dark)" }}
                    >
                      Obs: {order.notes}
                    </div>
                  )}

                  {/* Actions */}
                  <div className="flex flex-col gap-2">
                    {error && (
                      <div className="rounded-xl px-3 py-2.5 text-sm font-medium text-red-700 bg-red-50 border border-red-200">
                        {error}
                      </div>
                    )}

                    {needsPayment && (
                      <button
                        onClick={() => confirmPayment(order)}
                        disabled={loading}
                        className="w-full py-3.5 rounded-xl text-sm font-bold text-white transition-opacity disabled:opacity-60"
                        style={{ background: "#10B981" }}
                      >
                        {loading ? "Aguarde..." : "✓ Confirmar Pagamento"}
                      </button>
                    )}

                    {canAdvance && !needsPayment && (
                      <button
                        onClick={() => advanceStatus(order)}
                        disabled={loading}
                        className="w-full py-3.5 rounded-xl text-sm font-bold text-white transition-opacity disabled:opacity-60"
                        style={{ background: "var(--orange)" }}
                      >
                        {loading ? "Aguarde..." : `→ ${nextLabel}`}
                      </button>
                    )}

                    {order.status !== "CANCELLED" && order.status !== "COMPLETED" && (
                      <button
                        onClick={() => cancelOrder(order)}
                        disabled={loading}
                        className="w-full py-3 rounded-xl text-sm font-semibold transition-colors disabled:opacity-60"
                        style={{ color: "#EF4444", background: "#EF444412" }}
                      >
                        Cancelar pedido
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>
          );
        })}

        {historyOrders.length > 0 && (
          <>
            <h2 className="font-semibold text-xs text-text-muted uppercase tracking-wide mt-4">
              Histórico
            </h2>
            {historyOrders.slice(0, 10).map((order) => {
              const sc = STATUS_CONFIG[order.status];
              return (
                <div
                  key={order.id}
                  className="rounded-xl border p-3 flex items-center justify-between opacity-60"
                  style={{ background: "white", borderColor: "var(--cream-dark)" }}
                >
                  <div className="flex items-center gap-3">
                    <span className="font-mono font-bold text-sm">#{order.displayCode}</span>
                    <span className="text-sm text-text-muted">{order.customerName}</span>
                    <span className="text-xs font-medium" style={{ color: sc.color }}>{sc.label}</span>
                  </div>
                  <span className="text-sm font-semibold text-text-muted">
                    {formatCurrency(order.total)}
                  </span>
                </div>
              );
            })}
          </>
        )}
      </div>
    </div>
  );
}
