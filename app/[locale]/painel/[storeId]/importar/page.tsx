import { db } from "@/lib/db";
import { requireStoreAccess } from "@/lib/auth";
import { ImportManager } from "@/components/admin/import-manager";

type Props = {
  params: Promise<{ locale: string; storeId: string }>;
};

export default async function ImportPage({ params }: Props) {
  const { locale, storeId } = await params;
  const { user } = await requireStoreAccess(storeId);

  const [categories, rawProducts, subscription, store] = await Promise.all([
    db.category.findMany({
      where: { storeId, isActive: true },
      orderBy: { sortOrder: "asc" },
      select: { id: true, namePt: true },
    }),
    db.product.findMany({
      where: { storeId },
      orderBy: [{ categoryId: "asc" }, { sortOrder: "asc" }],
      select: {
        id: true, namePt: true, descriptionPt: true, highlightPt: true,
        basePrice: true, isAvailable: true, categoryId: true, tags: true,
        imageUrl: true,
      },
    }),
    db.subscription.findUnique({
      where: { userId: user.id },
      select: { status: true },
    }),
    db.store.findUnique({
      where: { id: storeId },
      select: {
        namePt: true, sloganPt: true, logoUrl: true,
        primaryColor: true, accentColor: true,
        brandHeroImageUrl: true, brandAboutImageUrl: true,
        brandAboutTitlePt: true, brandAboutTextPt: true,
        causeTitlePt: true, causeTextPt: true, brandCauseVisible: true,
        brandJoinTitlePt: true, brandJoinTextPt: true,
        brandJoinCtaLabel: true, brandJoinCtaUrl: true, brandJoinVisible: true,
      },
    }),
  ]);

  const isPaidPlan = user.role === "SUPER_ADMIN" || subscription?.status === "ACTIVE";

  const products = rawProducts.map((p) => ({
    id: p.id,
    namePt: p.namePt,
    descriptionPt: p.descriptionPt,
    highlightPt: p.highlightPt,
    basePrice: p.basePrice != null ? Number(p.basePrice) : null,
    isAvailable: p.isAvailable,
    categoryId: p.categoryId,
    tags: p.tags as string[],
    imageUrl: p.imageUrl,
  }));

  return (
    <ImportManager
      storeId={storeId}
      locale={locale}
      categories={categories}
      products={products}
      isPaidPlan={isPaidPlan}
      store={store ?? { namePt: "", sloganPt: null, logoUrl: null, primaryColor: null, accentColor: null, brandHeroImageUrl: null, brandAboutImageUrl: null, brandAboutTitlePt: null, brandAboutTextPt: null, causeTitlePt: null, causeTextPt: null, brandCauseVisible: false, brandJoinTitlePt: null, brandJoinTextPt: null, brandJoinCtaLabel: null, brandJoinCtaUrl: null, brandJoinVisible: false }}
    />
  );
}
