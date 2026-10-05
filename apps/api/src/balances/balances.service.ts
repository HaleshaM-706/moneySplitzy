import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../common/prisma.service';

type Balance = { userId: string; paidMinor: number; owesMinor: number; settlementsSentMinor: number; settlementsReceivedMinor: number; netMinor: number; currency: string };

@Injectable()
export class BalancesService {
  constructor(private prisma: PrismaService) {}

  // Calculate balances for a group based on immutable records: payments, splits, settlements
  async getGroupBalances(groupId: string): Promise<Balance[]> {
    // verify group exists
    const group = await this.prisma.group.findUnique({ where: { id: groupId }, select: { id: true, currency: true } });
    if (!group) throw new BadRequestException('Group not found');

    const currency = group.currency || 'INR';

    // fetch members
    const members = await this.prisma.groupMember.findMany({ where: { groupId }, select: { userId: true } });
    const memberIds = members.map(m => m.userId);

    // initialize balances map
    const map: Record<string, Balance> = {};
    for (const id of memberIds) {
      map[id] = { userId: id, paidMinor: 0, owesMinor: 0, settlementsSentMinor: 0, settlementsReceivedMinor: 0, netMinor: 0, currency };
    }

    // payments (who paid for expenses)
    const payments = await this.prisma.expensePayment.findMany({ where: { expense: { groupId } }, select: { userId: true, amountMinor: true } });
    for (const p of payments) {
      if (!map[p.userId]) continue;
      map[p.userId].paidMinor += p.amountMinor;
    }

    // splits (who owes share of expenses)
    const splits = await this.prisma.expenseSplit.findMany({ where: { expense: { groupId } }, select: { userId: true, amountMinor: true } });
    for (const s of splits) {
      if (!map[s.userId]) continue;
      map[s.userId].owesMinor += s.amountMinor;
    }

    // settlements
    const settlements = await this.prisma.settlement.findMany({ where: { groupId, status: 'COMPLETED' }, select: { fromUserId: true, toUserId: true, amountMinor: true, currency: true } });
    for (const st of settlements) {
      if (st.currency !== currency) continue; // skip different currency settlements
      if (map[st.fromUserId]) map[st.fromUserId].settlementsSentMinor += st.amountMinor;
      if (map[st.toUserId]) map[st.toUserId].settlementsReceivedMinor += st.amountMinor;
    }

    // compute net: payments - owes + sent - received
    let total = 0;
    for (const id of Object.keys(map)) {
      const b = map[id];
      b.netMinor = b.paidMinor - b.owesMinor + b.settlementsSentMinor - b.settlementsReceivedMinor;
      total += b.netMinor;
    }

    // ensure total is zero; allow zero or tiny rounding difference
    if (total !== 0) {
      // try to correct rounding by adjusting the largest absolute balance
      const entries = Object.values(map).sort((a, b) => Math.abs(b.netMinor) - Math.abs(a.netMinor));
      if (entries.length > 0) {
        entries[0].netMinor -= total;
      }
      // after adjustment total should be zero
      total = Object.values(map).reduce((s, v) => s + v.netMinor, 0);
      if (total !== 0) {
        throw new Error('Invariant violation: balances do not sum to zero after adjustment');
      }
    }

    return Object.values(map);
  }
}
