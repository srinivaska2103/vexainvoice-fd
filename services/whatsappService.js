import api from '@/lib/axios';

export const whatsappService = {
  // Get Company WhatsApp Connection Status
  getConnection: async () => {
    const response = await api.get('/whatsapp/connection');
    return response;
  },

  // Connect / Update WhatsApp Business Account
  connectAccount: async ({ phoneNumberId, wabaId, displayPhoneNumber, verifiedName, accessToken }) => {
    const response = await api.post('/whatsapp/connect', {
      phoneNumberId,
      wabaId,
      displayPhoneNumber,
      verifiedName,
      accessToken
    });
    return response;
  },

  // Send Test Message
  sendTestMessage: async (recipientPhone) => {
    const response = await api.post('/whatsapp/test-message', { recipientPhone });
    return response;
  },

  // Disconnect WhatsApp Business Account
  disconnectAccount: async () => {
    const response = await api.post('/whatsapp/disconnect');
    return response;
  },

  // Get Wallet Details (Balance, Reserved, Low Balance Alert)
  getWallet: async () => {
    const response = await api.get('/whatsapp/wallet');
    return response;
  },

  // Add Credits to Wallet
  addCredits: async ({ amount, reference, description }) => {
    const response = await api.post('/whatsapp/wallet/topup', { amount, reference, description });
    return response;
  },

  // Create Razorpay order for wallet recharge
  createRechargeOrder: async (amount) => {
    const response = await api.post('/whatsapp/wallet/recharge/order', { amount });
    return response.data || response;
  },

  // Verify Razorpay payment and credit wallet
  verifyRechargePayment: async (data) => {
    const response = await api.post('/whatsapp/wallet/recharge/verify', data);
    return response.data || response;
  },

  // Get Wallet Transaction Ledger History
  getTransactions: async (params = {}) => {
    const response = await api.get('/whatsapp/wallet/transactions', { params });
    return response;
  },

  // Estimate Campaign Cost & Wallet Check
  estimateCampaign: async ({ name, category, audienceFilter }) => {
    const response = await api.post('/whatsapp/campaigns/estimate', { name, category, audienceFilter });
    return response;
  },

  // Create & Launch Campaign
  createCampaign: async ({ name, templateName, category, audienceFilter }) => {
    const response = await api.post('/whatsapp/campaigns', { name, templateName, category, audienceFilter });
    return response;
  },

  // List Business Campaigns
  listCampaigns: async (params = {}) => {
    const response = await api.get('/whatsapp/campaigns', { params });
    return response;
  },

  // Cancel Queued Campaign
  cancelCampaign: async (id) => {
    const response = await api.post(`/whatsapp/campaigns/${id}/cancel`);
    return response;
  },

  // List Authenticated Company WhatsApp Messages
  listMessages: async (params = {}) => {
    const response = await api.get('/whatsapp/messages', { params });
    return response;
  },

  // Get Meta Template Live Approval Statuses
  getTemplatesStatus: async () => {
    const response = await api.get('/whatsapp/templates/status');
    return response;
  },

  // Get Active Pricing Rates
  getRates: async () => {
    const response = await api.get('/whatsapp/rates');
    return response;
  },

  // Update Platform Rates (Admin Only)
  updateRates: async (rates) => {
    const response = await api.put('/whatsapp/rates', { rates });
    return response;
  }
};
