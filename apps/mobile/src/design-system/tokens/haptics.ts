import * as ExpoHaptics from 'expo-haptics'

export const haptics = {
  selection: (): void => {
    ExpoHaptics.selectionAsync().catch(() => {})
  },
  light: (): void => {
    ExpoHaptics.impactAsync(ExpoHaptics.ImpactFeedbackStyle.Light).catch(() => {})
  },
  medium: (): void => {
    ExpoHaptics.impactAsync(ExpoHaptics.ImpactFeedbackStyle.Medium).catch(() => {})
  },
  success: (): void => {
    ExpoHaptics.notificationAsync(ExpoHaptics.NotificationFeedbackType.Success).catch(() => {})
  },
  error: (): void => {
    ExpoHaptics.notificationAsync(ExpoHaptics.NotificationFeedbackType.Error).catch(() => {})
  },
  warning: (): void => {
    ExpoHaptics.notificationAsync(ExpoHaptics.NotificationFeedbackType.Warning).catch(() => {})
  },
}
