import { useEffect } from 'react'
import { Platform, StyleSheet, TouchableOpacity, View, Text } from 'react-native'
import { Tabs } from 'expo-router'
import { BlurView } from 'expo-blur'
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { Home, Search, Calendar, MessageCircle, User } from 'lucide-react-native'
import { useTheme } from '../../src/design-system/theme/useTheme'
import { haptics } from '../../src/design-system/tokens/haptics'
import { useUnreadCount } from '../../src/api/hooks/useNotifications'

const TABS = [
  { name: 'index', label: 'Explorer', Icon: Home },
  { name: 'search', label: 'Rechercher', Icon: Search },
  { name: 'bookings', label: 'Reservations', Icon: Calendar },
  { name: 'messages', label: 'Messages', Icon: MessageCircle },
  { name: 'profile', label: 'Profil', Icon: User },
] as const

const TAB_HEIGHT = Platform.OS === 'ios' ? 88 : 64

interface TabBarProps {
  state: { index: number; routes: { name: string }[] }
  navigation: {
    emit: (e: { type: string; target: string; canPreventDefault: boolean }) => { defaultPrevented: boolean }
    navigate: (name: string) => void
  }
}

function BadgeDot({ count }: { count: number }) {
  const { colors } = useTheme()
  if (count <= 0) return null
  return (
    <View style={[styles.badge, { backgroundColor: colors.danger }]}>
      <Text style={[styles.badgeText, { color: colors.textInverse }]}>
        {count > 99 ? '99+' : String(count)}
      </Text>
    </View>
  )
}

function CustomTabBar({ state, navigation }: TabBarProps) {
  const { colors, isDark } = useTheme()
  const insets = useSafeAreaInsets()
  const unread = useUnreadCount().data ?? 0

  function handlePress(index: number, name: string) {
    const event = navigation.emit({
      type: 'tabPress',
      target: state.routes[index].name,
      canPreventDefault: true,
    })
    if (!event.defaultPrevented) {
      haptics.selection()
      navigation.navigate(name)
    }
  }

  return (
    <View style={[styles.outer, { height: TAB_HEIGHT + insets.bottom, paddingBottom: insets.bottom }]}>
      {Platform.OS === 'ios' ? (
        <BlurView intensity={80} tint={isDark ? 'dark' : 'light'} style={StyleSheet.absoluteFill} />
      ) : (
        <View style={[StyleSheet.absoluteFill, { backgroundColor: colors.surface }]} />
      )}
      <View style={[styles.borderTop, { borderTopColor: colors.border }]} />
      <View style={styles.row}>
        {TABS.map((tab, index) => {
          const isFocused = state.index === index
          const { Icon, label, name } = tab
          const showBadge = name === 'messages' && unread > 0
          return (
            <TouchableOpacity
              key={name}
              style={styles.tab}
              onPress={() => handlePress(index, name)}
              activeOpacity={0.7}
              accessibilityLabel={label}
              accessibilityRole="tab"
              accessibilityState={{ selected: isFocused }}
            >
              <View style={styles.iconWrap}>
                <Icon
                  size={22}
                  color={isFocused ? colors.primary : colors.textSecondary}
                  fill={isFocused ? colors.primary : 'transparent'}
                  strokeWidth={isFocused ? 2.5 : 1.8}
                />
                {showBadge && <BadgeDot count={unread} />}
              </View>
              <Text style={[styles.tabLabel, { color: isFocused ? colors.primary : colors.textSecondary }]}>
                {label}
              </Text>
            </TouchableOpacity>
          )
        })}
      </View>
    </View>
  )
}

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{ headerShown: false }}
      tabBar={(props) => (
        <CustomTabBar
          state={props.state as TabBarProps['state']}
          navigation={props.navigation as TabBarProps['navigation']}
        />
      )}
    >
      <Tabs.Screen name="index" />
      <Tabs.Screen name="search" />
      <Tabs.Screen name="bookings" />
      <Tabs.Screen name="host" options={{ href: null }} />
      <Tabs.Screen name="messages" />
      <Tabs.Screen name="profile" />
    </Tabs>
  )
}

const styles = StyleSheet.create({
  outer: { position: 'absolute', bottom: 0, left: 0, right: 0, overflow: 'hidden' },
  borderTop: { position: 'absolute', top: 0, left: 0, right: 0, borderTopWidth: StyleSheet.hairlineWidth },
  row: { flex: 1, flexDirection: 'row', alignItems: 'center', paddingTop: 8 },
  tab: { flex: 1, alignItems: 'center', gap: 2 },
  iconWrap: { position: 'relative' },
  badge: {
    position: 'absolute', top: -4, right: -6, minWidth: 16, height: 16,
    borderRadius: 8, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 3,
  },
  badgeText: { fontSize: 9, fontWeight: '700' },
  tabLabel: { fontSize: 10, fontWeight: '600' },
})
