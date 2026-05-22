import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { createClient } from "@/lib/supabase/server";

function slugify(text: string) {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const { storeId, namePt, categoryId, nameEn, descriptionPt, descriptionEn, imageUrl, basePrice, isAvailable, sortOrder, tags, stockQuantity, comboItems } = body;

  if (!storeId || !namePt || !categoryId) {
    return NextResponse.json({ error: "storeId, namePt e categoryId são obrigatórios" }, { status: 400 });
  }

  const baseSlug = slugify(namePt);
  let slug = baseSlug;
  let suffix = 1;
  while (true) {
    const existing = await db.product.findUnique({ where: { storeId_slug: { storeId, slug } } });
    if (!existing) break;
    slug = `${baseSlug}-${suffix++}`;
  }

  const product = await db.product.create({
    data: {
      storeId,
      categoryId,
      slug,
      namePt,
      nameEn: nameEn || null,
      descriptionPt: descriptionPt || null,
      descriptionEn: descriptionEn || null,
      imageUrl: imageUrl || null,
      basePrice: basePrice != null && basePrice !== "" ? basePrice : null,
      isAvailable: isAvailable ?? true,
      sortOrder: sortOrder ?? 0,
      tags: tags ?? [],
      stockQuantity: stockQuantity != null ? parseInt(stockQuantity) : null,
      comboItems: comboItems ?? null,
    },
  });

  return NextResponse.json(product, { status: 201 });
}

export async function DELETE(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const storeId = searchParams.get("storeId");
  if (!storeId) return NextResponse.json({ error: "storeId é obrigatório" }, { status: 400 });

  const store = await db.store.findFirst({ where: { id: storeId } });
  if (!store) return NextResponse.json({ error: "Loja não encontrada" }, { status: 404 });

  await db.product.deleteMany({ where: { storeId } });
  return NextResponse.json({ ok: true });
}
