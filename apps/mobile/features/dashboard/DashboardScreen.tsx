import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import BalanceCard from '../../shared/components/BalanceCard';
import GroupCard from '../../shared/components/GroupCard';
import ExpenseCard from '../../shared/components/ExpenseCard';

export default function DashboardScreen() {
  return (
    <ScrollView style={styles.container} contentContainerStyle={{ padding: 16 }}>
      <BalanceCard title="You owe" amount={-1200} />
      <BalanceCard title="You are owed" amount={3500} />
      <Text style={styles.section}>Recent Expenses</Text>
      <ExpenseCard title="Lunch" amount={500} />
      <Text style={styles.section}>Groups</Text>
      <GroupCard name="Weekend Trip" subtitle="3 members" />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  section: { marginTop: 16, marginBottom: 8, fontWeight: '700', fontSize: 16 },
});
