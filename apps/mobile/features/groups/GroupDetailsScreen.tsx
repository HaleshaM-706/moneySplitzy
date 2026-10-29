import React, { useMemo, useState } from 'react';
import { ActivityIndicator, Alert, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { BarChart3, CircleDollarSign, Clock3, MailPlus, Pencil, Plus, Receipt, Trash2, Users, Wallet } from 'lucide-react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import {
  useGetCurrentUserQuery,
  useGetGroupActivitiesQuery,
  useGetGroupBalancesQuery,
  useGetGroupDetailsQuery,
  useGetGroupExpensesQuery,
  useGetSimplifiedDebtsQuery,
  useCreateSettlementMutation,
  useDeleteExpenseMutation,
} from '../../services/api/apiSlice';
import type { ExpenseDTO, GroupActivityDTO } from '../../services/api/types';
import BackButton from '../../shared/components/BackButton';
import EmptyState from '../../shared/components/EmptyState';
import GroupCard from '../../shared/components/GroupCard';
import LoadingIndicator from '../../shared/components/LoadingIndicator';
import ScreenHeader from '../../shared/components/ScreenHeader';
import { colors, spacing } from '../../shared/theme';
import type { RootStackParamList } from '../../app/navigation/AppNavigator';

type Props = NativeStackScreenProps<RootStackParamList, 'GroupDetails'>;
type Section = 'Overview' | 'Expenses' | 'Members' | 'Activity';
type ActivityFilter = 'ALL' | 'EXPENSE' | 'SETTLEMENT' | 'MEMBER';
type ExpenseSort = 'NEWEST' | 'OLDEST' | 'AMOUNT';

const money = (amountMinor: number, currency: string) =>
  new Intl.NumberFormat('en-IN', { style: 'currency', currency }).format(amountMinor / 100);

function ActivityRow({ activity, currency }: { activity: GroupActivityDTO; currency: string }) {
  return (
    <View style={styles.activityRow}>
      <View style={styles.activityIcon}>
        {activity.type === 'SETTLEMENT' ? <Wallet size={17} color={colors.primaryDark} /> : activity.type === 'MEMBER' ? <Users size={17} color={colors.primaryDark} /> : <Receipt size={17} color={colors.primaryDark} />}
      </View>
      <View style={styles.activityCopy}>
        <Text style={styles.activityTitle}>{activity.actor} {activity.action}</Text>
        <Text style={styles.activitySubtitle}>{activity.title} · {new Date(activity.createdAt).toLocaleDateString()}</Text>
      </View>
      {activity.amountMinor > 0 ? <Text style={styles.activityAmount}>{money(activity.amountMinor, currency)}</Text> : null}
    </View>
  );
}

function ExpenseRow({
  expense,
  currency,
  members,
  userId,
  expanded,
  isDeleting,
  onPress,
  onEdit,
  onDelete,
}: {
  expense: ExpenseDTO;
  currency: string;
  members: { id: string; name: string }[];
  userId?: string;
  expanded: boolean;
  isDeleting: boolean;
  onPress: () => void;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const payerId = expense.payments[0]?.userId;
  const payerName = members.find(member => member.id === payerId)?.name ?? 'Group member';
  const myShare = expense.splits.find(split => split.userId === userId)?.amountMinor ?? 0;
  const date = new Date(expense.expenseDate || expense.createdAt).toLocaleDateString();
  return (
    <View style={styles.expenseCard}>
      <Pressable style={styles.expenseSummary} onPress={onPress} accessibilityRole="button" accessibilityLabel={`View ${expense.description || 'expense'} details`}>
        <View style={styles.expenseIcon}><Receipt size={18} color={colors.primaryDark} /></View>
        <View style={styles.expenseCopy}>
          <Text style={styles.expenseTitle} numberOfLines={1}>{expense.description || 'Expense'}</Text>
          <Text style={styles.expenseMeta}>{expense.category || 'Other'} · Paid by {payerName} · {date}</Text>
          <Text style={styles.expenseShare}>Your share: {money(myShare, currency)}</Text>
        </View>
        <Text style={styles.expenseTotal}>{money(expense.totalMinor, currency)}</Text>
      </Pressable>
      {expanded ? (
        <View style={styles.splitDetails}>
          {expense.notes ? <Text style={styles.expenseMeta}>Note: {expense.notes}</Text> : null}
          <Text style={styles.splitHeading}>Split participants</Text>
          {expense.splits.map(split => (
            <Text key={split.userId} style={styles.splitLine}>
              {members.find(member => member.id === split.userId)?.name ?? 'Group member'} · {money(split.amountMinor, currency)}
            </Text>
          ))}
          <Text style={styles.expenseMeta}>Status: {expense.status.toLowerCase()}</Text>
        </View>
      ) : null}
      {expense.status !== 'CANCELLED' ? (
        <View style={styles.expenseActions}>
          <Pressable onPress={onEdit} style={[styles.expenseAction, isDeleting && styles.disabled]} disabled={isDeleting} accessibilityRole="button">
            <Pencil size={15} color={colors.primaryDark} />
            <Text style={styles.expenseActionText}>Edit</Text>
          </Pressable>
          <Pressable
            onPress={onDelete}
            style={[styles.expenseAction, isDeleting && styles.disabled]}
            disabled={isDeleting}
            accessibilityRole="button"
            accessibilityState={{ busy: isDeleting, disabled: isDeleting }}
          >
            {isDeleting
              ? <ActivityIndicator size="small" color={colors.danger} />
              : <Trash2 size={15} color={colors.danger} />}
            <Text style={[styles.expenseActionText, styles.deleteText]}>{isDeleting ? 'Deleting…' : 'Delete'}</Text>
          </Pressable>
        </View>
      ) : null}
    </View>
  );
}

export default function GroupDetailsScreen({ route, navigation }: Props) {
  const groupId = route.params.groupId;
  const [section, setSection] = useState<Section>('Overview');
  const [activityFilter, setActivityFilter] = useState<ActivityFilter>('ALL');
  const [expenseSort, setExpenseSort] = useState<ExpenseSort>('NEWEST');
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('ALL');
  const [memberFilter, setMemberFilter] = useState('ALL');
  const [expenseDateFilter, setExpenseDateFilter] = useState('');
  const [expandedExpenseId, setExpandedExpenseId] = useState<string | null>(null);
  const [showSettleUp, setShowSettleUp] = useState(false);
  const [settlementError, setSettlementError] = useState('');
  const { data: group, isLoading: groupLoading, isError: groupError, refetch: refetchGroup } = useGetGroupDetailsQuery(groupId);
  const { data: expenses = [], isLoading: expensesLoading, isError: expensesError, refetch: refetchExpenses } = useGetGroupExpensesQuery(groupId);
  const { data: activities = [], isLoading: activitiesLoading, isError: activitiesError, refetch: refetchActivities } = useGetGroupActivitiesQuery(groupId);
  const {
    data: balances = [],
    isLoading: balancesLoading,
    isError: balancesError,
    refetch: refetchBalances,
  } = useGetGroupBalancesQuery({ groupId });
  const { data: user } = useGetCurrentUserQuery();
  const { data: debts = [], isLoading: debtsLoading, isError: debtsError, refetch: refetchDebts } =
    useGetSimplifiedDebtsQuery(groupId, { skip: !showSettleUp });
  const [createSettlement, { isLoading: settling }] = useCreateSettlementMutation();
  const [deleteExpense, { isLoading: isDeletingExpense, originalArgs: deletingExpenseArgs }] = useDeleteExpenseMutation();
  const members = useMemo(
    () => group?.members.map(member => ({ id: member.user.id, name: member.user.name || member.user.email })) ?? [],
    [group],
  );
  const visibleExpenses = useMemo(() => {
    const filtered = expenses.filter(expense => {
      const expenseDate = (expense.expenseDate || expense.createdAt).slice(0, 10);
      return (expense.description || 'Expense').toLowerCase().includes(search.trim().toLowerCase())
        && (categoryFilter === 'ALL' || (expense.category || 'OTHER') === categoryFilter)
        && (memberFilter === 'ALL' || expense.payments.some(row => row.userId === memberFilter) || expense.splits.some(row => row.userId === memberFilter))
        && (!expenseDateFilter.trim() || expenseDate === expenseDateFilter.trim());
    });
    return [...filtered].sort((a, b) => expenseSort === 'AMOUNT'
      ? b.totalMinor - a.totalMinor
      : expenseSort === 'OLDEST'
        ? new Date(a.expenseDate || a.createdAt).getTime() - new Date(b.expenseDate || b.createdAt).getTime()
        : new Date(b.expenseDate || b.createdAt).getTime() - new Date(a.expenseDate || a.createdAt).getTime());
  }, [categoryFilter, expenseDateFilter, expenses, expenseSort, memberFilter, search]);
  const visibleActivities = useMemo(
    () => activities.filter(activity => activityFilter === 'ALL' || activity.type === activityFilter),
    [activities, activityFilter],
  );
  const currentBalance = balances.find(balance => balance.userId === user?.id);
  const totalMinor = expenses.reduce((total, expense) => total + expense.totalMinor, 0);
  const settleDebt = async (debt: typeof debts[number]) => {
    if (!user || debt.fromUserId !== user.id) return;
    setSettlementError('');
    try {
      await createSettlement({
        payload: {
          groupId,
          fromUserId: user.id,
          toUserId: debt.toUserId,
          amountMinor: debt.amountMinor,
          currency: group?.currency,
        },
      }).unwrap();
    } catch {
      setSettlementError('Could not record this settlement. Please try again.');
    }
  };

  const confirmDeleteExpense = (expense: ExpenseDTO) => {
    Alert.alert(
      'Delete this expense?',
      'It will be removed from the group totals and balances.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteExpense({ groupId, expenseId: expense.id }).unwrap();
            } catch (error) {
              Alert.alert('Could not delete expense', getExpenseErrorMessage(error, 'Please try again.'));
            }
          },
        },
      ],
    );
  };

  if (groupLoading) return <View style={styles.state}><LoadingIndicator /></View>;
  if (groupError || !group) {
    return (
      <View style={styles.state}>
        <BackButton onPress={() => navigation.goBack()} />
        <EmptyState message="Could not load this group. Check your connection and try again." />
        <Pressable onPress={refetchGroup} style={styles.retry}><Text style={styles.retryText}>Retry</Text></Pressable>
      </View>
    );
  }

  const retrySection = section === 'Expenses' ? refetchExpenses : section === 'Activity' ? refetchActivities : undefined;
  const showActivity = (items: GroupActivityDTO[]) => items.length
    ? items.map(activity => <ActivityRow key={`${activity.type}-${activity.id}`} activity={activity} currency={group.currency} />)
    : <EmptyState message="No activity in this group yet." />;
  const showExpenseList = (items: ExpenseDTO[]) => items.length
    ? items.map(expense => (
      <ExpenseRow
        key={expense.id}
        expense={expense}
        currency={group.currency}
        members={members}
        userId={user?.id}
        expanded={expandedExpenseId === expense.id}
        isDeleting={isDeletingExpense && deletingExpenseArgs?.expenseId === expense.id}
        onPress={() => setExpandedExpenseId(current => current === expense.id ? null : expense.id)}
        onEdit={() => navigation.navigate('AddExpense', { groupId, expenseId: expense.id })}
        onDelete={() => confirmDeleteExpense(expense)}
      />
    ))
    : (
      <View>
        <EmptyState message="No expenses yet. Add the first expense to start tracking this group." />
        <Pressable style={styles.primaryAction} onPress={() => navigation.navigate('AddExpense', { groupId })}>
          <Plus size={17} color="#FFFFFF" /><Text style={styles.primaryActionText}>Add your first expense</Text>
        </Pressable>
      </View>
    );

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
      <View style={styles.topRow}>
        <BackButton onPress={() => navigation.goBack()} />
        <Pressable style={styles.switchButton} onPress={() => navigation.navigate('Main', { screen: 'Groups' })} accessibilityRole="button">
          <Users size={16} color={colors.primaryDark} />
          <Text style={styles.switchText}>My Groups</Text>
        </Pressable>
      </View>
      {group.icon ? <View style={styles.groupIcon}><Text style={styles.groupIconText}>{group.icon}</Text></View> : null}
      <ScreenHeader title={group.name} subtitle={`${group.memberCount} members · ${group.currency}`} icon={Users} />
      <View style={styles.actionRow}>
        <Pressable style={styles.primaryAction} onPress={() => navigation.navigate('AddExpense', { groupId })}>
          <Plus size={17} color="#FFFFFF" /><Text style={styles.primaryActionText}>Add expense</Text>
        </Pressable>
        <Pressable style={styles.secondaryAction} onPress={() => navigation.navigate('InviteMember', { groupId })}>
          <MailPlus size={16} color={colors.primaryDark} /><Text style={styles.secondaryActionText}>Manage members</Text>
        </Pressable>
      </View>
      <View style={styles.quickActions}>
        <Pressable style={styles.quickAction} onPress={() => setSection('Overview')}>
          <BarChart3 size={16} color={colors.primaryDark} />
          <Text style={styles.secondaryActionText}>View balances</Text>
        </Pressable>
        <Pressable style={styles.quickAction} onPress={() => setShowSettleUp(value => !value)}>
          <Wallet size={16} color={colors.primaryDark} />
          <Text style={styles.secondaryActionText}>{showSettleUp ? 'Close settle up' : 'Settle up'}</Text>
        </Pressable>
      </View>
      {showSettleUp ? (
        <View style={styles.settlePanel}>
          <Text style={styles.sectionTitle}>Settle your group balances</Text>
          <Text style={styles.settleHint}>Review every member’s balance, the expenses behind it, and the payments needed to settle the group.</Text>
          <SectionHeading title="Payment plan" action={`${debts.length} payments`} />
          {debtsLoading ? <LoadingIndicator /> : debtsError ? (
            <>
              <EmptyState message="Could not load your settlement options." />
              <Pressable onPress={refetchDebts} style={styles.retry}><Text style={styles.retryText}>Retry</Text></Pressable>
            </>
          ) : debts.length === 0 ? <EmptyState message="All group balances are settled." /> : debts.map((debt, index) => {
            const isMyPayment = debt.fromUserId === user?.id;
            return (
              <View key={`${debt.fromUserId}-${debt.toUserId}-${index}`} style={styles.debtRow}>
                <View style={styles.debtCopy}>
                  <Text style={styles.expenseTitle}>
                    {members.find(member => member.id === debt.fromUserId)?.name ?? 'Group member'}
                    {' pays '}
                    {members.find(member => member.id === debt.toUserId)?.name ?? 'group member'}
                  </Text>
                  <Text style={styles.expenseMeta}>{money(debt.amountMinor, group.currency)}{isMyPayment ? ' · Your payment' : ''}</Text>
                </View>
                {isMyPayment ? (
                  <Pressable
                    style={[styles.payButton, settling && styles.disabled]}
                    disabled={settling}
                    onPress={() => settleDebt(debt)}
                    accessibilityRole="button"
                  >
                    <Text style={styles.payButtonText}>{settling ? 'Recording…' : 'Mark paid'}</Text>
                  </Pressable>
                ) : null}
              </View>
            );
          })}
          {settlementError ? <Text style={styles.error}>{settlementError}</Text> : null}

          <SectionHeading title="Member balances" action={`${group.members.length} members`} />
          {balancesLoading ? <LoadingIndicator /> : balancesError ? (
            <>
              <EmptyState message="Could not load member balances." />
              <Pressable onPress={refetchBalances} style={styles.retry}><Text style={styles.retryText}>Retry</Text></Pressable>
            </>
          ) : group.members.map(member => {
            const balance = balances.find(item => item.userId === member.user.id);
            const netMinor = balance?.netMinor ?? 0;
            return (
              <View key={member.user.id} style={styles.memberBalanceRow}>
                <View style={styles.debtCopy}>
                  <Text style={styles.expenseTitle}>
                    {member.user.name || member.user.email}{member.user.id === user?.id ? ' · You' : ''}
                  </Text>
                  <Text style={styles.expenseMeta}>
                    Paid {money(balance?.paidMinor ?? 0, group.currency)} · Share {money(balance?.owesMinor ?? 0, group.currency)}
                  </Text>
                  <Text style={styles.expenseMeta}>
                    Sent {money(balance?.settlementsSentMinor ?? 0, group.currency)} · Received {money(balance?.settlementsReceivedMinor ?? 0, group.currency)}
                  </Text>
                </View>
                <View style={styles.memberBalanceAmount}>
                  <Text style={[styles.expenseTotal, netMinor < 0 && styles.negative]}>
                    {netMinor === 0 ? 'Settled' : money(Math.abs(netMinor), group.currency)}
                  </Text>
                  <Text style={styles.expenseMeta}>{netMinor < 0 ? 'Owes' : netMinor > 0 ? 'Is owed' : 'All clear'}</Text>
                </View>
              </View>
            );
          })}

          <SectionHeading title="Expenses in this group" action={`${expenses.length} total`} />
          {expensesLoading ? <LoadingIndicator /> : expensesError ? (
            <>
              <EmptyState message="Could not load the group expenses." />
              <Pressable onPress={refetchExpenses} style={styles.retry}><Text style={styles.retryText}>Retry</Text></Pressable>
            </>
          ) : showExpenseList(expenses)}

          <SectionHeading title="Settlement history" action="" />
          {activitiesLoading ? <LoadingIndicator /> : activitiesError ? (
            <>
              <EmptyState message="Could not load settlement history." />
              <Pressable onPress={refetchActivities} style={styles.retry}><Text style={styles.retryText}>Retry</Text></Pressable>
            </>
          ) : showActivity(activities.filter(activity => activity.type === 'SETTLEMENT'))}
        </View>
      ) : null}
      <View style={styles.tabs}>
        {(['Overview', 'Expenses', 'Members', 'Activity'] as Section[]).map(item => (
          <Pressable key={item} style={[styles.tab, section === item && styles.tabSelected]} onPress={() => setSection(item)}>
            <Text style={[styles.tabText, section === item && styles.tabTextSelected]}>{item}</Text>
          </Pressable>
        ))}
      </View>

      {section === 'Overview' ? (
        <>
          {balancesLoading ? <LoadingIndicator /> : balancesError ? <EmptyState message="Could not load group balances." /> : null}
          <Text style={styles.sectionTitle}>Group summary</Text>
          <View style={styles.summaryGrid}>
            <SummaryValue icon={<CircleDollarSign size={17} color={colors.primaryDark} />} label="Total expenses" amount={totalMinor} currency={group.currency} />
            <SummaryValue icon={<Wallet size={17} color={colors.primaryDark} />} label="You paid" amount={currentBalance?.paidMinor ?? 0} currency={group.currency} />
            <SummaryValue icon={<Receipt size={17} color={colors.primaryDark} />} label="Your share" amount={currentBalance?.owesMinor ?? 0} currency={group.currency} />
            <View style={styles.summaryCard}>
              <View style={styles.summaryIcon}><BarChart3 size={17} color={colors.primaryDark} /></View>
              <Text style={styles.summaryLabel}>Your balance</Text>
              <Text style={[styles.summaryAmount, (currentBalance?.netMinor ?? 0) < 0 && styles.negative]}>
                {(currentBalance?.netMinor ?? 0) === 0 ? 'Settled' : money(Math.abs(currentBalance?.netMinor ?? 0), group.currency)}
              </Text>
              <Text style={styles.summaryCaption}>{(currentBalance?.netMinor ?? 0) < 0 ? 'You owe' : (currentBalance?.netMinor ?? 0) > 0 ? 'You are owed' : 'All clear'}</Text>
            </View>
          </View>
          <SectionHeading title="Recent expenses" action="View all" onPress={() => setSection('Expenses')} />
          {expensesLoading ? <LoadingIndicator /> : expensesError ? <EmptyState message="Could not load this group's expenses." /> : showExpenseList(expenses.slice(0, 3))}
          <SectionHeading title="Recent activity" action="View all" onPress={() => setSection('Activity')} />
          {activitiesLoading ? <LoadingIndicator /> : activitiesError ? <EmptyState message="Could not load this group's activity." /> : showActivity(activities.slice(0, 4))}
        </>
      ) : null}

      {section === 'Expenses' ? (
        <>
          <SectionHeading title="Group expenses" action="" />
          <View style={styles.search}>
            <Receipt size={17} color={colors.muted} />
            <TextInput value={search} onChangeText={setSearch} placeholder="Search expenses" placeholderTextColor={colors.muted} style={styles.searchInput} />
          </View>
          <View style={styles.search}>
            <Clock3 size={17} color={colors.muted} />
            <TextInput
              value={expenseDateFilter}
              onChangeText={setExpenseDateFilter}
              placeholder="Filter date (YYYY-MM-DD)"
              placeholderTextColor={colors.muted}
              style={styles.searchInput}
              maxLength={10}
              accessibilityLabel="Filter expenses by date"
            />
          </View>
          <View style={styles.filterRow}>
            {([['NEWEST', 'Newest'], ['OLDEST', 'Oldest'], ['AMOUNT', 'Amount']] as [ExpenseSort, string][]).map(([value, label]) => (
              <Pressable key={value} style={[styles.filterChip, expenseSort === value && styles.filterChipSelected]} onPress={() => setExpenseSort(value)}>
                <Text style={[styles.filterText, expenseSort === value && styles.filterTextSelected]}>{label}</Text>
              </Pressable>
            ))}
          </View>
          <Text style={styles.filterLabel}>Category</Text>
          <View style={styles.filterRow}>
            {['ALL', ...Array.from(new Set(expenses.map(expense => expense.category || 'OTHER')))].map(value => (
              <Pressable key={value} style={[styles.filterChip, categoryFilter === value && styles.filterChipSelected]} onPress={() => setCategoryFilter(value)}>
                <Text style={[styles.filterText, categoryFilter === value && styles.filterTextSelected]}>{value === 'ALL' ? 'All categories' : value}</Text>
              </Pressable>
            ))}
          </View>
          <Text style={styles.filterLabel}>Member</Text>
          <View style={styles.filterRow}>
            <Pressable style={[styles.filterChip, memberFilter === 'ALL' && styles.filterChipSelected]} onPress={() => setMemberFilter('ALL')}>
              <Text style={[styles.filterText, memberFilter === 'ALL' && styles.filterTextSelected]}>All members</Text>
            </Pressable>
            {members.map(member => (
              <Pressable key={member.id} style={[styles.filterChip, memberFilter === member.id && styles.filterChipSelected]} onPress={() => setMemberFilter(member.id)}>
                <Text style={[styles.filterText, memberFilter === member.id && styles.filterTextSelected]}>{member.name}</Text>
              </Pressable>
            ))}
          </View>
          {expensesLoading ? <LoadingIndicator /> : expensesError ? (
            <><EmptyState message="Could not load this group's expenses." /><Pressable onPress={retrySection} style={styles.retry}><Text style={styles.retryText}>Retry</Text></Pressable></>
          ) : showExpenseList(visibleExpenses)}
        </>
      ) : null}

      {section === 'Members' ? (
        <>
          <SectionHeading title="Group members" action={`${group.memberCount} total`} />
          {group.members.map(member => (
            <GroupCard
              key={member.id}
              name={member.user.name || member.user.email}
              subtitle={`${member.role === 'ADMIN' ? 'Admin' : 'Member'}${member.user.id === user?.id ? ' · You' : ''}`}
            />
          ))}
          <Pressable style={styles.secondaryAction} onPress={() => navigation.navigate('InviteMember', { groupId })}>
            <MailPlus size={16} color={colors.primaryDark} /><Text style={styles.secondaryActionText}>Add or invite a member</Text>
          </Pressable>
        </>
      ) : null}

      {section === 'Activity' ? (
        <>
          <SectionHeading title="Group activity" action="" />
          <View style={styles.filterRow}>
            {([['ALL', 'All Activities'], ['EXPENSE', 'Expenses'], ['SETTLEMENT', 'Settlements'], ['MEMBER', 'Members']] as [ActivityFilter, string][]).map(([value, label]) => (
              <Pressable key={value} style={[styles.filterChip, activityFilter === value && styles.filterChipSelected]} onPress={() => setActivityFilter(value)}>
                <Text style={[styles.filterText, activityFilter === value && styles.filterTextSelected]}>{label}</Text>
              </Pressable>
            ))}
          </View>
          {activitiesLoading ? <LoadingIndicator /> : activitiesError ? (
            <><EmptyState message="Could not load this group's activity." /><Pressable onPress={retrySection} style={styles.retry}><Text style={styles.retryText}>Retry</Text></Pressable></>
          ) : showActivity(visibleActivities)}
        </>
      ) : null}
    </ScrollView>
  );
}

function getExpenseErrorMessage(error: unknown, fallback: string): string {
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

function SummaryValue({ icon, label, amount, currency }: { icon: React.ReactNode; label: string; amount: number; currency: string }) {
  return (
    <View style={styles.summaryCard}>
      <View style={styles.summaryIcon}>{icon}</View>
      <Text style={styles.summaryLabel}>{label}</Text>
      <Text style={styles.summaryAmount}>{money(amount, currency)}</Text>
    </View>
  );
}

function SectionHeading({ title, action, onPress }: { title: string; action: string; onPress?: () => void }) {
  return (
    <View style={styles.sectionHeading}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {action ? <Pressable onPress={onPress}><Text style={styles.headingAction}>{action}</Text></Pressable> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.screen, paddingBottom: 34 },
  state: { flex: 1, backgroundColor: colors.background, padding: spacing.screen },
  topRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 },
  switchButton: { flexDirection: 'row', alignItems: 'center', gap: 6, padding: 9, borderRadius: 12, backgroundColor: colors.primaryLight },
  switchText: { color: colors.primaryDark, fontSize: 13, fontWeight: '700' },
  groupIcon: { width: 52, height: 52, alignItems: 'center', justifyContent: 'center', borderRadius: 17, backgroundColor: colors.primaryLight, marginBottom: 10 },
  groupIconText: { fontSize: 27 },
  actionRow: { flexDirection: 'row', gap: 9, marginBottom: 17 },
  primaryAction: { flex: 1, minHeight: 48, borderRadius: 14, backgroundColor: colors.primary, flexDirection: 'row', gap: 7, alignItems: 'center', justifyContent: 'center' },
  primaryActionText: { color: '#FFFFFF', fontWeight: '700', fontSize: 14 },
  secondaryAction: { minHeight: 46, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 7, paddingHorizontal: 12, borderRadius: 14, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface, marginBottom: 14 },
  secondaryActionText: { color: colors.primaryDark, fontWeight: '700', fontSize: 13 },
  quickActions: { flexDirection: 'row', gap: 9, marginBottom: 15 },
  quickAction: { flex: 1, minHeight: 44, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 7, borderRadius: 14, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface },
  settlePanel: { padding: 14, marginBottom: 15, borderRadius: 15, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface },
  settleHint: { color: colors.muted, fontSize: 12, lineHeight: 18, marginTop: 5, marginBottom: 9 },
  memberBalanceRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 10, borderTopWidth: 1, borderTopColor: colors.border },
  memberBalanceAmount: { alignItems: 'flex-end', marginLeft: 8 },
  debtRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 10, borderTopWidth: 1, borderTopColor: colors.border },
  debtCopy: { flex: 1 },
  payButton: { paddingHorizontal: 12, paddingVertical: 9, borderRadius: 11, backgroundColor: colors.primaryLight },
  payButtonText: { color: colors.primaryDark, fontSize: 12, fontWeight: '800' },
  disabled: { opacity: 0.5 },
  error: { color: colors.danger, fontSize: 13, marginTop: 8 },
  tabs: { flexDirection: 'row', gap: 4, padding: 4, borderRadius: 14, backgroundColor: colors.primaryLight, marginBottom: 17 },
  tab: { flex: 1, alignItems: 'center', justifyContent: 'center', minHeight: 37, borderRadius: 11 },
  tabSelected: { backgroundColor: colors.primaryDark },
  tabText: { color: colors.primaryDark, fontSize: 11, fontWeight: '700' },
  tabTextSelected: { color: '#FFFFFF' },
  sectionTitle: { color: colors.text, fontSize: 17, fontWeight: '800' },
  sectionHeading: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 8, marginBottom: 12 },
  headingAction: { color: colors.primaryDark, fontSize: 13, fontWeight: '700' },
  summaryGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 14 },
  summaryCard: { width: '48%', flexGrow: 1, minHeight: 112, padding: 13, borderRadius: 15, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface },
  summaryIcon: { width: 31, height: 31, alignItems: 'center', justifyContent: 'center', borderRadius: 10, backgroundColor: colors.primaryLight, marginBottom: 7 },
  summaryLabel: { color: colors.muted, fontSize: 12, fontWeight: '600' },
  summaryAmount: { color: colors.text, fontSize: 16, fontWeight: '800', marginTop: 3 },
  summaryCaption: { color: colors.primaryDark, fontSize: 11, marginTop: 2 },
  negative: { color: colors.danger },
  activityRow: { flexDirection: 'row', alignItems: 'center', padding: 12, marginBottom: 8, borderRadius: 14, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface },
  activityIcon: { width: 36, height: 36, borderRadius: 12, backgroundColor: colors.primaryLight, alignItems: 'center', justifyContent: 'center' },
  activityCopy: { flex: 1, marginHorizontal: 10 },
  activityTitle: { color: colors.text, fontSize: 13, fontWeight: '700' },
  activitySubtitle: { color: colors.muted, fontSize: 11, marginTop: 3 },
  activityAmount: { color: colors.text, fontSize: 12, fontWeight: '800' },
  expenseCard: { padding: 12, marginBottom: 9, borderRadius: 15, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface },
  expenseSummary: { flexDirection: 'row', alignItems: 'center' },
  expenseActions: { flexDirection: 'row', justifyContent: 'flex-end', gap: 10, borderTopWidth: 1, borderTopColor: colors.border, marginTop: 10, paddingTop: 9 },
  expenseAction: { minWidth: 72, minHeight: 34, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, borderRadius: 10, backgroundColor: colors.background },
  expenseActionText: { color: colors.primaryDark, fontSize: 12, fontWeight: '700' },
  deleteText: { color: colors.danger },
  expenseIcon: { width: 37, height: 37, borderRadius: 12, backgroundColor: colors.primaryLight, alignItems: 'center', justifyContent: 'center' },
  expenseCopy: { flex: 1, marginHorizontal: 9 },
  expenseTitle: { color: colors.text, fontSize: 13, fontWeight: '800' },
  expenseMeta: { color: colors.muted, fontSize: 11, marginTop: 3 },
  expenseShare: { color: colors.primaryDark, fontSize: 11, fontWeight: '700', marginTop: 3 },
  expenseTotal: { color: colors.text, fontSize: 12, fontWeight: '800' },
  splitDetails: { width: '100%', borderTopWidth: 1, borderTopColor: colors.border, marginTop: 10, paddingTop: 8 },
  splitHeading: { color: colors.text, fontSize: 12, fontWeight: '800', marginTop: 6, marginBottom: 4 },
  splitLine: { color: colors.muted, fontSize: 12, paddingVertical: 2 },
  search: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 12, minHeight: 46, borderRadius: 13, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface, marginBottom: 10 },
  searchInput: { flex: 1, paddingVertical: 8, color: colors.text, fontSize: 13 },
  filterRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 7, marginBottom: 12 },
  filterLabel: { color: colors.muted, fontSize: 12, fontWeight: '700', marginBottom: 7 },
  filterChip: { paddingHorizontal: 11, paddingVertical: 8, borderRadius: 12, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border },
  filterChipSelected: { backgroundColor: colors.primaryLight, borderColor: colors.primaryDark },
  filterText: { color: colors.muted, fontSize: 11, fontWeight: '700' },
  filterTextSelected: { color: colors.primaryDark },
  retry: { alignSelf: 'center', padding: 12 },
  retryText: { color: colors.primaryDark, fontSize: 14, fontWeight: '700' },
});
