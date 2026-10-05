## Database ER Diagram

Entities and relationships for Money Split application.

```mermaid
erDiagram
  USER ||--o{ GROUP_MEMBER : joins
  USER ||--o{ EXPENSE_PAYMENT : pays
  USER ||--o{ EXPENSE_SPLIT : owes
  USER ||--o{ REFRESH_TOKEN : has
  USER ||--o{ NOTIFICATION : receives
  GROUP ||--o{ GROUP_MEMBER : has
  GROUP ||--o{ GROUP_INVITATION : invites
  GROUP ||--o{ EXPENSE : contains
  EXPENSE ||--o{ EXPENSE_PAYMENT : has
  EXPENSE ||--o{ EXPENSE_SPLIT : has
  GROUP ||--o{ SETTLEMENT : contains
  SETTLEMENT ||--o{ SETTLEMENT_PAYMENT_METHOD : uses
  AUDITLOG }o--|| USER : actor
```

Key design notes:
- All monetary fields stored as minor units (`Int`/`bigint`) to avoid floating point errors.
- Financial records (expenses, payments, settlements) are immutable in history; do not hard-delete settled records.
- Soft deletes used for invitations and notifications.
- Indexes added on `groupId`, `userId`, `expenseId`, and `createdAt` for query performance.
