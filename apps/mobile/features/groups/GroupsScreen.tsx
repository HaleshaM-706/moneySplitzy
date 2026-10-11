import React from 'react';
import { FlatList, StyleSheet } from 'react-native';
import GroupCard from '../../shared/components/GroupCard';
import LoadingIndicator from '../../shared/components/LoadingIndicator';
import EmptyState from '../../shared/components/EmptyState';
import { useGetGroupsQuery } from '../../services/api/apiSlice';

export default function GroupsScreen() {
  const { data: groups = [], isLoading, isError } = useGetGroupsQuery();

  if (isLoading) return <LoadingIndicator />;
  if (isError) return <EmptyState message="Could not load your groups. Please try again later." />;
  if (groups.length === 0) return <EmptyState message="You are not in any groups yet." />;

  return (
    <FlatList
      style={styles.container}
      contentContainerStyle={styles.content}
      data={groups}
      keyExtractor={group => group.id}
      renderItem={({ item }) => <GroupCard name={item.name} subtitle={`${item.memberCount} members`} />}
    />
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  content: { padding: 16 },
});
