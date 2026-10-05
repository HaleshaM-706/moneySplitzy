-- Migration: 0001_init
-- Creates initial tables for Money Split application

CREATE TABLE "User" (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text,
  email text NOT NULL UNIQUE,
  phone text,
  passwordHash text NOT NULL,
  "createdAt" timestamptz NOT NULL DEFAULT now(),
  "updatedAt" timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE "Group" (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  currency text NOT NULL DEFAULT 'INR',
  "createdById" uuid NOT NULL REFERENCES "User"(id),
  "createdAt" timestamptz NOT NULL DEFAULT now(),
  "updatedAt" timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_group_createdById ON "Group"("createdById");

CREATE TABLE "GroupMember" (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "groupId" uuid NOT NULL REFERENCES "Group"(id),
  "userId" uuid NOT NULL REFERENCES "User"(id),
  role text NOT NULL DEFAULT 'MEMBER',
  "joinedAt" timestamptz NOT NULL DEFAULT now(),
  UNIQUE ("groupId", "userId")
);

CREATE INDEX idx_groupmember_groupId ON "GroupMember"("groupId");
CREATE INDEX idx_groupmember_userId ON "GroupMember"("userId");

CREATE TABLE "GroupInvitation" (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "groupId" uuid NOT NULL REFERENCES "Group"(id),
  email text NOT NULL,
  "invitedBy" uuid NOT NULL REFERENCES "User"(id),
  "acceptedBy" uuid REFERENCES "User"(id),
  token text NOT NULL UNIQUE,
  "expiresAt" timestamptz,
  "createdAt" timestamptz NOT NULL DEFAULT now(),
  "deletedAt" timestamptz
);

CREATE INDEX idx_groupinv_groupId ON "GroupInvitation"("groupId");
CREATE INDEX idx_groupinv_email ON "GroupInvitation"(email);

CREATE TABLE "Expense" (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "groupId" uuid NOT NULL REFERENCES "Group"(id),
  description text,
  "totalMinor" bigint NOT NULL,
  currency text NOT NULL DEFAULT 'INR',
  "splitType" text NOT NULL,
  "createdById" uuid NOT NULL REFERENCES "User"(id),
  status text NOT NULL DEFAULT 'OPEN',
  "createdAt" timestamptz NOT NULL DEFAULT now(),
  "updatedAt" timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_expense_groupId ON "Expense"("groupId");
CREATE INDEX idx_expense_createdAt ON "Expense"("createdAt");

CREATE TABLE "ExpensePayment" (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "expenseId" uuid NOT NULL REFERENCES "Expense"(id),
  "userId" uuid NOT NULL REFERENCES "User"(id),
  "amountMinor" bigint NOT NULL,
  "createdAt" timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_exppayment_expenseId ON "ExpensePayment"("expenseId");
CREATE INDEX idx_exppayment_userId ON "ExpensePayment"("userId");

CREATE TABLE "ExpenseSplit" (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "expenseId" uuid NOT NULL REFERENCES "Expense"(id),
  "userId" uuid NOT NULL REFERENCES "User"(id),
  "amountMinor" bigint NOT NULL,
  "createdAt" timestamptz NOT NULL DEFAULT now(),
  UNIQUE ("expenseId", "userId")
);

CREATE INDEX idx_expsplit_expenseId ON "ExpenseSplit"("expenseId");
CREATE INDEX idx_expsplit_userId ON "ExpenseSplit"("userId");

CREATE TABLE "Settlement" (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "groupId" uuid NOT NULL REFERENCES "Group"(id),
  "fromUserId" uuid NOT NULL REFERENCES "User"(id),
  "toUserId" uuid NOT NULL REFERENCES "User"(id),
  "amountMinor" bigint NOT NULL,
  currency text NOT NULL DEFAULT 'INR',
  status text NOT NULL DEFAULT 'PENDING',
  "createdAt" timestamptz NOT NULL DEFAULT now(),
  "updatedAt" timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_settlement_groupId ON "Settlement"("groupId");
CREATE INDEX idx_settlement_fromUserId ON "Settlement"("fromUserId");
CREATE INDEX idx_settlement_toUserId ON "Settlement"("toUserId");

CREATE TABLE "SettlementPaymentMethod" (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "settlementId" uuid NOT NULL REFERENCES "Settlement"(id),
  type text NOT NULL,
  reference text,
  "amountMinor" bigint NOT NULL
);

CREATE TABLE "Notification" (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "userId" uuid NOT NULL REFERENCES "User"(id),
  title text NOT NULL,
  body text,
  data jsonb,
  read boolean NOT NULL DEFAULT false,
  "createdAt" timestamptz NOT NULL DEFAULT now(),
  "deletedAt" timestamptz
);

CREATE INDEX idx_notification_userId ON "Notification"("userId");

CREATE TABLE "AuditLog" (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "actorUserId" uuid,
  "entityType" text NOT NULL,
  "entityId" text NOT NULL,
  action text NOT NULL,
  metadata jsonb,
  "createdAt" timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_auditlog_actor ON "AuditLog"("actorUserId");
CREATE INDEX idx_auditlog_entity ON "AuditLog"("entityType", "entityId");

CREATE TABLE "RefreshToken" (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "tokenHash" text NOT NULL,
  "userId" uuid NOT NULL REFERENCES "User"(id),
  "createdAt" timestamptz NOT NULL DEFAULT now(),
  "expiresAt" timestamptz NOT NULL,
  revoked boolean NOT NULL DEFAULT false
);

CREATE INDEX idx_refreshtoken_userId ON "RefreshToken"("userId");

CREATE TABLE "IdempotencyKey" (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  key text NOT NULL UNIQUE,
  "userId" uuid REFERENCES "User"(id),
  endpoint text NOT NULL,
  "requestHash" text,
  "createdAt" timestamptz NOT NULL DEFAULT now(),
  "expiresAt" timestamptz
);

CREATE INDEX idx_idempotency_userId ON "IdempotencyKey"("userId");
CREATE INDEX idx_idempotency_endpoint ON "IdempotencyKey"(endpoint);
