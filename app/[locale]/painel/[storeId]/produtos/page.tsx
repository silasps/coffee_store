import { db } from "@/lib/db";
import { requireStoreAccess } from "@/lib/auth";
import { ProductsManager } from "@/components/admin/products-manager";

type Props = {
  params: Promise<{ locale: string; storeId: string }>;
};

export default async function ProductsPage({ params }: Props) {
  const { storeId } = await params;
  await requireStoreAccess(storeId);

  const [products, categories, store] = await Promise.all([
    db.product.findMany({
      where: { storeId },
      orderBy: [{ categoryId: "asc" }, { sortOrder: "asc" }],
      include: { category: { select: { namePt: true } } },
    }),
    db.category.findMany({
      where: { storeId, isActive: true },
      orderBy: { sortOrder: "asc" },
      select: { id: true, namePt: true },
    }),
    db.store.findUnique({ where: { id: storeId }, select: { defaultLocale: true } }),
  ]);

  return (
    <ProductsManager
      products={products.map((p) => ({
        id: p.id,
        namePt: p.namePt,
        nameEn: p.nameEn,
        nameEs: p.nameEs,
        categoryId: p.categoryId,
        categoryName: p.category.namePt,
        descriptionPt: p.descriptionPt,
        descriptionEn: p.descriptionEn,
        descriptionEs: p.descriptionEs,
        highlightPt: p.highlightPt,
        highlightEn: p.highlightEn,
        highlightEs: p.highlightEs,
        imageUrl: p.imageUrl,
        basePrice: p.basePrice ? Number(p.basePrice) : null,
        isAvailable: p.isAvailable,
        tags: p.tags as string[],
        sortOrder: p.sortOrder,
      }))}
      categories={categories}
      storeId={storeId}
      defaultLocale={store?.defaultLocale ?? "pt"}
    />
  );
}
