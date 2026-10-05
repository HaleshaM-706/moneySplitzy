import { store } from '../../app/store/store';
import { axiosBaseQuery } from './axiosBaseQuery';
import type { RegisterDTO, LoginDTO, GroupCreateDTO, ExpenseCreateDTO } from './types';

const baseQuery = axiosBaseQuery({ baseUrl: process.env.API_URL || 'http://localhost:3000' });

const apiContext = {
  dispatch: store.dispatch,
  getState: store.getState,
  extra: undefined,
  signal: undefined as any,
  abort: () => undefined,
  endpoint: '',
  type: 'query' as const,
};

export const authService = {
  register: async (payload: RegisterDTO) => {
    const res: any = await baseQuery({ url: '/auth/register', method: 'POST', data: payload }, apiContext, {} as any);
    if (res.error) throw res.error;
    return res.data;
  },
  login: async (payload: LoginDTO) => {
    const res: any = await baseQuery({ url: '/auth/login', method: 'POST', data: payload }, apiContext, {} as any);
    if (res.error) throw res.error;
    return res.data;
  },
  logout: async () => {
    const res: any = await baseQuery({ url: '/auth/logout', method: 'POST' }, apiContext, {} as any);
    if (res.error) throw res.error;
    return res.data;
  },
};

export const groupsService = {
  getGroups: async () => {
    const res: any = await baseQuery({ url: '/groups', method: 'GET' }, apiContext, {} as any);
    if (res.error) throw res.error;
    return res.data;
  },
  createGroup: async (payload: GroupCreateDTO) => {
    const res: any = await baseQuery({ url: '/groups', method: 'POST', data: payload }, apiContext, {} as any);
    if (res.error) throw res.error;
    return res.data;
  },
};

export const expensesService = {
  createExpense: async (groupId: string, payload: ExpenseCreateDTO, idempotencyKey?: string) => {
    const res: any = await baseQuery({ url: `/groups/${groupId}/expenses`, method: 'POST', data: payload, idempotencyKey }, apiContext, {} as any);
    if (res.error) throw res.error;
    return res.data;
  },
};

export default { authService, groupsService, expensesService };
