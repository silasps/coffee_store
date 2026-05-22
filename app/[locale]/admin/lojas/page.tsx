import { requireSuperAdmin } from "@/lib/auth";
import { db } from "@/lib/db";
import { AdminStoresClient } from "@/components/admin/admin-stores-client";

type Props = { params: Promise<{ locale: string }> };

export default async function AdminLojasPage({ params }: Props) {
  const { locale } = await params;
  await requireSuperAdmin(locale);

  const stores = await db.store.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      owner: {
        select: {
          id: true,
          name: true,
          email: true,
          phone: true,
          subscription: { include: { plan: { select: { name: true } } } },
        },
      },
      _count: { select: { orders: true, products: true } },
    },
  });

  return (
    <AdminStoresClient
      locale={locale}
      stores={stores.map((s) => ({
        id: s.id,
        slug: s.slug,
        namePt: s.namePt,
        logoUrl: s.logoUrl,
        isActive: s.isActive,
        ownerId: s.owner.id,
        ownerName: s.owner.name,
        ownerEmail: s.owner.email,
        ownerPhone: s.owner.phone,
        planName: s.owner.subscription?.plan.name ?? null,
        subscriptionStatus: s.owner.subscription?.status ?? null,
        orderCount: s._count.orders,
        productCount: s._count.products,
        createdAt: s.createdAt.toISOString(),
      }))}
    />
  );
}
