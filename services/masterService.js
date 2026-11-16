import api from '@/lib/axios';

export const masterService = {
  getCategories: async () => {
    const response = await api.get('/categories');
    return response.data;
  },
  createCategory: async (data) => {
    const response = await api.post('/categories', data);
    return response.data;
  },
  getBrands: async () => {
    const response = await api.get('/brands');
    return response.data;
  },
  createBrand: async (data) => {
    const response = await api.post('/brands', data);
    return response.data;
  },
  deleteBrand: async (id) => {
    const response = await api.delete(`/brands/${id}`);
    return response.data;
  },
  getColors: async () => {
    const response = await api.get('/colors');
    return response.data;
  },
  createColor: async (data) => {
    const response = await api.post('/colors', data);
    return response.data;
  },
  deleteColor: async (id) => {
    const response = await api.delete(`/colors/${id}`);
    return response.data;
  },
  getSizes: async () => {
    const response = await api.get('/sizes');
    return response.data;
  },
  createSize: async (data) => {
    const response = await api.post('/sizes', data);
    return response.data;
  },
  deleteSize: async (id) => {
    const response = await api.delete(`/sizes/${id}`);
    return response.data;
  },
  deleteCategory: async (id) => {
    const response = await api.delete(`/categories/${id}`);
    return response.data;
  }
};
