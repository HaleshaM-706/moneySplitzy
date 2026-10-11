import React from 'react';
import { Text, StyleSheet, ScrollView } from 'react-native';
import BalanceCard from '../../shared/components/BalanceCard';
import GroupCard from '../../shared/components/GroupCard';
import LoadingIndicator from '../../shared/components/LoadingIndicator';
import EmptyState from '../../shared/components/EmptyState';
import { useGetDashboardSummaryQuery, useGetGroupsQuery } from '../../services/api/apiSlice';

export default function DashboardScreen() {
  const { data: summary, isLoading: summaryLoading, isError: summaryError } = useGetDashboardSummaryQuery({});
  const { data: groups, isLoading: groupsLoading, isError: groupsError } = useGetGroupsQuery();

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ padding: 16 }}>
      {summaryLoading ? <LoadingIndicator /> : null}
      {summaryError ? <EmptyState message="Could not load your balance summary." /> : null}
      {summary?.balances.map(balance => (
        <BalanceCard
          key={balance.currency}
          title={balance.totalBalance < 0 ? 'You owe' : 'You are owed'}
          amount={balance.totalBalance}
          currency={balance.currency}
        />
      ))}
      {summary && summary.balances.length === 0 ? <EmptyState message="No balances yet." /> : null}
      <Text style={styles.section}>Groups</Text>
      {groupsLoading ? <LoadingIndicator /> : null}
      {groupsError ? <EmptyState message="Could not load your groups." /> : null}
      {!groupsLoading && !groupsError && groups?.length === 0 ? <EmptyState message="You are not in any groups yet." /> : null}
      {groups?.map(group => (
        <GroupCard key={group.id} name={group.name} subtitle={`${group.memberCount} members`} />
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  section: { marginTop: 16, marginBottom: 8, fontWeight: '700', fontSize: 16 },
});
