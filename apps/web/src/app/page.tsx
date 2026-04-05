'use client'

import { useState, useRef } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import {
  motion,
  useScroll,
  useTransform,
  useInView,
  useMotionValueEvent,
} from 'framer-motion'
import { Navbar } from '../components/navbar'
import { TRPCProvider } from '../lib/trpc/client'

/* ───────── Animated counter ───────── */
function Counter({ value, suffix = '' }: { value: number; suffix?: string }) {
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true })
  const [display, setDisplay] = useState(0)

  if (isInView && display < value) {
    const step = Math.max(1, Math.floor(value / 40))
    setTimeout(() => setDisplay((d) => Math.min(d + step, value)), 30)
  }

  return (
    <span ref={ref}>
      {isInView ? display.toLocaleString('fr-FR') : '0'}
      {suffix}
    </span>
  )
}

/* ───────── Revenue Simulator ───────── */
function RevenueSimulator() {
  const [price, setPrice] = useState(3)
  const [hours, setHours] = useState(6)
  const [days, setDays] = useState(5)
  const net = Math.round(price * hours * days * 4.33 * 0.8)

  return (
    <div className="w-full max-w-sm rounded-3xl border border-white/10 bg-white/[0.03] p-8 backdrop-blur-xl">
      <p className="text-xs font-bold uppercase tracking-[0.25em] text-blue-400">Simulateur</p>
      <p className="mt-1 text-sm text-gray-500">Estimez vos revenus mensuels</p>

      <div className="mt-6 space-y-6">
        <div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-400">Prix / heure</span>
            <span className="font-bold text-white">{price} EUR</span>
          </div>
          <input type="range" min={1} max={10} step={0.5} value={price}
            onChange={(e) => setPrice(Number(e.target.value))}
            className="mt-2 w-full accent-[#0540FF] h-1.5" />
        </div>
        <div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-400">Heures / jour</span>
            <span className="font-bold text-white">{hours}h</span>
          </div>
          <input type="range" min={1} max={24} value={hours}
            onChange={(e) => setHours(Number(e.target.value))}
            className="mt-2 w-full accent-[#0540FF] h-1.5" />
        </div>
        <div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-400">Jours / semaine</span>
            <span className="font-bold text-white">{days}j</span>
          </div>
          <input type="range" min={1} max={7} value={days}
            onChange={(e) => setDays(Number(e.target.value))}
            className="mt-2 w-full accent-[#0540FF] h-1.5" />
        </div>
      </div>

      <div className="mt-8 rounded-2xl bg-gradient-to-r from-[#0540FF]/20 to-blue-600/20 ring-1 ring-[#0540FF]/30 p-5 text-center">
        <p className="text-4xl font-black text-white">{net.toLocaleString('fr-FR')} EUR</p>
        <p className="mt-1 text-sm text-blue-300">par mois, net</p>
        <p className="text-xs text-gray-500">{(net * 12).toLocaleString('fr-FR')} EUR / an</p>
      </div>
    </div>
  )
}

/* ───────── Section reveal ───────── */
function Reveal({ children, className = '', delay = 0 }: { children: React.ReactNode; className?: string; delay?: number }) {
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true, margin: '-80px' })
  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 50 }}
      animate={isInView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.8, delay, ease: [0.22, 1, 0.36, 1] }}
      className={className}
    >
      {children}
    </motion.div>
  )
}

/* ═══════════════════════════════════════════
   LANDING PAGE
   ═══════════════════════════════════════════ */
export default function HomePage() {
  const [searchQuery, setSearchQuery] = useState('')
  const router = useRouter()

  // Scroll-linked gate animation
  const heroRef = useRef(null)
  const { scrollYProgress } = useScroll({
    target: heroRef,
    offset: ['start start', 'end start'],
  })
  const gateLeft = useTransform(scrollYProgress, [0, 0.5], ['0%', '-110%'])
  const gateRight = useTransform(scrollYProgress, [0, 0.5], ['0%', '110%'])
  const gateOpacity = useTransform(scrollYProgress, [0.3, 0.5], [1, 0])
  const heroScale = useTransform(scrollYProgress, [0, 0.5], [1, 0.95])
  const heroBlur = useTransform(scrollYProgress, [0.3, 0.6], [0, 10])

  function handleSearch(e: React.FormEvent) {
    e.preventDefault()
    router.push(searchQuery.trim() ? `/map?q=${encodeURIComponent(searchQuery)}` : '/map')
  }

  return (
    <TRPCProvider>
    <div className="min-h-screen bg-[#060612] text-white">
      <Navbar />

      {/* ─── HERO with opening gate ─── */}
      <section ref={heroRef} className="relative min-h-[200vh]">
        {/* Sticky container */}
        <div className="sticky top-0 flex h-screen items-center justify-center overflow-hidden">
          {/* Background glow */}
          <div className="absolute inset-0">
            <div className="absolute left-1/2 top-1/3 -translate-x-1/2 h-[600px] w-[800px] rounded-full bg-[#0540FF]/15 blur-[150px]" />
            <div className="absolute right-0 bottom-0 h-[400px] w-[400px] rounded-full bg-blue-600/10 blur-[120px]" />
          </div>

          {/* Content behind the gate */}
          <motion.div
            style={{ scale: heroScale }}
            className="relative z-10 mx-auto max-w-4xl px-6 text-center"
          >
            <motion.div
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 1, delay: 0.5, ease: [0.22, 1, 0.36, 1] }}
            >
              <div className="mb-8 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-5 py-2.5 backdrop-blur-sm">
                <span className="relative flex h-2 w-2">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                  <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-400" />
                </span>
                <span className="text-sm text-gray-300">Disponible partout en France</span>
              </div>

              <h1 className="text-[clamp(3rem,7vw,6rem)] font-black leading-[0.95] tracking-tight">
                <span className="block">Garez-vous</span>
                <span className="block bg-gradient-to-r from-[#0540FF] via-blue-400 to-cyan-300 bg-clip-text text-transparent">
                  sans chercher.
                </span>
              </h1>

              <p className="mx-auto mt-8 max-w-lg text-lg leading-relaxed text-gray-400">
                Reservez une place de parking privee en quelques secondes.
                La barriere s&apos;ouvre. Vous entrez. C&apos;est tout.
              </p>

              {/* Search */}
              <form onSubmit={handleSearch} className="mx-auto mt-10 max-w-xl">
                <div className="group flex items-center rounded-2xl bg-white/[0.08] ring-1 ring-white/10 backdrop-blur-xl transition-all hover:bg-white/[0.12] hover:ring-white/20 focus-within:ring-[#0540FF]/50">
                  <div className="flex flex-1 items-center gap-3 px-5 py-4">
                    <svg className="h-5 w-5 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    <input
                      type="text"
                      placeholder="Adresse, ville ou lieu..."
                      className="flex-1 bg-transparent text-sm text-white placeholder-gray-500 focus:outline-none"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                    />
                  </div>
                  <button type="submit"
                    className="m-1.5 rounded-xl bg-[#0540FF] px-6 py-3 text-sm font-semibold text-white transition hover:bg-blue-500">
                    Rechercher
                  </button>
                </div>
              </form>

              {/* City pills */}
              <div className="mt-6 flex flex-wrap justify-center gap-2">
                {['Paris', 'Lyon', 'Marseille', 'Montpellier', 'Nice', 'Toulouse', 'Bordeaux'].map((city, i) => (
                  <motion.button
                    key={city}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 1 + i * 0.05 }}
                    onClick={() => router.push(`/map?q=${city}`)}
                    className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-xs text-gray-400 backdrop-blur-sm transition hover:bg-white/10 hover:text-white"
                  >
                    {city}
                  </motion.button>
                ))}
              </div>
            </motion.div>
          </motion.div>

          {/* ─── PARKING GATE OVERLAY ─── */}
          <motion.div style={{ opacity: gateOpacity }} className="pointer-events-none absolute inset-0 z-20">
            {/* Left gate */}
            <motion.div
              style={{ x: gateLeft }}
              className="absolute left-0 top-0 h-full w-1/2 bg-[#0a0a14]"
            >
              <div className="absolute right-0 top-0 h-full w-px bg-gradient-to-b from-transparent via-[#0540FF]/30 to-transparent" />
              {/* Gate stripes */}
              <div className="absolute right-8 top-1/2 -translate-y-1/2 space-y-3">
                {Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="h-1 w-16 rounded-full bg-[#0540FF]/20" style={{ width: `${40 + i * 10}px` }} />
                ))}
              </div>
              <div className="absolute bottom-1/4 right-12 text-6xl font-black text-white/[0.03] tracking-tighter">
                FLASH
              </div>
            </motion.div>
            {/* Right gate */}
            <motion.div
              style={{ x: gateRight }}
              className="absolute right-0 top-0 h-full w-1/2 bg-[#0a0a14]"
            >
              <div className="absolute left-0 top-0 h-full w-px bg-gradient-to-b from-transparent via-[#0540FF]/30 to-transparent" />
              <div className="absolute left-8 top-1/2 -translate-y-1/2 space-y-3">
                {Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="h-1 rounded-full bg-[#0540FF]/20" style={{ width: `${80 - i * 10}px` }} />
                ))}
              </div>
              <div className="absolute bottom-1/4 left-12 text-6xl font-black text-white/[0.03] tracking-tighter">
                PARK
              </div>
            </motion.div>
            {/* Center lock icon */}
            <motion.div
              style={{ opacity: useTransform(scrollYProgress, [0, 0.2], [1, 0]) }}
              className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2"
            >
              <div className="flex h-16 w-16 items-center justify-center rounded-full border border-[#0540FF]/30 bg-[#0540FF]/10 backdrop-blur-xl">
                <svg className="h-6 w-6 text-[#0540FF]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
                </svg>
              </div>
              <p className="mt-3 text-center text-xs text-gray-500">Scrollez pour ouvrir</p>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* ─── STATS BAR ─── */}
      <section className="relative z-10 -mt-20 bg-gradient-to-b from-[#060612] to-[#0a0a1a]">
        <div className="mx-auto max-w-5xl px-6 py-20">
          <Reveal>
            <div className="grid grid-cols-2 gap-8 sm:grid-cols-4">
              {[
                { v: 2000, s: '+', label: 'Places disponibles' },
                { v: 60, s: 's', label: 'Pour reserver' },
                { v: 98, s: '%', label: 'Satisfaction' },
                { v: 0, s: ' EUR', label: "D'inscription" },
              ].map(({ v, s, label }) => (
                <div key={label} className="text-center">
                  <p className="text-3xl font-black text-white">
                    {v === 0 ? '0' : <Counter value={v} />}{s}
                  </p>
                  <p className="mt-2 text-xs uppercase tracking-widest text-gray-500">{label}</p>
                </div>
              ))}
            </div>
          </Reveal>
        </div>
      </section>

      {/* ─── COMMENT CA MARCHE ─── */}
      <section className="relative bg-[#0a0a1a] py-32">
        <div className="mx-auto max-w-5xl px-6">
          <Reveal className="text-center">
            <p className="text-xs font-bold uppercase tracking-[0.3em] text-[#0540FF]">Comment ca marche</p>
            <h2 className="mt-4 text-4xl font-black text-white sm:text-5xl">
              3 etapes. <span className="text-gray-500">C&apos;est tout.</span>
            </h2>
          </Reveal>

          <div className="mt-20 grid gap-8 md:grid-cols-3">
            {[
              {
                step: '01',
                title: 'Cherchez',
                desc: 'Entrez votre destination. Les places apparaissent en temps reel sur la carte.',
                gradient: 'from-blue-500/20 to-cyan-500/20',
              },
              {
                step: '02',
                title: 'Reservez',
                desc: 'Choisissez vos horaires et payez. Vous recevez un QR code de confirmation.',
                gradient: 'from-[#0540FF]/20 to-blue-500/20',
              },
              {
                step: '03',
                title: 'Entrez',
                desc: 'Presentez votre QR code. La barriere s\'ouvre. Garez-vous.',
                gradient: 'from-emerald-500/20 to-cyan-500/20',
              },
            ].map(({ step, title, desc, gradient }, i) => (
              <Reveal key={step} delay={i * 0.15}>
                <div className="group relative overflow-hidden rounded-3xl border border-white/5 bg-white/[0.02] p-8 transition-all hover:border-white/10 hover:bg-white/[0.04]">
                  <div className={`absolute -right-10 -top-10 h-40 w-40 rounded-full bg-gradient-to-br ${gradient} blur-3xl opacity-0 transition-opacity group-hover:opacity-100`} />
                  <p className="text-5xl font-black text-white/5">{step}</p>
                  <h3 className="mt-4 text-2xl font-bold text-white">{title}</h3>
                  <p className="mt-3 text-sm leading-relaxed text-gray-500">{desc}</p>
                </div>
              </Reveal>
            ))}
          </div>

          <Reveal delay={0.3} className="mt-16 text-center">
            <Link href="/map"
              className="group inline-flex h-14 items-center gap-3 rounded-2xl bg-[#0540FF] px-10 text-sm font-bold text-white shadow-lg shadow-[#0540FF]/25 transition hover:shadow-[#0540FF]/40 hover:bg-blue-500">
              Trouver une place
              <svg className="h-4 w-4 transition-transform group-hover:translate-x-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
              </svg>
            </Link>
          </Reveal>
        </div>
      </section>

      {/* ─── POURQUOI FLASHPARK ─── */}
      <section className="relative overflow-hidden bg-[#060612] py-32">
        <div className="absolute left-1/2 top-0 -translate-x-1/2 h-px w-2/3 bg-gradient-to-r from-transparent via-[#0540FF]/20 to-transparent" />
        <div className="mx-auto max-w-5xl px-6">
          <Reveal className="text-center">
            <h2 className="text-4xl font-black text-white sm:text-5xl">
              Pourquoi <span className="bg-gradient-to-r from-[#0540FF] to-cyan-400 bg-clip-text text-transparent">Flashpark</span>
            </h2>
            <p className="mt-4 text-gray-500">La facon la plus simple de se garer en ville</p>
          </Reveal>

          <div className="mt-16 grid gap-4 sm:grid-cols-2">
            {[
              { icon: '🔒', title: 'Paiement securise', desc: 'Transactions chiffrees via Stripe. Remboursement garanti en cas d\'annulation.', accent: 'hover:border-blue-500/30' },
              { icon: '🛡️', title: 'Assurance incluse', desc: 'Chaque reservation est couverte. Garez-vous en toute serenite.', accent: 'hover:border-emerald-500/30' },
              { icon: '⚡', title: 'Smart Gate', desc: 'La barriere s\'ouvre automatiquement avec votre QR code. Sans cle ni badge.', accent: 'hover:border-amber-500/30' },
              { icon: '✅', title: 'Hotes verifies', desc: 'Documents valides, avis reels. Une communaute de confiance.', accent: 'hover:border-purple-500/30' },
            ].map(({ icon, title, desc, accent }, i) => (
              <Reveal key={title} delay={i * 0.1}>
                <div className={`rounded-2xl border border-white/5 bg-white/[0.02] p-8 transition-all ${accent} hover:bg-white/[0.04]`}>
                  <span className="text-3xl">{icon}</span>
                  <h3 className="mt-4 text-lg font-bold text-white">{title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-gray-500">{desc}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ─── DEVENIR HOTE ─── */}
      <section className="relative bg-[#0a0a1a] py-32">
        <div className="absolute left-1/2 top-0 -translate-x-1/2 h-px w-2/3 bg-gradient-to-r from-transparent via-white/5 to-transparent" />
        <div className="mx-auto max-w-6xl px-6">
          <div className="grid gap-12 lg:grid-cols-2 lg:items-center">
            <Reveal>
              <p className="text-xs font-bold uppercase tracking-[0.3em] text-blue-400">Pour les proprietaires</p>
              <h2 className="mt-5 text-5xl font-black leading-tight text-white">
                Votre place vide
                <br />
                <span className="bg-gradient-to-r from-emerald-400 to-cyan-400 bg-clip-text text-transparent">
                  vous rapporte.
                </span>
              </h2>
              <p className="mt-6 text-lg text-gray-400 leading-relaxed">
                Publiez en 5 minutes. Les conducteurs reservent.
                Flashpark gere les paiements et les acces.
              </p>

              <ul className="mt-8 space-y-4">
                {[
                  'Jusqu\'a 1 000 EUR/mois de revenus',
                  'Vous choisissez vos disponibilites',
                  'Assurance et protection incluses',
                  'Inscription et publication gratuites',
                ].map((item, i) => (
                  <Reveal key={item} delay={i * 0.08}>
                    <li className="flex items-center gap-3 text-sm text-gray-300">
                      <div className="flex h-5 w-5 items-center justify-center rounded-full bg-emerald-500/20">
                        <svg className="h-3 w-3 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                        </svg>
                      </div>
                      {item}
                    </li>
                  </Reveal>
                ))}
              </ul>

              <div className="mt-10 flex flex-wrap gap-4">
                <Link href="/host"
                  className="inline-flex h-14 items-center gap-2 rounded-2xl bg-white px-8 text-sm font-bold text-[#060612] transition hover:bg-gray-100">
                  Deposer mon annonce
                </Link>
                <Link href="/map"
                  className="inline-flex h-14 items-center gap-2 rounded-2xl border border-white/10 px-8 text-sm text-gray-300 transition hover:bg-white/5">
                  Explorer la carte
                </Link>
              </div>
            </Reveal>

            <Reveal delay={0.2}>
              <RevenueSimulator />
            </Reveal>
          </div>
        </div>
      </section>

      {/* ─── FOOTER ─── */}
      <footer className="border-t border-white/5 bg-[#060612] py-16">
        <div className="mx-auto max-w-6xl px-6">
          <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-4">
            <div>
              <p className="text-xl font-black">
                Flash<span className="text-[#0540FF]">park</span>
              </p>
              <p className="mt-4 text-sm leading-relaxed text-gray-500">
                La marketplace du parking prive en France.
              </p>
            </div>
            {[
              {
                title: 'Conducteurs',
                links: [
                  { label: 'Trouver un parking', href: '/map' },
                  { label: 'Comment ca marche', href: '/#how' },
                  { label: 'Mes reservations', href: '/dashboard' },
                ],
              },
              {
                title: 'Hotes',
                links: [
                  { label: 'Louer ma place', href: '/host' },
                  { label: 'Creer une annonce', href: '/host/listings/new' },
                  { label: 'Mes revenus', href: '/host/earnings' },
                ],
              },
              {
                title: 'Flashpark',
                links: [
                  { label: 'A propos', href: '/about' },
                  { label: 'Contact', href: '/contact' },
                  { label: 'CGU', href: '/terms' },
                ],
              },
            ].map(({ title, links }) => (
              <div key={title}>
                <p className="mb-4 text-xs font-bold uppercase tracking-[0.2em] text-gray-500">{title}</p>
                <ul className="space-y-3">
                  {links.map(({ label, href }) => (
                    <li key={label}>
                      <Link href={href} className="text-sm text-gray-500 transition hover:text-white">
                        {label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          <div className="mt-12 flex flex-col items-center justify-between gap-4 border-t border-white/5 pt-8 sm:flex-row">
            <p className="text-xs text-gray-600">2026 Flashpark SAS &middot; France</p>
            <div className="flex gap-6 text-xs text-gray-600">
              <Link href="/terms" className="transition hover:text-gray-400">Confidentialite</Link>
              <Link href="/terms" className="transition hover:text-gray-400">CGU</Link>
              <Link href="/terms" className="transition hover:text-gray-400">Cookies</Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
    </TRPCProvider>
  )
}
