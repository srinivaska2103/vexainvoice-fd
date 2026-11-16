import apiClient from '@/lib/axios';

export const subscriptionService = {
  getPlans: () => apiClient.get('/subscription/plans'),
  getCompanyStatus: () => apiClient.get('/subscription/my-status'),
  getMyStatus: () => apiClient.get('/subscription/my-status'),
  subscribe: (plan = 'STARTER') => apiClient.post('/subscription/subscribe', { plan }),
  verifySubscription: (payload) => apiClient.post('/subscription/verify', typeof payload === 'string' ? { subscription_id: payload } : payload),
  cancelSubscription: (reason) => apiClient.post('/subscription/cancel', { reason }),
  purchaseLifetime: () => apiClient.post('/subscription/purchase-lifetime'),
  verifyLifetime: (payload) => apiClient.post('/subscription/verify-lifetime', typeof payload === 'string' ? { orderId: payload } : payload),
  getPaymentHistory: () => apiClient.get('/subscription/payment-history'),
  submitSalesEnquiry: (data) => apiClient.post('/sales-enquiry/enquiries', data)
};
