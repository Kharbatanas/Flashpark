# Flashpark — Documentation Technique Complete

> Marketplace P2P de parking prive en France. Les proprietaires louent leurs places, les conducteurs reservent en quelques secondes.

**Version** : MVP 0.1.0
**Date** : Avril 2026
**Stack** : Next.js 14 + tRPC + Supabase + Drizzle ORM + Stripe (prevu)
**LOC** : ~18 000 lignes TypeScript/TSX

---

## 1. Architecture Generale

```
flashpark/
├── apps/
│   ├── web/          # App conducteur + hote (Next.js 14, port 3000)
│   └── admin/        # Back-office admin (Next.js 14, port 3001)
├── packages/
│   ├── api/          # tRPC routers (logique metier)
│   ├── db/           # Drizzle ORM schemas + client PostgreSQL
│   ├── ui/           # Composants UI partages (shadcn/ui)
│   ├── utils/        # Utilitaires partages
│   └── config/       # Config Tailwind/TS partagee
└── supabase/
    └── migrations/   # 4 fichiers SQL de migration
```

### Monorepo
- **Package manager** : pnpm (workspaces)
- **Partage de code** : packages/ exporte schemas, routers, composants UI
- **Typage end-to-end** : tRPC assure le typage du backend au frontend

---

## 2. Stack Technique

| Couche | Technologie | Role |
|--------|-------------|------|
| **Frontend** | Next.js 14 (App Router) | SSR + CSR, routing, middleware |
| **UI** | Tailwind CSS + shadcn/ui + Framer Motion | Design system, animations |
| **API** | tRPC v11 | API type-safe, pas de REST |
| **Auth** | Supabase Auth | Email/password, Google OAuth, Magic Link |
| **Base de donnees** | PostgreSQL (Supabase) | Heberge, RLS, triggers |
| **ORM** | Drizzle ORM | Requetes type-safe, migrations |
| **Carte** | Mapbox GL + react-map-gl | Carte interactive, geocoding |
| **Paiement** | Stripe (prevu) | Checkout, Connect (a implementer) |
| **Animations** | Framer Motion + Lottie | Scroll-linked, reveals, micro-interactions |
| **QR Code** | qrcode.react | Generation SVG cote client |
| **Cron** | pg_cron (PostgreSQL) | Transitions automatiques de statut |

---

## 3. Base de Donnees — 9 Tables

### Schema relationnel

```
users (1) ──< spots (N)
users (1) ──< vehicles (N)
users (1) ──< verification_documents (N)
users (1) ──< notifications (N)
spots (1) ──< bookings (N)
spots (1) ──< availability (N)
spots (1) ──< reviews (N)
bookings (1) ──< messages (N)
bookings (1) ──< reviews (1)
users (1) ──< bookings (N) [as driver]
```

### Tables detaillees

#### `users`
| Colonne | Type | Description |
|---------|------|-------------|
| id | UUID PK | ID interne |
| supabase_id | UUID UNIQUE | Lie a auth.users |
| email | TEXT UNIQUE | Email |
| full_name | TEXT | Nom complet |
| avatar_url | TEXT | Photo de profil |
| phone_number | TEXT | Telephone |
| role | ENUM | driver, host, both, admin |
| stripe_customer_id | TEXT | ID client Stripe |
| stripe_account_id | TEXT | ID Connect Stripe (host) |
| is_verified | BOOLEAN | Documents verifies |

#### `spots`
| Colonne | Type | Description |
|---------|------|-------------|
| id | UUID PK | |
| host_id | UUID FK→users | Proprietaire |
| title | TEXT | Titre de l'annonce |
| description | TEXT | Description libre |
| address | TEXT | Adresse postale |
| city | TEXT | Ville |
| latitude/longitude | NUMERIC | Coordonnees GPS |
| price_per_hour | NUMERIC(10,2) | Tarif horaire |
| price_per_day | NUMERIC(10,2) | Tarif journalier (optionnel) |
| type | ENUM | outdoor, indoor, garage, covered, underground |
| status | ENUM | active, inactive, pending_review |
| has_smart_gate | BOOLEAN | Barriere connectee |
| max_vehicle_height | NUMERIC(5,2) | Hauteur max en metres |
| photos | JSONB[] | URLs des photos |
| amenities | JSONB[] | Equipements |
| parking_instructions | TEXT | Instructions d'acces |
| instant_book | BOOLEAN | Reservation instantanee |
| rating | NUMERIC(3,2) | Note moyenne |
| review_count | INTEGER | Nombre d'avis |

#### `bookings`
| Colonne | Type | Description |
|---------|------|-------------|
| id | UUID PK | |
| driver_id | UUID FK→users | Conducteur |
| spot_id | UUID FK→spots | Place reservee |
| vehicle_id | UUID FK→vehicles | Vehicule (optionnel) |
| start_time | TIMESTAMPTZ | Debut |
| end_time | TIMESTAMPTZ | Fin |
| total_price | NUMERIC(10,2) | Prix TTC |
| platform_fee | NUMERIC(10,2) | Commission 20% |
| host_payout | NUMERIC(10,2) | Revenu host 80% |
| status | ENUM | pending, confirmed, active, completed, cancelled, refunded |
| qr_code | TEXT | Code QR auto-genere (FP-XXXXXXXX-YYMMDD) |
| access_granted | BOOLEAN | Acces accorde |

#### `vehicles`
| Colonne | Type | Description |
|---------|------|-------------|
| id | UUID PK | |
| owner_id | UUID FK→users | Proprietaire |
| license_plate | TEXT | Immatriculation |
| brand/model/color | TEXT | Infos vehicule |
| type | ENUM | sedan, suv, compact, van, motorcycle, electric |
| height | NUMERIC(4,2) | Hauteur en metres |
| is_default | BOOLEAN | Vehicule par defaut |

#### `messages`
| Colonne | Type | Description |
|---------|------|-------------|
| id | UUID PK | |
| booking_id | UUID FK→bookings | Reservation liee |
| sender_id | UUID FK→users | Expediteur |
| content | TEXT | Message |
| read_at | TIMESTAMPTZ | Lu le |

#### `reviews`
| Colonne | Type | Description |
|---------|------|-------------|
| id | UUID PK | |
| booking_id | UUID FK→bookings | 1 avis par reservation |
| reviewer_id | UUID FK→users | Auteur |
| spot_id | UUID FK→spots | Place notee |
| rating | INTEGER 1-5 | Note |
| comment | TEXT | Commentaire |

#### `availability`
| Colonne | Type | Description |
|---------|------|-------------|
| id | UUID PK | |
| spot_id | UUID FK→spots | Place |
| start_time | TIMESTAMPTZ | Debut du creneau |
| end_time | TIMESTAMPTZ | Fin du creneau |
| is_available | BOOLEAN | Disponible ou bloque |

#### `notifications`
| Colonne | Type | Description |
|---------|------|-------------|
| id | UUID PK | |
| user_id | UUID FK→users | Destinataire |
| type | TEXT | booking_confirmed, new_booking, etc. |
| title | TEXT | Titre |
| body | TEXT | Contenu |
| data | JSONB | Metadata (bookingId, etc.) |
| read_at | TIMESTAMPTZ | Lu le |

#### `verification_documents`
| Colonne | Type | Description |
|---------|------|-------------|
| id | UUID PK | |
| user_id | UUID FK→users | Utilisateur |
| type | ENUM | id_card, passport, drivers_license, proof_of_address, property_proof |
| file_url | TEXT | URL du fichier |
| status | ENUM | pending, approved, rejected |

---

## 4. Securite

### Row Level Security (RLS)
Toutes les tables ont RLS active. Politiques :
- **users** : lecture publique, ecriture par soi-meme
- **spots** : spots actifs publics, hosts gerent les leurs
- **bookings** : conducteurs voient/creent les leurs
- **reviews** : lecture publique, ecriture par le reviewer
- **vehicles** : CRUD par le proprietaire uniquement
- **messages** : lecture/ecriture par les participants de la reservation
- **notifications** : lecture/update par le destinataire
- **verification_documents** : lecture/upload par le proprietaire

### Middleware d'authentification
- **Routes protegees** : /dashboard, /host, /profile, /booking
- **Session** : JWT Supabase, refresh automatique
- **tRPC** : 3 niveaux de procedure (public, protected, host)

### Triggers DB (SECURITY DEFINER + search_path = public)
- `handle_new_user` : cree le profil public.users a l'inscription
- `generate_booking_qr` : genere le QR code a la confirmation
- `notify_booking_status_change` : notification sur changement de statut
- `notify_new_booking` : notification au host sur nouvelle reservation
- `update_spot_rating` : recalcule la note moyenne apres un avis

---

## 5. API — 9 Routers tRPC

### bookings (11 procedures)
| Procedure | Type | Auth | Description |
|-----------|------|------|-------------|
| create | mutation | protected | Cree une reservation (verifie conflits, dispo, hauteur vehicule, date future) |
| myBookings | query | protected | Reservations du conducteur |
| cancel | mutation | protected | Annulation par le conducteur |
| confirm | mutation | host | Host confirme une reservation pending |
| reject | mutation | host | Host refuse une reservation |
| bySpot | query | host | Toutes les reservations d'un spot (pour le planning) |
| checkSlot | query | public | Verifie si un creneau est disponible (temps reel) |
| verifyCode | query | public | Verifie un QR code/reference de reservation |

### spots (5 procedures)
| Procedure | Type | Auth | Description |
|-----------|------|------|-------------|
| nearby | query | public | Spots proches (Haversine, rayon max 1000km) |
| byId | query | public | Detail d'un spot |
| create | mutation | host | Cree une annonce |
| update | mutation | host | Modifie une annonce (titre, prix, photos, instructions...) |
| myListings | query | host | Annonces du host |

### users (3 procedures)
| Procedure | Type | Auth | Description |
|-----------|------|------|-------------|
| me | query | protected | Profil de l'utilisateur connecte |
| updateProfile | mutation | protected | Modifier nom, telephone, avatar |
| becomeHost | mutation | protected | Passer de driver a both |

### vehicles (4 procedures)
| Procedure | Type | Auth | Description |
|-----------|------|------|-------------|
| list | query | protected | Mes vehicules |
| create | mutation | protected | Ajouter un vehicule |
| update | mutation | protected | Modifier un vehicule |
| delete | mutation | protected | Supprimer un vehicule |

### messages (3 procedures)
| Procedure | Type | Auth | Description |
|-----------|------|------|-------------|
| byBooking | query | protected | Messages d'une reservation |
| send | mutation | protected | Envoyer un message |
| markRead | mutation | protected | Marquer comme lu |

### availability (4 procedures)
| Procedure | Type | Auth | Description |
|-----------|------|------|-------------|
| bySpot | query | protected | Creneaux d'un spot |
| set | mutation | host | Ajouter un creneau |
| delete | mutation | host | Supprimer un creneau |
| bulkSet | mutation | host | Ajouter plusieurs creneaux |

### notifications (4 procedures)
| Procedure | Type | Auth | Description |
|-----------|------|------|-------------|
| list | query | protected | Mes notifications |
| unreadCount | query | protected | Nombre de non-lues |
| markAllRead | mutation | protected | Tout marquer comme lu |
| markRead | mutation | protected | Marquer une notification |

### reviews (2 procedures)
| Procedure | Type | Auth | Description |
|-----------|------|------|-------------|
| bySpot | query | public | Avis d'un spot |
| create | mutation | protected | Laisser un avis |

### verification (2 procedures)
| Procedure | Type | Auth | Description |
|-----------|------|------|-------------|
| myDocuments | query | protected | Mes documents |
| submit | mutation | protected | Soumettre un document |

---

## 6. Pages & Workflows

### 6.1 App Web — 20 pages

#### Workflow Conducteur
```
Landing (/) → Recherche carte (/map) → Detail spot (/spot/:id)
→ Reservation (BookingWidget) → Confirmation (/booking/:id)
→ Dashboard (/dashboard) → Messages, QR code, Avis
```

| Page | Description |
|------|-------------|
| `/` | Landing page animee (Lottie, parallax, scroll reveals) |
| `/map` | Carte Mapbox interactive + filtres (type, prix) + geolocation auto |
| `/spot/:id` | Detail du parking (photos, amenities, avis, instructions, politique annulation) |
| `/booking/:id` | Confirmation avec QR code scannable, messagerie, avis |
| `/dashboard` | Reservations du conducteur (annuler, voir details) |
| `/login` | Connexion (email/mdp, Google, Magic Link) |
| `/profile` | Profil + devenir host |
| `/notifications` | Centre de notifications (badge dans navbar) |
| `/verify` | Verification QR code par le host |

#### Workflow Hote
```
Profil → Devenir hote → Creer annonce (/host/listings/new, 6 etapes)
→ Dashboard hote (/host) → Gerer annonces, planning, disponibilites
→ Accepter/refuser reservations → Verifier QR codes (/verify)
```

| Page | Description |
|------|-------------|
| `/host` | Dashboard (stats, reservations recentes, accept/refus) |
| `/host/listings` | Liste des annonces (activer/desactiver) |
| `/host/listings/new` | Wizard 6 etapes (type, adresse, details, photos, prix, resume) |
| `/host/listings/:id/edit` | Modifier annonce (photos, prix, instructions, equipements) |
| `/host/earnings` | Revenus (KPIs, graphique mensuel, par place) |
| `/host/availability` | Gestion des creneaux (disponible/bloque) |
| `/host/planning` | Planning (reservations a venir + historique + creneaux bloques) |
| `/host/verification` | Upload de documents (CNI, passeport, justificatifs) |

### 6.2 Admin — 9 pages

| Page | Description |
|------|-------------|
| `/` | Dashboard (users, spots, bookings, revenus, top spots) |
| `/spots` | Liste des annonces + filtre par statut |
| `/spots/:id` | Detail (infos, host, reservations, revenus) + changer statut |
| `/users` | Liste des utilisateurs + filtre par role |
| `/bookings` | Liste des reservations + filtre par statut + totaux |
| `/reviews` | Liste des avis |
| `/payments` | Transactions + revenus plateforme + breakdown mensuel |
| `/settings` | Config plateforme (lecture seule) : commission 20%, features |
| `/support` | Placeholder (a implementer) |

---

## 7. Logique Metier

### 7.1 Cycle de vie d'une reservation

```
         ┌─────────── CANCELLED (host rejette ou driver annule)
         │
PENDING ──┤─── CONFIRMED ──── ACTIVE ──── COMPLETED
         │         │
         │    (QR code genere)
         │
         └─── CANCELLED (expire si start_time passe, via pg_cron)
```

**Transitions automatiques** (pg_cron toutes les 5 min) :
- `confirmed` → `active` quand start_time est passe
- `active` → `completed` quand end_time est passe
- `pending` → `cancelled` quand start_time est passe (auto-expiration)

### 7.2 Anti-double reservation

3 niveaux de verification avant creation :
1. **Conflit booking** : verifie qu'aucune reservation active/confirmee ne chevauche le creneau
2. **Disponibilite host** : verifie que le host n'a pas bloque ce creneau
3. **Validation temporelle** : start_time doit etre dans le futur, start < end

L'utilisateur voit en temps reel si le creneau est dispo (indicateur vert/rouge dans le widget).

### 7.3 Verification hauteur vehicule
Si le vehicule a une hauteur renseignee et le spot a un max_vehicle_height, la reservation est refusee si le vehicule est trop haut.

### 7.4 Commission
- **Taux** : 20% plateforme / 80% host
- **Calcul** : totalPrice = heures * prix_horaire, platformFee = 20%, hostPayout = 80%

### 7.5 QR Code
- **Generation** : trigger DB a la confirmation (`FP-XXXXXXXX-YYMMDD`)
- **Affichage** : QR SVG scannable sur la page de reservation
- **Verification** : le QR encode l'URL `/verify?code=FP-XXX`, le host scanne pour valider
- **Resultat** : affiche validite, statut, dates, nom du parking

### 7.6 Notifications
Triggers PostgreSQL automatiques sur :
- Nouvelle reservation → notification au host
- Confirmation → notification au conducteur
- Annulation → notification a l'autre partie
- Activation → notification au conducteur
- Completion → notification aux deux parties

Badge non-lues dans la navbar (poll 30s).

---

## 8. Composants Cles

| Composant | Fonction |
|-----------|----------|
| `BookingWidget` | Selecteur date/heure + vehicule + verif dispo temps reel + reservation |
| `SpotMap` | Carte Mapbox + geolocation + filtres + recherche autocomplete + markers |
| `BookingMessages` | Chat driver↔host par reservation (polling 10s) |
| `Navbar` | Navigation + auth + badge notifications |
| `SpotContent` | Detail parking (photos, amenities, avis, instructions, politique annulation) |
| `RevenueSimulator` | Calculateur interactif de revenus host (3 sliders) |

---

## 9. Ce qui fonctionne (MVP)

- [x] Inscription/connexion (email, Google, Magic Link)
- [x] Recherche de places sur carte interactive avec filtres
- [x] Geolocation automatique
- [x] Detail d'un parking (photos, equipements, avis, instructions)
- [x] Reservation avec verification de disponibilite en temps reel
- [x] Selection de vehicule + verification hauteur
- [x] QR code scannable + page de verification host
- [x] Messagerie driver ↔ host par reservation
- [x] Notifications automatiques (DB triggers)
- [x] Dashboard conducteur (reservations, annulation)
- [x] Dashboard hote (stats, accept/refus, planning, revenus)
- [x] Creation/edition d'annonce (6 etapes, photos, instructions)
- [x] Gestion des disponibilites (creneaux dispo/bloques)
- [x] Upload de documents de verification
- [x] Cycle de vie automatique des reservations (pg_cron)
- [x] Admin : gestion spots, users, bookings, revenus
- [x] Avis et notes (avec recalcul automatique de la moyenne)
- [x] Landing page animee (Lottie, parallax, simulateur interactif)

## 10. Ce qui reste a faire

| Feature | Priorite | Description |
|---------|----------|-------------|
| Stripe Connect | P0 | Paiement reel + virements aux hosts |
| Webhooks Stripe | P0 | Confirmer paiement → confirmer booking |
| Refund Stripe | P1 | Remboursement sur annulation |
| Email transactionnel | P1 | Confirmation par email (Resend/Supabase) |
| Admin : gestion users | P2 | Bannir, verifier, modifier roles |
| Admin : moderation avis | P2 | Supprimer avis inappropries |
| Admin : approbation docs | P2 | Valider/refuser documents de verification |
| App mobile | P3 | React Native ou PWA |
| Smart Gate hardware | P3 | Integration Parklio IoT |
| Reservations recurrentes | P3 | Abonnements pour navetteurs |
| Favoris | P3 | Sauvegarder des spots |

---

## 11. Variables d'Environnement

### Web App (apps/web/.env.local)
```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
DATABASE_URL=
STRIPE_SECRET_KEY=
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=
STRIPE_WEBHOOK_SECRET=
NEXT_PUBLIC_MAPBOX_TOKEN=
NEXT_PUBLIC_APP_URL=
```

### Admin (apps/admin/.env.local)
```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
```

---

## 12. Commandes

```bash
# Installation
pnpm install

# Dev
pnpm --filter @flashpark/web dev      # Web sur :3000
pnpm --filter @flashpark/admin dev    # Admin sur :3001

# Build
pnpm --filter @flashpark/web build
pnpm --filter @flashpark/admin build

# Type check
pnpm -r type-check
```

---

*Document genere le 5 avril 2026 — Flashpark MVP v0.1.0*
