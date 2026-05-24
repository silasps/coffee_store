import { requireStoreAccess } from "@/lib/auth";
import { db } from "@/lib/db";
import { notFound } from "next/navigation";
import { SellerOrdersClient } from "@/components/seller/seller-orders-client";

type Props = {
  params: Promise<{ locale: string; storeId: string }>;
};

export default async function SellerOrdersPage({ params }: Props) {
  const { locale, storeId } = await params;

  await requireStoreAccess(storeId, locale);

  const store = await db.store.findUnique({ where: { id: storeId }, select: { id: true } });
  if (!store) notFound();

  const since = new Date();
  since.setHours(0, 0, 0, 0);

  const orders = await db.order.findMany({
    where: {
      storeId,
      createdAt: { gte: since },
    },
    orderBy: { createdAt: "desc" },
    take: 80,
    select: {
      id: true,
      displayCode: true,
      customerName: true,
      tableLabel: true,
      channel: true,
      status: true,
      total: true,
      createdAt: true,
      items: {
        select: { productNamePt: true, quantity: true, notes: true },
      },
    },
  });

  const serialized = orders.map((o) => ({
    ...o,
    total: Number(o.total),
    createdAt: o.createdAt.toISOString(),
  }));

  return <SellerOrdersClient orders={serialized} storeId={storeId} />;
}
