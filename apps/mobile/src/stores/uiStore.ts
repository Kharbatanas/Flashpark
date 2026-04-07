import { create } from 'zustand'

type Theme = 'light' | 'dark' | 'system'

interface UIState {
  theme: Theme
  isTabBarVisible: boolean
  setTheme: (theme: Theme) => void
  showTabBar: () => void
  hideTabBar: () => void
}

export const useUIStore = create<UIState>((set) => ({
  theme: 'system',
  isTabBarVisible: true,

  setTheme: (theme) => set({ theme }),
  showTabBar: () => set({ isTabBarVisible: true }),
  hideTabBar: () => set({ isTabBarVisible: false }),
}))
