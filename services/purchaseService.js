import api from '@/lib/axios';

export const purchaseService = {
  getPurchases: async (params = {}) => {
    const response = await api.get('/purchases', { params });
    return response.data;
  },
  getPurchaseById: async (id) => {
    const response = await api.get(`/purchases/${id}`);
    return response.data;
  },
  createPurchase: async (purchaseData) => {
    const formattedData = {
      supplier_id: purchaseData.supplier_id || purchaseData.supplierId || null,
      supplierId: purchaseData.supplierId || purchaseData.supplier_id || null,
      purchase_number: purchaseData.purchase_number || purchaseData.supplierInvoiceNumber || purchaseData.purchaseNumber || undefined,
      supplierInvoiceNumber: purchaseData.supplierInvoiceNumber || purchaseData.purchase_number || undefined,
      purchase_date: purchaseData.purchase_date || purchaseData.purchaseDate || undefined,
      purchaseDate: purchaseData.purchaseDate || purchaseData.purchase_date || undefined,
      items: (purchaseData.items || []).map((it) => ({
        product_id: it.product_id || it.productId,
        productId: it.productId || it.product_id,
        variant_id: it.variant_id || it.variantId || null,
        variantId: it.variantId || it.variant_id || null,
        quantity: Number(it.quantity || 0),
        unit_price: Number(it.unit_price ?? it.unitPrice ?? it.unitCost ?? 0),
        unitCost: Number(it.unitCost ?? it.unit_price ?? it.unitPrice ?? 0),
        gst_percentage: Number(it.gst_percentage ?? it.gstPercentage ?? it.taxRate ?? 0),
        taxRate: Number(it.taxRate ?? it.gst_percentage ?? 0)
      }))
    };
    const response = await api.post('/purchases', formattedData);
    return response.data;
  },
  returnPurchase: async (purchaseId, returnData) => {
    const response = await api.post(`/purchases/${purchaseId}/return`, returnData);
    return response.data;
  }
};
