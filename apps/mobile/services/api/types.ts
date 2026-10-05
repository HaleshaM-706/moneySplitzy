export type UserDTO = {
  id: string;
  email: string;
  name?: string;
};

export type RegisterDTO = {
  name: string;
  email: string;
  password: string;
};

export type LoginDTO = {
  email: string;
  password: string;
};

export type GroupDTO = {
  id: string;
  name: string;
  description?: string;
};

export type GroupCreateDTO = {
  name: string;
  description?: string;
};

export type ExpenseDTO = {
  id: string;
  title: string;
  amount: number;
  payerId: string;
};

export type ExpenseCreateDTO = {
  title: string;
  amount: number;
  payerId: string;
};

export type BalanceDTO = {
  userId: string;
  name?: string;
  amount: number;
};

export type SettlementDTO = {
  id: string;
  amount: number;
};

export type DashboardSummaryDTO = {
  totalBalance: number;
  groupsCount: number;
};
