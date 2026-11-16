import api from '@/lib/axios';

export const salesService = {
  getSales: async (params = {}) => {
    const response = await api.get('/sales', { params });
    return response.data;
  },
  getSaleById: async (id) => {
    const response = await api.get(`/sales/${id}`);
    return response.data;
  },
  getNextNumber: async () => {
    try {
      const response = await api.get('/sales/next/number');
      return response.data;
    } catch (err) {
      const response = await api.get('/sales/next-number');
      return response.data;
    }
  },
  createSale: async (saleData) => {
    const response = await api.post('/sales', saleData);
    return response.data;
  },
  returnSale: async (id, returnData) => {
    const response = await api.post(`/sales/${id}/return`, returnData);
    return response.data;
  },
  deleteSale: async (id) => {
    const response = await api.delete(`/sales/${id}`);
    return response.data;
  },
  retryWhatsAppReceipt: async (id) => {
    const response = await api.post(`/sales/${id}/retry-whatsapp`);
    return response.data;
  },
  getSaleWhatsAppStatus: async (id) => {
    const response = await api.get(`/sales/${id}/whatsapp-status`);
    return response.data;
  }
};
