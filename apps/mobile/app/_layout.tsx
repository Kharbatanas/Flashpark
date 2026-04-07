import { useEffect } from 'react'
import { Stack } from 'expo-router'
import { StatusBar } from 'expo-status-bar'
import { GestureHandlerRootView } from 'react-native-gesture-handler'
import { QueryClientProvider } from '@tanstack/react-query'
import { ThemeProvider } from '../src/design-system/theme/ThemeContext'
import { queryClient } from '../src/api/queryClient'
import { useAuthStore } from '../src/stores/authStore'
import ErrorBoundary from '../components/error-boundary'

function AuthInitializer(): null {
  useEffect(() => { useAuthStore.getState().initialize() }, [])
  return null
}

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <ThemeProvider>
        <QueryClientProvider client={queryClient}>
          <ErrorBoundary>
            <AuthInitializer />
            <Stack screenOptions={{ headerShown: false }}>
              <Stack.Screen name='(tabs)' />
              <Stack.Screen name='(auth)' options={{ headerShown: false }} />
              <Stack.Screen name='spot/[id]' options={{ presentation: 'modal' }} />
              <Stack.Screen name='booking/[id]' options={{ presentation: 'fullScreenModal' }} />
              <Stack.Screen name='booking/[id]/chat' />
              <Stack.Screen name='booking/[id]/dispute' options={{ presentation: 'modal' }} />
              <Stack.Screen name='booking/[id]/extend' options={{ presentation: 'transparentModal' }} />
              <Stack.Screen name='booking/[id]/review' options={{ presentation: 'modal' }} />
              <Stack.Screen name='booking/[id]/check-in' options={{ presentation: 'modal' }} />
              <Stack.Screen name='host/new' />
              <Stack.Screen name='settings/personal' options={{ presentation: 'modal' }} />
              <Stack.Screen name='settings/vehicles' options={{ presentation: 'modal' }} />
              <Stack.Screen name='notifications' />
              <Stack.Screen name='help/index' />
            </Stack>
            <StatusBar style='auto' />
          </ErrorBoundary>
        </QueryClientProvider>
      </ThemeProvider>
    </GestureHandlerRootView>
  )
}