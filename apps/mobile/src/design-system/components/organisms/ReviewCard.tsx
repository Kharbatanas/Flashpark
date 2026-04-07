import React from 'react'
import { StyleSheet, View } from 'react-native'
import { AppText } from '../atoms/AppText'
import { Avatar } from '../atoms/Avatar'
import { StarRating } from '../molecules/StarRating'
import { MultiDimensionRating } from '../molecules/MultiDimensionRating'
import { useTheme } from '../../theme/useTheme'
import { spacing, radii } from '../../tokens'

interface ReviewDimensions {
  ratingAccess?: number | null
  ratingAccuracy?: number | null
  ratingCleanliness?: number | null
}

interface ReviewCardReviewer {
  fullName?: string | null
  avatarUrl?: string | null
}

interface ReviewCardProps {
  reviewer?: ReviewCardReviewer | null
  createdAt: string | Date
  overallRating?: number | null
  dimensions?: ReviewDimensions | null
  comment?: string | null
}

function formatDate(d: string | Date): string {
  return new Date(d).toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })
}

function computeOverall(dims: ReviewDimensions): number {
  const values = [dims.ratingAccess, dims.ratingAccuracy, dims.ratingCleanliness].filter(
    (v): v is number => v != null,
  )
  if (values.length === 0) return 0
  return values.reduce((a, b) => a + b, 0) / values.length
}

export function ReviewCard({ reviewer, createdAt, overallRating, dimensions, comment }: ReviewCardProps) {
  const { colors } = useTheme()

  const displayRating =
    overallRating ??
    (dimensions ? computeOverall(dimensions) : null)

  const reviewerName = reviewer?.fullName ?? 'Utilisateur'
  const hasDimensions =
    dimensions != null &&
    (dimensions.ratingAccess != null ||
      dimensions.ratingAccuracy != null ||
      dimensions.ratingCleanliness != null)

  const dimensionRatings = hasDimensions
    ? {
        access: dimensions?.ratingAccess ?? 0,
        accuracy: dimensions?.ratingAccuracy ?? 0,
        cleanliness: dimensions?.ratingCleanliness ?? 0,
      }
    : null

  return (
    <View style={[styles.container, { backgroundColor: colors.surface, borderColor: colors.border }]}>
      <View style={styles.header}>
        <Avatar uri={reviewer?.avatarUrl} initials={reviewerName} size="md" />
        <View style={styles.headerInfo}>
          <AppText variant="label" style={{ color: colors.text }}>{reviewerName}</AppText>
          <AppText variant="caption" style={{ color: colors.textSecondary }}>
            {formatDate(createdAt)}
          </AppText>
        </View>
        {displayRating != null && (
          <StarRating rating={displayRating} size={14} />
        )}
      </View>

      {hasDimensions && dimensionRatings && (
        <MultiDimensionRating ratings={dimensionRatings} />
      )}

      {comment && (
        <AppText variant="body" style={[styles.comment, { color: colors.text }]}>
          {comment}
        </AppText>
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    borderRadius: radii.lg,
    borderWidth: 1,
    padding: spacing[4],
    gap: spacing[2],
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[2],
  },
  headerInfo: {
    flex: 1,
    gap: 2,
  },
  comment: {
    lineHeight: 22,
  },
})
