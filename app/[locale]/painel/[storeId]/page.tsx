import { db } from "@/lib/db";
import { requireStoreAccess } from "@/lib/auth";
import { ShoppingBag, Clock, AlertTriangle, BarChart2 } from "lucide-react";
import { formatCurrency } from "@/components/ui/format-currency";
import Link from "next/link";

type Props = {
  params: Promise<{ locale: string; storeId: string }>;
};

export default async function StoreDashboardPage({ params }: Props) {
  const { storeId, locale } = await params;
  await requireStoreAccess(storeId);

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);
  const twentyMinAgo = new Date(Date.now() - 20 * 60 * 1000);

  const [
    todayOrders,
    pendingOrders,
    delayedOrders,
    channelBreakdown,
    topProducts,
    lowStock,
  ] = await Promise.all([
    db.order.count({
      where: { storeId, createdAt: { gte: today, lt: tomorrow } },
    }),
    db.order.count({
      where: { storeId, status: { in: ["IN_QUEUE", "PREPARING"] } },
    }),
    db.order.count({
      where: {
        storeId,
        status: { in: ["IN_QUEUE", "PREPARING"] },
        createdAt: { lt: twentyMinAgo },
      },
    }),
    db.order.groupBy({
      by: ["channel"],
      where: { storeId, createdAt: { gte: today, lt: tomorrow } },
      _count: true,
    }),
    db.orderItem.groupBy({
      by: ["productNamePt"],
      where: { order: { storeId, createdAt: { gte: today, lt: tomorrow } } },
      _sum: { quantity: true },
      orderBy: { _sum: { quantity: "desc" } },
      take: 5,
    }),
    db.product.findMany({
      where: { storeId, isAvailable: true, stockQuantity: { lte: 3, not: null } },
      select: { namePt: true, stockQuantity: true },
      orderBy: { stockQuantity: "asc" },
      take: 5,
    }),
  ]);

  const recentOrders = await db.order.findMany({
    where: { storeId },
    orderBy: { createdAt: "desc" },
    take: 10,
    select: {
      id: true,
      displayCode: true,
      customerName: true,
      tableLabel: true,
      status: true,
      paymentStatus: true,
      total: true,
      createdAt: true,
    },
  });

  const stats = [
    {
      label: "Pedidos hoje",
      value: todayOrders,
      icon: <ShoppingBag size={20} />,
      color: "var(--orange)",
    },
    {
      label: "Em preparo",
      value: pendingOrders,
      icon: <Clock size={20} />,
      color: "#8B5CF6",
    },
  ];

  const statusLabel: Record<string, string> = {
    AWAITING_PAYMENT: "Aguardando pgto",
    IN_QUEUE: "Na fila",
    PREPARING: "Em preparo",
    READY: "Pronto",
    COMPLETED: "Entregue",
    CANCELLED: "Cancelado",
  };

  const statusColor: Record<string, string> = {
    AWAITING_PAYMENT: "#E86A1A",
    IN_QUEUE: "#3B82F6",
    PREPARING: "#8B5CF6",
    READY: "#10B981",
    COMPLETED: "#6B7280",
    CANCELLED: "#EF4444",
  };

  const channelLabel: Record<string, string> = {
    TOTEM: "Totem",
    TABLE: "Mesa",
    COUNTER: "Balcão",
  };

  const maxQty = Math.max(1, ...topProducts.map((p) => Number(p._sum.quantity ?? 0)));

  return (
    <div className="p-6 space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-text-dark">Dashboard</h1>
        <p className="text-sm text-text-muted">
          {today.toLocaleDateString("pt-BR", { weekday: "long", day: "numeric", month: "long" })}
        </p>
      </div>

      {/* Delayed orders alert */}
      {delayedOrders > 0 && (
        <Link
          href={`/${locale}/painel/${storeId}/pedidos`}
          className="flex items-center gap-3 rounded-2xl px-4 py-3 border transition-opacity hover:opacity-80"
          style={{ background: "#FFF7ED", borderColor: "#FED7AA" }}
        >
          <AlertTriangle size={20} style={{ color: "var(--orange)", flexShrink: 0 }} />
          <p className="text-sm font-semibold flex-1" style={{ color: "#92400E" }}>
            {delayedOrders} {delayedOrders === 1 ? "pedido atrasado" : "pedidos atrasados"} (+20 min sem atualização)
          </p>
          <span className="text-xs font-medium" style={{ color: "var(--orange)" }}>Ver →</span>
        </Link>
      )}

      {/* Main stats */}
      <div className="grid grid-cols-2 gap-4">
        {stats.map((stat) => (
          <div
            key={stat.label}
            className="rounded-2xl p-4 border"
            style={{ background: "white", borderColor: "var(--cream-dark)" }}
          >
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center mb-3"
              style={{ background: `${stat.color}15`, color: stat.color }}
            >
              {stat.icon}
            </div>
            <p className="text-2xl font-black text-text-dark">{stat.value}</p>
            <p className="text-xs text-text-muted mt-0.5">{stat.label}</p>
          </div>
        ))}
      </div>

      {/* Channel breakdown */}
      {channelBreakdown.length > 0 && (
        <div
          className="rounded-2xl p-4 border flex flex-wrap items-center gap-4"
          style={{ background: "white", borderColor: "var(--cream-dark)" }}
        >
          <div className="flex items-center gap-2 text-sm font-semibold text-text-dark">
            <BarChart2 size={16} style={{ color: "var(--text-muted)" }} />
            Pedidos por canal
          </div>
          <div className="flex flex-wrap gap-3">
            {channelBreakdown.map((c) => (
              <span
                key={c.channel}
                className="text-sm font-semibold px-3 py-1 rounded-full border"
                style={{ borderColor: "var(--cream-dark)", color: "var(--brown-dark)" }}
              >
                {channelLabel[c.channel] ?? c.channel}&nbsp;
                <span style={{ color: "var(--orange)" }}>{c._count}</span>
              </span>
            ))}
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top products today */}
        {topProducts.length > 0 && (
          <div
            className="rounded-2xl border overflow-hidden"
            style={{ background: "white", borderColor: "var(--cream-dark)" }}
          >
            <div className="px-5 py-4 border-b" style={{ borderColor: "var(--cream-dark)" }}>
              <h2 className="font-bold text-text-dark">Mais pedidos hoje</h2>
            </div>
            <ul className="divide-y" style={{ borderColor: "var(--cream-dark)" }}>
              {topProducts.map((p) => {
                const qty = Number(p._sum.quantity ?? 0);
                const pct = Math.round((qty / maxQty) * 100);
                return (
                  <li key={p.productNamePt} className="px-5 py-3">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-medium text-text-dark truncate pr-2">{p.productNamePt}</span>
                      <span className="text-sm font-black shrink-0" style={{ color: "var(--orange)" }}>{qty}</span>
                    </div>
                    <div className="h-1.5 rounded-full overflow-hidden" style={{ background: "var(--cream-dark)" }}>
                      <div
                        className="h-full rounded-full"
                        style={{ width: `${pct}%`, background: "var(--orange)" }}
                      />
                    </div>
                  </li>
                );
              })}
            </ul>
          </div>
        )}

        {/* Low stock */}
        {lowStock.length > 0 && (
          <div
            className="rounded-2xl border overflow-hidden"
            style={{ background: "white", borderColor: "var(--cream-dark)" }}
          >
            <div className="px-5 py-4 border-b" style={{ borderColor: "var(--cream-dark)" }}>
              <h2 className="font-bold text-text-dark">Estoque baixo</h2>
            </div>
            <ul className="divide-y" style={{ borderColor: "var(--cream-dark)" }}>
              {lowStock.map((p) => (
                <li key={p.namePt} className="px-5 py-3 flex items-center justify-between">
                  <span className="text-sm text-text-dark truncate pr-2">{p.namePt}</span>
                  <span
                    className="text-xs font-bold px-2 py-0.5 rounded-full shrink-0"
                    style={
                      p.stockQuantity === 0
                        ? { background: "#FEE2E2", color: "#EF4444" }
                        : { background: "#FFF7ED", color: "#F97316" }
                    }
                  >
                    {p.stockQuantity === 0 ? "Esgotado" : `${p.stockQuantity} restantes`}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {/* Recent orders */}
      <div
        className="rounded-2xl border overflow-hidden"
        style={{ background: "white", borderColor: "var(--cream-dark)" }}
      >
        <div className="px-5 py-4 border-b" style={{ borderColor: "var(--cream-dark)" }}>
          <h2 className="font-bold text-text-dark">Pedidos Recentes</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr style={{ borderBottom: "1px solid var(--cream-dark)" }}>
                {["Código", "Cliente", "Mesa", "Status", "Total", "Hora"].map((h) => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-text-muted uppercase tracking-wide">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {recentOrders.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-sm text-text-muted">
                    Nenhum pedido ainda hoje
                  </td>
                </tr>
              ) : (
                recentOrders.map((order) => (
                  <tr
                    key={order.id}
                    className="border-b hover:bg-cream/50 transition-colors"
                    style={{ borderColor: "var(--cream-dark)" }}
                  >
                    <td className="px-4 py-3 font-mono font-bold text-sm text-text-dark">
                      #{order.displayCode}
                    </td>
                    <td className="px-4 py-3 text-sm text-text-dark">{order.customerName}</td>
                    <td className="px-4 py-3 text-sm text-text-muted">{order.tableLabel ?? "—"}</td>
                    <td className="px-4 py-3">
                      <span
                        className="text-xs font-semibold px-2 py-1 rounded-full"
                        style={{
                          color: statusColor[order.status],
                          background: `${statusColor[order.status]}15`,
                        }}
                      >
                        {statusLabel[order.status]}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm font-semibold" style={{ color: "var(--orange)" }}>
                      {formatCurrency(Number(order.total))}
                    </td>
                    <td className="px-4 py-3 text-xs text-text-muted">
                      {order.createdAt.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
