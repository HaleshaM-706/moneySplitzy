## Database ER Diagram

Entities: User, Group, GroupMember, Expense, ExpenseShare, Payment, Settlement, AuditLog

```mermaid
erDiagram
  USER ||--o{ GROUP_MEMBER : joins
  GROUP ||--o{ GROUP_MEMBER : has
  GROUP ||--o{ EXPENSE : contains
  EXPENSE ||--o{ EXPENSE_SHARE : splits
  USER ||--o{ EXPENSE : paid_by
  PAYMENT ||--o{ EXPENSE : applies_to
  SETTLEMENT ||--o{ PAYMENT : records
  AUDITLOG }o--|| USER : actor
```

Financial rules: amounts stored as minor units (integer) or decimal; immutable audit logs.
