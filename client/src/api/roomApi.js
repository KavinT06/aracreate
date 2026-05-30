import { axiosInstance } from './axiosInstance.js';

export const fetchRooms = async () => {
  const { data } = await axiosInstance.get('/rooms');
  return data.data;
};

export const createRoom = async (payload) => {
  const { data } = await axiosInstance.post('/rooms', payload);
  return data.data;
};

export const joinRoom = async (roomId) => {
  const { data } = await axiosInstance.post(`/rooms/${roomId}/join`);
  return data.data;
};
