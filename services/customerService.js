import api from '@/lib/axios';

export const customerService = {
  getCustomers: async (params = {}) => {
    const response = await api.get('/customers', { params });
    return response.data;
  },
  getCustomerById: async (id) => {
    const response = await api.get(`/customers/${id}`);
    return response.data;
  },
  createCustomer: async (data) => {
    const payload = {
      ...data,
      ...(data.opening_balance !== undefined ? { opening_balance: parseFloat(data.opening_balance || 0) } : {}),
      ...(data.openingBalance !== undefined ? { openingBalance: parseFloat(data.openingBalance || 0) } : {})
    };
    const response = await api.post('/customers', payload);
    return response.data;
  },
  updateCustomer: async (id, data) => {
    const response = await api.put(`/customers/${id}`, data);
    return response.data;
  },
  deleteCustomer: async (id) => {
    const response = await api.delete(`/customers/${id}`);
    return response.data;
  },
  getCustomerLedger: async (id) => {
    const response = await api.get(`/customers/${id}/ledger`);
    return response.data;
  }
};
