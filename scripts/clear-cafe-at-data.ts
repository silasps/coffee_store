import { PrismaClient } from "@prisma/client";
import path from "path";
import { config } from "dotenv";

config({ path: path.resolve(__dirname, "../.env") });

const db = new PrismaClient({ datasourceUrl: process.env.DIRECT_URL });
const STORE_ID = "d8823f40-be68-4b3f-81c0-deaaa2b54182";

async function main() {
  const { count: orders } = await db.order.deleteMany({ where: { storeId: STORE_ID } });
  const { count: finance } = await db.financeEntry.deleteMany({ where: { storeId: STORE_ID } });
  const { count: ai } = await db.aiUsage.deleteMany({ where: { storeId: STORE_ID } });

  console.log(`✓ ${orders} pedidos apagados (+ itens via cascade)`);
  console.log(`✓ ${finance} lançamentos financeiros apagados`);
  console.log(`✓ ${ai} registros de uso de IA apagados`);
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => db.$disconnect());
