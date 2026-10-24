import React from 'react';
import { FlatList, StyleSheet, View } from 'react-native';
import { Activity as ActivityIcon } from 'lucide-react-native';
import ExpenseCard from '../../shared/components/ExpenseCard';
import EmptyState from '../../shared/components/EmptyState';
import LoadingIndicator from '../../shared/components/LoadingIndicator';
import ScreenHeader from '../../shared/components/ScreenHeader';
import { useGetActivityQuery } from '../../services/api/apiSlice';
import { colors, spacing } from '../../shared/theme';

export default function ActivityScreen() {
  const { data: activities = [], isLoading, isError } = useGetActivityQuery();

  if (isLoading) {
    return <View style={styles.state}><LoadingIndicator /></View>;
  }
  if (isError) {
    return <View style={styles.state}><EmptyState message="Could not load recent activity. Please try again later." /></View>;
  }

  return (
    <FlatList
      style={styles.container}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
      data={activities}
      keyExtractor={activity => activity.id}
      ListHeaderComponent={
        <ScreenHeader title="Recent activity" subtitle="The latest updates from your groups." icon={ActivityIcon} />
      }
      ListEmptyComponent={<EmptyState message="No recent activity yet." />}
      renderItem={({ item }) => (
        <ExpenseCard
          title={item.title}
          subtitle={item.groupName}
          amount={item.amount}
          currency={item.currency}
        />
      )}
    />
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.screen, paddingBottom: 28 },
  state: { flex: 1, backgroundColor: colors.background, padding: spacing.screen },
});
