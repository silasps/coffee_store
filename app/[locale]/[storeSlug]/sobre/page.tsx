import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { BrandPageContent } from "@/components/menu/brand-page-content";
import type { Metadata } from "next";

type Props = {
  params: Promise<{ locale: string; storeSlug: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { storeSlug, locale } = await params;
  const store = await db.store.findUnique({ where: { slug: storeSlug } });
  if (!store) return { title: "Não encontrado" };
  const name = locale === "en" ? (store.nameEn ?? store.namePt) : locale === "es" ? (store.nameEs ?? store.namePt) : store.namePt;
  return { title: `Sobre — ${name}` };
}

export default async function SobrePage({ params }: Props) {
  const { locale, storeSlug } = await params;

  const store = await db.store.findUnique({
    where: { slug: storeSlug, isActive: true },
    select: {
      namePt: true, nameEn: true, nameEs: true,
      sloganPt: true, sloganEn: true, sloganEs: true,
      logoUrl: true, slug: true,
      brandHeroImageUrl: true, brandAboutImageUrl: true,
      brandAboutTextPt: true, brandAboutTextEn: true, brandAboutTextEs: true,
      brandJoinTitlePt: true, brandJoinTitleEn: true, brandJoinTitleEs: true,
      brandJoinTextPt: true, brandJoinTextEn: true, brandJoinTextEs: true,
      brandJoinCtaLabel: true, brandJoinCtaUrl: true,
      brandAboutTitlePt: true, brandAboutTitleEn: true, brandAboutTitleEs: true,
      brandAboutVisible: true, brandCauseVisible: true, brandJoinVisible: true,
      causeTitlePt: true, causeTitleEn: true, causeTitleEs: true,
      causeTextPt: true, causeTextEn: true, causeTextEs: true,
      causeDonationPix: true, causePaypalUrl: true,
    },
  });

  if (!store) notFound();

  return <BrandPageContent store={store} locale={locale} />;
}
