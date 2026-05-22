-- Run this SQL in the Supabase SQL Editor (Dashboard → SQL Editor → New query)
-- Creates user + 30-day trial subscription + demo store with categories & products
-- on every new Supabase Auth signup.

CREATE OR REPLACE FUNCTION public.handle_new_auth_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id     text;
  v_store_id    text;
  v_slug        text;
  v_plan_id     text;
  v_trial_until timestamptz;
  v_cat_cafes   text;
  v_cat_geladas text;
  v_cat_comes   text;
  v_cat_combos  text;
BEGIN

  -- ── 1. USER ──────────────────────────────────────────────────────────────
  v_user_id := gen_random_uuid()::text;

  INSERT INTO public.users (
    "id", "authId", "email", "name", "phone", "role", "createdAt", "updatedAt"
  )
  VALUES (
    v_user_id,
    NEW.id::text,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1)),
    NULLIF(TRIM(NEW.raw_user_meta_data->>'phone'), ''),
    'STORE_OWNER'::"UserRole",
    NOW(),
    NOW()
  )
  ON CONFLICT ("authId") DO NOTHING;

  -- Resolve the actual user id (handles rare re-trigger edge cases)
  SELECT id INTO v_user_id FROM public.users WHERE "authId" = NEW.id::text;
  IF v_user_id IS NULL THEN RETURN NEW; END IF;

  -- Skip if this user already has a store (avoid duplicates on re-runs)
  IF (SELECT COUNT(*) FROM public.stores WHERE "ownerId" = v_user_id) > 0 THEN
    RETURN NEW;
  END IF;

  -- ── 2. SUBSCRIPTION (trial 30 days) ──────────────────────────────────────
  SELECT id INTO v_plan_id FROM public.plans WHERE name = 'Starter' LIMIT 1;
  IF v_plan_id IS NOT NULL THEN
    v_trial_until := NOW() + INTERVAL '30 days';
    INSERT INTO public.subscriptions (
      "id", "userId", "planId", "status", "trialUntil", "createdAt", "updatedAt"
    )
    VALUES (
      gen_random_uuid()::text, v_user_id, v_plan_id,
      'TRIALING'::"PlanStatus", v_trial_until, NOW(), NOW()
    )
    ON CONFLICT DO NOTHING;
  END IF;

  -- ── 3. DEMO STORE ─────────────────────────────────────────────────────────
  v_store_id := gen_random_uuid()::text;
  v_slug := 'loja-' || substr(replace(gen_random_uuid()::text, '-', ''), 1, 8);

  INSERT INTO public.stores (
    "id", "ownerId", "slug",
    "namePt", "nameEn", "nameEs",
    "sloganPt", "sloganEn", "sloganEs",
    "primaryColor", "accentColor", "defaultLocale", "isActive",
    "causeTitlePt", "causeTitleEn",
    "causeTextPt",  "causeTextEn",
    "createdAt", "updatedAt"
  )
  VALUES (
    v_store_id, v_user_id, v_slug,
    'Minha Loja Demo', 'My Demo Store', 'Mi Tienda Demo',
    'Explore todas as funcionalidades', 'Explore all features', 'Explora todas las funcionalidades',
    '#3A1A00', '#E86A1A', 'pt', true,
    'Nosso Café tem Propósito', 'Our Coffee has a Purpose!',
    'Esta é uma loja de demonstração criada automaticamente. Explore o cardápio, faça pedidos de teste e personalize tudo nas configurações.',
    'This is an automatically created demo store. Explore the menu, place test orders, and customize everything in settings.',
    NOW(), NOW()
  );

  -- ── 4. CATEGORIES ─────────────────────────────────────────────────────────
  v_cat_cafes   := gen_random_uuid()::text;
  v_cat_geladas := gen_random_uuid()::text;
  v_cat_comes   := gen_random_uuid()::text;
  v_cat_combos  := gen_random_uuid()::text;

  INSERT INTO public.categories (
    "id", "storeId", "slug",
    "namePt", "nameEn", "nameEs",
    "iconEmoji", "area", "sortOrder", "isActive",
    "createdAt", "updatedAt"
  )
  VALUES
    (v_cat_cafes,   v_store_id, 'cafes-especiais', 'Cafés Especiais', 'Specialty Coffees', 'Cafés Especiales', '☕', 'HOT_DRINKS'::"ProductArea",  0, true, NOW(), NOW()),
    (v_cat_geladas, v_store_id, 'bebidas-geladas',  'Bebidas Geladas',  'Iced Drinks',        'Bebidas Frías',    '🧋', 'COLD_DRINKS'::"ProductArea", 1, true, NOW(), NOW()),
    (v_cat_comes,   v_store_id, 'comes',            'Comes',            'Food',               'Comidas',          '🥐', 'FOODS'::"ProductArea",       2, true, NOW(), NOW()),
    (v_cat_combos,  v_store_id, 'combos',           'Combos',           'Combos',             'Combos',           '🎁', 'COMBOS'::"ProductArea",      3, true, NOW(), NOW());

  -- ── 5. PRODUCTS ───────────────────────────────────────────────────────────
  INSERT INTO public.products (
    "id", "storeId", "categoryId", "slug",
    "namePt", "nameEn", "nameEs",
    "descriptionPt", "descriptionEn",
    "highlightPt",
    "imageUrl",
    "basePrice", "prepMinutes", "tags",
    "isAvailable", "sortOrder",
    "createdAt", "updatedAt"
  )
  VALUES
    -- Cafés Especiais
    (gen_random_uuid()::text, v_store_id, v_cat_cafes, 'espresso-duplo',
      'Espresso Duplo', 'Double Espresso', 'Espresso Doble',
      'Dois shots de espresso extraídos com grãos selecionados da região',
      'Two espresso shots from selected regional beans',
      'Clássico',
      'https://images.unsplash.com/photo-1510707577719-ae7c14805e3a?w=600&q=80',
      8.00, 3,
      ARRAY['POPULAR','FEATURED']::"ProductTag"[], true, 0, NOW(), NOW()),

    (gen_random_uuid()::text, v_store_id, v_cat_cafes, 'cappuccino-artesanal',
      'Cappuccino Artesanal', 'Artisan Cappuccino', 'Cappuccino Artesanal',
      'Espresso cremoso com leite vaporizado e espuma perfeita',
      'Creamy espresso with steamed milk and perfect foam',
      'O Favorito',
      'https://images.unsplash.com/photo-1572442388796-11668a67e53d?w=600&q=80',
      12.00, 5,
      ARRAY['POPULAR']::"ProductTag"[], true, 1, NOW(), NOW()),

    (gen_random_uuid()::text, v_store_id, v_cat_cafes, 'latte-especial',
      'Latte Especial', 'Special Latte', 'Latte Especial',
      'Espresso com leite vaporizado e arte latte',
      'Espresso with steamed milk and latte art',
      NULL,
      'https://images.unsplash.com/photo-1561047029-3000c68339ca?w=600&q=80',
      14.00, 6,
      ARRAY['FEATURED']::"ProductTag"[], true, 2, NOW(), NOW()),

    (gen_random_uuid()::text, v_store_id, v_cat_cafes, 'cafe-coado-especial',
      'Café Coado Especial', 'Pour Over Coffee', 'Café de Filtro Especial',
      'Grãos selecionados extraídos lentamente no método pour over',
      'Selected beans slowly extracted with pour over method',
      'Single Origin',
      'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=600&q=80',
      10.00, 8,
      ARRAY['SUGGESTED','NEW']::"ProductTag"[], true, 3, NOW(), NOW()),

    -- Bebidas Geladas
    (gen_random_uuid()::text, v_store_id, v_cat_geladas, 'cold-brew',
      'Cold Brew', 'Cold Brew', 'Cold Brew',
      'Café extraído a frio por 12 horas, suave e intenso',
      'Cold extracted for 12 hours, smooth and intense',
      'Exclusivo',
      'https://images.unsplash.com/photo-1461023058943-07fcbe16d735?w=600&q=80',
      15.00, 2,
      ARRAY['POPULAR','FEATURED']::"ProductTag"[], true, 0, NOW(), NOW()),

    (gen_random_uuid()::text, v_store_id, v_cat_geladas, 'iced-latte',
      'Iced Latte', 'Iced Latte', 'Iced Latte',
      'Espresso sobre gelo com leite gelado',
      'Espresso over ice with chilled milk',
      NULL,
      'https://images.unsplash.com/photo-1578314675249-a6910f80cc4e?w=600&q=80',
      13.00, 3,
      ARRAY['POPULAR']::"ProductTag"[], true, 1, NOW(), NOW()),

    (gen_random_uuid()::text, v_store_id, v_cat_geladas, 'frappuccino-caramelo',
      'Frappuccino Caramelo', 'Caramel Frappuccino', 'Frappuccino de Caramelo',
      'Bebida cremosa gelada com calda de caramelo',
      'Creamy iced drink with caramel syrup',
      'Irresistível',
      'https://images.unsplash.com/photo-1527156231393-7023794f363c?w=600&q=80',
      18.00, 5,
      ARRAY['SUGGESTED']::"ProductTag"[], true, 2, NOW(), NOW()),

    -- Comes
    (gen_random_uuid()::text, v_store_id, v_cat_comes, 'croissant-manteiga',
      'Croissant de Manteiga', 'Butter Croissant', 'Croissant de Mantequilla',
      'Croissant fresquinho assado no dia com manteiga artesanal',
      'Fresh daily-baked croissant with artisan butter',
      'Fresquinho',
      'https://images.unsplash.com/photo-1555507036-ab1f4038808a?w=600&q=80',
      9.00, 2,
      ARRAY['POPULAR']::"ProductTag"[], true, 0, NOW(), NOW()),

    (gen_random_uuid()::text, v_store_id, v_cat_comes, 'bolo-cenoura',
      'Bolo de Cenoura', 'Carrot Cake', 'Pastel de Zanahoria',
      'Bolo caseiro de cenoura com cobertura de chocolate',
      'Homemade carrot cake with chocolate frosting',
      'Caseiro',
      'https://images.unsplash.com/photo-1621303837174-89787a7d4729?w=600&q=80',
      7.00, 1,
      ARRAY['SUGGESTED']::"ProductTag"[], true, 1, NOW(), NOW()),

    (gen_random_uuid()::text, v_store_id, v_cat_comes, 'pao-queijo',
      'Pão de Queijo', 'Cheese Bread', 'Pan de Queso',
      'Pão de queijo mineiro, crocante por fora e macio por dentro',
      'Brazilian cheese bread, crispy outside and soft inside',
      'Mineiro',
      'https://images.unsplash.com/photo-1609167830220-7164aa360951?w=600&q=80',
      5.00, 2,
      ARRAY['POPULAR']::"ProductTag"[], true, 2, NOW(), NOW()),

    -- Combos
    (gen_random_uuid()::text, v_store_id, v_cat_combos, 'combo-manha',
      'Combo Manhã', 'Morning Combo', 'Combo Mañana',
      'Cappuccino Artesanal + Croissant de Manteiga',
      'Artisan Cappuccino + Butter Croissant',
      'Economia de R$5',
      'https://images.unsplash.com/photo-1509042239860-f550ce710b93?w=600&q=80',
      16.00, 6,
      ARRAY['COMBO','SUGGESTED']::"ProductTag"[], true, 0, NOW(), NOW()),

    (gen_random_uuid()::text, v_store_id, v_cat_combos, 'combo-tarde',
      'Combo Tarde', 'Afternoon Combo', 'Combo Tarde',
      'Cold Brew + Bolo de Cenoura',
      'Cold Brew + Carrot Cake',
      'Perfeito para 3h',
      'https://images.unsplash.com/photo-1541167760496-1628856ab772?w=600&q=80',
      19.00, 3,
      ARRAY['COMBO','FEATURED']::"ProductTag"[], true, 1, NOW(), NOW());

  RETURN NEW;
END;
$$;

-- Drop old trigger if exists (safe to re-run)
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_auth_user();
