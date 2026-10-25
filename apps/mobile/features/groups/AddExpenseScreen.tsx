import React, { useEffect, useRef, useState } from 'react';
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
import { calculateExpenseSplits, type ExpenseSplitType } from './expenseSplit';

type Props = NativeStackScreenProps<RootStackParamList, 'AddExpense'>;

const splitOptions: { value: ExpenseSplitType; label: string }[] = [
  { value: 'EQUAL', label: 'Equally' },
  { value: 'EXACT', label: 'Exact' },
  { value: 'PERCENT', label: 'Percent' },
  { value: 'SHARES', label: 'Shares' },
];

export default function AddExpenseScreen({ route, navigation }: Props) {
  const groupId = route.params.groupId;
  const { data: group, isLoading: groupLoading, isError: groupError, refetch: refetchGroup } = useGetGroupDetailsQuery(groupId);
  const { data: user, isLoading: userLoading, isError: userError, refetch: refetchUser } = useGetCurrentUserQuery();
  const [createExpense, { isLoading: saving }] = useCreateExpenseMutation();
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [selectedUserIds, setSelectedUserIds] = useState<string[]>([]);
  const [payerId, setPayerId] = useState('');
  const [category, setCategory] = useState('OTHER');
  const [expenseDate, setExpenseDate] = useState(new Date().toISOString().slice(0, 10));
  const [notes, setNotes] = useState('');
  const [splitType, setSplitType] = useState<ExpenseSplitType>('EQUAL');
  const [splitValues, setSplitValues] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState('');
  const initializedGroupId = useRef<string | null>(null);

  useEffect(() => {
    if (group && user && initializedGroupId.current !== group.id) {
      initializedGroupId.current = group.id;
      setSelectedUserIds(group.members.map(member => member.user.id));
      setPayerId(group.members.some(member => member.user.id === user.id) ? user.id : group.members[0]?.user.id ?? '');
    }
  }, [group, user]);

  const toggleMember = (userId: string) => {
    setSelectedUserIds(current => current.includes(userId)
      ? current.filter(id => id !== userId)
      : [...current, userId]);
  };

  const submit = async () => {
    const title = description.trim();
    if (!title) {
      setFormError('Enter an expense title.');
      return;
    }
    const parsedAmount = amount.trim();
    if (!/^\d+(\.\d{1,2})?$/.test(parsedAmount) || !Number.isFinite(Number(parsedAmount))) {
      setFormError('Enter a valid amount with up to 2 decimal places.');
      return;
    }
    const totalMinor = Math.round(Number(parsedAmount) * 100);
    if (!Number.isSafeInteger(totalMinor) || totalMinor < 1) {
      setFormError('The amount must be greater than zero and within the supported range.');
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
    if (!payerId || !group.members.some(member => member.user.id === payerId)) {
      setFormError('Select a payer from this group.');
      return;
    }
    const parsedDate = new Date(`${expenseDate}T00:00:00.000Z`);
    if (
      !/^\d{4}-\d{2}-\d{2}$/.test(expenseDate)
      || Number.isNaN(parsedDate.getTime())
      || parsedDate.toISOString().slice(0, 10) !== expenseDate
    ) {
      setFormError('Enter a valid expense date in YYYY-MM-DD format.');
      return;
    }

    const splitResult = calculateExpenseSplits(selectedUserIds, splitType, totalMinor, splitValues);
    if ('error' in splitResult) {
      setFormError(splitResult.error);
      return;
    }

    setFormError('');
    try {
      await createExpense({
        groupId,
        expense: {
          description: title,
          category,
          notes: notes.trim() || undefined,
          expenseDate: parsedDate.toISOString(),
          totalMinor,
          currency: group.currency,
          splitType,
          payments: [{ userId: payerId, amountMinor: totalMinor }],
          splits: splitResult.splits,
        },
      }).unwrap();
      navigation.goBack();
    } catch {
      setFormError('Could not save the expense. Check that all selected people are group members, then try again.');
    }
  };

  if (groupLoading || userLoading) return <View style={styles.state}><LoadingIndicator /></View>;
  if (groupError || userError || !group || !user) {
    return (
      <View style={styles.state}>
        <BackButton onPress={() => navigation.goBack()} />
        <EmptyState message="Could not load the group or your account. Check your connection and try again." />
        <Pressable
          onPress={() => { refetchGroup(); refetchUser(); }}
          style={styles.retry}
          accessibilityRole="button"
        >
          <Text style={styles.retryText}>Retry</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
      <BackButton onPress={() => navigation.goBack()} />
      <ScreenHeader title="Add an expense" subtitle={`Add a shared expense to ${group.name}.`} icon={CircleDollarSign} />
      <Text style={styles.label}>Expense title</Text>
      <AppTextInput
        placeholder="e.g. Dinner"
        value={description}
        onChangeText={setDescription}
        maxLength={500}
        returnKeyType="next"
      />
      <Text style={styles.label}>Amount ({group.currency})</Text>
      <AppTextInput
        placeholder="0.00"
        value={amount}
        onChangeText={setAmount}
        keyboardType="decimal-pad"
      />
      <Text style={styles.label}>Category</Text>
      <View style={styles.optionRow}>
        {['FOOD', 'TRAVEL', 'HOME', 'SHOPPING', 'OTHER'].map(value => (
          <Pressable
            key={value}
            accessibilityRole="button"
            accessibilityState={{ selected: category === value }}
            onPress={() => setCategory(value)}
            style={[styles.option, category === value && styles.optionSelected]}
          >
            <Text style={[styles.optionText, category === value && styles.optionTextSelected]}>{value[0] + value.slice(1).toLowerCase()}</Text>
          </Pressable>
        ))}
      </View>

      <Text style={styles.label}>Paid by</Text>
      <View style={styles.memberList}>
        {group.members.map(member => {
          const selected = payerId === member.user.id;
          return (
            <Pressable
              key={member.user.id}
              style={styles.memberRow}
              onPress={() => setPayerId(member.user.id)}
              accessibilityRole="radio"
              accessibilityState={{ selected }}
            >
              <View style={[styles.radio, selected && styles.radioSelected]} />
              <Text style={styles.memberName}>{member.user.name || member.user.email}</Text>
              {member.user.id === user.id ? <Text style={styles.youLabel}>You</Text> : null}
            </Pressable>
          );
        })}
      </View>
      <Text style={styles.label}>Expense date (YYYY-MM-DD)</Text>
      <AppTextInput
        value={expenseDate}
        onChangeText={setExpenseDate}
        placeholder="2026-10-25"
        maxLength={10}
      />
      <Text style={styles.label}>Split participants</Text>
      <Text style={styles.hint}>Choose members from this group to share the expense.</Text>
      <View style={styles.memberList}>
        {group.members.map(member => {
          const selected = selectedUserIds.includes(member.user.id);
          return (
            <Pressable
              key={member.user.id}
              style={styles.memberRow}
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

      <Text style={styles.label}>Split method</Text>
      <View style={styles.optionRow}>
        {splitOptions.map(option => (
          <Pressable
            key={option.value}
            accessibilityRole="button"
            accessibilityState={{ selected: splitType === option.value }}
            onPress={() => setSplitType(option.value)}
            style={[styles.option, splitType === option.value && styles.optionSelected]}
          >
            <Text style={[styles.optionText, splitType === option.value && styles.optionTextSelected]}>{option.label}</Text>
          </Pressable>
        ))}
      </View>
      {splitType !== 'EQUAL' ? (
        <View style={styles.splitList}>
          {selectedUserIds.map(userId => {
            const member = group.members.find(groupMember => groupMember.user.id === userId);
            return (
              <View key={userId} style={styles.splitValueRow}>
                <Text style={styles.memberName}>{member?.user.name || member?.user.email}</Text>
                <AppTextInput
                  value={splitValues[userId] ?? ''}
                  onChangeText={value => setSplitValues(current => ({ ...current, [userId]: value }))}
                  placeholder={splitType === 'EXACT' ? '0.00' : splitType === 'PERCENT' ? '%' : 'Shares'}
                  keyboardType="decimal-pad"
                  accessibilityLabel={`${splitType.toLowerCase()} for ${member?.user.name || member?.user.email}`}
                  style={styles.splitInput}
                />
              </View>
            );
          })}
        </View>
      ) : null}
      <Text style={styles.label}>Notes (optional)</Text>
      <AppTextInput
        value={notes}
        onChangeText={setNotes}
        placeholder="Add a note"
        maxLength={1000}
        multiline
        style={styles.notesInput}
      />
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
  hint: { color: colors.muted, fontSize: 13, marginTop: -3, marginBottom: 10 },
  optionRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 7, marginBottom: 12 },
  option: { paddingHorizontal: 11, paddingVertical: 8, borderRadius: 12, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface },
  optionSelected: { borderColor: colors.primaryDark, backgroundColor: colors.primaryLight },
  optionText: { color: colors.text, fontSize: 12, fontWeight: '700' },
  optionTextSelected: { color: colors.primaryDark },
  memberList: { marginBottom: 12, borderRadius: 16, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface },
  memberRow: { minHeight: 52, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14 },
  radio: { width: 20, height: 20, borderRadius: 10, borderWidth: 1, borderColor: colors.border, marginRight: 12 },
  radioSelected: { borderWidth: 6, borderColor: colors.primary },
  checkbox: { width: 22, height: 22, borderRadius: 7, borderWidth: 1, borderColor: colors.border, alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  checkboxSelected: { backgroundColor: colors.primary, borderColor: colors.primary },
  memberName: { flex: 1, color: colors.text, fontSize: 14, fontWeight: '600' },
  youLabel: { color: colors.primaryDark, fontSize: 12, fontWeight: '700' },
  splitList: { marginBottom: 12, borderRadius: 14, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface },
  splitValueRow: { minHeight: 64, flexDirection: 'row', alignItems: 'center', paddingLeft: 13, borderBottomWidth: 1, borderBottomColor: colors.border },
  splitInput: { width: 125, minHeight: 42, marginBottom: 0 },
  notesInput: { minHeight: 78, textAlignVertical: 'top' },
  error: { color: colors.danger, fontSize: 13, marginBottom: 12 },
  retry: { alignSelf: 'center', paddingVertical: 12, paddingHorizontal: 20 },
  retryText: { color: colors.primaryDark, fontSize: 14, fontWeight: '700' },
});
