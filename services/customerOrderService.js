import api from '@/lib/axios';

export const customerOrderService = {
  // Public customer submission
  submitOrder: async (shopSlug, orderData) => {
    const res = await api.post(`/shop/${encodeURIComponent(shopSlug)}/order`, orderData);
    return res.data;
  },

  // ADMIN-only order queries
  getOrders: async (params = {}) => {
    const res = await api.get('/customer-orders', { params });
    return res.data;
  },

  getOrderById: async (id) => {
    const res = await api.get(`/customer-orders/${id}`);
    return res.data;
  },

  updateStatus: async (id, data) => {
    const res = await api.patch(`/customer-orders/${id}/status`, data);
    return res.data;
  },

  linkSale: async (id, saleId) => {
    const res = await api.post(`/customer-orders/${id}/link-sale`, { saleId });
    return res.data;
  }
};
