import { PrismaClient } from "@prisma/client";

const db = new PrismaClient();

async function main() {
  console.log("🌱 Seeding database...");

  // Plans
  await db.plan.upsert({
    where: { id: "plan-starter" },
    update: { maxAdmins: 1, maxSellers: 2 },
    create: {
      id: "plan-starter",
      name: "Starter",
      maxStores: 1,
      maxAdmins: 1,
      maxSellers: 2,
      priceMonthly: 49,
      sortOrder: 0,
    },
  });

  await db.plan.upsert({
    where: { id: "plan-pro" },
    update: { maxAdmins: 2, maxSellers: 5 },
    create: {
      id: "plan-pro",
      name: "Pro",
      maxStores: 3,
      maxAdmins: 2,
      maxSellers: 5,
      priceMonthly: 99,
      sortOrder: 1,
    },
  });

  await db.plan.upsert({
    where: { id: "plan-business" },
    update: { maxAdmins: -1, maxSellers: -1 },
    create: {
      id: "plan-business",
      name: "Business",
      maxStores: -1,
      maxAdmins: -1,
      maxSellers: -1,
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
