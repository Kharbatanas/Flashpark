import { Tabs } from 'expo-router'
import { Home, Search, Calendar, MessageCircle, User } from 'lucide-react-native'
import { Platform, StyleSheet, View } from 'react-native'
import { COLORS } from '../../lib/constants'

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: COLORS.primary,
        tabBarInactiveTintColor: '#9CA3AF',
        tabBarStyle: styles.tabBar,
        tabBarLabelStyle: styles.tabLabel,
        tabBarIconStyle: styles.tabIcon,
        headerShown: false,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Explorer',
          tabBarIcon: ({ color, focused }) => (
            <Home
              color={color}
              size={22}
              fill={focused ? COLORS.primary : 'transparent'}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="search"
        options={{
          title: 'Rechercher',
          tabBarIcon: ({ color }) => <Search color={color} size={22} />,
        }}
      />
      <Tabs.Screen
        name="bookings"
        options={{
          title: 'Réservations',
          tabBarIcon: ({ color, focused }) => (
            <Calendar
              color={color}
              size={22}
              fill={focused ? COLORS.primary : 'transparent'}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="host"
        options={{
          href: null, // hide host tab — moved to profile menu
        }}
      />
      <Tabs.Screen
        name="messages"
        options={{
          title: 'Messages',
          tabBarIcon: ({ color, focused }) => (
            <MessageCircle
              color={color}
              size={22}
              fill={focused ? COLORS.primary : 'transparent'}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profil',
          tabBarIcon: ({ color, focused }) => (
            <User
              color={color}
              size={22}
              fill={focused ? COLORS.primary : 'transparent'}
            />
          ),
        }}
      />
    </Tabs>
  )
}

const styles = StyleSheet.create({
  tabBar: {
    backgroundColor: COLORS.white,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    height: Platform.OS === 'ios' ? 88 : 64,
    paddingBottom: Platform.OS === 'ios' ? 28 : 8,
    paddingTop: 8,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -2 },
        shadowOpacity: 0.06,
        shadowRadius: 8,
      },
      android: { elevation: 8 },
    }),
  },
  tabLabel: {
    fontSize: 11,
    fontWeight: '600',
  },
  tabIcon: {
    marginBottom: 0,
  },
})
