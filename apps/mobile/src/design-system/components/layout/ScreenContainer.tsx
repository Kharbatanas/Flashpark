import React from 'react'
import {
  KeyboardAvoidingView,
  Platform,
  RefreshControl,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native'
import { SafeAreaView, Edge } from 'react-native-safe-area-context'
import { useTheme } from '../../theme/useTheme'

interface ScreenContainerProps {
  children: React.ReactNode
  scroll?: boolean
  edges?: Edge[]
  refreshing?: boolean
  onRefresh?: () => void
  style?: object
}

const DEFAULT_EDGES: Edge[] = ['top', 'left', 'right']

export function ScreenContainer({
  children,
  scroll = false,
  edges = DEFAULT_EDGES,
  refreshing = false,
  onRefresh,
  style,
}: ScreenContainerProps): React.JSX.Element {
  const { colors } = useTheme()

  const bgStyle = { backgroundColor: colors.background }

  if (scroll) {
    return (
      <SafeAreaView style={[styles.flex, bgStyle]} edges={edges}>
        <KeyboardAvoidingView
          style={styles.flex}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          <ScrollView
            style={styles.flex}
            contentContainerStyle={[styles.scrollContent, style]}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
            refreshControl={
              onRefresh != null ? (
                <RefreshControl
                  refreshing={refreshing}
                  onRefresh={onRefresh}
                  tintColor={colors.primary}
                />
              ) : undefined
            }
          >
            {children}
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    )
  }

  return (
    <SafeAreaView style={[styles.flex, bgStyle]} edges={edges}>
      <View style={[styles.flex, style]}>{children}</View>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
  },
})
