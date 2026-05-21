import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { z } from "zod";

const schema = z.object({
  status: z.enum(["AWAITING_PAYMENT", "IN_QUEUE", "PREPARING", "READY", "COMPLETED", "CANCELLED"]),
});

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await req.json();
  const { status } = schema.parse(body);

  const extra: Record<string, Date> = {};
  if (status === "READY") extra.readyAt = new Date();
  if (status === "COMPLETED") extra.completedAt = new Date();

  const order = await db.order.update({
    where: { id },
    data: { status, ...extra },
  });

  return NextResponse.json({ status: order.status });
}
