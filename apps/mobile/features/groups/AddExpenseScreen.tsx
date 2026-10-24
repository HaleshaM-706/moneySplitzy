import React, { useEffect, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Check, CircleDollarSign } from 'lucide-react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import {
  useCreateExpenseMutation,
  useGetCurrentUserQuery,
  useGetGroupDetailsQuery,
} from '../../services/api/apiSlice';
import AppTextInput from '../../shared/components/AppTextInput';
import BackButton from '../../shared/components/BackButton';
import EmptyState from '../../shared/components/EmptyState';
import LoadingIndicator from '../../shared/components/LoadingIndicator';
import PrimaryButton from '../../shared/components/PrimaryButton';
import ScreenHeader from '../../shared/components/ScreenHeader';
import { colors, spacing } from '../../shared/theme';
import type { RootStackParamList } from '../../app/navigation/AppNavigator';

type Props = NativeStackScreenProps<RootStackParamList, 'AddExpense'>;

export default function AddExpenseScreen({ route, navigation }: Props) {
  const { data: group, isLoading: groupLoading, isError: groupError } = useGetGroupDetailsQuery(route.params.groupId);
  const { data: user, isLoading: userLoading, isError: userError } = useGetCurrentUserQuery();
  const [createExpense, { isLoading: saving }] = useCreateExpenseMutation();
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [selectedUserIds, setSelectedUserIds] = useState<string[]>([]);
  const [formError, setFormError] = useState('');

  useEffect(() => {
    if (group) setSelectedUserIds(group.members.map(member => member.user.id));
  }, [group]);

  const toggleMember = (userId: string) => {
    setSelectedUserIds(current => current.includes(userId)
      ? current.filter(id => id !== userId)
      : [...current, userId]);
  };

  const submit = async () => {
    const parsedAmount = amount.trim();
    if (!/^\d+(\.\d{1,2})?$/.test(parsedAmount) || !Number.isFinite(Number(parsedAmount))) {
      setFormError('Enter a valid amount with up to 2 decimal places.');
      return;
    }
    const totalMinor = Math.round(Number(parsedAmount) * 100);
    if (totalMinor < 1) {
      setFormError('The amount must be greater than zero.');
      return;
    }
    if (totalMinor > 2147483647) {
      setFormError('The amount is above the maximum supported value.');
      return;
    }
    if (!user || !group?.members.some(member => member.user.id === user.id)) {
      setFormError('Your account must be a member of this group to add an expense.');
      return;
    }
    if (selectedUserIds.length === 0) {
      setFormError('Select at least one person to split this expense with.');
      return;
    }
    if (totalMinor < selectedUserIds.length) {
      setFormError('The amount is too small to split across all selected members.');
      return;
    }

    const baseShare = Math.floor(totalMinor / selectedUserIds.length);
    const remainder = totalMinor % selectedUserIds.length;
    const splits = selectedUserIds.map((userId, index) => ({
      userId,
      amountMinor: baseShare + (index < remainder ? 1 : 0),
    }));

    setFormError('');
    try {
      await createExpense({
        groupId: route.params.groupId,
        expense: {
          description: description.trim() || undefined,
          totalMinor,
          currency: group.currency,
          splitType: 'EQUAL',
          payments: [{ userId: user.id, amountMinor: totalMinor }],
          splits,
        },
      }).unwrap();
      navigation.goBack();
    } catch {
      setFormError('Could not save the expense. Check that all selected people are group members, then try again.');
    }
  };

  if (groupLoading || userLoading) {
    return <View style={styles.state}><LoadingIndicator /></View>;
  }
  if (groupError || userError || !group || !user) {
    return <View style={styles.state}><EmptyState message="Could not load the group or your account. Please try again later." /></View>;
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
      <BackButton onPress={() => navigation.goBack()} />
      <ScreenHeader title="Add an expense" subtitle={`Split a ${group.currency} expense in ${group.name}.`} icon={CircleDollarSign} />
      <Text style={styles.label}>Description (optional)</Text>
      <AppTextInput
        placeholder="e.g. Dinner"
        value={description}
        onChangeText={setDescription}
        maxLength={500}
      />
      <Text style={styles.label}>Total amount ({group.currency})</Text>
      <AppTextInput
        placeholder="0.00"
        value={amount}
        onChangeText={setAmount}
        keyboardType="decimal-pad"
      />
      <Text style={styles.sectionTitle}>Split equally between</Text>
      <Text style={styles.hint}>You paid the full amount. Choose who shares the cost.</Text>
      <View style={styles.memberList}>
        {group.members.map(member => {
          const selected = selectedUserIds.includes(member.user.id);
          return (
            <Pressable
              key={member.user.id}
              style={({ pressed }) => [styles.memberRow, pressed && styles.pressed]}
              onPress={() => toggleMember(member.user.id)}
              accessibilityRole="checkbox"
              accessibilityState={{ checked: selected }}
            >
              <View style={[styles.checkbox, selected && styles.checkboxSelected]}>
                {selected ? <Check size={15} color="#FFFFFF" strokeWidth={3} /> : null}
              </View>
              <Text style={styles.memberName}>{member.user.name || member.user.email}</Text>
              {member.user.id === user.id ? <Text style={styles.youLabel}>You</Text> : null}
            </Pressable>
          );
        })}
      </View>
      {formError ? <Text style={styles.error}>{formError}</Text> : null}
      {saving ? <LoadingIndicator /> : null}
      <PrimaryButton title={saving ? 'Saving expense...' : 'Save expense'} onPress={submit} disabled={saving} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.screen, paddingBottom: 32 },
  state: { flex: 1, backgroundColor: colors.background, padding: spacing.screen },
  label: { color: colors.text, fontSize: 14, fontWeight: '700', marginBottom: 8, marginTop: 4 },
  sectionTitle: { color: colors.text, fontSize: 17, fontWeight: '800', marginTop: 8 },
  hint: { color: colors.muted, fontSize: 13, marginTop: 4, marginBottom: 10 },
  memberList: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: 16,
  },
  memberRow: { minHeight: 54, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14 },
  pressed: { opacity: 0.7 },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 7,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  checkboxSelected: { backgroundColor: colors.primary, borderColor: colors.primary },
  memberName: { flex: 1, color: colors.text, fontSize: 14, fontWeight: '600' },
  youLabel: { color: colors.primaryDark, fontSize: 12, fontWeight: '700' },
  error: { color: colors.danger, fontSize: 13, marginBottom: 12 },
});
