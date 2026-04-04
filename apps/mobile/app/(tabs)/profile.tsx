import { useEffect, useState, useCallback } from 'react'
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  TextInput,
  Alert,
  ScrollView,
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
  Landmark,
  Bell,
  Lock,
  LifeBuoy,
  FileText,
  Shield,
  Zap,
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

const MENU_ITEMS = [
  { icon: Landmark, label: 'Compte bancaire', key: 'bank' },
  { icon: Bell, label: 'Notifications', key: 'notifications' },
  { icon: Lock, label: 'Mot de passe', key: 'password' },
  { icon: LifeBuoy, label: 'Support / Aide', key: 'support' },
  { icon: FileText, label: "Conditions d'utilisation", key: 'terms' },
  { icon: Shield, label: 'Politique de confidentialite', key: 'privacy' },
]

/* ---- Skeleton ---- */
function SkeletonBox({ width, height, borderRadius = 8, style }: {
  width: number | string; height: number; borderRadius?: number; style?: any
}) {
  return (
    <View style={[{ width: width as any, height, borderRadius, backgroundColor: 'rgba(255,255,255,0.2)' }, style]} />
  )
}

function ProfileSkeleton() {
  return (
    <View style={styles.container}>
      {/* Header skeleton */}
      <View style={styles.headerGradient}>
        <SafeAreaView edges={['top']} style={styles.headerSafe}>
          <View style={[styles.headerContent, { gap: 12 }]}>
            <SkeletonBox width={88} height={88} borderRadius={44} />
            <SkeletonBox width={160} height={22} borderRadius={6} />
            <SkeletonBox width={200} height={13} borderRadius={4} />
          </View>
        </SafeAreaView>
      </View>

      {/* Stats skeleton */}
      <View style={[styles.statsRow, { justifyContent: 'center', gap: 20 }]}>
        {[0, 1, 2].map((i) => (
          <View key={i} style={styles.statItem}>
            <View style={{ width: 40, height: 18, borderRadius: 4, backgroundColor: COLORS.gray200 }} />
            <View style={{ width: 60, height: 11, borderRadius: 3, backgroundColor: COLORS.gray200, marginTop: 4 }} />
          </View>
        ))}
      </View>

      {/* Menu skeleton */}
      <View style={[styles.menuCard, { gap: 0 }]}>
        {[0, 1, 2, 3, 4, 5].map((i) => (
          <View key={i} style={[styles.menuRow, i < 5 && styles.menuRowBorder]}>
            <View style={{ width: 36, height: 36, borderRadius: 10, backgroundColor: COLORS.gray100 }} />
            <View style={{ flex: 1, marginLeft: 12 }}>
              <View style={{ width: '60%', height: 15, borderRadius: 4, backgroundColor: COLORS.gray100 }} />
            </View>
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
  const [authed, setAuthed] = useState(false)

  // Edit profile state
  const [editOpen, setEditOpen] = useState(false)
  const [fullName, setFullName] = useState('')
  const [phone, setPhone] = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    loadProfile()
  }, [])

  const loadProfile = useCallback(async () => {
    setLoading(true)
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) {
        setLoading(false)
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
  }, [])

  async function loadStats(dbUserId: string, createdAt: string) {
    try {
      const [bookingsRes, reviewsRes] = await Promise.all([
        supabase
          .from('bookings')
          .select('id', { count: 'exact', head: true })
          .eq('driver_id', dbUserId),
        supabase
          .from('reviews')
          .select('id', { count: 'exact', head: true })
          .eq('reviewer_id', dbUserId),
      ])

      const date = new Date(createdAt)
      const memberSince = date.toLocaleDateString('fr-FR', {
        month: 'short',
        year: 'numeric',
      })

      setStats({
        bookingsCount: bookingsRes.count ?? 0,
        reviewsCount: reviewsRes.count ?? 0,
        memberSince,
      })
    } catch {
      // Tables may not exist yet
      const date = new Date(createdAt)
      setStats({
        bookingsCount: 0,
        reviewsCount: 0,
        memberSince: date.toLocaleDateString('fr-FR', {
          month: 'short',
          year: 'numeric',
        }),
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
    const { error } = await supabase
      .from('users')
      .update({ role: newRole })
      .eq('id', profile.id)

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
    Alert.alert('Bientot disponible', 'Cette fonctionnalite arrive bientot.')
  }

  // --- Loading state ---
  if (loading) {
    return <ProfileSkeleton />
  }

  // --- Guest state ---
  if (!authed) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.guestWrap}>
          <View style={styles.guestAvatarCircle}>
            <User color={COLORS.gray300} size={44} />
          </View>
          <Text style={styles.guestTitle}>Non connecte</Text>
          <Text style={styles.guestSub}>
            Connectez-vous pour acceder a votre profil
          </Text>
          <TouchableOpacity
            style={styles.loginBtn}
            onPress={() => router.push('/(auth)/login')}
            activeOpacity={0.7}
          >
            <Text style={styles.loginBtnText}>Se connecter</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    )
  }

  // --- Authenticated state ---
  const roleConf = profile
    ? ROLE_CONFIG[profile.role] ?? {
        label: profile.role,
        color: COLORS.gray500,
        bg: COLORS.gray50,
      }
    : null

  const initials = profile?.full_name
    ? profile.full_name
        .split(' ')
        .map((n) => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2)
    : profile?.email?.[0]?.toUpperCase() ?? 'U'

  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* ---- Header with avatar ---- */}
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

        {/* ---- Menu list ---- */}
        <View style={styles.menuCard}>
          {MENU_ITEMS.map((item, index) => {
            const Icon = item.icon
            return (
              <TouchableOpacity
                key={item.key}
                style={[
                  styles.menuRow,
                  index < MENU_ITEMS.length - 1 && styles.menuRowBorder,
                ]}
                onPress={() => handleMenuPress(item.key)}
                activeOpacity={0.6}
              >
                <View style={styles.menuIconWrap}>
                  <Icon color={COLORS.gray700} size={20} />
                </View>
                <Text style={styles.menuLabel}>{item.label}</Text>
                <ChevronRight color={COLORS.gray300} size={20} />
              </TouchableOpacity>
            )
          })}
        </View>

        {/* ---- Edit profile (collapsible) ---- */}
        <View style={styles.sectionCard}>
          <TouchableOpacity
            style={styles.sectionHeader}
            onPress={() => setEditOpen((prev) => !prev)}
            activeOpacity={0.7}
          >
            <Text style={styles.sectionTitle}>Modifier le profil</Text>
            {editOpen ? (
              <ChevronUp color={COLORS.gray400} size={20} />
            ) : (
              <ChevronDown color={COLORS.gray400} size={20} />
            )}
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

        {/* ---- Become host CTA ---- */}
        {profile &&
          profile.role !== 'host' &&
          profile.role !== 'both' &&
          profile.role !== 'admin' && (
            <TouchableOpacity style={styles.hostCta} onPress={handleBecomeHost} activeOpacity={0.8}>
              <View style={styles.hostCtaInner}>
                <Zap color={COLORS.warning} size={22} />
                <View style={styles.hostCtaTextWrap}>
                  <Text style={styles.hostCtaTitle}>Devenir hote Flashpark</Text>
                  <Text style={styles.hostCtaDesc}>
                    Louez votre place et generez des revenus. Gratuit, sans engagement.
                  </Text>
                </View>
                <ChevronRight color={COLORS.gray400} size={20} />
              </View>
            </TouchableOpacity>
          )}

        {/* ---- Sign out ---- */}
        <TouchableOpacity style={styles.signOutBtn} onPress={handleSignOut} activeOpacity={0.7}>
          <LogOut color={COLORS.danger} size={18} />
          <Text style={styles.signOutText}>Se deconnecter</Text>
        </TouchableOpacity>

        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  scrollContent: {
    paddingBottom: 20,
  },

  // --- Header gradient ---
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
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderWidth: 3,
    borderColor: 'rgba(255,255,255,0.4)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
  },
  avatarLargeText: {
    fontSize: 32,
    fontWeight: '800',
    color: COLORS.white,
  },
  headerName: {
    fontSize: 22,
    fontWeight: '800',
    color: COLORS.white,
    marginBottom: 2,
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
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.08,
        shadowRadius: 12,
      },
      android: { elevation: 4 },
    }),
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 18,
    fontWeight: '800',
    color: COLORS.dark,
    marginBottom: 2,
  },
  statLabel: {
    fontSize: 11,
    color: COLORS.gray400,
    fontWeight: '500',
  },
  statDivider: {
    width: 1,
    backgroundColor: COLORS.gray200,
    marginVertical: 2,
  },

  // --- Menu ---
  menuCard: {
    backgroundColor: COLORS.white,
    marginHorizontal: 16,
    marginTop: 20,
    borderRadius: 16,
    overflow: 'hidden',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
      },
      android: { elevation: 2 },
    }),
  },
  menuRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 15,
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
    backgroundColor: COLORS.gray50,
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

  // --- Edit profile ---
  sectionCard: {
    backgroundColor: COLORS.white,
    marginHorizontal: 16,
    marginTop: 16,
    borderRadius: 16,
    overflow: 'hidden',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
      },
      android: { elevation: 2 },
    }),
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.dark,
  },
  editBody: {
    paddingHorizontal: 16,
    paddingBottom: 16,
    gap: 14,
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

  // --- Host CTA ---
  hostCta: {
    marginHorizontal: 16,
    marginTop: 16,
    borderRadius: 16,
    overflow: 'hidden',
  },
  hostCtaInner: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 18,
    paddingHorizontal: 16,
    gap: 12,
    backgroundColor: COLORS.dark,
    borderRadius: 16,
  },
  hostCtaTextWrap: {
    flex: 1,
  },
  hostCtaTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.white,
    marginBottom: 2,
  },
  hostCtaDesc: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.6)',
    lineHeight: 17,
  },

  // --- Sign out ---
  signOutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: COLORS.dangerLight,
    marginHorizontal: 16,
    marginTop: 16,
    borderRadius: 16,
    paddingVertical: 15,
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
