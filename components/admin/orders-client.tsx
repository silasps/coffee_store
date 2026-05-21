"use client";

import { useState, useEffect } from "react";
import { formatCurrency } from "@/components/ui/format-currency";

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

const STATUS_OPTIONS = [
  { value: "AWAITING_PAYMENT", label: "Aguardando pgto", color: "#E86A1A" },
  { value: "IN_QUEUE", label: "Na fila", color: "#3B82F6" },
  { value: "PREPARING", label: "Em preparo", color: "#8B5CF6" },
  { value: "READY", label: "Pronto", color: "#10B981" },
  { value: "COMPLETED", label: "Entregue", color: "#6B7280" },
  { value: "CANCELLED", label: "Cancelado", color: "#EF4444" },
];

type Props = {
  orders: Order[];
  storeId: string;
};

export function OrdersClient({ orders: initial, storeId }: Props) {
  const [orders, setOrders] = useState(initial);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);

  // Poll for updates every 5s
  useEffect(() => {
    const interval = setInterval(async () => {
      try {
        const res = await fetch(`/api/admin/stores/${storeId}/orders`);
        if (res.ok) {
          const data = await res.json();
          setOrders(data);
        }
      } catch {}
    }, 5000);
    return () => clearInterval(interval);
  }, [storeId]);

  async function updateStatus(orderId: string, newStatus: string) {
    try {
      await fetch(`/api/admin/orders/${orderId}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      setOrders((prev) =>
        prev.map((o) => (o.id === orderId ? { ...o, status: newStatus } : o))
      );
      if (selectedOrder?.id === orderId) {
        setSelectedOrder((prev) => prev ? { ...prev, status: newStatus } : prev);
      }
    } catch {}
  }

  async function confirmPayment(orderId: string) {
    try {
      await fetch(`/api/admin/orders/${orderId}/confirm-payment`, { method: "PATCH" });
      setOrders((prev) =>
        prev.map((o) =>
          o.id === orderId ? { ...o, paymentStatus: "PAID", status: "IN_QUEUE" } : o
        )
      );
      if (selectedOrder?.id === orderId) {
        setSelectedOrder((prev) =>
          prev ? { ...prev, paymentStatus: "PAID", status: "IN_QUEUE" } : prev
        );
      }
    } catch {}
  }

  const activeOrders = orders.filter((o) => !["COMPLETED", "CANCELLED"].includes(o.status));
  const historyOrders = orders.filter((o) => ["COMPLETED", "CANCELLED"].includes(o.status));

  function getStatusConfig(status: string) {
    return STATUS_OPTIONS.find((s) => s.value === status) ?? STATUS_OPTIONS[0];
  }

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-text-dark">Pedidos</h1>
          <p className="text-sm text-text-muted">
            {activeOrders.length} ativos • Atualiza automaticamente
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Active orders */}
        <div className="lg:col-span-2 flex flex-col gap-3">
          <h2 className="font-semibold text-sm text-text-muted uppercase tracking-wide">
            Pedidos Ativos
          </h2>
          {activeOrders.length === 0 && (
            <div className="rounded-2xl border p-8 text-center text-sm text-text-muted" style={{ background: "white", borderColor: "var(--cream-dark)" }}>
              Nenhum pedido ativo
            </div>
          )}
          {activeOrders.map((order) => {
            const sc = getStatusConfig(order.status);
            return (
              <div
                key={order.id}
                onClick={() => setSelectedOrder(order)}
                className="rounded-2xl border p-4 cursor-pointer hover:shadow-sm transition-all"
                style={{
                  background: "white",
                  borderColor: selectedOrder?.id === order.id ? "var(--orange)" : "var(--cream-dark)",
                }}
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-mono font-black text-lg text-text-dark">
                        #{order.displayCode}
                      </span>
                      <span
                        className="text-xs font-semibold px-2 py-0.5 rounded-full"
                        style={{ color: sc.color, background: `${sc.color}15` }}
                      >
                        {sc.label}
                      </span>
                      {COUNTER_METHODS.includes(order.paymentMethod) && (
                        <span
                          className="text-xs font-medium px-2 py-0.5 rounded-full"
                          style={{
                            color: order.paymentStatus === "PAID" ? "#10B981" : "#E86A1A",
                            background: order.paymentStatus === "PAID" ? "#10B98115" : "#E86A1A15",
                          }}
                        >
                          {order.paymentStatus === "PAID" ? "Pago ✓" : PAYMENT_METHOD_LABEL[order.paymentMethod]}
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-text-dark">{order.customerName}</p>
                    {order.tableLabel && (
                      <p className="text-xs text-text-muted">{order.tableLabel}</p>
                    )}
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="font-bold text-sm" style={{ color: "var(--orange)" }}>
                      {formatCurrency(order.total)}
                    </p>
                    <p className="text-xs text-text-muted">
                      {new Date(order.createdAt).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}
                    </p>
                  </div>
                </div>

                {/* Confirm payment button for counter orders */}
                {COUNTER_METHODS.includes(order.paymentMethod) && order.paymentStatus !== "PAID" && (
                  <button
                    onClick={(e) => { e.stopPropagation(); confirmPayment(order.id); }}
                    className="w-full mt-3 py-2 rounded-xl text-sm font-semibold text-white transition-opacity hover:opacity-90"
                    style={{ background: "#10B981" }}
                  >
                    ✓ Confirmar Pagamento
                  </button>
                )}

                {/* Status action buttons */}
                <div className="flex gap-2 mt-2 flex-wrap">
                  {STATUS_OPTIONS.filter((s) => s.value !== order.status && !["COMPLETED", "CANCELLED"].includes(s.value) || s.value === "CANCELLED").map((s) => (
                    <button
                      key={s.value}
                      onClick={(e) => { e.stopPropagation(); updateStatus(order.id, s.value); }}
                      className="text-xs font-medium px-2.5 py-1.5 rounded-lg border transition-all hover:opacity-90"
                      style={{ borderColor: s.color, color: s.color }}
                    >
                      → {s.label}
                    </button>
                  ))}
                </div>
              </div>
            );
          })}

          {/* History */}
          {historyOrders.length > 0 && (
            <>
              <h2 className="font-semibold text-sm text-text-muted uppercase tracking-wide mt-4">
                Histórico
              </h2>
              {historyOrders.slice(0, 10).map((order) => {
                const sc = getStatusConfig(order.status);
                return (
                  <div
                    key={order.id}
                    className="rounded-xl border p-3 flex items-center justify-between opacity-60"
                    style={{ background: "white", borderColor: "var(--cream-dark)" }}
                  >
                    <div className="flex items-center gap-3">
                      <span className="font-mono font-bold text-sm text-text-dark">
                        #{order.displayCode}
                      </span>
                      <span className="text-sm text-text-muted">{order.customerName}</span>
                      <span className="text-xs font-medium" style={{ color: sc.color }}>
                        {sc.label}
                      </span>
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

        {/* Order detail */}
        <div className="lg:col-span-1">
          {selectedOrder ? (
            <div
              className="rounded-2xl border p-5 sticky top-6"
              style={{ background: "white", borderColor: "var(--cream-dark)" }}
            >
              <h3 className="font-bold text-text-dark mb-1">
                Pedido #{selectedOrder.displayCode}
              </h3>
              <div className="flex items-center gap-2 mb-4">
                <p className="text-sm text-text-muted">{selectedOrder.customerName}</p>
                {COUNTER_METHODS.includes(selectedOrder.paymentMethod) && (
                  <span
                    className="text-xs font-medium px-2 py-0.5 rounded-full"
                    style={{
                      color: selectedOrder.paymentStatus === "PAID" ? "#10B981" : "#E86A1A",
                      background: selectedOrder.paymentStatus === "PAID" ? "#10B98115" : "#E86A1A15",
                    }}
                  >
                    {selectedOrder.paymentStatus === "PAID" ? "Pago ✓" : PAYMENT_METHOD_LABEL[selectedOrder.paymentMethod]}
                  </span>
                )}
              </div>

              <div className="flex flex-col gap-2 mb-4">
                {selectedOrder.items.map((item) => (
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

              {selectedOrder.notes && (
                <div
                  className="rounded-xl p-3 mb-4 text-sm text-text-muted"
                  style={{ background: "var(--cream-dark)" }}
                >
                  Obs: {selectedOrder.notes}
                </div>
              )}

              <p className="font-bold text-lg mb-4" style={{ color: "var(--orange)" }}>
                {formatCurrency(selectedOrder.total)}
              </p>

              {COUNTER_METHODS.includes(selectedOrder.paymentMethod) && selectedOrder.paymentStatus !== "PAID" && (
                <button
                  onClick={() => confirmPayment(selectedOrder.id)}
                  className="w-full py-3 rounded-xl text-sm font-semibold text-white mb-3 transition-opacity hover:opacity-90"
                  style={{ background: "#10B981" }}
                >
                  ✓ Confirmar Pagamento no Balcão
                </button>
              )}

              <div className="flex flex-col gap-2">
                {STATUS_OPTIONS.filter((s) => s.value !== selectedOrder.status).map((s) => (
                  <button
                    key={s.value}
                    onClick={() => updateStatus(selectedOrder.id, s.value)}
                    className="w-full py-2.5 rounded-xl text-sm font-semibold text-white transition-opacity hover:opacity-90"
                    style={{ background: s.color }}
                  >
                    Mudar para: {s.label}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div
              className="rounded-2xl border p-8 text-center text-sm text-text-muted"
              style={{ background: "white", borderColor: "var(--cream-dark)" }}
            >
              Clique em um pedido para ver detalhes
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
