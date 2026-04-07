import React from 'react'
import { StyleSheet, View } from 'react-native'
import { useTheme } from '../../theme/useTheme'
import { radii } from '../../tokens/radii'
import { spacing } from '../../tokens/spacing'
import { shadows } from '../../tokens/shadows'
import { AppText } from '../atoms/AppText'
import { Divider } from '../atoms/Divider'
import { ListItem } from './ListItem'

interface MenuItem {
  icon?: React.ReactNode
  label: string
  value?: string
  onPress?: () => void
  showChevron?: boolean
  destructive?: boolean
}

interface MenuCardProps {
  items: MenuItem[]
  title?: string
}

export function MenuCard({ items, title }: MenuCardProps): React.JSX.Element {
  const { colors } = useTheme()

  return (
    <View style={styles.wrapper}>
      {title != null && (
        <AppText
          variant="overline"
          color={colors.textTertiary}
          style={styles.title}
        >
          {title}
        </AppText>
      )}
      <View
        style={[
          styles.card,
          { backgroundColor: colors.surface, borderColor: colors.border },
        ]}
      >
        {items.map((item, index) => (
          <React.Fragment key={`${item.label}-${index}`}>
            <ListItem {...item} />
            {index < items.length - 1 && (
              <Divider marginVertical={0} />
            )}
          </React.Fragment>
        ))}
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  wrapper: {
    gap: spacing[2],
  },
  title: {
    paddingHorizontal: spacing[4],
  },
  card: {
    borderRadius: radii.lg,
    borderWidth: 1,
    overflow: 'hidden',
    ...shadows.sm,
  },
})
