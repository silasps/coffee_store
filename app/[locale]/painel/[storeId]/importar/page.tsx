import { db } from "@/lib/db";
import { requireStoreAccess } from "@/lib/auth";
import { ImportManager } from "@/components/admin/import-manager";

type Props = {
  params: Promise<{ locale: string; storeId: string }>;
};

export default async function ImportPage({ params }: Props) {
  const { locale, storeId } = await params;
  const { user } = await requireStoreAccess(storeId);

  const [categories, rawProducts, subscription] = await Promise.all([
    db.category.findMany({
      where: { storeId, isActive: true },
      orderBy: { sortOrder: "asc" },
      select: { id: true, namePt: true },
    }),
    db.product.findMany({
      where: { storeId },
      orderBy: [{ categoryId: "asc" }, { sortOrder: "asc" }],
      select: {
        id: true, namePt: true, descriptionPt: true, highlightPt: true,
        basePrice: true, isAvailable: true, categoryId: true, tags: true,
      },
    }),
    db.subscription.findUnique({
      where: { userId: user.id },
      select: { status: true },
    }),
  ]);

  const isPaidPlan = user.role === "SUPER_ADMIN" || subscription?.status === "ACTIVE";

  const products = rawProducts.map((p) => ({
    id: p.id,
    namePt: p.namePt,
    descriptionPt: p.descriptionPt,
    highlightPt: p.highlightPt,
    basePrice: p.basePrice != null ? Number(p.basePrice) : null,
    isAvailable: p.isAvailable,
    categoryId: p.categoryId,
    tags: p.tags as string[],
  }));

  return (
    <ImportManager
      storeId={storeId}
      locale={locale}
      categories={categories}
      products={products}
      isPaidPlan={isPaidPlan}
    />
  );
}
