import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireStoreAccess } from "@/lib/auth";
import { StoreTeamRole } from "@prisma/client";

type Params = { params: Promise<{ storeId: string }> };

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

export async function POST(req: NextRequest, { params }: Params) {
  const { storeId } = await params;
  const { role: accessRole } = await requireStoreAccess(storeId);

  if (accessRole !== "STORE_OWNER" && accessRole !== "SUPER_ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await req.json();
  const role: StoreTeamRole = body.role;

  if (role !== "ADMIN" && role !== "SELLER") {
    return NextResponse.json({ error: "Role inválido" }, { status: 400 });
  }

  const plan = await getOwnerPlan(storeId);
  const limit = role === "ADMIN" ? plan.maxAdmins : plan.maxSellers;

  if (limit !== -1) {
    const current = await db.storeTeamMember.count({ where: { storeId, role } });
    if (current >= limit) {
      return NextResponse.json(
        { error: `Limite de ${role === "ADMIN" ? "administradores" : "vendedores"} atingido. Faça upgrade do plano.` },
        { status: 403 }
      );
    }
  }

  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
  const invite = await db.storeInvite.create({
    data: { storeId, role, expiresAt },
  });

  const origin = req.headers.get("origin") ?? "";
  const locale = req.headers.get("x-locale") ?? "pt";

  return NextResponse.json({
    id: invite.id,
    token: invite.token,
    url: `${origin}/${locale}/convite/${invite.token}`,
    expiresAt: invite.expiresAt,
  });
}

export async function GET(req: NextRequest, { params }: Params) {
  const { storeId } = await params;
  const { role: accessRole } = await requireStoreAccess(storeId);

  if (accessRole !== "STORE_OWNER" && accessRole !== "SUPER_ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const invites = await db.storeInvite.findMany({
    where: { storeId, usedAt: null, expiresAt: { gt: new Date() } },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(invites);
}
