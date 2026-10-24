import React from 'react';
import { ScrollView, StyleSheet, Text, View, Pressable } from 'react-native';
import { MailPlus, Plus, Users } from 'lucide-react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useGetGroupDetailsQuery } from '../../services/api/apiSlice';
import BackButton from '../../shared/components/BackButton';
import EmptyState from '../../shared/components/EmptyState';
import GroupCard from '../../shared/components/GroupCard';
import LoadingIndicator from '../../shared/components/LoadingIndicator';
import ScreenHeader from '../../shared/components/ScreenHeader';
import { colors, spacing } from '../../shared/theme';
import type { RootStackParamList } from '../../app/navigation/AppNavigator';

type Props = NativeStackScreenProps<RootStackParamList, 'GroupDetails'>;

export default function GroupDetailsScreen({ route, navigation }: Props) {
  const { data: group, isLoading, isError } = useGetGroupDetailsQuery(route.params.groupId);

  if (isLoading) {
    return <View style={styles.state}><LoadingIndicator /></View>;
  }
  if (isError || !group) {
    return <View style={styles.state}><EmptyState message="Could not load this group. Please try again later." /></View>;
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <BackButton onPress={() => navigation.goBack()} />
      <ScreenHeader title={group.name} subtitle={group.description || `${group.memberCount} members · ${group.currency}`} icon={Users} />
      <Pressable
        style={({ pressed }) => [styles.addButton, pressed && styles.pressed]}
        accessibilityRole="button"
        onPress={() => navigation.navigate('AddExpense', { groupId: group.id })}
      >
        <Plus size={18} color="#FFFFFF" strokeWidth={2.5} />
        <Text style={styles.addButtonText}>Add an expense</Text>
      </Pressable>
      <Pressable
        style={({ pressed }) => [styles.inviteButton, pressed && styles.pressed]}
        accessibilityRole="button"
        onPress={() => navigation.navigate('InviteMember', { groupId: group.id })}
      >
        <MailPlus size={18} color={colors.primaryDark} strokeWidth={2.2} />
        <Text style={styles.inviteButtonText}>Invite a member</Text>
      </Pressable>
      <Text style={styles.sectionTitle}>Members</Text>
      {group.members.map(member => (
        <GroupCard
          key={member.id}
          name={member.user.name || member.user.email}
          subtitle={member.role === 'ADMIN' ? 'Admin' : 'Member'}
        />
      ))}
      <Text style={styles.currencyNote}>Expenses in this group use {group.currency}.</Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.screen, paddingBottom: 30 },
  state: { flex: 1, backgroundColor: colors.background, padding: spacing.screen },
  addButton: {
    minHeight: 52,
    marginBottom: 24,
    borderRadius: 15,
    backgroundColor: colors.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  addButtonText: { color: '#FFFFFF', fontSize: 15, fontWeight: '700' },
  inviteButton: {
    minHeight: 48,
    marginTop: -12,
    marginBottom: 24,
    borderRadius: 15,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  inviteButtonText: { color: colors.primaryDark, fontSize: 14, fontWeight: '700' },
  pressed: { opacity: 0.75 },
  sectionTitle: { color: colors.text, fontSize: 18, fontWeight: '800', marginBottom: 12 },
  currencyNote: { color: colors.muted, fontSize: 13, marginTop: 5 },
});
