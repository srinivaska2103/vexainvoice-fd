import api from '@/lib/axios';

export const userService = {
  getUsers: async () => {
    const response = await api.get('/users');
    return response;
  },
  getUserById: async (id) => {
    const response = await api.get(`/users/${id}`);
    return response;
  },
  createUser: async (data) => {
    const response = await api.post('/users', data);
    return response;
  },
  updateUser: async (id, data) => {
    const response = await api.put(`/users/${id}`, data);
    return response;
  },
  deleteUser: async (id) => {
    const response = await api.delete(`/users/${id}`);
    return response;
  }
};
