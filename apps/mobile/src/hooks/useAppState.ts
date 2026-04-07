import { useEffect, useRef, useState } from 'react'
import { AppState, AppStateStatus } from 'react-native'

interface AppStateResult {
  appState: AppStateStatus
  isForeground: boolean
  isBackground: boolean
}

export function useAppState(): AppStateResult {
  const [appState, setAppState] = useState<AppStateStatus>(AppState.currentState)
  const previousState = useRef<AppStateStatus>(AppState.currentState)

  useEffect(() => {
    const subscription = AppState.addEventListener('change', (next) => {
      previousState.current = appState
      setAppState(next)
    })

    return () => subscription.remove()
  }, [appState])

  return {
    appState,
    isForeground: appState === 'active',
    isBackground: appState === 'background' || appState === 'inactive',
  }
}
