import { axiosInstance } from './axiosInstance.js';

export const registerUser = async (payload) => {
  const { data } = await axiosInstance.post('/auth/register', payload);
  return data.data;
};

export const loginUser = async (payload) => {
  const { data } = await axiosInstance.post('/auth/login', payload);
  return data.data;
};

export const getCurrentUser = async () => {
  const { data } = await axiosInstance.get('/auth/me');
  return data.data;
};
