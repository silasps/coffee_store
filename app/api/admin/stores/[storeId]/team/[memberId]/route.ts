import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireStoreAccess } from "@/lib/auth";
import { StoreTeamRole } from "@prisma/client";

type Params = { params: Promise<{ storeId: string; memberId: string }> };

async function getOwnerPlan(storeId: string) {
  const store = await db.store.findUnique({
    where: { id: storeId },
    select: {
      owner: {
        select: {
          subscription: { select: { plan: { select: { maxAdmins: true, maxSellers: true } } } },
        },
      },
    },
  });
  return store?.owner.subscription?.plan ?? { maxAdmins: 1, maxSellers: 2 };
}

export async function PATCH(req: NextRequest, { params }: Params) {
  const { storeId, memberId } = await params;
  const { user, role: accessRole } = await requireStoreAccess(storeId);

  if (accessRole !== "STORE_OWNER" && accessRole !== "SUPER_ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const member = await db.storeTeamMember.findUnique({
    where: { id: memberId },
    include: { user: true },
  });

  if (!member || member.storeId !== storeId) {
    return NextResponse.json({ error: "Membro não encontrado" }, { status: 404 });
  }

  if (member.userId === user.id) {
    return NextResponse.json({ error: "Não é possível editar o próprio perfil aqui" }, { status: 400 });
  }

  const body = await req.json();
  const newRole: StoreTeamRole | undefined = body.role;
  const newName: string | undefined = body.name?.trim() || undefined;
  const newPhone: string | undefined = body.phone !== undefined ? (body.phone?.trim() || null) : undefined;

  if (newRole && newRole !== member.role) {
    const plan = await getOwnerPlan(storeId);
    const limit = newRole === "ADMIN" ? plan.maxAdmins : plan.maxSellers;
    if (limit !== -1) {
      const current = await db.storeTeamMember.count({ where: { storeId, role: newRole } });
      if (current >= limit) {
        return NextResponse.json(
          { error: `Limite de ${newRole === "ADMIN" ? "administradores" : "vendedores"} atingido.` },
          { status: 403 }
        );
      }
    }
  }

  await db.$transaction([
    ...(newRole ? [db.storeTeamMember.update({ where: { id: memberId }, data: { role: newRole } })] : []),
    ...(newName !== undefined || newPhone !== undefined
      ? [db.user.update({
          where: { id: member.userId },
          data: {
            ...(newName !== undefined ? { name: newName } : {}),
            ...(newPhone !== undefined ? { phone: newPhone } : {}),
          },
        })]
      : []),
  ]);

  return NextResponse.json({ ok: true });
}

export async function DELETE(_req: NextRequest, { params }: Params) {
  const { storeId, memberId } = await params;
  const { user, role: accessRole } = await requireStoreAccess(storeId);

  if (accessRole !== "STORE_OWNER" && accessRole !== "SUPER_ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const member = await db.storeTeamMember.findUnique({ where: { id: memberId } });

  if (!member || member.storeId !== storeId) {
    return NextResponse.json({ error: "Membro não encontrado" }, { status: 404 });
  }

  if (member.userId === user.id) {
    return NextResponse.json({ error: "Não é possível remover o próprio usuário" }, { status: 400 });
  }

  await db.storeTeamMember.delete({ where: { id: memberId } });
  return NextResponse.json({ ok: true });
}
