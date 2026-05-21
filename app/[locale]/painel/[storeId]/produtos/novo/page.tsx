import { db } from "@/lib/db";
import { requireStoreAccess } from "@/lib/auth";
import { ProductForm } from "@/components/admin/product-form";

type Props = {
  params: Promise<{ locale: string; storeId: string }>;
};

export default async function NewProductPage({ params }: Props) {
  const { locale, storeId } = await params;
  await requireStoreAccess(storeId);

  const [categories, store] = await Promise.all([
    db.category.findMany({
      where: { storeId, isActive: true },
      orderBy: { sortOrder: "asc" },
      select: { id: true, namePt: true },
    }),
    db.store.findUnique({ where: { id: storeId }, select: { defaultLocale: true } }),
  ]);

  return (
    <ProductForm
      storeId={storeId}
      locale={locale}
      defaultLocale={store?.defaultLocale ?? "pt"}
      categories={categories}
    />
  );
}
