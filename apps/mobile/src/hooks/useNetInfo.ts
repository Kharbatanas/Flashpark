import { useEffect, useState } from 'react'
import NetInfo, { NetInfoState } from '@react-native-community/netinfo'

interface NetInfoResult {
  isConnected: boolean
  isInternetReachable: boolean | null
  type: string | null
}

export function useNetInfo(): NetInfoResult {
  const [state, setState] = useState<NetInfoResult>({
    isConnected: true,
    isInternetReachable: true,
    type: null,
  })

  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener((info: NetInfoState) => {
      setState({
        isConnected: info.isConnected ?? false,
        isInternetReachable: info.isInternetReachable,
        type: info.type,
      })
    })

    return unsubscribe
  }, [])

  return state
}
