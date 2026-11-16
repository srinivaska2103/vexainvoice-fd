import api from '@/lib/axios';

const extractData = (res) => {
  if (res && res.data !== undefined) return res.data;
  return res || [];
};

export const supportService = {
  // Help Center
  getHelpCategories: async (search = '') => {
    const q = search ? `?search=${encodeURIComponent(search)}` : '';
    const res = await api.get(`/support/help/categories${q}`);
    return extractData(res);
  },

  getFeaturedGuides: async () => {
    const res = await api.get('/support/help/featured');
    return extractData(res);
  },

  getLatestGuides: async () => {
    const res = await api.get('/support/help/latest');
    return extractData(res);
  },

  getArticleBySlug: async (slug) => {
    const res = await api.get(`/support/help/articles/${slug}`);
    return extractData(res);
  },

  recordArticleFeedback: async (slug, isHelpful) => {
    const res = await api.post(`/support/help/articles/${slug}/feedback`, { isHelpful });
    return res;
  },

  getFaqs: async (category = '', search = '') => {
    const params = new URLSearchParams();
    if (category && category !== 'ALL') params.append('category', category);
    if (search && search.trim()) params.append('search', search.trim());
    const q = params.toString() ? `?${params.toString()}` : '';
    const res = await api.get(`/support/help/faqs${q}`);
    return extractData(res);
  },

  recordFaqFeedback: async (id, isHelpful) => {
    const res = await api.post(`/support/help/faqs/${id}/feedback`, { isHelpful });
    return res;
  },

  // Support Tickets
  createTicket: async (ticketData) => {
    const res = await api.post('/support/tickets', ticketData);
    return res;
  },

  getMyTickets: async (filters = {}) => {
    const params = new URLSearchParams();
    if (filters.status && filters.status !== 'ALL') params.append('status', filters.status);
    if (filters.priority && filters.priority !== 'ALL') params.append('priority', filters.priority);
    if (filters.search) params.append('search', filters.search);
    const q = params.toString() ? `?${params.toString()}` : '';
    const res = await api.get(`/support/tickets${q}`);
    return extractData(res);
  },

  getTicketDetails: async (id) => {
    const res = await api.get(`/support/tickets/${id}`);
    return extractData(res);
  },

  replyTicket: async (id, payload) => {
    const res = await api.post(`/support/tickets/${id}/reply`, payload);
    return res;
  },

  closeTicket: async (id) => {
    const res = await api.post(`/support/tickets/${id}/close`);
    return res;
  },

  getAttachmentDownloadUrl: (attachmentId) => {
    return `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api'}/support/attachments/${attachmentId}/download`;
  },

  // Super Admin Ticket Management
  getSuperAdminTickets: async (filters = {}) => {
    const params = new URLSearchParams();
    if (filters.status && filters.status !== 'ALL') params.append('status', filters.status);
    if (filters.priority && filters.priority !== 'ALL') params.append('priority', filters.priority);
    if (filters.category && filters.category !== 'ALL') params.append('category', filters.category);
    if (filters.search) params.append('search', filters.search);
    const q = params.toString() ? `?${params.toString()}` : '';
    const res = await api.get(`/super-admin/support/tickets${q}`);
    return res;
  },

  getSuperAdminTicketDetails: async (id) => {
    const res = await api.get(`/super-admin/support/tickets/${id}`);
    return extractData(res);
  },

  updateSuperAdminTicket: async (id, actionData) => {
    const res = await api.put(`/super-admin/support/tickets/${id}`, actionData);
    return res;
  },

  // Super Admin Article Management
  getSuperAdminArticles: async (filters = {}) => {
    const params = new URLSearchParams();
    if (filters.categoryId && filters.categoryId !== 'ALL') params.append('categoryId', filters.categoryId);
    if (filters.status && filters.status !== 'ALL') params.append('status', filters.status);
    if (filters.search) params.append('search', filters.search);
    const q = params.toString() ? `?${params.toString()}` : '';
    const res = await api.get(`/super-admin/help/articles${q}`);
    return extractData(res);
  },

  createSuperAdminArticle: async (articleData) => {
    const res = await api.post('/super-admin/help/articles', articleData);
    return res;
  },

  updateSuperAdminArticle: async (id, articleData) => {
    const res = await api.put(`/super-admin/help/articles/${id}`, articleData);
    return res;
  },

  deleteSuperAdminArticle: async (id) => {
    const res = await api.delete(`/super-admin/help/articles/${id}`);
    return res;
  },

  // Super Admin FAQ Management
  createSuperAdminFaq: async (faqData) => {
    const res = await api.post('/super-admin/help/faqs', faqData);
    return res;
  },

  updateSuperAdminFaq: async (id, faqData) => {
    const res = await api.put(`/super-admin/help/faqs/${id}`, faqData);
    return res;
  },

  deleteSuperAdminFaq: async (id) => {
    const res = await api.delete(`/super-admin/help/faqs/${id}`);
    return res;
  }
};
