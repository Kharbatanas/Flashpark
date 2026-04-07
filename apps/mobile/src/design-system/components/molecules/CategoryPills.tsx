import React from 'react'
import { ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native'
import { LucideIcon } from 'lucide-react-native'
import { useTheme } from '../../theme/useTheme'
import { haptics } from '../../tokens/haptics'
import { radii } from '../../tokens/radii'
import { spacing } from '../../tokens/spacing'
import { AppText } from '../atoms/AppText'

interface Category {
  key: string
  label: string
  icon: LucideIcon
}

interface CategoryPillsProps {
  categories: Category[]
  selected: string
  onSelect: (key: string) => void
}

export function CategoryPills({
  categories,
  selected,
  onSelect,
}: CategoryPillsProps): React.JSX.Element {
  const { colors } = useTheme()

  const handlePress = (key: string): void => {
    haptics.selection()
    onSelect(key)
  }

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.content}
    >
      {categories.map(({ key, label, icon: Icon }) => {
        const isSelected = selected === key
        return (
          <TouchableOpacity
            key={key}
            onPress={() => handlePress(key)}
            style={[
              styles.pill,
              {
                backgroundColor: isSelected ? colors.primary : colors.surface,
                borderColor: isSelected ? colors.primary : colors.border,
              },
            ]}
            accessibilityLabel={label}
            accessibilityRole="tab"
            accessibilityState={{ selected: isSelected }}
          >
            <Icon
              size={15}
              color={isSelected ? colors.textInverse : colors.textSecondary}
              strokeWidth={2}
            />
            <AppText
              variant="callout"
              color={isSelected ? colors.textInverse : colors.textSecondary}
              style={styles.label}
            >
              {label}
            </AppText>
          </TouchableOpacity>
        )
      })}
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  content: {
    paddingHorizontal: spacing[4],
    gap: spacing[2],
    flexDirection: 'row',
  },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing[3],
    paddingVertical: spacing[1] + 2,
    borderRadius: radii.full,
    borderWidth: 1.5,
  },
  label: {
    marginLeft: spacing[1],
  },
})
