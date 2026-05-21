import { db } from "@/lib/db";
import { requireStoreAccess } from "@/lib/auth";
import { OrdersClient } from "@/components/admin/orders-client";

type Props = {
  params: Promise<{ locale: string; storeId: string }>;
};

export default async function OrdersPage({ params }: Props) {
  const { storeId } = await params;
  await requireStoreAccess(storeId);

  const orders = await db.order.findMany({
    where: { storeId },
    orderBy: { createdAt: "desc" },
    take: 50,
    include: {
      items: { select: { id: true, productNamePt: true, quantity: true, notes: true } },
    },
  });

  const serialized = orders.map((o) => ({
    ...o,
    subtotal: Number(o.subtotal),
    total: Number(o.total),
    createdAt: o.createdAt.toISOString(),
    updatedAt: o.updatedAt.toISOString(),
    paidAt: o.paidAt?.toISOString() ?? null,
    readyAt: o.readyAt?.toISOString() ?? null,
    completedAt: o.completedAt?.toISOString() ?? null,
  }));

  return <OrdersClient orders={serialized} storeId={storeId} />;
}
