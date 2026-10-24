import React from 'react';
import { Text, StyleSheet, ScrollView, View } from 'react-native';
import { Home, Users } from 'lucide-react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import BalanceCard from '../../shared/components/BalanceCard';
import GroupCard from '../../shared/components/GroupCard';
import ScreenHeader from '../../shared/components/ScreenHeader';
import LoadingIndicator from '../../shared/components/LoadingIndicator';
import EmptyState from '../../shared/components/EmptyState';
import { useGetDashboardSummaryQuery, useGetGroupsQuery } from '../../services/api/apiSlice';
import { colors, spacing } from '../../shared/theme';
import type { RootStackParamList } from '../../app/navigation/AppNavigator';

export default function DashboardScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { data: summary, isLoading: summaryLoading, isError: summaryError } = useGetDashboardSummaryQuery({});
  const { data: groups, isLoading: groupsLoading, isError: groupsError } = useGetGroupsQuery();

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
      <ScreenHeader title="Your money, together" subtitle="A clearer view of shared expenses." icon={Home} />
      <View style={styles.balanceHeading}>
        <View>
          <Text style={styles.section}>Balances</Text>
          <Text style={styles.caption}>Across all your groups</Text>
        </View>
        <View style={styles.sectionIcon}>
          <Home size={17} color={colors.primaryDark} strokeWidth={2} />
        </View>
      </View>
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
      <View style={styles.groupHeading}>
        <View>
          <Text style={styles.section}>Your groups</Text>
          <Text style={styles.caption}>Shared plans and expenses</Text>
        </View>
        <View style={styles.countPill}>
          <Users size={14} color={colors.primaryDark} strokeWidth={2} />
          <Text style={styles.countText}>{summary?.groupsCount ?? groups?.length ?? 0}</Text>
        </View>
      </View>
      {groupsLoading ? <LoadingIndicator /> : null}
      {groupsError ? <EmptyState message="Could not load your groups." /> : null}
      {!groupsLoading && !groupsError && groups?.length === 0 ? <EmptyState message="You are not in any groups yet." /> : null}
      {groups?.map(group => (
        <GroupCard
          key={group.id}
          name={group.name}
          subtitle={`${group.memberCount} members`}
          onPress={() => navigation.navigate('GroupDetails', { groupId: group.id })}
        />
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.screen, paddingBottom: 30 },
  balanceHeading: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 },
  groupHeading: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 17, marginBottom: 12 },
  section: { color: colors.text, fontWeight: '800', fontSize: 18 },
  caption: { color: colors.muted, fontSize: 12, marginTop: 4 },
  sectionIcon: {
    width: 34,
    height: 34,
    borderRadius: 12,
    backgroundColor: colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  countPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primaryLight,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
  },
  countText: { color: colors.primaryDark, fontSize: 13, fontWeight: '700', marginLeft: 5 },
});
