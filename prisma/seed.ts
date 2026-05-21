import { PrismaClient } from "@prisma/client";

const db = new PrismaClient();

async function main() {
  console.log("🌱 Seeding database...");

  // Plans
  const starter = await db.plan.upsert({
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

  const pro = await db.plan.upsert({
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

  // Demo user (link to Supabase user manually)
  const user = await db.user.upsert({
    where: { email: "admin@cafeat.com" },
    update: {},
    create: {
      authId: "00000000-0000-0000-0000-000000000001", // replace with real Supabase UID
      email: "admin@cafeat.com",
      name: "Admin Café AT",
      role: "STORE_OWNER",
    },
  });

  // Subscription
  const trialEnd = new Date();
  trialEnd.setDate(trialEnd.getDate() + 30);

  await db.subscription.upsert({
    where: { userId: user.id },
    update: {},
    create: {
      userId: user.id,
      planId: starter.id,
      status: "TRIALING",
      trialUntil: trialEnd,
    },
  });

  console.log("✓ User + subscription created");

  // Store: Café AT
  const store = await db.store.upsert({
    where: { slug: "cafe-at" },
    update: {},
    create: {
      ownerId: user.id,
      slug: "cafe-at",
      namePt: "Café AT",
      nameEn: "Café AT",
      nameEs: "Café AT",
      sloganPt: "De Tamandaré para as nações",
      sloganEn: "From Tamandaré to the nations",
      sloganEs: "De Tamandaré a las naciones",
      primaryColor: "#3A1A00",
      accentColor: "#E86A1A",
      defaultLocale: "pt",
      isActive: true,
      causeTitlePt: "Nosso Café tem Propósito",
      causeTitleEn: "Our Coffee has a Purpose!",
      causeTextPt:
        "Ao tomar um café aqui, você está investindo em pessoas que desejam viver o chamado missionário. O lucro do Café AT é destinado a missões, apoiando alunos das nossas ETEDs e na formação missionária.",
      causeTextEn:
        "When you have a coffee here, you are investing in people who are pursuing their missionary calling. All profits go to missions, supporting students in our DTS programs and missionaries.",
      causeDonationPix: "oferta@jocumpr.com.br",
    },
  });

  console.log("✓ Store 'cafe-at' created");

  // Categories
  const cats = [
    {
      slug: "cafes-especiais",
      namePt: "Cafés Especiais",
      nameEn: "Specialty Coffees",
      nameEs: "Cafés Especiales",
      iconEmoji: "☕",
      area: "HOT_DRINKS" as const,
      sortOrder: 0,
    },
    {
      slug: "bebidas-geladas",
      namePt: "Bebidas Geladas",
      nameEn: "Iced Drinks",
      nameEs: "Bebidas Frías",
      iconEmoji: "🧋",
      area: "COLD_DRINKS" as const,
      sortOrder: 1,
    },
    {
      slug: "comes",
      namePt: "Comes",
      nameEn: "Food",
      nameEs: "Comidas",
      iconEmoji: "🥐",
      area: "FOODS" as const,
      sortOrder: 2,
    },
    {
      slug: "combos",
      namePt: "Combos",
      nameEn: "Combos",
      nameEs: "Combos",
      iconEmoji: "🎁",
      area: "HOT_DRINKS" as const,
      sortOrder: 3,
    },
  ];

  const createdCats: Record<string, string> = {};
  for (const cat of cats) {
    const c = await db.category.upsert({
      where: { storeId_slug: { storeId: store.id, slug: cat.slug } },
      update: {},
      create: { storeId: store.id, ...cat },
    });
    createdCats[cat.slug] = c.id;
  }

  console.log("✓ Categories created");

  // Products
  const products = [
    // Cafés especiais
    {
      categorySlug: "cafes-especiais",
      slug: "espresso-duplo",
      namePt: "Espresso Duplo",
      nameEn: "Double Espresso",
      nameEs: "Espresso Doble",
      descriptionPt: "Dois shots de espresso extraídos com grãos selecionados da região",
      descriptionEn: "Two espresso shots from selected regional beans",
      highlightPt: "Clássico",
      basePrice: 8.0,
      prepMinutes: 3,
      tags: ["POPULAR", "FEATURED"],
      sortOrder: 0,
    },
    {
      categorySlug: "cafes-especiais",
      slug: "cappuccino-artesanal",
      namePt: "Cappuccino Artesanal",
      nameEn: "Artisan Cappuccino",
      nameEs: "Cappuccino Artesanal",
      descriptionPt: "Espresso cremoso com leite vaporizado e espuma perfeita",
      descriptionEn: "Creamy espresso with steamed milk and perfect foam",
      highlightPt: "O Favorito",
      basePrice: 12.0,
      prepMinutes: 5,
      tags: ["POPULAR"],
      sortOrder: 1,
    },
    {
      categorySlug: "cafes-especiais",
      slug: "cafe-coado-especial",
      namePt: "Café Coado Especial",
      nameEn: "Pour Over Coffee",
      nameEs: "Café de Filtro Especial",
      descriptionPt: "Grãos selecionados extraídos lentamente no método pour over",
      descriptionEn: "Selected beans slowly extracted with pour over method",
      highlightPt: "Single Origin",
      basePrice: 10.0,
      prepMinutes: 8,
      tags: ["SUGGESTED", "NEW"],
      sortOrder: 2,
    },
    {
      categorySlug: "cafes-especiais",
      slug: "latte-especial",
      namePt: "Latte Especial",
      nameEn: "Special Latte",
      nameEs: "Latte Especial",
      descriptionPt: "Espresso com leite vaporizado e arte latte",
      descriptionEn: "Espresso with steamed milk and latte art",
      basePrice: 14.0,
      prepMinutes: 6,
      tags: ["FEATURED"],
      sortOrder: 3,
    },
    // Bebidas geladas
    {
      categorySlug: "bebidas-geladas",
      slug: "cold-brew",
      namePt: "Cold Brew",
      nameEn: "Cold Brew",
      nameEs: "Cold Brew",
      descriptionPt: "Café extraído a frio por 12 horas, suave e intenso",
      descriptionEn: "Cold extracted for 12 hours, smooth and intense",
      highlightPt: "Exclusivo",
      basePrice: 15.0,
      prepMinutes: 2,
      tags: ["POPULAR", "FEATURED"],
      sortOrder: 0,
    },
    {
      categorySlug: "bebidas-geladas",
      slug: "iced-latte",
      namePt: "Iced Latte",
      nameEn: "Iced Latte",
      nameEs: "Iced Latte",
      descriptionPt: "Espresso sobre gelo com leite gelado",
      descriptionEn: "Espresso over ice with chilled milk",
      basePrice: 13.0,
      prepMinutes: 3,
      tags: ["POPULAR"],
      sortOrder: 1,
    },
    {
      categorySlug: "bebidas-geladas",
      slug: "frappuccino-caramelo",
      namePt: "Frappuccino Caramelo",
      nameEn: "Caramel Frappuccino",
      nameEs: "Frappuccino de Caramelo",
      descriptionPt: "Bebida cremosa gelada com calda de caramelo",
      descriptionEn: "Creamy iced drink with caramel syrup",
      highlightPt: "Irresistível",
      basePrice: 18.0,
      prepMinutes: 5,
      tags: ["SUGGESTED"],
      sortOrder: 2,
    },
    // Comes
    {
      categorySlug: "comes",
      slug: "croissant-manteiga",
      namePt: "Croissant de Manteiga",
      nameEn: "Butter Croissant",
      nameEs: "Croissant de Mantequilla",
      descriptionPt: "Croissant fresquinho assado no dia com manteiga artesanal",
      descriptionEn: "Fresh daily-baked croissant with artisan butter",
      highlightPt: "Fresquinho",
      basePrice: 9.0,
      prepMinutes: 2,
      tags: ["POPULAR"],
      sortOrder: 0,
    },
    {
      categorySlug: "comes",
      slug: "bolo-cenoura",
      namePt: "Bolo de Cenoura",
      nameEn: "Carrot Cake",
      nameEs: "Pastel de Zanahoria",
      descriptionPt: "Bolo caseiro de cenoura com cobertura de chocolate",
      descriptionEn: "Homemade carrot cake with chocolate frosting",
      highlightPt: "Caseiro",
      basePrice: 7.0,
      prepMinutes: 1,
      tags: ["SUGGESTED"],
      sortOrder: 1,
    },
    {
      categorySlug: "comes",
      slug: "pao-queijo",
      namePt: "Pão de Queijo",
      nameEn: "Cheese Bread",
      nameEs: "Pan de Queso",
      descriptionPt: "Pão de queijo mineiro, crocante por fora e macio por dentro",
      descriptionEn: "Brazilian cheese bread, crispy outside and soft inside",
      highlightPt: "Mineiro",
      basePrice: 5.0,
      prepMinutes: 2,
      tags: ["POPULAR"],
      sortOrder: 2,
    },
    // Combos
    {
      categorySlug: "combos",
      slug: "combo-manha",
      namePt: "Combo Manhã",
      nameEn: "Morning Combo",
      nameEs: "Combo Mañana",
      descriptionPt: "Cappuccino Artesanal + Croissant de Manteiga",
      descriptionEn: "Artisan Cappuccino + Butter Croissant",
      highlightPt: "Economia de R$5",
      basePrice: 16.0,
      prepMinutes: 6,
      tags: ["COMBO", "SUGGESTED"],
      sortOrder: 0,
    },
    {
      categorySlug: "combos",
      slug: "combo-tarde",
      namePt: "Combo Tarde",
      nameEn: "Afternoon Combo",
      nameEs: "Combo Tarde",
      descriptionPt: "Cold Brew + Bolo de Cenoura",
      descriptionEn: "Cold Brew + Carrot Cake",
      highlightPt: "Perfeito para 3h",
      basePrice: 19.0,
      prepMinutes: 3,
      tags: ["COMBO", "FEATURED"],
      sortOrder: 1,
    },
  ];

  for (const product of products) {
    const { categorySlug, ...productData } = product;
    const categoryId = createdCats[categorySlug];
    if (!categoryId) continue;

    await db.product.upsert({
      where: { storeId_slug: { storeId: store.id, slug: productData.slug } },
      update: {},
      create: {
        storeId: store.id,
        categoryId,
        ...productData,
        tags: productData.tags as ("POPULAR" | "SUGGESTED" | "NEW" | "COMBO" | "FEATURED")[],
      },
    });
  }

  console.log("✓ Products created");
  console.log("✅ Seed complete!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => db.$disconnect());
