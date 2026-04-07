import React, { useRef } from 'react'
import {
  StyleSheet,
  TextInput,
  TouchableOpacity,
  View,
  TextInputProps,
} from 'react-native'
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated'
import { Search, X } from 'lucide-react-native'
import { useTheme } from '../../theme/useTheme'
import { haptics } from '../../tokens/haptics'
import { radii } from '../../tokens/radii'
import { spacing } from '../../tokens/spacing'
import { timingFast } from '../../tokens/animation'
import { AppText } from '../atoms/AppText'

interface SearchBarProps {
  value: string
  onChangeText: (text: string) => void
  onFocus?: () => void
  onBlur?: () => void
  placeholder?: string
  showCancel?: boolean
}

const COLLAPSED_WIDTH = 44
const CANCEL_WIDTH = 68

export function SearchBar({
  value,
  onChangeText,
  onFocus,
  onBlur,
  placeholder = 'Rechercher une place…',
  showCancel = true,
}: SearchBarProps): React.JSX.Element {
  const { colors } = useTheme()
  const inputRef = useRef<TextInput>(null)
  const isFocused = useSharedValue(0)

  const cancelStyle = useAnimatedStyle(() => ({
    width: withTiming(isFocused.value * CANCEL_WIDTH, timingFast),
    opacity: withTiming(isFocused.value, timingFast),
  }))

  const handleFocus = (): void => {
    isFocused.value = 1
    onFocus?.()
  }

  const handleBlur = (): void => {
    isFocused.value = 0
    onBlur?.()
  }

  const handleClear = (): void => {
    haptics.light()
    onChangeText('')
    inputRef.current?.focus()
  }

  const handleCancel = (): void => {
    haptics.light()
    onChangeText('')
    inputRef.current?.blur()
  }

  return (
    <View style={styles.row}>
      <View
        style={[
          styles.container,
          { backgroundColor: colors.surface, borderColor: colors.border },
        ]}
      >
        <Search size={18} color={colors.textTertiary} strokeWidth={2} />
        <TextInput
          ref={inputRef}
          value={value}
          onChangeText={onChangeText}
          onFocus={handleFocus}
          onBlur={handleBlur}
          placeholder={placeholder}
          placeholderTextColor={colors.textTertiary}
          style={[styles.input, { color: colors.text }]}
          returnKeyType="search"
          accessibilityLabel="Champ de recherche"
        />
        {value.length > 0 && (
          <TouchableOpacity
            onPress={handleClear}
            hitSlop={8}
            accessibilityLabel="Effacer la recherche"
          >
            <X size={16} color={colors.textTertiary} strokeWidth={2.5} />
          </TouchableOpacity>
        )}
      </View>
      {showCancel && (
        <Animated.View style={[styles.cancelWrap, cancelStyle]}>
          <TouchableOpacity
            onPress={handleCancel}
            accessibilityLabel="Annuler la recherche"
          >
            <AppText variant="callout" color={colors.primary}>
              Annuler
            </AppText>
          </TouchableOpacity>
        </Animated.View>
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  container: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[2],
    paddingHorizontal: spacing[3],
    height: 44,
    borderRadius: radii.md,
    borderWidth: 1,
  },
  input: {
    flex: 1,
    fontSize: 15,
    lineHeight: 20,
    paddingVertical: 0,
  },
  cancelWrap: {
    alignItems: 'flex-end',
    justifyContent: 'center',
    overflow: 'hidden',
  },
})
