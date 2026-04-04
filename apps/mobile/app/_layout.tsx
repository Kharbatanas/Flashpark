import { Stack } from 'expo-router'
import { StatusBar } from 'expo-status-bar'
import { GestureHandlerRootView } from 'react-native-gesture-handler'

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="(auth)" />
        <Stack.Screen name="spot/[id]" options={{ presentation: 'modal' }} />
        <Stack.Screen name="booking/[id]" options={{ presentation: 'modal' }} />
        <Stack.Screen name="host/new" options={{ presentation: 'modal' }} />
      </Stack>
      <StatusBar style="dark" />
    </GestureHandlerRootView>
  )
}
