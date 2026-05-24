"use client";

import { useEffect, useState, useCallback } from "react";
import { Clock, ChefHat, CheckCircle, Monitor, Utensils, Store } from "lucide-react";

type ActiveOrder = {
  id: string;
  displayCode: string;
  customerName: string;
  tableLabel: string | null;
  channel: string;
  status: string;
  createdAt: string;
};

type MyOrder = {
  id: string;
  displayCode: string;
  customerName: string;
  status: string;
  total: number;
  createdAt: string;
  items: { productNamePt: string; quantity: number }[];
};

type Props = {
  activeOrders: ActiveOrder[];
  myOrdersToday: MyOrder[];
  sellerName: string;
  storeId: string;
};

const statusConfig: Record<string, { label: string; color: string }> = {
  AWAITING_PAYMENT: { label: "Aguardando pgto", color: "#E86A1A" },
  IN_QUEUE:         { label: "Na fila",          color: "#3B82F6" },
  PREPARING:        { label: "Em preparo",        color: "#8B5CF6" },
  READY:            { label: "Pronto",            color: "#10B981" },
  COMPLETED:        { label: "Entregue",          color: "#6B7280" },
  CANCELLED:        { label: "Cancelado",         color: "#EF4444" },
};

const channelIcon: Record<string, React.ReactNode> = {
  TOTEM:   <Monitor size={13} />,
  TABLE:   <Utensils size={13} />,
  COUNTER: <Store size={13} />,
};

function StatusBadge({ status }: { status: string }) {
  const cfg = statusConfig[status] ?? { label: status, color: "#6B7280" };
  return (
    <span
      className="inline-flex items-center text-xs font-semibold px-2 py-0.5 rounded-full whitespace-nowrap"
      style={{ color: cfg.color, background: `${cfg.color}18` }}
    >
      {cfg.label}
    </span>
  );
}

function greeting(name: string) {
  const h = new Date().getHours();
  const part = h < 12 ? "Bom dia" : h < 18 ? "Boa tarde" : "Boa noite";
  return `${part}, ${name.split(" ")[0]}!`;
}

function fmtTime(iso: string) {
  return new Date(iso).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
}

function fmtItems(items: { productNamePt: string; quantity: number }[]) {
  return items.map((i) => `${i.quantity}× ${i.productNamePt}`).join(", ");
}

export function SellerDashboardClient({ activeOrders: initial, myOrdersToday: initialMine, sellerName, storeId }: Props) {
  const [activeOrders, setActiveOrders] = useState<ActiveOrder[]>(initial);
  const [myOrders] = useState<MyOrder[]>(initialMine);

  const refresh = useCallback(async () => {
    try {
      const res = await fetch(`/api/admin/stores/${storeId}/orders`);
      if (!res.ok) return;
      const data: ActiveOrder[] = await res.json();
      const orders = data
        .filter((o) => ["IN_QUEUE", "PREPARING", "READY"].includes(o.status))
        .slice(0, 30);
      setActiveOrders(orders);
    } catch {
      // silent
    }
  }, [storeId]);

  useEffect(() => {
    const id = setInterval(refresh, 15000);
    return () => clearInterval(id);
  }, [refresh]);

  const inQueue   = activeOrders.filter((o) => o.status === "IN_QUEUE").length;
  const preparing = activeOrders.filter((o) => o.status === "PREPARING").length;
  const ready     = activeOrders.filter((o) => o.status === "READY").length;

  return (
    <div className="p-4 space-y-5">
      {/* Greeting */}
      <div className="pt-1">
        <h1 className="text-xl font-black" style={{ color: "var(--brown-dark)" }}>
          {greeting(sellerName)}
        </h1>
        <p className="text-sm" style={{ color: "var(--text-muted)" }}>
          {new Date().toLocaleDateString("pt-BR", { weekday: "long", day: "numeric", month: "long" })}
        </p>
      </div>

      {/* Live counters */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: "Na fila",    value: inQueue,   color: "#3B82F6", Icon: Clock },
          { label: "Em preparo", value: preparing, color: "#8B5CF6", Icon: ChefHat },
          { label: "Prontos",    value: ready,     color: "#10B981", Icon: CheckCircle },
        ].map(({ label, value, color, Icon }) => (
          <div
            key={label}
            className="rounded-2xl p-3 text-center border"
            style={{ background: "white", borderColor: "var(--cream-dark)" }}
          >
            <div
              className="w-8 h-8 rounded-xl flex items-center justify-center mx-auto mb-1.5"
              style={{ background: `${color}15`, color }}
            >
              <Icon size={17} />
            </div>
            <p className="text-2xl font-black" style={{ color: "var(--brown-dark)" }}>{value}</p>
            <p className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>{label}</p>
          </div>
        ))}
      </div>

      {/* My orders today */}
      <section>
        <h2 className="text-sm font-bold mb-2" style={{ color: "var(--brown-dark)" }}>
          Meus pedidos hoje
        </h2>
        <div
          className="rounded-2xl border overflow-hidden"
          style={{ background: "white", borderColor: "var(--cream-dark)" }}
        >
          {myOrders.length === 0 ? (
            <p className="px-4 py-6 text-sm text-center" style={{ color: "var(--text-muted)" }}>
              Você ainda não fez pedidos hoje
            </p>
          ) : (
            <ul className="divide-y" style={{ borderColor: "var(--cream-dark)" }}>
              {myOrders.map((o) => (
                <li key={o.id} className="flex items-start gap-3 px-4 py-3">
                  <span
                    className="font-mono font-black text-sm mt-0.5"
                    style={{ color: "var(--orange)" }}
                  >
                    #{o.displayCode}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold truncate" style={{ color: "var(--brown-dark)" }}>
                      {o.customerName}
                    </p>
                    <p className="text-xs truncate" style={{ color: "var(--text-muted)" }}>
                      {fmtItems(o.items)}
                    </p>
                  </div>
                  <div className="flex flex-col items-end gap-1 shrink-0">
                    <StatusBadge status={o.status} />
                    <span className="text-xs" style={{ color: "var(--text-muted)" }}>{fmtTime(o.createdAt)}</span>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>

      {/* All active store orders */}
      <section>
        <h2 className="text-sm font-bold mb-1" style={{ color: "var(--brown-dark)" }}>
          Pedidos ativos da loja
        </h2>
        <p className="text-xs mb-2" style={{ color: "var(--text-muted)" }}>
          Para responder clientes
        </p>
        <div
          className="rounded-2xl border overflow-hidden"
          style={{ background: "white", borderColor: "var(--cream-dark)" }}
        >
          {activeOrders.length === 0 ? (
            <p className="px-4 py-6 text-sm text-center" style={{ color: "var(--text-muted)" }}>
              Nenhum pedido ativo no momento
            </p>
          ) : (
            <ul className="divide-y" style={{ borderColor: "var(--cream-dark)" }}>
              {activeOrders.map((o) => (
                <li key={o.id} className="flex items-center gap-3 px-4 py-3">
                  <span
                    className="font-mono font-black text-sm"
                    style={{ color: "var(--orange)" }}
                  >
                    #{o.displayCode}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate" style={{ color: "var(--brown-dark)" }}>
                      {o.customerName}
                      {o.tableLabel && (
                        <span className="ml-1 text-xs" style={{ color: "var(--text-muted)" }}>
                          · {o.tableLabel}
                        </span>
                      )}
                    </p>
                  </div>
                  <span
                    className="flex items-center gap-1 text-xs"
                    style={{ color: "var(--text-muted)" }}
                    title={o.channel}
                  >
                    {channelIcon[o.channel]}
                  </span>
                  <StatusBadge status={o.status} />
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>
    </div>
  );
}
