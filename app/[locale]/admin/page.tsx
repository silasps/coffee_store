import { requireSuperAdmin } from "@/lib/auth";
import { db } from "@/lib/db";
import { SuperAdminDashboard } from "@/components/admin/super-admin-dashboard";

type Props = {
  params: Promise<{ locale: string }>;
};

export default async function SuperAdminPage({ params }: Props) {
  const { locale } = await params;
  await requireSuperAdmin(locale);

  const thisMonthStart = new Date();
  thisMonthStart.setDate(1);
  thisMonthStart.setHours(0, 0, 0, 0);

  const [userCount, storeCount, activeSubscriptions, aiUsageThisMonth, aiUsageByStore] = await Promise.all([
    db.user.count(),
    db.store.count(),
    db.subscription.count({ where: { status: { in: ["ACTIVE", "TRIALING"] } } }),
    db.aiUsage.aggregate({
      where: { createdAt: { gte: thisMonthStart } },
      _sum: { inputTokens: true, outputTokens: true },
      _count: true,
    }),
    db.aiUsage.groupBy({
      by: ["storeId"],
      where: { createdAt: { gte: thisMonthStart } },
      _sum: { inputTokens: true, outputTokens: true },
      _count: true,
      orderBy: { _sum: { inputTokens: "desc" } },
      take: 10,
    }),
  ]);

  const storeIdsWithUsage = aiUsageByStore.map((u) => u.storeId);
  const [recentStores, storesWithUsage] = await Promise.all([
    db.store.findMany({
      orderBy: { createdAt: "desc" },
      take: 10,
      select: {
        id: true,
        slug: true,
        namePt: true,
        isActive: true,
        ownerId: true,
        createdAt: true,
        _count: { select: { orders: true } },
      },
    }),
    db.store.findMany({
      where: { id: { in: storeIdsWithUsage } },
      select: { id: true, namePt: true },
    }),
  ]);

  const storeNameMap = Object.fromEntries(storesWithUsage.map((s) => [s.id, s.namePt]));

  const ownerIds = [...new Set(recentStores.map((s) => s.ownerId))];
  const owners = await db.user.findMany({
    where: { id: { in: ownerIds } },
    select: { id: true, name: true, email: true, subscription: { select: { status: true, plan: { select: { name: true } } } } },
  });
  const ownerMap = Object.fromEntries(owners.map((o) => [o.id, o]));

  const INPUT_COST_PER_TOKEN = 1.0 / 1_000_000;
  const OUTPUT_COST_PER_TOKEN = 5.0 / 1_000_000;

  const totalInputTokens = aiUsageThisMonth._sum.inputTokens ?? 0;
  const totalOutputTokens = aiUsageThisMonth._sum.outputTokens ?? 0;
  const totalCostUsd = totalInputTokens * INPUT_COST_PER_TOKEN + totalOutputTokens * OUTPUT_COST_PER_TOKEN;

  return (
    <SuperAdminDashboard
      stats={{ userCount, storeCount, activeSubscriptions }}
      aiUsage={{
        translationCount: aiUsageThisMonth._count,
        totalInputTokens,
        totalOutputTokens,
        totalCostUsd,
        byStore: aiUsageByStore.map((u) => ({
          storeId: u.storeId,
          storeName: storeNameMap[u.storeId] ?? u.storeId,
          translationCount: u._count,
          inputTokens: u._sum.inputTokens ?? 0,
          outputTokens: u._sum.outputTokens ?? 0,
          costUsd: (u._sum.inputTokens ?? 0) * INPUT_COST_PER_TOKEN + (u._sum.outputTokens ?? 0) * OUTPUT_COST_PER_TOKEN,
        })),
      }}
      stores={recentStores.map((s) => {
        const owner = ownerMap[s.ownerId];
        return {
          id: s.id,
          slug: s.slug,
          namePt: s.namePt,
          isActive: s.isActive,
          ownerName: owner?.name ?? owner?.email ?? "—",
          ownerEmail: owner?.email ?? "—",
          planName: owner?.subscription?.plan.name ?? "Sem plano",
          subscriptionStatus: owner?.subscription?.status ?? "NONE",
          orderCount: s._count.orders,
          createdAt: s.createdAt.toISOString(),
        };
      })}
      locale={locale}
    />
  );
}
