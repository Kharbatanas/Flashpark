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
  MessageCircle,
  ChevronRight,
  Zap,
} from 'lucide-react-native'
import QRCode from 'react-native-qrcode-svg'
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

function formatPrice(price: string | number): string {
  return Number(price).toFixed(2).replace('.', ',')
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
        <View style={styles.loadingSpinner}>
          <ActivityIndicator color={COLORS.primary} size="large" />
        </View>
        <Text style={styles.loadingText}>Chargement...</Text>
      </View>
    )
  }

  /* ---------- Not found ---------- */
  if (!booking || !spot) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()} activeOpacity={0.8}>
          <ArrowLeft color={COLORS.dark} size={20} strokeWidth={2.5} />
        </TouchableOpacity>
        <View style={styles.emptyWrap}>
          <Text style={styles.emptyTitle}>Reservation introuvable</Text>
          <Text style={styles.emptySubtitle}>Cette reservation n'existe pas ou a ete supprimee</Text>
          <TouchableOpacity
            style={styles.primaryBtn}
            onPress={() => router.push('/(tabs)/bookings')}
            activeOpacity={0.8}
          >
            <Text style={styles.primaryBtnText}>Mes reservations</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    )
  }

  const refCode = booking.id.slice(0, 8).toUpperCase()
  const status = STATUS_CONFIG[booking.status] ?? {
    label: booking.status,
    color: COLORS.gray500,
    bg: COLORS.gray50,
  }
  const isSuccess = booking.status === 'confirmed' || booking.status === 'active' || booking.status === 'pending'
  const subtotal = Number(booking.host_payout)
  const fee = Number(booking.platform_fee)
  const total = Number(booking.total_price)

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scroll}
      >
        {/* ===== Top navigation bar ===== */}
        <View style={styles.navBar}>
          <TouchableOpacity style={styles.backBtn} onPress={() => router.back()} activeOpacity={0.8}>
            <ArrowLeft color={COLORS.dark} size={20} strokeWidth={2.5} />
          </TouchableOpacity>
          <Text style={styles.navTitle}>Confirmation</Text>
          <TouchableOpacity style={styles.shareBtn} onPress={handleShare} activeOpacity={0.8}>
            <Share2 color={COLORS.gray500} size={18} />
          </TouchableOpacity>
        </View>

        {/* ===== Success hero ===== */}
        <View style={styles.heroSection}>
          {isSuccess ? (
            <>
              <View style={styles.successCircle}>
                <View style={styles.successCircleInner}>
                  <Check color={COLORS.white} size={36} strokeWidth={3} />
                </View>
              </View>
              <Text style={styles.heroTitle}>Reservation confirmee !</Text>
              <Text style={styles.heroSubtitle}>
                Votre place est reservee. Bon stationnement !
              </Text>
            </>
          ) : (
            <>
              <View style={[styles.successCircle, { backgroundColor: status.bg }]}>
                <View style={[styles.successCircleInner, { backgroundColor: status.color }]}>
                  <Calendar color={COLORS.white} size={30} strokeWidth={2.5} />
                </View>
              </View>
              <Text style={styles.heroTitle}>Reservation #{refCode}</Text>
              <View style={[styles.statusPill, { backgroundColor: status.bg }]}>
                <View style={[styles.statusDot, { backgroundColor: status.color }]} />
                <Text style={[styles.statusPillText, { color: status.color }]}>
                  {status.label}
                </Text>
              </View>
            </>
          )}
        </View>

        {/* ===== QR Code section ===== */}
        <View style={styles.qrSection}>
          <View style={styles.qrCard}>
            <View style={styles.qrInner}>
              <QRCode
                value={booking.qr_code ?? booking.id}
                size={180}
                color={COLORS.dark}
                backgroundColor={COLORS.white}
              />
            </View>
            <View style={styles.qrCodeRef}>
              <Text style={styles.qrRefLabel}>Code de reference</Text>
              <Text style={styles.qrRefValue}>{refCode}</Text>
            </View>
            <Text style={styles.qrHint}>Presentez ce QR code a votre arrivee</Text>
          </View>
        </View>

        {/* ===== Booking details card ===== */}
        <View style={styles.detailsCard}>
          {/* Spot header */}
          <View style={styles.detailsCardHeader}>
            <View style={styles.spotIconWrap}>
              <MapPin color={COLORS.primary} size={16} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.spotTitle}>{spot.title}</Text>
              <Text style={styles.spotAddr}>
                {spot.address}{spot.city ? `, ${spot.city}` : ''}
              </Text>
            </View>
            {spot.has_smart_gate && (
              <View style={styles.smartGateBadge}>
                <Zap color={COLORS.success} size={11} fill={COLORS.success} />
                <Text style={styles.smartGateText}>Smart Gate</Text>
              </View>
            )}
          </View>

          <View style={styles.sectionDivider} />

          {/* Dates block */}
          <View style={styles.datesContainer}>
            <View style={styles.dateBlock}>
              <View style={styles.dateLabelRow}>
                <Calendar color={COLORS.primary} size={13} />
                <Text style={styles.dateLabel}>ARRIVEE</Text>
              </View>
              <Text style={styles.dateDay}>{formatDate(booking.start_time)}</Text>
              <View style={styles.timeChip}>
                <Clock color={COLORS.primary} size={12} />
                <Text style={styles.dateTime}>{formatTime(booking.start_time)}</Text>
              </View>
            </View>

            <View style={styles.dateArrow}>
              <ChevronRight color={COLORS.gray300} size={18} />
            </View>

            <View style={[styles.dateBlock, { alignItems: 'flex-end' }]}>
              <View style={styles.dateLabelRow}>
                <Calendar color={COLORS.gray400} size={13} />
                <Text style={styles.dateLabel}>DEPART</Text>
              </View>
              <Text style={styles.dateDay}>{formatDate(booking.end_time)}</Text>
              <View style={[styles.timeChip, { backgroundColor: COLORS.gray100 }]}>
                <Clock color={COLORS.gray500} size={12} />
                <Text style={[styles.dateTime, { color: COLORS.gray500 }]}>
                  {formatTime(booking.end_time)}
                </Text>
              </View>
            </View>
          </View>

          <View style={styles.sectionDivider} />

          {/* Price breakdown */}
          <View style={styles.priceSection}>
            <View style={styles.priceRow}>
              <Text style={styles.priceRowLabel}>Sous-total</Text>
              <Text style={styles.priceRowValue}>{formatPrice(subtotal)} €</Text>
            </View>
            <View style={styles.priceRow}>
              <Text style={styles.priceRowLabel}>Frais de service</Text>
              <Text style={styles.priceRowValue}>{formatPrice(fee)} €</Text>
            </View>
            <View style={[styles.priceRow, styles.priceTotalRow]}>
              <Text style={styles.priceTotalLabel}>Total paye</Text>
              <Text style={styles.priceTotalValue}>{formatPrice(total)} €</Text>
            </View>
          </View>
        </View>

        {/* ===== Action buttons ===== */}
        <View style={styles.actions}>
          <TouchableOpacity
            style={styles.outlinedBtn}
            onPress={() => router.push(`/booking/chat?bookingId=${booking.id}`)}
            activeOpacity={0.8}
          >
            <MessageCircle color={COLORS.primary} size={18} />
            <Text style={styles.outlinedBtnText}>Contacter l'hote</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.primaryBtn}
            onPress={() => router.push('/(tabs)/bookings')}
            activeOpacity={0.85}
          >
            <Text style={styles.primaryBtnText}>Mes reservations</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.ghostBtn}
            onPress={() => router.push('/(tabs)/')}
            activeOpacity={0.8}
          >
            <Text style={styles.ghostBtnText}>Retour a la carte</Text>
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
    gap: 14,
  },
  loadingSpinner: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: COLORS.white,
    alignItems: 'center',
    justifyContent: 'center',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOpacity: 0.08,
        shadowRadius: 12,
        shadowOffset: { width: 0, height: 4 },
      },
      android: { elevation: 4 },
    }),
  },
  loadingText: {
    fontSize: 14,
    color: COLORS.gray400,
    fontWeight: '500',
  },
  scroll: {
    paddingBottom: 48,
  },

  /* Navigation bar */
  navBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: COLORS.white,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.gray100,
  },
  navTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: COLORS.dark,
  },
  backBtn: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: COLORS.gray100,
    alignItems: 'center',
    justifyContent: 'center',
  },
  shareBtn: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: COLORS.gray100,
    alignItems: 'center',
    justifyContent: 'center',
  },

  /* Hero success */
  heroSection: {
    alignItems: 'center',
    paddingVertical: 36,
    paddingHorizontal: 24,
    backgroundColor: COLORS.white,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.gray100,
  },
  successCircle: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: COLORS.successLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  successCircleInner: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: COLORS.success,
    alignItems: 'center',
    justifyContent: 'center',
    ...Platform.select({
      ios: {
        shadowColor: COLORS.success,
        shadowOpacity: 0.4,
        shadowRadius: 14,
        shadowOffset: { width: 0, height: 5 },
      },
      android: { elevation: 5 },
    }),
  },
  heroTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: COLORS.dark,
    textAlign: 'center',
    letterSpacing: -0.4,
  },
  heroSubtitle: {
    fontSize: 15,
    color: COLORS.gray400,
    marginTop: 8,
    textAlign: 'center',
    lineHeight: 22,
  },
  statusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 6,
    marginTop: 10,
  },
  statusDot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
  },
  statusPillText: {
    fontSize: 13,
    fontWeight: '700',
  },

  /* QR section */
  qrSection: {
    paddingHorizontal: 20,
    paddingVertical: 24,
    alignItems: 'center',
  },
  qrCard: {
    backgroundColor: COLORS.white,
    borderRadius: 24,
    padding: 24,
    alignItems: 'center',
    width: '100%',
    borderWidth: 1,
    borderColor: COLORS.gray100,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOpacity: 0.07,
        shadowRadius: 14,
        shadowOffset: { width: 0, height: 4 },
      },
      android: { elevation: 4 },
    }),
  },
  qrInner: {
    padding: 16,
    backgroundColor: COLORS.white,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: COLORS.gray100,
  },
  qrCodeRef: {
    alignItems: 'center',
    marginTop: 20,
    marginBottom: 6,
  },
  qrRefLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.gray400,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 6,
  },
  qrRefValue: {
    fontSize: 22,
    fontWeight: '800',
    color: COLORS.dark,
    letterSpacing: 4,
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
  },
  qrHint: {
    fontSize: 12,
    color: COLORS.gray400,
    textAlign: 'center',
    marginTop: 8,
  },

  /* Details card */
  detailsCard: {
    marginHorizontal: 20,
    backgroundColor: COLORS.white,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: COLORS.gray100,
    overflow: 'hidden',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOpacity: 0.06,
        shadowRadius: 12,
        shadowOffset: { width: 0, height: 3 },
      },
      android: { elevation: 3 },
    }),
  },
  detailsCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 18,
  },
  spotIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  spotTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: COLORS.dark,
    lineHeight: 22,
  },
  spotAddr: {
    fontSize: 13,
    color: COLORS.gray400,
    marginTop: 2,
  },
  smartGateBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: COLORS.successLight,
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  smartGateText: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.success,
  },
  sectionDivider: {
    height: 1,
    backgroundColor: COLORS.gray100,
  },

  /* Dates */
  datesContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 18,
    gap: 12,
  },
  dateBlock: {
    flex: 1,
    gap: 6,
  },
  dateLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  dateLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: COLORS.gray400,
    letterSpacing: 0.8,
  },
  dateDay: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.dark,
    textTransform: 'capitalize',
    lineHeight: 18,
  },
  timeChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: COLORS.primaryLight,
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 5,
    alignSelf: 'flex-start',
  },
  dateTime: {
    fontSize: 14,
    fontWeight: '800',
    color: COLORS.primary,
  },
  dateArrow: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 20,
  },

  /* Price breakdown */
  priceSection: {
    padding: 18,
    gap: 10,
  },
  priceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  priceRowLabel: {
    fontSize: 14,
    color: COLORS.gray500,
  },
  priceRowValue: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.dark,
  },
  priceTotalRow: {
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: COLORS.gray100,
    marginTop: 4,
  },
  priceTotalLabel: {
    fontSize: 16,
    fontWeight: '800',
    color: COLORS.dark,
  },
  priceTotalValue: {
    fontSize: 20,
    fontWeight: '800',
    color: COLORS.dark,
    letterSpacing: -0.3,
  },

  /* Actions */
  actions: {
    paddingHorizontal: 20,
    paddingTop: 24,
    gap: 12,
  },
  outlinedBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderWidth: 1.5,
    borderColor: COLORS.primary,
    backgroundColor: COLORS.primaryLight,
    borderRadius: 16,
    paddingVertical: 16,
  },
  outlinedBtnText: {
    color: COLORS.primary,
    fontWeight: '700',
    fontSize: 16,
  },
  primaryBtn: {
    backgroundColor: COLORS.primary,
    borderRadius: 16,
    paddingVertical: 17,
    alignItems: 'center',
    ...Platform.select({
      ios: {
        shadowColor: COLORS.primary,
        shadowOpacity: 0.35,
        shadowRadius: 12,
        shadowOffset: { width: 0, height: 4 },
      },
      android: { elevation: 4 },
    }),
  },
  primaryBtnText: {
    color: COLORS.white,
    fontWeight: '800',
    fontSize: 16,
    letterSpacing: 0.2,
  },
  ghostBtn: {
    alignItems: 'center',
    paddingVertical: 14,
  },
  ghostBtnText: {
    color: COLORS.gray500,
    fontWeight: '600',
    fontSize: 15,
    textDecorationLine: 'underline',
  },

  /* Empty */
  emptyWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 36,
    gap: 10,
  },
  emptyTitle: {
    fontSize: 19,
    fontWeight: '700',
    color: COLORS.dark,
  },
  emptySubtitle: {
    fontSize: 14,
    color: COLORS.gray400,
    textAlign: 'center',
    lineHeight: 21,
  },
})
