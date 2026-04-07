import React, { useCallback, useEffect, useRef } from 'react'
import { StyleSheet, View } from 'react-native'
import BottomSheet, {
  BottomSheetBackdrop,
  BottomSheetBackdropProps,
  BottomSheetView,
} from '@gorhom/bottom-sheet'
import { useTheme } from '../../theme/useTheme'
import { radii } from '../../tokens/radii'
import { spacing } from '../../tokens/spacing'
import { AppText } from '../atoms/AppText'

interface BottomSheetModalProps {
  isOpen: boolean
  onClose: () => void
  snapPoints?: (string | number)[]
  title?: string
  children: React.ReactNode
}

const DEFAULT_SNAP_POINTS = ['50%', '90%']

export function BottomSheetModal({
  isOpen,
  onClose,
  snapPoints = DEFAULT_SNAP_POINTS,
  title,
  children,
}: BottomSheetModalProps): React.JSX.Element {
  const { colors } = useTheme()
  const sheetRef = useRef<BottomSheet>(null)

  useEffect(() => {
    if (isOpen) {
      sheetRef.current?.snapToIndex(0)
    } else {
      sheetRef.current?.close()
    }
  }, [isOpen])

  const renderBackdrop = useCallback(
    (props: BottomSheetBackdropProps) => (
      <BottomSheetBackdrop
        {...props}
        appearsOnIndex={0}
        disappearsOnIndex={-1}
        pressBehavior="close"
      />
    ),
    []
  )

  return (
    <BottomSheet
      ref={sheetRef}
      index={-1}
      snapPoints={snapPoints}
      enablePanDownToClose
      onClose={onClose}
      backdropComponent={renderBackdrop}
      handleIndicatorStyle={[styles.handle, { backgroundColor: colors.border }]}
      backgroundStyle={[styles.background, { backgroundColor: colors.surface }]}
    >
      <BottomSheetView style={styles.content}>
        {title != null && (
          <View style={styles.header}>
            <AppText variant="title3" color={colors.text}>
              {title}
            </AppText>
          </View>
        )}
        {children}
      </BottomSheetView>
    </BottomSheet>
  )
}

const styles = StyleSheet.create({
  background: {
    borderTopLeftRadius: radii.xl,
    borderTopRightRadius: radii.xl,
  },
  handle: {
    width: 36,
    height: 4,
    borderRadius: radii.full,
  },
  content: {
    flex: 1,
  },
  header: {
    paddingHorizontal: spacing[4],
    paddingBottom: spacing[4],
    alignItems: 'center',
  },
})
