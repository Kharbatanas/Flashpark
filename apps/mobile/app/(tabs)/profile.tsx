import { useEffect, useState, useCallback } from 'react'
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  TextInput,
  Alert,
  ScrollView,
  RefreshControl,
  Platform,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { router } from 'expo-router'
import {
  User,
  LogOut,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  Bell,
  Lock,
  LifeBuoy,
  FileText,
  Shield,
  Zap,
  Car,
  CreditCard,
  LayoutDashboard,
  List,
  TrendingUp,
  UserCircle,
} from 'lucide-react-native'
import { supabase } from '../../lib/supabase'
import { COLORS } from '../../lib/constants'

const ROLE_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
  driver: { label: 'Conducteur', color: COLORS.primary, bg: COLORS.primaryLight },
  host: { label: 'Hote', color: COLORS.success, bg: COLORS.successLight },
  both: { label: 'Conducteur & Hote', color: '#7C3AED', bg: '#F5F3FF' },
  admin: { label: 'Administrateur', color: COLORS.gray500, bg: COLORS.gray50 },
}

interface UserProfile {
  id: string
  email: string
  full_name: string
  avatar_url: string | null
  phone_number: string | null
  role: string
  is_verified: boolean
  created_at: string
}

interface UserStats {
  bookingsCount: number
  reviewsCount: number
  memberSince: string
}

/* ---- Skeleton ---- */
function SkeletonBox({ width, height, borderRadius = 8, style }: {
  width: number | string; height: number; borderRadius?: number; style?: any
}) {
  return (
    <View style={[{ width: width as any, height, borderRadius, backgroundColor: COLORS.gray200 }, style]} />
  )
}

function ProfileSkeleton() {
  return (
    <View style={styles.container}>
      <View style={styles.headerGradient}>
        <SafeAreaView edges={['top']} style={styles.headerSafe}>
          <View style={styles.headerContent}>
            <View style={[styles.avatarLarge, { backgroundColor: 'rgba(255,255,255,0.15)' }]} />
            <SkeletonBox width={160} height={20} borderRadius={6} style={{ backgroundColor: 'rgba(255,255,255,0.2)', marginBottom: 6 }} />
            <SkeletonBox width={200} height={13} borderRadius={4} style={{ backgroundColor: 'rgba(255,255,255,0.15)' }} />
          </View>
        </SafeAreaView>
      </View>
      <View style={styles.statsRow}>
        {[0, 1, 2].map((i) => (
          <View key={i} style={styles.statItem}>
            <SkeletonBox width={40} height={18} borderRadius={4} />
            <SkeletonBox width={60} height={11} borderRadius={3} style={{ marginTop: 4 }} />
          </View>
        ))}
      </View>
      <View style={[styles.sectionCard, { marginTop: 20 }]}>
        {[0, 1, 2, 3, 4].map((i) => (
          <View key={i} style={[styles.menuRow, i < 4 && styles.menuRowBorder]}>
            <SkeletonBox width={36} height={36} borderRadius={10} />
            <SkeletonBox width="55%" height={15} borderRadius={4} style={{ marginLeft: 12 }} />
          </View>
        ))}
      </View>
    </View>
  )
}

export default function ProfileScreen() {
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [stats, setStats] = useState<UserStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [authed, setAuthed] = useState(false)

  // Edit profile state
  const [editOpen, setEditOpen] = useState(false)
  const [fullName, setFullName] = useState('')
  const [phone, setPhone] = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    loadProfile()
  }, [])

  const loadProfile = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true)
    else setLoading(true)

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        setLoading(false)
        setRefreshing(false)
        return
      }
      setAuthed(true)

      const { data } = await supabase
        .from('users')
        .select('id, email, full_name, avatar_url, phone_number, role, is_verified, created_at')
        .eq('supabase_id', user.id)
        .single()

      if (data) {
        setProfile(data)
        setFullName(data.full_name ?? '')
        setPhone(data.phone_number ?? '')
        await loadStats(data.id, data.created_at)
      }
    } catch {
      // Silently ignore
    }
    setLoading(false)
    setRefreshing(false)
  }, [])

  async function loadStats(dbUserId: string, createdAt: string) {
    try {
      const [bookingsRes, reviewsRes] = await Promise.all([
        supabase.from('bookings').select('id', { count: 'exact', head: true }).eq('driver_id', dbUserId),
        supabase.from('reviews').select('id', { count: 'exact', head: true }).eq('reviewer_id', dbUserId),
      ])
      const date = new Date(createdAt)
      setStats({
        bookingsCount: bookingsRes.count ?? 0,
        reviewsCount: reviewsRes.count ?? 0,
        memberSince: date.toLocaleDateString('fr-FR', { month: 'short', year: 'numeric' }),
      })
    } catch {
      const date = new Date(createdAt)
      setStats({
        bookingsCount: 0,
        reviewsCount: 0,
        memberSince: date.toLocaleDateString('fr-FR', { month: 'short', year: 'numeric' }),
      })
    }
  }

  async function handleSave() {
    if (!profile) return
    const trimmedName = fullName.trim()
    if (!trimmedName) {
      Alert.alert('Erreur', 'Le nom ne peut pas etre vide.')
      return
    }
    setSaving(true)
    const { error } = await supabase
      .from('users')
      .update({
        full_name: trimmedName,
        phone_number: phone.trim() || null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', profile.id)

    setSaving(false)
    if (error) {
      Alert.alert('Erreur', error.message)
    } else {
      setProfile((prev) =>
        prev ? { ...prev, full_name: trimmedName, phone_number: phone.trim() || null } : prev
      )
      setEditOpen(false)
      Alert.alert('Succes', 'Profil mis a jour.')
    }
  }

  async function handleBecomeHost() {
    if (!profile) return
    const newRole = profile.role === 'driver' ? 'both' : profile.role
    const { error } = await supabase.from('users').update({ role: newRole }).eq('id', profile.id)
    if (!error) {
      setProfile((prev) => (prev ? { ...prev, role: newRole } : prev))
      Alert.alert('Felicitations !', 'Vous etes maintenant hote Flashpark.')
    }
  }

  async function handleSignOut() {
    Alert.alert('Deconnexion', 'Voulez-vous vous deconnecter ?', [
      { text: 'Annuler', style: 'cancel' },
      {
        text: 'Deconnecter',
        style: 'destructive',
        onPress: async () => {
          await supabase.auth.signOut()
          setProfile(null)
          setAuthed(false)
          router.replace('/(auth)/login')
        },
      },
    ])
  }

  function handleMenuPress(key: string) {
    if (key === 'personal') router.push('/settings/personal')
    else if (key === 'vehicles') router.push('/settings/vehicles')
    else if (key === 'host_dashboard') router.push('/(tabs)/host')
    else Alert.alert('Bientot disponible', 'Cette fonctionnalite arrive bientot.')
  }

  // --- Loading state ---
  if (loading) return <ProfileSkeleton />

  // --- Guest state ---
  if (!authed) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.guestWrap}>
          <View style={styles.guestAvatarCircle}>
            <User color={COLORS.gray300} size={44} />
          </View>
          <Text style={styles.guestTitle}>Non connecte</Text>
          <Text style={styles.guestSub}>Connectez-vous pour acceder a votre profil</Text>
          <TouchableOpacity style={styles.loginBtn} onPress={() => router.push('/(auth)/login')} activeOpacity={0.7}>
            <Text style={styles.loginBtnText}>Se connecter</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    )
  }

  const isHost = profile?.role === 'host' || profile?.role === 'both'
  const isDriver = profile?.role === 'driver' || profile?.role === 'both'
  const roleConf = profile
    ? ROLE_CONFIG[profile.role] ?? { label: profile.role, color: COLORS.gray500, bg: COLORS.gray50 }
    : null

  const initials = profile?.full_name
    ? profile.full_name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2)
    : profile?.email?.[0]?.toUpperCase() ?? 'U'

  const ACCOUNT_ITEMS = [
    { icon: UserCircle, label: 'Informations personnelles', key: 'personal' },
    { icon: Car, label: 'Vehicules', key: 'vehicles' },
    { icon: CreditCard, label: 'Paiement', key: 'payment' },
    { icon: Bell, label: 'Notifications', key: 'notifications' },
    { icon: Lock, label: 'Securite', key: 'security' },
  ]

  const HOST_ITEMS = [
    { icon: LayoutDashboard, label: 'Tableau de bord hote', key: 'host_dashboard' },
    { icon: List, label: 'Mes annonces', key: 'listings' },
    { icon: TrendingUp, label: 'Revenus', key: 'revenue' },
  ]

  const SUPPORT_ITEMS = [
    { icon: LifeBuoy, label: "Centre d'aide", key: 'help' },
    { icon: FileText, label: "Conditions d'utilisation", key: 'terms' },
    { icon: Shield, label: 'Confidentialite', key: 'privacy' },
  ]

  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => loadProfile(true)}
            tintColor={COLORS.primary}
          />
        }
      >
        {/* ---- Header ---- */}
        <View style={styles.headerGradient}>
          <SafeAreaView edges={['top']} style={styles.headerSafe}>
            <View style={styles.headerContent}>
              <View style={styles.avatarLarge}>
                <Text style={styles.avatarLargeText}>{initials}</Text>
              </View>
              <Text style={styles.headerName}>{profile?.full_name}</Text>
              <Text style={styles.headerEmail}>{profile?.email}</Text>
              {roleConf && (
                <View style={[styles.roleBadge, { backgroundColor: 'rgba(255,255,255,0.2)' }]}>
                  <Text style={styles.roleBadgeText}>{roleConf.label}</Text>
                </View>
              )}
            </View>
          </SafeAreaView>
        </View>

        {/* ---- Stats row ---- */}
        {stats && (
          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{stats.bookingsCount}</Text>
              <Text style={styles.statLabel}>Reservations</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{stats.reviewsCount}</Text>
              <Text style={styles.statLabel}>Avis donnes</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{stats.memberSince}</Text>
              <Text style={styles.statLabel}>Membre depuis</Text>
            </View>
          </View>
        )}

        {/* ---- Section: Mon compte ---- */}
        <Text style={styles.sectionLabel}>Mon compte</Text>
        <View style={styles.menuCard}>
          {ACCOUNT_ITEMS.map((item, index) => {
            const Icon = item.icon
            return (
              <TouchableOpacity
                key={item.key}
                style={[styles.menuRow, index < ACCOUNT_ITEMS.length - 1 && styles.menuRowBorder]}
                onPress={() => handleMenuPress(item.key)}
                activeOpacity={0.6}
              >
                <View style={styles.menuIconWrap}>
                  <Icon color={COLORS.primary} size={18} />
                </View>
                <Text style={styles.menuLabel}>{item.label}</Text>
                <ChevronRight color={COLORS.gray300} size={18} />
              </TouchableOpacity>
            )
          })}
        </View>

        {/* ---- Section: Hebergement (hosts only) ---- */}
        {isHost && (
          <>
            <Text style={styles.sectionLabel}>Hebergement</Text>
            <View style={styles.menuCard}>
              {HOST_ITEMS.map((item, index) => {
                const Icon = item.icon
                return (
                  <TouchableOpacity
                    key={item.key}
                    style={[styles.menuRow, index < HOST_ITEMS.length - 1 && styles.menuRowBorder]}
                    onPress={() => handleMenuPress(item.key)}
                    activeOpacity={0.6}
                  >
                    <View style={[styles.menuIconWrap, { backgroundColor: COLORS.successLight }]}>
                      <Icon color={COLORS.success} size={18} />
                    </View>
                    <Text style={styles.menuLabel}>{item.label}</Text>
                    <ChevronRight color={COLORS.gray300} size={18} />
                  </TouchableOpacity>
                )
              })}
            </View>
          </>
        )}

        {/* ---- Section: Assistance ---- */}
        <Text style={styles.sectionLabel}>Assistance</Text>
        <View style={styles.menuCard}>
          {SUPPORT_ITEMS.map((item, index) => {
            const Icon = item.icon
            return (
              <TouchableOpacity
                key={item.key}
                style={[styles.menuRow, index < SUPPORT_ITEMS.length - 1 && styles.menuRowBorder]}
                onPress={() => handleMenuPress(item.key)}
                activeOpacity={0.6}
              >
                <View style={[styles.menuIconWrap, { backgroundColor: COLORS.gray100 }]}>
                  <Icon color={COLORS.gray700} size={18} />
                </View>
                <Text style={styles.menuLabel}>{item.label}</Text>
                <ChevronRight color={COLORS.gray300} size={18} />
              </TouchableOpacity>
            )
          })}
        </View>

        {/* ---- Devenir hote CTA ---- */}
        {profile && !isHost && profile.role !== 'admin' && (
          <TouchableOpacity style={styles.hostCta} onPress={handleBecomeHost} activeOpacity={0.85}>
            <View style={styles.hostCtaInner}>
              <View style={styles.hostCtaIconWrap}>
                <Zap color={COLORS.white} size={22} fill={COLORS.white} />
              </View>
              <View style={styles.hostCtaTextWrap}>
                <Text style={styles.hostCtaTitle}>Devenir hote Flashpark</Text>
                <Text style={styles.hostCtaDesc}>
                  Louez votre place et generez des revenus. Gratuit, sans engagement.
                </Text>
              </View>
              <ChevronRight color="rgba(255,255,255,0.6)" size={20} />
            </View>
          </TouchableOpacity>
        )}

        {/* ---- Edit profile (collapsible) ---- */}
        <View style={styles.editCard}>
          <TouchableOpacity
            style={styles.editHeader}
            onPress={() => setEditOpen((prev) => !prev)}
            activeOpacity={0.7}
          >
            <Text style={styles.editHeaderTitle}>Modifier le profil</Text>
            {editOpen
              ? <ChevronUp color={COLORS.gray400} size={20} />
              : <ChevronDown color={COLORS.gray400} size={20} />
            }
          </TouchableOpacity>

          {editOpen && (
            <View style={styles.editBody}>
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Nom complet</Text>
                <TextInput
                  style={styles.input}
                  value={fullName}
                  onChangeText={setFullName}
                  placeholder="Votre nom complet"
                  placeholderTextColor={COLORS.gray400}
                />
              </View>
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Telephone</Text>
                <TextInput
                  style={styles.input}
                  value={phone}
                  onChangeText={setPhone}
                  placeholder="+33 6 12 34 56 78"
                  placeholderTextColor={COLORS.gray400}
                  keyboardType="phone-pad"
                />
              </View>
              <TouchableOpacity
                style={[styles.saveBtn, saving && { opacity: 0.6 }]}
                onPress={handleSave}
                disabled={saving}
                activeOpacity={0.7}
              >
                <Text style={styles.saveBtnText}>
                  {saving ? 'Enregistrement...' : 'Enregistrer les modifications'}
                </Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        {/* ---- Sign out ---- */}
        <TouchableOpacity style={styles.signOutBtn} onPress={handleSignOut} activeOpacity={0.7}>
          <LogOut color={COLORS.danger} size={18} />
          <Text style={styles.signOutText}>Se deconnecter</Text>
        </TouchableOpacity>

        <View style={{ height: 48 }} />
      </ScrollView>
    </View>
  )
}

const CARD_SHADOW = Platform.select({
  ios: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
  },
  android: { elevation: 2 },
}) as any

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  scrollContent: {
    paddingBottom: 20,
  },

  // --- Header ---
  headerGradient: {
    paddingBottom: 32,
    backgroundColor: COLORS.primary,
  },
  headerSafe: {
    paddingTop: Platform.OS === 'android' ? 40 : 0,
  },
  headerContent: {
    alignItems: 'center',
    paddingTop: 24,
    paddingHorizontal: 20,
  },
  avatarLarge: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderWidth: 3,
    borderColor: 'rgba(255,255,255,0.4)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
  },
  avatarLargeText: {
    fontSize: 30,
    fontWeight: '800',
    color: COLORS.white,
  },
  headerName: {
    fontSize: 20,
    fontWeight: '800',
    color: COLORS.white,
    marginBottom: 3,
  },
  headerEmail: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.7)',
    marginBottom: 10,
  },
  roleBadge: {
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 5,
  },
  roleBadgeText: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.white,
  },

  // --- Stats ---
  statsRow: {
    flexDirection: 'row',
    backgroundColor: COLORS.white,
    marginHorizontal: 16,
    marginTop: -16,
    borderRadius: 16,
    paddingVertical: 16,
    paddingHorizontal: 8,
    ...CARD_SHADOW,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 17,
    fontWeight: '800',
    color: COLORS.dark,
    marginBottom: 2,
  },
  statLabel: {
    fontSize: 11,
    color: COLORS.gray400,
    fontWeight: '500',
    textAlign: 'center',
  },
  statDivider: {
    width: 1,
    backgroundColor: COLORS.gray200,
    marginVertical: 2,
  },

  // --- Section labels ---
  sectionLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.gray400,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginTop: 24,
    marginBottom: 6,
    marginHorizontal: 20,
  },

  // --- Menu card ---
  menuCard: {
    backgroundColor: COLORS.white,
    marginHorizontal: 16,
    borderRadius: 16,
    overflow: 'hidden',
    ...CARD_SHADOW,
  },
  menuRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
  },
  menuRowBorder: {
    borderBottomWidth: 1,
    borderBottomColor: COLORS.gray100,
  },
  menuIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: COLORS.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  menuLabel: {
    flex: 1,
    fontSize: 15,
    fontWeight: '500',
    color: COLORS.dark,
  },

  // --- Host CTA ---
  hostCta: {
    marginHorizontal: 16,
    marginTop: 20,
    borderRadius: 16,
    overflow: 'hidden',
  },
  hostCtaInner: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 18,
    paddingHorizontal: 16,
    gap: 14,
    backgroundColor: COLORS.primary,
    borderRadius: 16,
  },
  hostCtaIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  hostCtaTextWrap: {
    flex: 1,
  },
  hostCtaTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.white,
    marginBottom: 3,
  },
  hostCtaDesc: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.7)',
    lineHeight: 17,
  },

  // --- Edit profile ---
  editCard: {
    backgroundColor: COLORS.white,
    marginHorizontal: 16,
    marginTop: 20,
    borderRadius: 16,
    overflow: 'hidden',
    ...CARD_SHADOW,
  },
  editHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  editHeaderTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.dark,
  },
  editBody: {
    paddingHorizontal: 16,
    paddingBottom: 16,
    gap: 14,
    borderTopWidth: 1,
    borderTopColor: COLORS.gray100,
    paddingTop: 14,
  },
  inputGroup: {
    gap: 6,
  },
  inputLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.gray500,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  input: {
    borderWidth: 1.5,
    borderColor: COLORS.gray200,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    color: COLORS.dark,
    backgroundColor: COLORS.gray50,
  },
  saveBtn: {
    backgroundColor: COLORS.primary,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 4,
  },
  saveBtnText: {
    color: COLORS.white,
    fontWeight: '700',
    fontSize: 15,
  },

  // --- Sign out ---
  signOutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderWidth: 1.5,
    borderColor: COLORS.danger,
    marginHorizontal: 16,
    marginTop: 20,
    borderRadius: 16,
    paddingVertical: 15,
    backgroundColor: COLORS.white,
  },
  signOutText: {
    color: COLORS.danger,
    fontWeight: '700',
    fontSize: 15,
  },

  // --- Guest ---
  guestWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    paddingHorizontal: 32,
  },
  guestAvatarCircle: {
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: COLORS.gray100,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  guestTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: COLORS.dark,
  },
  guestSub: {
    fontSize: 14,
    color: COLORS.gray400,
    textAlign: 'center',
    lineHeight: 21,
  },
  loginBtn: {
    marginTop: 12,
    backgroundColor: COLORS.primary,
    borderRadius: 14,
    paddingHorizontal: 32,
    paddingVertical: 14,
  },
  loginBtnText: {
    color: COLORS.white,
    fontWeight: '700',
    fontSize: 16,
  },
})
