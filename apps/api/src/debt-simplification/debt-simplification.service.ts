import { Injectable } from '@nestjs/common';
import { PrismaService } from '../common/prisma.service';

type SimplifiedDebt = { fromUserId: string; toUserId: string; amountMinor: number; currency: string };

@Injectable()
export class DebtSimplificationService {
  constructor(private prisma: PrismaService) {}

  // Produce a minimal set of settlements that clear net balances.
  // Greedy algorithm: sort creditors and debtors and match.
  async simplifyGroupDebts(groupId: string): Promise<SimplifiedDebt[]> {
    // compute balances using money paid - owes + settlements
    // reuse balances calculation logic by querying payments/splits/settlements here
    const group = await this.prisma.group.findUnique({ where: { id: groupId }, select: { currency: true } });
    const currency = group?.currency ?? 'INR';

    const payments = await this.prisma.expensePayment.findMany({ where: { expense: { groupId } }, select: { userId: true, amountMinor: true } });
    const splits = await this.prisma.expenseSplit.findMany({ where: { expense: { groupId } }, select: { userId: true, amountMinor: true } });
    const settlements = await this.prisma.settlement.findMany({ where: { groupId, status: 'COMPLETED' }, select: { fromUserId: true, toUserId: true, amountMinor: true, currency: true } });

    const map: Record<string, number> = {};
    const add = (id: string, v: number) => (map[id] = (map[id] || 0) + v);

    for (const p of payments) add(p.userId, p.amountMinor);
    for (const s of splits) add(s.userId, -s.amountMinor);
    for (const st of settlements) {
      if (st.currency !== currency) continue;
      add(st.fromUserId, st.amountMinor);
      add(st.toUserId, -st.amountMinor);
    }

    const entries = Object.entries(map).map(([userId, amt]) => ({ userId, amt }));
    const debtors = entries.filter(e => e.amt < 0).map(e => ({ userId: e.userId, amt: -e.amt })).sort((a, b) => b.amt - a.amt);
    const creditors = entries.filter(e => e.amt > 0).map(e => ({ userId: e.userId, amt: e.amt })).sort((a, b) => b.amt - a.amt);

    const result: SimplifiedDebt[] = [];
    let i = 0, j = 0;
    while (i < debtors.length && j < creditors.length) {
      const debtor = debtors[i];
      const creditor = creditors[j];
      const take = Math.min(debtor.amt, creditor.amt);
      if (take <= 0) break;
      result.push({ fromUserId: debtor.userId, toUserId: creditor.userId, amountMinor: take, currency });
      debtor.amt -= take;
      creditor.amt -= take;
      if (debtor.amt === 0) i++;
      if (creditor.amt === 0) j++;
    }

    return result;
  }
}
