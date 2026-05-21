import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ storeId: string }> }
) {
  const { storeId } = await params;

  const orders = await db.order.findMany({
    where: { storeId },
    orderBy: { createdAt: "desc" },
    take: 50,
    include: {
      items: { select: { id: true, productNamePt: true, quantity: true, notes: true } },
    },
  });

  return NextResponse.json(
    orders.map((o) => ({
      ...o,
      subtotal: Number(o.subtotal),
      total: Number(o.total),
      createdAt: o.createdAt.toISOString(),
      updatedAt: o.updatedAt.toISOString(),
      paidAt: o.paidAt?.toISOString() ?? null,
      readyAt: o.readyAt?.toISOString() ?? null,
      completedAt: o.completedAt?.toISOString() ?? null,
    }))
  );
}
