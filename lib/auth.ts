import { createClient } from "./supabase/server";
import { db } from "./db";
import { redirect } from "next/navigation";
import { UserRole } from "@prisma/client";

type GetUserResult = { user: Awaited<ReturnType<typeof db.user.findUnique>>; offline: false } | { user: null; offline: boolean };

export async function getUser(): Promise<GetUserResult> {
  try {
    const supabase = await createClient();
    const { data: { user }, error } = await supabase.auth.getUser();
    if (error) {
      const isNetwork = error.message?.includes("fetch") || error.message?.includes("abort") || error.name === "AbortError";
      return { user: null, offline: isNetwork };
    }
    if (!user) return { user: null, offline: false };
    const dbUser = await db.user.findUnique({ where: { authId: user.id } });
    return { user: dbUser, offline: false };
  } catch {
    return { user: null, offline: true };
  }
}

export async function requireAuth(locale = "pt") {
  const { user, offline } = await getUser();
  if (!user) redirect(`/${locale}/acesso${offline ? "?offline=1" : ""}`);
  return user!;
}

export async function requireRole(role: UserRole, locale = "pt") {
  const user = await requireAuth(locale);
  if (user.role !== role) redirect(`/${locale}/painel`);
  return user;
}

export async function requireSuperAdmin(locale = "pt") {
  return requireRole("SUPER_ADMIN", locale);
}

export async function requireStoreAccess(storeId: string, locale = "pt") {
  const user = await requireAuth(locale);

  if (user.role === "SUPER_ADMIN") return { user, role: "SUPER_ADMIN" as const };

  const store = await db.store.findUnique({ where: { id: storeId } });
  if (!store) redirect(`/${locale}/painel`);

  if (store.ownerId === user.id) return { user, role: "STORE_OWNER" as const };

  const member = await db.storeTeamMember.findUnique({
    where: { storeId_userId: { storeId, userId: user.id } },
  });

  if (!member) redirect(`/${locale}/painel`);

  return { user, role: member.role };
}
