-- ============================================================
-- 0002 — Grants + Seed de test (catégories, plats, zones, créneaux)
-- À exécuter dans l'éditeur SQL du dashboard Supabase.
-- Idempotent : safe à rejouer (ON CONFLICT DO NOTHING).
-- ============================================================

-- ─── GRANTS (nécessaires pour le service_role et l'API REST) ──
grant usage  on schema public to anon, authenticated, service_role;
grant all    on all tables    in schema public to anon;
grant all    on all tables    in schema public to authenticated;
grant all    on all tables    in schema public to service_role;
grant all    on all sequences in schema public to anon;
grant all    on all sequences in schema public to authenticated;
grant all    on all sequences in schema public to service_role;
grant execute on all functions in schema public to anon;
grant execute on all functions in schema public to authenticated;
grant execute on all functions in schema public to service_role;

-- ─── CATÉGORIES ───────────────────────────────────────────────
insert into categories (name, slug, sort_order) values
  ('Plats cuisinés',  'plats-cuisines',  1),
  ('Accompagnements', 'accompagnements', 2)
on conflict (slug) do nothing;

-- ─── PLATS ────────────────────────────────────────────────────
insert into dishes
  (category_id, name, slug, description, price_cents, region,
   is_available, spice_customizable, sort_order)
select
  (select id from categories where slug = 'plats-cuisines'),
  name, slug, description, price_cents, region, true, spice_customizable, sort_order
from (values
  ('Poulet à la moambe',    'poulet-moambe',
   'Mijoté doucement dans la sauce à la noix de palme avec légumes frais et épices maison. La recette de famille de Nathy, transmise depuis Kinshasa.',
   1350, 'Kinshasa', true, 1),
  ('Pondu sauce arachide',  'pondu-sauce-arachide',
   'Feuilles de manioc pilées, mijotées avec pâte d''arachide maison et épices du marché. 100 % végétarien, goût authentique du Bandundu.',
   1100, 'Bandundu', true, 2),
  ('Makayabu aux haricots', 'makayabu-haricots',
   'Poisson salé revisité avec haricots rouges, tomates fraîches et légumes de saison. Le classique du dimanche chez Nathy.',
   1450, 'Kinshasa', false, 3)
) as d(name, slug, description, price_cents, region, spice_customizable, sort_order)
on conflict (slug) do nothing;

-- ─── OPTIONS DES PLATS ────────────────────────────────────────
insert into dish_options (dish_id, name, extra_price_cents, sort_order)
select d.id, o.name, o.extra_price_cents, o.sort_order
from dishes d
join (values
  ('poulet-moambe',        'Riz blanc',               0,   1),
  ('poulet-moambe',        'Chikwangue',              0,   2),
  ('poulet-moambe',        'Supplément sauce moambe', 150, 3),
  ('pondu-sauce-arachide', 'Riz blanc',               0,   1),
  ('pondu-sauce-arachide', 'Chikwangue',              0,   2)
) as o(slug, name, extra_price_cents, sort_order) on o.slug = d.slug
where not exists (
  select 1 from dish_options x where x.dish_id = d.id and x.name = o.name
);

-- ─── ZONES DE LIVRAISON ───────────────────────────────────────
insert into delivery_zones (postal_code, city, fee_cents, min_order_cents, is_active) values
  ('69200', 'Vénissieux',  300, 1500, true),
  ('69001', 'Lyon 1er',    350, 1500, true),
  ('69007', 'Lyon 7ème',   350, 1500, true),
  ('69008', 'Lyon 8ème',   400, 2000, true),
  ('69003', 'Lyon 3ème',   350, 1500, true)
on conflict (postal_code) do nothing;

-- ─── CRÉNEAUX DE LIVRAISON (7 prochains jours, 4 créneaux/jour) ──
insert into delivery_slots (slot_date, start_time, end_time, max_orders, is_active)
select
  (current_date + s.i)::date,
  t.start_time,
  t.end_time,
  6,
  true
from generate_series(1, 7) as s(i),
  (values
    ('18:00'::time, '18:30'::time),
    ('18:30'::time, '19:00'::time),
    ('19:00'::time, '19:30'::time),
    ('19:30'::time, '20:00'::time)
  ) as t(start_time, end_time)
on conflict (slot_date, start_time) do nothing;

-- ─── VÉRIFICATION ─────────────────────────────────────────────
select 'Catégories' as table_name, count(*) from categories
union all select 'Plats',        count(*) from dishes
union all select 'Options',      count(*) from dish_options
union all select 'Zones',        count(*) from delivery_zones
union all select 'Créneaux',     count(*) from delivery_slots;
