import { useEffect, useState } from 'react'
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Share,
  Platform,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useLocalSearchParams, router } from 'expo-router'
import {
  ArrowLeft,
  Check,
  MapPin,
  Calendar,
  Clock,
  Share2,
} from 'lucide-react-native'
import { supabase } from '../../lib/supabase'
import { COLORS, STATUS_CONFIG } from '../../lib/constants'

interface Booking {
  id: string
  spot_id: string
  start_time: string
  end_time: string
  total_price: string
  platform_fee: string
  host_payout: string
  status: string
  qr_code: string | null
}

interface SpotInfo {
  title: string
  address: string
  city: string
  has_smart_gate: boolean
}

function formatDate(d: string): string {
  return new Intl.DateTimeFormat('fr-FR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  }).format(new Date(d))
}

function formatTime(d: string): string {
  return new Intl.DateTimeFormat('fr-FR', {
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(d))
}

export default function BookingConfirmationScreen() {
  const { id } = useLocalSearchParams<{ id: string }>()
  const [booking, setBooking] = useState<Booking | null>(null)
  const [spot, setSpot] = useState<SpotInfo | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (id) loadBooking()
  }, [id])

  async function loadBooking() {
    setLoading(true)
    const { data: bk } = await supabase
      .from('bookings')
      .select(
        'id, spot_id, start_time, end_time, total_price, platform_fee, host_payout, status, qr_code'
      )
      .eq('id', id)
      .single()

    if (!bk) {
      setLoading(false)
      return
    }
    setBooking(bk)

    const { data: sp } = await supabase
      .from('spots')
      .select('title, address, city, has_smart_gate')
      .eq('id', bk.spot_id)
      .single()

    setSpot(sp)
    setLoading(false)
  }

  async function handleShare() {
    if (!booking || !spot) return
    await Share.share({
      message: `J'ai reserve "${spot.title}" via Flashpark — Ref: ${booking.id.slice(0, 8).toUpperCase()}`,
    })
  }

  /* ---------- Loading ---------- */
  if (loading) {
    return (
      <View style={styles.loadingWrap}>
        <ActivityIndicator color={COLORS.primary} size="large" />
      </View>
    )
  }

  /* ---------- Not found ---------- */
  if (!booking || !spot) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <TouchableOpacity
          style={styles.backBtn}
          onPress={() => router.back()}
        >
          <ArrowLeft color={COLORS.dark} size={22} />
        </TouchableOpacity>
        <View style={styles.empty}>
          <Text style={styles.emptyText}>Reservation introuvable</Text>
        </View>
      </SafeAreaView>
    )
  }

  const refCode = booking.id.slice(0, 8).toUpperCase()
  const status =
    STATUS_CONFIG[booking.status] ?? {
      label: booking.status,
      color: COLORS.gray500,
      bg: COLORS.gray50,
    }

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scroll}
      >
        {/* Header row */}
        <View style={styles.headerRow}>
          <TouchableOpacity
            style={styles.backBtn}
            onPress={() => router.back()}
          >
            <ArrowLeft color={COLORS.dark} size={22} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.shareBtn} onPress={handleShare}>
            <Share2 color={COLORS.gray500} size={20} />
          </TouchableOpacity>
        </View>

        {/* ===== Success hero ===== */}
        <View style={styles.heroSection}>
          <View style={styles.successCircle}>
            <Check color={COLORS.success} size={40} strokeWidth={2.5} />
          </View>
          <Text style={styles.heroTitle}>Reservation confirmee !</Text>
          <Text style={styles.heroSubtitle}>Ton parking t'attend</Text>
        </View>

        {/* ===== QR Code placeholder ===== */}
        <View style={styles.qrSection}>
          <View style={styles.qrPlaceholder}>
            <Text style={styles.qrText}>QR</Text>
          </View>
          <Text style={styles.qrHint}>
            Presentez ce code a votre arrivee
          </Text>
        </View>

        {/* ===== Booking details card ===== */}
        <View style={styles.card}>
          {/* Spot name + status */}
          <View style={styles.cardHeader}>
            <View style={styles.cardHeaderLeft}>
              <Text style={styles.spotTitle}>{spot.title}</Text>
              <View style={styles.spotAddrRow}>
                <MapPin color={COLORS.gray400} size={13} />
                <Text style={styles.spotAddr}>
                  {spot.address}
                  {spot.city ? `, ${spot.city}` : ''}
                </Text>
              </View>
            </View>
            <View
              style={[styles.statusBadge, { backgroundColor: status.bg }]}
            >
              <Text style={[styles.statusText, { color: status.color }]}>
                {status.label}
              </Text>
            </View>
          </View>

          <View style={styles.cardDivider} />

          {/* Reference */}
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Reference</Text>
            <Text style={styles.detailValueMono}>{refCode}</Text>
          </View>

          <View style={styles.cardDivider} />

          {/* Dates */}
          <View style={styles.datesContainer}>
            <View style={styles.dateBlock}>
              <View style={styles.dateLabelRow}>
                <Calendar color={COLORS.primary} size={14} />
                <Text style={styles.dateLabel}>Arrivee</Text>
              </View>
              <Text style={styles.dateDay}>
                {formatDate(booking.start_time)}
              </Text>
              <View style={styles.timeRow}>
                <Clock color={COLORS.primary} size={14} />
                <Text style={styles.dateTime}>
                  {formatTime(booking.start_time)}
                </Text>
              </View>
            </View>

            <View style={styles.dateVertDivider} />

            <View style={styles.dateBlock}>
              <View style={styles.dateLabelRow}>
                <Calendar color={COLORS.gray400} size={14} />
                <Text style={styles.dateLabel}>Depart</Text>
              </View>
              <Text style={styles.dateDay}>
                {formatDate(booking.end_time)}
              </Text>
              <View style={styles.timeRow}>
                <Clock color={COLORS.gray400} size={14} />
                <Text style={styles.dateTime}>
                  {formatTime(booking.end_time)}
                </Text>
              </View>
            </View>
          </View>

          <View style={styles.cardDivider} />

          {/* Total price */}
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Total paye</Text>
            <Text style={styles.totalValue}>
              {Number(booking.total_price).toFixed(2).replace('.', ',')} €
            </Text>
          </View>

          {/* Smart Gate note */}
          {spot.has_smart_gate && (
            <View style={styles.smartGateRow}>
              <Check color={COLORS.success} size={14} />
              <Text style={styles.smartGateText}>
                Acces Smart Gate active
              </Text>
            </View>
          )}
        </View>

        {/* ===== Action buttons ===== */}
        <View style={styles.actions}>
          <TouchableOpacity
            style={styles.primaryBtn}
            onPress={() => router.push('/(tabs)/bookings')}
            activeOpacity={0.8}
          >
            <Text style={styles.primaryBtnText}>
              Voir mes reservations
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.outlineBtn}
            onPress={() => router.push('/(tabs)/')}
            activeOpacity={0.8}
          >
            <Text style={styles.outlineBtnText}>Retour a la carte</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  loadingWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.background,
  },
  scroll: {
    paddingBottom: 40,
  },

  /* Header */
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 8,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.white,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  shareBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.white,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },

  /* Hero success */
  heroSection: {
    alignItems: 'center',
    paddingVertical: 28,
    paddingHorizontal: 20,
  },
  successCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: COLORS.successLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  heroTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: COLORS.dark,
    textAlign: 'center',
  },
  heroSubtitle: {
    fontSize: 15,
    color: COLORS.gray400,
    marginTop: 6,
    textAlign: 'center',
  },

  /* QR section */
  qrSection: {
    alignItems: 'center',
    marginBottom: 24,
  },
  qrPlaceholder: {
    width: 140,
    height: 140,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: COLORS.gray300,
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.white,
  },
  qrText: {
    fontSize: 24,
    fontWeight: '700',
    color: COLORS.gray300,
  },
  qrHint: {
    fontSize: 12,
    color: COLORS.gray400,
    marginTop: 10,
  },

  /* Card */
  card: {
    marginHorizontal: 20,
    backgroundColor: COLORS.white,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: COLORS.gray200,
    overflow: 'hidden',
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: 18,
    gap: 10,
  },
  cardHeaderLeft: {
    flex: 1,
  },
  spotTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: COLORS.dark,
  },
  spotAddrRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 4,
  },
  spotAddr: {
    fontSize: 13,
    color: COLORS.gray400,
    flex: 1,
  },
  statusBadge: {
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 5,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '700',
  },
  cardDivider: {
    height: 1,
    backgroundColor: COLORS.gray100,
    marginHorizontal: 18,
  },

  /* Detail rows */
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 18,
    paddingVertical: 14,
  },
  detailLabel: {
    fontSize: 14,
    color: COLORS.gray500,
  },
  detailValueMono: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.dark,
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    letterSpacing: 1,
  },

  /* Dates */
  datesContainer: {
    flexDirection: 'row',
    paddingVertical: 14,
  },
  dateBlock: {
    flex: 1,
    paddingHorizontal: 18,
    gap: 4,
  },
  dateLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  dateLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.gray400,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
  dateDay: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.dark,
    textTransform: 'capitalize',
  },
  timeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 2,
  },
  dateTime: {
    fontSize: 16,
    fontWeight: '800',
    color: COLORS.primary,
  },
  dateVertDivider: {
    width: 1,
    backgroundColor: COLORS.gray100,
    marginVertical: 4,
  },

  /* Total */
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 18,
    paddingVertical: 16,
  },
  totalLabel: {
    fontSize: 16,
    fontWeight: '800',
    color: COLORS.dark,
  },
  totalValue: {
    fontSize: 18,
    fontWeight: '800',
    color: COLORS.dark,
  },

  /* Smart Gate */
  smartGateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 18,
    paddingBottom: 16,
    paddingTop: 4,
  },
  smartGateText: {
    fontSize: 13,
    color: COLORS.success,
    fontWeight: '600',
  },

  /* Actions */
  actions: {
    paddingHorizontal: 20,
    paddingTop: 24,
    gap: 12,
  },
  primaryBtn: {
    backgroundColor: COLORS.primary,
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
  },
  primaryBtnText: {
    color: COLORS.white,
    fontWeight: '800',
    fontSize: 16,
  },
  outlineBtn: {
    borderWidth: 1.5,
    borderColor: COLORS.gray200,
    backgroundColor: COLORS.white,
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
  },
  outlineBtnText: {
    color: COLORS.gray700,
    fontWeight: '600',
    fontSize: 16,
  },

  /* Empty */
  empty: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyText: {
    fontSize: 15,
    color: COLORS.gray400,
  },
})
