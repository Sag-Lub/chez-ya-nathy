-- ============================================================
-- NATHY FOOD — Schéma initial Supabase
-- Migration 0001 — à exécuter dans l'éditeur SQL de Supabase
-- Convention : tous les prix sont en CENTIMES (integer),
-- jamais en décimal, pour éviter les erreurs d'arrondi.
-- ============================================================

-- ---------- ENUMS ----------

create type order_status as enum (
  'recue',          -- paiement validé, commande reçue
  'confirmee',      -- vue et acceptée par la cuisine
  'en_cuisine',     -- en préparation
  'en_livraison',   -- partie en livraison (ou prête si à emporter)
  'livree',         -- livrée / retirée
  'annulee'
);

create type order_type as enum ('livraison', 'emporter');

create type spice_level as enum ('doux', 'moyen', 'fort', 'pili_pili_a_part');

-- ---------- PROFILS ----------

create table profiles (
  id         uuid primary key references auth.users on delete cascade,
  full_name  text,
  phone      text,
  role       text not null default 'client' check (role in ('client', 'admin')),
  created_at timestamptz not null default now()
);

-- Création automatique du profil à l'inscription
create function handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into profiles (id, full_name)
  values (new.id, coalesce(new.raw_user_meta_data->>'full_name', ''));
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function handle_new_user();

-- Helper : l'utilisateur courant est-il admin ?
create function is_admin()
returns boolean
language sql stable
security definer set search_path = public
as $$
  select exists (
    select 1 from profiles
    where id = auth.uid() and role = 'admin'
  );
$$;

-- ---------- CATALOGUE ----------

create table categories (
  id         uuid primary key default gen_random_uuid(),
  name       text not null,
  slug       text not null unique,
  sort_order int  not null default 0
);

create table dishes (
  id                 uuid primary key default gen_random_uuid(),
  category_id        uuid not null references categories on delete restrict,
  name               text not null,
  slug               text not null unique,
  description        text not null default '',
  price_cents        int  not null check (price_cents >= 0),
  image_url          text,
  region             text,                      -- ex : 'Kinshasa', 'Bandundu' (pour le Passeport des saveurs)
  is_available       boolean not null default true,   -- rupture du jour (bouton "épuisé" côté cuisine)
  spice_customizable boolean not null default false,  -- propose le choix du piquant
  lead_time_hours    int  not null default 0,   -- 0 = commande immédiate ; 24 = précommande J-1 (moambe...)
  available_days     smallint[] ,               -- null = tous les jours ; sinon ex {4,5,6} = jeu/ven/sam (0=dimanche)
  sort_order         int  not null default 0,
  created_at         timestamptz not null default now()
);

create index on dishes (category_id);

-- Histoire du plat (storytelling — Phase 2, table prête dès maintenant)
create table stories (
  id        uuid primary key default gen_random_uuid(),
  dish_id   uuid not null unique references dishes on delete cascade,
  title     text not null,
  body      text not null,       -- l'histoire : origine, région, recette familiale
  audio_url text                 -- version audio ElevenLabs (Phase 3)
);

-- Options d'un plat (accompagnements, suppléments)
create table dish_options (
  id                uuid primary key default gen_random_uuid(),
  dish_id           uuid not null references dishes on delete cascade,
  name              text not null,               -- ex : 'Chikwangue', 'Riz', 'Supplément makemba'
  extra_price_cents int  not null default 0,
  sort_order        int  not null default 0
);

create index on dish_options (dish_id);

-- ---------- LIVRAISON ----------

create table delivery_zones (
  id              uuid primary key default gen_random_uuid(),
  postal_code     text not null unique,          -- ex : '69200'
  city            text not null,                 -- ex : 'Vénissieux'
  fee_cents       int  not null default 0,
  min_order_cents int  not null default 0,       -- panier minimum pour cette zone
  is_active       boolean not null default true
);

create table delivery_slots (
  id           uuid primary key default gen_random_uuid(),
  slot_date    date not null,
  start_time   time not null,                    -- ex : 19:00
  end_time     time not null,                    -- ex : 19:30
  max_orders   int  not null default 6,          -- capacité cuisine + livraison
  orders_count int  not null default 0,
  is_active    boolean not null default true,
  unique (slot_date, start_time)
);

create index on delivery_slots (slot_date);

-- ---------- COMMANDES ----------

create table orders (
  id                    uuid primary key default gen_random_uuid(),
  public_token          uuid not null unique default gen_random_uuid(), -- suivi sans compte (lien /suivi/<token>)
  user_id               uuid references auth.users on delete set null,  -- null = commande invité
  customer_name         text not null,
  phone                 text not null,
  email                 text,
  type                  order_type   not null default 'livraison',
  status                order_status not null default 'recue',
  address               text,                    -- null si à emporter
  postal_code           text,
  slot_id               uuid references delivery_slots,
  subtotal_cents        int not null,
  delivery_fee_cents    int not null default 0,
  total_cents           int not null,
  notes                 text,                    -- allergies, interphone, étage...
  stripe_session_id     text unique,
  stripe_payment_intent text,
  created_at            timestamptz not null default now(),
  updated_at            timestamptz not null default now()
);

create index on orders (status);
create index on orders (created_at desc);

create table order_items (
  id               uuid primary key default gen_random_uuid(),
  order_id         uuid not null references orders on delete cascade,
  dish_id          uuid references dishes on delete set null,
  dish_name        text not null,               -- copie du nom au moment de la commande (le menu peut changer)
  unit_price_cents int  not null,
  quantity         int  not null check (quantity > 0),
  spice            spice_level,
  options          jsonb not null default '[]'  -- [{ "name": "Chikwangue", "extra_price_cents": 200 }]
);

create index on order_items (order_id);

-- updated_at automatique
create function set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger orders_updated_at
  before update on orders
  for each row execute function set_updated_at();

-- Réservation de créneau : incrémente le compteur, refuse si complet
create function reserve_slot()
returns trigger language plpgsql as $$
begin
  if new.slot_id is not null then
    update delivery_slots
       set orders_count = orders_count + 1
     where id = new.slot_id
       and is_active
       and orders_count < max_orders;
    if not found then
      raise exception 'Créneau complet ou indisponible';
    end if;
  end if;
  return new;
end;
$$;

create trigger orders_reserve_slot
  before insert on orders
  for each row execute function reserve_slot();

-- ---------- FIDÉLITÉ (Phase 3 — table prête, inoffensive d'ici là) ----------

create table loyalty_stamps (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references auth.users on delete cascade,
  dish_id    uuid not null references dishes on delete cascade,
  region     text,
  created_at timestamptz not null default now(),
  unique (user_id, dish_id)                      -- un tampon par plat découvert
);

-- ---------- ROW LEVEL SECURITY ----------

alter table profiles       enable row level security;
alter table categories     enable row level security;
alter table dishes         enable row level security;
alter table stories        enable row level security;
alter table dish_options   enable row level security;
alter table delivery_zones enable row level security;
alter table delivery_slots enable row level security;
alter table orders         enable row level security;
alter table order_items    enable row level security;
alter table loyalty_stamps enable row level security;

-- Profils : chacun voit et modifie le sien ; l'admin voit tout
create policy "profil : lecture" on profiles
  for select using (id = auth.uid() or is_admin());
create policy "profil : mise à jour" on profiles
  for update using (id = auth.uid());

-- Catalogue : lecture publique (site vitrine), écriture admin
create policy "catégories : lecture publique" on categories for select using (true);
create policy "catégories : gestion admin"    on categories for all using (is_admin());

create policy "plats : lecture publique" on dishes for select using (true);
create policy "plats : gestion admin"    on dishes for all using (is_admin());

create policy "histoires : lecture publique" on stories for select using (true);
create policy "histoires : gestion admin"    on stories for all using (is_admin());

create policy "options : lecture publique" on dish_options for select using (true);
create policy "options : gestion admin"    on dish_options for all using (is_admin());

create policy "zones : lecture publique" on delivery_zones for select using (is_active or is_admin());
create policy "zones : gestion admin"    on delivery_zones for all using (is_admin());

create policy "créneaux : lecture publique" on delivery_slots for select using (is_active or is_admin());
create policy "créneaux : gestion admin"    on delivery_slots for all using (is_admin());

-- Commandes : PAS de policy INSERT côté client.
-- Les commandes sont créées exclusivement par l'API (service role)
-- après validation du paiement Stripe — jamais depuis le navigateur.
create policy "commandes : client voit les siennes, admin tout" on orders
  for select using (user_id = auth.uid() or is_admin());
create policy "commandes : statut modifié par l'admin" on orders
  for update using (is_admin());

create policy "lignes : visibles avec la commande" on order_items
  for select using (
    exists (
      select 1 from orders o
      where o.id = order_id and (o.user_id = auth.uid() or is_admin())
    )
  );

-- Fidélité : chacun voit ses tampons (écriture via service role)
create policy "tampons : lecture perso" on loyalty_stamps
  for select using (user_id = auth.uid() or is_admin());

-- ---------- TEMPS RÉEL ----------

-- Le suivi de commande et le dashboard cuisine s'abonnent aux
-- changements de statut : on publie la table orders.
alter publication supabase_realtime add table orders;

-- ============================================================
-- FIN DE LA MIGRATION
-- Prochaine étape : insérer catégories + plats de départ (seed),
-- puis créer le premier admin :
--   update profiles set role = 'admin' where id = '<uuid_de_nathy>';
-- ============================================================
