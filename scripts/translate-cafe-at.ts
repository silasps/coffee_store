/**
 * Populates EN + ES translations for Café AT categories and product descriptions.
 * - Product names: not translated (kept as Portuguese)
 * - Descriptions: manually translated below
 * - Category names: translated
 */

import { PrismaClient } from "@prisma/client";
import path from "path";
import { config } from "dotenv";

config({ path: path.resolve(__dirname, "../.env") });

const db = new PrismaClient();
const STORE_ID = "d8823f40-be68-4b3f-81c0-deaaa2b54182";

// ── Category translations ─────────────────────────────────────────────────────
const CATEGORY_T: Record<string, { en: string; es: string }> = {
  "salgados-fritos":  { en: "Fried Snacks",                   es: "Bocadillos Fritos"            },
  "salgados-assados": { en: "Baked Snacks",                    es: "Bocadillos al Horno"          },
  "lanches":          { en: "Cheese Bread & Snacks",           es: "Pan de Queso & Bocadillos"    },
  "croissants":       { en: "Croissants",                      es: "Croissants"                   },
  "tapiocas":         { en: "Tapiocas",                        es: "Tapiocas"                     },
  "crepiocas":        { en: "Crepiocas",                       es: "Crepiocas"                    },
  "sobremesas":       { en: "Desserts",                        es: "Postres"                      },
  "cafes-quentes":    { en: "Hot Coffees",                     es: "Cafés Calientes"              },
  "chocolates":       { en: "Chocolates",                      es: "Chocolates"                   },
  "cafes-gelados":    { en: "Iced Coffees & Cold Drinks",      es: "Cafés Helados & Bebidas Frías" },
  "bebidas":          { en: "Beverages",                       es: "Bebidas"                      },
  "sucos":            { en: "Juices & Smoothies",              es: "Jugos & Batidos"              },
};

// ── Product description translations (keyed by slug) ─────────────────────────
const DESC_T: Record<string, { en: string; es: string }> = {
  // Salgados Fritos
  "coxinha-catupiri":     { en: "Crispy fried coxinha filled with creamy catupiri cheese.", es: "Coxinha frita y crujiente rellena de cremoso catupiri." },
  "enrolado-salsicha":    { en: "Crispy fried roll filled with juicy sausage.", es: "Rollito frito y crujiente relleno de salchicha jugosa." },
  "kibe":                 { en: "Traditional fried kibbeh — crispy on the outside, tender on the inside.", es: "Kibe frito tradicional — crujiente por fuera y tierno por dentro." },
  "risole":               { en: "Crispy fried rissole with a delicious filling.", es: "Risolé frito y crujiente con un relleno delicioso." },

  // Salgados Assados
  "esfiha-carne":            { en: "Baked esfiha filled with seasoned ground beef.", es: "Esfiha horneada rellena de carne molida sazonada." },
  "esfiha-presunto-queijo":  { en: "Baked esfiha filled with ham and melted cheese.", es: "Esfiha horneada rellena de jamón y queso derretido." },
  "empadao-frango":          { en: "Baked chicken pie with a creamy filling.", es: "Empanada de pollo al horno con relleno cremoso." },
  "empadinha-frango":        { en: "Mini baked chicken pastry, perfectly seasoned.", es: "Mini empanada de pollo al horno, perfectamente sazonada." },
  "empadinha-palmito":       { en: "Mini baked pastry filled with savory palm heart.", es: "Mini empanada horneada rellena de palmito sabroso." },

  // Pão de Queijo & Lanches
  "pao-queijo-pequeno":  { en: "Made fresh daily at Café AT with Minas Gerais cheese — the authentic flavor only our pão de queijo has.", es: "Preparado diariamente en Café AT con queso de Minas Gerais — el sabor auténtico que solo nuestro pão de queijo tiene." },
  "pao-queijo-grande":   { en: "Made fresh at Café AT with Minas Gerais cheese, guaranteeing the original one-of-a-kind flavor.", es: "Preparado en Café AT con queso de Minas Gerais, garantizando el sabor original e inigualable." },
  "misto-quente":        { en: "Toasted sandwich with ham, cheese and oregano. Available with or without oregano.", es: "Sándwich tostado con jamón, queso y orégano. Disponible con o sin orégano." },
  "misto-quente-duplo":  { en: "Double toasted sandwich with ham, cheese and oregano. Available with or without oregano.", es: "Sándwich tostado doble con jamón, queso y orégano. Disponible con o sin orégano." },

  // Croissants
  "croissant-bacon":            { en: "Flaky croissant sandwich with bacon, cheese and tomato.", es: "Sándwich de croissant hojaldrado con bacon, queso y tomate." },
  "croissant-bacon-egg":        { en: "Flaky croissant with bacon, cheese, fried egg, lettuce and tomato.", es: "Croissant hojaldrado con bacon, queso, huevo frito, lechuga y tomate." },
  "croissant-misto-quente":     { en: "Flaky croissant with ham, cheese, tomato and oregano.", es: "Croissant hojaldrado con jamón, queso, tomate y orégano." },
  "croissant-queijo-quente":    { en: "Flaky croissant with double cheese, cream cheese, tomato and oregano.", es: "Croissant hojaldrado con doble queso, requeijão, tomate y orégano." },
  "croissant-simples":          { en: "Artisan croissant — golden and flaky on the outside, soft on the inside.", es: "Croissant artesanal — dorado y hojaldrado por fuera, suave por dentro." },
  "croissant-crocante":         { en: "Flaky croissant filled with irresistible Nutella and Ovomaltine.", es: "Croissant hojaldrado relleno de irresistible Nutella y Ovomaltine." },
  "croissant-doce-de-leite":    { en: "Flaky croissant filled with creamy dulce de leche and crunchy paçoca.", es: "Croissant hojaldrado relleno de dulce de leche cremoso y paçoca crujiente." },
  "croissant-morango-nutella":  { en: "Flaky croissant filled with fresh strawberries and Nutella.", es: "Croissant hojaldrado relleno de fresas frescas y Nutella." },
  "croissant-romeu-julieta":    { en: "Flaky croissant with guava paste and cheese — a classic Brazilian combination.", es: "Croissant hojaldrado con pasta de guayaba y queso — una combinación clásica brasileña." },
  "croissant-pistache":         { en: "Premium croissant filled with creamy pistachio and mixed nuts.", es: "Croissant premium relleno de crema de pistacho y frutos secos." },

  // Tapiocas
  "tapioca-americana":     { en: "Tapioca crepe filled with egg, crispy bacon and melted cheese.", es: "Crepe de tapioca relleno de huevo, bacon crujiente y queso derretido." },
  "tapioca-misto-quente":  { en: "Tapioca crepe with cheese, cream cheese, tomato and oregano.", es: "Crepe de tapioca con queso, requeijão, tomate y orégano." },
  "tapioca-crocante":      { en: "Tapioca crepe filled with Nutella and Ovomaltine.", es: "Crepe de tapioca relleno de Nutella y Ovomaltine." },
  "tapioca-desejo":        { en: "Tapioca crepe with fresh strawberries and condensed milk.", es: "Crepe de tapioca con fresas frescas y leche condensada." },
  "tapioca-mineira":       { en: "Tapioca crepe with caramelized banana and dulce de leche.", es: "Crepe de tapioca con banana caramelizada y dulce de leche." },
  "tapioca-moca":          { en: "Tapioca crepe with condensed milk and cheese — the perfect sweet-salty combo.", es: "Crepe de tapioca con leche condensada y queso — la combinación perfecta de dulce y salado." },
  "tapioca-pecado":        { en: "Tapioca crepe with fresh strawberries and Nutella — an irresistible indulgence.", es: "Crepe de tapioca con fresas frescas y Nutella — un placer irresistible." },

  // Crepiocas
  "crepioca-simples":       { en: "Tapioca-egg crepe with a cheese crust, filled with cheese and ham.", es: "Crepe de tapioca con huevo y costra de queso, relleno de queso y jamón." },
  "crepioca-americana":     { en: "Tapioca-egg crepe with egg, crispy bacon and melted cheese.", es: "Crepe de tapioca con huevo, bacon crujiente y queso derretido." },
  "crepioca-misto-quente":  { en: "Tapioca-egg crepe with ham, cheese, fresh tomato and oregano.", es: "Crepe de tapioca con jamón, queso, tomate fresco y orégano." },
  "crepioca-queijo-quente": { en: "Tapioca-egg crepe with double cheese, cream cheese, tomato and oregano.", es: "Crepe de tapioca con doble queso, requeijão, tomate y orégano." },

  // Sobremesas
  "bolo-caseiro": { en: "Slice of homemade cake. Flavors: Chocolate with Ninho milk, Carrot with Chocolate, or Lemon with Zest.", es: "Rebanada de pastel casero. Sabores: Chocolate con Ninho, Zanahoria con Chocolate o Limón con Ralladura." },

  // Cafés Quentes
  "espresso-pequeno":       { en: "100% Arabica beans, full-bodied with a rich chocolate aroma. Single shot, 50ml.", es: "Granos 100% Arábica, cuerpo pleno con aroma a chocolate. Solo, 50ml." },
  "espresso-grande":        { en: "100% Arabica beans, full-bodied with a rich chocolate aroma. 180ml.", es: "Granos 100% Arábica, cuerpo pleno con aroma a chocolate. 180ml." },
  "canelinha":              { en: "Espresso served with a dusting of cinnamon powder — warming aroma and flavor.", es: "Espresso servido con canela en polvo — aroma y sabor reconfortantes." },
  "espresso-com-leite":     { en: "One shot of espresso with velvety steamed milk.", es: "Un shot de espresso con suave leche vaporizada." },
  "machiato":               { en: "Espresso crowned with a gentle layer of milk foam.", es: "Espresso coronado con una suave capa de espuma de leche." },
  "machiato-duplo":         { en: "Two shots of espresso with a layer of milk foam.", es: "Dos shots de espresso con una capa de espuma de leche." },
  "cafe-coado":             { en: "Classic house-brewed filtered coffee — comforting and flavorful.", es: "Café de filtro tradicional de la casa — reconfortante y sabroso." },
  "french-press":           { en: "Immersion and pressure brewing method delivering a full-bodied, aromatic brew. 295ml.", es: "Método de infusión por presión que produce una bebida de cuerpo pleno y aromática. 295ml." },
  "hario-v60":              { en: "Pour-over with paper filter — a clean, balanced cup from beans scoring above 80 points. 180ml.", es: "Goteo con filtro de papel — taza limpia y equilibrada con granos de más de 80 puntos. 180ml." },
  "cha-quente":             { en: "Hot tea served in a cup. Flavors: Green Apple, Peach, Lemon and Red Berries. 180ml.", es: "Té caliente en taza. Sabores: Manzana Verde, Durazno, Limón y Frutos Rojos. 180ml." },
  "cappuccino-chocolate-belga": { en: "Italian classic made with espresso, Belgian chocolate, steamed milk and cinnamon.", es: "Clásico italiano elaborado con espresso, chocolate belga, leche vaporizada y canela." },
  "cappuccino-chantilly":   { en: "Espresso topped with fluffy whipped cream and a dusting of cinnamon.", es: "Espresso coronado con crema chantilly esponjosa y canela en polvo." },
  "caramelow":              { en: "Espresso with creamy steamed milk foam and rich caramel syrup.", es: "Espresso con espuma de leche cremosa y sirope de caramelo." },
  "mocha":                  { en: "Espresso with steamed milk. Flavors: Chocolate, Caramel or Condensed Milk. 180ml.", es: "Espresso con leche vaporizada. Sabores: Chocolate, Caramelo o Leche Condensada. 180ml." },
  "ovomaltine-leite-condensado": { en: "Creamy hot drink made with Ovomaltine and condensed milk.", es: "Bebida caliente y cremosa elaborada con Ovomaltine y leche condensada." },

  // Chocolates
  "chocolate-quente":  { en: "50% cocoa chocolate prepared with whole milk — intense and velvety.", es: "Chocolate 50% cacao preparado con leche entera — intenso y aterciopelado." },
  "chocolate-gelado":  { en: "Chilled chocolate shake with Ovomaltine, cinnamon and whipped cream. 295ml.", es: "Batido de chocolate frío con Ovomaltine, canela y crema chantilly. 295ml." },
  "choco-max-nutella": { en: "Chilled chocolate cup with a Nutella-rimmed glass, chocolate syrup and whipped cream with Ovomaltine. 400ml.", es: "Copa de chocolate frío con borde de Nutella, sirope de chocolate y crema chantilly con Ovomaltine. 400ml." },

  // Cafés Gelados
  "coffee-caramelo":     { en: "Espresso poured over ice with steamed milk and caramel. Options: salted or vanilla caramel.", es: "Espresso sobre hielo con leche vaporizada y caramelo. Opciones: caramelo salado o de vainilla." },
  "coffee-shake-oreo":   { en: "Shake with Oreo cookies, milk, coffee mousse and whipped cream.", es: "Batido con galletas Oreo, leche, mousse de café y crema chantilly." },
  "afogatto":            { en: "Vanilla ice cream submerged in a double shot of hot espresso.", es: "Helado de vainilla sumergido en un doble shot de espresso caliente." },
  "cappuccino-ice":      { en: "Refreshing iced version of our cappuccino with whipped cream, chocolate syrup and cinnamon.", es: "Versión helada y refrescante de nuestro cappuccino con crema chantilly, sirope de chocolate y canela." },
  "cha-batido":          { en: "Iced blended tea. Flavors: Green Apple, Lemon, Peach and Red Berries. 400ml.", es: "Té frío batido. Sabores: Manzana Verde, Limón, Durazno y Frutos Rojos. 400ml." },
  "limonada-suica":      { en: "Creamy lemonade blended with condensed milk. 400ml.", es: "Limonada cremosa batida con leche condensada. 400ml." },
  "soda":                { en: "Artisan sparkling soda. Flavors: Sicilian Lemon, Green Apple, Blue Lemonade, Pink Lemonade, Roasted Mate Tea, Raspberry, Tangerine and Ginger.", es: "Soda artesanal. Sabores: Limón Siciliano, Manzana Verde, Blue Lemonade, Pink Lemonade, Té Mate Tostado, Frambuesa, Mandarina y Jengibre." },
  "milkshake":           { en: "Thick and creamy milkshake. Flavors: Strawberry, Cream, Chocolate or Ovomaltine. 400ml.", es: "Malteada espesa y cremosa. Sabores: Fresa, Crema, Chocolate u Ovomaltine. 400ml." },
  "frape":               { en: "Chilled, creamy frappé. Flavors: Coffee, Strawberry or Chocolate. 400ml.", es: "Frappé frío y cremoso. Sabores: Café, Fresa o Chocolate. 400ml." },

  // Bebidas
  "refrigerante-mini":   { en: "Chilled mini soda.", es: "Mini refresco helado." },
  "refrigerante-lata":   { en: "Chilled soda in a can.", es: "Refresco en lata helado." },
  "coca-cola-ks":        { en: "Chilled Coca-Cola KS.", es: "Coca-Cola KS helada." },
  "coca-cola-2l":        { en: "Coca-Cola 2 liters.", es: "Coca-Cola 2 litros." },
  "pepsi-fanta-2l":      { en: "Pepsi or Fanta 2 liter bottle.", es: "Pepsi o Fanta en botella de 2 litros." },
  "cha-mate-gas":        { en: "Chilled sparkling mate tea.", es: "Té mate con gas, helado." },
  "del-valle-lata":      { en: "Del Valle fruit juice in a can.", es: "Jugo Del Valle en lata." },
  "del-valle-garrafa":   { en: "Del Valle fruit juice in a bottle.", es: "Jugo Del Valle en botella." },
  "kapo":                { en: "Kapo juice box.", es: "Jugo Kapo en caja." },
  "suco-caixinha":       { en: "Juice box.", es: "Jugo en caja." },
  "achocolatado":        { en: "Chilled chocolate milk.", es: "Leche chocolatada fría." },
  "suco-lata-gas":       { en: "Sparkling fruit juice in a can.", es: "Jugo de fruta con gas en lata." },
  "gatorade":            { en: "Chilled Gatorade sports drink.", es: "Bebida isotónica Gatorade fría." },
  "monster":             { en: "Monster energy drink.", es: "Bebida energizante Monster." },
  "red-bull":            { en: "Red Bull energy drink.", es: "Bebida energizante Red Bull." },
  "baly":                { en: "Baly energy drink.", es: "Bebida energizante Baly." },
  "furioso":             { en: "Furioso energy drink.", es: "Bebida energizante Furioso." },
  "cha-mate-copo":       { en: "Chilled mate tea in a cup.", es: "Té mate frío en vaso." },
  "mini-cini":           { en: "Mini Cini chilled.", es: "Mini Cini frío." },
  "cini-mix":            { en: "Cini Mix.", es: "Cini Mix." },
  "agua-mineral":        { en: "Mineral water, still or sparkling.", es: "Agua mineral con o sin gas." },
  "agua-saborizada":     { en: "Chilled flavored water.", es: "Agua saborizada fría." },

  // Sucos
  "suco-natural":       { en: "Fresh natural juices. Flavors: Orange, Pineapple, Lemon, Strawberry, Papaya, Melon and Watermelon. 400ml.", es: "Jugos naturales frescos. Sabores: Naranja, Piña, Limón, Fresa, Papaya, Melón y Sandía. 400ml." },
  "polpa-fruta-batida": { en: "Fruit pulp blended with water. Flavors: Pineapple with mint, Acerola, Coconut, Mango, Passion Fruit, Watermelon and Strawberry (subject to availability).", es: "Pulpa de fruta batida con agua. Sabores: Piña con menta, Acerola, Coco, Mango, Maracuyá, Sandía y Fresa (consultar disponibilidad)." },
  "vitamina":           { en: "Thick, creamy fruit smoothie blended with banana or apple. 400ml.", es: "Batido espeso y cremoso de fruta con banana o manzana. 400ml." },
};

async function main() {
  // 1. Categories
  console.log("📂 Atualizando categorias...");
  const categories = await db.category.findMany({ where: { storeId: STORE_ID } });
  for (const cat of categories) {
    const t = CATEGORY_T[cat.slug];
    if (!t) { console.log(`  ⚠  ${cat.slug} não mapeado`); continue; }
    await db.category.update({ where: { id: cat.id }, data: { nameEn: t.en, nameEs: t.es } });
    console.log(`  ✔ ${cat.namePt}`);
  }

  // 2. Products
  console.log("\n🛍️  Atualizando produtos...");
  const products = await db.product.findMany({
    where: { storeId: STORE_ID },
    select: { id: true, slug: true, namePt: true },
  });

  let ok = 0, skipped = 0;
  for (const p of products) {
    const t = DESC_T[p.slug];
    if (!t) { console.log(`  ⚠  ${p.slug} sem tradução`); skipped++; continue; }
    await db.product.update({
      where: { id: p.id },
      data: {
        nameEn: p.namePt,  // name stays as Portuguese
        nameEs: p.namePt,
        descriptionEn: t.en,
        descriptionEs: t.es,
      },
    });
    console.log(`  ✔ ${p.namePt}`);
    ok++;
  }

  console.log(`\n🎉 Concluído! ${categories.length} categorias, ${ok} produtos traduzidos, ${skipped} sem tradução mapeada.`);
}

main()
  .catch(console.error)
  .finally(() => db.$disconnect());
