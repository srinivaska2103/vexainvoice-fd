import api from '@/lib/axios';

export const emailService = {
  // Test SMTP Email Configuration (ADMIN only)
  sendTestEmail: async (email) => {
    const response = await api.post('/email/test', { email });
    return response;
  },

  // Get Business Email Logs / History
  getEmailLogs: async (params = {}) => {
    const response = await api.get('/email/logs', { params });
    return response;
  },

  // Manual Resend Sale Invoice Email
  resendSaleInvoice: async (saleId) => {
    const response = await api.post(`/email/resend/sale/${saleId}`);
    return response;
  },

  // Manual Resend Supplier Purchase Email
  resendPurchaseOrder: async (purchaseId) => {
    const response = await api.post(`/email/resend/purchase/${purchaseId}`);
    return response;
  },

  // Retry Failed Email
  retryEmail: async (logId) => {
    const response = await api.post(`/email/retry/${logId}`);
    return response;
  },

  // Get Automatic Email Preferences
  getEmailSettings: async () => {
    const response = await api.get('/email/settings');
    return response;
  },

  // Update Automatic Email Preferences
  updateEmailSettings: async (settings) => {
    const response = await api.put('/email/settings', settings);
    return response;
  },

  // Get Email Message Templates
  getEmailTemplates: async () => {
    const response = await api.get('/email/templates');
    return response;
  },

  // Update Email Message Templates
  updateEmailTemplates: async (templates) => {
    const response = await api.put('/email/templates', { templates });
    return response;
  },

  // Get Business Campaigns
  getCampaigns: async () => {
    const response = await api.get('/email/campaigns');
    return response;
  },

  // Create & Dispatch Email Campaign
  createCampaign: async (campaignData) => {
    const response = await api.post('/email/campaigns', campaignData);
    return response;
  },

  // Get SMTP Status
  getEmailStatus: async () => {
    const response = await api.get('/email/status');
    return response;
  },

  // Trigger Low Stock Alert Email Immediately
  triggerLowStockAlert: async () => {
    const response = await api.post('/email/trigger-low-stock');
    return response;
  }
};
