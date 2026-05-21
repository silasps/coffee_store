import { db } from "@/lib/db";
import { requireStoreAccess } from "@/lib/auth";
import { ShoppingBag, DollarSign, TrendingUp, Clock } from "lucide-react";
import { formatCurrency } from "@/components/ui/format-currency";

type Props = {
  params: Promise<{ locale: string; storeId: string }>;
};

export default async function StoreDashboardPage({ params }: Props) {
  const { storeId } = await params;
  await requireStoreAccess(storeId);

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  const [todayOrders, pendingOrders, todayRevenue, totalProducts] = await Promise.all([
    db.order.count({
      where: { storeId, createdAt: { gte: today, lt: tomorrow } },
    }),
    db.order.count({
      where: { storeId, status: { in: ["IN_QUEUE", "PREPARING"] } },
    }),
    db.financeEntry.aggregate({
      where: {
        storeId,
        direction: "INCOME",
        happenedAt: { gte: today, lt: tomorrow },
      },
      _sum: { amount: true },
    }),
    db.product.count({ where: { storeId, isAvailable: true } }),
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

  const revenue = Number(todayRevenue._sum.amount ?? 0);

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
    {
      label: "Receita hoje",
      value: formatCurrency(revenue),
      icon: <DollarSign size={20} />,
      color: "#10B981",
    },
    {
      label: "Produtos ativos",
      value: totalProducts,
      icon: <TrendingUp size={20} />,
      color: "#3B82F6",
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

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-text-dark">Dashboard</h1>
        <p className="text-sm text-text-muted">
          {today.toLocaleDateString("pt-BR", { weekday: "long", day: "numeric", month: "long" })}
        </p>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
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
