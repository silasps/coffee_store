import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { createClient } from "@/lib/supabase/server";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ productId: string }> }
) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { productId } = await params;
  const {
    namePt, nameEn, nameEs,
    categoryId,
    descriptionPt, descriptionEn, descriptionEs,
    highlightPt, highlightEn, highlightEs,
    imageUrl, basePrice, isAvailable, sortOrder, tags, stockQuantity, comboItems,
  } = await req.json();

  const product = await db.product.update({
    where: { id: productId },
    data: {
      ...(namePt !== undefined && { namePt }),
      ...(nameEn !== undefined && { nameEn: nameEn || null }),
      ...(nameEs !== undefined && { nameEs: nameEs || null }),
      ...(categoryId !== undefined && { categoryId }),
      ...(descriptionPt !== undefined && { descriptionPt: descriptionPt || null }),
      ...(descriptionEn !== undefined && { descriptionEn: descriptionEn || null }),
      ...(descriptionEs !== undefined && { descriptionEs: descriptionEs || null }),
      ...(highlightPt !== undefined && { highlightPt: highlightPt || null }),
      ...(highlightEn !== undefined && { highlightEn: highlightEn || null }),
      ...(highlightEs !== undefined && { highlightEs: highlightEs || null }),
      ...(imageUrl !== undefined && { imageUrl: imageUrl || null }),
      ...(basePrice !== undefined && { basePrice: basePrice !== "" && basePrice != null ? basePrice : null }),
      ...(isAvailable !== undefined && { isAvailable }),
      ...(sortOrder !== undefined && { sortOrder }),
      ...(tags !== undefined && { tags }),
      ...(stockQuantity !== undefined && { stockQuantity: stockQuantity != null ? parseInt(stockQuantity) : null }),
      ...(comboItems !== undefined && { comboItems: comboItems ?? null }),
    },
  });

  return NextResponse.json(product);
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ productId: string }> }
) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { productId } = await params;
  await db.product.delete({ where: { id: productId } });

  return new NextResponse(null, { status: 204 });
}
