import { PrismaClient, ProductArea } from "@prisma/client";
import path from "path";
import { config } from "dotenv";

config({ path: path.resolve(__dirname, "../.env") });

const db = new PrismaClient();
const STORE_ID = "d8823f40-be68-4b3f-81c0-deaaa2b54182"; // Café AT (owner: 45b1f403-6784-427d-a396-ea5d50369e6a)

function img(prompt: string, seed: number): string {
  const full = `professional food photography, ${prompt}, appetizing presentation, cafe atmosphere, warm natural lighting, high resolution, 4k`;
  return `https://image.pollinations.ai/prompt/${encodeURIComponent(full)}?width=800&height=533&nologo=true&seed=${seed}&model=flux`;
}

const CATEGORIES = [
  { slug: "salgados-fritos",    namePt: "Salgados Fritos",          area: ProductArea.SNACKS,     iconEmoji: "🔥", sortOrder: 0 },
  { slug: "salgados-assados",   namePt: "Salgados Assados",         area: ProductArea.SNACKS,     iconEmoji: "🥧", sortOrder: 1 },
  { slug: "lanches",            namePt: "Pão de Queijo & Lanches",  area: ProductArea.FOODS,      iconEmoji: "🧀", sortOrder: 2 },
  { slug: "croissants",         namePt: "Croissants",               area: ProductArea.FOODS,      iconEmoji: "🥐", sortOrder: 3 },
  { slug: "tapiocas",           namePt: "Tapiocas",                 area: ProductArea.FOODS,      iconEmoji: "🫓", sortOrder: 4 },
  { slug: "crepiocas",          namePt: "Crepiocas",                area: ProductArea.FOODS,      iconEmoji: "🥞", sortOrder: 5 },
  { slug: "sobremesas",         namePt: "Sobremesas",               area: ProductArea.DESSERTS,   iconEmoji: "🎂", sortOrder: 6 },
  { slug: "cafes-quentes",      namePt: "Cafés Quentes",            area: ProductArea.HOT_DRINKS, iconEmoji: "☕", sortOrder: 7 },
  { slug: "chocolates",         namePt: "Chocolates",               area: ProductArea.HOT_DRINKS, iconEmoji: "🍫", sortOrder: 8 },
  { slug: "cafes-gelados",      namePt: "Cafés Gelados",            area: ProductArea.COLD_DRINKS, iconEmoji: "🧊", sortOrder: 9 },
  { slug: "bebidas",            namePt: "Bebidas",                  area: ProductArea.COLD_DRINKS, iconEmoji: "🥤", sortOrder: 10 },
  { slug: "sucos",              namePt: "Sucos",                    area: ProductArea.COLD_DRINKS, iconEmoji: "🍊", sortOrder: 11 },
];

type ProductRow = {
  slug: string;
  namePt: string;
  descriptionPt: string;
  basePrice: number | null;
  imageUrl: string;
  sortOrder: number;
};

const PRODUCTS: Record<string, ProductRow[]> = {
  "salgados-fritos": [
    { slug: "coxinha-catupiri",     namePt: "Coxinha Catupiri",      descriptionPt: "Coxinha frita crocante recheada com catupiri cremoso.",                                     basePrice: 8,   imageUrl: img("Brazilian coxinha catupiri, golden fried snack, cream cheese filling, white plate",        101), sortOrder: 0 },
    { slug: "enrolado-salsicha",    namePt: "Enrolado de Salsicha",  descriptionPt: "Enrolado frito crocante com salsicha suculenta.",                                           basePrice: 8,   imageUrl: img("Brazilian fried sausage roll, crispy golden pastry, street food",                         102), sortOrder: 1 },
    { slug: "kibe",                 namePt: "Kibe",                  descriptionPt: "Kibe frito tradicional, crocante por fora e macio por dentro.",                             basePrice: 8,   imageUrl: img("Brazilian kibe fried, golden crispy kibbeh, white plate, street food snack",             103), sortOrder: 2 },
    { slug: "risole",               namePt: "Risole",                descriptionPt: "Risole frito crocante recheado com sabor especial.",                                        basePrice: 8,   imageUrl: img("Brazilian risole fried pastry, half-moon shaped, golden crispy, plate cafe",              104), sortOrder: 3 },
  ],
  "salgados-assados": [
    { slug: "esfiha-carne",           namePt: "Esfiha de Carne",        descriptionPt: "Esfiha assada recheada com carne bovina temperada.",                                   basePrice: 9,   imageUrl: img("Brazilian esfiha baked meat, golden pastry, tempting filling, bakery cafe",             201), sortOrder: 0 },
    { slug: "esfiha-presunto-queijo", namePt: "Esfiha Presunto e Queijo", descriptionPt: "Esfiha assada recheada com presunto e queijo derretido.",                            basePrice: 9,   imageUrl: img("Brazilian esfiha baked ham and cheese, golden pastry, melted cheese filling",           202), sortOrder: 1 },
    { slug: "empadao-frango",         namePt: "Empadão de Frango",      descriptionPt: "Empadão assado com recheio cremoso de frango.",                                        basePrice: 9,   imageUrl: img("Brazilian empadao chicken pie, golden baked crust, creamy filling, rustic cafe",        203), sortOrder: 2 },
    { slug: "empadinha-frango",       namePt: "Empadinha de Frango",    descriptionPt: "Mini empadinha assada recheada com frango temperado.",                                 basePrice: 8,   imageUrl: img("Brazilian mini chicken empanada baked, small pie, golden crust, cafe snack",            204), sortOrder: 3 },
    { slug: "empadinha-palmito",      namePt: "Empadinha de Palmito",   descriptionPt: "Mini empadinha assada recheada com palmito saboroso.",                                 basePrice: 8,   imageUrl: img("Brazilian mini palm heart empanada, small baked pie, golden pastry, cafe",              205), sortOrder: 4 },
  ],
  "lanches": [
    { slug: "pao-queijo-pequeno",   namePt: "Pão de Queijo Pequeno",   descriptionPt: "Preparado na Cafeteria AT com queijo de Minas, sabor original e único.",                basePrice: 2,   imageUrl: img("Brazilian small pao de queijo cheese bread, golden round, minas gerais, cafe plate",   301), sortOrder: 0 },
    { slug: "pao-queijo-grande",    namePt: "Pão de Queijo Grande",    descriptionPt: "Preparado na Cafeteria AT com queijo de Minas, garantindo o sabor original.",           basePrice: 3,   imageUrl: img("Brazilian large pao de queijo cheese bread, golden fluffy, minas gerais, cafe",        302), sortOrder: 1 },
    { slug: "misto-quente",         namePt: "Misto Quente",            descriptionPt: "Pão de forma tostado com presunto, queijo e orégano. Disponível com ou sem orégano.",   basePrice: 7,   imageUrl: img("Brazilian misto quente toasted sandwich, ham and cheese, oregano, cafe press",         303), sortOrder: 2 },
    { slug: "misto-quente-duplo",   namePt: "Misto Quente Duplo",      descriptionPt: "Versão dupla do misto quente com presunto, queijo e orégano. Com ou sem orégano.",      basePrice: 9,   imageUrl: img("Brazilian double misto quente sandwich, extra ham and cheese, toasted bread, cafe",    304), sortOrder: 3 },
  ],
  "croissants": [
    { slug: "croissant-bacon",             namePt: "Croissant Bacon",              descriptionPt: "Sanduíche saboroso de croissant com bacon, queijo e tomate.",                               basePrice: 18,  imageUrl: img("croissant sandwich bacon cheese tomato, flaky pastry, cafe plate, overhead",                 401), sortOrder: 0 },
    { slug: "croissant-bacon-egg",         namePt: "Croissant Bacon Egg",          descriptionPt: "Croissant com bacon, queijo, ovo frito, alface e tomate.",                                  basePrice: 20,  imageUrl: img("croissant sandwich bacon egg cheese lettuce tomato, flaky pastry, gourmet cafe",             402), sortOrder: 1 },
    { slug: "croissant-misto-quente",      namePt: "Croissant Misto Quente",       descriptionPt: "Croissant com presunto, queijo, tomate e orégano.",                                         basePrice: 16,  imageUrl: img("croissant sandwich ham cheese tomato oregano, golden flaky pastry, warm cafe",              403), sortOrder: 2 },
    { slug: "croissant-queijo-quente",     namePt: "Croissant Queijo Quente",      descriptionPt: "Croissant com queijo, requeijão, tomate e orégano.",                                        basePrice: 15,  imageUrl: img("croissant sandwich double cheese cream cheese tomato oregano, melted, flaky",               404), sortOrder: 3 },
    { slug: "croissant-simples",           namePt: "Croissant Simples",            descriptionPt: "Croissant simples e artesanal, crocante por fora e macio por dentro.",                     basePrice: 12,  imageUrl: img("simple butter croissant, golden flaky pastry, cafe table, minimalist",                      405), sortOrder: 4 },
    { slug: "croissant-crocante",          namePt: "Croissant Crocante",           descriptionPt: "Croissant recheado com Nutella e Ovomaltine irresistíveis.",                               basePrice: 18,  imageUrl: img("croissant filled nutella ovomaltine chocolate spread, flaky pastry, dessert cafe",          406), sortOrder: 5 },
    { slug: "croissant-doce-de-leite",     namePt: "Croissant Doce de Leite",      descriptionPt: "Croissant recheado com doce de leite cremoso e paçoca crocante.",                          basePrice: 15,  imageUrl: img("croissant dulce de leche pacoca peanut candy filling, Brazilian dessert, cafe",             407), sortOrder: 6 },
    { slug: "croissant-morango-nutella",   namePt: "Croissant Morango com Nutella", descriptionPt: "Croissant recheado com morangos frescos e Nutella.",                                       basePrice: 16,  imageUrl: img("croissant fresh strawberry nutella filling, dessert pastry, cafe plate, indulgent",        408), sortOrder: 7 },
    { slug: "croissant-romeu-julieta",     namePt: "Croissant Romeu e Julieta",    descriptionPt: "Croissant com goiabada e queijo, combinação clássica brasileira.",                         basePrice: 15,  imageUrl: img("croissant guava jam cream cheese romeu julieta, Brazilian dessert, cafe",                  409), sortOrder: 8 },
    { slug: "croissant-pistache",          namePt: "Croissant Pistache",           descriptionPt: "Croissant premium com pistache cremoso e castanhas.",                                       basePrice: 20,  imageUrl: img("croissant pistachio cream filling mixed nuts, premium dessert, elegant cafe plate",        410), sortOrder: 9 },
  ],
  "tapiocas": [
    { slug: "tapioca-americana",      namePt: "Tapioca Americana",        descriptionPt: "Tapioca recheada com ovo, bacon crocante e queijo derretido.",                          basePrice: 16,  imageUrl: img("Brazilian tapioca crepe filled egg bacon cheese, golden plate, cafe food photography",   501), sortOrder: 0 },
    { slug: "tapioca-misto-quente",   namePt: "Tapioca Misto Quente",     descriptionPt: "Tapioca com queijo, requeijão cremoso, tomate e orégano.",                              basePrice: 15,  imageUrl: img("Brazilian tapioca crepe ham cheese cream cheese tomato oregano, golden white",           502), sortOrder: 1 },
    { slug: "tapioca-crocante",       namePt: "Tapioca Crocante",         descriptionPt: "Tapioca recheada com Nutella e Ovomaltine, irresistível.",                              basePrice: 18,  imageUrl: img("Brazilian tapioca crepe nutella ovomaltine chocolate, dessert sweet, cafe",              503), sortOrder: 2 },
    { slug: "tapioca-desejo",         namePt: "Tapioca Desejo",           descriptionPt: "Tapioca com morangos frescos e leite condensado.",                                      basePrice: 15,  imageUrl: img("Brazilian tapioca crepe fresh strawberry condensed milk sweet dessert, cafe",            504), sortOrder: 3 },
    { slug: "tapioca-mineira",        namePt: "Tapioca Mineira",          descriptionPt: "Tapioca com banana caramelizada e doce de leite.",                                      basePrice: 12,  imageUrl: img("Brazilian tapioca crepe banana dulce de leche caramel, sweet mineira, cafe",            505), sortOrder: 4 },
    { slug: "tapioca-moca",           namePt: "Tapioca Moça",             descriptionPt: "Tapioca com leite condensado e queijo, combinação perfeita.",                           basePrice: 13,  imageUrl: img("Brazilian tapioca crepe condensed milk cheese sweet salty, golden, cafe plate",        506), sortOrder: 5 },
    { slug: "tapioca-pecado",         namePt: "Tapioca Pecado",           descriptionPt: "Tapioca com morangos frescos e Nutella, pecado irresistível.",                          basePrice: 18,  imageUrl: img("Brazilian tapioca crepe fresh strawberry nutella indulgent dessert, cafe",              507), sortOrder: 6 },
  ],
  "crepiocas": [
    { slug: "crepioca-simples",       namePt: "Crepioca Simples",         descriptionPt: "Crepe de tapioca com ovos e crosta de queijo. Recheio de queijo e presunto.",           basePrice: 12,  imageUrl: img("Brazilian crepioca tapioca crepe egg cheese ham, healthy golden crepe, cafe plate",     601), sortOrder: 0 },
    { slug: "crepioca-americana",     namePt: "Crepioca Americana",       descriptionPt: "Crepioca com ovo, bacon crocante e queijo derretido.",                                  basePrice: 16,  imageUrl: img("Brazilian crepioca tapioca egg crepe bacon cheese filling, golden plate, cafe",        602), sortOrder: 1 },
    { slug: "crepioca-misto-quente",  namePt: "Crepioca Misto Quente",    descriptionPt: "Crepioca com presunto, queijo, tomate fresco e orégano.",                               basePrice: 14,  imageUrl: img("Brazilian crepioca tapioca crepe ham cheese tomato oregano, warm breakfast cafe",      603), sortOrder: 2 },
    { slug: "crepioca-queijo-quente", namePt: "Crepioca Queijo Quente",   descriptionPt: "Crepioca com queijo, requeijão cremoso, tomate e orégano.",                             basePrice: 13,  imageUrl: img("Brazilian crepioca tapioca crepe double cheese cream cheese tomato, golden plate",     604), sortOrder: 3 },
  ],
  "sobremesas": [
    { slug: "bolo-caseiro",   namePt: "Bolo Caseiro (fatia)",   descriptionPt: "Fatia de bolo artesanal. Sabores: Chocolate com Ninho, Cenoura com Chocolate ou Limão com Raspas.",  basePrice: 10, imageUrl: img("Brazilian homemade cake slice chocolate ninho, carrot cake, lemon zest, rustic cafe plate",  701), sortOrder: 0 },
  ],
  "cafes-quentes": [
    { slug: "espresso-pequeno",       namePt: "Espresso Pequeno 50ml",      descriptionPt: "Grãos 100% Arábica, encorpado com aroma de chocolate. 1 shot, 50ml.",                    basePrice: 5,   imageUrl: img("espresso short black coffee, small white cup, dark roast crema, coffee bar, closeup",   801), sortOrder: 0 },
    { slug: "espresso-grande",        namePt: "Espresso Grande 180ml",      descriptionPt: "Grãos 100% Arábica, encorpado com aroma de chocolate. 180ml.",                            basePrice: 10,  imageUrl: img("large espresso double shot black coffee white cup, coffee bar, crema, warmth",         802), sortOrder: 1 },
    { slug: "canelinha",              namePt: "Canelinha",                  descriptionPt: "Café espresso servido com canela em pó, aroma e sabor inigualáveis.",                      basePrice: 5.5, imageUrl: img("espresso with cinnamon powder, small cup, cozy cafe, warm autumn tones, aromatic",     803), sortOrder: 2 },
    { slug: "espresso-com-leite",     namePt: "Espresso com Leite",         descriptionPt: "01 shot de café espresso com leite vaporizado cremoso.",                                   basePrice: 6,   imageUrl: img("espresso with steamed milk small cup, cortado style, coffee art, cafe bar",           804), sortOrder: 3 },
    { slug: "machiato",               namePt: "Machiato",                   descriptionPt: "Café espresso com espuma de leite suave por cima.",                                        basePrice: 6,   imageUrl: img("macchiato espresso milk foam small glass cup, coffee bar elegant, closeup",            805), sortOrder: 4 },
    { slug: "machiato-duplo",         namePt: "Machiato Duplo",             descriptionPt: "02 shots de café espresso com espuma de leite.",                                           basePrice: 8,   imageUrl: img("double macchiato two espresso shots milk foam glass, coffee bar, bold",               806), sortOrder: 5 },
    { slug: "cafe-coado",             namePt: "Café Coado",                 descriptionPt: "Café coado da casa, saboroso e reconfortante.",                                            basePrice: 4,   imageUrl: img("Brazilian filtered drip coffee cup, simple coado, warm mug, rustic cafe table",       807), sortOrder: 6 },
    { slug: "french-press",           namePt: "French Press 295ml",         descriptionPt: "Método de infusão e filtragem por pressão. Bebida encorpada e aromática. 295ml.",          basePrice: 15,  imageUrl: img("french press coffee 295ml glass plunger, dark rich brew, wooden table, cafe",         808), sortOrder: 7 },
    { slug: "hario-v60",              namePt: "Hario V60 180ml",            descriptionPt: "Método com filtro de papel, bebida equilibrada. Grãos acima de 80 pontos. 180ml.",         basePrice: 10,  imageUrl: img("hario v60 pour over coffee dripper, specialty coffee, black cup, minimalist cafe",    809), sortOrder: 8 },
    { slug: "cha-quente",             namePt: "Chá 180ml",                  descriptionPt: "Chá quente em xícara. Sabores: Maçã verde, Pêssego, Limão e Frutas vermelhas.",            basePrice: 6,   imageUrl: img("hot tea cup 180ml, fruit tea red berries green apple, elegant white cup, cafe",       810), sortOrder: 9 },
    { slug: "cappuccino-chocolate-belga", namePt: "Cappuccino Chocolate Belga", descriptionPt: "Clássico italiano com café espresso, chocolate belga, leite vaporizado e canela.",  basePrice: 10,  imageUrl: img("cappuccino with Belgian chocolate powder, classic italian coffee, cafe cup, art",      811), sortOrder: 10 },
    { slug: "cappuccino-chantilly",   namePt: "Cappuccino Chantilly",       descriptionPt: "Café espresso com chantilly cremoso e canela em pó.",                                      basePrice: 12,  imageUrl: img("cappuccino with whipped cream chantilly cinnamon powder, indulgent cafe coffee",       812), sortOrder: 11 },
    { slug: "caramelow",              namePt: "Caramelow",                  descriptionPt: "Café espresso com espuma de leite cremosa e calda de caramelo.",                           basePrice: 10,  imageUrl: img("espresso macchiato caramel sauce milk foam glass, sweet coffee drink, cafe bar",       813), sortOrder: 12 },
    { slug: "mocha",                  namePt: "Mocha",                      descriptionPt: "Café espresso com leite vaporizado. Sabores: Chocolate, Caramelo ou Leite Condensado. 180ml.", basePrice: 14, imageUrl: img("mocha latte hot coffee chocolate sauce whipped cream, tall glass cafe, indulgent",  814), sortOrder: 13 },
    { slug: "ovomaltine-leite-condensado", namePt: "Ovomaltine c/ Leite Condensado", descriptionPt: "Bebida quente cremosa com Ovomaltine e leite condensado.",                     basePrice: 16,  imageUrl: img("hot ovomaltine drink condensed milk cream, Brazilian cafe beverage, mug, warm",        815), sortOrder: 14 },
  ],
  "chocolates": [
    { slug: "chocolate-quente",   namePt: "Chocolate Quente",     descriptionPt: "Chocolate 50% cacau preparado com leite integral, intenso e cremoso.",                              basePrice: 10,  imageUrl: img("hot chocolate 50% cacao milk, dark rich creamy mug, cafe, winter warmth",             901), sortOrder: 0 },
    { slug: "chocolate-gelado",   namePt: "Chocolate Gelado",     descriptionPt: "Shake geladinho de chocolate com Ovomaltine, canela e chantilly. 295ml.",                          basePrice: 15,  imageUrl: img("cold chocolate ovomaltine shake whipped cream cinnamon glass 295ml, cafe drink",      902), sortOrder: 1 },
    { slug: "choco-max-nutella",  namePt: "Choco Max Nutella",    descriptionPt: "Taça de chocolate gelado com borda de Nutella, calda de chocolate e chantilly. 400ml.",            basePrice: 20,  imageUrl: img("chocolate dessert drink nutella rim whipped cream syrup 400ml glass, indulgent cafe", 903), sortOrder: 2 },
  ],
  "cafes-gelados": [
    { slug: "coffee-caramelo",      namePt: "Coffee Caramelo",          descriptionPt: "Café espresso sobre gelo com leite vaporizado e caramelo. Opções: salgado ou baunilha.",       basePrice: 12,  imageUrl: img("iced coffee espresso caramel syrup milk over ice glass tall, cafe cold drink",          1001), sortOrder: 0 },
    { slug: "coffee-shake-oreo",    namePt: "Coffee Shake Oreo",        descriptionPt: "Shake com bolacha Oreo, leite, mousse de café solúvel e chantilly.",                            basePrice: 18,  imageUrl: img("oreo coffee milkshake whipped cream cookies blended, tall glass cafe dessert drink",    1002), sortOrder: 1 },
    { slug: "afogatto",             namePt: "Afogatto",                  descriptionPt: "Sorvete de creme imerso em um shot duplo de café espresso quente.",                             basePrice: 13,  imageUrl: img("affogato espresso poured over vanilla ice cream, Italian dessert, elegant glass",       1003), sortOrder: 2 },
    { slug: "cappuccino-ice",       namePt: "Cappuccino Ice",            descriptionPt: "Versão gelada e refrescante do cappuccino com chantilly, calda de chocolate e canela.",        basePrice: 15,  imageUrl: img("iced cappuccino cold coffee whipped cream chocolate syrup cinnamon, tall glass cafe",   1004), sortOrder: 3 },
    { slug: "cha-batido",           namePt: "Chá Batido 400ml",          descriptionPt: "Chá gelado batido. Sabores: Maçã verde, Limão, Pêssego e Frutas vermelhas. 400ml.",           basePrice: 8,   imageUrl: img("iced fruit tea blended cold drink glass 400ml berries apple lemon, colorful cafe",      1005), sortOrder: 4 },
    { slug: "limonada-suica",       namePt: "Limonada Suíça",            descriptionPt: "Limonada cremosa com leite condensado. 400ml.",                                                basePrice: 12,  imageUrl: img("Swiss limonada creamy lemonade condensed milk blended, Brazilian drink, tall glass",    1006), sortOrder: 5 },
    { slug: "soda",                 namePt: "Soda",                      descriptionPt: "Sodas artesanais. Sabores: Limão Siciliano, Maçã Verde, Blue Lemonade, Pink Lemonade, Chá Mate Tostado, Framboesa, Tangerina e Gengibre.", basePrice: 11, imageUrl: img("artisan soda drink colorful sparkling lemon pink blue, tall glass ice cafe bar",          1007), sortOrder: 6 },
    { slug: "milkshake",            namePt: "Milkshake 400ml",           descriptionPt: "Milkshake cremoso. Sabores: Morango, Creme, Chocolate ou Ovomaltine. 400ml.",                  basePrice: 16,  imageUrl: img("thick creamy milkshake strawberry chocolate whipped cream tall glass, diner cafe",      1008), sortOrder: 7 },
    { slug: "frape",                namePt: "Frapê 400ml",               descriptionPt: "Frapê gelado e cremoso. Sabores: Café, Morango ou Chocolate. 400ml.",                          basePrice: 15,  imageUrl: img("frappe blended iced coffee strawberry chocolate, creamy frothy glass 400ml, cafe",      1009), sortOrder: 8 },
  ],
  "bebidas": [
    { slug: "refrigerante-mini",    namePt: "Refrigerante Mini",        descriptionPt: "Refrigerante mini gelado.",                                                                    basePrice: 3,   imageUrl: img("mini small soda bottle cold drink chilled, cafe counter, refreshing",                  1101), sortOrder: 0 },
    { slug: "refrigerante-lata",    namePt: "Refrigerante Lata",        descriptionPt: "Refrigerante em lata gelado.",                                                                 basePrice: 6,   imageUrl: img("soda can cold drink chilled ice, cafe refreshment, clean background",                  1102), sortOrder: 1 },
    { slug: "coca-cola-ks",         namePt: "Coca-Cola KS",             descriptionPt: "Coca-Cola KS gelada.",                                                                         basePrice: 6.5, imageUrl: img("coca cola king size bottle cold, restaurant cafe, iconic red drink",                   1103), sortOrder: 2 },
    { slug: "coca-cola-2l",         namePt: "Coca-Cola 2 litros",       descriptionPt: "Coca-Cola 2 litros.",                                                                          basePrice: 14,  imageUrl: img("coca cola 2 liter bottle, family size cold soda, restaurant",                         1104), sortOrder: 3 },
    { slug: "pepsi-fanta-2l",       namePt: "Pepsi ou Fanta 2 litros",  descriptionPt: "Pepsi ou Fanta em garrafa 2 litros.",                                                          basePrice: 12,  imageUrl: img("pepsi fanta 2 liter soda bottle, cold refreshment, colorful",                         1105), sortOrder: 4 },
    { slug: "cha-mate-gas",         namePt: "Chá Mate com Gás",         descriptionPt: "Chá Mate com gás gelado.",                                                                     basePrice: 7,   imageUrl: img("mate tea sparkling can, Brazilian cha mate gas, green can cold drink cafe",            1106), sortOrder: 5 },
    { slug: "del-valle-lata",       namePt: "Del Valle Lata",           descriptionPt: "Suco Del Valle em lata.",                                                                      basePrice: 6.5, imageUrl: img("Del Valle juice can cold drink, fruit juice lata, Brazilian cafe",                    1107), sortOrder: 6 },
    { slug: "del-valle-garrafa",    namePt: "Del Valle Garrafa",        descriptionPt: "Suco Del Valle em garrafa.",                                                                   basePrice: 6,   imageUrl: img("Del Valle juice bottle cold fruit drink, Brazilian cafe beverage",                    1108), sortOrder: 7 },
    { slug: "kapo",                 namePt: "Kapo",                     descriptionPt: "Suco Kapo em caixinha.",                                                                       basePrice: 4.5, imageUrl: img("Kapo juice box drink, Brazilian children juice box, colorful cafe",                  1109), sortOrder: 8 },
    { slug: "suco-caixinha",        namePt: "Suco Caixinha",            descriptionPt: "Suco em caixinha.",                                                                            basePrice: 4,   imageUrl: img("juice box small pack drink, colorful fruit juice box, Brazilian cafe",               1110), sortOrder: 9 },
    { slug: "achocolatado",         namePt: "Achocolatado",             descriptionPt: "Achocolatado gelado.",                                                                         basePrice: 2.5, imageUrl: img("chocolate milk drink box achocolatado, cold chilled, Brazilian cafe",                1111), sortOrder: 10 },
    { slug: "suco-lata-gas",        namePt: "Suco Lata com Gás",        descriptionPt: "Suco gaseificado em lata.",                                                                    basePrice: 7.5, imageUrl: img("sparkling fruit juice can, carbonated juice drink cold, colorful cafe",              1112), sortOrder: 11 },
    { slug: "gatorade",             namePt: "Gatorade",                 descriptionPt: "Isotônico Gatorade gelado.",                                                                   basePrice: 7.5, imageUrl: img("Gatorade sports drink bottle, isotonic cold, colorful sport drink cafe",            1113), sortOrder: 12 },
    { slug: "monster",              namePt: "Monster",                  descriptionPt: "Energético Monster.",                                                                          basePrice: 12,  imageUrl: img("Monster energy drink can, green black, cold energy drink cafe bar",                  1114), sortOrder: 13 },
    { slug: "red-bull",             namePt: "Red Bull",                 descriptionPt: "Energético Red Bull.",                                                                         basePrice: 11,  imageUrl: img("Red Bull energy drink can, silver blue, cold refreshing cafe",                      1115), sortOrder: 14 },
    { slug: "baly",                 namePt: "Baly",                     descriptionPt: "Energético Baly.",                                                                             basePrice: 9,   imageUrl: img("Baly energy drink can, Brazilian energy drink, cold cafe bar",                      1116), sortOrder: 15 },
    { slug: "furioso",              namePt: "Furioso",                  descriptionPt: "Energético Furioso.",                                                                          basePrice: 4.5, imageUrl: img("Furioso energy drink small can, affordable energy, cold cafe counter",               1117), sortOrder: 16 },
    { slug: "cha-mate-copo",        namePt: "Chá Mate Copo",            descriptionPt: "Chá Mate gelado no copo.",                                                                     basePrice: 4.5, imageUrl: img("mate tea cold cup glass iced, Brazilian cha mate, refreshing cafe drink",            1118), sortOrder: 17 },
    { slug: "mini-cini",            namePt: "Mini Cini",                descriptionPt: "Mini Cini gelado.",                                                                            basePrice: 2,   imageUrl: img("mini cini small chocolate drink, Brazilian youth drink, small cup cafe",             1119), sortOrder: 18 },
    { slug: "cini-mix",             namePt: "Cini Mix",                 descriptionPt: "Cini Mix.",                                                                                    basePrice: 3.5, imageUrl: img("cini mix chocolate drink box, Brazilian sweet drink, colorful cafe",                1120), sortOrder: 19 },
    { slug: "agua-mineral",         namePt: "Água Mineral",             descriptionPt: "Água mineral com ou sem gás.",                                                                 basePrice: 2.5, imageUrl: img("mineral water bottle cold clear, still sparkling water, clean cafe table",           1121), sortOrder: 20 },
    { slug: "agua-saborizada",      namePt: "Água Saborizada",          descriptionPt: "Água saborizada gelada.",                                                                      basePrice: 4.5, imageUrl: img("flavored water bottle colorful, fruit infused cold water drink, cafe",              1122), sortOrder: 21 },
  ],
  "sucos": [
    { slug: "suco-natural",        namePt: "Suco Natural 400ml",        descriptionPt: "Sucos naturais frescos 400ml. Sabores: Laranja, Abacaxi, Limão, Morango, Mamão, Melão e Melancia.", basePrice: 10,  imageUrl: img("fresh natural fruit juice 400ml orange strawberry watermelon, tall glass, bright cafe",  1201), sortOrder: 0 },
    { slug: "polpa-fruta-batida",  namePt: "Polpa de Fruta Batida",     descriptionPt: "Polpa de fruta batida com água. Sabores: Abacaxi com hortelã, Acerola, Coco, Manga, Maracujá, Melancia e Morango.", basePrice: 10, imageUrl: img("tropical fruit pulp blended with water, mango passion fruit coconut, Brazilian juice",   1202), sortOrder: 1 },
    { slug: "vitamina",            namePt: "Vitamina 400ml",            descriptionPt: "Vitamina cremosa batida com banana ou maçã. 400ml.",                                         basePrice: 16,  imageUrl: img("Brazilian vitamina thick creamy fruit smoothie banana apple 400ml, healthy cafe drink",  1203), sortOrder: 2 },
  ],
};

async function main() {
  console.log("🗑️  Removendo produtos e categorias existentes da loja...");
  await db.product.deleteMany({ where: { storeId: STORE_ID } });
  await db.category.deleteMany({ where: { storeId: STORE_ID } });
  console.log("✅ Limpeza concluída.");

  console.log("📂 Criando categorias...");
  const categoryMap: Record<string, string> = {};

  for (const cat of CATEGORIES) {
    const created = await db.category.create({
      data: {
        storeId: STORE_ID,
        slug: cat.slug,
        namePt: cat.namePt,
        area: cat.area,
        iconEmoji: cat.iconEmoji,
        sortOrder: cat.sortOrder,
        isActive: true,
      },
    });
    categoryMap[cat.slug] = created.id;
    console.log(`  ✔ ${cat.namePt}`);
  }

  console.log("\n🛍️  Criando produtos...");
  let total = 0;

  for (const [catSlug, products] of Object.entries(PRODUCTS)) {
    const categoryId = categoryMap[catSlug];
    for (const p of products) {
      await db.product.create({
        data: {
          storeId: STORE_ID,
          categoryId,
          slug: p.slug,
          namePt: p.namePt,
          descriptionPt: p.descriptionPt,
          basePrice: p.basePrice,
          imageUrl: p.imageUrl,
          sortOrder: p.sortOrder,
          isAvailable: true,
          tags: [],
        },
      });
      total++;
      process.stdout.write(`  ✔ ${p.namePt}\n`);
    }
  }

  console.log(`\n🎉 Concluído! ${CATEGORIES.length} categorias e ${total} produtos criados.`);
}

main()
  .catch(console.error)
  .finally(() => db.$disconnect());
