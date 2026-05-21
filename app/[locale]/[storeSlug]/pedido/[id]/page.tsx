import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { OrderStatusClient } from "@/components/cart/order-status-client";

type Props = {
  params: Promise<{ locale: string; storeSlug: string; id: string }>;
  searchParams: Promise<{ pix?: string; copy?: string; link?: string }>;
};

export default async function OrderStatusPage({ params, searchParams }: Props) {
  const { locale, storeSlug, id } = await params;
  const { pix, copy, link } = await searchParams;

  const order = await db.order.findUnique({
    where: { id },
    include: { items: true },
  });

  if (!order) notFound();

  return (
    <OrderStatusClient
      order={{
        id: order.id,
        displayCode: order.displayCode,
        customerName: order.customerName,
        status: order.status,
        paymentMethod: order.paymentMethod,
        paymentStatus: order.paymentStatus,
        total: Number(order.total),
        items: order.items.map((item) => ({
          id: item.id,
          productNamePt: item.productNamePt,
          quantity: item.quantity,
          totalPrice: item.totalPrice ? Number(item.totalPrice) : null,
          notes: item.notes,
        })),
      }}
      pixQrCode={pix ? decodeURIComponent(pix) : null}
      pixCopyPaste={copy ? decodeURIComponent(copy) : null}
      paymentLink={link ? decodeURIComponent(link) : null}
      storeSlug={storeSlug}
      locale={locale}
    />
  );
}
