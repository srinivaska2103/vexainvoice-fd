import api from '@/lib/axios';

export const paymentService = {
  getCustomerPayments: async (params = {}) => {
    const response = await api.get('/payments/customer', { params });
    return response.data;
  },
  createCustomerPayment: async (data) => {
    const response = await api.post('/payments/customer', data);
    return response.data;
  },
  getSupplierPayments: async (params = {}) => {
    const response = await api.get('/payments/supplier', { params });
    return response.data;
  },
  createSupplierPayment: async (data) => {
    const response = await api.post('/payments/supplier', data);
    return response.data;
  }
};
