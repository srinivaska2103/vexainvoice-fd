import api from '@/lib/axios';

export const supplierService = {
  getSuppliers: async (params = {}) => {
    const response = await api.get('/suppliers', { params });
    return response.data;
  },
  getSupplierById: async (id) => {
    const response = await api.get(`/suppliers/${id}`);
    return response.data;
  },
  createSupplier: async (data) => {
    const response = await api.post('/suppliers', data);
    return response.data;
  },
  updateSupplier: async (id, data) => {
    const response = await api.put(`/suppliers/${id}`, data);
    return response.data;
  },
  deleteSupplier: async (id) => {
    const response = await api.delete(`/suppliers/${id}`);
    return response.data;
  },
  getSupplierLedger: async (id) => {
    const response = await api.get(`/suppliers/${id}/ledger`);
    return response.data;
  }
};
