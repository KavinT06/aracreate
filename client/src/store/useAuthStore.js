import { create } from 'zustand';
import { loginUser, registerUser, getCurrentUser } from '../api/authApi.js';

export const useAuthStore = create((set, get) => ({
  user: null,
  token: localStorage.getItem('token') || null,
  isLoading: false,
  error: null,

  loadUser: async () => {
    const token = get().token;
    if (!token) return;

    set({ isLoading: true, error: null });
    try {
      const user = await getCurrentUser();
      set({ user, isLoading: false });
    } catch (err) {
      localStorage.removeItem('token');
      set({
        user: null,
        token: null,
        isLoading: false,
        error: err.response?.data?.message || 'Failed to load user',
      });
    }
  },

  login: async (credentials) => {
    set({ isLoading: true, error: null });
    try {
      const { user, token } = await loginUser(credentials);
      localStorage.setItem('token', token);
      set({ user, token, isLoading: false });
    } catch (err) {
      set({
        error: err.response?.data?.message || 'Login failed',
        isLoading: false,
      });
    }
  },

  register: async (payload) => {
    set({ isLoading: true, error: null });
    try {
      const { user, token } = await registerUser(payload);
      localStorage.setItem('token', token);
      set({ user, token, isLoading: false });
    } catch (err) {
      set({
        error: err.response?.data?.message || 'Registration failed',
        isLoading: false,
      });
    }
  },

  logout: () => {
    localStorage.removeItem('token');
    set({ user: null, token: null });
  },
}));
