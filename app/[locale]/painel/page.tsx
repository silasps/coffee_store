import { requireAuth } from "@/lib/auth";
import { db } from "@/lib/db";
import { redirect } from "next/navigation";
import { StoreListClient } from "@/components/admin/store-list-client";

type Props = {
  params: Promise<{ locale: string }>;
};

export default async function PainelPage({ params }: Props) {
  const { locale } = await params;

  const user = await requireAuth(locale);

  // Super Admin: redirect to the platform dashboard
  if (user.role === "SUPER_ADMIN") {
    redirect(`/${locale}/admin`);
  }

  // Store Admin: redirect directly to their store
  if (user.role === "STORE_ADMIN" || user.role === "SELLER") {
    const membership = await db.storeTeamMember.findFirst({
      where: { userId: user.id },
      select: { storeId: true },
    });
    if (membership) redirect(`/${locale}/painel/${membership.storeId}`);
    redirect(`/${locale}/acesso`);
  }

  // Owner: show only their stores
  const stores = await db.store.findMany({
    where: { ownerId: user.id },
    orderBy: { createdAt: "desc" },
    include: {
      _count: { select: { orders: true, products: true } },
      owner: { select: { name: true, email: true } },
    },
  });

  return (
    <StoreListClient
      stores={stores.map((s) => ({
        id: s.id,
        slug: s.slug,
        namePt: s.namePt,
        logoUrl: s.logoUrl,
        isActive: s.isActive,
        ownerName: s.owner.name ?? s.owner.email,
        orderCount: s._count.orders,
        productCount: s._count.products,
        createdAt: s.createdAt.toISOString(),
      }))}
      locale={locale}
      isSuperAdmin={false}
      userName={user.name ?? user.email}
    />
  );
}
