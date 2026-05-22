import { NextRequest, NextResponse } from "next/server";
import { requireSuperAdmin } from "@/lib/auth";
import { db } from "@/lib/db";
import { UserRole } from "@prisma/client";

const VALID_ROLES: UserRole[] = ["SUPER_ADMIN", "STORE_OWNER", "STORE_ADMIN", "SELLER"];

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    await requireSuperAdmin();
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { userId } = await params;
  const body = await req.json();
  const { role } = body as { role: string };

  if (!VALID_ROLES.includes(role as UserRole)) {
    return NextResponse.json({ error: "Invalid role" }, { status: 400 });
  }

  const user = await db.user.update({
    where: { id: userId },
    data: { role: role as UserRole },
  });

  return NextResponse.json({ id: user.id, role: user.role });
}
