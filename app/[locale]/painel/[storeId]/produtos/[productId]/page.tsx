import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { requireStoreAccess } from "@/lib/auth";
import { ProductForm } from "@/components/admin/product-form";

type Props = {
  params: Promise<{ locale: string; storeId: string; productId: string }>;
};

export default async function EditProductPage({ params }: Props) {
  const { locale, storeId, productId } = await params;
  await requireStoreAccess(storeId);

  const [product, categories, store] = await Promise.all([
    db.product.findUnique({ where: { id: productId } }),
    db.category.findMany({
      where: { storeId, isActive: true },
      orderBy: { sortOrder: "asc" },
      select: { id: true, namePt: true },
    }),
    db.store.findUnique({ where: { id: storeId }, select: { defaultLocale: true } }),
  ]);

  if (!product || product.storeId !== storeId) notFound();

  return (
    <ProductForm
      storeId={storeId}
      locale={locale}
      defaultLocale={store?.defaultLocale ?? "pt"}
      categories={categories}
      product={{
        ...product,
        basePrice: product.basePrice ? Number(product.basePrice) : null,
        nameEn: product.nameEn ?? null,
        nameEs: product.nameEs ?? null,
        descriptionPt: product.descriptionPt ?? null,
        descriptionEn: product.descriptionEn ?? null,
        descriptionEs: product.descriptionEs ?? null,
        highlightPt: product.highlightPt ?? null,
        highlightEn: product.highlightEn ?? null,
        highlightEs: product.highlightEs ?? null,
        imageUrl: product.imageUrl ?? null,
        tags: product.tags as string[],
      }}
    />
  );
}
