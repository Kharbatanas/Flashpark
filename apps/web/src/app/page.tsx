'use client'

import { useState, useRef } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import {
  motion,
  useScroll,
  useTransform,
  useInView,
} from 'framer-motion'
import { Navbar } from '../components/navbar'
import { TRPCProvider } from '../lib/trpc/client'

/* ───────── Counter ───────── */
function Counter({ value, suffix = '' }: { value: number; suffix?: string }) {
  const ref = useRef(null)
  const inView = useInView(ref, { once: true })
  const [n, setN] = useState(0)
  if (inView && n < value) {
    setTimeout(() => setN((d) => Math.min(d + Math.max(1, Math.floor(value / 35)), value)), 30)
  }
  return <span ref={ref}>{inView ? n.toLocaleString('fr-FR') : '0'}{suffix}</span>
}

/* ───────── Reveal ───────── */
function Reveal({ children, className = '', delay = 0 }: { children: React.ReactNode; className?: string; delay?: number }) {
  const ref = useRef(null)
  const inView = useInView(ref, { once: true, margin: '-60px' })
  return (
    <motion.div ref={ref} initial={{ opacity: 0, y: 40 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.7, delay, ease: [0.22, 1, 0.36, 1] }}
      className={className}>
      {children}
    </motion.div>
  )
}

/* ───────── Revenue Simulator ───────── */
function Simulator() {
  const [price, setPrice] = useState(3)
  const [hours, setHours] = useState(6)
  const [days, setDays] = useState(5)
  const net = Math.round(price * hours * days * 4.33 * 0.8)
  return (
    <div className="w-full max-w-sm rounded-3xl border border-white/10 bg-white/[0.03] p-8 backdrop-blur-xl">
      <p className="text-xs font-bold uppercase tracking-[0.25em] text-blue-400">Simulateur</p>
      <p className="mt-1 text-sm text-gray-500">Estimez vos revenus mensuels</p>
      <div className="mt-6 space-y-5">
        {[
          { label: 'Prix / heure', val: `${price} EUR`, v: price, set: setPrice, min: 1, max: 10, step: 0.5 },
          { label: 'Heures / jour', val: `${hours}h`, v: hours, set: setHours, min: 1, max: 24, step: 1 },
          { label: 'Jours / semaine', val: `${days}j`, v: days, set: setDays, min: 1, max: 7, step: 1 },
        ].map(({ label, val, v, set, min, max, step }) => (
          <div key={label}>
            <div className="flex justify-between text-sm">
              <span className="text-gray-400">{label}</span>
              <span className="font-bold text-white">{val}</span>
            </div>
            <input type="range" min={min} max={max} step={step} value={v}
              onChange={(e) => set(Number(e.target.value))}
              className="mt-2 w-full accent-[#0540FF] h-1.5" />
          </div>
        ))}
      </div>
      <div className="mt-8 rounded-2xl bg-gradient-to-r from-[#0540FF]/20 to-blue-600/20 ring-1 ring-[#0540FF]/30 p-5 text-center">
        <p className="text-4xl font-black text-white">{net.toLocaleString('fr-FR')} EUR</p>
        <p className="mt-1 text-sm text-blue-300">par mois, net</p>
      </div>
    </div>
  )
}

/* ───────── CAR SVG ───────── */
function CarSVG({ className = '' }: { className?: string }) {
  return (
    <svg viewBox="0 0 200 80" className={className} fill="none">
      {/* Body */}
      <path d="M30 55 Q30 40 50 35 L70 20 Q80 15 100 15 L130 15 Q140 15 150 20 L165 35 Q185 40 185 55 Z"
        fill="#1a1a2e" stroke="#0540FF" strokeWidth="1.5" />
      {/* Windows */}
      <path d="M75 22 L65 38 L95 38 L90 22 Z" fill="#0540FF" fillOpacity="0.3" stroke="#0540FF" strokeWidth="0.5" />
      <path d="M95 22 L95 38 L135 38 L145 22 Z" fill="#0540FF" fillOpacity="0.3" stroke="#0540FF" strokeWidth="0.5" />
      {/* Wheels */}
      <circle cx="60" cy="58" r="14" fill="#111" stroke="#333" strokeWidth="2" />
      <circle cx="60" cy="58" r="6" fill="#222" stroke="#0540FF" strokeWidth="1" />
      <circle cx="155" cy="58" r="14" fill="#111" stroke="#333" strokeWidth="2" />
      <circle cx="155" cy="58" r="6" fill="#222" stroke="#0540FF" strokeWidth="1" />
      {/* Headlights */}
      <rect x="178" y="42" width="8" height="5" rx="2" fill="#FBBF24" opacity="0.9" />
      <rect x="178" y="50" width="8" height="3" rx="1" fill="#EF4444" opacity="0.7" />
      {/* Front lights */}
      <rect x="14" y="42" width="8" height="5" rx="2" fill="#FBBF24" opacity="0.9" />
    </svg>
  )
}

/* ───────── BARRIER SVG ───────── */
function BarrierSVG({ rotation = 0 }: { rotation: number }) {
  return (
    <svg viewBox="0 0 400 200" className="w-full max-w-md" fill="none">
      {/* Post */}
      <rect x="30" y="80" width="20" height="120" rx="4" fill="#1a1a2e" stroke="#333" strokeWidth="1" />
      <rect x="25" y="70" width="30" height="15" rx="3" fill="#222" stroke="#0540FF" strokeWidth="1" />
      {/* Arm pivot */}
      <circle cx="40" cy="80" r="8" fill="#1a1a2e" stroke="#0540FF" strokeWidth="2" />
      {/* Arm */}
      <g style={{ transformOrigin: '40px 80px', transform: `rotate(${rotation}deg)` }}>
        <rect x="40" y="74" width="340" height="12" rx="4"
          fill="url(#barrier-gradient)" stroke="#0540FF" strokeWidth="0.5" />
        {/* Stripes */}
        {[0, 1, 2, 3, 4, 5, 6, 7].map((i) => (
          <rect key={i} x={80 + i * 40} y="74" width="20" height="12" rx="1"
            fill={i % 2 === 0 ? '#EF4444' : '#F8FAFC'} opacity="0.8" />
        ))}
        {/* End cap */}
        <circle cx="380" cy="80" r="6" fill="#EF4444" opacity="0.9" />
      </g>
      {/* Light on post */}
      <circle cx="40" cy="72" r="4" fill={rotation < -45 ? '#10B981' : '#EF4444'}>
        <animate attributeName="opacity" values="1;0.5;1" dur="1.5s" repeatCount="indefinite" />
      </circle>
      <defs>
        <linearGradient id="barrier-gradient" x1="40" y1="74" x2="380" y2="74">
          <stop offset="0%" stopColor="#1a1a2e" />
          <stop offset="100%" stopColor="#0f0f1a" />
        </linearGradient>
      </defs>
    </svg>
  )
}

/* ═══════════════════════════════════════
   MAIN PAGE
   ═══════════════════════════════════════ */
export default function HomePage() {
  const [q, setQ] = useState('')
  const router = useRouter()

  const heroRef = useRef(null)
  const { scrollYProgress } = useScroll({ target: heroRef, offset: ['start start', 'end start'] })

  // Barrier rotation: 0 (closed/horizontal) to -90 (open/vertical)
  const barrierRotation = useTransform(scrollYProgress, [0.05, 0.35], [0, -90])
  // Car position: starts off-screen left, drives to center
  const carX = useTransform(scrollYProgress, [0.15, 0.5], [-100, 50])
  const carOpacity = useTransform(scrollYProgress, [0.1, 0.2], [0, 1])
  // Headlight glow
  const glowOpacity = useTransform(scrollYProgress, [0.15, 0.3, 0.5], [0, 0.6, 0])
  // Content fade in after car enters
  const contentOpacity = useTransform(scrollYProgress, [0.4, 0.6], [0, 1])
  const contentY = useTransform(scrollYProgress, [0.4, 0.6], [60, 0])

  function handleSearch(e: React.FormEvent) {
    e.preventDefault()
    router.push(q.trim() ? `/map?q=${encodeURIComponent(q)}` : '/map')
  }

  return (
    <TRPCProvider>
    <div className="min-h-screen bg-[#060612] text-white overflow-x-hidden">
      <Navbar />

      {/* ─── HERO: Barrier + Car animation ─── */}
      <section ref={heroRef} className="relative min-h-[300vh]">
        <div className="sticky top-0 flex h-screen flex-col items-center justify-center overflow-hidden">
          {/* Road surface */}
          <div className="absolute bottom-0 left-0 right-0 h-1/3 bg-gradient-to-t from-[#111118] to-[#060612]">
            {/* Road lines */}
            <div className="absolute left-1/2 top-1/2 -translate-x-1/2 flex gap-6">
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="h-1 w-8 rounded-full bg-yellow-500/20" />
              ))}
            </div>
          </div>

          {/* Background glow */}
          <div className="absolute inset-0 pointer-events-none">
            <div className="absolute left-1/2 top-1/4 -translate-x-1/2 h-[500px] w-[700px] rounded-full bg-[#0540FF]/8 blur-[150px]" />
          </div>

          {/* Headlight glow effect */}
          <motion.div
            style={{ opacity: glowOpacity }}
            className="absolute left-1/2 bottom-1/4 -translate-x-1/2 h-[300px] w-[600px] rounded-full bg-gradient-to-t from-yellow-500/20 via-yellow-400/10 to-transparent blur-[80px]"
          />

          {/* Barrier */}
          <motion.div
            style={{ rotate: 0 }}
            className="absolute left-1/2 -translate-x-1/2 bottom-[28%] z-20"
          >
            <motion.div style={{ opacity: useTransform(scrollYProgress, [0.45, 0.55], [1, 0]) }}>
              <BarrierSVG rotation={useTransform(scrollYProgress, [0.05, 0.35], [0, -90]).get ? 0 : 0} />
            </motion.div>
          </motion.div>

          {/* Animated barrier using motion values */}
          <div className="absolute left-1/2 -translate-x-1/2 bottom-[28%] z-20">
            <svg viewBox="0 0 400 200" className="w-full max-w-md" fill="none">
              {/* Post */}
              <rect x="30" y="80" width="20" height="120" rx="4" fill="#1a1a2e" stroke="#333" strokeWidth="1" />
              <rect x="25" y="70" width="30" height="15" rx="3" fill="#222" stroke="#0540FF" strokeWidth="1" />
              <circle cx="40" cy="80" r="8" fill="#1a1a2e" stroke="#0540FF" strokeWidth="2" />
              {/* Animated arm */}
              <motion.g style={{
                transformOrigin: '40px 80px',
                rotate: barrierRotation,
              }}>
                <rect x="40" y="74" width="340" height="12" rx="4" fill="#0f0f1a" stroke="#333" strokeWidth="0.5" />
                {[0, 1, 2, 3, 4, 5, 6, 7].map((i) => (
                  <rect key={i} x={80 + i * 40} y="74" width="20" height="12" rx="1"
                    fill={i % 2 === 0 ? '#EF4444' : '#ffffff'} opacity="0.85" />
                ))}
                <circle cx="380" cy="80" r="6" fill="#EF4444" opacity="0.9" />
              </motion.g>
              {/* Signal light */}
              <motion.circle cx="40" cy="72" r="5"
                style={{
                  fill: useTransform(scrollYProgress, [0.1, 0.3], ['#EF4444', '#10B981']),
                }}
              />
            </svg>
          </div>

          {/* Car driving in */}
          <motion.div
            style={{ x: carX, opacity: carOpacity }}
            className="absolute bottom-[18%] z-10 w-48"
          >
            <CarSVG className="w-full drop-shadow-[0_0_30px_rgba(5,64,255,0.3)]" />
          </motion.div>

          {/* Scroll hint - before animation starts */}
          <motion.div
            style={{ opacity: useTransform(scrollYProgress, [0, 0.08], [1, 0]) }}
            className="absolute bottom-12 left-1/2 -translate-x-1/2 z-30 text-center"
          >
            <p className="text-sm text-gray-500 mb-2">Scrollez pour entrer</p>
            <motion.div
              animate={{ y: [0, 8, 0] }}
              transition={{ duration: 1.5, repeat: Infinity }}
            >
              <svg className="h-5 w-5 mx-auto text-[#0540FF]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </motion.div>
          </motion.div>

          {/* Main content - appears after car enters */}
          <motion.div
            style={{ opacity: contentOpacity, y: contentY }}
            className="relative z-30 mx-auto max-w-4xl px-6 text-center"
          >
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-5 py-2.5 backdrop-blur-sm">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-400" />
              </span>
              <span className="text-sm text-gray-300">Disponible partout en France</span>
            </div>

            <h1 className="text-[clamp(2.5rem,6vw,5rem)] font-black leading-[0.95] tracking-tight">
              <span className="block">Garez-vous</span>
              <span className="block bg-gradient-to-r from-[#0540FF] via-blue-400 to-cyan-300 bg-clip-text text-transparent">
                sans chercher.
              </span>
            </h1>

            <p className="mx-auto mt-6 max-w-lg text-lg text-gray-400">
              Reservez une place de parking privee en quelques secondes.
            </p>

            <form onSubmit={handleSearch} className="mx-auto mt-8 max-w-xl">
              <div className="flex items-center rounded-2xl bg-white/[0.08] ring-1 ring-white/10 backdrop-blur-xl transition-all focus-within:ring-[#0540FF]/50">
                <div className="flex flex-1 items-center gap-3 px-5 py-4">
                  <svg className="h-5 w-5 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  <input type="text" placeholder="Adresse, ville ou lieu..."
                    className="flex-1 bg-transparent text-sm text-white placeholder-gray-500 focus:outline-none"
                    value={q} onChange={(e) => setQ(e.target.value)} />
                </div>
                <button type="submit" className="m-1.5 rounded-xl bg-[#0540FF] px-6 py-3 text-sm font-semibold transition hover:bg-blue-500">
                  Rechercher
                </button>
              </div>
            </form>

            <div className="mt-5 flex flex-wrap justify-center gap-2">
              {['Paris', 'Lyon', 'Marseille', 'Montpellier', 'Nice', 'Toulouse', 'Bordeaux'].map((c) => (
                <button key={c} onClick={() => router.push(`/map?q=${c}`)}
                  className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-xs text-gray-400 transition hover:bg-white/10 hover:text-white">
                  {c}
                </button>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      {/* ─── STATS ─── */}
      <section className="relative z-10 bg-gradient-to-b from-[#060612] to-[#0a0a1a] py-20">
        <div className="mx-auto max-w-5xl px-6">
          <Reveal>
            <div className="grid grid-cols-2 gap-8 sm:grid-cols-4">
              {[
                { v: 2000, s: '+', l: 'Places' },
                { v: 60, s: 's', l: 'Pour reserver' },
                { v: 98, s: '%', l: 'Satisfaction' },
                { v: 0, s: ' EUR', l: "Inscription" },
              ].map(({ v, s, l }) => (
                <div key={l} className="text-center">
                  <p className="text-3xl font-black">{v === 0 ? '0' : <Counter value={v} />}{s}</p>
                  <p className="mt-2 text-xs uppercase tracking-widest text-gray-500">{l}</p>
                </div>
              ))}
            </div>
          </Reveal>
        </div>
      </section>

      {/* ─── 3 ETAPES ─── */}
      <section className="bg-[#0a0a1a] py-32">
        <div className="mx-auto max-w-5xl px-6">
          <Reveal className="text-center">
            <p className="text-xs font-bold uppercase tracking-[0.3em] text-[#0540FF]">Comment ca marche</p>
            <h2 className="mt-4 text-4xl font-black sm:text-5xl">
              3 etapes. <span className="text-gray-600">C&apos;est tout.</span>
            </h2>
          </Reveal>

          <div className="mt-20 grid gap-6 md:grid-cols-3">
            {[
              { n: '01', t: 'Cherchez', d: 'Entrez votre destination. Les places apparaissent sur la carte.', g: 'from-blue-500/20 to-cyan-500/20' },
              { n: '02', t: 'Reservez', d: 'Choisissez vos horaires et payez. Recevez un QR code.', g: 'from-[#0540FF]/20 to-blue-500/20' },
              { n: '03', t: 'Entrez', d: 'Presentez votre QR. La barriere s\'ouvre. Garez-vous.', g: 'from-emerald-500/20 to-cyan-500/20' },
            ].map(({ n, t, d, g }, i) => (
              <Reveal key={n} delay={i * 0.12}>
                <div className="group relative overflow-hidden rounded-3xl border border-white/5 bg-white/[0.02] p-8 transition hover:border-white/10 hover:bg-white/[0.04]">
                  <div className={`absolute -right-10 -top-10 h-40 w-40 rounded-full bg-gradient-to-br ${g} blur-3xl opacity-0 transition group-hover:opacity-100`} />
                  <p className="text-5xl font-black text-white/5">{n}</p>
                  <h3 className="mt-4 text-2xl font-bold">{t}</h3>
                  <p className="mt-3 text-sm leading-relaxed text-gray-500">{d}</p>
                </div>
              </Reveal>
            ))}
          </div>

          <Reveal delay={0.3} className="mt-14 text-center">
            <Link href="/map" className="group inline-flex h-14 items-center gap-3 rounded-2xl bg-[#0540FF] px-10 text-sm font-bold shadow-lg shadow-[#0540FF]/25 transition hover:shadow-[#0540FF]/40 hover:bg-blue-500">
              Trouver une place
              <svg className="h-4 w-4 transition-transform group-hover:translate-x-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
              </svg>
            </Link>
          </Reveal>
        </div>
      </section>

      {/* ─── POURQUOI ─── */}
      <section className="relative bg-[#060612] py-32 overflow-hidden">
        <div className="absolute left-1/2 top-0 -translate-x-1/2 h-px w-2/3 bg-gradient-to-r from-transparent via-[#0540FF]/20 to-transparent" />
        <div className="mx-auto max-w-5xl px-6">
          <Reveal className="text-center">
            <h2 className="text-4xl font-black sm:text-5xl">
              Pourquoi <span className="bg-gradient-to-r from-[#0540FF] to-cyan-400 bg-clip-text text-transparent">Flashpark</span>
            </h2>
          </Reveal>
          <div className="mt-14 grid gap-4 sm:grid-cols-2">
            {[
              { i: '🔒', t: 'Paiement securise', d: 'Stripe. Remboursement garanti.', a: 'hover:border-blue-500/30' },
              { i: '🛡️', t: 'Assurance incluse', d: 'Chaque reservation est couverte.', a: 'hover:border-emerald-500/30' },
              { i: '⚡', t: 'Smart Gate', d: 'La barriere s\'ouvre avec votre QR.', a: 'hover:border-amber-500/30' },
              { i: '✅', t: 'Hotes verifies', d: 'Avis reels. Communaute de confiance.', a: 'hover:border-purple-500/30' },
            ].map(({ i, t, d, a }, idx) => (
              <Reveal key={t} delay={idx * 0.1}>
                <div className={`rounded-2xl border border-white/5 bg-white/[0.02] p-8 transition ${a} hover:bg-white/[0.04]`}>
                  <span className="text-3xl">{i}</span>
                  <h3 className="mt-4 text-lg font-bold">{t}</h3>
                  <p className="mt-2 text-sm text-gray-500">{d}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ─── DEVENIR HOTE ─── */}
      <section className="bg-[#0a0a1a] py-32">
        <div className="absolute left-1/2 top-0 -translate-x-1/2 h-px w-2/3 bg-gradient-to-r from-transparent via-white/5 to-transparent" />
        <div className="mx-auto max-w-6xl px-6">
          <div className="grid gap-12 lg:grid-cols-2 lg:items-center">
            <Reveal>
              <p className="text-xs font-bold uppercase tracking-[0.3em] text-blue-400">Pour les proprietaires</p>
              <h2 className="mt-5 text-5xl font-black leading-tight">
                Votre place vide<br />
                <span className="bg-gradient-to-r from-emerald-400 to-cyan-400 bg-clip-text text-transparent">vous rapporte.</span>
              </h2>
              <p className="mt-6 text-lg text-gray-400">
                Publiez en 5 minutes. Les conducteurs reservent. Flashpark gere tout.
              </p>
              <ul className="mt-8 space-y-4">
                {['Jusqu\'a 1 000 EUR/mois', 'Vous choisissez vos dispos', 'Assurance incluse', 'Publication gratuite'].map((x, i) => (
                  <Reveal key={x} delay={i * 0.08}>
                    <li className="flex items-center gap-3 text-sm text-gray-300">
                      <div className="flex h-5 w-5 items-center justify-center rounded-full bg-emerald-500/20">
                        <svg className="h-3 w-3 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                        </svg>
                      </div>
                      {x}
                    </li>
                  </Reveal>
                ))}
              </ul>
              <div className="mt-10 flex flex-wrap gap-4">
                <Link href="/host" className="inline-flex h-14 items-center rounded-2xl bg-white px-8 text-sm font-bold text-[#060612] transition hover:bg-gray-100">
                  Deposer mon annonce
                </Link>
                <Link href="/map" className="inline-flex h-14 items-center rounded-2xl border border-white/10 px-8 text-sm text-gray-300 transition hover:bg-white/5">
                  Explorer la carte
                </Link>
              </div>
            </Reveal>
            <Reveal delay={0.2}>
              <Simulator />
            </Reveal>
          </div>
        </div>
      </section>

      {/* ─── FOOTER ─── */}
      <footer className="border-t border-white/5 bg-[#060612] py-16">
        <div className="mx-auto max-w-6xl px-6">
          <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-4">
            <div>
              <p className="text-xl font-black">Flash<span className="text-[#0540FF]">park</span></p>
              <p className="mt-4 text-sm text-gray-600">La marketplace du parking prive en France.</p>
            </div>
            {[
              { t: 'Conducteurs', l: [['Trouver un parking', '/map'], ['Comment ca marche', '/#how'], ['Mes reservations', '/dashboard']] },
              { t: 'Hotes', l: [['Louer ma place', '/host'], ['Creer une annonce', '/host/listings/new'], ['Mes revenus', '/host/earnings']] },
              { t: 'Flashpark', l: [['A propos', '/about'], ['Contact', '/contact'], ['CGU', '/terms']] },
            ].map(({ t, l }) => (
              <div key={t}>
                <p className="mb-4 text-xs font-bold uppercase tracking-[0.2em] text-gray-500">{t}</p>
                <ul className="space-y-3">
                  {l.map(([label, href]) => (
                    <li key={label}><Link href={href} className="text-sm text-gray-500 transition hover:text-white">{label}</Link></li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
          <div className="mt-12 flex flex-col items-center justify-between gap-4 border-t border-white/5 pt-8 sm:flex-row">
            <p className="text-xs text-gray-600">2026 Flashpark SAS &middot; France</p>
            <div className="flex gap-6 text-xs text-gray-600">
              {['Confidentialite', 'CGU', 'Cookies'].map((x) => (
                <Link key={x} href="/terms" className="transition hover:text-gray-400">{x}</Link>
              ))}
            </div>
          </div>
        </div>
      </footer>
    </div>
    </TRPCProvider>
  )
}
