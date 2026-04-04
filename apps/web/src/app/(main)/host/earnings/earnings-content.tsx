'use client'

import Link from 'next/link'
import {
  PageTransition,
  FadeIn,
  StaggerContainer,
  StaggerItem,
  motion,
} from '../../../../components/motion'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'

function formatEur(amount: number) {
  return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(amount)
}

interface MonthData {
  key: string
  label: string
  gross: number
  payout: number
  count: number
}

interface SpotEarning {
  id: string
  title: string
  payout: number
  count: number
}

interface EarningsContentProps {
  totalEarnings: number
  totalGross: number
  totalFees: number
  totalBookings: number
  months: MonthData[]
  maxPayout: number
  spotEarnings: SpotEarning[]
}

export default function EarningsContent({
  totalEarnings,
  totalGross,
  totalFees,
  totalBookings,
  months,
  maxPayout,
  spotEarnings,
}: EarningsContentProps) {
  return (
    <PageTransition>
      <div className="min-h-screen bg-[#F8FAFC] px-4 py-8">
        <div className="mx-auto max-w-4xl">
          {/* Header */}
          <FadeIn>
            <div className="mb-8 flex items-center justify-between">
              <div>
                <Button variant="ghost" size="sm" asChild className="mb-2 px-0 text-gray-500 hover:text-[#0540FF]">
                  <Link href="/host">
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                    </svg>
                    Tableau de bord
                  </Link>
                </Button>
                <h1 className="text-2xl font-bold text-[#1A1A2E]">Mes revenus</h1>
                <p className="mt-1 text-sm text-gray-500">Toutes vos annonces confondues</p>
              </div>
            </div>
          </FadeIn>

          {/* KPI cards */}
          <StaggerContainer className="mb-8 grid grid-cols-2 gap-4 lg:grid-cols-4">
            {[
              {
                label: 'Revenus nets',
                value: formatEur(totalEarnings),
                sub: 'après frais plateforme',
                color: 'text-[#10B981]',
                bg: 'bg-emerald-50',
                icon: (
                  <svg className="h-5 w-5 text-[#10B981]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                ),
              },
              {
                label: 'Chiffre d\'affaires',
                value: formatEur(totalGross),
                sub: 'total encaissé',
                color: 'text-[#0540FF]',
                bg: 'bg-blue-50',
                icon: (
                  <svg className="h-5 w-5 text-[#0540FF]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                ),
              },
              {
                label: 'Frais plateforme',
                value: formatEur(totalFees),
                sub: '20 % de commission',
                color: 'text-[#F5A623]',
                bg: 'bg-amber-50',
                icon: (
                  <svg className="h-5 w-5 text-[#F5A623]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                  </svg>
                ),
              },
              {
                label: 'Réservations payées',
                value: totalBookings,
                sub: 'toutes périodes',
                color: 'text-gray-700',
                bg: 'bg-gray-50',
                icon: (
                  <svg className="h-5 w-5 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                  </svg>
                ),
              },
            ].map(({ label, value, sub, color, bg, icon }) => (
              <StaggerItem key={label}>
                <Card className="p-5">
                  <div className={`mb-3 inline-flex h-9 w-9 items-center justify-center rounded-xl ${bg}`}>
                    {icon}
                  </div>
                  <p className={`text-xl font-bold ${color}`}>{value}</p>
                  <p className="mt-0.5 text-xs font-medium text-gray-700">{label}</p>
                  <p className="text-xs text-gray-400">{sub}</p>
                </Card>
              </StaggerItem>
            ))}
          </StaggerContainer>

          {/* Monthly bar chart */}
          <FadeIn>
            <Card className="mb-8 p-6">
              <h2 className="mb-6 font-semibold text-[#1A1A2E]">Revenus mensuels (6 derniers mois)</h2>
              <div className="flex items-end gap-3">
                {months.map((m, i) => {
                  const heightPct = maxPayout > 0 ? (m.payout / maxPayout) * 100 : 0
                  return (
                    <div key={m.key} className="group flex flex-1 flex-col items-center gap-2">
                      <div className="relative w-full" style={{ height: 120 }}>
                        {/* Tooltip */}
                        <div className="absolute -top-8 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-lg bg-[#1A1A2E] px-2 py-1 text-xs text-white opacity-0 transition-opacity group-hover:opacity-100 pointer-events-none z-10">
                          {formatEur(m.payout)}
                        </div>
                        {/* Background bar */}
                        <div className="absolute bottom-0 left-0 right-0 rounded-t-lg bg-[#0540FF]/10 transition-all group-hover:bg-[#0540FF]/20" style={{ height: '100%' }} />
                        {/* Animated foreground bar */}
                        <motion.div
                          className="absolute bottom-0 left-0 right-0 rounded-t-lg bg-[#0540FF]"
                          initial={{ height: 0 }}
                          whileInView={{ height: `${heightPct}%` }}
                          viewport={{ once: true }}
                          transition={{ duration: 0.8, delay: i * 0.1, ease: [0.25, 0.4, 0.25, 1] }}
                        />
                      </div>
                      <span className="text-xs text-gray-500">{m.label}</span>
                      {m.count > 0 && (
                        <span className="text-xs font-medium text-[#0540FF]">{m.count} rés.</span>
                      )}
                    </div>
                  )
                })}
              </div>
            </Card>
          </FadeIn>

          {/* Per-spot breakdown */}
          <FadeIn>
            <Card className="overflow-hidden">
              <CardHeader className="border-b border-gray-100 px-6 py-4">
                <CardTitle>Revenus par annonce</CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                {spotEarnings.length === 0 ? (
                  <div className="px-6 py-10 text-center text-sm text-gray-400">
                    Aucune annonce publiée
                  </div>
                ) : (
                  <StaggerContainer className="divide-y divide-gray-50">
                    {spotEarnings.map((s) => (
                      <StaggerItem key={s.id}>
                        <div className="flex items-center justify-between px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-50">
                              <svg className="h-4 w-4 text-[#0540FF]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                              </svg>
                            </div>
                            <div>
                              <p className="text-sm font-medium text-[#1A1A2E]">{s.title}</p>
                              <p className="text-xs text-gray-400">{s.count} réservation{s.count !== 1 ? 's' : ''}</p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="text-sm font-bold text-[#10B981]">{formatEur(s.payout)}</p>
                            <Button variant="link" size="sm" asChild className="h-auto p-0 text-xs">
                              <Link href={`/host/listings/${s.id}/edit`}>
                                Modifier
                              </Link>
                            </Button>
                          </div>
                        </div>
                      </StaggerItem>
                    ))}
                  </StaggerContainer>
                )}
              </CardContent>
            </Card>
          </FadeIn>
        </div>
      </div>
    </PageTransition>
  )
}
