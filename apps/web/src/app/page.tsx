'use client'

import { useState, useRef, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { motion, useScroll, useTransform, useInView } from 'framer-motion'
import Lottie from 'lottie-react'
import { Navbar } from '../components/navbar'
import { TRPCProvider } from '../lib/trpc/client'

/* ───── Lottie animation data (car driving) ───── */
const CAR_ANIMATION_URL = 'https://lottie.host/b72e8c90-cdb0-4ed4-bfb2-6644e205d900/7lMiKPJJIi.json'

/* ───── Counter ───── */
function Counter({ value, suffix = '' }: { value: number; suffix?: string }) {
  const ref = useRef(null)
  const inView = useInView(ref, { once: true })
  const [n, setN] = useState(0)
  useEffect(() => {
    if (!inView) return
    const step = Math.max(1, Math.floor(value / 40))
    const interval = setInterval(() => {
      setN((prev) => {
        if (prev >= value) { clearInterval(interval); return value }
        return Math.min(prev + step, value)
      })
    }, 30)
    return () => clearInterval(interval)
  }, [inView, value])
  return <span ref={ref}>{n.toLocaleString('fr-FR')}{suffix}</span>
}

/* ───── Reveal on scroll ───── */
function Reveal({ children, className = '', delay = 0 }: { children: React.ReactNode; className?: string; delay?: number }) {
  const ref = useRef(null)
  const inView = useInView(ref, { once: true, margin: '-80px' })
  return (
    <motion.div ref={ref}
      initial={{ opacity: 0, y: 50 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.8, delay, ease: [0.22, 1, 0.36, 1] }}
      className={className}>
      {children}
    </motion.div>
  )
}

/* ───── Text reveal word by word ───── */
function TextReveal({ text, className = '' }: { text: string; className?: string }) {
  const ref = useRef(null)
  const inView = useInView(ref, { once: true, margin: '-40px' })
  const words = text.split(' ')
  return (
    <span ref={ref} className={className}>
      {words.map((word, i) => (
        <motion.span key={i} className="inline-block mr-[0.3em]"
          initial={{ opacity: 0, y: 20, filter: 'blur(8px)' }}
          animate={inView ? { opacity: 1, y: 0, filter: 'blur(0px)' } : {}}
          transition={{ duration: 0.5, delay: i * 0.08, ease: [0.22, 1, 0.36, 1] }}>
          {word}
        </motion.span>
      ))}
    </span>
  )
}

/* ───── Simulator ───── */
function Simulator() {
  const [price, setPrice] = useState(3)
  const [hours, setHours] = useState(6)
  const [days, setDays] = useState(5)
  const net = Math.round(price * hours * days * 4.33 * 0.8)
  return (
    <div className="relative w-full max-w-sm overflow-hidden rounded-3xl border border-white/[0.08] bg-gradient-to-b from-white/[0.05] to-transparent p-8">
      <div className="absolute -right-20 -top-20 h-40 w-40 rounded-full bg-[#0540FF]/10 blur-[80px]" />
      <p className="text-xs font-bold uppercase tracking-[0.25em] text-[#0540FF]">Simulateur</p>
      <p className="mt-1 text-sm text-white/40">Estimez vos revenus mensuels</p>
      <div className="mt-6 space-y-5">
        {[
          { l: 'Prix / heure', v: `${price} EUR`, val: price, set: setPrice, min: 1, max: 10, step: 0.5 },
          { l: 'Heures / jour', v: `${hours}h`, val: hours, set: setHours, min: 1, max: 24, step: 1 },
          { l: 'Jours / semaine', v: `${days}j`, val: days, set: setDays, min: 1, max: 7, step: 1 },
        ].map(({ l, v, val, set, min, max, step }) => (
          <div key={l}>
            <div className="flex justify-between text-sm">
              <span className="text-white/40">{l}</span>
              <span className="font-semibold text-white">{v}</span>
            </div>
            <input type="range" min={min} max={max} step={step} value={val}
              onChange={(e) => set(Number(e.target.value))}
              className="mt-2 w-full accent-[#0540FF] h-1" />
          </div>
        ))}
      </div>
      <div className="mt-8 rounded-2xl bg-[#0540FF]/10 ring-1 ring-[#0540FF]/20 p-5 text-center">
        <p className="text-4xl font-black text-white">{net.toLocaleString('fr-FR')} EUR</p>
        <p className="mt-1 text-sm text-[#0540FF]">par mois, net</p>
      </div>
    </div>
  )
}

/* ═════════════════════════════════════════
   LANDING PAGE
   ═════════════════════════════════════════ */
export default function HomePage() {
  const [q, setQ] = useState('')
  const [lottieData, setLottieData] = useState<object | null>(null)
  const router = useRouter()

  // Load Lottie animation
  useEffect(() => {
    fetch(CAR_ANIMATION_URL)
      .then((r) => r.json())
      .then(setLottieData)
      .catch(() => {})
  }, [])

  // Parallax
  const heroRef = useRef(null)
  const { scrollYProgress } = useScroll({ target: heroRef, offset: ['start start', 'end start'] })
  const heroY = useTransform(scrollYProgress, [0, 1], ['0%', '30%'])
  const heroOpacity = useTransform(scrollYProgress, [0, 0.5], [1, 0])

  function handleSearch(e: React.FormEvent) {
    e.preventDefault()
    router.push(q.trim() ? `/map?q=${encodeURIComponent(q)}` : '/map')
  }

  return (
    <TRPCProvider>
    <div className="min-h-screen bg-[#050510] text-white selection:bg-[#0540FF]/20">
      <Navbar />

      {/* ─── HERO ─── */}
      <section ref={heroRef} className="relative -mt-16 min-h-screen overflow-hidden">
        {/* Ambient light */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute left-1/2 top-0 -translate-x-1/2 h-[80vh] w-[120vw] bg-[radial-gradient(ellipse_50%_50%_at_50%_0%,#0540FF15,transparent)]" />
          <div className="absolute bottom-0 left-1/2 -translate-x-1/2 h-[50vh] w-[100vw] bg-[radial-gradient(ellipse_60%_50%_at_50%_100%,#0540FF08,transparent)]" />
        </div>

        {/* Grid pattern */}
        <div className="absolute inset-0 opacity-[0.015]"
          style={{ backgroundImage: 'linear-gradient(white 1px, transparent 1px), linear-gradient(90deg, white 1px, transparent 1px)', backgroundSize: '60px 60px' }} />

        <motion.div style={{ y: heroY, opacity: heroOpacity }}
          className="relative z-10 flex min-h-screen flex-col items-center justify-center px-6 pt-16">

          {/* Badge */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="mb-10 flex items-center gap-2.5 rounded-full border border-white/[0.08] bg-white/[0.03] px-5 py-2.5 backdrop-blur-xl">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-400" />
            </span>
            <span className="text-sm text-white/60">Disponible partout en France</span>
          </motion.div>

          {/* Headline */}
          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.5, ease: [0.22, 1, 0.36, 1] }}
            className="max-w-4xl text-center text-[clamp(2.8rem,7vw,5.5rem)] font-black leading-[0.95] tracking-[-0.02em]">
            Trouvez votre place.
            <br />
            <span className="bg-gradient-to-r from-[#0540FF] via-blue-400 to-cyan-300 bg-clip-text text-transparent">
              Entrez directement.
            </span>
          </motion.h1>

          {/* Sub */}
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.8 }}
            className="mx-auto mt-8 max-w-xl text-center text-lg leading-relaxed text-white/40">
            Reservez un parking prive en quelques secondes.
            QR code, Smart Gate, c&apos;est aussi simple que ca.
          </motion.p>

          {/* Search */}
          <motion.form onSubmit={handleSearch}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 1 }}
            className="mx-auto mt-10 w-full max-w-xl">
            <div className="flex items-center rounded-2xl bg-white/[0.06] ring-1 ring-white/[0.08] backdrop-blur-xl transition-all focus-within:ring-[#0540FF]/40 focus-within:bg-white/[0.08]">
              <div className="flex flex-1 items-center gap-3 px-5 py-4">
                <svg className="h-5 w-5 text-white/30" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                <input type="text" placeholder="Ou voulez-vous vous garer ?"
                  className="flex-1 bg-transparent text-sm text-white placeholder-white/30 focus:outline-none"
                  value={q} onChange={(e) => setQ(e.target.value)} />
              </div>
              <button type="submit" className="m-1.5 rounded-xl bg-[#0540FF] px-7 py-3 text-sm font-semibold transition hover:bg-[#0540FF]/90">
                Rechercher
              </button>
            </div>
          </motion.form>

          {/* Cities */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.3 }}
            className="mt-6 flex flex-wrap justify-center gap-2">
            {['Paris', 'Lyon', 'Marseille', 'Montpellier', 'Nice', 'Toulouse', 'Bordeaux'].map((c, i) => (
              <motion.button key={c}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 1.3 + i * 0.04 }}
                onClick={() => router.push(`/map?q=${c}`)}
                className="rounded-full border border-white/[0.06] px-4 py-2 text-xs text-white/40 transition hover:bg-white/[0.06] hover:text-white/70">
                {c}
              </motion.button>
            ))}
          </motion.div>

          {/* Lottie car animation */}
          {lottieData && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1.5 }}
              className="mt-12 w-full max-w-lg opacity-60">
              <Lottie animationData={lottieData} loop autoplay
                style={{ width: '100%', height: 'auto', maxHeight: '200px' }} />
            </motion.div>
          )}
        </motion.div>

        {/* Scroll indicator */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 2 }}
          className="absolute bottom-8 left-1/2 -translate-x-1/2 z-20">
          <motion.div animate={{ y: [0, 8, 0] }} transition={{ duration: 2, repeat: Infinity }}>
            <div className="flex h-10 w-6 items-start justify-center rounded-full border border-white/10 p-1.5">
              <motion.div className="h-1.5 w-1.5 rounded-full bg-[#0540FF]"
                animate={{ y: [0, 12, 0] }}
                transition={{ duration: 2, repeat: Infinity }} />
            </div>
          </motion.div>
        </motion.div>
      </section>

      {/* ─── STATS ─── */}
      <section className="relative z-10 py-24">
        <div className="absolute left-1/2 top-0 -translate-x-1/2 h-px w-1/2 bg-gradient-to-r from-transparent via-white/[0.06] to-transparent" />
        <div className="mx-auto max-w-4xl px-6">
          <Reveal>
            <div className="grid grid-cols-2 gap-8 sm:grid-cols-4">
              {[
                { v: 2000, s: '+', l: 'Places' },
                { v: 60, s: 's', l: 'Pour reserver' },
                { v: 98, s: '%', l: 'Satisfaction' },
                { v: 0, s: ' EUR', l: 'Inscription' },
              ].map(({ v, s, l }) => (
                <div key={l} className="text-center">
                  <p className="text-3xl font-black tracking-tight">
                    {v === 0 ? '0' : <Counter value={v} />}{s}
                  </p>
                  <p className="mt-2 text-[11px] uppercase tracking-[0.2em] text-white/30">{l}</p>
                </div>
              ))}
            </div>
          </Reveal>
        </div>
      </section>

      {/* ─── COMMENT CA MARCHE ─── */}
      <section className="py-32">
        <div className="mx-auto max-w-5xl px-6">
          <Reveal className="text-center mb-20">
            <p className="text-xs font-bold uppercase tracking-[0.3em] text-[#0540FF]">Comment ca marche</p>
            <h2 className="mt-4 text-4xl font-black sm:text-5xl">
              <TextReveal text="Trouvez. Reservez. Entrez." />
            </h2>
          </Reveal>

          <div className="grid gap-6 md:grid-cols-3">
            {[
              { n: '01', t: 'Cherchez', d: 'Entrez votre destination. Les places disponibles apparaissent en temps reel.', color: 'from-blue-500 to-cyan-500' },
              { n: '02', t: 'Reservez', d: 'Choisissez vos horaires et payez en ligne. Vous recevez un QR code.', color: 'from-[#0540FF] to-blue-500' },
              { n: '03', t: 'Entrez', d: 'Montrez votre QR. La barriere s\'ouvre. C\'est aussi simple que ca.', color: 'from-emerald-500 to-teal-500' },
            ].map(({ n, t, d, color }, i) => (
              <Reveal key={n} delay={i * 0.15}>
                <div className="group relative h-full overflow-hidden rounded-3xl border border-white/[0.05] bg-white/[0.02] p-10 transition-all duration-500 hover:border-white/[0.1] hover:bg-white/[0.04]">
                  {/* Hover glow */}
                  <div className={`absolute -right-10 -top-10 h-32 w-32 rounded-full bg-gradient-to-br ${color} blur-3xl opacity-0 transition-opacity duration-500 group-hover:opacity-20`} />
                  {/* Number */}
                  <span className={`bg-gradient-to-br ${color} bg-clip-text text-6xl font-black text-transparent opacity-20`}>{n}</span>
                  <h3 className="mt-4 text-xl font-bold">{t}</h3>
                  <p className="mt-3 text-sm leading-relaxed text-white/40">{d}</p>
                </div>
              </Reveal>
            ))}
          </div>

          <Reveal delay={0.3} className="mt-16 text-center">
            <Link href="/map"
              className="group inline-flex h-14 items-center gap-3 rounded-2xl bg-[#0540FF] px-10 text-sm font-bold shadow-[0_0_40px_-8px_#0540FF] transition-all hover:shadow-[0_0_60px_-8px_#0540FF] hover:bg-[#0540FF]/90">
              Trouver une place maintenant
              <svg className="h-4 w-4 transition-transform group-hover:translate-x-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
              </svg>
            </Link>
          </Reveal>
        </div>
      </section>

      {/* ─── POURQUOI FLASHPARK ─── */}
      <section className="relative py-32 overflow-hidden">
        <div className="absolute left-1/2 top-0 -translate-x-1/2 h-px w-1/2 bg-gradient-to-r from-transparent via-[#0540FF]/15 to-transparent" />
        <div className="mx-auto max-w-5xl px-6">
          <Reveal className="text-center mb-16">
            <h2 className="text-4xl font-black sm:text-5xl">
              Pourquoi{' '}
              <span className="bg-gradient-to-r from-[#0540FF] to-cyan-400 bg-clip-text text-transparent">
                Flashpark
              </span>
            </h2>
          </Reveal>

          <div className="grid gap-4 sm:grid-cols-2">
            {[
              { icon: '🔒', title: 'Paiement securise', desc: 'Transactions chiffrees via Stripe. Remboursement garanti.', border: 'hover:border-blue-500/20' },
              { icon: '🛡️', title: 'Assurance incluse', desc: 'Chaque reservation est couverte par notre assurance.', border: 'hover:border-emerald-500/20' },
              { icon: '⚡', title: 'Smart Gate', desc: 'La barriere s\'ouvre automatiquement avec votre QR code.', border: 'hover:border-amber-500/20' },
              { icon: '✅', title: 'Hotes verifies', desc: 'Documents valides, avis authentiques, communaute de confiance.', border: 'hover:border-purple-500/20' },
            ].map(({ icon, title, desc, border }, i) => (
              <Reveal key={title} delay={i * 0.1}>
                <div className={`rounded-2xl border border-white/[0.05] bg-white/[0.02] p-8 transition-all duration-300 ${border} hover:bg-white/[0.04]`}>
                  <span className="text-3xl">{icon}</span>
                  <h3 className="mt-5 text-lg font-bold">{title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-white/40">{desc}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ─── DEVENIR HOTE ─── */}
      <section className="py-32">
        <div className="mx-auto max-w-6xl px-6">
          <div className="grid gap-16 lg:grid-cols-2 lg:items-center">
            <Reveal>
              <p className="text-xs font-bold uppercase tracking-[0.3em] text-[#0540FF]">Pour les proprietaires</p>
              <h2 className="mt-5 text-[clamp(2rem,4vw,3.5rem)] font-black leading-tight">
                Votre place vide<br />
                <span className="bg-gradient-to-r from-emerald-400 to-cyan-300 bg-clip-text text-transparent">
                  vous rapporte.
                </span>
              </h2>
              <p className="mt-6 text-lg text-white/40 leading-relaxed">
                Publiez en 5 minutes. Les conducteurs reservent.
                Flashpark gere tout le reste.
              </p>

              <ul className="mt-10 space-y-4">
                {[
                  'Jusqu\'a 1 000 EUR/mois de revenus',
                  'Vous choisissez vos disponibilites',
                  'Assurance et protection incluses',
                  'Inscription et publication gratuites',
                ].map((x, i) => (
                  <Reveal key={x} delay={i * 0.08}>
                    <li className="flex items-center gap-3 text-sm text-white/60">
                      <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-emerald-500/15">
                        <svg className="h-3 w-3 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                        </svg>
                      </div>
                      {x}
                    </li>
                  </Reveal>
                ))}
              </ul>

              <div className="mt-12 flex flex-wrap gap-4">
                <Link href="/host"
                  className="inline-flex h-14 items-center rounded-2xl bg-white px-8 text-sm font-bold text-[#050510] transition hover:bg-white/90">
                  Deposer mon annonce
                </Link>
                <Link href="/map"
                  className="inline-flex h-14 items-center rounded-2xl border border-white/10 px-8 text-sm text-white/60 transition hover:bg-white/[0.04] hover:text-white">
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
      <footer className="border-t border-white/[0.04] py-16">
        <div className="mx-auto max-w-6xl px-6">
          <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-4">
            <div>
              <p className="text-xl font-black">Flash<span className="text-[#0540FF]">park</span></p>
              <p className="mt-4 text-sm text-white/25 leading-relaxed">
                La marketplace du parking prive en France.
              </p>
            </div>
            {[
              { t: 'Conducteurs', l: [['Trouver un parking', '/map'], ['Comment ca marche', '/#how'], ['Mes reservations', '/dashboard']] },
              { t: 'Hotes', l: [['Louer ma place', '/host'], ['Creer une annonce', '/host/listings/new'], ['Mes revenus', '/host/earnings']] },
              { t: 'Flashpark', l: [['A propos', '/about'], ['Contact', '/contact'], ['CGU', '/terms']] },
            ].map(({ t, l }) => (
              <div key={t}>
                <p className="mb-4 text-[11px] font-bold uppercase tracking-[0.2em] text-white/25">{t}</p>
                <ul className="space-y-3">
                  {l.map(([label, href]) => (
                    <li key={label}>
                      <Link href={href} className="text-sm text-white/30 transition hover:text-white/70">{label}</Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
          <div className="mt-14 flex flex-col items-center justify-between gap-4 border-t border-white/[0.04] pt-8 sm:flex-row">
            <p className="text-xs text-white/20">2026 Flashpark SAS &middot; France</p>
            <div className="flex gap-6 text-xs text-white/20">
              {['Confidentialite', 'CGU', 'Cookies'].map((x) => (
                <Link key={x} href="/terms" className="transition hover:text-white/40">{x}</Link>
              ))}
            </div>
          </div>
        </div>
      </footer>
    </div>
    </TRPCProvider>
  )
}
