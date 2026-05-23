import { requireStoreAccess } from "@/lib/auth";
import { db } from "@/lib/db";
import { AdminShell } from "@/components/admin/admin-shell";
import { notFound } from "next/navigation";

type Props = {
  children: React.ReactNode;
  params: Promise<{ locale: string; storeId: string }>;
};

export default async function StoreAdminLayout({ children, params }: Props) {
  const { locale, storeId } = await params;

  const { user } = await requireStoreAccess(storeId, locale);

  const store = await db.store.findUnique({
    where: { id: storeId },
    select: { id: true, namePt: true, slug: true, defaultLocale: true },
  });

  if (!store) notFound();

  return (
    <AdminShell
      storeId={storeId}
      storeSlug={store.slug}
      storeLocale={store.defaultLocale}
      storeName={store.namePt}
      locale={locale}
      userName={user.name ?? user.email}
    >
      {children}
    </AdminShell>
  );
}
