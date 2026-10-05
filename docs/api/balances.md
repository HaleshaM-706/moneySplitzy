# Balance Calculations

This document describes how group balances are derived from immutable financial records stored in the database.

Key records used:
- `ExpensePayment` — represents amounts paid by users (stored in minor units, e.g., paise/cents)
- `ExpenseSplit` — represents each user's share of an expense (minor units)
- `Settlement` — represents money transfers between users (minor units). Only `COMPLETED` settlements affect balances.

Derivation rules

For each user in a group, we compute:

Paid = Sum of `ExpensePayment.amountMinor` where the payment's expense belongs to the group and payment.userId = user

Owes = Sum of `ExpenseSplit.amountMinor` where the split's expense belongs to the group and split.userId = user

Settlements Sent = Sum of `Settlement.amountMinor` where settlement.groupId = group AND settlement.fromUserId = user AND settlement.status = COMPLETED

Settlements Received = Sum of `Settlement.amountMinor` where settlement.groupId = group AND settlement.toUserId = user AND settlement.status = COMPLETED

Net balance (minor units) = Paid - Owes + Settlements Sent - Settlements Received

Properties and guarantees

- All calculations are derived from immutable records (payments, splits, settlements) rather than a mutable `balance` table. This avoids drift and preserves auditability.
- To avoid rounding inconsistencies, all monetary fields are stored in minor units (integers). The service attempts to correct any tiny rounding residuals deterministically by adjusting the largest absolute balance so that the sum of all net balances is exactly zero; if that fails, an invariant error is raised.
- Expense edits and reversals are implemented by creating new records and updating `Expense` status/audit logs. Historical settlement records are never overwritten — they remain part of the ledger and continue to affect balances.
- Financial write operations support idempotency keys to prevent duplicate mutations.
- All settlement operations are performed inside a database transaction and create `AuditLog` entries to preserve history.

Examples

- User A pays 1000 for group of 4: Paid(A)+=1000, Owes(each)+=250.
- If User B settles 250 to User A and the settlement completes: SettlementsSent(B)+=250, SettlementsReceived(A)+=250, net balances updated accordingly.

Contact

For questions about edge cases (multi-currency groups, fees, adjustments), consult the team or open an issue in the repo.
