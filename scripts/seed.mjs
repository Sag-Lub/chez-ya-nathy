// Seed : 2 catégories + 3 plats + options — via REST API (contourne RLS avec service role)
// Usage : node scripts/seed.mjs
import { readFileSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const env = Object.fromEntries(
  readFileSync(join(__dirname, '../.env.local'), 'utf8')
    .split('\n')
    .filter(l => l.includes('='))
    .map(l => { const [k, ...v] = l.split('='); return [k.trim(), v.join('=').trim()] })
)

const BASE = env.NEXT_PUBLIC_SUPABASE_URL + '/rest/v1'
const KEY  = env.SUPABASE_SERVICE_ROLE_KEY

const headers = {
  'Content-Type': 'application/json',
  apikey: KEY,
  Authorization: `Bearer ${KEY}`,
  Prefer: 'return=representation',
}

async function rest(method, path, body) {
  const res = await fetch(`${BASE}${path}`, { method, headers, body: body ? JSON.stringify(body) : undefined })
  const text = await res.text()
  if (!res.ok) throw new Error(`${method} ${path} → ${res.status}: ${text}`)
  return text ? JSON.parse(text) : null
}

async function seed() {
  // Vérifier si déjà seedé
  const existing = await rest('GET', '/categories?select=id&limit=1')
  if (existing?.length > 0) {
    console.log('ℹ️  Déjà seedé — supprime les données manuellement pour re-seeder.')
    process.exit(0)
  }

  // ─── Catégories ───────────────────────────────────────────────
  const cats = await rest('POST', '/categories', [
    { name: 'Plats cuisinés',  slug: 'plats-cuisines',  sort_order: 1 },
    { name: 'Accompagnements', slug: 'accompagnements', sort_order: 2 },
  ])
  console.log('✅ Catégories insérées')

  const platsId = cats.find(c => c.slug === 'plats-cuisines').id

  // ─── Plats ────────────────────────────────────────────────────
  const dishes = await rest('POST', '/dishes', [
    {
      category_id:        platsId,
      name:               'Poulet à la moambe',
      slug:               'poulet-moambe',
      description:        "Mijoté doucement dans la sauce à la noix de palme avec légumes frais et épices maison. La recette de famille de Nathy, transmise depuis Kinshasa.",
      price_cents:        1350,
      region:             'Kinshasa',
      is_available:       true,
      spice_customizable: true,
      sort_order:         1,
    },
    {
      category_id:        platsId,
      name:               'Pondu sauce arachide',
      slug:               'pondu-sauce-arachide',
      description:        "Feuilles de manioc pilées, mijotées avec pâte d'arachide maison et épices du marché. 100 % végétarien, goût authentique du Bandundu.",
      price_cents:        1100,
      region:             'Bandundu',
      is_available:       true,
      spice_customizable: true,
      sort_order:         2,
    },
    {
      category_id:        platsId,
      name:               'Makayabu aux haricots',
      slug:               'makayabu-haricots',
      description:        "Poisson salé revisité avec haricots rouges, tomates fraîches et légumes de saison. Le classique du dimanche chez Nathy.",
      price_cents:        1450,
      region:             'Kinshasa',
      is_available:       true,
      spice_customizable: false,
      sort_order:         3,
    },
  ])
  console.log('✅ Plats insérés')

  const moambeId = dishes.find(d => d.slug === 'poulet-moambe').id
  const ponduId  = dishes.find(d => d.slug === 'pondu-sauce-arachide').id

  // ─── Options ──────────────────────────────────────────────────
  await rest('POST', '/dish_options', [
    { dish_id: moambeId, name: 'Riz blanc',               extra_price_cents: 0,   sort_order: 1 },
    { dish_id: moambeId, name: 'Chikwangue',              extra_price_cents: 0,   sort_order: 2 },
    { dish_id: moambeId, name: 'Supplément sauce moambe', extra_price_cents: 150, sort_order: 3 },
    { dish_id: ponduId,  name: 'Riz blanc',               extra_price_cents: 0,   sort_order: 1 },
    { dish_id: ponduId,  name: 'Chikwangue',              extra_price_cents: 0,   sort_order: 2 },
  ])
  console.log('✅ Options insérées')
  console.log('\n🎉 Seed terminé ! Lance npm run dev pour voir le menu.')
}

seed().catch(err => { console.error('❌', err.message); process.exit(1) })
