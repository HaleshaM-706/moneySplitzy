import React, { useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Bell, Check, CircleDollarSign, Receipt } from 'lucide-react-native';
import type { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useNavigation } from '@react-navigation/native';
import {
  useGetNotificationsQuery,
  useMarkNotificationReadMutation,
} from '../../services/api/apiSlice';
import type { MainTabParamList, RootStackParamList } from '../../app/navigation/AppNavigator';
import EmptyState from '../../shared/components/EmptyState';
import LoadingIndicator from '../../shared/components/LoadingIndicator';
import ScreenHeader from '../../shared/components/ScreenHeader';
import { colors, spacing } from '../../shared/theme';

type TabNavigation = BottomTabNavigationProp<MainTabParamList, 'Notifications'>;

export default function NotificationsScreen() {
  const navigation = useNavigation<TabNavigation>();
  const rootNavigation = navigation.getParent<NativeStackNavigationProp<RootStackParamList>>();
  const {
    data: notifications = [],
    isLoading,
    isError,
    refetch,
    isFetching,
  } = useGetNotificationsQuery({ page: 1, pageSize: 100 });
  const [markRead] = useMarkNotificationReadMutation();
  const [markingId, setMarkingId] = useState<string | null>(null);
  const [actionError, setActionError] = useState('');

  const openNotification = async (id: string, data?: Record<string, unknown> | null) => {
    setMarkingId(id);
    setActionError('');
    try {
      await markRead(id).unwrap();
      const groupId = data?.groupId;
      if (typeof groupId === 'string') {
        rootNavigation?.navigate('GroupDetails', { groupId });
      }
    } catch {
      setActionError('Could not mark this notification as read. Please try again.');
    } finally {
      setMarkingId(null);
    }
  };

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      refreshControl={(
        <RefreshControl
          refreshing={isFetching && !isLoading}
          onRefresh={async () => {
            await refetch();
          }}
          tintColor={colors.primary}
        />
      )}
    >
      <ScreenHeader title="Notifications" subtitle="Updates from your groups and shared expenses." icon={Bell} />
      {isLoading ? <LoadingIndicator /> : isError ? (
        <EmptyState message="Could not load notifications. Pull down to try again." />
      ) : notifications.length === 0 ? (
        <EmptyState message="You're all caught up. New group updates will show here." />
      ) : notifications.map(notification => {
        const isExpense = notification.data?.type === 'expense';
        const isMarking = markingId === notification.id;
        return (
          <Pressable
            key={notification.id}
            accessibilityRole="button"
            disabled={isMarking}
            onPress={() => openNotification(notification.id, notification.data)}
            style={[styles.card, !notification.read && styles.unreadCard]}
          >
            <View style={styles.icon}>
              {isExpense
                ? <Receipt size={19} color={colors.primaryDark} />
                : <CircleDollarSign size={19} color={colors.primaryDark} />}
            </View>
            <View style={styles.copy}>
              <Text style={styles.title}>{notification.title}</Text>
              {notification.body ? <Text style={styles.body}>{notification.body}</Text> : null}
              <Text style={styles.date}>{new Date(notification.createdAt).toLocaleString()}</Text>
            </View>
            {isMarking ? (
              <ActivityIndicator size="small" color={colors.primary} />
            ) : !notification.read ? (
              <View style={styles.unreadDot} />
            ) : (
              <Check size={17} color={colors.muted} />
            )}
          </Pressable>
        );
      })}
      {actionError ? <Text style={styles.error}>{actionError}</Text> : null}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.screen, paddingBottom: 32, flexGrow: 1 },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    marginBottom: 10,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  unreadCard: { borderColor: colors.primary, backgroundColor: colors.primaryLight },
  icon: {
    width: 42,
    height: 42,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primaryLight,
    marginRight: 12,
  },
  copy: { flex: 1 },
  title: { color: colors.text, fontSize: 14, fontWeight: '800' },
  body: { color: colors.muted, fontSize: 13, lineHeight: 18, marginTop: 4 },
  date: { color: colors.muted, fontSize: 11, marginTop: 7 },
  error: { color: colors.danger, fontSize: 13, marginTop: 8 },
  unreadDot: { width: 9, height: 9, borderRadius: 5, backgroundColor: colors.primary, marginLeft: 10 },
});
