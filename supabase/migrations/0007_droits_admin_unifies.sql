-- ============================================================
-- 0007 — Droits admin : UNE seule méthode, is_admin() (profiles.role)
-- À exécuter dans : Supabase Dashboard → SQL Editor, AVANT de déployer la refonte.
-- Sans risque à rejouer.
--
-- Avant : deux méthodes cohabitaient — l'email écrit en dur dans les policies
-- de 0003, et is_admin() (profiles.role) définie dans 0001.
-- Après : seule is_admin() donne les droits admin, côté base comme côté app
-- (app/admin/(protected)/layout.tsx lit le même profiles.role).
--
-- Cette migration corrige aussi une faille : la policy « profil : mise à jour »
-- laissait n'importe quel compte connecté modifier sa propre ligne de profiles,
-- colonne role comprise — donc se donner le rôle admin.
-- ============================================================

-- ── 1. Le compte de la cuisine reçoit le rôle admin ───────────
-- (seul endroit où l'adresse apparaît : une donnée de départ, pas une règle d'accès)
insert into profiles (id, role)
select id, 'admin' from auth.users where lower(email) = 'chezyanathy@gmail.com'
on conflict (id) do update set role = 'admin';

-- ── 2. Garde-fou : on ne retire rien tant qu'aucun admin n'existe ─
do $$
begin
  if not exists (select 1 from profiles where role = 'admin') then
    raise exception 'Aucun compte admin trouvé. Connecte-toi une fois sur /admin/login avec l''adresse de la cuisine, puis relance cette migration. Rien n''a été modifié.';
  end if;
end $$;

-- ── 3. Personne ne peut changer son propre rôle ───────────────
-- Les comptes connectés ne peuvent modifier que leur nom et leur téléphone.
-- Le rôle ne se change que depuis le SQL Editor (ou avec la clé service role).
revoke insert, update, delete on profiles from anon, authenticated;
grant update (full_name, phone) on profiles to authenticated;

drop policy if exists "profil : mise à jour" on profiles;
create policy "profil : mise à jour" on profiles
  for update using (id = auth.uid()) with check (id = auth.uid());

-- ── 4. is_admin() : la seule source des droits admin ──────────
create or replace function is_admin()
returns boolean
language sql stable
security definer set search_path = public
as $$
  select exists (
    select 1 from profiles
    where id = auth.uid() and role = 'admin'
  );
$$;

-- ── 5. On retire les policies qui comparaient l'email en dur (0003) ─
drop policy if exists "admin_select_orders"      on orders;
drop policy if exists "admin_update_orders"      on orders;
drop policy if exists "admin_select_order_items" on order_items;
drop policy if exists "admin_update_dishes"      on dishes;
drop policy if exists "admin_insert_slots"       on delivery_slots;
drop policy if exists "admin_update_slots"       on delivery_slots;
drop policy if exists "admin_delete_slots"       on delivery_slots;

-- ── 6. Policies admin, toutes basées sur is_admin() ───────────
-- (recréées ici pour que cette migration se suffise à elle-même)

-- Commandes : lecture par le client connecté (les siennes) ou l'admin ;
-- changement de statut par l'admin. Toujours AUCUN insert depuis le navigateur.
drop policy if exists "commandes : client voit les siennes, admin tout" on orders;
create policy "commandes : client voit les siennes, admin tout" on orders
  for select using (user_id = auth.uid() or is_admin());

drop policy if exists "commandes : statut modifié par l'admin" on orders;
create policy "commandes : statut modifié par l'admin" on orders
  for update using (is_admin()) with check (is_admin());

drop policy if exists "lignes : visibles avec la commande" on order_items;
create policy "lignes : visibles avec la commande" on order_items
  for select using (
    exists (
      select 1 from orders o
      where o.id = order_id and (o.user_id = auth.uid() or is_admin())
    )
  );

-- Catalogue, zones et créneaux : gestion réservée à l'admin
drop policy if exists "catégories : gestion admin" on categories;
create policy "catégories : gestion admin" on categories
  for all using (is_admin()) with check (is_admin());

drop policy if exists "plats : gestion admin" on dishes;
create policy "plats : gestion admin" on dishes
  for all using (is_admin()) with check (is_admin());

drop policy if exists "histoires : gestion admin" on stories;
create policy "histoires : gestion admin" on stories
  for all using (is_admin()) with check (is_admin());

drop policy if exists "options : gestion admin" on dish_options;
create policy "options : gestion admin" on dish_options
  for all using (is_admin()) with check (is_admin());

drop policy if exists "zones : gestion admin" on delivery_zones;
create policy "zones : gestion admin" on delivery_zones
  for all using (is_admin()) with check (is_admin());

drop policy if exists "créneaux : gestion admin" on delivery_slots;
create policy "créneaux : gestion admin" on delivery_slots
  for all using (is_admin()) with check (is_admin());

-- ── 7. Vérification : doit afficher le compte de la cuisine ───
select u.email as compte_admin, p.role
from profiles p join auth.users u on u.id = p.id
where p.role = 'admin';
