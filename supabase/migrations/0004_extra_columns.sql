-- Colonnes ajoutées après le schéma initial
ALTER TABLE dishes
  ADD COLUMN IF NOT EXISTS subtitle        text,
  ADD COLUMN IF NOT EXISTS culinary_origin text CHECK (culinary_origin IN ('congolese', 'african_selection')),
  ADD COLUMN IF NOT EXISTS is_featured     boolean NOT NULL DEFAULT false;

CREATE TYPE payment_method_type AS ENUM ('card', 'cash');
ALTER TABLE orders
  ADD COLUMN IF NOT EXISTS payment_method payment_method_type NOT NULL DEFAULT 'card';
