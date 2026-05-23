import { db } from "@/lib/db";
import { requireStoreAccess } from "@/lib/auth";
import { CategoriesManager } from "@/components/admin/categories-manager";

type Props = {
  params: Promise<{ locale: string; storeId: string }>;
};

export default async function CategoriesPage({ params }: Props) {
  const { locale, storeId } = await params;
  await requireStoreAccess(storeId);

  const [store, categories] = await Promise.all([
    db.store.findUnique({ where: { id: storeId }, select: { defaultLocale: true } }),
    db.category.findMany({
      where: { storeId },
      orderBy: { sortOrder: "asc" },
      include: { _count: { select: { products: true } } },
    }),
  ]);

  return (
    <CategoriesManager
      storeId={storeId}
      defaultLocale={store?.defaultLocale ?? "pt"}
      categories={categories.map((c) => ({
        id: c.id,
        namePt: c.namePt,
        nameEn: c.nameEn,
        nameEs: c.nameEs,
        area: c.area,
        iconEmoji: c.iconEmoji,
        accentColor: c.accentColor,
        sortOrder: c.sortOrder,
        isActive: c.isActive,
        productCount: c._count.products,
        createdAt: c.createdAt.toISOString(),
      }))}
    />
  );
}
