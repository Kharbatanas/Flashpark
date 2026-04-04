import type { Config } from 'tailwindcss'

export const flashparkColors = {
  primary: {
    DEFAULT: '#0540FF',
    50: '#EEF1FF',
    100: '#E0E5FF',
    500: '#0540FF',
    600: '#0435E0',
    700: '#032BB5',
  },
  dark: {
    DEFAULT: '#1A1A2E',
    800: '#1A1A2E',
    900: '#0F0F1A',
  },
  success: {
    DEFAULT: '#10B981',
  },
  warning: {
    DEFAULT: '#F5A623',
  },
  background: {
    DEFAULT: '#F8FAFC',
  },
} satisfies Record<string, unknown>

export const baseConfig: Partial<Config> = {
  theme: {
    extend: {
      colors: flashparkColors,
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
    },
  },
}
