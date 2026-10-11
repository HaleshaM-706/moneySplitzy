import React from 'react';
import { FlatList, StyleSheet, Text, View } from 'react-native';
import ExpenseCard from '../../shared/components/ExpenseCard';
import EmptyState from '../../shared/components/EmptyState';
import LoadingIndicator from '../../shared/components/LoadingIndicator';
import { useGetActivityQuery } from '../../services/api/apiSlice';

export default function ActivityScreen() {
  const { data: activities = [], isLoading, isError } = useGetActivityQuery();

  if (isLoading) return <LoadingIndicator />;
  if (isError) return <EmptyState message="Could not load recent activity. Please try again later." />;
  if (activities.length === 0) return <EmptyState message="No recent activity" />;

  return (
    <FlatList
      style={styles.container}
      contentContainerStyle={styles.content}
      data={activities}
      keyExtractor={activity => activity.id}
      ListHeaderComponent={<Text style={styles.title}>Activity</Text>}
      renderItem={({ item }) => (
        <View>
          <Text style={styles.groupName}>{item.groupName}</Text>
          <ExpenseCard title={item.title} amount={item.amount} currency={item.currency} />
        </View>
      )}
    />
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff', padding: 16 },
  content: { paddingBottom: 16 },
  title: { fontSize: 20, fontWeight: '700' },
  groupName: { color: '#667085', marginBottom: 6 },
});
