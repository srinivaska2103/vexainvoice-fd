import axios from 'axios';
import { getApiBaseUrl } from '@/lib/axios';

const getBase = () => getApiBaseUrl();

const createPortalClient = (shopSlug) => {
  const tokenKey = `vexa_customer_token_${shopSlug}`;
  const token = typeof window !== 'undefined' ? localStorage.getItem(tokenKey) : null;

  return axios.create({
    baseURL: `${getBase()}/portal/${shopSlug}`,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {})
    }
  });
};

export const portalService = {
  // Public company & portal info
  getPortalInfo: async (shopSlug) => {
    const res = await axios.get(`${getBase()}/portal/${shopSlug}/info`);
    return res.data;
  },

  // Customer Sign In (by Phone or Email)
  loginCustomer: async (shopSlug, payload) => {
    const res = await axios.post(`${getBase()}/portal/${shopSlug}/auth/login`, payload);
    const data = res.data?.data || res.data;
    if (data?.token && typeof window !== 'undefined') {
      localStorage.setItem(`vexa_customer_token_${shopSlug}`, data.token);
      localStorage.setItem(`vexa_customer_profile_${shopSlug}`, JSON.stringify(data.customer));
    }
    return res.data;
  },

  // Customer Sign Out
  logoutCustomer: (shopSlug) => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem(`vexa_customer_token_${shopSlug}`);
      localStorage.removeItem(`vexa_customer_profile_${shopSlug}`);
    }
  },

  // Retrieve stored customer profile
  getCurrentStoredCustomer: (shopSlug) => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem(`vexa_customer_profile_${shopSlug}`);
      if (stored) {
        try {
          return JSON.parse(stored);
        } catch (e) {}
      }
    }
    return null;
  },

  // Authenticated profile
  getProfile: async (shopSlug) => {
    const client = createPortalClient(shopSlug);
    const res = await client.get('/me');
    return res.data;
  },

  // Update profile
  updateProfile: async (shopSlug, data) => {
    const client = createPortalClient(shopSlug);
    const res = await client.put('/me', data);
    return res.data;
  },

  // Invoices list
  getInvoices: async (shopSlug) => {
    const client = createPortalClient(shopSlug);
    const res = await client.get('/invoices');
    return res.data;
  },

  // Single invoice details
  getInvoiceById: async (shopSlug, invoiceId) => {
    const client = createPortalClient(shopSlug);
    const res = await client.get(`/invoices/${invoiceId}`);
    return res.data;
  },

  // Quotations list
  getQuotations: async (shopSlug) => {
    const client = createPortalClient(shopSlug);
    const res = await client.get('/quotations');
    return res.data;
  },

  // Payment receipts list
  getPayments: async (shopSlug) => {
    const client = createPortalClient(shopSlug);
    const res = await client.get('/payments');
    return res.data;
  },

  // Customer Ledger
  getLedger: async (shopSlug) => {
    const client = createPortalClient(shopSlug);
    const res = await client.get('/ledger');
    return res.data;
  },

  // Customer Orders list
  getOrders: async (shopSlug) => {
    const client = createPortalClient(shopSlug);
    const res = await client.get('/orders');
    return res.data;
  }
};

