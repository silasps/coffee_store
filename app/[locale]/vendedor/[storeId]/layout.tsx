import { requireStoreAccess } from "@/lib/auth";
import { db } from "@/lib/db";
import { notFound } from "next/navigation";
import { SellerTabBar } from "@/components/seller/seller-tab-bar";

type Props = {
  children: React.ReactNode;
  params: Promise<{ locale: string; storeId: string }>;
};

export default async function SellerLayout({ children, params }: Props) {
  const { locale, storeId } = await params;

  await requireStoreAccess(storeId, locale);

  const store = await db.store.findUnique({
    where: { id: storeId },
    select: { namePt: true },
  });

  if (!store) notFound();

  return (
    <div className="min-h-screen pb-20" style={{ background: "var(--cream)" }}>
      <header
        className="sticky top-0 z-40 flex items-center justify-between px-4 py-3 border-b"
        style={{ background: "var(--brown-dark)", borderColor: "rgba(255,255,255,0.1)" }}
      >
        <span className="text-sm font-bold text-white">{store.namePt}</span>
        <span
          className="text-xs font-semibold px-2 py-0.5 rounded-full"
          style={{ background: "var(--orange)", color: "white" }}
        >
          Vendedor
        </span>
      </header>

      <main>{children}</main>

      <SellerTabBar storeId={storeId} locale={locale} />
    </div>
  );
}
