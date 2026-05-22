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
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const dbUser = await db.user.findUnique({ where: { authId: user.id } });
  if (!dbUser) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const { namePt, slug: rawSlug } = body;

  if (!namePt) {
    return NextResponse.json({ error: "Nome da loja é obrigatório" }, { status: 400 });
  }

  const baseSlug = slugify(rawSlug || namePt);
  let slug = baseSlug;
  let suffix = 1;
  while (true) {
    const existing = await db.store.findUnique({ where: { slug } });
    if (!existing) break;
    slug = `${baseSlug}-${suffix++}`;
  }

  const store = await db.store.create({
    data: {
      ownerId: dbUser.id,
      slug,
      namePt,
    },
  });

  return NextResponse.json(store, { status: 201 });
}
