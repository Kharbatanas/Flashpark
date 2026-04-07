import React, { useState } from 'react'
import { StyleSheet, TextInput, View } from 'react-native'
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated'
import * as Haptics from 'expo-haptics'
import { Send } from 'lucide-react-native'
import { IconButton } from '../atoms/IconButton'
import { useTheme } from '../../theme/useTheme'
import { spacing, radii, typography } from '../../tokens'

interface ChatInputProps {
  onSend: (message: string) => void
  placeholder?: string
  disabled?: boolean
}

const AnimatedIconButton = Animated.createAnimatedComponent(IconButton)

export function ChatInput({ onSend, placeholder = 'Votre message…', disabled = false }: ChatInputProps) {
  const { colors } = useTheme()
  const [text, setText] = useState('')
  const sendScale = useSharedValue(1)
  const sendRotate = useSharedValue(0)

  const isEmpty = text.trim().length === 0

  const sendAnimStyle = useAnimatedStyle(() => ({
    transform: [
      { scale: sendScale.value },
      { rotate: `${sendRotate.value}deg` },
    ],
  }))

  const handleSend = () => {
    if (isEmpty || disabled) return
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)

    sendScale.value = withSpring(1.3, { damping: 8, stiffness: 400 }, () => {
      sendScale.value = withSpring(1)
    })
    sendRotate.value = withSpring(15, { damping: 8 }, () => {
      sendRotate.value = withSpring(0)
    })

    onSend(text.trim())
    setText('')
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background, borderTopColor: colors.border }]}>
      <TextInput
        style={[
          styles.input,
          {
            backgroundColor: colors.surface,
            borderColor: colors.border,
            color: colors.text,
            ...typography.body,
          },
        ]}
        value={text}
        onChangeText={setText}
        placeholder={placeholder}
        placeholderTextColor={colors.textSecondary}
        multiline
        maxLength={2000}
        editable={!disabled}
        returnKeyType="default"
        accessibilityLabel="Zone de saisie du message"
      />
      <Animated.View style={[styles.sendWrap, sendAnimStyle]}>
        <IconButton
          icon={<Send size={20} color={isEmpty || disabled ? colors.textSecondary : colors.primary} strokeWidth={2} />}
          onPress={handleSend}
          disabled={isEmpty || disabled}
          variant={isEmpty || disabled ? 'ghost' : 'filled'}
        />
      </Animated.View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[2],
    gap: spacing[2],
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  input: {
    flex: 1,
    borderRadius: radii.lg,
    borderWidth: 1,
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[2],
    maxHeight: 120,
    minHeight: 44,
  },
  sendWrap: {
    marginBottom: 2,
  },
  sendBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
})
