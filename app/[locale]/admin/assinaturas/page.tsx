import { requireSuperAdmin } from "@/lib/auth";
import { db } from "@/lib/db";
import { SubscriptionsClient } from "@/components/admin/subscriptions-client";

type Props = { params: Promise<{ locale: string }> };

export default async function AdminAssinaturasPage({ params }: Props) {
  const { locale } = await params;
  await requireSuperAdmin(locale);

  const [subscriptions, plans] = await Promise.all([
    db.subscription.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        user: { select: { id: true, name: true, email: true, phone: true } },
        plan: { select: { name: true, priceMonthly: true } },
      },
    }),
    db.plan.findMany({ where: { isActive: true }, orderBy: { sortOrder: "asc" } }),
  ]);

  // MRR: sum of active subscriptions × plan price
  const mrr = subscriptions
    .filter((s) => s.status === "ACTIVE")
    .reduce((acc, s) => acc + Number(s.plan.priceMonthly), 0);

  const counts = {
    active:    subscriptions.filter((s) => s.status === "ACTIVE").length,
    trialing:  subscriptions.filter((s) => s.status === "TRIALING").length,
    pastDue:   subscriptions.filter((s) => s.status === "PAST_DUE").length,
    cancelled: subscriptions.filter((s) => s.status === "CANCELLED").length,
    paused:    subscriptions.filter((s) => s.status === "PAUSED").length,
  };

  return (
    <SubscriptionsClient
      locale={locale}
      mrr={mrr}
      counts={counts}
      plans={plans.map((p) => ({ id: p.id, name: p.name, priceMonthly: Number(p.priceMonthly) }))}
      subscriptions={subscriptions.map((s) => ({
        id: s.id,
        status: s.status,
        planName: s.plan.name,
        planPrice: Number(s.plan.priceMonthly),
        trialUntil: s.trialUntil?.toISOString() ?? null,
        currentPeriodEnd: s.currentPeriodEnd?.toISOString() ?? null,
        cancelledAt: s.cancelledAt?.toISOString() ?? null,
        userName: s.user.name,
        userEmail: s.user.email,
        userPhone: s.user.phone,
        userId: s.user.id,
        createdAt: s.createdAt.toISOString(),
      }))}
    />
  );
}
