import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function PATCH(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const order = await db.order.findUnique({
    where: { id },
    select: { id: true, storeId: true, displayCode: true, total: true, paymentStatus: true },
  });

  if (!order) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (order.paymentStatus === "PAID") {
    return NextResponse.json({ error: "Already paid" }, { status: 409 });
  }

  await db.$transaction([
    db.order.update({
      where: { id },
      data: {
        paymentStatus: "PAID",
        status: "IN_QUEUE",
        paidAt: new Date(),
      },
    }),
    db.financeEntry.create({
      data: {
        storeId: order.storeId,
        orderId: order.id,
        direction: "INCOME",
        category: "SALE",
        description: `Pedido ${order.displayCode}`,
        amount: order.total,
      },
    }),
  ]);

  return NextResponse.json({ ok: true });
}
