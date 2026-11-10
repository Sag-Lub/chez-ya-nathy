-- ============================================================
-- 0008 — Valeurs du mode de paiement
-- À exécuter dans : Supabase Dashboard → SQL Editor. Sans risque à rejouer.
--
-- Le code écrit 'carte' ou 'especes' dans orders.payment_method, alors que
-- la migration 0004 crée un type qui n'accepte que 'card' et 'cash'.
-- Si ta base a été créée à partir de 0004, cette migration ajoute les deux
-- valeurs attendues par le code. Si ta colonne accepte déjà 'carte' et
-- 'especes', elle ne change rien.
-- ============================================================

do $$
begin
  if exists (select 1 from pg_type where typname = 'payment_method_type') then
    execute 'alter type payment_method_type add value if not exists ''carte''';
    execute 'alter type payment_method_type add value if not exists ''especes''';
  end if;
end $$;

-- Vérification : type de la colonne et valeurs acceptées
select c.udt_name as type_colonne,
       (select string_agg(e.enumlabel, ', ' order by e.enumsortorder)
          from pg_enum e join pg_type t on t.oid = e.enumtypid
         where t.typname = c.udt_name) as valeurs_acceptees
from information_schema.columns c
where c.table_name = 'orders' and c.column_name = 'payment_method';
