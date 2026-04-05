# Flashpark — Full Redesign Implementation Plan

**Created:** 2026-04-05
**Scope:** Website redesign + Mobile app redesign & bug fixes
**Goal:** Airbnb-level quality and UX for both platforms

---

## Phase 0: Foundation & Design System Alignment

### Problem
Web uses cyan `#06B6D4` as primary, mobile uses blue `#0540FF`. Design language is inconsistent across platforms. Need a unified design system before touching any screens.

### Tasks

#### 0.1 — Unify Color System
- **Decision:** Use `#0540FF` (Flashpark blue) as the primary brand color across BOTH platforms. It's bolder, more distinctive, and already the mobile/app icon color.
- **Web:** Update `tailwind.config.ts` primary colors and `globals.css` CSS variables
- **Mobile:** Already using `#0540FF`, no change needed

#### 0.2 — Design Tokens
Create a shared design reference:
```
Primary:     #0540FF (brand blue)
PrimaryLight:#EFF6FF
Secondary:   #F8FAFC (background)
Success:     #10B981
Warning:     #F59E0B
Danger:      #EF4444
Dark:        #1A1A2E
Text:        #111827
TextMuted:   #6B7280
Border:      #E5E7EB
Card:        #FFFFFF
Background:  #F9FAFB
```

#### 0.3 — Database Migration: Add Favorites/Wishlists Table
```sql
CREATE TABLE wishlists (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  spot_id UUID NOT NULL REFERENCES spots(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, spot_id)
);
```

#### 0.4 — New tRPC Router: Wishlists
- `wishlists.list` (protected) — Get user's wishlisted spots
- `wishlists.toggle` (protected) — Add/remove spot from wishlist
- `wishlists.check` (protected) — Check if spot is wishlisted

#### Verification
- [ ] Web and mobile render same brand blue
- [ ] Wishlists table exists and API works
- [ ] All existing tests still pass

---

## Phase 1: Website Redesign — Core Pages

### 1.1 — New Navbar (Airbnb-style)
**File:** `apps/web/src/components/navbar.tsx`

**Design:**
- Sticky top bar with white background + subtle shadow on scroll
- Left: Flashpark logo (blue)
- Center: Search pill with 3 sections: "Où · Quand · Type" (like Airbnb's "Anywhere | Any week | Add guests")
- Right: "Devenir hôte" link, notification bell, user avatar dropdown
- Mobile: Hamburger menu, simplified search bar
- On scroll: Compact mode with smaller search pill

**Pattern:** Keep existing Framer Motion animations but update colors/layout.

### 1.2 — Landing Page Redesign
**File:** `apps/web/src/app/page.tsx`

**Sections (Airbnb-inspired):**
1. **Hero:** Full-width with gradient overlay on parking photo. Large search bar front-and-center. Tagline: "Arrêtez de chercher. Réservez." City quick-links below.
2. **Category Cards:** Horizontal scroll of parking types (Extérieur, Garage, Couvert, Souterrain, Smart Gate) with photos — like Airbnb category tabs
3. **Popular Near You:** Grid of spot cards (photo, price badge, rating, title, city) — 4 columns desktop, 2 mobile
4. **How It Works:** 3-step visual (Cherchez → Réservez → Garez-vous) with illustrations
5. **Host CTA:** Split section — left copy + right earnings calculator
6. **Trust Section:** Security badges, insurance mention, review stats
7. **Footer:** Clean 4-column with links, social, legal

### 1.3 — Map Page Redesign (Split View)
**File:** `apps/web/src/app/(main)/map/page.tsx` + `apps/web/src/components/map/spot-map.tsx`

**Design (Airbnb map page):**
- **Left panel (50%):** Scrollable list of spot cards with filters at top
  - Filter bar: Type pills, price range, smart gate toggle, instant book toggle
  - Spot cards: Photo, price/hour overlay, title, rating, type badge
  - Hover on card → highlight marker on map
- **Right panel (50%):** Full-height Mapbox map
  - Price markers (rounded pills with €/h)
  - Click marker → popup card with photo + book button
  - Map moves → list updates
- **Mobile:** Full map with bottom sheet list (drag up to see list)

### 1.4 — Spot Detail Page Redesign
**File:** `apps/web/src/app/(main)/spot/[id]/spot-content.tsx`

**Design (Airbnb listing page):**
- **Photo Gallery:** Top section with 1 large + 4 small grid (click to open lightbox)
- **Two-column layout below:**
  - **Left (60%):**
    - Title, city, rating, review count
    - Host card (avatar, name, "Hôte depuis...", response rate)
    - Description with "Lire la suite" truncation
    - Amenities grid (icons + labels)
    - Parking instructions (collapsible)
    - Location map (small static Mapbox)
    - Reviews section (average rating bars + individual reviews)
  - **Right (40%):**
    - Sticky booking widget (follows scroll)
    - Price/hour, date/time pickers, vehicle selector
    - Price breakdown, total, book button
    - Cancellation policy note

### 1.5 — Booking Confirmation Page
**File:** `apps/web/src/app/(main)/booking/[id]/booking-content.tsx`

**Design:**
- Success header with checkmark animation
- QR code card (prominent, centered)
- Booking details: spot photo + info, dates, price breakdown
- Action buttons: Message host, View on map, Download receipt
- "What's next" section with instructions

### Verification
- [ ] Navbar responsive on mobile/tablet/desktop
- [ ] Landing page loads under 3s, all sections render
- [ ] Map split view works, list-map interaction syncs
- [ ] Spot detail has photo gallery, sticky booking widget
- [ ] Booking page shows QR code and all details

---

## Phase 2: Website Redesign — Dashboard & Host Pages

### 2.1 — Driver Dashboard
**File:** `apps/web/src/app/(main)/dashboard/page.tsx`

**Design:**
- Tab navigation: En cours | À venir | Passées
- Booking cards: Spot photo, title, dates, status badge, price, action buttons
- Each card expandable for details
- Empty states with CTAs

### 2.2 — Host Dashboard Redesign
**File:** `apps/web/src/app/(main)/host/page.tsx`

**Design (Airbnb Host Dashboard):**
- Welcome header with earnings summary
- Quick stats row: Revenus ce mois, Réservations, Taux d'occupation, Note moyenne
- Pending actions section (bookings to confirm)
- Recent activity feed
- Quick links: Annonces, Calendrier, Revenus, Messages

### 2.3 — Host Listings Page
**File:** `apps/web/src/app/(main)/host/listings/page.tsx`

- Grid of listing cards with status toggle
- Each card: Photo, title, price, status (active/inactive), rating
- "Créer une annonce" prominent button

### 2.4 — Profile Page
**File:** `apps/web/src/app/(main)/profile/page.tsx`

**Design:**
- Sidebar navigation (like Airbnb account page)
- Sections: Infos personnelles, Sécurité, Paiements, Notifications, Véhicules
- Clean form layouts with save buttons per section

### 2.5 — New Pages: Wishlist
**File:** `apps/web/src/app/(main)/wishlists/page.tsx`

- Grid of wishlisted spots
- Remove button on each card
- Empty state: "Explorez les places" CTA

### Verification
- [ ] Dashboard tabs filter correctly
- [ ] Host dashboard shows real stats
- [ ] Profile sections save correctly
- [ ] Wishlists page shows saved spots

---

## Phase 3: Mobile App Redesign — Core Screens

### 3.1 — Home Screen (Airbnb-style)
**File:** `apps/mobile/app/(tabs)/index.tsx`

**New Design:**
- **Top:** Search bar (pill-shaped, tappable → navigates to search)
- **Category Tabs:** Horizontal scroll of parking types with icons (like Airbnb categories)
  - Extérieur ☀️ | Garage 🏠 | Couvert ⛱️ | Souterrain 🚇 | Smart Gate ⚡
- **Spot Grid:** 2-column grid of cards
  - Full-width photo with heart button (wishlist)
  - Price badge overlay (bottom-left)
  - Title, city, rating below photo
  - Swipeable photo carousel per card (like Airbnb)
- **Pull-to-refresh**
- Remove greeting header (not Airbnb pattern — search is king)

### 3.2 — Search Screen Redesign
**File:** `apps/mobile/app/(tabs)/search.tsx`

**New Design:**
- **Search header:** Text input with cancel button
- **Recent searches** section (persisted in AsyncStorage)
- **Filter chips:** Type, Price, Smart Gate, Instant Book
- **Results:** Toggle between List and Map (bottom toggle button)
- **Map mode:** Full map with bottom sheet (BottomSheet from @gorhom/bottom-sheet)
  - Drag up: See list of nearby spots
  - Tap marker: Sheet shows spot preview card
- **List mode:** Vertical card list with photos

### 3.3 — Spot Detail Screen Redesign
**File:** `apps/mobile/app/spot/[id].tsx`

**New Design (Airbnb listing):**
- **Photo carousel** (full-width, dots indicator, share/heart buttons)
- **ScrollView body:**
  - Price/night + rating row
  - Title (large)
  - Address with map pin
  - Divider
  - Host card (avatar, name, member since, verified badge)
  - Divider
  - Description (with "Lire la suite" expand)
  - Divider
  - Amenities list (icon + label, 2 columns)
  - Divider
  - Parking instructions (if any)
  - Divider
  - Location mini-map (static, 200px height)
  - Divider
  - Reviews section (rating summary + list)
  - Divider
  - Cancellation policy
- **Sticky bottom bar:**
  - Left: Price/hour display
  - Right: "Réserver" button (full blue)
  - Tapping opens booking bottom sheet (date/time picker, vehicle, price breakdown, confirm)

### 3.4 — Bookings Screen Redesign
**File:** `apps/mobile/app/(tabs)/bookings.tsx`

**New Design:**
- Segmented control: En cours | À venir | Passées
- Cards: Spot photo (left), title + dates + status badge (right)
- Tap → booking detail
- Past bookings: "Laisser un avis" button if no review yet
- Empty states per tab

### 3.5 — Tab Bar Redesign
**File:** `apps/mobile/app/(tabs)/_layout.tsx`

- 5 tabs: Explorer | Rechercher | Réservations | Messages | Profil
- Replace "Hôte" tab with "Messages" (move host to profile menu)
- Icons: Home, Search, Calendar, MessageCircle, User
- Active: Blue fill, Inactive: Gray outline

### Verification
- [ ] Home shows category tabs and spot grid
- [ ] Search has recent searches and map bottom sheet
- [ ] Spot detail matches Airbnb layout with sticky footer
- [ ] Bookings filter correctly by status
- [ ] New tab bar with Messages tab works

---

## Phase 4: Mobile App — Messaging, Host & Profile

### 4.1 — Inbox/Messages Screen (New Tab)
**File:** `apps/mobile/app/(tabs)/messages.tsx` (NEW)

**Design (Airbnb Inbox):**
- List of conversations grouped by booking
- Each row: Avatar, name, last message preview, timestamp, unread dot
- Tap → full conversation screen
- Empty state: "Aucun message"

### 4.2 — Chat Screen Improvement
**File:** `apps/mobile/app/booking/chat.tsx`

**Fixes:**
- Replace 8-second polling with Supabase Realtime subscription
- Add typing indicators (optional)
- Add message read receipts
- Better bubble design with proper spacing
- Image message support (future)

### 4.3 — Host Dashboard (Moved to Profile Sub-screen)
**File:** `apps/mobile/app/host/dashboard.tsx` (NEW)

**Design:**
- Stats cards at top
- Pending bookings with accept/reject
- My listings grid with status toggles
- Quick actions: Add listing, Manage availability, View earnings

### 4.4 — Profile Screen Redesign
**File:** `apps/mobile/app/(tabs)/profile.tsx`

**New Design (Airbnb Profile):**
- Header: Large avatar, name, "Membre depuis..."
- Verified badges row
- Menu sections (grouped):
  - **Paramètres:** Infos personnelles, Paiement, Notifications, Sécurité
  - **Hébergement:** Tableau de bord hôte, Mes annonces, Revenus (if host)
  - **Véhicules:** Mes véhicules
  - **Assistance:** Centre d'aide, Conditions, Confidentialité
- "Devenir hôte" CTA (if not host)
- Déconnexion at bottom

### 4.5 — Settings Screens (NEW)
- **Personal Info:** `apps/mobile/app/settings/personal.tsx` — Edit name, email, phone, avatar
- **Payment Methods:** `apps/mobile/app/settings/payments.tsx` — View/add cards (Stripe)
- **Vehicles:** `apps/mobile/app/settings/vehicles.tsx` — CRUD vehicles
- **Notification Preferences:** `apps/mobile/app/settings/notifications.tsx` — Toggle types

### Verification
- [ ] Messages tab shows conversation list
- [ ] Chat uses real-time updates (no polling)
- [ ] Profile menu navigates to all sub-screens
- [ ] Settings screens save data correctly
- [ ] Host dashboard accessible from profile

---

## Phase 5: Mobile App — Missing Features & Bug Fixes

### 5.1 — Wishlist/Favorites Persistence
- Add heart button to spot cards everywhere
- Toggle calls `wishlists.toggle` API
- Wishlists screen accessible from profile
- Red filled heart for wishlisted spots

### 5.2 — Review Submission Flow
**File:** `apps/mobile/app/booking/review.tsx` (NEW)

- Star rating selector (1-5, animated)
- Comment text area
- Submit button
- Show after completed bookings in bookings list

### 5.3 — Booking Receipt
- Add receipt/invoice view to booking detail
- Price breakdown: Subtotal, platform fee, total
- Downloadable/shareable as image

### 5.4 — Error Boundaries
- Add global ErrorBoundary component wrapping the app
- Per-screen error boundaries for graceful fallbacks
- "Réessayer" button on error screens

### 5.5 — Host Onboarding Flow
**File:** `apps/mobile/app/host/onboarding.tsx` (NEW)

- Multi-step wizard: Welcome → Verify Identity → Add Listing → Set Availability → Done
- Progress bar
- Connects to existing verification and spot creation APIs

### 5.6 — Help Center
**File:** `apps/mobile/app/help/index.tsx` (NEW)

- FAQ sections (accordion)
- Contact support button (email/in-app)
- Common topics: Booking, Payments, Hosting, Account

### 5.7 — Login Screen Redesign
**File:** `apps/mobile/app/(auth)/login.tsx`

- Cleaner design with large logo
- Social login buttons (Google) prominently displayed
- Email/password below
- Magic link option
- Terms acceptance checkbox

### Verification
- [ ] Favorites persist across sessions
- [ ] Reviews can be submitted for completed bookings
- [ ] Error boundaries catch and display errors gracefully
- [ ] Host onboarding flow works end-to-end
- [ ] Help center displays FAQ

---

## Phase 6: Polish & Performance

### 6.1 — Animations & Micro-interactions
- Page transitions (shared element transitions where possible)
- Button press feedback (scale down on press)
- Skeleton loaders on all data-fetching screens
- Pull-to-refresh with custom animation
- Haptic feedback on key actions (iOS)

### 6.2 — Image Optimization
- Lazy loading for off-screen images
- Progressive image loading (blur placeholder → full image)
- Proper image caching strategy on mobile

### 6.3 — Accessibility
- All interactive elements have accessible labels
- Color contrast meets WCAG AA
- Screen reader support for key flows

### 6.4 — Performance
- Web: Optimize LCP, reduce bundle size, lazy load below-fold sections
- Mobile: Optimize FlatList rendering, reduce re-renders with React.memo
- Both: Optimize tRPC queries with proper caching/stale times

### 6.5 — Final QA
- Test all flows end-to-end on web (desktop + mobile viewport)
- Test all flows on iOS simulator
- Test all flows on Android emulator
- Fix any remaining visual bugs

### Verification
- [ ] Lighthouse score > 90 on web
- [ ] No jank or dropped frames on mobile
- [ ] All flows work without errors
- [ ] French text is correct throughout

---

## Execution Order

| Phase | Focus | Est. Complexity |
|-------|-------|----------------|
| 0 | Foundation (colors, DB, design tokens) | Small |
| 1 | Website core pages (navbar, landing, map, spot) | Large |
| 2 | Website dashboard & host pages | Medium |
| 3 | Mobile core screens (home, search, spot, bookings) | Large |
| 4 | Mobile messaging, host, profile, settings | Large |
| 5 | Mobile missing features & bug fixes | Medium |
| 6 | Polish & performance | Medium |

**Start with Phase 0, then alternate: Phase 1 (web) → Phase 3 (mobile) → Phase 2 (web) → Phase 4 (mobile) → Phase 5 → Phase 6**

This interleaving ensures both platforms progress together.

---

## Anti-Patterns to Avoid

1. **Don't invent new API routes** without adding them to `packages/api/src/routers/`
2. **Don't change DB schema** without a proper Drizzle migration
3. **Don't add dependencies** without checking bundle size impact
4. **Don't break existing features** — test each phase before moving on
5. **Don't over-animate** — Airbnb is smooth but subtle
6. **Don't hardcode French text** — keep it in component files for now, but structured for future i18n
7. **Don't mix color systems** — use the unified design tokens only

---

*Plan prepared for Anas Kharbat — Flashpark, April 2026*
