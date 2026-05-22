import { db } from "@/lib/db";
import { requireStoreAccess } from "@/lib/auth";
import { FinanceManager } from "@/components/admin/finance-manager";

type Props = {
  params: Promise<{ locale: string; storeId: string }>;
};

export default async function FinanceiroPage({ params }: Props) {
  const { storeId } = await params;
  await requireStoreAccess(storeId);

  const now = new Date();
  const from = new Date(now.getFullYear(), now.getMonth(), 1);
  const to = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);

  const [entries, totals] = await Promise.all([
    db.financeEntry.findMany({
      where: { storeId, happenedAt: { gte: from, lte: to } },
      orderBy: { happenedAt: "desc" },
      take: 200,
      include: { order: { select: { displayCode: true } } },
    }),
    db.financeEntry.groupBy({
      by: ["direction"],
      where: { storeId, happenedAt: { gte: from, lte: to } },
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

  return (
    <FinanceManager
      storeId={storeId}
      initialEntries={serialized}
      initialIncome={income}
      initialExpense={expense}
      initialMonth={now.getMonth()}
      initialYear={now.getFullYear()}
    />
  );
}
