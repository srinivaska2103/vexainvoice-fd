import api from '@/lib/axios';

export const productService = {
  getProducts: async (params = {}) => {
    const response = await api.get('/products', { params });
    return response.data;
  },
  getProductById: async (id) => {
    const response = await api.get(`/products/${id}`);
    return response.data;
  },
  scanCode: async (code) => {
    const response = await api.get(`/products/scan/${encodeURIComponent(code)}`);
    return response.data;
  },
  createProduct: async (productData) => {
    const response = await api.post('/products', productData);
    return response.data;
  },
  updateProduct: async (id, productData) => {
    const response = await api.put(`/products/${id}`, productData);
    return response.data;
  },
  deleteProduct: async (id) => {
    const response = await api.delete(`/products/${id}`);
    return response.data;
  },
  getVariants: async (productId) => {
    const response = await api.get(`/products/${productId}/variants`);
    return response.data;
  },
  addVariant: async (productId, variantData) => {
    const response = await api.post(`/products/${productId}/variants`, variantData);
    return response.data;
  },
  getCategories: async () => {
    const response = await api.get('/categories');
    return response.data;
  },
  createCategory: async (data) => {
    const response = await api.post('/categories', data);
    return response.data;
  },
  getBrands: async () => {
    const response = await api.get('/brands');
    return response.data;
  },
  createBrand: async (data) => {
    const response = await api.post('/brands', data);
    return response.data;
  },
  getColors: async () => {
    const response = await api.get('/colors');
    return response.data;
  },
  createColor: async (data) => {
    const response = await api.post('/colors', data);
    return response.data;
  },
  getSizes: async () => {
    const response = await api.get('/sizes');
    return response.data;
  },
  createSize: async (data) => {
    const response = await api.post('/sizes', data);
    return response.data;
  },
  getTaxRates: async () => {
    return [
      { id: '0', name: 'Exempted', rate: 0, label: '0% (Exempted)', value: '0' },
      { id: '5', name: 'GST 5%', rate: 5, label: '5% GST (Garments/Textile)', value: '5' },
      { id: '12', name: 'GST 12%', rate: 12, label: '12% GST', value: '12' },
      { id: '18', name: 'GST 18%', rate: 18, label: '18% GST', value: '18' },
      { id: '28', name: 'GST 28%', rate: 28, label: '28% GST', value: '28' }
    ];
  }
};
