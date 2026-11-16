import api from '@/lib/axios';

export const reportService = {
  getDashboardSummary: async () => {
    const response = await api.get('/reports/dashboard');
    return response.data;
  },
  getSalesReport: async (params = {}) => {
    const response = await api.get('/reports/sales', { params });
    return response.data;
  },
  getPurchaseReport: async (params = {}) => {
    const response = await api.get('/reports/purchases', { params });
    return response.data;
  },
  getStockValuationReport: async () => {
    const response = await api.get('/reports/stock/valuation');
    return response.data;
  },
  getCustomersOutstandingReport: async () => {
    const response = await api.get('/reports/customers/outstanding');
    return response.data;
  },
  getSuppliersOutstandingReport: async () => {
    const response = await api.get('/reports/suppliers/outstanding');
    return response.data;
  }
};
