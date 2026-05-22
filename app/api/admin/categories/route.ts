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
  const { storeId, namePt, nameEn, nameEs, area, iconEmoji, accentColor, sortOrder } = body;

  if (!storeId || !namePt) {
    return NextResponse.json({ error: "storeId e namePt são obrigatórios" }, { status: 400 });
  }

  const baseSlug = slugify(namePt);
  let slug = baseSlug;
  let suffix = 1;
  while (true) {
    const existing = await db.category.findUnique({ where: { storeId_slug: { storeId, slug } } });
    if (!existing) break;
    slug = `${baseSlug}-${suffix++}`;
  }

  const category = await db.category.create({
    data: {
      storeId,
      slug,
      namePt,
      nameEn: nameEn || null,
      nameEs: nameEs || null,
      area: area ?? "HOT_DRINKS",
      iconEmoji: iconEmoji || null,
      accentColor: accentColor || null,
      sortOrder: sortOrder ?? 0,
    },
  });

  return NextResponse.json(category, { status: 201 });
}
