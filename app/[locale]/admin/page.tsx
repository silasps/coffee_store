import { requireSuperAdmin } from "@/lib/auth";
import { db } from "@/lib/db";
import { SuperAdminDashboard } from "@/components/admin/super-admin-dashboard";

type Props = {
  params: Promise<{ locale: string }>;
};

export default async function SuperAdminPage({ params }: Props) {
  const { locale } = await params;
  await requireSuperAdmin(locale);

  const [userCount, storeCount, activeSubscriptions] = await Promise.all([
    db.user.count(),
    db.store.count(),
    db.subscription.count({ where: { status: { in: ["ACTIVE", "TRIALING"] } } }),
  ]);

  const recentStores = await db.store.findMany({
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
  });

  const ownerIds = [...new Set(recentStores.map((s) => s.ownerId))];
  const owners = await db.user.findMany({
    where: { id: { in: ownerIds } },
    select: { id: true, name: true, email: true, subscription: { select: { status: true, plan: { select: { name: true } } } } },
  });
  const ownerMap = Object.fromEntries(owners.map((o) => [o.id, o]));

  return (
    <SuperAdminDashboard
      stats={{ userCount, storeCount, activeSubscriptions }}
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
