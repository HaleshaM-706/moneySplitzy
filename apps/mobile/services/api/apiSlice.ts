import { createApi } from '@reduxjs/toolkit/query/react';
import { axiosBaseQuery } from './axiosBaseQuery';
import type {
  UserDTO,
  RegisterDTO,
  LoginDTO,
  GroupDTO,
  GroupCreateDTO,
  ExpenseDTO,
  ExpenseCreateDTO,
  BalanceDTO,
  SettlementDTO,
  DashboardSummaryDTO,
} from './types';

export const apiSlice = createApi({
  reducerPath: 'api',
  baseQuery: axiosBaseQuery({ baseUrl: process.env.API_URL || 'http://localhost:3000' }),
  tagTypes: ['Auth', 'Groups', 'Expenses', 'Balances', 'Settlements', 'Dashboard'],
  endpoints: builder => ({
    register: builder.mutation<UserDTO, RegisterDTO>({
      query: creds => ({ url: '/auth/register', method: 'POST', data: creds }),
      invalidatesTags: ['Auth'],
    }),
    login: builder.mutation<{ token: string; refreshToken?: string | null; user: UserDTO }, LoginDTO>({
      query: creds => ({ url: '/auth/login', method: 'POST', data: creds }),
      invalidatesTags: ['Auth'],
    }),
    logout: builder.mutation<void, void>({
      query: () => ({ url: '/auth/logout', method: 'POST' }),
      invalidatesTags: ['Auth'],
    }),
    getCurrentUser: builder.query<UserDTO, void>({
      query: () => ({ url: '/users/me' }),
      providesTags: ['Auth'],
    }),
    getGroups: builder.query<GroupDTO[], void>({
      query: () => ({ url: '/groups' }),
      providesTags: ['Groups'],
    }),
    createGroup: builder.mutation<GroupDTO, GroupCreateDTO>({
      query: body => ({ url: '/groups', method: 'POST', data: body }),
      invalidatesTags: ['Groups'],
    }),
    getGroupDetails: builder.query<GroupDTO, string>({
      query: id => ({ url: `/groups/${id}` }),
      providesTags: ['Groups'],
    }),
    createExpense: builder.mutation<ExpenseDTO, { groupId: string; expense: ExpenseCreateDTO; idempotencyKey?: string }>({
      query: ({ groupId, expense, idempotencyKey }) => ({ url: `/groups/${groupId}/expenses`, method: 'POST', data: expense, idempotencyKey }),
      invalidatesTags: ['Expenses', 'Balances'],
    }),
    getGroupBalances: builder.query<BalanceDTO[], { groupId: string }>({
      query: ({ groupId }) => ({ url: `/groups/${groupId}/balances` }),
      providesTags: ['Balances'],
    }),
    getDashboardSummary: builder.query<DashboardSummaryDTO, { groupId?: string }>({
      query: ({ groupId } = {}) => ({ url: groupId ? `/dashboard/${groupId}/summary` : '/dashboard/summary' }),
      providesTags: ['Dashboard'],
    }),
    createSettlement: builder.mutation<SettlementDTO, { payload: any; idempotencyKey?: string }>({
      query: ({ payload, idempotencyKey }) => ({ url: '/settlements', method: 'POST', data: payload, idempotencyKey }),
      invalidatesTags: ['Settlements', 'Balances'],
    }),
  }),
});

export const {
  useRegisterMutation,
  useLoginMutation,
  useLogoutMutation,
  useGetCurrentUserQuery,
  useGetGroupsQuery,
  useCreateGroupMutation,
  useGetGroupDetailsQuery,
  useCreateExpenseMutation,
  useGetGroupBalancesQuery,
  useGetDashboardSummaryQuery,
  useCreateSettlementMutation,
} = apiSlice;
