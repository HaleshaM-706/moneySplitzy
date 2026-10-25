import { calculateExpenseSplits } from '../features/groups/expenseSplit';

describe('calculateExpenseSplits', () => {
  it('distributes equal shares with deterministic minor-unit rounding', () => {
    expect(calculateExpenseSplits(['a', 'b', 'c'], 'EQUAL', 1001, {})).toEqual({
      splits: [
        { userId: 'a', amountMinor: 334 },
        { userId: 'b', amountMinor: 334 },
        { userId: 'c', amountMinor: 333 },
      ],
    });
  });

  it('requires exact allocations to equal the expense total', () => {
    expect(calculateExpenseSplits(['a', 'b'], 'EXACT', 1000, { a: '6.00', b: '3.99' })).toEqual({
      error: 'Enter a positive exact amount for each person; the amounts must add up to the total.',
    });
  });

  it('rounds percentage allocations and assigns the rounding remainder', () => {
    expect(calculateExpenseSplits(['a', 'b'], 'PERCENT', 101, { a: '50', b: '50' })).toEqual({
      splits: [
        { userId: 'a', amountMinor: 51 },
        { userId: 'b', amountMinor: 50 },
      ],
    });
  });

  it('allocates custom share ratios proportionally', () => {
    expect(calculateExpenseSplits(['a', 'b'], 'SHARES', 900, { a: '1', b: '2' })).toEqual({
      splits: [
        { userId: 'a', amountMinor: 300 },
        { userId: 'b', amountMinor: 600 },
      ],
    });
  });
});
