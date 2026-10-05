import { Balance, Debt, MinorUnit, Payment, Split } from './types';

function toBigInt(n: number | bigint): bigint {
  if (typeof n === 'bigint') return n;
  if (!Number.isInteger(n)) throw new Error('Amounts must be integer minor units');
  return BigInt(n);
}

function fromBigInt(b: bigint): number {
  const n = Number(b);
  if (!Number.isSafeInteger(n)) throw new Error('Amount exceeds safe integer range');
  return n;
}

export function calculateEqualSplit(total: MinorUnit, participants: string[]): Split[] {
  const t = toBigInt(total);
  if (t < 0n) throw new Error('Total must be non-negative');
  if (participants.length === 0) throw new Error('No participants');

  const n = BigInt(participants.length);
  const base = t / n;
  let remainder = t % n;
  const sorted = [...participants].sort();

  const result: Split[] = [];
  for (const userId of sorted) {
    let amount = base;
    if (remainder > 0n) {
      amount += 1n;
      remainder -= 1n;
    }
    result.push({ userId, amount: fromBigInt(amount) });
  }

  return result;
}

export function calculateExactSplit(total: MinorUnit, exact: Record<string, MinorUnit>): Split[] {
  const t = toBigInt(total);
  if (t < 0n) throw new Error('Total must be non-negative');

  const entries = Object.entries(exact);
  if (entries.length === 0) throw new Error('No splits provided');

  let sum = 0n;
  for (const [, value] of entries) {
    const amount = toBigInt(value);
    if (amount < 0n) throw new Error('Split amounts must be non-negative');
    sum += amount;
  }

  if (sum !== t) throw new Error('Exact splits do not sum to total');
  return entries.map(([userId, amount]) => ({ userId, amount: Number(amount) }));
}

export function calculatePercentageSplit(total: MinorUnit, percentages: Record<string, number>): Split[] {
  const t = toBigInt(total);
  if (t < 0n) throw new Error('Total must be non-negative');

  const entries = Object.entries(percentages);
  if (entries.length === 0) throw new Error('No percentages provided');

  let sumPercent = 0;
  for (const [, value] of entries) {
    if (value < 0) throw new Error('Percentages must be non-negative');
    sumPercent += value;
  }
  if (Math.abs(sumPercent - 100) > 1e-9) throw new Error('Percentages must sum to 100');

  const sorted = [...entries].sort((a, b) => a[0].localeCompare(b[0]));
  const result: Split[] = [];
  let allocated = 0n;

  for (const [userId, percent] of sorted) {
    const raw = (t * BigInt(Math.floor(percent * 1000000))) / 1000000n / 100n;
    const amount = fromBigInt(raw);
    result.push({ userId, amount });
    allocated += toBigInt(amount);
  }

  let remainder = t - allocated;
  for (const [userId] of sorted) {
    if (remainder <= 0n) break;
    const idx = result.findIndex(item => item.userId === userId);
    result[idx].amount += 1;
    remainder -= 1n;
  }

  return result;
}

export function calculateShareSplit(total: MinorUnit, shares: Record<string, number>): Split[] {
  const t = toBigInt(total);
  if (t < 0n) throw new Error('Total must be non-negative');

  const entries = Object.entries(shares);
  if (entries.length === 0) throw new Error('No shares provided');

  let totalWeight = 0;
  for (const [, weight] of entries) {
    if (weight <= 0) throw new Error('Share weights must be positive');
    totalWeight += weight;
  }

  const sorted = [...entries].sort((a, b) => a[0].localeCompare(b[0]));
  const result: Split[] = [];
  let allocated = 0n;

  for (const [userId, weight] of sorted) {
    const amount = (t * BigInt(weight)) / BigInt(totalWeight);
    result.push({ userId, amount: fromBigInt(amount) });
    allocated += amount;
  }

  let remainder = t - allocated;
  for (const [userId] of sorted) {
    if (remainder <= 0n) break;
    const idx = result.findIndex(item => item.userId === userId);
    result[idx].amount += 1;
    remainder -= 1n;
  }

  return result;
}

export function calculateBalances(total: MinorUnit, payments: Payment[], splits: Split[]): Balance[] {
  const t = toBigInt(total);
  if (t < 0n) throw new Error('Total must be non-negative');

  const sumPayments = payments.reduce((sum, payment) => sum + toBigInt(payment.amount), 0n);
  if (sumPayments !== t) throw new Error('Payments do not sum to total');

  const sumSplits = splits.reduce((sum, split) => sum + toBigInt(split.amount), 0n);
  if (sumSplits !== t) throw new Error('Splits do not sum to total');

  const map = new Map<string, bigint>();
  for (const payment of payments) {
    map.set(payment.userId, (map.get(payment.userId) || 0n) + toBigInt(payment.amount));
  }
  for (const split of splits) {
    map.set(split.userId, (map.get(split.userId) || 0n) - toBigInt(split.amount));
  }

  const result: Balance[] = [];
  for (const [userId, balance] of map.entries()) {
    result.push({ userId, balance: fromBigInt(balance) });
  }

  const userSet = new Set([...payments.map(p => p.userId), ...splits.map(s => s.userId)]);
  for (const userId of userSet) {
    if (!map.has(userId)) result.push({ userId, balance: 0 });
  }

  return result;
}

export function simplifyDebts(balances: Balance[]): Debt[] {
  const creditors = balances.filter(b => b.balance > 0).map(b => ({ userId: b.userId, bal: toBigInt(b.balance) }));
  const debtors = balances.filter(b => b.balance < 0).map(b => ({ userId: b.userId, bal: -toBigInt(b.balance) }));

  creditors.sort((a, b) => a.userId.localeCompare(b.userId));
  debtors.sort((a, b) => a.userId.localeCompare(b.userId));

  const result: Debt[] = [];
  let i = 0;
  let j = 0;

  while (i < debtors.length && j < creditors.length) {
    const debtor = debtors[i];
    const creditor = creditors[j];
    const amount = debtor.bal < creditor.bal ? debtor.bal : creditor.bal;

    result.push({ from: debtor.userId, to: creditor.userId, amount: fromBigInt(amount) });
    debtor.bal -= amount;
    creditor.bal -= amount;

    if (debtor.bal === 0n) i += 1;
    if (creditor.bal === 0n) j += 1;
  }

  return result;
}

export function validateExpense(total: MinorUnit, participants: string[]): void {
  if (!Number.isInteger(total)) throw new Error('Total must be integer minor units');
  if (total < 0) throw new Error('Total must be non-negative');
  const set = new Set(participants);
  if (set.size !== participants.length) throw new Error('Duplicate participants');
  if (participants.length === 0) throw new Error('No participants');
}

export function validatePayments(payments: Payment[], total: MinorUnit): void {
  const sum = payments.reduce((acc, payment) => acc + payment.amount, 0);
  if (sum !== total) throw new Error('Payments total mismatch');
  for (const payment of payments) {
    if (payment.amount < 0) throw new Error('Payment amounts must be non-negative');
  }
}

export function validateSplits(splits: Split[], total: MinorUnit): void {
  const sum = splits.reduce((acc, split) => acc + split.amount, 0);
  if (sum !== total) throw new Error('Splits total mismatch');
  for (const split of splits) {
    if (split.amount < 0) throw new Error('Split amounts must be non-negative');
  }

  const set = new Set(splits.map(split => split.userId));
  if (set.size !== splits.length) throw new Error('Duplicate split participants');
}

export const splitEqual = (total: MinorUnit, participants: number): MinorUnit[] => {
  if (participants <= 0) return [];
  const base = Math.floor(total / participants);
  const remainder = total - base * participants;
  const result = Array(participants).fill(base);
  for (let i = 0; i < remainder; i += 1) {
    result[i] = result[i] + 1;
  }
  return result;
};

export const sumMinorUnits = (items: MinorUnit[]): MinorUnit => items.reduce((acc, value) => acc + value, 0);

export default {
  calculateEqualSplit,
  calculateExactSplit,
  calculatePercentageSplit,
  calculateShareSplit,
  calculateBalances,
  simplifyDebts,
  validateExpense,
  validatePayments,
  validateSplits,
  splitEqual,
  sumMinorUnits
};
