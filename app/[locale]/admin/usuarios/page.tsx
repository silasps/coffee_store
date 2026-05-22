import { requireSuperAdmin } from "@/lib/auth";
import { db } from "@/lib/db";
import { UsersClient } from "@/components/admin/users-client";

type Props = { params: Promise<{ locale: string }> };

export default async function AdminUsuariosPage({ params }: Props) {
  const { locale } = await params;
  await requireSuperAdmin(locale);

  const users = await db.user.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      subscription: { include: { plan: { select: { name: true, priceMonthly: true } } } },
      _count: { select: { stores: true } },
    },
  });

  return (
    <UsersClient
      locale={locale}
      users={users.map((u) => ({
        id: u.id,
        name: u.name,
        email: u.email,
        phone: u.phone,
        role: u.role,
        storeCount: u._count.stores,
        subscriptionStatus: u.subscription?.status ?? null,
        planName: u.subscription?.plan.name ?? null,
        trialUntil: u.subscription?.trialUntil?.toISOString() ?? null,
        createdAt: u.createdAt.toISOString(),
      }))}
    />
  );
}
