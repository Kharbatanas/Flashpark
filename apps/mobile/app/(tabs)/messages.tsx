import React from 'react'
import { FlatList, StyleSheet, View } from 'react-native'
import { router } from 'expo-router'
import { MessageCircle } from 'lucide-react-native'
import { ScreenContainer } from '../../src/design-system/components/layout'
import { EmptyState } from '../../src/design-system/components/molecules'
import { ConversationRow } from '../../src/design-system/components/organisms'
import { AppText } from '../../src/design-system/components/atoms'
import { useTheme } from '../../src/design-system/theme/useTheme'
import { useConversations } from '../../src/api/hooks/useMessages'
import { useRealtimeMessages } from '../../src/api/subscriptions/useRealtimeMessages'
import { spacing } from '../../src/design-system/tokens/spacing'

export default function MessagesScreen(): React.JSX.Element {
  const { colors } = useTheme()
  const {
    data: conversations = [],
    isLoading,
    refetch,
    isRefetching,
  } = useConversations()

  useRealtimeMessages()

  return (
    <ScreenContainer>
      <View style={[styles.header, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
        <AppText variant="title1" color={colors.text}>
          Messages
        </AppText>
      </View>

      {isLoading ? (
        <View style={styles.loadingWrap}>
          {[0, 1, 2, 3].map((i) => (
            <View key={i} style={[styles.skeletonRow, { borderBottomColor: colors.border }]}>
              <View style={[styles.skeletonAvatar, { backgroundColor: colors.borderLight }]} />
              <View style={styles.skeletonLines}>
                <View style={[styles.skeletonLine, { width: '50%', backgroundColor: colors.borderLight }]} />
                <View style={[styles.skeletonLine, { width: '75%', backgroundColor: colors.borderLight }]} />
              </View>
            </View>
          ))}
        </View>
      ) : (
        <FlatList
          data={conversations}
          keyExtractor={(item) => item.booking_id}
          refreshing={isRefetching}
          onRefresh={refetch}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={conversations.length === 0 ? styles.listEmpty : undefined}
          ListEmptyComponent={
            <EmptyState
              icon={MessageCircle}
              title="Aucun message"
              subtitle="Vos conversations avec les hôtes et conducteurs apparaîtront ici"
            />
          }
          renderItem={({ item }) => (
            <ConversationRow
              contactName={item.other_user_id}
              latestMessage={item.latest_message?.content ?? null}
              timestamp={item.latest_message?.created_at ?? null}
              unreadCount={item.unread_count}
              onPress={() => router.push(`/booking/${item.booking_id}/chat`)}
            />
          )}
        />
      )}
    </ScreenContainer>
  )
}

const styles = StyleSheet.create({
  header: {
    paddingHorizontal: spacing[5],
    paddingTop: spacing[3],
    paddingBottom: spacing[4],
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  loadingWrap: {
    paddingTop: spacing[2],
  },
  skeletonRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[4],
    gap: spacing[3],
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  skeletonAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
  },
  skeletonLines: {
    flex: 1,
    gap: spacing[2],
  },
  skeletonLine: {
    height: 12,
    borderRadius: 6,
  },
  listEmpty: {
    flex: 1,
    justifyContent: 'center',
  },
})
