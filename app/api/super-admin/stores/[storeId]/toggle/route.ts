import { NextRequest, NextResponse } from "next/server";
import { requireSuperAdmin } from "@/lib/auth";
import { db } from "@/lib/db";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ storeId: string }> }
) {
  try {
    await requireSuperAdmin();
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { storeId } = await params;
  const body = await req.json();
  const { isActive } = body as { isActive: boolean };

  const store = await db.store.update({
    where: { id: storeId },
    data: { isActive },
  });

  return NextResponse.json({ id: store.id, isActive: store.isActive });
}
