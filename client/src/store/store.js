import { configureStore, createSlice } from '@reduxjs/toolkit';

const initialAuth = {
  user: { name: 'Nora Merchant', role: 'business_admin', organizationId: 'demo-org' },
  token: null
};

const authSlice = createSlice({
  name: 'auth',
  initialState: initialAuth,
  reducers: {
    setSession: (state, action) => {
      state.user = action.payload.user;
      state.token = action.payload.accessToken;
    }
  }
});

const uiSlice = createSlice({
  name: 'ui',
  initialState: { theme: 'light', activeView: 'overview' },
  reducers: {
    toggleTheme: (state) => {
      state.theme = state.theme === 'light' ? 'dark' : 'light';
    },
    setActiveView: (state, action) => {
      state.activeView = action.payload;
    }
  }
});

export const { setSession } = authSlice.actions;
export const { toggleTheme, setActiveView } = uiSlice.actions;

export const store = configureStore({
  reducer: {
    auth: authSlice.reducer,
    ui: uiSlice.reducer
  }
});

