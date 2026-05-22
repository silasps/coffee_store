import { PrismaClient } from "@prisma/client";

const db = new PrismaClient();

async function main() {
  console.log("🌱 Seeding database...");

  // Plans
  await db.plan.upsert({
    where: { id: "plan-starter" },
    update: {},
    create: {
      id: "plan-starter",
      name: "Starter",
      maxStores: 1,
      priceMonthly: 49,
      sortOrder: 0,
    },
  });

  await db.plan.upsert({
    where: { id: "plan-pro" },
    update: {},
    create: {
      id: "plan-pro",
      name: "Pro",
      maxStores: 3,
      priceMonthly: 99,
      sortOrder: 1,
    },
  });

  await db.plan.upsert({
    where: { id: "plan-business" },
    update: {},
    create: {
      id: "plan-business",
      name: "Business",
      maxStores: -1,
      priceMonthly: 199,
      sortOrder: 2,
    },
  });

  console.log("✓ Plans created");
  console.log("✅ Seed complete! Sign up via the app to create your first store.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => db.$disconnect());
