import apiClient from '@/lib/axios';

export const authService = {
  sendOtp: async (email, name, registrationPayload = null) => {
    const payload = registrationPayload ? { ...registrationPayload, email, admin_name: name } : { email, name };
    return await apiClient.post('/auth/send-otp', payload);
  },

  verifyOtp: async (emailOrPayload, otp, registrationData = null) => {
    let payload;
    if (typeof emailOrPayload === 'object' && emailOrPayload !== null) {
      payload = emailOrPayload;
    } else {
      payload = { email: emailOrPayload, otp, registrationData };
    }
    return await apiClient.post('/auth/verify-otp', payload);
  },

  register: async (payload) => {
    return await apiClient.post('/auth/register', payload);
  },

  login: async (email, password, roleSlug = null) => {
    return await apiClient.post('/auth/login', {
      email,
      password,
      ...(roleSlug ? { role_slug: roleSlug } : {})
    });
  },

  forgotPassword: async (email) => {
    return await apiClient.post('/auth/forgot-password', { email });
  },

  resetPassword: async (email, otp, newPassword) => {
    return await apiClient.post('/auth/reset-password', { email, otp, new_password: newPassword });
  },

  getMe: async () => {
    return await apiClient.get('/auth/me');
  },

  updateProfile: async (data) => {
    return await apiClient.put('/auth/profile', data);
  },

  updateBusiness: async (data) => {
    return await apiClient.put('/auth/business', data);
  },

  updateBusinessDetails: async (data) => {
    return await apiClient.put('/auth/business', data);
  },

  logout: async () => {
    return await apiClient.post('/auth/logout');
  }
};
