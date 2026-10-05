import splitEngine from './index';

describe('split-engine', () => {
  test('equal split three participants with remainder', () => {
    const total = 10000; // paise
    const parts = ['A', 'B', 'C'];
    const splits = splitEngine.calculateEqualSplit(total, parts);
    expect(splits.map(s => s.amount).sort((a, b) => a - b)).toEqual([3333, 3333, 3334]);
    const sum = splits.reduce((s, p) => s + p.amount, 0);
    expect(sum).toBe(total);
  });

  test('exact split valid', () => {
    const total = 5000;
    const exact = { A: 2000, B: 3000 };
    const splits = splitEngine.calculateExactSplit(total, exact);
    expect(splits.find(s => s.userId === 'A')!.amount).toBe(2000);
  });

  test('percentage split with remainder', () => {
    const total = 100;
    const perc = { A: 33, B: 33, C: 34 };
    const splits = splitEngine.calculatePercentageSplit(total, perc);
    expect(splits.reduce((s, p) => s + p.amount, 0)).toBe(total);
  });

  test('share split with weights and remainder', () => {
    const total = 100;
    const shares = { A: 1, B: 1, C: 1 };
    const splits = splitEngine.calculateShareSplit(total, shares);
    expect(splits.reduce((s, p) => s + p.amount, 0)).toBe(total);
  });

  test('calculate balances and simplify debts', () => {
    const total = 100;
    const payments = [{ userId: 'A', amount: 100 }];
    const splits = [{ userId: 'A', amount: 33 }, { userId: 'B', amount: 33 }, { userId: 'C', amount: 34 }];
    const balances = splitEngine.calculateBalances(total, payments, splits);
    // A paid 100, owes 33 => +67
    const balA = balances.find(b => b.userId === 'A')!.balance;
    expect(balA).toBe(67);
    const debts = splitEngine.simplifyDebts(balances);
    const totalDebt = debts.reduce((s, d) => s + d.amount, 0);
    expect(totalDebt).toBe(67);
  });

  test('validate payments mismatch throws', () => {
    expect(() => splitEngine.validatePayments([{ userId: 'A', amount: 10 }], 20)).toThrow();
  });

  test('zero amount handling', () => {
    const splits = splitEngine.calculateEqualSplit(0, ['A']);
    expect(splits[0].amount).toBe(0);
  });

  test('negative total throws', () => {
    expect(() => splitEngine.calculateEqualSplit(-100, ['A'])).toThrow();
  });

  test('large amounts', () => {
    const total = Number.MAX_SAFE_INTEGER - 10;
    const parts = ['A', 'B'];
    const splits = splitEngine.calculateEqualSplit(total, parts);
    expect(splits.reduce((s, p) => s + p.amount, 0)).toBe(total);
  });
});
