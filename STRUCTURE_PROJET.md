# Nathy Food — Structure du projet Next.js

Stack : Next.js (App Router) + TypeScript + Tailwind CSS + Supabase + Stripe + Vercel.
Application PWA mobile-first, avec dashboard cuisine intégré.

---

## Arborescence

```
nathy-food/
├── app/
│   ├── (client)/                      # Groupe de routes côté client
│   │   ├── page.tsx                   # Accueil = le menu (c'est la page la plus importante)
│   │   ├── plat/[slug]/page.tsx       # Fiche plat : photos, options, piquant, histoire du plat
│   │   ├── panier/page.tsx            # Panier + choix livraison/emporter
│   │   ├── commande/
│   │   │   ├── page.tsx               # Tunnel : coordonnées → zone → créneau → paiement
│   │   │   └── confirmation/page.tsx  # Retour Stripe (succès)
│   │   └── suivi/[token]/page.tsx     # Suivi temps réel via public_token (sans compte)
│   │
│   ├── admin/                         # Dashboard cuisine (tablette de Nathy)
│   │   ├── layout.tsx                 # Garde d'accès : rôle admin obligatoire
│   │   ├── page.tsx                   # Commandes en temps réel, changement de statut
│   │   ├── plats/page.tsx             # Gestion du menu + bouton "épuisé"
│   │   └── creneaux/page.tsx          # Création des créneaux de la semaine
│   │
│   ├── api/
│   │   ├── checkout/route.ts          # Crée la session Stripe Checkout (calcule le total CÔTÉ SERVEUR)
│   │   ├── webhooks/stripe/route.ts   # checkout.session.completed → crée la commande (service role)
│   │   └── track/[token]/route.ts     # Lecture d'une commande invité via public_token
│   │
│   ├── layout.tsx                     # Fonts (Fraunces + Inter), couleurs, <meta> PWA
│   ├── manifest.ts                    # Manifest PWA (icône liboke, mode standalone)
│   └── globals.css
│
├── components/
│   ├── ui/                            # Boutons, inputs, badges (design system maison)
│   ├── menu/                          # DishCard, CategoryTabs, SpicePicker
│   ├── cart/                          # CartSheet, CartItem, SlotPicker
│   └── admin/                         # OrderCard, StatusButton, AvailabilityToggle
│
├── lib/
│   ├── supabase/
│   │   ├── client.ts                  # Client navigateur (clé anon)
│   │   ├── server.ts                  # Client serveur (cookies) — composants serveur
│   │   └── admin.ts                   # Client service role — UNIQUEMENT dans app/api/
│   ├── stripe.ts                      # Instance Stripe côté serveur
│   ├── types.ts                       # Types générés : npx supabase gen types typescript
│   └── utils.ts                       # formatPrice(cents), formatSlot(date)...
│
├── store/
│   └── cart.ts                        # Zustand : panier persisté en localStorage
│
├── supabase/
│   └── migrations/
│       └── 0001_init_nathy_food.sql   # Le schéma livré avec ce document
│
├── public/
│   ├── icons/                         # Icônes PWA 192/512px (le liboke)
│   └── images/                        # Fallbacks
│
├── .env.local                         # Voir variables ci-dessous
├── tailwind.config.ts                 # Palette de la charte (voir ci-dessous)
└── next.config.ts
```

---

## Variables d'environnement (.env.local)

```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=        # jamais exposée au navigateur — API routes uniquement
STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

---

## Palette Tailwind (charte graphique)

```ts
// tailwind.config.ts — extend.colors
colors: {
  liboke:     '#E2572B',   // orange principal — boutons, accents
  safou:      '#F4A93B',   // jaune doré — badges, highlights
  pili:       '#B23A2E',   // terracotta — états, piquant
  feuille:    '#4F7A4A',   // vert — badge végé, "nouveau" (usage < 10 %)
  kwanga:     '#FAF3E8',   // crème — fond principal (jamais de blanc pur)
  encre:      '#2B1B12',   // brun — tout le texte (jamais de noir pur)
}
```

Fonts dans `app/layout.tsx` via `next/font/google` : `Fraunces` (titres) + `Inter` (texte).

---

## Les 5 règles d'architecture à ne jamais casser

1. **Les prix sont en centimes** (integer) partout : BDD, API, Stripe. La conversion
   en euros n'existe qu'à l'affichage (`formatPrice`).
2. **Le total est recalculé côté serveur** dans `/api/checkout` à partir des prix en
   BDD. On ne fait JAMAIS confiance au total envoyé par le navigateur.
3. **Les commandes naissent dans le webhook Stripe**, pas avant. Pas de paiement
   validé = pas de ligne dans `orders`. C'est le service role qui insère (aucune
   policy INSERT côté client, c'est voulu dans le schéma).
4. **La clé service role ne sort jamais de `app/api/`**. Les composants clients
   n'utilisent que la clé anon + RLS.
5. **Le suivi invité passe par `public_token`** (lien envoyé par email/SMS après
   commande), jamais par l'id de commande.

---

## Flux de commande (le cœur de l'app)

```
Panier (Zustand) 
  → POST /api/checkout        (vérifie zone + créneau + recalcule le total)
  → Stripe Checkout           (page de paiement hébergée — zéro PCI à gérer)
  → webhook stripe            (paiement OK → INSERT orders + order_items, service role)
  → redirect /commande/confirmation?token=...
  → page /suivi/[token]       (abonnement Supabase Realtime sur le statut)

Côté cuisine :
/admin → liste temps réel des commandes "recue" 
       → boutons de statut : confirmée → en cuisine → en livraison → livrée
       → chaque clic met à jour orders.status → le client voit le changement en direct
```

---

## Ordre de développement recommandé (sprints Claude Code)

**Sprint 1 — le socle (2-3 sessions)**
1. `create-next-app` + Tailwind + palette + fonts + manifest PWA
2. Projet Supabase + exécution de la migration 0001 + seed (catégories + 5 plats tests)
3. Page menu (accueil) + fiche plat — en lecture seule

**Sprint 2 — la commande (3-4 sessions)**
4. Panier Zustand + sheet panier
5. Tunnel de commande : zone (code postal) → créneau → coordonnées
6. `/api/checkout` + Stripe Checkout (mode test) + webhook + création commande
7. Page confirmation + page suivi temps réel

**Sprint 3 — la cuisine (2 sessions)**
8. Auth Supabase (lien magique) + garde admin
9. Dashboard commandes temps réel + changement de statut + bouton "épuisé"
10. Gestion des créneaux de la semaine

**Sprint 4 — finitions lancement**
11. Emails transactionnels (Resend) : confirmation + lien de suivi
12. Précommande (lead_time_hours) + calendrier des plats (available_days)
13. Tests de bout en bout en conditions réelles (vraie commande, vraie livraison)

---

## Premier prompt à donner à Claude Code

> Initialise un projet Next.js 15 (App Router, TypeScript, Tailwind) nommé
> nathy-food. Configure la palette Tailwind et les fonts selon STRUCTURE_PROJET.md
> (à la racine du repo). Crée l'arborescence des dossiers décrite, les trois clients
> Supabase dans lib/supabase/, et le store Zustand du panier. Ne code pas encore
> les pages — juste le socle qui compile.

Puis avance sprint par sprint, une fonctionnalité par session, en lui redonnant
ce document comme contexte.
