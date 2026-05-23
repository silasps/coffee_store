import { requireStoreAccess } from "@/lib/auth";
import { db } from "@/lib/db";
import { redirect } from "next/navigation";
import { TeamClient } from "@/components/admin/team-client";

type Props = {
  params: Promise<{ locale: string; storeId: string }>;
};

export default async function EquipePage({ params }: Props) {
  const { locale, storeId } = await params;
  const { user, role } = await requireStoreAccess(storeId, locale);

  if (role !== "STORE_OWNER" && role !== "SUPER_ADMIN") {
    redirect(`/${locale}/painel/${storeId}`);
  }

  const [members, pendingInvites, store] = await Promise.all([
    db.storeTeamMember.findMany({
      where: { storeId },
      include: { user: { select: { id: true, name: true, email: true, phone: true } } },
      orderBy: { createdAt: "asc" },
    }),
    db.storeInvite.findMany({
      where: { storeId, usedAt: null, expiresAt: { gt: new Date() } },
      orderBy: { createdAt: "desc" },
    }),
    db.store.findUnique({
      where: { id: storeId },
      select: {
        namePt: true,
        owner: {
          select: {
            subscription: {
              select: { plan: { select: { name: true, maxAdmins: true, maxSellers: true } } },
            },
          },
        },
      },
    }),
  ]);

  const plan = store?.owner.subscription?.plan ?? { name: "Starter", maxAdmins: 1, maxSellers: 2 };

  return (
    <TeamClient
      storeId={storeId}
      locale={locale}
      members={members.map((m) => ({
        id: m.id,
        userId: m.userId,
        name: m.user.name ?? m.user.email,
        email: m.user.email,
        phone: m.user.phone ?? "",
        role: m.role,
        createdAt: m.createdAt.toISOString(),
      }))}
      pendingInvites={pendingInvites.map((i) => ({
        id: i.id,
        token: i.token,
        role: i.role,
        expiresAt: i.expiresAt.toISOString(),
      }))}
      plan={plan}
      currentUserId={user.id}
    />
  );
}
