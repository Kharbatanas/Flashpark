'use client'

import { useState, useRef, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { motion, useScroll, useTransform, useInView, AnimatePresence } from 'framer-motion'
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

/* ───── Floating Particles (lightweight canvas) ───── */
function Particles() {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    let animId: number
    let w = 0, h = 0

    interface Dot { x: number; y: number; vx: number; vy: number; r: number; o: number }
    const dots: Dot[] = []
    const COUNT = 60
    const LINK_DIST = 120

    function resize() {
      w = canvas!.width = canvas!.offsetWidth * devicePixelRatio
      h = canvas!.height = canvas!.offsetHeight * devicePixelRatio
      ctx!.scale(devicePixelRatio, devicePixelRatio)
    }

    function init() {
      resize()
      dots.length = 0
      const cw = canvas!.offsetWidth, ch = canvas!.offsetHeight
      for (let i = 0; i < COUNT; i++) {
        dots.push({
          x: Math.random() * cw,
          y: Math.random() * ch,
          vx: (Math.random() - 0.5) * 0.4,
          vy: (Math.random() - 0.5) * 0.4,
          r: Math.random() * 1.5 + 0.5,
          o: Math.random() * 0.5 + 0.1,
        })
      }
    }

    function draw() {
      const cw = canvas!.offsetWidth, ch = canvas!.offsetHeight
      ctx!.clearRect(0, 0, cw, ch)

      // Move & draw dots
      for (const d of dots) {
        d.x += d.vx; d.y += d.vy
        if (d.x < 0 || d.x > cw) d.vx *= -1
        if (d.y < 0 || d.y > ch) d.vy *= -1
        ctx!.beginPath()
        ctx!.arc(d.x, d.y, d.r, 0, Math.PI * 2)
        ctx!.fillStyle = `rgba(5, 64, 255, ${d.o})`
        ctx!.fill()
      }

      // Draw links
      for (let i = 0; i < dots.length; i++) {
        for (let j = i + 1; j < dots.length; j++) {
          const dx = dots[i].x - dots[j].x
          const dy = dots[i].y - dots[j].y
          const dist = Math.sqrt(dx * dx + dy * dy)
          if (dist < LINK_DIST) {
            ctx!.beginPath()
            ctx!.moveTo(dots[i].x, dots[i].y)
            ctx!.lineTo(dots[j].x, dots[j].y)
            ctx!.strokeStyle = `rgba(5, 64, 255, ${0.08 * (1 - dist / LINK_DIST)})`
            ctx!.lineWidth = 0.5
            ctx!.stroke()
          }
        }
      }

      animId = requestAnimationFrame(draw)
    }

    init()
    draw()
    window.addEventListener('resize', init)
    return () => { cancelAnimationFrame(animId); window.removeEventListener('resize', init) }
  }, [])

  return <canvas ref={canvasRef} className="absolute inset-0 w-full h-full pointer-events-none" style={{ opacity: 0.6 }} />
}

/* ───── Typewriter effect ───── */
function TypeWriter({ text, delay = 0, speed = 40, className = '' }: { text: string; delay?: number; speed?: number; className?: string }) {
  const [displayed, setDisplayed] = useState('')
  const [started, setStarted] = useState(false)

  useEffect(() => {
    const timeout = setTimeout(() => setStarted(true), delay)
    return () => clearTimeout(timeout)
  }, [delay])

  useEffect(() => {
    if (!started) return
    if (displayed.length >= text.length) return
    const timeout = setTimeout(() => {
      setDisplayed(text.slice(0, displayed.length + 1))
    }, speed)
    return () => clearTimeout(timeout)
  }, [started, displayed, text, speed])

  return (
    <span className={className}>
      {displayed}
      {displayed.length < text.length && started && (
        <motion.span
          animate={{ opacity: [1, 0] }}
          transition={{ duration: 0.5, repeat: Infinity, repeatType: 'reverse' }}
          className="inline-block w-[3px] h-[1em] bg-[#0540FF] ml-0.5 align-middle rounded-full"
        />
      )}
    </span>
  )
}

/* ───── Morphing rotating text ───── */
const MORPH_WORDS = [
  { text: '40% moins cher.', gradient: 'from-[#60A5FA] to-[#0540FF]' },
  { text: '500+ places dispo.', gradient: 'from-[#34D399] to-[#059669]' },
  { text: 'Reserve en 60s.', gradient: 'from-[#FBBF24] to-[#F59E0B]' },
  { text: 'Acces QR code.', gradient: 'from-[#A78BFA] to-[#7C3AED]' },
]

function MorphText({ delay = 0 }: { delay?: number }) {
  const [index, setIndex] = useState(0)
  const [started, setStarted] = useState(false)

  useEffect(() => {
    const timeout = setTimeout(() => setStarted(true), delay)
    return () => clearTimeout(timeout)
  }, [delay])

  useEffect(() => {
    if (!started) return
    const interval = setInterval(() => {
      setIndex(prev => (prev + 1) % MORPH_WORDS.length)
    }, 2800)
    return () => clearInterval(interval)
  }, [started])

  const current = MORPH_WORDS[index]

  return (
    <span className="relative inline-block min-w-[280px]">
      <AnimatePresence mode="wait">
        <motion.span
          key={current.text}
          initial={{ opacity: 0, y: 20, filter: 'blur(8px)' }}
          animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
          exit={{ opacity: 0, y: -20, filter: 'blur(8px)' }}
          transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
          className={`bg-gradient-to-r ${current.gradient} bg-clip-text text-transparent`}
        >
          {current.text}
        </motion.span>
      </AnimatePresence>
    </span>
  )
}

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
  { key: 'outdoor', label: 'Exterieur', icon: Car, color: 'from-sky-400 to-blue-500' },
  { key: 'garage', label: 'Garage', icon: Warehouse, color: 'from-amber-400 to-orange-500' },
  { key: 'covered', label: 'Couvert', icon: Building2, color: 'from-emerald-400 to-green-500' },
  { key: 'underground', label: 'Souterrain', icon: ParkingCircle, color: 'from-violet-400 to-purple-500' },
  { key: 'smart', label: 'Smart Gate', icon: Zap, color: 'from-blue-500 to-indigo-600' },
]

/* ───── Simulator ───── */
function Simulator() {
  const [price, setPrice] = useState(3)
  const [hours, setHours] = useState(6)
  const [days, setDays] = useState(5)
  const net = Math.round(price * hours * days * 4.33 * 0.8)
  return (
    <div className="relative w-full max-w-sm overflow-hidden rounded-3xl bg-white/[0.06] backdrop-blur-sm border border-white/10 shadow-2xl p-8">
      <div className="absolute -right-20 -top-20 h-40 w-40 rounded-full bg-[#0540FF]/10 blur-[80px]" />
      <p className="text-xs font-bold uppercase tracking-[0.15em] text-[#0540FF]">Simulateur de revenus</p>
      <p className="mt-1 text-sm text-white/40">Estimez vos gains mensuels</p>
      <div className="mt-6 space-y-5">
        {[
          { l: 'Prix / heure', v: `${price} €`, val: price, set: setPrice, min: 1, max: 10, step: 0.5 },
          { l: 'Heures / jour', v: `${hours}h`, val: hours, set: setHours, min: 1, max: 24, step: 1 },
          { l: 'Jours / semaine', v: `${days}j`, val: days, set: setDays, min: 1, max: 7, step: 1 },
        ].map(({ l, v, val, set, min, max, step }) => (
          <div key={l}>
            <div className="flex justify-between text-sm">
              <span className="text-white/50">{l}</span>
              <span className="font-semibold text-white">{v}</span>
            </div>
            <input type="range" min={min} max={max} step={step} value={val}
              onChange={(e) => set(Number(e.target.value))}
              className="mt-2 w-full accent-[#0540FF] h-1.5 rounded-full" />
          </div>
        ))}
      </div>
      <div className="mt-8 rounded-2xl bg-[#0540FF]/10 ring-1 ring-[#0540FF]/20 p-5 text-center">
        <p className="text-4xl font-black text-white">{net.toLocaleString('fr-FR')} €</p>
        <p className="mt-1 text-sm text-[#0540FF] font-medium">par mois, net</p>
      </div>
    </div>
  )
}

/* ───── Animated road at hero bottom ───── */
function AnimatedRoad() {
  return (
    <div className="absolute bottom-0 left-0 right-0 h-24 overflow-hidden pointer-events-none z-[5]">
      {/* Road surface */}
      <div className="absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-[#0a1228]/80 to-transparent" />

      {/* Lane markings - infinite scroll */}
      <div className="absolute bottom-6 left-0 right-0 flex items-center">
        <motion.div
          animate={{ x: [0, -200] }}
          transition={{ duration: 3, repeat: Infinity, ease: 'linear' }}
          className="flex gap-8 whitespace-nowrap"
          style={{ width: '200%' }}
        >
          {Array.from({ length: 30 }).map((_, i) => (
            <div key={i} className="h-[2px] w-12 bg-white/10 rounded-full shrink-0" />
          ))}
        </motion.div>
      </div>

      {/* Car driving across */}
      <motion.div
        animate={{ x: ['-10vw', '110vw'] }}
        transition={{ duration: 8, repeat: Infinity, ease: 'linear', repeatDelay: 3 }}
        className="absolute bottom-8"
      >
        <svg width="48" height="20" viewBox="0 0 48 20" fill="none">
          {/* Simple car silhouette */}
          <path d="M8 14h32c2 0 4-2 4-4v-1c0-1-1-2-2-2h-4l-3-4c-1-1.5-2.5-2-4-2H17c-1.5 0-3 .5-4 2l-3 4H6c-1 0-2 1-2 2v1c0 2 2 4 4 4z" fill="rgba(5,64,255,0.3)" />
          <circle cx="14" cy="15" r="3" fill="rgba(5,64,255,0.4)" />
          <circle cx="34" cy="15" r="3" fill="rgba(5,64,255,0.4)" />
          {/* Headlights glow */}
          <circle cx="44" cy="10" r="2" fill="rgba(5,64,255,0.6)">
            <animate attributeName="opacity" values="0.6;1;0.6" dur="1s" repeatCount="indefinite" />
          </circle>
        </svg>
      </motion.div>

      {/* Second car going opposite direction */}
      <motion.div
        animate={{ x: ['110vw', '-10vw'] }}
        transition={{ duration: 10, repeat: Infinity, ease: 'linear', repeatDelay: 5, delay: 4 }}
        className="absolute bottom-12"
      >
        <svg width="36" height="16" viewBox="0 0 36 16" fill="none" style={{ transform: 'scaleX(-1)' }}>
          <path d="M6 11h24c1.5 0 3-1.5 3-3v-1c0-.7-.7-1.5-1.5-1.5H28l-2.3-3c-.7-1.1-1.8-1.5-3-1.5H13c-1.1 0-2.2.4-3 1.5l-2.3 3H4.5c-.8 0-1.5.8-1.5 1.5v1c0 1.5 1.5 3 3 3z" fill="rgba(255,255,255,0.08)" />
          <circle cx="10.5" cy="12" r="2.3" fill="rgba(255,255,255,0.12)" />
          <circle cx="25.5" cy="12" r="2.3" fill="rgba(255,255,255,0.12)" />
        </svg>
      </motion.div>
    </div>
  )
}

/* ───── Parking spot animation for How It Works ───── */
function ParkingAnimation() {
  return (
    <div className="relative w-32 h-24 mx-auto mb-8">
      {/* Parking spot lines */}
      <div className="absolute inset-0 flex items-end justify-center gap-8">
        <div className="w-[2px] h-16 bg-white/10 rounded-full" />
        <div className="w-[2px] h-16 bg-white/10 rounded-full" />
        <div className="w-[2px] h-16 bg-white/10 rounded-full" />
      </div>
      {/* Car sliding in */}
      <motion.div
        initial={{ y: -40, opacity: 0 }}
        whileInView={{ y: 0, opacity: 1 }}
        viewport={{ once: true }}
        transition={{ delay: 0.3, duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
        className="absolute left-1/2 -translate-x-1/2 bottom-2"
      >
        <svg width="32" height="14" viewBox="0 0 32 14" fill="none">
          <rect x="4" y="2" width="24" height="8" rx="3" fill="rgba(5,64,255,0.4)" />
          <circle cx="10" cy="11" r="2" fill="rgba(5,64,255,0.5)" />
          <circle cx="22" cy="11" r="2" fill="rgba(5,64,255,0.5)" />
        </svg>
      </motion.div>
      {/* "P" sign */}
      <motion.div
        initial={{ scale: 0 }}
        whileInView={{ scale: 1 }}
        viewport={{ once: true }}
        transition={{ delay: 0.8, type: 'spring', stiffness: 200 }}
        className="absolute -top-1 right-2 flex h-7 w-7 items-center justify-center rounded-md bg-[#0540FF]/20 border border-[#0540FF]/30"
      >
        <span className="text-xs font-black text-[#0540FF]">P</span>
      </motion.div>
    </div>
  )
}

/* ───── Bouncing map pin for Stats section ───── */
function BouncingPin() {
  return (
    <motion.div
      animate={{ y: [0, -8, 0] }}
      transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
      className="mx-auto mb-8 flex h-12 w-12 items-center justify-center"
    >
      <svg width="28" height="36" viewBox="0 0 28 36" fill="none">
        <path d="M14 0C6.3 0 0 6.3 0 14c0 10.5 14 22 14 22s14-11.5 14-22C28 6.3 21.7 0 14 0z" fill="rgba(5,64,255,0.3)" />
        <circle cx="14" cy="14" r="5" fill="rgba(5,64,255,0.6)" />
        <motion.circle cx="14" cy="14" r="8" fill="none" stroke="rgba(5,64,255,0.2)" strokeWidth="1.5"
          initial={{ scale: 1, opacity: 0.5 }}
          animate={{ scale: [1, 1.8], opacity: [0.5, 0] }}
          transition={{ duration: 2, repeat: Infinity }}
        />
      </svg>
      {/* Pin shadow */}
      <motion.div
        animate={{ scale: [1, 0.6, 1], opacity: [0.3, 0.15, 0.3] }}
        transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
        className="absolute bottom-0 h-2 w-8 rounded-full bg-[#0540FF]/20 blur-sm"
      />
    </motion.div>
  )
}

/* ───── Floating car/parking icons for Why Flashpark ───── */
function FloatingIcons() {
  const icons = ['🚗', '🅿️', '🚙', '🏎️', '🚘']
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {icons.map((icon, i) => (
        <motion.div
          key={i}
          animate={{
            y: [0, -20, 0],
            x: [0, 10, 0],
            rotate: [0, 5, -5, 0],
          }}
          transition={{
            duration: 6 + i * 2,
            repeat: Infinity,
            delay: i * 1.5,
            ease: 'easeInOut',
          }}
          className="absolute text-2xl opacity-[0.04]"
          style={{
            left: `${15 + i * 18}%`,
            top: `${20 + (i % 3) * 25}%`,
          }}
        >
          {icon}
        </motion.div>
      ))}
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
    <div className="min-h-screen" style={{ background: '#050810', fontFamily: 'Inter, sans-serif' }}>
      <Navbar />

      {/* ─── HERO ─── */}
      <section ref={heroRef} className="relative -mt-[72px] min-h-screen overflow-hidden bg-gradient-to-b from-[#050810] via-[#080e1c] to-[#0a1228]">
        {/* Floating particles */}
        <Particles />

        {/* Subtle grid pattern */}
        <div className="absolute inset-0 opacity-[0.03]"
          style={{ backgroundImage: 'radial-gradient(circle at 1px 1px, white 1px, transparent 0)', backgroundSize: '40px 40px' }} />

        {/* Glow — pulsing */}
        <motion.div
          animate={{ scale: [1, 1.15, 1], opacity: [0.08, 0.14, 0.08] }}
          transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }}
          className="absolute left-1/2 top-1/3 -translate-x-1/2 h-[50vh] w-[60vw] bg-[radial-gradient(ellipse_50%_50%_at_50%_50%,rgba(5,64,255,0.12),transparent)]" />

        <motion.div style={{ y: heroY, opacity: heroOpacity }}
          className="relative z-10 flex min-h-screen flex-col items-center justify-center px-6 pt-20">

          {/* Badge — staggered entry */}
          <motion.div
            initial={{ opacity: 0, scale: 0.8, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2, type: 'spring', stiffness: 200 }}
            className="mb-8 flex items-center gap-2.5 rounded-full border border-white/10 bg-white/5 px-5 py-2.5 backdrop-blur-sm">
            <motion.div
              animate={{ scale: [1, 1.4, 1], boxShadow: ['0 0 0 0 rgba(5,64,255,0.4)', '0 0 0 8px rgba(5,64,255,0)', '0 0 0 0 rgba(5,64,255,0.4)'] }}
              transition={{ duration: 2, repeat: Infinity }}
              className="h-2 w-2 rounded-full bg-[#0540FF]" />
            <span className="text-sm text-white/60 font-medium">Lancement a Nice — Ete 2026</span>
          </motion.div>

          {/* Headline — typewriter + morphing */}
          <h1 className="max-w-4xl text-center text-[clamp(2.5rem,6vw,4.5rem)] font-black leading-[1.05] tracking-[-0.03em] text-white">
            <TypeWriter text="Le parking entre voisins." delay={400} speed={50} />
            <br />
            <MorphText delay={2200} />
          </h1>

          {/* Sub — staggered words */}
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.8 }}
            className="mx-auto mt-6 max-w-lg text-center text-lg leading-relaxed text-white/40">
            Louez la place de parking d&apos;un particulier.
            Reservez en 60 secondes. Entrez avec un QR code.
          </motion.p>

          {/* Search bar — scale-up entrance */}
          <motion.form onSubmit={handleSearch}
            initial={{ opacity: 0, y: 30, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.7, delay: 1.0, type: 'spring', stiffness: 120 }}
            className="mx-auto mt-10 w-full max-w-xl">
            <motion.div
              whileHover={{ boxShadow: '0 25px 60px -12px rgba(5, 64, 255, 0.15)' }}
              className="flex items-center rounded-full bg-white shadow-2xl shadow-black/20 ring-1 ring-white/10 transition-shadow">
              <div className="flex flex-1 items-center gap-3 pl-6 pr-2 py-2">
                <Search className="h-5 w-5 text-gray-400 shrink-0" strokeWidth={2} />
                <input type="text" placeholder="Ou voulez-vous vous garer ?"
                  aria-label="Rechercher une place de parking"
                  className="flex-1 bg-transparent text-[15px] text-gray-900 placeholder-gray-400 focus:outline-none"
                  value={q} onChange={(e) => setQ(e.target.value)} />
              </div>
              <motion.button type="submit"
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                className="m-1.5 rounded-full bg-[#0540FF] px-7 py-3 text-sm font-semibold text-white transition-colors hover:bg-[#0435D2]">
                Rechercher
              </motion.button>
            </motion.div>
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

          {/* Scroll hint — pulse ring */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 2.5 }}
            className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2">
            <span className="text-[10px] uppercase tracking-[0.2em] text-white/20 font-medium">Scroll</span>
            <div className="relative">
              <motion.div
                animate={{ scale: [1, 1.8], opacity: [0.3, 0] }}
                transition={{ duration: 2, repeat: Infinity }}
                className="absolute inset-0 rounded-full border border-white/20" />
              <motion.div animate={{ y: [0, 6, 0] }} transition={{ duration: 2, repeat: Infinity }}>
                <ArrowDown className="h-5 w-5 text-white/30" />
              </motion.div>
            </div>
          </motion.div>
        </motion.div>

        <AnimatedRoad />
      </section>

      {/* ─── PROBLEM / SOLUTION COMPARISON ─── */}
      <section className="py-28" style={{ background: '#080e1c' }}>
        <div className="mx-auto max-w-5xl px-6">
          <Reveal className="text-center mb-16">
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#0540FF] mb-3">Le probleme vs la solution</p>
            <h2 className="text-3xl md:text-4xl font-black tracking-tight text-white">
              Fini le stress du stationnement.
            </h2>
          </Reveal>

          <div className="grid md:grid-cols-2 gap-6">

            {/* LEFT — Sans Flashpark */}
            <Reveal delay={0.05}>
              <div className="relative h-full rounded-2xl overflow-hidden border border-red-500/20 bg-white/[0.02] backdrop-blur-sm p-8">
                {/* Subtle red glow */}
                <div className="absolute -top-10 -right-10 h-32 w-32 rounded-full bg-red-500/10 blur-[60px] pointer-events-none" />

                <div className="flex items-center gap-3 mb-8">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-red-500/10 border border-red-500/20">
                    <span className="text-red-400 text-sm font-bold">✗</span>
                  </div>
                  <p className="text-sm font-bold uppercase tracking-[0.15em] text-red-400">Sans Flashpark</p>
                </div>

                <ul className="space-y-4">
                  {[
                    'Tourner 20 min pour trouver une place',
                    'Payer 4 €/h en parking public',
                    'Places toujours prises aux heures de pointe',
                    'Pas de garantie de disponibilite',
                  ].map((item, i) => (
                    <motion.li
                      key={item}
                      initial={{ opacity: 0, x: -10 }}
                      whileInView={{ opacity: 1, x: 0 }}
                      viewport={{ once: true }}
                      transition={{ delay: i * 0.08, duration: 0.4 }}
                      className="flex items-start gap-3">
                      <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-red-500/10 border border-red-500/20 text-red-400 text-xs font-bold">✗</span>
                      <span className="text-sm text-white/50 leading-relaxed">{item}</span>
                    </motion.li>
                  ))}
                </ul>
              </div>
            </Reveal>

            {/* RIGHT — Avec Flashpark */}
            <Reveal delay={0.15}>
              <div className="relative h-full rounded-2xl overflow-hidden border border-emerald-500/20 bg-white/[0.03] backdrop-blur-sm p-8">
                {/* Subtle green glow */}
                <div className="absolute -top-10 -left-10 h-32 w-32 rounded-full bg-emerald-500/10 blur-[60px] pointer-events-none" />
                {/* Blue accent glow */}
                <div className="absolute -bottom-10 -right-10 h-32 w-32 rounded-full bg-[#0540FF]/10 blur-[60px] pointer-events-none" />

                <div className="flex items-center gap-3 mb-8">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-500/10 border border-emerald-500/20">
                    <span className="text-emerald-400 text-sm font-bold">✓</span>
                  </div>
                  <p className="text-sm font-bold uppercase tracking-[0.15em] text-emerald-400">Avec Flashpark</p>
                </div>

                <ul className="space-y-4">
                  {[
                    'Reservez en 60 secondes',
                    "Jusqu'a -40% vs parking public",
                    'Place garantie et reservee',
                    'Acces instantane par QR code',
                  ].map((item, i) => (
                    <motion.li
                      key={item}
                      initial={{ opacity: 0, x: 10 }}
                      whileInView={{ opacity: 1, x: 0 }}
                      viewport={{ once: true }}
                      transition={{ delay: i * 0.08, duration: 0.4 }}
                      className="flex items-start gap-3">
                      <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-bold">✓</span>
                      <span className="text-sm text-white/70 leading-relaxed">{item}</span>
                    </motion.li>
                  ))}
                </ul>
              </div>
            </Reveal>
          </div>
        </div>
      </section>

      {/* ─── CATEGORY TABS ─── */}
      <section className="py-14" style={{ background: '#050810', borderTop: '1px solid rgba(255,255,255,0.06)', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
        <div className="mx-auto max-w-6xl px-6">
          <div className="flex justify-center gap-8 md:gap-12 overflow-x-auto scrollbar-hide pb-2">
            {CATEGORIES.map((cat, i) => {
              const Icon = cat.icon
              return (
                <Reveal key={cat.key} delay={i * 0.05}>
                  <Link href={`/map?type=${cat.key}`}
                    className="group flex flex-col items-center gap-2.5 min-w-[72px]">
                    <div className={`flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br ${cat.color} shadow-sm transition-all duration-200 group-hover:shadow-lg group-hover:shadow-white/5 group-hover:scale-105`}>
                      <Icon className="h-6 w-6 text-white" strokeWidth={1.8} />
                    </div>
                    <span className="text-xs font-semibold text-white/40 group-hover:text-white/70 transition-colors">{cat.label}</span>
                  </Link>
                </Reveal>
              )
            })}
          </div>
        </div>
      </section>

      {/* ─── STATS BAR ─── */}
      <section className="py-20" style={{ background: '#080e1c' }}>
        <div className="mx-auto max-w-5xl px-6">
          <BouncingPin />
          <Reveal>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
              {[
                { v: 500, s: '+', l: 'Places disponibles' },
                { v: 40, s: '%', l: 'Moins cher', prefix: '-' },
                { v: 60, s: 's', l: 'Pour reserver' },
                { v: 4.8, s: '/5', l: 'Note moyenne', noCount: true },
              ].map(({ v, s, l, prefix, noCount }) => (
                <div key={l} className="flex flex-col items-center">
                  <p className="text-4xl font-black tracking-tight text-white">
                    {prefix}<span className="bg-gradient-to-r from-[#60A5FA] to-[#0540FF] bg-clip-text text-transparent">
                      {noCount ? v : <Counter value={v} />}{s}
                    </span>
                  </p>
                  <p className="mt-2 text-sm text-white/40">{l}</p>
                </div>
              ))}
            </div>
          </Reveal>
        </div>
      </section>

      {/* ─── HOW IT WORKS ─── */}
      <section id="how" className="py-28" style={{ background: '#050810' }}>
        <div className="mx-auto max-w-5xl px-6">
          <Reveal className="text-center mb-16">
            <ParkingAnimation />
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#0540FF] mb-3">
              Comment ca marche
            </p>
            <h2 className="text-3xl md:text-4xl font-black tracking-tight text-white">
              3 etapes. C&apos;est tout.
            </h2>
          </Reveal>

          <div className="grid gap-6 md:grid-cols-3">
            {[
              { n: '1', t: 'Cherchez', d: 'Entrez votre destination. Les places disponibles apparaissent en temps reel sur la carte.', icon: Search },
              { n: '2', t: 'Reservez', d: 'Choisissez vos horaires et payez en ligne. Vous recevez un QR code instantanement.', icon: Calendar },
              { n: '3', t: 'Garez-vous', d: "Montrez votre QR code ou utilisez le Smart Gate. C'est aussi simple que ca.", icon: QrCode },
            ].map(({ n, t, d, icon: Icon }, i) => (
              <Reveal key={n} delay={i * 0.1}>
                <div className="group relative h-full rounded-2xl border border-white/[0.08] bg-white/[0.03] backdrop-blur-sm p-8 transition-all duration-300 hover:border-white/[0.15] hover:bg-white/[0.05]">
                  {/* Step number — background */}
                  <span className="absolute top-5 right-6 text-5xl font-black text-white/[0.04] select-none">{n}</span>

                  {/* Icon with blue gradient */}
                  <div className="relative flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-[#0540FF]/20 to-[#0540FF]/5 border border-[#0540FF]/20">
                    <Icon className="h-5 w-5 text-[#0540FF]" strokeWidth={1.8} />
                  </div>

                  {/* Step indicator */}
                  <div className="mt-5 flex items-center gap-2">
                    <span className="text-xs font-bold text-[#0540FF] uppercase tracking-wider">Etape {n}</span>
                  </div>

                  <h3 className="mt-1.5 text-lg font-bold text-white">{t}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-white/50">{d}</p>
                </div>
              </Reveal>
            ))}
          </div>

          <Reveal delay={0.3} className="mt-14 text-center">
            <Link href="/map"
              className="group inline-flex h-12 items-center gap-2 rounded-full bg-[#0540FF] px-8 text-sm font-semibold text-white transition-all hover:bg-[#0435D2] hover:shadow-lg hover:shadow-[#0540FF]/20">
              Trouver une place
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
            </Link>
          </Reveal>
        </div>
      </section>

      {/* ─── WHY FLASHPARK ─── */}
      <section className="relative py-28" style={{ background: '#080e1c' }}>
        <div className="mx-auto max-w-5xl px-6">
          <FloatingIcons />
          <Reveal className="text-center mb-14">
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#0540FF] mb-3">Pourquoi nous</p>
            <h2 className="text-3xl md:text-4xl font-black tracking-tight text-white">
              Pourquoi <span className="bg-gradient-to-r from-[#60A5FA] to-[#0540FF] bg-clip-text text-transparent">Flashpark</span>
            </h2>
            <p className="mt-3 text-white/40 max-w-lg mx-auto text-sm leading-relaxed">
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
                <div className="group relative h-full rounded-2xl border border-white/[0.08] bg-white/[0.03] backdrop-blur-sm p-8 transition-all duration-300 hover:border-white/[0.14] hover:bg-white/[0.05] hover:-translate-y-0.5">
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-[#0540FF]/20 to-[#0540FF]/5 border border-[#0540FF]/20">
                    <Icon className="h-5 w-5 text-[#0540FF]" strokeWidth={1.8} />
                  </div>
                  <h3 className="mt-5 text-lg font-bold text-white">{title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-white/50">{desc}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ─── BECOME A HOST ─── */}
      <section className="py-28" style={{ background: '#050810' }}>
        <div className="mx-auto max-w-6xl px-6">
          <div className="grid gap-16 lg:grid-cols-2 lg:items-center">
            <Reveal>
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#0540FF] mb-4">
                Pour les proprietaires
              </p>
              <h2 className="text-[clamp(2rem,4vw,3rem)] font-black leading-tight tracking-tight text-white">
                Votre place vide<br />
                <span className="bg-gradient-to-r from-[#60A5FA] to-[#0540FF] bg-clip-text text-transparent">vous rapporte.</span>
              </h2>
              <p className="mt-5 text-lg leading-relaxed text-white/50">
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
                    <li className="flex items-center gap-3 text-sm text-white/60">
                      <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-emerald-500/10 border border-emerald-500/20">
                        <svg className="h-3 w-3 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
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
                  className="inline-flex h-12 items-center rounded-full bg-[#0540FF] px-7 text-sm font-semibold text-white transition-colors hover:bg-[#0435D2] hover:shadow-lg hover:shadow-[#0540FF]/20">
                  Deposer mon annonce
                </Link>
                <Link href="/map"
                  className="inline-flex h-12 items-center rounded-full border border-white/10 bg-white/[0.04] px-7 text-sm font-semibold text-white/70 transition hover:bg-white/[0.08] hover:text-white hover:border-white/20">
                  Explorer la carte
                </Link>
              </div>
            </Reveal>

            <Reveal delay={0.15} className="flex justify-center lg:justify-end">
              <Simulator />
            </Reveal>
          </div>
        </div>
      </section>

      {/* ─── TRUST BAR ─── */}
      <section className="py-20" style={{ background: '#080e1c', borderTop: '1px solid rgba(255,255,255,0.06)', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
        <div className="mx-auto max-w-4xl px-6">
          <Reveal>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              {[
                { icon: Shield, label: 'Paiement securise', sub: 'Stripe' },
                { icon: Star, label: 'Hotes verifies', sub: 'ID checks' },
                { icon: QrCode, label: 'Acces instantane', sub: 'QR Code' },
                { icon: Zap, label: 'Support reactif', sub: '< 24h' },
              ].map(({ icon: Icon, label, sub }, i) => (
                <motion.div
                  key={label}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.07, duration: 0.5 }}
                  className="flex flex-col items-center rounded-2xl border border-white/[0.07] bg-white/[0.03] backdrop-blur-sm p-6 transition-all hover:border-white/[0.12] hover:bg-white/[0.05]">
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-[#0540FF]/20 to-[#0540FF]/5 border border-[#0540FF]/20">
                    <Icon className="h-5 w-5 text-[#0540FF]" strokeWidth={1.8} />
                  </div>
                  <p className="mt-3 text-sm font-semibold text-white">{label}</p>
                  <p className="text-xs text-white/30 mt-0.5">{sub}</p>
                </motion.div>
              ))}
            </div>
          </Reveal>
        </div>
      </section>

      {/* ─── FOOTER ─── */}
      <footer className="py-16" style={{ background: '#050810', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
        <div className="mx-auto max-w-6xl px-6">
          <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-4">
            <div>
              <div className="flex items-center gap-1.5">
                <div className="flex h-7 w-7 items-center justify-center rounded-md bg-[#0540FF]">
                  <span className="text-sm font-black text-white">P</span>
                </div>
                <span className="text-lg font-bold text-white">
                  flash<span className="text-[#0540FF]">park</span>
                </span>
              </div>
              <p className="mt-4 text-sm leading-relaxed text-white/30">
                La marketplace du parking prive en France. Trouvez, reservez et garez-vous en toute simplicite.
              </p>
            </div>
            {[
              { t: 'Conducteurs', l: [['Trouver un parking', '/map'], ['Comment ca marche', '/#how'], ['Mes reservations', '/dashboard']] },
              { t: 'Hotes', l: [['Louer ma place', '/host'], ['Creer une annonce', '/host/listings/new'], ['Mes revenus', '/host/earnings']] },
              { t: 'Flashpark', l: [['A propos', '/about'], ['Contact', '/contact'], ['CGU', '/terms']] },
            ].map(({ t, l }) => (
              <div key={t}>
                <p className="mb-4 text-xs font-bold uppercase tracking-wider text-white/20">{t}</p>
                <ul className="space-y-3">
                  {l.map(([label, href]) => (
                    <li key={label}>
                      <Link href={href} className="text-sm text-white/40 transition-colors hover:text-white/70">{label}</Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
          <div className="mt-14 flex flex-col items-center justify-between gap-4 pt-8 sm:flex-row" style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
            <p className="text-xs text-white/20">© 2026 Flashpark SAS · Nice, France</p>
            <div className="flex gap-6 text-xs text-white/20">
              {['Confidentialite', 'CGU', 'Cookies'].map((x) => (
                <Link key={x} href="/terms" className="transition hover:text-white/50">{x}</Link>
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
