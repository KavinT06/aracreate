import { axiosInstance } from './axiosInstance.js';

export const fetchMessages = async (roomId) => {
  const { data } = await axiosInstance.get(`/messages/${roomId}`);
  return data.data;
};
