import api from '@/lib/axios';

export const stockService = {
  getStock: async (params = {}) => {
    const response = await api.get('/stock', { params });
    return response.data;
  },
  getBalances: async (params = {}) => {
    const response = await api.get('/stock', { params });
    return response.data;
  },
  getLowStock: async () => {
    const response = await api.get('/stock/low');
    return response.data;
  },
  getOutOfStock: async () => {
    const response = await api.get('/stock/out-of-stock');
    return response.data;
  },
  getTransactions: async (params = {}) => {
    const response = await api.get('/stock/transactions', { params });
    return response.data;
  },
  createAdjustment: async (data) => {
    const response = await api.post('/stock/adjustment', data);
    return response.data;
  }
};
