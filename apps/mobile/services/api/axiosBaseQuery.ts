import type { BaseQueryFn } from '@reduxjs/toolkit/query';
import axios, { AxiosRequestConfig, AxiosError } from 'axios';
import { apiClient, bareClient } from './apiClient';
import type { RootState } from '../../app/store/store';
import { setCredentials, clearCredentials } from '../../features/auth/authSlice';

type AxiosBaseQueryArgs = {
  url: string;
  method?: AxiosRequestConfig['method'];
  data?: any;
  params?: any;
  headers?: Record<string, string>;
  idempotencyKey?: string;
};

let refreshingPromise: Promise<string | null> | null = null;

const refreshToken = async (getState: () => RootState, dispatch: any) => {
  const state = getState();
  const current = state.auth;
  if (!current?.refreshToken) return null;

  if (refreshingPromise) return refreshingPromise;

  refreshingPromise = (async () => {
    try {
      const resp = await bareClient.post('/auth/refreshToken', { refreshToken: current.refreshToken });
      const data = resp.data;
      if (data?.token) {
        dispatch(setCredentials({ token: data.token, refreshToken: data.refreshToken ?? null, user: data.user ?? null }));
        return data.token as string;
      }
      dispatch(clearCredentials());
      return null;
    } catch (e) {
      dispatch(clearCredentials());
      return null;
    } finally {
      refreshingPromise = null;
    }
  })();

  return refreshingPromise;
};

export const axiosBaseQuery = ({ baseUrl }: { baseUrl: string } = { baseUrl: '' }): BaseQueryFn<AxiosBaseQueryArgs, unknown, unknown> =>
  async (args, api, extraOptions) => {
    const { url, method = 'GET', data, params, headers = {}, idempotencyKey } = args;
    const token = (api.getState() as RootState).auth.token;

    const config: AxiosRequestConfig = {
      url: baseUrl + url,
      method,
      data,
      params,
      headers: { ...headers },
      signal: api.signal as AbortSignal,
    };

    if (token) config.headers = { ...(config.headers || {}), authorization: `Bearer ${token}` };
    if (idempotencyKey) config.headers = { ...(config.headers || {}), 'Idempotency-Key': idempotencyKey };

    try {
      const result = await apiClient.request(config);
      return { data: result.data };
    } catch (error) {
      const axiosError = error as AxiosError;
      if (!axiosError.response) {
        return { error: { status: 'FETCH_ERROR', data: axiosError.message } } as any;
      }

      const status = axiosError.response.status;
      if (status === 401) {
        const newToken = await refreshToken(api.getState as () => RootState, api.dispatch);
        if (newToken) {
          try {
            const retryConfig: AxiosRequestConfig = {
              ...config,
              headers: { ...(config.headers || {}), authorization: `Bearer ${newToken}` },
            };
            const retryResult = await apiClient.request(retryConfig);
            return { data: retryResult.data };
          } catch (retryErr) {
            return { error: { status: (retryErr as any)?.response?.status ?? 500, data: retryErr } } as any;
          }
        }
        return { error: { status: 401, data: 'Unauthorized' } } as any;
      }

      return { error: { status, data: axiosError.response.data } } as any;
    }
  };

export default axiosBaseQuery;
