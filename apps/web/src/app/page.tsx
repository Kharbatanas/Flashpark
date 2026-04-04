'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import {
  FadeIn,
  StaggerContainer,
  StaggerItem,
  HoverScale,
  FloatingElement,
  BlurText,
  motion,
} from '../components/motion'

const CATEGORIES = [
  { icon: '🌤️', label: 'Extérieur', type: 'outdoor' },
  { icon: '🏢', label: 'Intérieur', type: 'indoor' },
  { icon: '🏠', label: 'Garage', type: 'garage' },
  { icon: '⛱️', label: 'Couvert', type: 'covered' },
  { icon: '🚇', label: 'Souterrain', type: 'underground' },
  { icon: '⚡', label: 'Smart Gate', type: 'smart' },
]

const FEATURED = [
  { title: 'Vieux-Nice', spots: 42, img: 'from-blue-400 to-blue-600', emoji: '🏛️' },
  { title: 'Promenade des Anglais', spots: 28, img: 'from-cyan-400 to-blue-500', emoji: '🌊' },
  { title: 'Gare Thiers', spots: 35, img: 'from-indigo-400 to-blue-600', emoji: '🚆' },
  { title: 'Cimiez', spots: 19, img: 'from-purple-400 to-blue-500', emoji: '🌿' },
]

const SPOT_CARDS = [
  { title: 'Garage sécurisé — Rue de France', address: 'Nice Centre', price: 3.5, rating: 4.97, reviews: 124, badge: 'Smart Gate', type: 'Garage', color: 'from-blue-900 to-blue-700' },
  { title: 'Box couvert — Vieux-Nice', address: 'Vieux-Nice', price: 2.8, rating: 4.85, reviews: 89, badge: 'Réservation instant.', type: 'Couvert', color: 'from-slate-700 to-slate-900' },
  { title: 'Place extérieure — Promenade', address: 'Promenade des Anglais', price: 1.9, rating: 4.72, reviews: 56, badge: null, type: 'Extérieur', color: 'from-blue-600 to-cyan-600' },
  { title: 'Parking souterrain — Gare', address: 'Gare Thiers', price: 2.5, rating: 4.9, reviews: 203, badge: 'Smart Gate', type: 'Souterrain', color: 'from-gray-700 to-gray-900' },
  { title: 'Box privé — Cimiez', address: 'Cimiez', price: 4.0, rating: 5.0, reviews: 31, badge: null, type: 'Garage', color: 'from-indigo-700 to-purple-700' },
  { title: 'Parking couvert — Libération', address: 'Libération', price: 2.2, rating: 4.8, reviews: 77, badge: 'Réservation instant.', type: 'Couvert', color: 'from-teal-600 to-blue-700' },
]

const STEPS = [
  {
    num: '1',
    title: 'Recherchez',
    desc: 'Entrez votre destination. Des centaines de places disponibles s\'affichent instantanément sur la carte.',
    icon: (
      <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
      </svg>
    ),
  },
  {
    num: '2',
    title: 'Réservez',
    desc: 'Choisissez vos horaires, payez en ligne. Confirmation immédiate par email.',
    icon: (
      <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
  },
  {
    num: '3',
    title: 'Garez-vous',
    desc: 'Accédez à votre place avec le QR code. Smart Gate ? La barrière s\'ouvre automatiquement.',
    icon: (
      <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
      </svg>
    ),
  },
]

const TRUST = [
  { icon: '🔒', title: 'Paiement sécurisé', desc: 'Transactions chiffrées via Stripe. Remboursement automatique si annulation.' },
  { icon: '🛡️', title: 'Assurance incluse', desc: 'Chaque réservation est couverte. Stationnez l\'esprit tranquille.' },
  { icon: '⚡', title: 'Smart Gate IoT', desc: 'Accès automatique aux places équipées. Plus besoin de clé ou badge.' },
  { icon: '⭐', title: 'Hôtes vérifiés', desc: 'Profils validés, avis vérifiés. Une communauté de confiance.' },
]

export default function HomePage() {
  const [searchQuery, setSearchQuery] = useState('')
  const router = useRouter()

  function handleSearch(e: React.FormEvent) {
    e.preventDefault()
    router.push(searchQuery.trim() ? `/map?q=${encodeURIComponent(searchQuery)}` : '/map')
  }

  return (
    <div className="min-h-screen bg-white">

      {/* ─── Hero ──────────────────────────────────────────────────────── */}
      <section className="relative -mt-16 flex min-h-screen items-center justify-center overflow-hidden bg-[#1A1A2E]">
        {/* Background */}
        <div className="absolute inset-0">
          <div className="absolute inset-0 bg-gradient-to-br from-[#1A1A2E] via-[#0D1535] to-[#0540FF]/20" />
          <FloatingElement amplitude={20} duration={8} className="absolute -left-40 top-1/4 h-96 w-96 rounded-full bg-[#0540FF]/20 blur-3xl"><div /></FloatingElement>
          <FloatingElement amplitude={15} duration={10} className="absolute -right-20 bottom-1/4 h-80 w-80 rounded-full bg-blue-500/15 blur-3xl"><div /></FloatingElement>
          {/* Grid pattern */}
          <svg className="absolute inset-0 h-full w-full opacity-[0.03]" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
                <path d="M 40 0 L 0 0 0 40" fill="none" stroke="white" strokeWidth="1"/>
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#grid)" />
          </svg>
        </div>

        <div className="relative z-10 mx-auto max-w-5xl px-6 pb-24 pt-32 text-center">
          {/* Badge */}
          <motion.div
            initial={{ opacity: 0, scale: 0.8, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="mb-6 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-1.5 text-xs font-medium text-blue-300 backdrop-blur"
          >
            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-400" />
            Lancé à Nice · Été 2026 · Gratuit
          </motion.div>

          {/* Headline */}
          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.4, ease: [0.25, 0.4, 0.25, 1] }}
            className="text-5xl font-extrabold leading-[1.1] tracking-tight text-white sm:text-6xl lg:text-7xl"
          >
            Trouvez votre parking
            <br />
            <motion.span
              initial={{ opacity: 0, filter: 'blur(10px)' }}
              animate={{ opacity: 1, filter: 'blur(0px)' }}
              transition={{ duration: 0.8, delay: 0.7 }}
              className="bg-gradient-to-r from-[#0540FF] to-blue-300 bg-clip-text text-transparent"
            >
              en quelques secondes
            </motion.span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.8 }}
            className="mx-auto mt-6 max-w-2xl text-lg leading-relaxed text-gray-400"
          >
            Flashpark connecte conducteurs et propriétaires de places privées. Réservez, payez, accédez. L&apos;Airbnb du parking à Nice.
          </motion.p>

          {/* Search box */}
          <motion.div
            initial={{ opacity: 0, y: 30, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.7, delay: 1.0, ease: [0.25, 0.4, 0.25, 1] }}
            className="mx-auto mt-12 max-w-2xl"
          >
            <form onSubmit={handleSearch}>
              <motion.div
                whileHover={{ scale: 1.01, boxShadow: '0 25px 60px -12px rgba(5, 64, 255, 0.35)' }}
                transition={{ duration: 0.3 }}
                className="flex overflow-hidden rounded-2xl bg-white shadow-2xl shadow-blue-900/30"
              >
                <div className="flex flex-1 items-center gap-3 px-5 py-4">
                  <svg className="h-5 w-5 flex-shrink-0 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  <input
                    type="text"
                    placeholder="Où souhaitez-vous vous garer ?"
                    className="flex-1 bg-transparent text-sm text-gray-700 placeholder-gray-400 focus:outline-none"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
                <div className="flex items-center border-l border-gray-100 px-5">
                  <span className="text-sm text-gray-400">Nice</span>
                </div>
                <button
                  type="submit"
                  className="flex items-center gap-2 bg-[#0540FF] px-6 py-4 text-sm font-bold text-white hover:bg-blue-700 transition-colors"
                >
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                  Rechercher
                </button>
              </motion.div>
            </form>

            {/* Quick filters */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5, delay: 1.3 }}
              className="mt-4 flex flex-wrap justify-center gap-2"
            >
              {CATEGORIES.map((c, i) => (
                <motion.div
                  key={c.type}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: 1.3 + i * 0.05 }}
                >
                  <Link
                    href="/map"
                    className="flex items-center gap-1.5 rounded-full border border-white/15 bg-white/8 px-3 py-1.5 text-xs font-medium text-gray-300 backdrop-blur transition hover:bg-white/15 hover:text-white"
                  >
                    <span>{c.icon}</span>
                    {c.label}
                  </Link>
                </motion.div>
              ))}
            </motion.div>
          </motion.div>

          {/* Stats */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 1.5 }}
            className="mt-16 grid grid-cols-2 gap-6 sm:grid-cols-4"
          >
            {[
              { v: '2 000+', l: 'Places disponibles', num: 2000 },
              { v: '< 60 s', l: 'Pour réserver', num: 60 },
              { v: '4,8 ★', l: 'Note moyenne', num: 4.8 },
              { v: '0 €', l: "D'inscription", num: 0 },
            ].map(({ v, l }, idx) => (
              <motion.div
                key={l}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 1.5 + idx * 0.1 }}
                className="text-center"
              >
                <p className="text-2xl font-extrabold text-white">{v}</p>
                <p className="mt-1 text-xs text-gray-500">{l}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>

        {/* Scroll indicator */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 2, duration: 0.5 }}
          className="absolute bottom-8 left-1/2 -translate-x-1/2 animate-bounce"
        >
          <svg className="h-5 w-5 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </motion.div>
      </section>

      {/* ─── Categories ────────────────────────────────────────────────── */}
      <section className="border-b border-gray-100 py-6">
        <div className="mx-auto max-w-7xl px-6">
          <FadeIn>
            <div className="flex items-center gap-8 overflow-x-auto pb-1 scrollbar-hide">
              {CATEGORIES.map((c) => (
                <Link
                  key={c.type}
                  href="/map"
                  className="group flex flex-shrink-0 flex-col items-center gap-2 text-gray-400 transition hover:text-[#0540FF]"
                >
                  <motion.span whileHover={{ scale: 1.2, rotate: 5 }} className="text-2xl">{c.icon}</motion.span>
                  <span className="text-xs font-medium whitespace-nowrap">{c.label}</span>
                  <span className="h-0.5 w-0 rounded-full bg-[#0540FF] transition-all group-hover:w-full" />
                </Link>
              ))}
            </div>
          </FadeIn>
        </div>
      </section>

      {/* ─── Spot cards ────────────────────────────────────────────────── */}
      <section className="py-16">
        <div className="mx-auto max-w-7xl px-6">
          <FadeIn>
            <div className="mb-8 flex items-end justify-between">
              <div>
                <h2 className="text-2xl font-extrabold text-[#1A1A2E]">Places populaires à Nice</h2>
                <p className="mt-1 text-sm text-gray-500">Réservez en quelques secondes</p>
              </div>
              <Link href="/map" className="text-sm font-semibold text-[#0540FF] hover:underline">
                Tout voir →
              </Link>
            </div>
          </FadeIn>

          <StaggerContainer className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {SPOT_CARDS.map((spot) => (
              <StaggerItem key={spot.title}>
                <HoverScale>
                  <Link href="/map" className="group block">
                    {/* Photo placeholder */}
                    <div className={`relative h-56 overflow-hidden rounded-2xl bg-gradient-to-br ${spot.color}`}>
                      <div className="absolute inset-0 flex items-center justify-center opacity-10">
                        <svg className="h-32 w-32 text-white" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
                        </svg>
                      </div>
                      <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent" />
                      {spot.badge && (
                        <motion.div
                          initial={{ opacity: 0, x: -10 }}
                          whileInView={{ opacity: 1, x: 0 }}
                          viewport={{ once: true }}
                          className="absolute left-3 top-3 rounded-full bg-white/90 px-2.5 py-1 text-xs font-semibold text-[#1A1A2E] backdrop-blur"
                        >
                          {spot.badge === 'Smart Gate' ? '⚡ ' : '🚀 '}{spot.badge}
                        </motion.div>
                      )}
                      <motion.button
                        whileHover={{ scale: 1.15 }}
                        whileTap={{ scale: 0.9 }}
                        className="absolute right-3 top-3 flex h-8 w-8 items-center justify-center rounded-full bg-white/80 backdrop-blur transition hover:bg-white"
                      >
                        <svg className="h-4 w-4 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                        </svg>
                      </motion.button>
                    </div>

                    {/* Info */}
                    <div className="mt-3">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <p className="truncate font-semibold text-[#1A1A2E] group-hover:text-[#0540FF] transition-colors">
                            {spot.title}
                          </p>
                          <p className="mt-0.5 text-sm text-gray-500">{spot.address} · {spot.type}</p>
                        </div>
                        <div className="flex-shrink-0 flex items-center gap-1">
                          <svg className="h-3.5 w-3.5 fill-current text-[#1A1A2E]" viewBox="0 0 20 20">
                            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/>
                          </svg>
                          <span className="text-sm font-medium text-[#1A1A2E]">{spot.rating}</span>
                          <span className="text-sm text-gray-400">({spot.reviews})</span>
                        </div>
                      </div>
                      <p className="mt-1.5 text-sm text-gray-700">
                        <span className="font-semibold text-[#1A1A2E]">{spot.price.toFixed(2).replace('.', ',')} €</span>
                        <span className="text-gray-500"> / heure</span>
                      </p>
                    </div>
                  </Link>
                </HoverScale>
              </StaggerItem>
            ))}
          </StaggerContainer>
        </div>
      </section>

      {/* ─── Explore by neighbourhood ──────────────────────────────────── */}
      <section className="bg-gray-50 py-16">
        <div className="mx-auto max-w-7xl px-6">
          <FadeIn>
            <h2 className="mb-2 text-2xl font-extrabold text-[#1A1A2E]">Explorer par quartier</h2>
            <p className="mb-8 text-sm text-gray-500">Trouvez une place dans votre quartier préféré</p>
          </FadeIn>
          <StaggerContainer className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {FEATURED.map(({ title, spots, img, emoji }) => (
              <StaggerItem key={title}>
                <Link href="/map" className="group relative block overflow-hidden rounded-2xl">
                  <motion.div
                    whileHover={{ scale: 1.05 }}
                    transition={{ duration: 0.5, ease: [0.25, 0.4, 0.25, 1] }}
                    className={`h-44 w-full bg-gradient-to-br ${img}`}
                  >
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent" />
                    <div className="absolute inset-0 flex flex-col justify-end p-4">
                      <motion.p whileHover={{ scale: 1.2, rotate: 10 }} className="text-2xl">{emoji}</motion.p>
                      <p className="mt-1 font-bold text-white">{title}</p>
                      <p className="text-xs text-white/70">{spots} places disponibles</p>
                    </div>
                  </motion.div>
                </Link>
              </StaggerItem>
            ))}
          </StaggerContainer>
        </div>
      </section>

      {/* ─── How it works ──────────────────────────────────────────────── */}
      <section className="py-20">
        <div className="mx-auto max-w-5xl px-6">
          <FadeIn className="mb-14 text-center">
            <p className="text-xs font-bold uppercase tracking-widest text-[#0540FF]">Comment ça marche</p>
            <BlurText as="h2" delay={0.1} className="mt-3 text-3xl font-extrabold text-[#1A1A2E]">
              Stationnez en 3 étapes
            </BlurText>
          </FadeIn>

          <StaggerContainer className="grid gap-8 sm:grid-cols-3">
            {STEPS.map(({ num, title, desc, icon }) => (
              <StaggerItem key={num}>
                <div className="relative text-center">
                  <div className="absolute left-1/2 top-8 hidden h-px w-full -translate-y-1/2 bg-gray-100 sm:block [&:last-child]:hidden" />
                  <motion.div
                    whileHover={{ scale: 1.1, rotate: 3 }}
                    className="relative mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-[#0540FF]/5 text-[#0540FF] ring-1 ring-[#0540FF]/10"
                  >
                    {icon}
                    <span className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-[#0540FF] text-xs font-bold text-white">
                      {num}
                    </span>
                  </motion.div>
                  <h3 className="mb-2 text-lg font-bold text-[#1A1A2E]">{title}</h3>
                  <p className="text-sm leading-relaxed text-gray-500">{desc}</p>
                </div>
              </StaggerItem>
            ))}
          </StaggerContainer>

          <FadeIn delay={0.3} className="mt-12 text-center">
            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.97 }}>
              <Link href="/map"
                className="inline-flex h-12 items-center gap-2 rounded-2xl bg-[#0540FF] px-8 text-sm font-bold text-white shadow-lg shadow-blue-100 transition hover:bg-blue-700">
                Trouver une place maintenant
                <motion.svg
                  animate={{ x: [0, 4, 0] }}
                  transition={{ duration: 1.5, repeat: Infinity }}
                  className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </motion.svg>
              </Link>
            </motion.div>
          </FadeIn>
        </div>
      </section>

      {/* ─── Trust ─────────────────────────────────────────────────────── */}
      <section className="border-y border-gray-100 bg-white py-16">
        <div className="mx-auto max-w-5xl px-6">
          <StaggerContainer className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
            {TRUST.map(({ icon, title, desc }) => (
              <StaggerItem key={title}>
                <motion.div
                  whileHover={{ y: -5 }}
                  transition={{ duration: 0.3 }}
                  className="flex flex-col items-start gap-3"
                >
                  <motion.span whileHover={{ scale: 1.3, rotate: 10 }} className="text-3xl">{icon}</motion.span>
                  <h3 className="font-bold text-[#1A1A2E]">{title}</h3>
                  <p className="text-sm leading-relaxed text-gray-500">{desc}</p>
                </motion.div>
              </StaggerItem>
            ))}
          </StaggerContainer>
        </div>
      </section>

      {/* ─── Host CTA ──────────────────────────────────────────────────── */}
      <section className="py-20">
        <div className="mx-auto max-w-7xl px-6">
          <FadeIn>
            <div className="overflow-hidden rounded-3xl bg-[#1A1A2E]">
              <div className="flex flex-col gap-8 p-10 lg:flex-row lg:items-center lg:gap-16 lg:p-16">
                {/* Left */}
                <div className="flex-1">
                  <FadeIn direction="left" delay={0.1}>
                    <p className="text-xs font-bold uppercase tracking-widest text-blue-400">Pour les propriétaires</p>
                  </FadeIn>
                  <FadeIn direction="left" delay={0.2}>
                    <h2 className="mt-4 text-4xl font-extrabold leading-tight text-white">
                      Votre place vide,<br />c&apos;est de l&apos;argent qui dort.
                    </h2>
                  </FadeIn>
                  <FadeIn direction="left" delay={0.3}>
                    <p className="mt-4 text-gray-400">
                      Publiez votre annonce en 5 minutes. Nos conducteurs vérifiés réservent, Flashpark gère les paiements et les accès automatiquement.
                    </p>
                  </FadeIn>
                  <StaggerContainer delay={0.4}>
                    <ul className="mt-6 space-y-3">
                      {[
                        '💶 Gagnez jusqu\'à 300 €/mois en moyenne',
                        '📅 Vous choisissez vos disponibilités',
                        '🛡️ Assurance & protection incluses',
                        '📱 Tout géré depuis l\'application',
                      ].map((item) => (
                        <StaggerItem key={item}>
                          <li className="flex items-center gap-3 text-sm text-gray-300">
                            <svg className="h-4 w-4 flex-shrink-0 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                            </svg>
                            {item}
                          </li>
                        </StaggerItem>
                      ))}
                    </ul>
                  </StaggerContainer>
                  <FadeIn delay={0.6}>
                    <div className="mt-8 flex flex-wrap gap-4">
                      <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.97 }}>
                        <Link href="/host"
                          className="inline-flex h-12 items-center gap-2 rounded-2xl bg-[#0540FF] px-7 text-sm font-bold text-white shadow-lg shadow-blue-900/40 transition hover:bg-blue-600">
                          Déposer mon annonce — Gratuit
                        </Link>
                      </motion.div>
                      <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.97 }}>
                        <Link href="/map"
                          className="inline-flex h-12 items-center gap-2 rounded-2xl border border-white/20 px-7 text-sm font-medium text-white transition hover:bg-white/5">
                          Explorer la carte
                        </Link>
                      </motion.div>
                    </div>
                  </FadeIn>
                </div>

                {/* Revenue calc */}
                <FadeIn direction="right" delay={0.3}>
                  <div className="w-full max-w-sm flex-shrink-0 rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur lg:mx-auto">
                    <p className="mb-1 text-xs font-semibold uppercase tracking-widest text-blue-400">Simulateur de revenus</p>
                    <p className="mb-5 text-sm text-gray-400">Basé sur 3 €/h · frais 20 %</p>
                    <div className="space-y-3">
                      {[
                        { label: '4h / jour', val: '216 €', sub: 'par mois' },
                        { label: '8h / jour', val: '432 €', sub: 'par mois' },
                        { label: 'Disponible 24h/7j', val: '1 080 €', sub: 'par mois', highlight: true },
                      ].map(({ label, val, sub, highlight }, i) => (
                        <motion.div
                          key={label}
                          initial={{ opacity: 0, x: 20 }}
                          whileInView={{ opacity: 1, x: 0 }}
                          viewport={{ once: true }}
                          transition={{ delay: 0.4 + i * 0.1 }}
                          whileHover={{ scale: 1.02 }}
                          className={`flex items-center justify-between rounded-xl px-4 py-3 ${highlight ? 'bg-[#0540FF]/20 ring-1 ring-[#0540FF]/30' : 'border border-white/10 bg-white/5'}`}
                        >
                          <p className="text-xs text-gray-400">{label}</p>
                          <div className="text-right">
                            <p className={`text-sm font-bold ${highlight ? 'text-white' : 'text-gray-200'}`}>{val}</p>
                            <p className="text-xs text-gray-500">{sub}</p>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  </div>
                </FadeIn>
              </div>
            </div>
          </FadeIn>
        </div>
      </section>

      {/* ─── App download ──────────────────────────────────────────────── */}
      <section className="bg-gray-50 py-16 text-center">
        <div className="mx-auto max-w-xl px-6">
          <FadeIn>
            <motion.p
              animate={{ y: [0, -8, 0] }}
              transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
              className="text-4xl mb-4"
            >
              📱
            </motion.p>
            <BlurText as="h2" className="text-2xl font-extrabold text-[#1A1A2E]">
              L&apos;app Flashpark arrive
            </BlurText>
            <p className="mt-3 text-sm text-gray-500">
              Disponible sur iOS & Android cet été. Réservez, accédez, gérez vos places depuis votre poche.
            </p>
          </FadeIn>
          <FadeIn delay={0.2}>
            <div className="mt-6 flex flex-wrap justify-center gap-3">
              {[
                {
                  icon: <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor"><path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.8-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z"/></svg>,
                  top: 'Bientôt sur',
                  bottom: 'App Store',
                },
                {
                  icon: <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor"><path d="M3.18 23.76c.3.17.64.22.98.14l12.38-7.14L13.47 14l-10.29 9.76zM.36 2.4A1.26 1.26 0 0 0 0 3.33v17.34c0 .36.13.69.36.93L14.17 12 .36 2.4zM20.47 10.37l-2.72-1.57-3.54 3.2 3.54 3.2 2.76-1.59a1.77 1.77 0 0 0 0-3.24zM4.16.1L16.54 7.24l-3.07 2.76L.98.14A1.31 1.31 0 0 1 4.16.1z"/></svg>,
                  top: 'Bientôt sur',
                  bottom: 'Google Play',
                },
              ].map(({ icon, top, bottom }) => (
                <motion.div
                  key={bottom}
                  whileHover={{ scale: 1.05, y: -2 }}
                  whileTap={{ scale: 0.97 }}
                  className="flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-5 py-3 shadow-sm cursor-pointer"
                >
                  {icon}
                  <div className="text-left">
                    <p className="text-xs text-gray-400">{top}</p>
                    <p className="text-sm font-bold text-[#1A1A2E]">{bottom}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </FadeIn>
        </div>
      </section>

      {/* ─── Footer ────────────────────────────────────────────────────── */}
      <footer className="border-t border-gray-100 bg-white py-14">
        <div className="mx-auto max-w-7xl px-6">
          <FadeIn>
            <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-4">
              <div>
                <p className="text-xl font-extrabold text-[#1A1A2E]">Flash<span className="text-[#0540FF]">park</span></p>
                <p className="mt-3 text-sm leading-relaxed text-gray-500">
                  La marketplace du parking privé. Réservez facilement, stationnez sereinement.
                </p>
                <div className="mt-4 flex gap-3">
                  {['twitter', 'instagram', 'linkedin'].map((s) => (
                    <motion.div
                      key={s}
                      whileHover={{ scale: 1.15, y: -2 }}
                      whileTap={{ scale: 0.9 }}
                      className="flex h-8 w-8 items-center justify-center rounded-full border border-gray-200 text-gray-400 hover:border-[#0540FF] hover:text-[#0540FF] transition-colors cursor-pointer"
                    >
                      <svg className="h-3.5 w-3.5" fill="currentColor" viewBox="0 0 24 24">
                        <circle cx="12" cy="12" r="10"/>
                      </svg>
                    </motion.div>
                  ))}
                </div>
              </div>

              {[
                {
                  title: 'Conducteurs',
                  links: [
                    { label: 'Trouver un parking', href: '/map' },
                    { label: 'Comment ça marche', href: '/#how' },
                    { label: 'Tarifs', href: '/map' },
                    { label: 'Mes réservations', href: '/dashboard' },
                  ],
                },
                {
                  title: 'Hôtes',
                  links: [
                    { label: 'Louer ma place', href: '/host' },
                    { label: 'Créer une annonce', href: '/host/listings/new' },
                    { label: 'Mes revenus', href: '/host/earnings' },
                    { label: 'Smart Gate', href: '/host' },
                  ],
                },
                {
                  title: 'Flashpark',
                  links: [
                    { label: 'À propos', href: '/' },
                    { label: 'Presse', href: '/' },
                    { label: 'Carrières', href: '/' },
                    { label: 'Contact', href: '/' },
                  ],
                },
              ].map(({ title, links }) => (
                <div key={title}>
                  <p className="mb-4 text-xs font-bold uppercase tracking-widest text-gray-400">{title}</p>
                  <ul className="space-y-2.5">
                    {links.map(({ label, href }) => (
                      <li key={label}>
                        <Link href={href} className="text-sm text-gray-600 hover:text-[#0540FF] transition-colors">
                          {label}
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </FadeIn>

          <div className="mt-10 flex flex-col items-center justify-between gap-4 border-t border-gray-100 pt-8 sm:flex-row">
            <p className="text-xs text-gray-400">© 2026 Flashpark SAS · Nice, France · Tous droits réservés</p>
            <div className="flex gap-6 text-xs text-gray-400">
              <a href="/" className="hover:text-gray-600 transition-colors">Confidentialité</a>
              <a href="/" className="hover:text-gray-600 transition-colors">CGU</a>
              <a href="/" className="hover:text-gray-600 transition-colors">Cookies</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
