import api from '@/lib/axios';

export const crmService = {
  getDashboardMetrics: async () => {
    const response = await api.get('/crm/dashboard');
    return response.data;
  },

  getCrmCustomers: async (params = {}) => {
    const response = await api.get('/crm/customers', { params });
    return response.data;
  },

  getCustomer360: async (customerId) => {
    const response = await api.get(`/crm/customers/${customerId}/360`);
    return response.data;
  },

  getFollowups: async (params = {}) => {
    const response = await api.get('/crm/followups', { params });
    return response.data;
  },

  createFollowup: async (data) => {
    const response = await api.post('/crm/followups', data);
    return response.data;
  },

  updateFollowup: async (id, data) => {
    const response = await api.patch(`/crm/followups/${id}`, data);
    return response.data;
  },

  deleteFollowup: async (id) => {
    const response = await api.delete(`/crm/followups/${id}`);
    return response.data;
  },

  createCustomerNote: async (data) => {
    const response = await api.post('/crm/notes', data);
    return response.data;
  },

  evaluateSegmentFilters: async (filterDefinition) => {
    const response = await api.post('/crm/segments/evaluate', filterDefinition);
    return response.data;
  },

  getSavedSegments: async () => {
    const response = await api.get('/crm/segments');
    return response.data;
  },

  createSavedSegment: async (data) => {
    const response = await api.post('/crm/segments', data);
    return response.data;
  },

  deleteSavedSegment: async (id) => {
    const response = await api.delete(`/crm/segments/${id}`);
    return response.data;
  },

  getProductInsights: async (params = {}) => {
    const response = await api.get('/crm/product-insights', { params });
    return response.data;
  }
};
