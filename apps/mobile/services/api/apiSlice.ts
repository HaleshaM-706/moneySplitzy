import { createApi } from '@reduxjs/toolkit/query/react';
import { axiosBaseQuery } from './axiosBaseQuery';
import { API_BASE_URL } from './apiClient';
import type {
  UserDTO,
  AuthResponseDTO,
  RegisterDTO,
  LoginDTO,
  GroupDTO,
  GroupDetailsDTO,
  GroupCreateDTO,
  ExpenseDTO,
  ExpenseCreateDTO,
  BalanceDTO,
  SettlementDTO,
  DashboardSummaryDTO,
  ActivityDTO,
  SettlementCreateDTO,
} from './types';

export const apiSlice = createApi({
  reducerPath: 'api',
  baseQuery: axiosBaseQuery({ baseUrl: API_BASE_URL }),
  tagTypes: ['Auth', 'Groups', 'Expenses', 'Balances', 'Settlements', 'Dashboard'],
  endpoints: builder => ({
    register: builder.mutation<AuthResponseDTO, RegisterDTO>({
      query: creds => ({ url: '/auth/register', method: 'POST', data: creds }),
      invalidatesTags: ['Auth'],
    }),
    login: builder.mutation<AuthResponseDTO, LoginDTO>({
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
    getGroupDetails: builder.query<GroupDetailsDTO, string>({
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
    getActivity: builder.query<ActivityDTO[], void>({
      query: () => ({ url: '/activity' }),
      providesTags: ['Expenses'],
    }),
    createSettlement: builder.mutation<SettlementDTO, { payload: SettlementCreateDTO; idempotencyKey?: string }>({
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
  useGetActivityQuery,
  useCreateSettlementMutation,
} = apiSlice;
