import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireSuperAdmin } from "@/lib/auth";

export async function PATCH(
  _req: NextRequest,
  { params }: { params: Promise<{ alertId: string }> }
) {
  await requireSuperAdmin();
  const { alertId } = await params;
  await db.systemAlert.update({ where: { id: alertId }, data: { isRead: true } });
  return NextResponse.json({ ok: true });
}
