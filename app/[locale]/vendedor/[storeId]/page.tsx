import { requireStoreAccess } from "@/lib/auth";
import { db } from "@/lib/db";
import { notFound } from "next/navigation";
import { MenuBrowser } from "@/components/menu/menu-browser";

type Props = {
  params: Promise<{ locale: string; storeId: string }>;
};

export default async function SellerPage({ params }: Props) {
  const { locale, storeId } = await params;

  await requireStoreAccess(storeId, locale);

  const store = await db.store.findUnique({
    where: { id: storeId },
  });

  if (!store) notFound();

  const categories = await db.category.findMany({
    where: { storeId: store.id, isActive: true },
    orderBy: { sortOrder: "asc" },
    select: {
      id: true,
      slug: true,
      namePt: true,
      nameEn: true,
      nameEs: true,
      iconEmoji: true,
      accentColor: true,
      _count: { select: { products: { where: { isAvailable: true } } } },
    },
  });

  const products = await db.product.findMany({
    where: { storeId: store.id },
    orderBy: [{ sortOrder: "asc" }],
    select: {
      id: true,
      slug: true,
      categoryId: true,
      namePt: true,
      nameEn: true,
      nameEs: true,
      descriptionPt: true,
      descriptionEn: true,
      descriptionEs: true,
      highlightPt: true,
      highlightEn: true,
      highlightEs: true,
      imageUrl: true,
      basePrice: true,
      stockQuantity: true,
      prepMinutes: true,
      isAvailable: true,
      tags: true,
      comboItems: true,
    },
  });

  const categoryNavData = categories.map((c) => ({
    id: c.id,
    slug: c.slug,
    namePt: c.namePt,
    nameEn: c.nameEn,
    nameEs: c.nameEs,
    iconEmoji: c.iconEmoji,
    accentColor: c.accentColor,
    productCount: c._count.products,
  }));

  const productData = products.map((p) => ({
    ...p,
    basePrice: p.basePrice ? Number(p.basePrice) : null,
    stockQuantity: p.stockQuantity,
    tags: p.tags as string[],
    comboItems: p.comboItems ?? null,
  }));

  return (
    <MenuBrowser
      popularProductIds={[]}
      store={{
        slug: store.slug,
        namePt: store.namePt,
        nameEn: store.nameEn,
        nameEs: store.nameEs,
        sloganPt: store.sloganPt,
        sloganEn: store.sloganEn,
        sloganEs: store.sloganEs,
        logoUrl: store.logoUrl,
        causeTitlePt: store.causeTitlePt,
        causeTitleEn: store.causeTitleEn,
        causeTextPt: store.causeTextPt,
        causeTextEn: store.causeTextEn,
        causeDonationPix: store.causeDonationPix,
        causePaypalUrl: store.causePaypalUrl,
      }}
      categories={categoryNavData}
      products={productData}
      locale={locale}
    />
  );
}
