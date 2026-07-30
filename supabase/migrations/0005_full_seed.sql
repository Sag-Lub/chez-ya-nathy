-- ============================================================
-- 0005 — Seed complet (catégories + plats + accompagnements + boissons)
-- Idempotent : ON CONFLICT DO NOTHING — safe à rejouer.
-- Prix en centimes. available_days : NULL = tous les jours,
-- ARRAY[6,0] = samedi (6) + dimanche (0) uniquement.
-- ============================================================

-- ─── Catégories ───────────────────────────────────────────────
INSERT INTO categories (name, slug, sort_order) VALUES
  ('Plats cuisinés',  'plats-cuisines',  1),
  ('Accompagnements', 'accompagnements', 2),
  ('Boissons',        'boissons',        3),
  ('Desserts',        'desserts',        4)
ON CONFLICT (slug) DO NOTHING;

-- ─── Plats cuisinés — spécialités congolaises ─────────────────
INSERT INTO dishes
  (category_id, name, slug, subtitle, description, price_cents, image_url,
   culinary_origin, is_available, spice_customizable, available_days, sort_order)
SELECT
  (SELECT id FROM categories WHERE slug = 'plats-cuisines'),
  v.name, v.slug, v.subtitle, v.description, v.price_cents, v.image_url,
  'congolese', true, v.spice, v.days, v.sort
FROM (VALUES
  ('Soso ya muamba',     'poulet-muamba',   'Poulet à la sauce d''arachide',
   'Poulet mijoté dans une sauce d''arachide maison avec légumes frais et épices. La recette de famille de Nathy.',
   1350, '/images/poulet-a-la-moambe.jpg', true,  NULL::smallint[], 1),

  ('Pondu',              'pondu',           'Feuilles de manioc à la sauce arachide',
   'Feuilles de manioc pilées, mijotées avec pâte d''arachide maison et épices du marché. 100 % végétarien.',
   1100, '/images/pondu-sauce-arachide.jpg', false, ARRAY[0,6]::smallint[], 2),

  ('Fumbwa',             'fumbwa',          'Légumes sauvages en sauce arachide',
   'Feuilles de fumbwa mijotées à la sauce d''arachide avec poisson fumé. Un trésor de la forêt congolaise.',
   1200, '/images/fumbwa.jpg', false, ARRAY[0,6]::smallint[], 3),

  ('Kamundele',          'kamundele',       'Brochettes de viande grillées',
   'Brochettes marinées aux épices maison, grillées à la braise. La street food préférée de Kinshasa.',
   1350, '/images/kamundele.jpg', false, ARRAY[0,6]::smallint[], 4),

  ('Makayabu',           'makayabu-haricots', 'Poisson salé avec haricots rouges',
   'Poisson salé traditionnel revisité avec haricots rouges, tomates fraîches et légumes de saison.',
   1450, '/images/makayabu.jpg', false, ARRAY[0,6]::smallint[], 5),

  ('Liboke ya mbisi',    'liboke-mbisi',    'Poisson en feuilles de bananier',
   'Poisson frais mariné aux épices et cuit à l''étouffée dans des feuilles de bananier. Le goût du Congo.',
   1400, '/images/liboke-ya-mbisi.jpg', false, ARRAY[0,6]::smallint[], 6),

  ('Madesu',             'madesu',          'Haricots rouges en sauce tomate',
   'Haricots rouges mijotés aux tomates fraîches et épices maison. Le plat végétarien congolais par excellence.',
   1200, '/images/madesu.jpg', false, NULL::smallint[], 7)
) AS v(name, slug, subtitle, description, price_cents, image_url, spice, days, sort)
ON CONFLICT (slug) DO NOTHING;

-- ─── Plats cuisinés — sélection africaine ────────────────────
INSERT INTO dishes
  (category_id, name, slug, subtitle, description, price_cents, image_url,
   culinary_origin, is_available, spice_customizable, available_days, sort_order)
SELECT
  (SELECT id FROM categories WHERE slug = 'plats-cuisines'),
  v.name, v.slug, v.subtitle, v.description, v.price_cents, v.image_url,
  'african_selection', true, v.spice, v.days, v.sort
FROM (VALUES
  ('Mafé Poulet',        'mafe-poulet',     'Ragoût de poulet à la pâte d''arachide',
   'Poulet mijoté dans une sauce épaisse à la pâte d''arachide, typique d''Afrique de l''Ouest.',
   1300, '/images/mafe-poulet.jpg', true, ARRAY[0,6]::smallint[], 8),

  ('Mafé Bœuf',          'mafe-boeuf',      'Ragoût de bœuf à la pâte d''arachide',
   'Bœuf mijoté dans une sauce épaisse à la pâte d''arachide, typique d''Afrique de l''Ouest.',
   1450, '/images/mafe-poulet.jpg', true, ARRAY[0,6]::smallint[], 9),

  ('Attiéké Poulet',     'attieke-poulet',  'Semoule de manioc avec poulet grillé',
   'Attiéké léger et parfumé accompagné de poulet grillé aux épices. La spécialité de Côte d''Ivoire.',
   1300, '/images/attieke.jpg', false, NULL::smallint[], 10),

  ('Attiéké Poisson',    'attieke-poisson', 'Semoule de manioc avec poisson grillé',
   'Attiéké léger et parfumé accompagné de poisson grillé. Le classique ivoirien par excellence.',
   1350, '/images/attieke.jpg', false, NULL::smallint[], 11)
) AS v(name, slug, subtitle, description, price_cents, image_url, spice, days, sort)
ON CONFLICT (slug) DO NOTHING;

-- ─── Plat sans origine confirmée ─────────────────────────────
INSERT INTO dishes
  (category_id, name, slug, subtitle, description, price_cents, image_url,
   culinary_origin, is_available, available_days, sort_order)
VALUES (
  (SELECT id FROM categories WHERE slug = 'plats-cuisines'),
  'Dindon', 'dindon', 'Dinde rôtie aux épices maison',
  'Dinde marinée et rôtie longuement aux épices maison. Plat de fête généreux et parfumé.',
  1500, '/images/dindon.jpg', NULL, true, ARRAY[0,6]::smallint[], 12
) ON CONFLICT (slug) DO NOTHING;

-- ─── Accompagnements ─────────────────────────────────────────
INSERT INTO dishes
  (category_id, name, slug, subtitle, description, price_cents, image_url, is_available, sort_order)
SELECT
  (SELECT id FROM categories WHERE slug = 'accompagnements'),
  v.name, v.slug, v.subtitle, v.desc, v.price, v.img, true, v.sort
FROM (VALUES
  ('Riz blanc',           'riz-blanc',           'Riz cuit à la vapeur',
   'Riz basmati cuit à la vapeur, léger et parfumé.',                    250, '/images/riz-blanc.jpg',                1),
  ('Fufu',                'fufu',                'Pâte de manioc ou de maïs',
   'Fufu moelleux, idéal pour accompagner toutes les sauces.',           300, '/images/fufu.jpg',                     2),
  ('Chikwangue',          'chikwangue',          'Pain de manioc cuit à l''étouffée',
   'Pain de manioc cuit dans des feuilles, moelleux et neutre.',         350, '/images/chikwangue.jpg',               3),
  ('Makemba',             'makemba',             'Plantains frits',
   'Plantains mûrs frits, dorés et légèrement sucrés.',                  350, '/images/makemba-plantains-frits.jpg',  4),
  ('Banane plantain bouillie', 'banane-plantain-bouillie', 'Plantains bouillis',
   'Plantains bouillis, onctueux et naturellement sucrés.',              150, '/images/bananes_plantains-bouillie.jpg', 5),
  ('Mikatés',             'mikates',             'Beignets congolais',
   'Petits beignets dorés et moelleux, sucrés ou nature.',               200, '/images/mikate.jpg',                   6)
) AS v(name, slug, subtitle, desc, price, img, sort)
ON CONFLICT (slug) DO NOTHING;

-- ─── Boissons ─────────────────────────────────────────────────
INSERT INTO dishes
  (category_id, name, slug, subtitle, description, price_cents, image_url, is_available, sort_order)
SELECT
  (SELECT id FROM categories WHERE slug = 'boissons'),
  v.name, v.slug, v.subtitle, v.desc, v.price, v.img, true, v.sort
FROM (VALUES
  ('Bissap',                  'bissap',               'Infusion d''hibiscus',
   'Boisson d''hibiscus séchée, légèrement sucrée et acidulée.',   400, '/images/bissap.png',                  1),
  ('Jus de baobab (Bouye)',   'jus-baobab-bouye',     'Jus de fruit du baobab',
   'Boisson au fruit du baobab, crémeuse et riche en vitamine C.', 450, '/images/jus-baobab-bouye.png',        2),
  ('Jus de gingembre (Tangawisi)', 'jus-gingembre-tangawisi', 'Jus de gingembre frais',
   'Gingembre pressé avec citron, légèrement piquant et frais.',   400, '/images/jus-gingembre-tangawisi.png', 3)
) AS v(name, slug, subtitle, desc, price, img, sort)
ON CONFLICT (slug) DO NOTHING;
