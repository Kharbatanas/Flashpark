import AsyncStorage from '@react-native-async-storage/async-storage'

export const STORAGE_KEYS = {
  RECENT_SEARCHES: '@flashpark/recent_searches',
  THEME_PREFERENCE: '@flashpark/theme_preference',
  ONBOARDING_COMPLETE: '@flashpark/onboarding_complete',
  LAST_KNOWN_LOCATION: '@flashpark/last_known_location',
} as const

export type StorageKey = (typeof STORAGE_KEYS)[keyof typeof STORAGE_KEYS]

export async function getItem<T>(key: string): Promise<T | null> {
  try {
    const raw = await AsyncStorage.getItem(key)
    if (raw === null) return null
    return JSON.parse(raw) as T
  } catch {
    return null
  }
}

export async function setItem<T>(key: string, value: T): Promise<void> {
  try {
    await AsyncStorage.setItem(key, JSON.stringify(value))
  } catch {
    // Storage write failures are non-fatal; ignore silently
  }
}

export async function removeItem(key: string): Promise<void> {
  try {
    await AsyncStorage.removeItem(key)
  } catch {
    // Storage remove failures are non-fatal; ignore silently
  }
}
