import { PrismaClient } from "@prisma/client";
import { createClient } from "@supabase/supabase-js";
import path from "path";
import { config } from "dotenv";

config({ path: path.resolve(__dirname, "../.env") });

const db = new PrismaClient();
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
);

const STORE_ID = "d8823f40-be68-4b3f-81c0-deaaa2b54182";
const BUCKET = "product-images";
const CONCURRENCY = 3;

async function fetchWithRetry(url: string, retries = 3): Promise<Buffer> {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      const res = await fetch(url, { signal: AbortSignal.timeout(60_000) });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return Buffer.from(await res.arrayBuffer());
    } catch (err) {
      if (attempt === retries) throw err;
      console.log(`    ↺ tentativa ${attempt + 1}...`);
      await new Promise(r => setTimeout(r, 2000 * attempt));
    }
  }
  throw new Error("unreachable");
}

async function uploadToSupabase(buffer: Buffer, slug: string): Promise<string> {
  const filePath = `${STORE_ID}/${slug}.jpg`;

  // delete existing so upsert works
  await supabase.storage.from(BUCKET).remove([filePath]);

  const { error } = await supabase.storage.from(BUCKET).upload(filePath, buffer, {
    contentType: "image/jpeg",
    upsert: true,
  });
  if (error) throw new Error(error.message);

  const { data: { publicUrl } } = supabase.storage.from(BUCKET).getPublicUrl(filePath);
  return publicUrl;
}

async function processProduct(p: { id: string; slug: string; namePt: string; imageUrl: string | null }) {
  if (!p.imageUrl || !p.imageUrl.includes("pollinations.ai")) {
    console.log(`  ⏭  ${p.namePt} — sem URL Pollinations, pulando`);
    return;
  }

  process.stdout.write(`  ⬇  ${p.namePt}... `);
  try {
    const buffer = await fetchWithRetry(p.imageUrl);
    const publicUrl = await uploadToSupabase(buffer, p.slug);
    await db.product.update({ where: { id: p.id }, data: { imageUrl: publicUrl } });
    console.log("✅");
  } catch (err) {
    console.log(`❌ ${(err as Error).message}`);
  }
}

async function main() {
  const products = await db.product.findMany({
    where: { storeId: STORE_ID },
    select: { id: true, slug: true, namePt: true, imageUrl: true },
    orderBy: { sortOrder: "asc" },
  });

  console.log(`📦 ${products.length} produtos encontrados. Iniciando download e upload...\n`);

  // Process in batches to avoid overwhelming the API
  for (let i = 0; i < products.length; i += CONCURRENCY) {
    const batch = products.slice(i, i + CONCURRENCY);
    await Promise.all(batch.map(processProduct));
  }

  console.log("\n🎉 Migração concluída!");
}

main()
  .catch(console.error)
  .finally(() => db.$disconnect());
