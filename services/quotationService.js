import api from '@/lib/axios';

export const quotationService = {
  getQuotations: async (params = {}) => {
    const response = await api.get('/quotations', { params });
    return response.data;
  },
  getMetrics: async () => {
    const response = await api.get('/quotations/metrics');
    return response.data;
  },
  getQuotationById: async (id) => {
    const response = await api.get(`/quotations/${id}`);
    return response.data;
  },
  createQuotation: async (data) => {
    const response = await api.post('/quotations', data);
    return response.data;
  },
  updateQuotation: async (id, data) => {
    const response = await api.put(`/quotations/${id}`, data);
    return response.data;
  },
  updateStatus: async (id, status) => {
    const response = await api.patch(`/quotations/${id}/status`, { status });
    return response.data;
  },
  convertToSale: async (id) => {
    const response = await api.post(`/quotations/${id}/convert-to-sale`);
    return response.data;
  },
  deleteQuotation: async (id) => {
    const response = await api.delete(`/quotations/${id}`);
    return response.data;
  }
};
