import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireAuth } from "@/lib/auth";

type Params = { params: Promise<{ token: string }> };

export async function POST(req: NextRequest, { params }: Params) {
  const { token } = await params;
  const user = await requireAuth();

  const body = await req.json().catch(() => ({}));
  const profileName: string | undefined = body.name?.trim() || undefined;
  const profilePhone: string | undefined = body.phone?.trim() || undefined;

  const invite = await db.storeInvite.findUnique({
    where: { token },
    include: {
      store: {
        select: {
          owner: {
            select: {
              subscription: { select: { plan: { select: { maxAdmins: true, maxSellers: true } } } },
            },
          },
        },
      },
    },
  });

  if (!invite) {
    return NextResponse.json({ error: "Convite inválido" }, { status: 404 });
  }

  if (invite.usedAt) {
    return NextResponse.json({ error: "Este convite já foi utilizado" }, { status: 410 });
  }

  if (invite.expiresAt < new Date()) {
    return NextResponse.json({ error: "Este convite expirou" }, { status: 410 });
  }

  const isOwner = invite.storeId && await db.store.findFirst({
    where: { id: invite.storeId, ownerId: user.id },
    select: { id: true },
  });
  if (isOwner) {
    return NextResponse.json(
      { error: "Você é o responsável por esta loja e não precisa de convite." },
      { status: 400 }
    );
  }

  const plan = invite.store.owner.subscription?.plan ?? { maxAdmins: 1, maxSellers: 2 };
  const limit = invite.role === "ADMIN" ? plan.maxAdmins : plan.maxSellers;

  if (limit !== -1) {
    const current = await db.storeTeamMember.count({ where: { storeId: invite.storeId, role: invite.role } });
    if (current >= limit) {
      return NextResponse.json(
        { error: "Limite de membros atingido para este plano." },
        { status: 403 }
      );
    }
  }

  await db.$transaction([
    db.storeTeamMember.upsert({
      where: { storeId_userId: { storeId: invite.storeId, userId: user.id } },
      update: { role: invite.role },
      create: { storeId: invite.storeId, userId: user.id, role: invite.role },
    }),
    db.storeInvite.update({
      where: { id: invite.id },
      data: { usedAt: new Date(), usedById: user.id },
    }),
    ...(profileName || profilePhone
      ? [db.user.update({
          where: { id: user.id },
          data: {
            ...(profileName ? { name: profileName } : {}),
            ...(profilePhone ? { phone: profilePhone } : {}),
          },
        })]
      : []),
  ]);

  return NextResponse.json({ storeId: invite.storeId });
}
