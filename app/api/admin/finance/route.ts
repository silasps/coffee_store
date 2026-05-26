import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { createClient } from "@/lib/supabase/server";
import { FinanceDirection, FinanceCategory } from "@prisma/client";

async function getAuthUser() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;
  return db.user.findUnique({ where: { authId: user.id } });
}

async function canAccessStore(userId: string, storeId: string) {
  const store = await db.store.findUnique({ where: { id: storeId } });
  if (!store) return false;
  if (store.ownerId === userId) return true;
  const member = await db.storeTeamMember.findUnique({
    where: { storeId_userId: { storeId, userId } },
  });
  return !!member;
}

export async function GET(req: NextRequest) {
  const user = await getAuthUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const storeId = searchParams.get("storeId");
  const from = searchParams.get("from");
  const to = searchParams.get("to");

  if (!storeId) return NextResponse.json({ error: "storeId obrigatório" }, { status: 400 });

  const ok = user.role === "SUPER_ADMIN" || (await canAccessStore(user.id, storeId));
  if (!ok) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const category = searchParams.get("category");
  const isExport = searchParams.get("export") === "1";

  const where = {
    storeId,
    ...(from || to
      ? {
          happenedAt: {
            ...(from ? { gte: new Date(from) } : {}),
            ...(to ? { lte: new Date(to) } : {}),
          },
        }
      : {}),
    ...(category ? { category: category as FinanceCategory } : {}),
  };

  const [entries, totals] = await Promise.all([
    db.financeEntry.findMany({
      where,
      orderBy: { happenedAt: "desc" },
      ...(isExport ? {} : { take: 200 }),
      include: { order: { select: { displayCode: true, paymentMethod: true } } },
    }),
    db.financeEntry.groupBy({
      by: ["direction"],
      where,
      _sum: { amount: true },
    }),
  ]);

  const income = Number(totals.find((t) => t.direction === "INCOME")?._sum.amount ?? 0);
  const expense = Number(totals.find((t) => t.direction === "EXPENSE")?._sum.amount ?? 0);

  const serialized = entries.map((e) => ({
    ...e,
    amount: Number(e.amount),
    happenedAt: e.happenedAt.toISOString(),
    createdAt: e.createdAt.toISOString(),
    updatedAt: e.updatedAt.toISOString(),
  }));

  return NextResponse.json({ entries: serialized, income, expense, balance: income - expense });
}

export async function POST(req: NextRequest) {
  const user = await getAuthUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const { storeId, direction, category, description, amount, happenedAt, notes } = body;

  if (!storeId || !direction || !category || !description || amount == null) {
    return NextResponse.json({ error: "Campos obrigatórios faltando" }, { status: 400 });
  }

  const ok = user.role === "SUPER_ADMIN" || (await canAccessStore(user.id, storeId));
  if (!ok) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const entry = await db.financeEntry.create({
    data: {
      storeId,
      direction: direction as FinanceDirection,
      category: category as FinanceCategory,
      description,
      amount,
      happenedAt: happenedAt ? new Date(happenedAt) : new Date(),
      notes: notes || null,
    },
  });

  return NextResponse.json({ ...entry, amount: Number(entry.amount) }, { status: 201 });
}

export async function PATCH(req: NextRequest) {
  const user = await getAuthUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const { id, direction, category, description, amount, happenedAt, notes } = body;
  if (!id) return NextResponse.json({ error: "id obrigatório" }, { status: 400 });

  const entry = await db.financeEntry.findUnique({ where: { id } });
  if (!entry) return NextResponse.json({ error: "Não encontrado" }, { status: 404 });
  if (entry.orderId) return NextResponse.json({ error: "Não é possível editar lançamentos vinculados a pedidos" }, { status: 400 });

  const ok = user.role === "SUPER_ADMIN" || (await canAccessStore(user.id, entry.storeId));
  if (!ok) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const updated = await db.financeEntry.update({
    where: { id },
    data: {
      direction: direction as FinanceDirection,
      category: category as FinanceCategory,
      description,
      amount,
      happenedAt: happenedAt ? new Date(happenedAt) : entry.happenedAt,
      notes: notes || null,
    },
  });

  return NextResponse.json({ ...updated, amount: Number(updated.amount) });
}

export async function DELETE(req: NextRequest) {
  const user = await getAuthUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");
  if (!id) return NextResponse.json({ error: "id obrigatório" }, { status: 400 });

  const entry = await db.financeEntry.findUnique({ where: { id } });
  if (!entry) return NextResponse.json({ error: "Não encontrado" }, { status: 404 });

  const ok = user.role === "SUPER_ADMIN" || (await canAccessStore(user.id, entry.storeId));
  if (!ok) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  if (entry.orderId) {
    return NextResponse.json({ error: "Não é possível excluir lançamentos vinculados a pedidos" }, { status: 400 });
  }

  await db.financeEntry.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
