import { io } from 'socket.io-client';
import { useMessageStore } from '../store/useMessageStore.js';

let socket = null;
const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || window.location.origin;

export const getSocket = () => socket;

export const connectSocket = (token) => {
  if (socket?.connected) return socket;

  socket = io(SOCKET_URL, {
    auth: { token },
    reconnection: true,
    reconnectionAttempts: 5,
    reconnectionDelay: 1000,
  });

  return socket;
};

export const bindSocketEvents = (socketInstance) => {
  socketInstance.off('receive_message');
  socketInstance.on('receive_message', (message) => {
    useMessageStore.getState().appendMessage(message);
  });

  socketInstance.off('error');
  socketInstance.on('error', ({ message }) => {
    console.error('Socket error:', message);
  });
};

export const disconnectSocket = () => {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
};
