'use client'

import { useState, useRef, useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { motion, useScroll, useTransform, useInView } from 'framer-motion'
import { Navbar } from '../components/navbar'
import { TRPCProvider } from '../lib/trpc/client'
import { Search, ArrowRight, Star, Shield, QrCode, Zap, Car, Warehouse, Building2, ParkingCircle, ArrowDown } from 'lucide-react'

/* ───── Design tokens ───── */
const BLUE = '#0540FF'
const BLUE_HOVER = '#0435D2'
const BLUE_LIGHT = '#EFF6FF'
const DARK = '#111827'
const BG = '#F9FAFB'
const BORDER = '#E5E7EB'
const DANGER = '#EF4444'
const SUCCESS = '#10B981'

/* ───── Reveal on scroll ───── */
function Reveal({ children, className = '', delay = 0 }: { children: React.ReactNode; className?: string; delay?: number }) {
  const ref = useRef(null)
  const inView = useInView(ref, { once: true, margin: '-60px' })
  return (
    <motion.div ref={ref}
      initial={{ opacity: 0, y: 30 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.6, delay, ease: [0.22, 1, 0.36, 1] }}
      className={className}>
      {children}
    </motion.div>
  )
}

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

/* ───── Parking type categories ───── */
const CATEGORIES = [
  { key: 'outdoor', label: 'Exterieur', icon: Car, img: 'https://images.unsplash.com/photo-1506521781263-d8422e82f27a?w=400&h=300&fit=crop' },
  { key: 'garage', label: 'Garage', icon: Warehouse, img: 'https://images.unsplash.com/photo-1558618666-fcd25c85f82e?w=400&h=300&fit=crop' },
  { key: 'covered', label: 'Couvert', icon: Building2, img: 'https://images.unsplash.com/photo-1573348722427-f1d6819fdf98?w=400&h=300&fit=crop' },
  { key: 'underground', label: 'Souterrain', icon: ParkingCircle, img: 'https://images.unsplash.com/photo-1590674899484-d5640e854abe?w=400&h=300&fit=crop' },
  { key: 'smart', label: 'Smart Gate', icon: Zap, img: 'https://images.unsplash.com/photo-1611288875785-d0bef9e2fa48?w=400&h=300&fit=crop' },
]

/* ───── Simulator ───── */
function Simulator() {
  const [price, setPrice] = useState(3)
  const [hours, setHours] = useState(6)
  const [days, setDays] = useState(5)
  const net = Math.round(price * hours * days * 4.33 * 0.8)
  return (
    <div className="relative w-full max-w-sm overflow-hidden rounded-3xl bg-white border border-gray-200 shadow-lg p-8">
      <div className="absolute -right-20 -top-20 h-40 w-40 rounded-full bg-[#0540FF]/5 blur-[80px]" />
      <p className="text-xs font-bold uppercase tracking-[0.15em] text-[#0540FF]">Simulateur de revenus</p>
      <p className="mt-1 text-sm text-gray-400">Estimez vos gains mensuels</p>
      <div className="mt-6 space-y-5">
        {[
          { l: 'Prix / heure', v: `${price} €`, val: price, set: setPrice, min: 1, max: 10, step: 0.5 },
          { l: 'Heures / jour', v: `${hours}h`, val: hours, set: setHours, min: 1, max: 24, step: 1 },
          { l: 'Jours / semaine', v: `${days}j`, val: days, set: setDays, min: 1, max: 7, step: 1 },
        ].map(({ l, v, val, set, min, max, step }) => (
          <div key={l}>
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">{l}</span>
              <span className="font-semibold text-gray-900">{v}</span>
            </div>
            <input type="range" min={min} max={max} step={step} value={val}
              onChange={(e) => set(Number(e.target.value))}
              className="mt-2 w-full accent-[#0540FF] h-1.5 rounded-full" />
          </div>
        ))}
      </div>
      <div className="mt-8 rounded-2xl bg-[#0540FF]/5 ring-1 ring-[#0540FF]/10 p-5 text-center">
        <p className="text-4xl font-black text-gray-900">{net.toLocaleString('fr-FR')} €</p>
        <p className="mt-1 text-sm text-[#0540FF] font-medium">par mois, net</p>
      </div>
    </div>
  )
}

/* ═════════════════════════════════════════
   LANDING PAGE
   ═════════════════════════════════════════ */
export default function HomePage() {
  const [q, setQ] = useState('')
  const router = useRouter()

  function handleSearch(e: React.FormEvent) {
    e.preventDefault()
    router.push(q.trim() ? `/map?q=${encodeURIComponent(q)}` : '/map')
  }

  const heroRef = useRef(null)
  const { scrollYProgress } = useScroll({ target: heroRef, offset: ['start start', 'end start'] })
  const heroY = useTransform(scrollYProgress, [0, 1], ['0%', '30%'])
  const heroOpacity = useTransform(scrollYProgress, [0, 0.7], [1, 0])

  return (
    <TRPCProvider>
    <div className="min-h-screen bg-white" style={{ fontFamily: 'Inter, sans-serif' }}>
      <Navbar />

      {/* ─── HERO ─── */}
      <section ref={heroRef} className="relative -mt-[72px] min-h-[92vh] overflow-hidden bg-gradient-to-b from-[#0A1628] via-[#0D1F3C] to-[#111827]">
        {/* Subtle grid pattern */}
        <div className="absolute inset-0 opacity-[0.03]"
          style={{ backgroundImage: 'radial-gradient(circle at 1px 1px, white 1px, transparent 0)', backgroundSize: '40px 40px' }} />

        {/* Glow */}
        <div className="absolute left-1/2 top-1/3 -translate-x-1/2 h-[50vh] w-[60vw] bg-[radial-gradient(ellipse_50%_50%_at_50%_50%,rgba(5,64,255,0.08),transparent)]" />

        <motion.div style={{ y: heroY, opacity: heroOpacity }}
          className="relative z-10 flex min-h-[92vh] flex-col items-center justify-center px-6 pt-20">

          {/* Badge */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="mb-8 flex items-center gap-2.5 rounded-full border border-white/10 bg-white/5 px-5 py-2.5 backdrop-blur-sm">
            <div className="h-2 w-2 rounded-full bg-[#0540FF] animate-pulse" />
            <span className="text-sm text-white/60 font-medium">Lancement a Nice — Ete 2026</span>
          </motion.div>

          {/* Headline */}
          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.3, ease: [0.22, 1, 0.36, 1] }}
            className="max-w-4xl text-center text-[clamp(2.5rem,6vw,4.5rem)] font-black leading-[1.05] tracking-[-0.03em] text-white">
            Le parking entre voisins.
            <br />
            <span className="bg-gradient-to-r from-[#60A5FA] to-[#0540FF] bg-clip-text text-transparent">
              40% moins cher.
            </span>
          </motion.h1>

          {/* Sub */}
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.5 }}
            className="mx-auto mt-6 max-w-lg text-center text-lg leading-relaxed text-white/40">
            Louez la place de parking d&apos;un particulier.
            Reservez en 60 secondes. Entrez avec un QR code.
          </motion.p>

          {/* Search bar */}
          <motion.form onSubmit={handleSearch}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.7 }}
            className="mx-auto mt-10 w-full max-w-xl">
            <div className="flex items-center rounded-full bg-white shadow-2xl shadow-black/20 ring-1 ring-white/10">
              <div className="flex flex-1 items-center gap-3 pl-6 pr-2 py-2">
                <Search className="h-5 w-5 text-gray-400 shrink-0" strokeWidth={2} />
                <input type="text" placeholder="Ou voulez-vous vous garer ?"
                  className="flex-1 bg-transparent text-[15px] text-gray-900 placeholder-gray-400 focus:outline-none"
                  value={q} onChange={(e) => setQ(e.target.value)} />
              </div>
              <button type="submit"
                className="m-1.5 rounded-full bg-[#0540FF] px-7 py-3 text-sm font-semibold text-white transition-colors hover:bg-[#0435D2]">
                Rechercher
              </button>
            </div>
          </motion.form>

          {/* Cities */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.9 }}
            className="mt-6 flex flex-wrap justify-center gap-2">
            {['Nice', 'Monaco', 'Cannes', 'Antibes', 'Paris', 'Lyon', 'Marseille'].map((c, i) => (
              <motion.button key={c}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.9 + i * 0.04 }}
                onClick={() => router.push(`/map?q=${c}`)}
                className="rounded-full border border-white/10 px-4 py-2 text-xs text-white/40 transition hover:bg-white/5 hover:text-white/70 hover:border-white/20">
                {c}
              </motion.button>
            ))}
          </motion.div>

          {/* Scroll hint */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.4 }}
            transition={{ delay: 1.2 }}
            className="absolute bottom-8 left-1/2 -translate-x-1/2">
            <motion.div animate={{ y: [0, 6, 0] }} transition={{ duration: 2, repeat: Infinity }}>
              <ArrowDown className="h-5 w-5 text-white/30" />
            </motion.div>
          </motion.div>
        </motion.div>
      </section>

      {/* ─── CATEGORY CARDS ─── */}
      <section className="py-16 bg-white">
        <div className="mx-auto max-w-6xl px-6">
          <Reveal>
            <h2 className="text-2xl font-bold text-gray-900 mb-8">Explorer par type</h2>
          </Reveal>
          <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide -mx-6 px-6">
            {CATEGORIES.map((cat, i) => (
              <Reveal key={cat.key} delay={i * 0.06}>
                <Link href={`/map?type=${cat.key}`}
                  className="group flex-shrink-0 w-44">
                  <div className="relative h-32 w-full overflow-hidden rounded-2xl bg-gray-100">
                    <img src={cat.img} alt={cat.label}
                      className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105" />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
                  </div>
                  <p className="mt-2.5 text-sm font-semibold text-gray-900">{cat.label}</p>
                </Link>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ─── STATS BAR ─── */}
      <section className="py-16 bg-gray-50 border-y border-gray-100">
        <div className="mx-auto max-w-5xl px-6">
          <Reveal>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
              {[
                { v: 500, s: '+', l: 'Places disponibles' },
                { v: 40, s: '%', l: 'Moins cher', prefix: '-' },
                { v: 60, s: 's', l: 'Pour reserver' },
                { v: 4.8, s: '/5', l: 'Note moyenne', noCount: true },
              ].map(({ v, s, l, prefix, noCount }) => (
                <div key={l}>
                  <p className="text-3xl font-black tracking-tight text-gray-900">
                    {prefix}{noCount ? v : <Counter value={v} />}{s}
                  </p>
                  <p className="mt-1 text-sm text-gray-500">{l}</p>
                </div>
              ))}
            </div>
          </Reveal>
        </div>
      </section>

      {/* ─── HOW IT WORKS ─── */}
      <section className="py-24 bg-white">
        <div className="mx-auto max-w-5xl px-6">
          <Reveal className="text-center mb-16">
            <p className="text-sm font-semibold uppercase tracking-wider text-[#0540FF]">
              Comment ca marche
            </p>
            <h2 className="mt-3 text-3xl md:text-4xl font-black tracking-tight text-gray-900">
              3 etapes. C&apos;est tout.
            </h2>
          </Reveal>

          <div className="grid gap-8 md:grid-cols-3">
            {[
              { n: '1', t: 'Cherchez', d: 'Entrez votre destination. Les places disponibles apparaissent en temps reel sur la carte.', icon: Search },
              { n: '2', t: 'Reservez', d: 'Choisissez vos horaires et payez en ligne. Vous recevez un QR code instantanement.', icon: Calendar },
              { n: '3', t: 'Garez-vous', d: "Montrez votre QR code ou utilisez le Smart Gate. C'est aussi simple que ca.", icon: QrCode },
            ].map(({ n, t, d, icon: Icon }, i) => (
              <Reveal key={n} delay={i * 0.1}>
                <div className="group relative h-full rounded-2xl border border-gray-100 bg-white p-8 transition-all duration-300 hover:shadow-lg hover:border-gray-200">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#0540FF]/5">
                    <Icon className="h-6 w-6 text-[#0540FF]" strokeWidth={1.8} />
                  </div>
                  <h3 className="mt-5 text-lg font-bold text-gray-900">{t}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-gray-500">{d}</p>
                  <span className="absolute top-6 right-6 text-4xl font-black text-gray-100">{n}</span>
                </div>
              </Reveal>
            ))}
          </div>

          <Reveal delay={0.3} className="mt-14 text-center">
            <Link href="/map"
              className="group inline-flex h-12 items-center gap-2 rounded-full bg-[#0540FF] px-8 text-sm font-semibold text-white transition-all hover:bg-[#0435D2] hover:shadow-lg">
              Trouver une place
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
            </Link>
          </Reveal>
        </div>
      </section>

      {/* ─── WHY FLASHPARK ─── */}
      <section className="py-24 bg-gray-50">
        <div className="mx-auto max-w-5xl px-6">
          <Reveal className="text-center mb-14">
            <h2 className="text-3xl md:text-4xl font-black tracking-tight text-gray-900">
              Pourquoi <span className="text-[#0540FF]">Flashpark</span>
            </h2>
            <p className="mt-3 text-gray-500 max-w-lg mx-auto">
              Une alternative moins chere, plus flexible et plus humaine au parking traditionnel.
            </p>
          </Reveal>

          <div className="grid gap-5 sm:grid-cols-2">
            {[
              { icon: Star, title: "Jusqu'a -40%", desc: 'Nos prix sont en moyenne 40% moins chers que les parkings publics a Nice.' },
              { icon: QrCode, title: 'Acces QR Code', desc: 'Entrez instantanement avec votre QR code. Pas de cle, pas de badge, pas d\'attente.' },
              { icon: Shield, title: '100% Securise', desc: 'Paiement Stripe securise, hotes verifies, assurance incluse sur chaque reservation.' },
              { icon: Zap, title: 'Reservation instantanee', desc: 'Confirmez en un clic. Votre place est garantie, sans aller-retour avec l\'hote.' },
            ].map(({ icon: Icon, title, desc }, i) => (
              <Reveal key={title} delay={i * 0.07}>
                <div className="rounded-2xl bg-white border border-gray-100 p-8 transition-all duration-300 hover:shadow-md hover:-translate-y-0.5">
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#0540FF]/5">
                    <Icon className="h-5 w-5 text-[#0540FF]" strokeWidth={1.8} />
                  </div>
                  <h3 className="mt-5 text-lg font-bold text-gray-900">{title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-gray-500">{desc}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ─── BECOME A HOST ─── */}
      <section className="py-24 bg-white">
        <div className="mx-auto max-w-6xl px-6">
          <div className="grid gap-16 lg:grid-cols-2 lg:items-center">
            <Reveal>
              <p className="text-sm font-semibold uppercase tracking-wider text-[#0540FF]">
                Pour les proprietaires
              </p>
              <h2 className="mt-4 text-[clamp(2rem,4vw,3rem)] font-black leading-tight tracking-tight text-gray-900">
                Votre place vide<br />
                <span className="text-[#0540FF]">vous rapporte.</span>
              </h2>
              <p className="mt-5 text-lg leading-relaxed text-gray-500">
                Publiez en 5 minutes. Les conducteurs reservent.
                Flashpark gere le paiement, les litiges et l&apos;assurance.
              </p>

              <ul className="mt-8 space-y-4">
                {[
                  "Jusqu'a 500 €/mois de revenus nets",
                  'Vous choisissez vos disponibilites',
                  'Assurance et protection incluses',
                  'Inscription et publication 100% gratuites',
                ].map((x, i) => (
                  <Reveal key={x} delay={i * 0.06}>
                    <li className="flex items-center gap-3 text-sm text-gray-600">
                      <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-green-50">
                        <svg className="h-3 w-3 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                        </svg>
                      </div>
                      {x}
                    </li>
                  </Reveal>
                ))}
              </ul>

              <div className="mt-10 flex flex-wrap gap-3">
                <Link href="/host/listings/new"
                  className="inline-flex h-12 items-center rounded-full bg-[#0540FF] px-7 text-sm font-semibold text-white transition-colors hover:bg-[#0435D2]">
                  Deposer mon annonce
                </Link>
                <Link href="/map"
                  className="inline-flex h-12 items-center rounded-full border border-gray-200 px-7 text-sm font-semibold text-gray-700 transition hover:bg-gray-50">
                  Explorer la carte
                </Link>
              </div>
            </Reveal>

            <Reveal delay={0.15}>
              <Simulator />
            </Reveal>
          </div>
        </div>
      </section>

      {/* ─── TRUST ─── */}
      <section className="py-16 bg-gray-50 border-y border-gray-100">
        <div className="mx-auto max-w-4xl px-6">
          <Reveal>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
              {[
                { icon: Shield, label: 'Paiement securise', sub: 'Stripe' },
                { icon: Star, label: 'Hotes verifies', sub: 'ID checks' },
                { icon: QrCode, label: 'Acces instantane', sub: 'QR Code' },
                { icon: Zap, label: 'Support reactif', sub: '< 24h' },
              ].map(({ icon: Icon, label, sub }) => (
                <div key={label} className="flex flex-col items-center">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#0540FF]/5">
                    <Icon className="h-5 w-5 text-[#0540FF]" strokeWidth={1.8} />
                  </div>
                  <p className="mt-3 text-sm font-semibold text-gray-900">{label}</p>
                  <p className="text-xs text-gray-400">{sub}</p>
                </div>
              ))}
            </div>
          </Reveal>
        </div>
      </section>

      {/* ─── FOOTER ─── */}
      <footer className="py-16 bg-white border-t border-gray-100">
        <div className="mx-auto max-w-6xl px-6">
          <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-4">
            <div>
              <div className="flex items-center gap-1.5">
                <div className="flex h-7 w-7 items-center justify-center rounded-md bg-[#0540FF]">
                  <span className="text-sm font-black text-white">P</span>
                </div>
                <span className="text-lg font-bold text-gray-900">
                  flash<span className="text-[#0540FF]">park</span>
                </span>
              </div>
              <p className="mt-4 text-sm leading-relaxed text-gray-400">
                La marketplace du parking prive en France. Trouvez, reservez et garez-vous en toute simplicite.
              </p>
            </div>
            {[
              { t: 'Conducteurs', l: [['Trouver un parking', '/map'], ['Comment ca marche', '/#how'], ['Mes reservations', '/dashboard']] },
              { t: 'Hotes', l: [['Louer ma place', '/host'], ['Creer une annonce', '/host/listings/new'], ['Mes revenus', '/host/earnings']] },
              { t: 'Flashpark', l: [['A propos', '/about'], ['Contact', '/contact'], ['CGU', '/terms']] },
            ].map(({ t, l }) => (
              <div key={t}>
                <p className="mb-4 text-xs font-bold uppercase tracking-wider text-gray-400">{t}</p>
                <ul className="space-y-3">
                  {l.map(([label, href]) => (
                    <li key={label}>
                      <Link href={href} className="text-sm text-gray-500 transition-colors hover:text-gray-900">{label}</Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
          <div className="mt-14 flex flex-col items-center justify-between gap-4 pt-8 border-t border-gray-100 sm:flex-row">
            <p className="text-xs text-gray-400">© 2026 Flashpark SAS · Nice, France</p>
            <div className="flex gap-6 text-xs text-gray-400">
              {['Confidentialite', 'CGU', 'Cookies'].map((x) => (
                <Link key={x} href="/terms" className="transition hover:text-gray-600">{x}</Link>
              ))}
            </div>
          </div>
        </div>
      </footer>
    </div>
    </TRPCProvider>
  )
}

function Calendar(props: React.SVGProps<SVGSVGElement> & { strokeWidth?: number }) {
  return (
    <svg {...props} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={props.strokeWidth || 2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
    </svg>
  )
}
