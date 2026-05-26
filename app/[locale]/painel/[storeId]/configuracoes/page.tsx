import { db } from "@/lib/db";
import { requireStoreAccess } from "@/lib/auth";
import { StoreSettingsClient } from "@/components/admin/store-settings-client";
import { notFound } from "next/navigation";

type Props = {
  params: Promise<{ locale: string; storeId: string }>;
};

export default async function ConfiguracoesPage({ params }: Props) {
  const { storeId } = await params;
  const { user } = await requireStoreAccess(storeId);

  const store = await db.store.findUnique({
    where: { id: storeId },
    select: {
      id: true, slug: true,
      namePt: true, nameEn: true, nameEs: true,
      sloganPt: true, sloganEn: true, sloganEs: true,
      logoUrl: true, primaryColor: true, accentColor: true, defaultLocale: true,
      causeTitlePt: true, causeTitleEn: true, causeTitleEs: true,
      causeTextPt: true, causeTextEn: true, causeTextEs: true,
      causeDonationPix: true, causePaypalUrl: true,
      brandHeroImageUrl: true, brandAboutImageUrl: true,
      brandAboutTextPt: true, brandAboutTextEn: true, brandAboutTextEs: true,
      brandJoinTitlePt: true, brandJoinTitleEn: true, brandJoinTitleEs: true,
      brandJoinTextPt: true, brandJoinTextEn: true, brandJoinTextEs: true,
      brandJoinCtaLabel: true, brandJoinCtaUrl: true,
      brandAboutTitlePt: true, brandAboutTitleEn: true, brandAboutTitleEs: true,
      brandAboutVisible: true, brandCauseVisible: true, brandJoinVisible: true,
      businessHours: true,
    },
  });

  if (!store) notFound();

  const subscription = await db.subscription.findUnique({
    where: { userId: user.id },
    select: { status: true },
  });
  const isPaidPlan = user.role === "SUPER_ADMIN" || subscription?.status === "ACTIVE";

  return <StoreSettingsClient store={store} isPaidPlan={isPaidPlan} />;
}
