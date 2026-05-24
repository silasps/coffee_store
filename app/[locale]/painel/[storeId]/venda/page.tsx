import { db } from "@/lib/db";
import { requireStoreAccess } from "@/lib/auth";
import { VendaClient } from "@/components/admin/venda-client";

type Props = {
  params: Promise<{ locale: string; storeId: string }>;
};

export default async function VendaPage({ params }: Props) {
  const { storeId } = await params;
  await requireStoreAccess(storeId);

  const store = await db.store.findUnique({
    where: { id: storeId },
    select: { id: true, namePt: true, slug: true },
  });

  if (!store) return null;

  const categories = await db.category.findMany({
    where: { storeId, isActive: true },
    orderBy: { sortOrder: "asc" },
    select: {
      id: true,
      namePt: true,
      iconEmoji: true,
    },
  });

  const products = await db.product.findMany({
    where: { storeId, isAvailable: true },
    orderBy: [{ sortOrder: "asc" }, { createdAt: "desc" }],
    select: {
      id: true,
      slug: true,
      categoryId: true,
      namePt: true,
      imageUrl: true,
      basePrice: true,
    },
  });

  return (
    <VendaClient
      storeId={storeId}
      storeSlug={store.slug}
      categories={categories}
      products={products.map((p) => ({
        ...p,
        basePrice: p.basePrice ? Number(p.basePrice) : null,
      }))}
    />
  );
}
