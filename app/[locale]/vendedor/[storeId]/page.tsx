import { requireStoreAccess } from "@/lib/auth";
import { db } from "@/lib/db";
import { notFound } from "next/navigation";
import { SellerDashboardClient } from "@/components/seller/seller-dashboard-client";

type Props = {
  params: Promise<{ locale: string; storeId: string }>;
};

export default async function SellerHomePage({ params }: Props) {
  const { locale, storeId } = await params;

  const { user } = await requireStoreAccess(storeId, locale);

  const store = await db.store.findUnique({
    where: { id: storeId },
    select: { id: true },
  });

  if (!store) notFound();

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  const [activeOrders, myOrdersToday] = await Promise.all([
    db.order.findMany({
      where: { storeId, status: { in: ["IN_QUEUE", "PREPARING", "READY"] } },
      orderBy: { createdAt: "desc" },
      take: 30,
      select: {
        id: true,
        displayCode: true,
        customerName: true,
        tableLabel: true,
        channel: true,
        status: true,
        createdAt: true,
      },
    }),
    db.order.findMany({
      where: {
        storeId,
        sellerId: user.id,
        createdAt: { gte: today, lt: tomorrow },
      },
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        displayCode: true,
        customerName: true,
        status: true,
        total: true,
        createdAt: true,
        items: {
          select: { productNamePt: true, quantity: true },
          take: 3,
        },
      },
    }),
  ]);

  const serialized = {
    activeOrders: activeOrders.map((o) => ({
      ...o,
      createdAt: o.createdAt.toISOString(),
    })),
    myOrdersToday: myOrdersToday.map((o) => ({
      ...o,
      total: Number(o.total),
      createdAt: o.createdAt.toISOString(),
    })),
    sellerName: user.name ?? "Vendedor",
    storeId,
  };

  return <SellerDashboardClient {...serialized} />;
}
