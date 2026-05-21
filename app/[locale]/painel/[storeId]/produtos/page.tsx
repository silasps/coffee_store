import { db } from "@/lib/db";
import { requireStoreAccess } from "@/lib/auth";
import { ProductsManager } from "@/components/admin/products-manager";

type Props = {
  params: Promise<{ locale: string; storeId: string }>;
};

export default async function ProductsPage({ params }: Props) {
  const { storeId } = await params;
  await requireStoreAccess(storeId);

  const [products, categories] = await Promise.all([
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
  ]);

  return (
    <ProductsManager
      products={products.map((p) => ({
        ...p,
        basePrice: p.basePrice ? Number(p.basePrice) : null,
        tags: p.tags as string[],
        categoryName: p.category.namePt,
        createdAt: p.createdAt.toISOString(),
        updatedAt: p.updatedAt.toISOString(),
      }))}
      categories={categories}
      storeId={storeId}
    />
  );
}
