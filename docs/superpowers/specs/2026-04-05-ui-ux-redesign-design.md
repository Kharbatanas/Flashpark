# Flashpark UI/UX Redesign — Design Spec

**Date:** 2026-04-05
**Scope:** Landing, Map, Spot Detail, Booking (4 conversion pages)

## Design System

### Palette — Warm Sand
- **Cream:** `#FAFAF8` (backgrounds)
- **Charcoal:** `#1A1A1A` (headings, dark sections)
- **Sand:** `#D4A574` (accent, CTAs, labels)
- **Linen:** `#F0EBE3` (borders, subtle bg)
- **Danger Red:** `#E54D4D` (frustration scenes, errors)
- **Success Green:** `#22C55E` (access granted, confirmations)

### Typography — Inter Tight-Tracked
- **Headings:** Inter, weight 800-900, letter-spacing `-0.04em`
- **Body:** Inter, weight 400-500, color `#666` on light, `#999` on dark
- **Labels:** Uppercase, 12px, letter-spacing `0.15em`, Sand color

### Motion Philosophy — Scroll-Driven Cinematic
- **Core:** framer-motion `useScroll` + `useTransform` for scroll-linked animations
- **No discrete pops** — everything flows with scroll position
- **Parallax layers** at different speeds for depth
- **Sticky sections** with internal scroll progress animations
- **Smooth color transitions** between dark and light scenes
- **Reduced motion:** all animations respect `prefers-reduced-motion`

## Landing Page — "The Drive" (Scroll Story)

6 acts, scroll-driven, smooth transitions:

1. **The Frustration** — Dark, road lines parallax, text fades with scroll, timer counts, red stress
2. **The Cost** — Price grows with scroll, daily/weekly/monthly cascade in
3. **The Flash** — Gold flash bang, logo scales in, radial glow breathes
4. **The Map** — Spots pop in with radar pulses, prices floating
5. **The QR** — QR rotates in, scan line, green checkmark
6. **The Freedom** — Cream warmth, "Your spot is waiting", search bar lands

Key technical: each scene uses `position: sticky` with scroll-progress-driven transforms, not IntersectionObserver triggers. Elements move/scale/fade proportionally to scroll position.

## Map Page

- Cream background, sand-accented filters
- Glassmorphism search overlay
- Sand-colored price markers with hover lift
- Spot popup with sand accent border, smooth scale-in
- Staggered card reveal in list fallback

## Spot Detail Page

- Cream `#FAFAF8` background
- Photo gallery with hover zoom effect
- Sand accent on amenity icons, badges
- Booking widget with sand CTA button
- Parallax subtle on hero photo
- Staggered amenity/review reveals

## Booking Confirmation Page

- Animated checkmark (SVG path draw)
- QR code scales in with rotation
- Sand accent on status badges
- Price breakdown slides in
- Success green for confirmed status

## Shared Components

- `<ScrollScene>` — sticky section with scroll-progress children
- `<ParallaxLayer>` — element with configurable scroll speed
- `<ScrollFade>` — opacity tied to scroll position
- `<ScrollScale>` — scale tied to scroll position
- `<AnimatedCounter>` — spring number counter
- `<GlassCard>` — frosted glass overlay
- `<SandButton>` — primary CTA
