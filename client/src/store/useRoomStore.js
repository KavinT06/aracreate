import { create } from 'zustand';
import {
  fetchRooms as fetchRoomsApi,
  createRoom as createRoomApi,
  joinRoom as joinRoomApi,
} from '../api/roomApi.js';

export const useRoomStore = create((set) => ({
  rooms: [],
  activeRoom: null,
  isLoading: false,
  error: null,

  loadRooms: async () => {
    set({ isLoading: true, error: null });
    try {
      const rooms = await fetchRoomsApi();
      set({ rooms, isLoading: false });
    } catch (err) {
      set({
        error: err.response?.data?.message || 'Failed to load rooms',
        isLoading: false,
      });
    }
  },

  createRoom: async (payload) => {
    set({ isLoading: true, error: null });
    try {
      const room = await createRoomApi(payload);
      set((state) => ({ rooms: [room, ...state.rooms], isLoading: false }));
      return room;
    } catch (err) {
      set({
        error: err.response?.data?.message || 'Failed to create room',
        isLoading: false,
      });
      return null;
    }
  },

  joinRoomById: async (roomId) => {
    set({ isLoading: true, error: null });
    try {
      const room = await joinRoomApi(roomId);
      set({ isLoading: false });
      return room;
    } catch (err) {
      set({
        error: err.response?.data?.message || 'Failed to join room',
        isLoading: false,
      });
      return null;
    }
  },

  setActiveRoom: (room) => set({ activeRoom: room }),
  clearActiveRoom: () => set({ activeRoom: null }),
}));
