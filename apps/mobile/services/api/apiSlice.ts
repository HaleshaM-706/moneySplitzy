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
  GroupInvitationDTO,
  AddExistingGroupMemberDTO,
  AcceptGroupInvitationDTO,
  ExpenseDTO,
  ExpenseCreateDTO,
  BalanceDTO,
  SettlementDTO,
  DashboardSummaryDTO,
  ActivityDTO,
  SettlementCreateDTO,
  GroupActivityDTO,
  SimplifiedDebtDTO,
} from './types';

export const apiSlice = createApi({
  reducerPath: 'api',
  baseQuery: axiosBaseQuery({ baseUrl: API_BASE_URL }),
  tagTypes: ['Auth', 'Groups', 'Expenses', 'Balances', 'Settlements', 'Dashboard', 'GroupActivities'],
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
      providesTags: (_result, _error, id) => [{ type: 'Groups', id }],
    }),
    getGroupExpenses: builder.query<ExpenseDTO[], string>({
      query: groupId => ({ url: `/groups/${groupId}/expenses` }),
      providesTags: (_result, _error, groupId) => [{ type: 'Expenses', id: groupId }],
    }),
    getGroupActivities: builder.query<GroupActivityDTO[], string>({
      query: groupId => ({ url: `/groups/${groupId}/activities` }),
      providesTags: (_result, _error, groupId) => [{ type: 'GroupActivities', id: groupId }],
    }),
    getSimplifiedDebts: builder.query<SimplifiedDebtDTO[], string>({
      query: groupId => ({ url: `/groups/${groupId}/debts/simplified` }),
      providesTags: (_result, _error, groupId) => [{ type: 'Balances', id: groupId }],
    }),
    inviteGroupMember: builder.mutation<GroupInvitationDTO, { groupId: string; email: string }>({
      query: ({ groupId, email }) => ({
        url: `/groups/${groupId}/invitations`,
        method: 'POST',
        data: { email },
      }),
    }),
    addExistingGroupMember: builder.mutation<AddExistingGroupMemberDTO, { groupId: string; email: string }>({
      query: ({ groupId, email }) => ({
        url: `/groups/${groupId}/members`,
        method: 'POST',
        data: { email },
      }),
      invalidatesTags: ['Groups'],
    }),
    acceptGroupInvitation: builder.mutation<AcceptGroupInvitationDTO, string>({
      query: token => ({ url: `/groups/invitations/${token}/accept`, method: 'POST' }),
      invalidatesTags: ['Groups'],
    }),
    createExpense: builder.mutation<ExpenseDTO, { groupId: string; expense: ExpenseCreateDTO; idempotencyKey?: string }>({
      query: ({ groupId, expense, idempotencyKey }) => ({ url: `/groups/${groupId}/expenses`, method: 'POST', data: expense, idempotencyKey }),
      invalidatesTags: (_result, _error, { groupId }) => [
        'Groups',
        { type: 'Expenses', id: groupId },
        { type: 'Balances', id: groupId },
        { type: 'GroupActivities', id: groupId },
      ],
    }),
    getGroupBalances: builder.query<BalanceDTO[], { groupId: string }>({
      query: ({ groupId }) => ({ url: `/groups/${groupId}/balances` }),
      providesTags: (_result, _error, { groupId }) => [{ type: 'Balances', id: groupId }],
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
      invalidatesTags: (_result, _error, { payload }) => [
        'Settlements',
        'Groups',
        { type: 'Balances', id: payload.groupId },
        { type: 'GroupActivities', id: payload.groupId },
      ],
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
  useGetGroupExpensesQuery,
  useGetGroupActivitiesQuery,
  useGetSimplifiedDebtsQuery,
  useInviteGroupMemberMutation,
  useAddExistingGroupMemberMutation,
  useAcceptGroupInvitationMutation,
  useCreateExpenseMutation,
  useGetGroupBalancesQuery,
  useGetDashboardSummaryQuery,
  useGetActivityQuery,
  useCreateSettlementMutation,
} = apiSlice;
