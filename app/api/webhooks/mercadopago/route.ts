import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { mpPayment } from "@/lib/mercadopago";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { type, data } = body;

    if (type !== "payment" || !data?.id) {
      return NextResponse.json({ ok: true });
    }

    const payment = await mpPayment.get({ id: data.id });
    const externalRef = payment.external_reference;
    const status = payment.status;

    if (!externalRef) return NextResponse.json({ ok: true });

    const order = await db.order.findUnique({ where: { id: externalRef } });
    if (!order) return NextResponse.json({ ok: true });

    if (status === "approved") {
      await db.order.update({
        where: { id: order.id },
        data: {
          paymentStatus: "PAID",
          status: "IN_QUEUE",
          paidAt: new Date(),
        },
      });

      await db.financeEntry.create({
        data: {
          storeId: order.storeId,
          orderId: order.id,
          direction: "INCOME",
          category: "SALE",
          description: `Pedido ${order.displayCode}`,
          amount: order.total,
        },
      });
    } else if (status === "rejected" || status === "cancelled") {
      await db.order.update({
        where: { id: order.id },
        data: { paymentStatus: "FAILED", status: "CANCELLED" },
      });
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
