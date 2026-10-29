export type UserDTO = {
  id: string;
  email: string;
  name?: string | null;
};

export type RegisterDTO = {
  name: string;
  email: string;
  password: string;
};

export type RegistrationResponseDTO = {
  user: UserDTO;
  verificationEmailSent: boolean;
};

export type ResendVerificationDTO = {
  message: string;
};

export type LoginDTO = {
  email: string;
  password: string;
};

export type AuthResponseDTO = {
  user: UserDTO;
  access: string;
  refresh: string;
};

export type GroupDTO = {
  id: string;
  name: string;
  currency: string;
  description?: string | null;
  createdById?: string;
  createdAt?: string;
  updatedAt?: string;
  memberCount: number;
  category?: string;
  icon?: string;
  totalMinor?: number;
  netMinor?: number;
  recentActivity?: string;
  lastActivityAt?: string;
};

export type GroupDetailsDTO = GroupDTO & {
  members: {
    id: string;
    role: 'ADMIN' | 'MEMBER';
    user: UserDTO;
  }[];
};

export type GroupCreateDTO = {
  name: string;
  description?: string;
  currency?: string;
  category?: string;
  icon?: string;
};

export type GroupInvitationDTO = {
  id: string;
  groupId: string;
  email: string;
  token: string;
  expiresAt?: string | null;
  createdAt: string;
};

export type AddExistingGroupMemberDTO = {
  groupId: string;
  userId: string;
  added: boolean;
};

export type AcceptGroupInvitationDTO = {
  groupId: string;
  joined: boolean;
};

export type ExpenseDTO = {
  id: string;
  groupId: string;
  description?: string | null;
  category?: string;
  notes?: string | null;
  expenseDate?: string;
  totalMinor: number;
  currency: string;
  splitType: 'EQUAL' | 'EXACT' | 'PERCENT' | 'SHARES';
  createdById: string;
  status: 'OPEN' | 'SETTLED' | 'CANCELLED';
  createdAt: string;
  payments: ExpenseAllocationDTO[];
  splits: ExpenseAllocationDTO[];
};

export type ExpenseCreateDTO = {
  description?: string;
  category?: string;
  notes?: string;
  expenseDate?: string;
  totalMinor: number;
  currency?: string;
  splitType: 'EQUAL' | 'EXACT' | 'PERCENT' | 'SHARES';
  payments: ExpenseAllocationDTO[];
  splits: ExpenseAllocationDTO[];
};

export type ExpenseAllocationDTO = {
  userId: string;
  amountMinor: number;
};

export type BalanceDTO = {
  userId: string;
  paidMinor: number;
  owesMinor: number;
  settlementsSentMinor: number;
  settlementsReceivedMinor: number;
  netMinor: number;
  currency: string;
};

export type SettlementDTO = {
  id: string;
  groupId: string;
  fromUserId: string;
  toUserId: string;
  amountMinor: number;
  currency: string;
  status: 'PENDING' | 'COMPLETED' | 'FAILED';
  createdAt: string;
  updatedAt: string;
};

export type SettlementCreateDTO = {
  groupId: string;
  fromUserId: string;
  toUserId: string;
  amountMinor: number;
  currency?: string;
};

export type SimplifiedDebtDTO = {
  fromUserId: string;
  toUserId: string;
  amountMinor: number;
  currency: string;
};

export type DashboardSummaryDTO = {
  groupsCount: number;
  balances: { currency: string; totalBalance: number }[];
};

export type ActivityDTO = {
  id: string;
  title: string;
  amount: number;
  payerId: string;
  createdAt: string;
  groupName: string;
  currency: string;
  paidBy?: string;
};

export type GroupActivityDTO = {
  id: string;
  type: 'EXPENSE' | 'SETTLEMENT' | 'MEMBER';
  title: string;
  action: string;
  amountMinor: number;
  actorId: string;
  actor: string;
  createdAt: string;
  currency: string;
};
