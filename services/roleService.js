import apiClient from '@/lib/axios';

export const roleService = {
  getRoles: async () => {
    return await apiClient.get('/roles');
  },

  getRoleBySlug: async (slug) => {
    return await apiClient.get(`/roles/slug/${slug}`);
  },

  createRole: async (data) => {
    return await apiClient.post('/roles', data);
  },

  updateRole: async (id, data) => {
    return await apiClient.put(`/roles/${id}`, data);
  },

  deleteRole: async (id) => {
    return await apiClient.delete(`/roles/${id}`);
  }
};
