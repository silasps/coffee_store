import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { createClient } from "@/lib/supabase/server";

type Ctx = { params: Promise<{ categoryId: string }> };

export async function PATCH(req: NextRequest, { params }: Ctx) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { categoryId } = await params;
  const body = await req.json();
  const { namePt, nameEn, nameEs, area, iconEmoji, accentColor, sortOrder, isActive } = body;

  const category = await db.category.update({
    where: { id: categoryId },
    data: {
      ...(namePt !== undefined && { namePt }),
      ...(nameEn !== undefined && { nameEn: nameEn || null }),
      ...(nameEs !== undefined && { nameEs: nameEs || null }),
      ...(area !== undefined && { area }),
      ...(iconEmoji !== undefined && { iconEmoji: iconEmoji || null }),
      ...(accentColor !== undefined && { accentColor: accentColor || null }),
      ...(sortOrder !== undefined && { sortOrder }),
      ...(isActive !== undefined && { isActive }),
    },
  });

  return NextResponse.json(category);
}

export async function DELETE(req: NextRequest, { params }: Ctx) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { categoryId } = await params;

  const productCount = await db.product.count({ where: { categoryId } });
  if (productCount > 0) {
    return NextResponse.json(
      { error: `Essa categoria tem ${productCount} produto(s). Mova-os antes de excluir.` },
      { status: 409 }
    );
  }

  await db.category.delete({ where: { id: categoryId } });
  return new NextResponse(null, { status: 204 });
}
