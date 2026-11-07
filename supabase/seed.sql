insert into public.products (id, name, slug, description, base_price, category, gender, images, is_active)
values
  (
    '11111111-1111-4111-8111-111111111111',
    'Accra Linen Shirt',
    'accra-linen-shirt',
    'A breathable linen shirt cut for Ghana heat. Easy drape, hidden placket, and a slightly oversized shoulder.',
    420,
    'Tops',
    'women',
    array[
      'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1490481651871-ab68de25d43d?auto=format&fit=crop&w=1200&q=80'
    ],
    true
  ),
  (
    '22222222-2222-4222-8222-222222222222',
    'Labadi Wide Trousers',
    'labadi-wide-trousers',
    'High-rise wide trousers in a fluid viscose blend. Pockets sit clean. Hem skims the sandal.',
    510,
    'Bottoms',
    'unisex',
    array[
      'https://images.unsplash.com/photo-1594633312681-425c7b97ccd1?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1483985988355-763728e1935b?auto=format&fit=crop&w=1200&q=80'
    ],
    true
  ),
  (
    '33333333-3333-4333-8333-333333333333',
    'Cape Coast Wrap Dress',
    'cape-coast-wrap-dress',
    'A wrap dress with a quiet print and a belt that actually stays. Mid-calf, sleeves you can roll.',
    680,
    'Dresses',
    'women',
    array[
      'https://images.unsplash.com/photo-1515372039744-b8f02a3ae446?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1496747611176-843222e1e57c?auto=format&fit=crop&w=1200&q=80'
    ],
    true
  ),
  (
    '44444444-4444-4444-8444-444444444444',
    'Kumasi Knit Polo',
    'kumasi-knit-polo',
    'Fine-gauge knit polo. Soft collar, short sleeve, meant for evenings that start too warm.',
    360,
    'Tops',
    'men',
    array[
      'https://images.unsplash.com/photo-1523381294911-8d3cead13475?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1552374196-1ab2a1c593e8?auto=format&fit=crop&w=1200&q=80'
    ],
    true
  ),
  (
    '55555555-5555-4555-8555-555555555555',
    'Osu Tailored Blazer',
    'osu-tailored-blazer',
    'Unstructured blazer with a single button and a pocket that holds a phone without pulling.',
    890,
    'Outerwear',
    'unisex',
    array[
      'https://images.unsplash.com/photo-1594938291221-94f18cbb5660?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1487222477894-8943e31ef7b2?auto=format&fit=crop&w=1200&q=80'
    ],
    true
  ),
  (
    '66666666-6666-4666-8666-666666666666',
    'Volta Cotton Set',
    'volta-cotton-set',
    'Matching shirt and short in washed cotton. Wear together or split across the week.',
    740,
    'Sets',
    'women',
    array[
      'https://images.unsplash.com/photo-1469334031218-e382a71b716b?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1551488831-00ddcb6c6bd3?auto=format&fit=crop&w=1200&q=80'
    ],
    true
  )
on conflict (id) do nothing;

insert into public.product_variants (id, product_id, size, color, sku, stock, price_override)
values
  ('a1111111-1111-4111-8111-111111111111', '11111111-1111-4111-8111-111111111111', 'S', 'Ivory', 'ALS-IVY-S', 8, null),
  ('a1111111-1111-4111-8111-111111111112', '11111111-1111-4111-8111-111111111111', 'M', 'Ivory', 'ALS-IVY-M', 12, null),
  ('a1111111-1111-4111-8111-111111111113', '11111111-1111-4111-8111-111111111111', 'L', 'Sand', 'ALS-SND-L', 6, 440),
  ('b2222222-2222-4222-8222-222222222221', '22222222-2222-4222-8222-222222222222', 'S', 'Black', 'LWT-BLK-S', 4, null),
  ('b2222222-2222-4222-8222-222222222222', '22222222-2222-4222-8222-222222222222', 'M', 'Black', 'LWT-BLK-M', 9, null),
  ('b2222222-2222-4222-8222-222222222223', '22222222-2222-4222-8222-222222222222', 'M', 'Olive', 'LWT-OLV-M', 5, null),
  ('c3333333-3333-4333-8333-333333333331', '33333333-3333-4333-8333-333333333333', 'S', 'Clay', 'CWD-CLY-S', 7, null),
  ('c3333333-3333-4333-8333-333333333332', '33333333-3333-4333-8333-333333333333', 'M', 'Clay', 'CWD-CLY-M', 7, null),
  ('c3333333-3333-4333-8333-333333333333', '33333333-3333-4333-8333-333333333333', 'L', 'Indigo', 'CWD-IND-L', 3, 720),
  ('d4444444-4444-4444-8444-444444444441', '44444444-4444-4444-8444-444444444444', 'M', 'Forest', 'KKP-FOR-M', 10, null),
  ('d4444444-4444-4444-8444-444444444442', '44444444-4444-4444-8444-444444444444', 'L', 'Forest', 'KKP-FOR-L', 8, null),
  ('d4444444-4444-4444-8444-444444444443', '44444444-4444-4444-8444-444444444444', 'L', 'Ecru', 'KKP-ECR-L', 0, null),
  ('e5555555-5555-4555-8555-555555555551', '55555555-5555-4555-8555-555555555555', 'S', 'Charcoal', 'OTB-CHR-S', 2, null),
  ('e5555555-5555-4555-8555-555555555552', '55555555-5555-4555-8555-555555555555', 'M', 'Charcoal', 'OTB-CHR-M', 4, null),
  ('f6666666-6666-4666-8666-666666666661', '66666666-6666-4666-8666-666666666666', 'S', 'Stone', 'VCS-STN-S', 5, null),
  ('f6666666-6666-4666-8666-666666666662', '66666666-6666-4666-8666-666666666666', 'M', 'Stone', 'VCS-STN-M', 5, null),
  ('f6666666-6666-4666-8666-666666666663', '66666666-6666-4666-8666-666666666666', 'M', 'Sage', 'VCS-SAG-M', 4, 760)
on conflict (id) do nothing;
