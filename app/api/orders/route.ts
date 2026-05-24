import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { createPixPayment, createPaymentLink } from "@/lib/mercadopago";
import { z } from "zod";
import { nanoid } from "nanoid";

const schema = z.object({
  storeId: z.string(),
  storeSlug: z.string(),
  customerName: z.string().min(1),
  tableLabel: z.string().optional(),
  notes: z.string().optional(),
  paymentMethod: z.enum(["PIX", "CARD_ONLINE", "PAY_LINK", "PAY_AT_COUNTER", "CASH_AT_COUNTER", "CARD_AT_COUNTER"]),
  channel: z.enum(["TOTEM", "TABLE", "COUNTER"]).default("TOTEM"),
  items: z.array(
    z.object({
      productId: z.string().optional(),
      productSlug: z.string(),
      productNamePt: z.string(),
      quantity: z.number().min(1),
      unitPrice: z.number(),
      totalPrice: z.number(),
      notes: z.string().optional(),
    })
  ),
  subtotal: z.number(),
  total: z.number(),
});

function generateCode(): string {
  return nanoid(6).toUpperCase();
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const data = schema.parse(body);

    const store = await db.store.findUnique({ where: { id: data.storeId } });
    if (!store) return NextResponse.json({ error: "Store not found" }, { status: 404 });

    const displayCode = generateCode();

    const isCounterPresential =
      data.channel === "COUNTER" &&
      (data.paymentMethod === "CASH_AT_COUNTER" || data.paymentMethod === "CARD_AT_COUNTER");

    const now = new Date();

    const orderData = {
      storeId: data.storeId,
      displayCode,
      customerName: data.customerName,
      tableLabel: data.tableLabel,
      notes: data.notes,
      channel: data.channel,
      status: isCounterPresential ? ("IN_QUEUE" as const) : ("AWAITING_PAYMENT" as const),
      paymentMethod: data.paymentMethod,
      paymentStatus: isCounterPresential ? ("PAID" as const) : ("PENDING" as const),
      paidAt: isCounterPresential ? now : null,
      subtotal: data.subtotal,
      total: data.total,
      items: {
        create: data.items.map((item) => ({
          productId: item.productId,
          productSlug: item.productSlug,
          productNamePt: item.productNamePt,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          totalPrice: item.totalPrice,
          notes: item.notes,
        })),
      },
    };

    let order: Awaited<ReturnType<typeof db.order.create>>;

    if (isCounterPresential) {
      const result = await db.$transaction(async (tx) => {
        const created = await tx.order.create({ data: orderData });
        await tx.financeEntry.create({
          data: {
            storeId: data.storeId,
            orderId: created.id,
            direction: "INCOME",
            category: "SALE",
            description: `Pedido ${displayCode}`,
            amount: data.total,
          },
        });
        return created;
      });
      order = result;
    } else {
      order = await db.order.create({ data: orderData });
    }

    let pixQrCode: string | null = null;
    let pixCopyPaste: string | null = null;
    let paymentLink: string | null = null;

    if (data.paymentMethod === "PIX") {
      try {
        const pix = await createPixPayment({
          amount: data.total,
          description: `Pedido ${displayCode} — ${store.namePt}`,
          payerEmail: "cliente@caféat.com",
          externalReference: order.id,
        });
        pixQrCode = pix.qrCode;
        pixCopyPaste = pix.pixCopyPaste;

        await db.order.update({
          where: { id: order.id },
          data: { mpPaymentId: pix.id },
        });
      } catch {
        // MP not configured — proceed without PIX
      }
    }

    if (data.paymentMethod === "PAY_LINK") {
      try {
        paymentLink = await createPaymentLink({
          title: `Pedido ${displayCode} — ${store.namePt}`,
          amount: data.total,
          externalReference: order.id,
        });
      } catch {
        // MP not configured
      }
    }

    return NextResponse.json({
      orderId: order.id,
      displayCode,
      pixQrCode,
      pixCopyPaste,
      paymentLink,
    });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
