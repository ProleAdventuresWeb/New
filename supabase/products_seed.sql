-- ================================================================
-- Prole Adventures - Products & Variants Seed Data
-- ================================================================
-- This script properly inserts your data into the normalized 
-- shop_schema.sql tables: `products` and `product_variants`.
-- ================================================================

-- 1. Add a JSONB images array to products if it doesn't exist
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS images JSONB DEFAULT '[]'::jsonb;

-- 2. Clear out any old products/variants safely (optional, but ensures clean slate)
-- TRUNCATE TABLE public.products CASCADE;

-- 3. Upsert Products
INSERT INTO public.products (slug, name, description, category, base_price_pence, currency, active, image_url, images) VALUES

-- ── APPAREL ──────────────────────────────────────────────────────
('trespassing-prole-tshirt', 'Trespassing Prole t-shirt', 'Clandestine cotton apparel for temperate trespassing and adventures.', 'Apparel', 2000, 'gbp', true, 
  '/images/products/trespassing-prole-tshirt/trespassing-prole-tshirt_1.webp',
  '["/images/products/trespassing-prole-tshirt/trespassing-prole-tshirt_1.webp", "/images/products/trespassing-prole-tshirt/trespassing-prole-tshirt_2.webp", "/images/products/trespassing-prole-tshirt/trespassing-prole-tshirt_3.webp"]'::jsonb),

('trespassing-tshirt', 'Trespassing t-shirt', 'Trespassing is a civil matter so it helps to look civilised in this smart shirt.', 'Apparel', 2000, 'gbp', true, 
  '/images/products/trespassing-tshirt/trespassing-tshirt_1.webp',
  '["/images/products/trespassing-tshirt/trespassing-tshirt_1.webp", "/images/products/trespassing-tshirt/trespassing-tshirt_2.webp", "/images/products/trespassing-tshirt/trespassing-tshirt_3.webp"]'::jsonb),

('binbag-adventures-tshirt', 'Binbag Adventures t-shirt', 'The "Binbag" Tee is designed to ensure you''re seen by the right people . Featuring the black on black "binbag" aesthetic in a high-quality, heavy-weight black cotton construction.', 'Apparel', 2000, 'gbp', true, 
  '/images/products/binbag-adventures-tshirt/binbag-adventures-tshirt_1.webp',
  '["/images/products/binbag-adventures-tshirt/binbag-adventures-tshirt_1.webp", "/images/products/binbag-adventures-tshirt/binbag-adventures-tshirt_2.webp", "/images/products/binbag-adventures-tshirt/binbag-adventures-tshirt_3.webp"]'::jsonb),

('binliner-adventures', 'Binliner Adventures', 'The Binliner Adventures tee. For the urban explorer who doesn''t care if they are seen.', 'Apparel', 2000, 'gbp', true, 
  '/images/products/binliner-adventures/binliner-adventures_1.webp',
  '["/images/products/binliner-adventures/binliner-adventures_1.webp", "/images/products/binliner-adventures/binliner-adventures_2.webp", "/images/products/binliner-adventures/binliner-adventures_3.webp"]'::jsonb),

('trespassing-prole-hoodie', 'Trespassing Prole Hoodie', 'When you absolutely must go trespassing, you need all the stealth you can get. Heavyweight, comfortable, and optimized for low light environments.', 'Apparel', 3500, 'gbp', true, 
  '/images/products/trespassing-prole-hoodie/trespassing-prole-hoodie_1.webp',
  '["/images/products/trespassing-prole-hoodie/trespassing-prole-hoodie_1.webp", "/images/products/trespassing-prole-hoodie/trespassing-prole-hoodie_2.webp", "/images/products/trespassing-prole-hoodie/trespassing-prole-hoodie_3.webp"]'::jsonb),

('binbag-prole-hoodie', 'Binbag Prole Hoodie', 'The Binbag Prole hoodie. Pull it on and let everyone know, you don''t care what they think.', 'Apparel', 3500, 'gbp', true, 
  '/images/products/binbag-prole-hoodie/binbag-prole-hoodie_1.webp',
  '["/images/products/binbag-prole-hoodie/binbag-prole-hoodie_1.webp", "/images/products/binbag-prole-hoodie/binbag-prole-hoodie_2.webp", "/images/products/binbag-prole-hoodie/binbag-prole-hoodie_3.webp"]'::jsonb),

('binbag-adventures-hoodie', 'Binbag Adventures Hoodie', 'High-performance urban stealth hoodie. Engineered for the modern Prole, featuring a heavyweight black cotton blend designed for durability and comfort in the field.', 'Apparel', 3500, 'gbp', true, 
  '/images/products/binbag-adventures-hoodie/binbag-adventures-hoodie_1.webp',
  '["/images/products/binbag-adventures-hoodie/binbag-adventures-hoodie_1.webp", "/images/products/binbag-adventures-hoodie/binbag-adventures-hoodie_2.webp", "/images/products/binbag-adventures-hoodie/binbag-adventures-hoodie_3.webp"]'::jsonb),

-- ── ACCESSORIES ───────────────────────────────────────────────────
('tinny-mug', 'Tinny Mug', 'The classic mission ready enamel mug. Lightweight, durable and ready for action. Perfect for your morning caffeine or late night brew.', 'Accessories', 1600, 'gbp', true, 
  '/images/products/tinny-mug/tinny-mug_1.webp',
  '["/images/products/tinny-mug/tinny-mug_1.webp", "/images/products/tinny-mug/tinny-mug_2.webp", "/images/products/tinny-mug/tinny-mug_3.webp"]'::jsonb),

('big-black-cup', 'Big Black Cup', 'When you need a stiff drink, reach for The Prole Adventure Big Black Cup. Sleek, glossy, and substantial.', 'Accessories', 1500, 'gbp', true, 
  '/images/products/big-black-cup/big-black-cup_1.webp',
  '["/images/products/big-black-cup/big-black-cup_1.webp", "/images/products/big-black-cup/big-black-cup_2.webp", "/images/products/big-black-cup/big-black-cup_3.webp"]'::jsonb),

('big-black-mug', 'Big Black Mug', 'A big, bold black ceramic cup. Prole Adventures branded. Made for strong tea and stronger people', 'Accessories', 1500, 'gbp', true, 
  '/images/products/big-black-mug/big-black-mug_1.webp',
  '["/images/products/big-black-mug/big-black-mug_1.webp", "/images/products/big-black-mug/big-black-mug_2.webp", "/images/products/big-black-mug/big-black-mug_3.webp"]'::jsonb),

('whitey-mug', 'Whitey mug', 'A smaller ceramic mug for those who already discovered their limits', 'Accessories', 1200, 'gbp', true, 
  '/images/products/whitey-mug/whitey-mug_1.webp',
  '["/images/products/whitey-mug/whitey-mug_1.webp", "/images/products/whitey-mug/whitey-mug_2.webp", "/images/products/whitey-mug/whitey-mug_3.webp"]'::jsonb),

('huge-whitey', 'Huge Whitey', 'Bigger than a Sports Direct Mug. Perfect for when you''re welded to the sofa', 'Accessories', 1050, 'gbp', true, 
  '/images/products/huge-whitey/huge-whitey_1.webp',
  '["/images/products/huge-whitey/huge-whitey_1.webp", "/images/products/huge-whitey/huge-whitey_2.webp", "/images/products/huge-whitey/huge-whitey_3.webp"]'::jsonb),

('black-hole-mug', 'Black Hole Mug', 'The Black Hole Mug. Pour tea inside and watch as it disappears.', 'Accessories', 1500, 'gbp', true, 
  '/images/products/black-hole-mug/black-hole-mug_1.webp',
  '["/images/products/black-hole-mug/black-hole-mug_1.webp", "/images/products/black-hole-mug/black-hole-mug_2.webp", "/images/products/black-hole-mug/black-hole-mug_3.webp"]'::jsonb),

('prole-patch', 'Prole Patch', 'The original Prole Adventures patch. Sticks to anything with velcro', 'Accessories', 1350, 'gbp', true, 
  '/images/products/prole-patch/prole-patch_1.webp',
  '["/images/products/prole-patch/prole-patch_1.webp"]'::jsonb),

('prole-binbag-patch', 'Prole Binbag Patch', 'Prole Binbag patch. Stick it on a jacket, a bag, wherever you have velcro', 'Accessories', 1350, 'gbp', true, 
  '/images/products/prole-binbag-patch/prole-binbag-patch_1.webp',
  '["/images/products/prole-binbag-patch/prole-binbag-patch_1.webp"]'::jsonb),

('prole-cap', 'Prole Cap', 'The Prole cap. It''s a cap, it says Prole on it.', 'Accessories', 2500, 'gbp', true, 
  '/images/products/prole-cap/prole-cap_1.webp',
  '["/images/products/prole-cap/prole-cap_1.webp", "/images/products/prole-cap/prole-cap_2.webp", "/images/products/prole-cap/prole-cap_3.webp", "/images/products/prole-cap/prole-cap_4.webp", "/images/products/prole-cap/prole-cap_5.webp"]'::jsonb),

('vintage-prole-cap', 'Vintage Prole Cap', 'One for the old heads, the ones who already know.', 'Accessories', 2500, 'gbp', true, 
  '/images/products/vintage-prole-cap/vintage-prole-cap_1.webp',
  '["/images/products/vintage-prole-cap/vintage-prole-cap_1.webp", "/images/products/vintage-prole-cap/vintage-prole-cap_2.webp", "/images/products/vintage-prole-cap/vintage-prole-cap_3.webp", "/images/products/vintage-prole-cap/vintage-prole-cap_4.webp", "/images/products/vintage-prole-cap/vintage-prole-cap_5.webp"]'::jsonb)

ON CONFLICT (slug) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  category = EXCLUDED.category,
  base_price_pence = EXCLUDED.base_price_pence,
  image_url = EXCLUDED.image_url,
  images = EXCLUDED.images,
  active = EXCLUDED.active;


-- 4. Upsert Product Variants (maps to printful_variant_id)
-- We insert standard SKUs based on slug + variant name

DO $$ 
DECLARE
  v_prod record;
BEGIN
  -- trespassing-prole-tshirt
  SELECT id INTO v_prod FROM public.products WHERE slug = 'trespassing-prole-tshirt';
  IF FOUND THEN
    INSERT INTO public.product_variants (product_id, sku, name, price_override_pence, printful_variant_id) VALUES
    (v_prod.id, 'trespassing-prole-tshirt-1', 'Black Heather / XS', 2000, '69f4c3fcf1dee6'),
    (v_prod.id, 'trespassing-prole-tshirt-2', 'Black Heather / S', 2000, '69f4c3fcf1df55'),
    (v_prod.id, 'trespassing-prole-tshirt-3', 'Black Heather / M', 2000, '69f4c3fcf1dfa9'),
    (v_prod.id, 'trespassing-prole-tshirt-4', 'Black Heather / L', 2000, '69f4c3fcf1dff5'),
    (v_prod.id, 'trespassing-prole-tshirt-5', 'Black Heather / XL', 2000, '69f4c3fcf1e036'),
    (v_prod.id, 'trespassing-prole-tshirt-6', 'Black Heather / 2XL', 2000, '69f4c3fcf1e087'),
    (v_prod.id, 'trespassing-prole-tshirt-7', 'Black Heather / 3XL', 3000, '69f4c3fcf1e0d1'),
    (v_prod.id, 'trespassing-prole-tshirt-8', 'Black Heather / 4XL', 3000, '69f4c3fcf1e115'),
    (v_prod.id, 'trespassing-prole-tshirt-9', 'Black Heather / 5XL', 3050, '69f4c3fcf1e158')
    ON CONFLICT (sku) DO UPDATE SET price_override_pence = EXCLUDED.price_override_pence, printful_variant_id = EXCLUDED.printful_variant_id;
  END IF;

  -- trespassing-tshirt
  SELECT id INTO v_prod FROM public.products WHERE slug = 'trespassing-tshirt';
  IF FOUND THEN
    INSERT INTO public.product_variants (product_id, sku, name, price_override_pence, printful_variant_id) VALUES
    (v_prod.id, 'trespassing-tshirt-1', 'Black Heather / XS', 2000, '69f4c26b4638e7'),
    (v_prod.id, 'trespassing-tshirt-2', 'Black Heather / S', 2000, '69f4c26b463958'),
    (v_prod.id, 'trespassing-tshirt-3', 'Black Heather / M', 2000, '69f4c26b4639a5'),
    (v_prod.id, 'trespassing-tshirt-4', 'Black Heather / L', 2000, '69f4c26b4639f1'),
    (v_prod.id, 'trespassing-tshirt-5', 'Black Heather / XL', 2000, '69f4c26b463a39'),
    (v_prod.id, 'trespassing-tshirt-6', 'Black Heather / 2XL', 2000, '69f4c26b463a87')
    ON CONFLICT (sku) DO UPDATE SET price_override_pence = EXCLUDED.price_override_pence, printful_variant_id = EXCLUDED.printful_variant_id;
  END IF;

  -- binbag-adventures-tshirt
  SELECT id INTO v_prod FROM public.products WHERE slug = 'binbag-adventures-tshirt';
  IF FOUND THEN
    INSERT INTO public.product_variants (product_id, sku, name, price_override_pence, printful_variant_id) VALUES
    (v_prod.id, 'binbag-adventures-tshirt-1', 'XS', 2000, '69f4c2bfa8bdf9'),
    (v_prod.id, 'binbag-adventures-tshirt-2', 'S', 2000, '69f4c2bfa8be68'),
    (v_prod.id, 'binbag-adventures-tshirt-3', 'M', 2000, '69f4c2bfa8bec1'),
    (v_prod.id, 'binbag-adventures-tshirt-4', 'L', 2000, '69f4c2bfa8bf11'),
    (v_prod.id, 'binbag-adventures-tshirt-5', 'XL', 2000, '69f4c2bfa8bf59'),
    (v_prod.id, 'binbag-adventures-tshirt-6', '2XL', 2000, '69f4c2bfa8bfa2')
    ON CONFLICT (sku) DO UPDATE SET price_override_pence = EXCLUDED.price_override_pence, printful_variant_id = EXCLUDED.printful_variant_id;
  END IF;

  -- binliner-adventures
  SELECT id INTO v_prod FROM public.products WHERE slug = 'binliner-adventures';
  IF FOUND THEN
    INSERT INTO public.product_variants (product_id, sku, name, price_override_pence, printful_variant_id) VALUES
    (v_prod.id, 'binliner-adventures-1', 'XS', 2000, '69f4c21bf080e8'),
    (v_prod.id, 'binliner-adventures-2', 'S', 2000, '69f4c21bf08141'),
    (v_prod.id, 'binliner-adventures-3', 'M', 2000, '69f4c21bf08195'),
    (v_prod.id, 'binliner-adventures-4', 'L', 2000, '69f4c21bf081e5'),
    (v_prod.id, 'binliner-adventures-5', 'XL', 2000, '69f4c21bf08229'),
    (v_prod.id, 'binliner-adventures-6', '2XL', 2000, '69f4c21bf08272'),
    (v_prod.id, 'binliner-adventures-7', '3XL', 2000, '69f4c21bf082b1')
    ON CONFLICT (sku) DO UPDATE SET price_override_pence = EXCLUDED.price_override_pence, printful_variant_id = EXCLUDED.printful_variant_id;
  END IF;

  -- trespassing-prole-hoodie
  SELECT id INTO v_prod FROM public.products WHERE slug = 'trespassing-prole-hoodie';
  IF FOUND THEN
    INSERT INTO public.product_variants (product_id, sku, name, price_override_pence, printful_variant_id) VALUES
    (v_prod.id, 'trespassing-prole-hoodie-1', 'S', 3500, '69f4c362c28f66'),
    (v_prod.id, 'trespassing-prole-hoodie-2', 'M', 3500, '69f4c362c28fd1'),
    (v_prod.id, 'trespassing-prole-hoodie-3', 'L', 3500, '69f4c362c29014'),
    (v_prod.id, 'trespassing-prole-hoodie-4', 'XL', 3500, '69f4c362c29062'),
    (v_prod.id, 'trespassing-prole-hoodie-5', '2XL', 3500, '69f4c362c290a7'),
    (v_prod.id, 'trespassing-prole-hoodie-6', '3XL', 4000, '69f4c362c290e6'),
    (v_prod.id, 'trespassing-prole-hoodie-7', '4XL', 4000, '69f4c362c29139'),
    (v_prod.id, 'trespassing-prole-hoodie-8', '5XL', 4000, '69f4c362c29179')
    ON CONFLICT (sku) DO UPDATE SET price_override_pence = EXCLUDED.price_override_pence, printful_variant_id = EXCLUDED.printful_variant_id;
  END IF;

  -- binbag-prole-hoodie
  SELECT id INTO v_prod FROM public.products WHERE slug = 'binbag-prole-hoodie';
  IF FOUND THEN
    INSERT INTO public.product_variants (product_id, sku, name, price_override_pence, printful_variant_id) VALUES
    (v_prod.id, 'binbag-prole-hoodie-1', 'S', 3500, '69f4c3aa05fae9'),
    (v_prod.id, 'binbag-prole-hoodie-2', 'M', 3500, '69f4c3aa05fb42'),
    (v_prod.id, 'binbag-prole-hoodie-3', 'L', 3500, '69f4c3aa05fb93'),
    (v_prod.id, 'binbag-prole-hoodie-4', 'XL', 3500, '69f4c3aa05fbe6'),
    (v_prod.id, 'binbag-prole-hoodie-5', '2XL', 3500, '69f4c3aa05fc22'),
    (v_prod.id, 'binbag-prole-hoodie-6', '3XL', 4000, '69f4c3aa05fc78'),
    (v_prod.id, 'binbag-prole-hoodie-7', '4XL', 4000, '69f4c3aa05fcb7'),
    (v_prod.id, 'binbag-prole-hoodie-8', '5XL', 4000, '69f4c3aa05fcf1')
    ON CONFLICT (sku) DO UPDATE SET price_override_pence = EXCLUDED.price_override_pence, printful_variant_id = EXCLUDED.printful_variant_id;
  END IF;

  -- binbag-adventures-hoodie
  SELECT id INTO v_prod FROM public.products WHERE slug = 'binbag-adventures-hoodie';
  IF FOUND THEN
    INSERT INTO public.product_variants (product_id, sku, name, price_override_pence, printful_variant_id) VALUES
    (v_prod.id, 'binbag-adventures-hoodie-1', 'S', 3500, '69f4c31acf78f9'),
    (v_prod.id, 'binbag-adventures-hoodie-2', 'M', 3500, '69f4c31acf7993'),
    (v_prod.id, 'binbag-adventures-hoodie-3', 'L', 3500, '69f4c31acf7a21'),
    (v_prod.id, 'binbag-adventures-hoodie-4', 'XL', 3500, '69f4c31acf7aa9'),
    (v_prod.id, 'binbag-adventures-hoodie-5', '2XL', 3500, '69f4c31acf7b26'),
    (v_prod.id, 'binbag-adventures-hoodie-6', '3XL', 4000, '69f4c31acf7bb2'),
    (v_prod.id, 'binbag-adventures-hoodie-7', '4XL', 4000, '69f4c31acf7c34'),
    (v_prod.id, 'binbag-adventures-hoodie-8', '5XL', 4000, '69f4c31acf7ca9')
    ON CONFLICT (sku) DO UPDATE SET price_override_pence = EXCLUDED.price_override_pence, printful_variant_id = EXCLUDED.printful_variant_id;
  END IF;

  -- tinny-mug
  SELECT id INTO v_prod FROM public.products WHERE slug = 'tinny-mug';
  IF FOUND THEN
    INSERT INTO public.product_variants (product_id, sku, name, price_override_pence, printful_variant_id) VALUES
    (v_prod.id, 'tinny-mug-1', 'Standard', 1600, '69f4c0518de143')
    ON CONFLICT (sku) DO UPDATE SET price_override_pence = EXCLUDED.price_override_pence, printful_variant_id = EXCLUDED.printful_variant_id;
  END IF;

  -- big-black-cup
  SELECT id INTO v_prod FROM public.products WHERE slug = 'big-black-cup';
  IF FOUND THEN
    INSERT INTO public.product_variants (product_id, sku, name, price_override_pence, printful_variant_id) VALUES
    (v_prod.id, 'big-black-cup-1', '11 oz', 1500, '69f4c174864494'),
    (v_prod.id, 'big-black-cup-2', '15 oz', 1800, '69f4c1748644f9')
    ON CONFLICT (sku) DO UPDATE SET price_override_pence = EXCLUDED.price_override_pence, printful_variant_id = EXCLUDED.printful_variant_id;
  END IF;

  -- big-black-mug
  SELECT id INTO v_prod FROM public.products WHERE slug = 'big-black-mug';
  IF FOUND THEN
    INSERT INTO public.product_variants (product_id, sku, name, price_override_pence, printful_variant_id) VALUES
    (v_prod.id, 'big-black-mug-1', '11 oz', 1500, '69f4c09edca901'),
    (v_prod.id, 'big-black-mug-2', '15 oz', 1800, '69f4c09edca972')
    ON CONFLICT (sku) DO UPDATE SET price_override_pence = EXCLUDED.price_override_pence, printful_variant_id = EXCLUDED.printful_variant_id;
  END IF;

  -- whitey-mug
  SELECT id INTO v_prod FROM public.products WHERE slug = 'whitey-mug';
  IF FOUND THEN
    INSERT INTO public.product_variants (product_id, sku, name, price_override_pence, printful_variant_id) VALUES
    (v_prod.id, 'whitey-mug-1', '11 oz', 1200, '69f4c0ef7f1cb1'),
    (v_prod.id, 'whitey-mug-2', '15 oz', 1500, '69f4c0ef7f1d29'),
    (v_prod.id, 'whitey-mug-3', '20 oz', 1800, '69f4c0ef7f1d73')
    ON CONFLICT (sku) DO UPDATE SET price_override_pence = EXCLUDED.price_override_pence, printful_variant_id = EXCLUDED.printful_variant_id;
  END IF;

  -- huge-whitey
  SELECT id INTO v_prod FROM public.products WHERE slug = 'huge-whitey';
  IF FOUND THEN
    INSERT INTO public.product_variants (product_id, sku, name, price_override_pence, printful_variant_id) VALUES
    (v_prod.id, 'huge-whitey-1', '15 oz', 1500, '69f4c1b686d764'),
    (v_prod.id, 'huge-whitey-2', '20 oz', 1050, '69f4c1b686d7d8')
    ON CONFLICT (sku) DO UPDATE SET price_override_pence = EXCLUDED.price_override_pence, printful_variant_id = EXCLUDED.printful_variant_id;
  END IF;

  -- black-hole-mug
  SELECT id INTO v_prod FROM public.products WHERE slug = 'black-hole-mug';
  IF FOUND THEN
    INSERT INTO public.product_variants (product_id, sku, name, price_override_pence, printful_variant_id) VALUES
    (v_prod.id, 'black-hole-mug-1', '11 oz', 1500, '69f4bffe639477'),
    (v_prod.id, 'black-hole-mug-2', '15 oz', 1800, '69f4bffe639519')
    ON CONFLICT (sku) DO UPDATE SET price_override_pence = EXCLUDED.price_override_pence, printful_variant_id = EXCLUDED.printful_variant_id;
  END IF;

  -- prole-patch
  SELECT id INTO v_prod FROM public.products WHERE slug = 'prole-patch';
  IF FOUND THEN
    INSERT INTO public.product_variants (product_id, sku, name, price_override_pence, printful_variant_id) VALUES
    (v_prod.id, 'prole-patch-1', 'Standard', 1350, '69f4bdb6f0fb57')
    ON CONFLICT (sku) DO UPDATE SET price_override_pence = EXCLUDED.price_override_pence, printful_variant_id = EXCLUDED.printful_variant_id;
  END IF;

  -- prole-binbag-patch
  SELECT id INTO v_prod FROM public.products WHERE slug = 'prole-binbag-patch';
  IF FOUND THEN
    INSERT INTO public.product_variants (product_id, sku, name, price_override_pence, printful_variant_id) VALUES
    (v_prod.id, 'prole-binbag-patch-1', 'Standard', 1350, '69f4bdf15fb133')
    ON CONFLICT (sku) DO UPDATE SET price_override_pence = EXCLUDED.price_override_pence, printful_variant_id = EXCLUDED.printful_variant_id;
  END IF;

  -- prole-cap
  SELECT id INTO v_prod FROM public.products WHERE slug = 'prole-cap';
  IF FOUND THEN
    INSERT INTO public.product_variants (product_id, sku, name, price_override_pence, printful_variant_id) VALUES
    (v_prod.id, 'prole-cap-1', 'Standard', 2500, '69f4bd3c4ebb13')
    ON CONFLICT (sku) DO UPDATE SET price_override_pence = EXCLUDED.price_override_pence, printful_variant_id = EXCLUDED.printful_variant_id;
  END IF;

  -- vintage-prole-cap
  SELECT id INTO v_prod FROM public.products WHERE slug = 'vintage-prole-cap';
  IF FOUND THEN
    INSERT INTO public.product_variants (product_id, sku, name, price_override_pence, printful_variant_id) VALUES
    (v_prod.id, 'vintage-prole-cap-1', 'Standard', 2500, '69f4bd70403f55')
    ON CONFLICT (sku) DO UPDATE SET price_override_pence = EXCLUDED.price_override_pence, printful_variant_id = EXCLUDED.printful_variant_id;
  END IF;
END $$;
