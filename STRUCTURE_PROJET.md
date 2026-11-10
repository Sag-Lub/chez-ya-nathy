# Chez ya Nathy — Structure du projet

Application de commande mobile de Chez ya Nathy : cuisine congolaise en livraison et à emporter,
avec un tableau de bord pour la cuisine.

Stack : Next.js 16 (App Router, Turbopack) · TypeScript · Tailwind CSS v4 · Supabase
(Postgres, Auth par lien magique, Realtime, RLS) · Stripe Checkout · Resend · Zustand · Vercel.

En cas de contradiction entre ce document et le code, le code fait foi.

---

## Arborescence

```
app/
├── layout.tsx                     # Polices (Fraunces + Inter), métadonnées, écrans de lancement PWA
├── globals.css                    # Palette (bloc @theme), verre, mouvements — pas de tailwind.config
├── manifest.ts                    # Manifest PWA (fond de lancement liboke)
├── not-found.tsx                  # Page 404
├── (client)/                      # Parcours client, avec la navigation basse
│   ├── page.tsx                   # 1-2. Onboarding (première visite) + accueil / menu
│   ├── plat/[slug]/               # 3. Fiche plat : piquant, options, histoire, allergènes
│   ├── commande/                  # 5. Commande en trois étapes
│   │   └── confirmation/          # 6. Confirmation
│   └── suivi/                     # 7. Suivi : /suivi (dernière commande) et /suivi/<token>
├── admin/
│   ├── login/                     # Lien magique — HORS du layout gardé (sinon boucle de redirections)
│   └── (protected)/               # Tableau de bord cuisine : commandes, plats, créneaux
├── api/
│   ├── checkout/route.ts          # Vérifie tout, recalcule le total, crée la session Stripe
│   │                              # ou la commande en espèces
│   ├── webhooks/stripe/route.ts   # checkout.session.completed → crée orders + order_items
│   └── track/[token]/route.ts     # Lecture d'une commande par public_token
└── auth/                          # Retour du lien magique, déconnexion

components/
├── brand/                         # Logo (PNG officiel) + tracés vectorisés pour l'animation
├── onboarding/                    # Écran de bienvenue animé, trois slides, illustrations SVG
├── home/ · menu/                  # Accueil, filtres, cartes de plats
├── cart/                          # 4. Panneau du panier
├── nav/                           # Navigation basse flottante (Menu, Panier, Suivi)
├── admin/                         # Commandes, plats, créneaux
└── ui/                            # Bouton, photo de plat, icônes maison, frise du bracelet

lib/
├── config.ts                      # Réglages métier (marque, précommande, clés de stockage)
├── labels.ts                      # Libellés partagés : piquant, statuts, allergènes
├── preorder.ts                    # Week-end, heure limite, délai de préparation (heure de Paris)
├── kitchen.ts                     # Requête des commandes du tableau de bord
├── email.ts · resend.ts           # Email de confirmation
├── stripe.ts                      # Client Stripe (serveur)
└── supabase/                      # client.ts (navigateur), server.ts (cookies), admin.ts (service role)

store/cart.ts                      # Panier Zustand, conservé dans le navigateur
proxy.ts                           # Rafraîchit la session Supabase (remplace middleware.ts en Next 16)
supabase/migrations/               # 0001 à 0008, à exécuter dans l'ordre dans le SQL Editor
```

---

## Variables d'environnement

`.env.local` en local, variables d'environnement Vercel en production. Jamais dans git ni dans un chat.

```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=     # clé JWT « legacy » anon (commence par eyJ)
SUPABASE_SERVICE_ROLE_KEY=         # clé JWT « legacy » service_role — serveur uniquement
STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=             # commence par whsec_
RESEND_API_KEY=
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

---

## Direction artistique

Mobile d'abord, chaleureux, bold : aplats pleins, titres forts, grandes photos rondes qui débordent.

| Nom     | Hex       | Usage                                                        |
|---------|-----------|--------------------------------------------------------------|
| liboke  | `#E2572B` | Couleur principale : boutons, accents, états actifs          |
| braise  | `#BC4219` | Liboke foncé : petit texte d'accent sur fond clair (contraste) |
| safou   | `#F4A93B` | Badges, mises en avant, vapeur du logo                       |
| pili    | `#B23A2E` | Piquant, pastilles de nombre, alertes douces                 |
| feuille | `#4F7A4A` | Végétarien, disponible (moins de 10 % d'une page)            |
| kwanga  | `#FAF3E8` | Fond principal — jamais de blanc pur                         |
| encre   | `#2B1B12` | Texte et contours — jamais de noir pur                       |

- **Typographie** : Fraunces pour les titres (classe `titre`, jamais en petit corps), Inter pour le reste.
- **Une seule action principale par écran**, en pilule liboke pleine (`Button` variante `primary`).
  Sur fond liboke, uniquement du grand texte (19 px gras ou plus) pour tenir le contraste AA.
- **Verre** (classe `verre`) uniquement sur ce qui flotte : navigation basse, panneau du panier,
  barre d'action de la fiche plat. Avec `-webkit-backdrop-filter` et un repli sans flou.
- **Aucun emoji** dans l'interface : icônes Lucide ou SVG maison (`components/ui/icons.tsx`).
- **Ton** : on tutoie, on parle comme à la maison, quelques mots de lingala dosés.
- **Tableau de bord cuisine** : un outil. Fond clair, contraste fort, pas de verre, gros boutons.

---

## Les 7 règles d'architecture à ne jamais casser

1. **Les prix sont des entiers en centimes** partout (base, API, Stripe). L'euro n'apparaît qu'à
   l'affichage (`formatPrice`).
2. **Le total est recalculé côté serveur** dans `/api/checkout`, à partir des prix en base.
   Rien de ce que le navigateur envoie n'est cru : ni prix, ni total, ni quantités, ni options.
3. **Une commande n'est créée que par le serveur** : le webhook Stripe pour la carte, la route
   `/api/checkout` pour les espèces. Aucun `INSERT` depuis le navigateur.
4. **La clé `service_role` reste dans `app/api/`** (via `lib/supabase/admin.ts`, marqué `server-only`).
5. **Le suivi sans compte passe par `public_token`** (`/suivi/<token>`), jamais par l'identifiant
   de commande. `/api/track` ne renvoie ni téléphone, ni email, ni identifiants Stripe.
6. **La RLS reste activée sur toutes les tables.** Les droits admin passent par une seule méthode :
   `is_admin()`, c'est-à-dire `profiles.role = 'admin'` (migration 0007). Le layout du tableau de
   bord lit le même `profiles.role`.
7. **Aucun secret dans le code, dans git ou dans un chat.**

---

## Flux de commande

```
Panier (Zustand)
  → POST /api/checkout     contrôle le panier, la zone, le minimum, le créneau, les plats du
                           week-end et le délai de préparation, puis recalcule le total
  → carte   : Stripe Checkout → webhook checkout.session.completed → orders + order_items
    espèces : orders + order_items créés directement par la route
  → /commande/confirmation?token=…
  → /suivi/<token>         rafraîchi toutes les 5 s via /api/track

Cuisine : /admin
  → commandes en direct (Supabase Realtime sur orders, relecture de secours toutes les 20 s)
  → un bouton par étape : confirmée → en cuisine → en livraison → livrée
  → chaque changement met à jour orders.status ; le client le voit sans recharger
```

Statuts (`order_status`) : `recue`, `confirmee`, `en_cuisine`, `en_livraison`, `livree`, `annulee`.

---

## Migrations

À exécuter dans l'ordre, dans Supabase → SQL Editor.

| Fichier                         | Contenu                                                          |
|---------------------------------|------------------------------------------------------------------|
| `0001_init_chez_ya_nathy.sql`   | Schéma, RLS, triggers, Realtime                                  |
| `0002_grants_and_seed.sql`      | Droits et premières données                                      |
| `0003_admin_rls.sql`            | Anciennes policies admin par email (remplacées par 0007)         |
| `0004_extra_columns.sql`        | Sous-titre, univers culinaire, populaire, mode de paiement       |
| `0005_full_seed.sql`            | Carte complète                                                   |
| `0006_allergenes.sql`           | Colonne `dishes.allergens`                                       |
| `0007_droits_admin_unifies.sql` | Droits admin par `is_admin()` uniquement ; rôle non modifiable   |
| `0008_modes_de_paiement.sql`    | Valeurs `carte` / `especes` du mode de paiement                  |

---

## Lancer en local

```bash
npm install
npm run dev
```

Webhook Stripe en local, dans un second terminal :

```bash
stripe listen --forward-to localhost:3000/api/webhooks/stripe
```

Carte de test : `4242 4242 4242 4242`, date future, CVC quelconque.
