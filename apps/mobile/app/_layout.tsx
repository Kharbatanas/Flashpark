import { Stack } from 'expo-router'
import { StatusBar } from 'expo-status-bar'
import { GestureHandlerRootView } from 'react-native-gesture-handler'
import ErrorBoundary from '../components/error-boundary'

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <ErrorBoundary>
        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Screen name="(tabs)" />
          <Stack.Screen name="(auth)" />
          <Stack.Screen name="spot/[id]" options={{ presentation: 'modal' }} />
          <Stack.Screen name="booking/[id]" options={{ presentation: 'modal' }} />
          <Stack.Screen name="booking/review" options={{ presentation: 'modal' }} />
          <Stack.Screen name="booking/chat" />
          <Stack.Screen name="host/new" options={{ presentation: 'modal' }} />
          <Stack.Screen name="help/index" />
          <Stack.Screen name="notifications" />
          <Stack.Screen name="settings/personal" options={{ presentation: 'modal' }} />
          <Stack.Screen name="settings/vehicles" options={{ presentation: 'modal' }} />
        </Stack>
        <StatusBar style="dark" />
      </ErrorBoundary>
    </GestureHandlerRootView>
  )
}
