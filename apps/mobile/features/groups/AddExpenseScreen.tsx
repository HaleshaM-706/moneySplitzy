import React, { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Check, CircleDollarSign } from 'lucide-react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import {
  useCreateExpenseMutation,
  useGetExpenseQuery,
  useGetCurrentUserQuery,
  useGetGroupDetailsQuery,
  useUpdateExpenseMutation,
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

function getMutationErrorMessage(error: unknown, fallback: string): string {
  if (typeof error !== 'object' || error === null || !('data' in error)) return fallback;
  const { data, status } = error as { data?: unknown; status?: unknown };
  if (typeof data === 'object' && data !== null && 'message' in data) {
    const message = (data as { message?: unknown }).message;
    if (typeof message === 'string') return message;
    if (Array.isArray(message)) return message.filter((part): part is string => typeof part === 'string').join('\n') || fallback;
  }
  if (typeof data === 'string' && data.length > 0) return data;
  if (typeof status === 'number') return `Request failed (HTTP ${status}). ${fallback}`;
  return fallback;
}

export default function AddExpenseScreen({ route, navigation }: Props) {
  const groupId = route.params.groupId;
  const expenseId = route.params.expenseId;
  const { data: group, isLoading: groupLoading, isError: groupError, refetch: refetchGroup } = useGetGroupDetailsQuery(groupId);
  const { data: user, isLoading: userLoading, isError: userError, refetch: refetchUser } = useGetCurrentUserQuery();
  const {
    data: expense,
    isLoading: expenseLoading,
    isError: expenseError,
    refetch: refetchExpense,
  } = useGetExpenseQuery({ groupId, expenseId: expenseId ?? '' }, { skip: !expenseId });
  const [createExpense, { isLoading: saving }] = useCreateExpenseMutation();
  const [updateExpense, { isLoading: updating }] = useUpdateExpenseMutation();
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
  const initializedFormKey = useRef<string | null>(null);

  useEffect(() => {
    if (!group || !user || (expenseId && expenseLoading) || (expenseId && !expense)) return;
    const formKey = `${group.id}:${expenseId ?? 'new'}`;
    if (initializedFormKey.current === formKey) return;
    initializedFormKey.current = formKey;

    if (expense) {
      const splitIds = expense.splits.map(split => split.userId);
      const percentageBasisPoints = splitIds.map((userId, index) => index === splitIds.length - 1
        ? 10000 - splitIds.slice(0, index).reduce((sum, id) => {
          const amountMinor = expense.splits.find(split => split.userId === id)?.amountMinor ?? 0;
          return sum + Math.round(amountMinor * 10000 / expense.totalMinor);
        }, 0)
        : Math.round((expense.splits.find(split => split.userId === userId)?.amountMinor ?? 0) * 10000 / expense.totalMinor));
      setDescription(expense.description ?? '');
      setAmount((expense.totalMinor / 100).toFixed(2));
      setSelectedUserIds(splitIds);
      setPayerId(expense.payments[0]?.userId ?? '');
      setCategory(expense.category ?? 'OTHER');
      setExpenseDate((expense.expenseDate ?? expense.createdAt).slice(0, 10));
      setNotes(expense.notes ?? '');
      setSplitType(expense.splitType);
      setSplitValues(Object.fromEntries(expense.splits.map((split, index) => [
        split.userId,
        expense.splitType === 'EXACT'
          ? (split.amountMinor / 100).toFixed(2)
          : expense.splitType === 'PERCENT'
            ? (percentageBasisPoints[index] / 100).toFixed(2)
            : String(split.amountMinor),
      ])));
    } else {
      setSelectedUserIds(group.members.map(member => member.user.id));
      setPayerId(group.members.some(member => member.user.id === user.id) ? user.id : group.members[0]?.user.id ?? '');
    }
  }, [expense, expenseId, expenseLoading, group, user]);

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
      const payload = {
        description: title,
        category,
        notes: notes.trim() || undefined,
        expenseDate: parsedDate.toISOString(),
        totalMinor,
        currency: group.currency,
        splitType,
        payments: [{ userId: payerId, amountMinor: totalMinor }],
        splits: splitResult.splits,
      };
      if (expenseId) {
        await updateExpense({ groupId, expenseId, expense: payload }).unwrap();
      } else {
        await createExpense({ groupId, expense: payload }).unwrap();
      }
      navigation.goBack();
    } catch (error) {
      setFormError(getMutationErrorMessage(
        error,
        `Could not ${expenseId ? 'update' : 'save'} the expense. Check that all selected people are group members, then try again.`,
      ));
    }
  };

  if (groupLoading || userLoading || expenseLoading) return <View style={styles.state}><LoadingIndicator /></View>;
  if (groupError || userError || expenseError || !group || !user || (expenseId && !expense)) {
    return (
      <View style={styles.state}>
        <BackButton onPress={() => navigation.goBack()} />
        <EmptyState message="Could not load the group, account, or expense. Check your connection and try again." />
        <Pressable
          onPress={() => { refetchGroup(); refetchUser(); if (expenseId) refetchExpense(); }}
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
      <ScreenHeader
        title={expenseId ? 'Edit expense' : 'Add an expense'}
        subtitle={expenseId ? `Correct this shared expense in ${group.name}.` : `Add a shared expense to ${group.name}.`}
        icon={CircleDollarSign}
      />
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
      {updating ? (
        <View style={styles.savingIndicator} accessibilityRole="progressbar">
          <ActivityIndicator size="small" color={colors.primary} />
          <Text style={styles.savingText}>Updating expense…</Text>
        </View>
      ) : saving ? (
        <View style={styles.savingIndicator} accessibilityRole="progressbar">
          <ActivityIndicator size="small" color={colors.primary} />
          <Text style={styles.savingText}>Saving expense…</Text>
        </View>
      ) : null}
      <PrimaryButton
        title={saving || updating ? (expenseId ? 'Saving changes...' : 'Saving expense...') : (expenseId ? 'Save changes' : 'Save expense')}
        onPress={submit}
        disabled={saving || updating}
      />
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
  savingIndicator: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 9, marginBottom: 12 },
  savingText: { color: colors.primaryDark, fontSize: 13, fontWeight: '700' },
  retry: { alignSelf: 'center', paddingVertical: 12, paddingHorizontal: 20 },
  retryText: { color: colors.primaryDark, fontSize: 14, fontWeight: '700' },
});
