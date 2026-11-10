-- ============================================================
-- 0006 — Allergènes des plats
-- À exécuter dans : Supabase Dashboard → SQL Editor
-- Sans risque à rejouer (IF NOT EXISTS).
--
-- NULL  = pas encore renseigné par la cuisine (l'app l'indique au client)
-- '{}'  = aucun des 14 allergènes réglementés
-- sinon = la liste, ex. '{Arachides,Poisson}'
-- ============================================================

ALTER TABLE dishes
  ADD COLUMN IF NOT EXISTS allergens text[];

COMMENT ON COLUMN dishes.allergens IS
  'Allergènes à déclaration obligatoire. NULL = non renseigné, {} = aucun.';
