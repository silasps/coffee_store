import { notFound, redirect } from "next/navigation";
import { db } from "@/lib/db";
import { MenuBrowser } from "@/components/menu/menu-browser";
import type { Metadata } from "next";

type Props = {
  params: Promise<{ locale: string; storeSlug: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { storeSlug, locale } = await params;
  const store = await db.store.findUnique({ where: { slug: storeSlug } });
  if (!store) return { title: "Loja não encontrada" };

  const name = locale === "en" ? store.nameEn ?? store.namePt : store.namePt;
  const slogan = locale === "en" ? store.sloganEn ?? store.sloganPt : store.sloganPt;

  return {
    title: `${name} — Menu`,
    description: slogan ?? undefined,
    ...(store.logoUrl && {
      icons: { icon: store.logoUrl, apple: store.logoUrl },
    }),
  };
}

export default async function MenuPage({ params }: Props) {
  const { locale, storeSlug } = await params;

  const store = await db.store.findUnique({
    where: { slug: storeSlug, isActive: true },
  });

  if (!store) notFound();

  // Redirect to the store's configured default language when accessed via the
  // app-level fallback locale ("pt"). Keeps locale-switcher links working since
  // they produce explicit locale URLs that won't match this condition.
  if (locale === "pt" && store.defaultLocale !== "pt") {
    redirect(`/${store.defaultLocale}/${storeSlug}`);
  }

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

  const [products, topSoldRaw] = await Promise.all([
    db.product.findMany({
      where: { storeId: store.id, isAvailable: true },
      orderBy: [{ sortOrder: "asc" }, { createdAt: "desc" }],
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
    }),
    db.orderItem.groupBy({
      by: ["productId"],
      where: { order: { storeId: store.id }, productId: { not: null } },
      _sum: { quantity: true },
      orderBy: { _sum: { quantity: "desc" } },
      take: 10,
    }),
  ]);

  const popularProductIds = topSoldRaw.map((r) => r.productId as string);

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
      popularProductIds={popularProductIds}
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
