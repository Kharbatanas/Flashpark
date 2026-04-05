import React from 'react'
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Platform,
} from 'react-native'
import { router } from 'expo-router'
import { AlertTriangle } from 'lucide-react-native'
import { COLORS } from '../lib/constants'

interface Props {
  children: React.ReactNode
}

interface State {
  hasError: boolean
  error: Error | null
}

export default class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    // Could log to Sentry or similar here
    console.error('[ErrorBoundary]', error, info.componentStack)
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: null })
  }

  handleBack = () => {
    this.setState({ hasError: false, error: null })
    try {
      router.back()
    } catch {
      // ignore nav errors
    }
  }

  render() {
    if (!this.state.hasError) {
      return this.props.children
    }

    return (
      <View style={styles.container}>
        <View style={styles.card}>
          <View style={styles.iconCircle}>
            <AlertTriangle color={COLORS.warning} size={36} strokeWidth={2} />
          </View>
          <Text style={styles.title}>Une erreur est survenue</Text>
          <Text style={styles.subtitle}>
            Une erreur inattendue s&apos;est produite. Veuillez réessayer ou revenir en arrière.
          </Text>
          {__DEV__ && this.state.error && (
            <View style={styles.devBox}>
              <Text style={styles.devText} numberOfLines={4}>
                {this.state.error.message}
              </Text>
            </View>
          )}
          <View style={styles.actions}>
            <TouchableOpacity
              style={styles.primaryBtn}
              onPress={this.handleRetry}
              activeOpacity={0.85}
            >
              <Text style={styles.primaryBtnText}>Réessayer</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.secondaryBtn}
              onPress={this.handleBack}
              activeOpacity={0.75}
            >
              <Text style={styles.secondaryBtnText}>Retour</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    )
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  card: {
    backgroundColor: COLORS.white,
    borderRadius: 24,
    padding: 28,
    alignItems: 'center',
    width: '100%',
    maxWidth: 360,
    borderWidth: 1,
    borderColor: COLORS.gray200,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.08,
        shadowRadius: 16,
      },
      android: { elevation: 4 },
    }),
  },
  iconCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: COLORS.warningLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 20,
    fontWeight: '800',
    color: COLORS.dark,
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 14,
    color: COLORS.gray500,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 20,
  },
  devBox: {
    backgroundColor: COLORS.dangerLight,
    borderRadius: 10,
    padding: 12,
    width: '100%',
    marginBottom: 16,
    borderWidth: 1,
    borderColor: COLORS.danger + '40',
  },
  devText: {
    fontSize: 11,
    color: COLORS.danger,
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
  },
  actions: {
    width: '100%',
    gap: 10,
  },
  primaryBtn: {
    backgroundColor: COLORS.primary,
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
    width: '100%',
  },
  primaryBtnText: {
    color: COLORS.white,
    fontSize: 15,
    fontWeight: '700',
  },
  secondaryBtn: {
    backgroundColor: COLORS.gray100,
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
    width: '100%',
  },
  secondaryBtnText: {
    color: COLORS.dark,
    fontSize: 15,
    fontWeight: '600',
  },
})
