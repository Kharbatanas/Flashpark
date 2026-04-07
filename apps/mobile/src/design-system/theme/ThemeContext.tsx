import React, { createContext, useCallback, useEffect, useState } from 'react'
import { useColorScheme } from 'react-native'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { ColorPalette, darkColors, lightColors } from '../tokens/colors'

type ThemeMode = 'light' | 'dark' | 'system'

export interface ThemeContextValue {
  colors: ColorPalette
  isDark: boolean
  mode: ThemeMode
  setTheme: (mode: ThemeMode) => void
}

const STORAGE_KEY = '@flashpark/theme'

export const ThemeContext = createContext<ThemeContextValue>({
  colors: lightColors,
  isDark: false,
  mode: 'system',
  setTheme: () => {},
})

interface ThemeProviderProps {
  children: React.ReactNode
}

export function ThemeProvider({ children }: ThemeProviderProps): React.JSX.Element {
  const systemScheme = useColorScheme()
  const [mode, setMode] = useState<ThemeMode>('system')

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY)
      .then((stored) => {
        if (stored === 'light' || stored === 'dark' || stored === 'system') {
          setMode(stored)
        }
      })
      .catch(() => {})
  }, [])

  const setTheme = useCallback((next: ThemeMode) => {
    setMode(next)
    AsyncStorage.setItem(STORAGE_KEY, next).catch(() => {})
  }, [])

  const isDark =
    mode === 'system' ? systemScheme === 'dark' : mode === 'dark'

  const colors = isDark ? darkColors : lightColors

  return (
    <ThemeContext.Provider value={{ colors, isDark, mode, setTheme }}>
      {children}
    </ThemeContext.Provider>
  )
}
