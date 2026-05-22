import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { createClient } from "@/lib/supabase/server";

type Params = { params: Promise<{ storeId: string }> };

function slugify(text: string) {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

export async function PATCH(req: NextRequest, { params }: Params) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { storeId } = await params;

  const dbUser = await db.user.findUnique({ where: { authId: user.id } });
  if (!dbUser) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const store = await db.store.findUnique({ where: { id: storeId } });
  if (!store) return NextResponse.json({ error: "Loja não encontrada" }, { status: 404 });

  const isOwner = store.ownerId === dbUser.id;
  const isSuperAdmin = dbUser.role === "SUPER_ADMIN";
  if (!isOwner && !isSuperAdmin) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await req.json();

  const {
    namePt, nameEn, nameEs,
    sloganPt, sloganEn, sloganEs,
    slug: rawSlug,
    logoUrl,
    primaryColor, accentColor,
    defaultLocale,
    causeTitlePt, causeTitleEn, causeTitleEs,
    causeTextPt, causeTextEn, causeTextEs,
    causeDonationPix, causePaypalUrl,
    brandHeroImageUrl,
    brandAboutImageUrl,
    brandAboutTextPt, brandAboutTextEn, brandAboutTextEs,
    brandJoinTitlePt, brandJoinTitleEn, brandJoinTitleEs,
    brandJoinTextPt, brandJoinTextEn, brandJoinTextEs,
    brandJoinCtaLabel, brandJoinCtaUrl,
    brandAboutTitlePt, brandAboutTitleEn, brandAboutTitleEs,
    brandAboutVisible, brandCauseVisible, brandJoinVisible,
  } = body;

  if (!namePt?.trim()) {
    return NextResponse.json({ error: "Nome da loja é obrigatório" }, { status: 400 });
  }

  let slug = store.slug;
  if (rawSlug && rawSlug !== store.slug) {
    const candidate = slugify(rawSlug);
    const conflict = await db.store.findFirst({
      where: { slug: candidate, id: { not: storeId } },
    });
    if (conflict) {
      return NextResponse.json({ error: "Este slug já está em uso por outra loja" }, { status: 409 });
    }
    slug = candidate;
  }

  const updated = await db.store.update({
    where: { id: storeId },
    data: {
      namePt: namePt.trim(),
      nameEn: nameEn?.trim() || null,
      nameEs: nameEs?.trim() || null,
      sloganPt: sloganPt?.trim() || null,
      sloganEn: sloganEn?.trim() || null,
      sloganEs: sloganEs?.trim() || null,
      slug,
      logoUrl: logoUrl || null,
      primaryColor: primaryColor || null,
      accentColor: accentColor || null,
      defaultLocale: defaultLocale || "pt",
      causeTitlePt: causeTitlePt?.trim() || null,
      causeTitleEn: causeTitleEn?.trim() || null,
      causeTitleEs: causeTitleEs?.trim() || null,
      causeTextPt: causeTextPt?.trim() || null,
      causeTextEn: causeTextEn?.trim() || null,
      causeTextEs: causeTextEs?.trim() || null,
      causeDonationPix: causeDonationPix?.trim() || null,
      causePaypalUrl: causePaypalUrl?.trim() || null,
      brandHeroImageUrl: brandHeroImageUrl || null,
      brandAboutImageUrl: brandAboutImageUrl || null,
      brandAboutTextPt: brandAboutTextPt?.trim() || null,
      brandAboutTextEn: brandAboutTextEn?.trim() || null,
      brandAboutTextEs: brandAboutTextEs?.trim() || null,
      brandJoinTitlePt: brandJoinTitlePt?.trim() || null,
      brandJoinTitleEn: brandJoinTitleEn?.trim() || null,
      brandJoinTitleEs: brandJoinTitleEs?.trim() || null,
      brandJoinTextPt: brandJoinTextPt?.trim() || null,
      brandJoinTextEn: brandJoinTextEn?.trim() || null,
      brandJoinTextEs: brandJoinTextEs?.trim() || null,
      brandJoinCtaLabel: brandJoinCtaLabel?.trim() || null,
      brandJoinCtaUrl: brandJoinCtaUrl?.trim() || null,
      brandAboutTitlePt: brandAboutTitlePt?.trim() || null,
      brandAboutTitleEn: brandAboutTitleEn?.trim() || null,
      brandAboutTitleEs: brandAboutTitleEs?.trim() || null,
      brandAboutVisible: brandAboutVisible ?? true,
      brandCauseVisible: brandCauseVisible ?? true,
      brandJoinVisible: brandJoinVisible ?? true,
    },
    select: { id: true, slug: true, namePt: true },
  });

  return NextResponse.json(updated);
}
