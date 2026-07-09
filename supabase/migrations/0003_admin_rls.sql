-- ============================================================
-- Sprint 4 — Policies RLS pour l'admin (chezyanathy@gmail.com)
-- À exécuter dans : Supabase Dashboard → SQL Editor
-- ============================================================

-- Activer l'auth Supabase pour les magic links
-- (déjà actif par défaut, rien à faire côté SQL)

-- ── orders ───────────────────────────────────────────────────
CREATE POLICY "admin_select_orders"
  ON orders FOR SELECT TO authenticated
  USING (auth.email() = 'chezyanathy@gmail.com');

CREATE POLICY "admin_update_orders"
  ON orders FOR UPDATE TO authenticated
  USING  (auth.email() = 'chezyanathy@gmail.com')
  WITH CHECK (auth.email() = 'chezyanathy@gmail.com');

-- ── order_items ───────────────────────────────────────────────
CREATE POLICY "admin_select_order_items"
  ON order_items FOR SELECT TO authenticated
  USING (auth.email() = 'chezyanathy@gmail.com');

-- ── dishes : lecture (déjà publique), update admin ────────────
CREATE POLICY "admin_update_dishes"
  ON dishes FOR UPDATE TO authenticated
  USING  (auth.email() = 'chezyanathy@gmail.com')
  WITH CHECK (auth.email() = 'chezyanathy@gmail.com');

-- ── delivery_slots : lecture déjà publique, gestion admin ─────
CREATE POLICY "admin_insert_slots"
  ON delivery_slots FOR INSERT TO authenticated
  WITH CHECK (auth.email() = 'chezyanathy@gmail.com');

CREATE POLICY "admin_update_slots"
  ON delivery_slots FOR UPDATE TO authenticated
  USING  (auth.email() = 'chezyanathy@gmail.com')
  WITH CHECK (auth.email() = 'chezyanathy@gmail.com');

CREATE POLICY "admin_delete_slots"
  ON delivery_slots FOR DELETE TO authenticated
  USING (auth.email() = 'chezyanathy@gmail.com');

-- ── Activer le Realtime sur orders ───────────────────────────
-- Dans Supabase Dashboard → Database → Replication → orders → Enable
-- (ne peut pas être fait en SQL pur, doit être fait dans l'interface)
