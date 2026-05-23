import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { ProductDetailClient } from "@/components/menu/product-detail-client";
import type { Metadata } from "next";

type Props = {
  params: Promise<{ locale: string; storeSlug: string; slug: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { storeSlug, slug, locale } = await params;
  const product = await db.product.findFirst({
    where: { slug, store: { slug: storeSlug } },
    select: { namePt: true, nameEn: true, nameEs: true, descriptionPt: true, imageUrl: true },
  });
  if (!product) return { title: "Produto não encontrado" };

  const name = locale === "en" ? product.nameEn ?? product.namePt : product.namePt;
  const description = locale === "en" ? undefined : product.descriptionPt ?? undefined;

  return {
    title: name,
    description,
    ...(product.imageUrl && { openGraph: { images: [product.imageUrl] } }),
  };
}

export default async function ProductDetailPage({ params }: Props) {
  const { locale, storeSlug, slug } = await params;

  const [product, store] = await Promise.all([
    db.product.findFirst({
      where: { slug, store: { slug: storeSlug }, isAvailable: true },
      select: {
        id: true,
        slug: true,
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
    db.store.findUnique({
      where: { slug: storeSlug, isActive: true },
      select: { slug: true, logoUrl: true, namePt: true },
    }),
  ]);

  if (!product || !store) notFound();

  return (
    <ProductDetailClient
      product={{
        ...product,
        basePrice: product.basePrice ? Number(product.basePrice) : null,
        tags: product.tags as string[],
        comboItems: product.comboItems ?? null,
      }}
      locale={locale}
      storeSlug={storeSlug}
    />
  );
}
