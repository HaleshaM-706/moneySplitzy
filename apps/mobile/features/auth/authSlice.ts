import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface AuthState {
  token?: string | null;
  refreshToken?: string | null;
  user?: { id: string; email: string; name?: string } | null;
  loading: boolean;
}

const initialState: AuthState = {
  token: null,
  refreshToken: null,
  user: null,
  loading: false,
};

const slice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setCredentials(
      state,
      action: PayloadAction<{ token: string; refreshToken?: string | null; user: any }>,
    ) {
      state.token = action.payload.token;
      state.refreshToken = action.payload.refreshToken ?? null;
      state.user = action.payload.user;
    },
    clearCredentials(state) {
      state.token = null;
      state.refreshToken = null;
      state.user = null;
    },
    setLoading(state, action: PayloadAction<boolean>) {
      state.loading = action.payload;
    },
  },
});

export const { setCredentials, clearCredentials, setLoading } = slice.actions;
export default slice.reducer;
