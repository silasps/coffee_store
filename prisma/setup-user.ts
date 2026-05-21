/**
 * Cria o usuário admin no Supabase Auth e linka ao registro no banco.
 * Uso: tsx prisma/setup-user.ts
 *
 * Preencha EMAIL e PASSWORD antes de rodar.
 */
import path from "path";
import { config } from "dotenv";
config({ path: path.resolve(__dirname, "../.env") });

import { createClient } from "@supabase/supabase-js";
import { PrismaClient } from "@prisma/client";

const EMAIL = "admin@cafeat.com";
const PASSWORD = "CafeAT2026!"; // troque se quiser

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
);
const db = new PrismaClient();

async function main() {
  console.log("🔑 Criando usuário no Supabase Auth...");

  const { data, error } = await supabase.auth.admin.createUser({
    email: EMAIL,
    password: PASSWORD,
    email_confirm: true,
  });

  if (error) {
    if (error.message.includes("already been registered")) {
      console.log("ℹ️  Usuário já existe no Auth — buscando UID...");
      const { data: list } = await supabase.auth.admin.listUsers();
      const existing = list?.users.find((u) => u.email === EMAIL);
      if (!existing) throw new Error("Não foi possível encontrar o usuário.");
      await linkUser(existing.id);
    } else {
      throw error;
    }
  } else {
    await linkUser(data.user.id);
  }
}

async function linkUser(authId: string) {
  console.log(`✓ Auth UID: ${authId}`);
  console.log("🔗 Linkando ao registro no banco...");

  await db.user.upsert({
    where: { email: EMAIL },
    update: { authId },
    create: {
      authId,
      email: EMAIL,
      name: "Admin Café AT",
      role: "STORE_OWNER",
    },
  });

  console.log("✅ Pronto! Usuário linkado.");
  console.log(`   Email: ${EMAIL}`);
  console.log(`   Senha: ${PASSWORD}`);
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => db.$disconnect());
