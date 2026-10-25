export type ExpenseSplitType = 'EQUAL' | 'EXACT' | 'PERCENT' | 'SHARES';

export type ExpenseSplitAllocation = {
  userId: string;
  amountMinor: number;
};

type SplitResult =
  | { splits: ExpenseSplitAllocation[] }
  | { error: string };

export function calculateExpenseSplits(
  userIds: string[],
  splitType: ExpenseSplitType,
  totalMinor: number,
  inputValues: Record<string, string>,
): SplitResult {
  if (userIds.length === 0) return { error: 'Select at least one person to split this expense with.' };

  if (splitType === 'EXACT') {
    if (userIds.some(userId => !/^\d+(\.\d{1,2})?$/.test(inputValues[userId] ?? ''))) {
      return { error: 'Enter exact amounts with no more than 2 decimal places.' };
    }
    const splits = userIds.map(userId => ({
      userId,
      amountMinor: Math.round(Number(inputValues[userId]) * 100),
    }));
    if (splits.some(split => !Number.isSafeInteger(split.amountMinor) || split.amountMinor < 1)
      || splits.reduce((sum, split) => sum + split.amountMinor, 0) !== totalMinor) {
      return { error: 'Enter a positive exact amount for each person; the amounts must add up to the total.' };
    }
    return { splits };
  }

  const weights = splitType === 'EQUAL' ? userIds.map(() => 1) : userIds.map(userId => {
    const value = inputValues[userId] ?? '';
    return /^\d+(\.\d{1,2})?$/.test(value) ? Number(value) : Number.NaN;
  });
  if (weights.some(value => !Number.isFinite(value) || value <= 0)) {
    return {
      error: splitType === 'EQUAL'
        ? 'Select at least one person to split this expense with.'
        : `Enter a positive ${splitType === 'PERCENT' ? 'percentage' : 'share'} with no more than 2 decimal places for each selected person.`,
    };
  }
  if (splitType === 'PERCENT' && userIds.reduce(
    (sum, userId) => sum + Math.round(Number(inputValues[userId]) * 100),
    0,
  ) !== 10000) {
    return { error: 'Percentages must add up to 100%.' };
  }

  const weightTotal = weights.reduce((sum, weight) => sum + weight, 0);
  const preciseShares = weights.map(weight => totalMinor * weight / weightTotal);
  const allocations = preciseShares.map(Math.floor);
  const remainder = totalMinor - allocations.reduce((sum, share) => sum + share, 0);
  const order = preciseShares
    .map((share, index) => ({ index, fractionalPart: share - allocations[index] }))
    .sort((a, b) => b.fractionalPart - a.fractionalPart || a.index - b.index);
  for (let index = 0; index < remainder; index += 1) allocations[order[index].index] += 1;

  const splits = userIds.map((userId, index) => ({ userId, amountMinor: allocations[index] }));
  if (splits.some(split => split.amountMinor < 1)) {
    return { error: 'The total is too small for this split. Adjust the amount or participants.' };
  }
  return { splits };
}
