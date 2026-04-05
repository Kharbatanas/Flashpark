'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { Navbar } from '../components/navbar'
import { TRPCProvider } from '../lib/trpc/client'

function RevenueSimulator() {
  const [pricePerHour, setPricePerHour] = useState(3)
  const [hoursPerDay, setHoursPerDay] = useState(6)
  const [daysPerWeek, setDaysPerWeek] = useState(5)

  const grossMonthly = pricePerHour * hoursPerDay * daysPerWeek * 4.33
  const netMonthly = Math.round(grossMonthly * 0.8)
  const netYearly = netMonthly * 12

  return (
    <div className="w-full max-w-sm rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur">
      <p className="text-xs font-bold uppercase tracking-[0.15em] text-blue-400">Simulateur de revenus</p>
      <p className="mt-1 mb-6 text-sm text-gray-500">Ajustez selon votre situation</p>

      <div className="space-y-5">
        {/* Price per hour */}
        <div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-400">Prix par heure</span>
            <span className="font-semibold text-white">{pricePerHour} EUR</span>
          </div>
          <input
            type="range" min={1} max={10} step={0.5} value={pricePerHour}
            onChange={(e) => setPricePerHour(Number(e.target.value))}
            className="mt-2 w-full accent-[#0540FF]"
          />
        </div>

        {/* Hours per day */}
        <div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-400">Heures par jour</span>
            <span className="font-semibold text-white">{hoursPerDay}h</span>
          </div>
          <input
            type="range" min={1} max={24} step={1} value={hoursPerDay}
            onChange={(e) => setHoursPerDay(Number(e.target.value))}
            className="mt-2 w-full accent-[#0540FF]"
          />
        </div>

        {/* Days per week */}
        <div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-400">Jours par semaine</span>
            <span className="font-semibold text-white">{daysPerWeek}j</span>
          </div>
          <input
            type="range" min={1} max={7} step={1} value={daysPerWeek}
            onChange={(e) => setDaysPerWeek(Number(e.target.value))}
            className="mt-2 w-full accent-[#0540FF]"
          />
        </div>
      </div>

      {/* Result */}
      <div className="mt-6 rounded-xl bg-[#0540FF]/15 ring-1 ring-[#0540FF]/30 p-4 text-center">
        <p className="text-3xl font-extrabold text-white">{netMonthly.toLocaleString('fr-FR')} EUR</p>
        <p className="text-xs text-blue-300">par mois (net apres 20% de commission)</p>
        <p className="mt-2 text-sm text-gray-400">{netYearly.toLocaleString('fr-FR')} EUR / an</p>
      </div>
    </div>
  )
}

export default function HomePage() {
  const [searchQuery, setSearchQuery] = useState('')
  const router = useRouter()

  function handleSearch(e: React.FormEvent) {
    e.preventDefault()
    router.push(searchQuery.trim() ? `/map?q=${encodeURIComponent(searchQuery)}` : '/map')
  }

  return (
    <TRPCProvider>
    <div className="min-h-screen bg-white">
      <Navbar />

      {/* ─── Hero ─────────────────────────────────────── */}
      <section className="relative -mt-16 flex min-h-[100dvh] items-center justify-center overflow-hidden bg-[#0A0A1A]">
        {/* Gradient mesh */}
        <div className="absolute inset-0">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_-20%,#0540FF22,transparent)]" />
          <div className="absolute bottom-0 left-0 right-0 h-1/2 bg-gradient-to-t from-[#0A0A1A] to-transparent" />
          <div className="absolute -left-1/4 top-1/3 h-[500px] w-[500px] rounded-full bg-[#0540FF]/10 blur-[120px]" />
          <div className="absolute -right-1/4 top-1/2 h-[400px] w-[400px] rounded-full bg-blue-600/8 blur-[100px]" />
        </div>

        <div className="relative z-10 mx-auto max-w-4xl px-6 text-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
          >
            <div className="mb-8 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm text-gray-400 backdrop-blur-sm">
              <span className="h-2 w-2 animate-pulse rounded-full bg-emerald-400" />
              Disponible partout en France
            </div>

            <h1 className="text-[clamp(2.5rem,6vw,5rem)] font-extrabold leading-[1.05] tracking-tight text-white">
              Garez-vous
              <br />
              <span className="bg-gradient-to-r from-[#0540FF] via-blue-400 to-cyan-300 bg-clip-text text-transparent">
                sans chercher.
              </span>
            </h1>

            <p className="mx-auto mt-6 max-w-xl text-lg text-gray-400">
              Reservez une place de parking privee en quelques secondes.
              Des milliers de places disponibles pres de chez vous.
            </p>
          </motion.div>

          {/* Search */}
          <motion.form
            onSubmit={handleSearch}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="mx-auto mt-10 max-w-xl"
          >
            <div className="flex items-center gap-0 rounded-2xl bg-white p-1.5 shadow-2xl shadow-blue-900/20">
              <div className="flex flex-1 items-center gap-3 px-4 py-3">
                <svg className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                <input
                  type="text"
                  placeholder="Adresse, ville ou lieu..."
                  className="flex-1 bg-transparent text-sm text-gray-800 placeholder-gray-400 focus:outline-none"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              <button
                type="submit"
                className="rounded-xl bg-[#0540FF] px-6 py-3 text-sm font-semibold text-white transition hover:bg-blue-600"
              >
                Rechercher
              </button>
            </div>
          </motion.form>

          {/* Cities */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6 }}
            className="mt-6 flex flex-wrap justify-center gap-2"
          >
            {['Paris', 'Lyon', 'Marseille', 'Montpellier', 'Nice', 'Toulouse', 'Bordeaux'].map((city) => (
              <button
                key={city}
                onClick={() => router.push(`/map?q=${city}`)}
                className="rounded-full border border-white/10 bg-white/5 px-3.5 py-1.5 text-xs text-gray-400 backdrop-blur-sm transition hover:bg-white/10 hover:text-white"
              >
                {city}
              </button>
            ))}
          </motion.div>

          {/* Stats */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.8 }}
            className="mt-20 grid grid-cols-3 gap-8"
          >
            {[
              { value: '< 60s', label: 'pour reserver' },
              { value: '24/7', label: 'disponible' },
              { value: '0 EUR', label: "d'inscription" },
            ].map(({ value, label }) => (
              <div key={label} className="text-center">
                <p className="text-2xl font-bold text-white">{value}</p>
                <p className="mt-1 text-xs text-gray-500">{label}</p>
              </div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ─── Comment ca marche ───────────────────────── */}
      <section className="py-24">
        <div className="mx-auto max-w-5xl px-6">
          <div className="text-center">
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#0540FF]">Simple et rapide</p>
            <h2 className="mt-3 text-3xl font-extrabold text-[#0A0A1A]">3 etapes pour se garer</h2>
          </div>

          <div className="mt-16 grid gap-12 md:grid-cols-3">
            {[
              {
                step: '01',
                title: 'Cherchez',
                desc: 'Entrez votre destination. Les places disponibles apparaissent sur la carte en temps reel.',
                icon: (
                  <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                ),
              },
              {
                step: '02',
                title: 'Reservez',
                desc: 'Choisissez vos horaires et payez en ligne. Vous recevez un code QR de confirmation.',
                icon: (
                  <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                ),
              },
              {
                step: '03',
                title: 'Garez-vous',
                desc: 'Accedez a votre place avec le QR code. Smart Gate ? La barriere s\'ouvre automatiquement.',
                icon: (
                  <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" />
                  </svg>
                ),
              },
            ].map(({ step, title, desc, icon }) => (
              <div key={step} className="text-center">
                <div className="mx-auto mb-6 flex h-14 w-14 items-center justify-center rounded-2xl bg-[#0540FF]/5 text-[#0540FF]">
                  {icon}
                </div>
                <p className="text-xs font-bold text-[#0540FF]">{step}</p>
                <h3 className="mt-2 text-xl font-bold text-[#0A0A1A]">{title}</h3>
                <p className="mt-3 text-sm leading-relaxed text-gray-500">{desc}</p>
              </div>
            ))}
          </div>

          <div className="mt-14 text-center">
            <Link
              href="/map"
              className="inline-flex h-12 items-center gap-2 rounded-2xl bg-[#0540FF] px-8 text-sm font-semibold text-white shadow-lg shadow-blue-100 transition hover:bg-blue-600"
            >
              Trouver une place
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
              </svg>
            </Link>
          </div>
        </div>
      </section>

      {/* ─── Pourquoi Flashpark ──────────────────────── */}
      <section className="border-y border-gray-100 bg-gray-50/50 py-24">
        <div className="mx-auto max-w-5xl px-6">
          <div className="text-center">
            <h2 className="text-3xl font-extrabold text-[#0A0A1A]">Pourquoi Flashpark</h2>
            <p className="mt-3 text-sm text-gray-500">La facon la plus simple de se garer en ville</p>
          </div>

          <div className="mt-14 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {[
              { icon: '🔒', title: 'Paiement securise', desc: 'Transactions chiffrees via Stripe. Remboursement garanti.' },
              { icon: '🛡️', title: 'Assurance incluse', desc: 'Chaque reservation est couverte. Garez-vous sereinement.' },
              { icon: '⚡', title: 'Smart Gate', desc: 'Acces automatique aux places equipees. Sans cle ni badge.' },
              { icon: '✅', title: 'Hotes verifies', desc: 'Documents valides, avis reels. Une communaute de confiance.' },
            ].map(({ icon, title, desc }) => (
              <div key={title} className="rounded-2xl border border-gray-100 bg-white p-6">
                <span className="text-2xl">{icon}</span>
                <h3 className="mt-4 font-bold text-[#0A0A1A]">{title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-gray-500">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── Devenir hote ────────────────────────────── */}
      <section className="py-24">
        <div className="mx-auto max-w-6xl px-6">
          <div className="overflow-hidden rounded-3xl bg-[#0A0A1A]">
            <div className="grid gap-10 p-10 lg:grid-cols-2 lg:p-16">
              {/* Left */}
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.2em] text-blue-400">Pour les proprietaires</p>
                <h2 className="mt-4 text-4xl font-extrabold leading-tight text-white">
                  Votre place vide
                  <br />
                  vous rapporte.
                </h2>
                <p className="mt-4 text-gray-400 leading-relaxed">
                  Publiez votre annonce en 5 minutes. Les conducteurs reservent, Flashpark gere les paiements et les acces.
                </p>

                <ul className="mt-8 space-y-4">
                  {[
                    'Jusqu\'a 300 EUR/mois de revenus',
                    'Vous choisissez vos disponibilites',
                    'Assurance et protection incluses',
                    'Inscription et publication gratuites',
                  ].map((item) => (
                    <li key={item} className="flex items-center gap-3 text-sm text-gray-300">
                      <svg className="h-4 w-4 flex-shrink-0 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                      {item}
                    </li>
                  ))}
                </ul>

                <div className="mt-10 flex flex-wrap gap-4">
                  <Link
                    href="/host"
                    className="inline-flex h-12 items-center gap-2 rounded-2xl bg-[#0540FF] px-7 text-sm font-semibold text-white transition hover:bg-blue-600"
                  >
                    Deposer mon annonce
                  </Link>
                  <Link
                    href="/map"
                    className="inline-flex h-12 items-center gap-2 rounded-2xl border border-white/15 px-7 text-sm text-white transition hover:bg-white/5"
                  >
                    Explorer la carte
                  </Link>
                </div>
              </div>

              {/* Right — interactive revenue simulator */}
              <div className="flex items-center justify-center">
                <RevenueSimulator />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─── Footer ──────────────────────────────────── */}
      <footer className="border-t border-gray-100 bg-white py-14">
        <div className="mx-auto max-w-6xl px-6">
          <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-4">
            <div>
              <p className="text-xl font-extrabold text-[#0A0A1A]">
                Flash<span className="text-[#0540FF]">park</span>
              </p>
              <p className="mt-3 text-sm leading-relaxed text-gray-500">
                La marketplace du parking prive en France. Reservez facilement, garez-vous sereinement.
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
                <p className="mb-4 text-xs font-bold uppercase tracking-[0.15em] text-gray-400">{title}</p>
                <ul className="space-y-2.5">
                  {links.map(({ label, href }) => (
                    <li key={label}>
                      <Link href={href} className="text-sm text-gray-600 transition hover:text-[#0540FF]">
                        {label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          <div className="mt-10 flex flex-col items-center justify-between gap-4 border-t border-gray-100 pt-8 sm:flex-row">
            <p className="text-xs text-gray-400">2026 Flashpark SAS · France · Tous droits reserves</p>
            <div className="flex gap-6 text-xs text-gray-400">
              <Link href="/terms" className="transition hover:text-gray-600">Confidentialite</Link>
              <Link href="/terms" className="transition hover:text-gray-600">CGU</Link>
              <Link href="/terms" className="transition hover:text-gray-600">Cookies</Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
    </TRPCProvider>
  )
}
