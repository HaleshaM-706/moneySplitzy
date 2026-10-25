import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import type { UserDTO } from '../../services/api/types';

interface AuthState {
  token?: string | null;
  refreshToken?: string | null;
  user?: UserDTO | null;
  loading: boolean;
  isCheckingSession: boolean;
}

const initialState: AuthState = {
  token: null,
  refreshToken: null,
  user: null,
  loading: false,
  isCheckingSession: true,
};

const slice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setCredentials(
      state,
      action: PayloadAction<{ token: string; refreshToken?: string | null; user: UserDTO }>,
    ) {
      state.token = action.payload.token;
      state.refreshToken = action.payload.refreshToken ?? null;
      state.user = action.payload.user;
      state.isCheckingSession = false;
    },
    clearCredentials(state) {
      state.token = null;
      state.refreshToken = null;
      state.user = null;
      state.isCheckingSession = false;
    },
    setSessionChecked(state) {
      state.isCheckingSession = false;
    },
    setLoading(state, action: PayloadAction<boolean>) {
      state.loading = action.payload;
    },
  },
});

export const { setCredentials, clearCredentials, setLoading, setSessionChecked } = slice.actions;
export default slice.reducer;
