import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireStoreAccess } from "@/lib/auth";

type Params = { params: Promise<{ storeId: string; inviteId: string }> };

export async function DELETE(_req: NextRequest, { params }: Params) {
  const { storeId, inviteId } = await params;
  const { role: accessRole } = await requireStoreAccess(storeId);

  if (accessRole !== "STORE_OWNER" && accessRole !== "SUPER_ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const invite = await db.storeInvite.findUnique({ where: { id: inviteId } });

  if (!invite || invite.storeId !== storeId) {
    return NextResponse.json({ error: "Convite não encontrado" }, { status: 404 });
  }

  await db.storeInvite.delete({ where: { id: inviteId } });
  return NextResponse.json({ ok: true });
}
