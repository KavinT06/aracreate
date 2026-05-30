import { create } from 'zustand';
import { fetchMessages } from '../api/messageApi.js';

export const useMessageStore = create((set) => ({
  messages: [],
  isLoading: false,
  error: null,

  loadMessages: async (roomId) => {
    set({ isLoading: true, messages: [], error: null });
    try {
      const messages = await fetchMessages(roomId);
      set({ messages, isLoading: false });
    } catch (err) {
      set({
        error: err.response?.data?.message || 'Failed to load messages',
        isLoading: false,
      });
    }
  },

  appendMessage: (message) =>
    set((state) => ({ messages: [...state.messages, message] })),

  clearMessages: () => set({ messages: [], error: null }),
}));
