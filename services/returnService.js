import api from '@/lib/axios';

export const returnService = {
  getSalesReturns: async (params = {}) => {
    try {
      const [salesRes, txRes] = await Promise.all([
        api.get('/sales', { params: { ...params, includeReturned: 'true', limit: 200 } }).catch(() => ({ data: [] })),
        api.get('/stock/transactions', { params: { transaction_type: 'SALE_RETURN', limit: 200 } }).catch(() => ({ data: [] }))
      ]);

      const sales = salesRes.data?.sales || salesRes.data || [];
      const txs = txRes.data?.transactions || txRes.data || [];

      // Map stock transactions for SALE_RETURN
      const stockTxReturns = txs.map((tx) => {
        const matchingSale = Array.isArray(sales)
          ? sales.find((s) => s.id === tx.reference_id || s.invoice_number === tx.reference_number)
          : null;

        let variantLabel = '-';
        if (tx.product_variants) {
          const colorName = tx.product_variants.colors?.name || tx.product_variants.color;
          const sizeName = tx.product_variants.sizes?.name || tx.product_variants.size;
          const parts = [colorName, sizeName].filter(Boolean);
          variantLabel = parts.length > 0 ? parts.join(' / ') : (tx.product_variants.sku || tx.product_variants.title || '-');
        }

        // Parse return details from notes if formatted by new return workflow
        let parsedRef = `RET-${tx.id.substring(0, 8).toUpperCase()}`;
        let refundMethod = 'CASH';
        let refundStatus = 'COMPLETED';
        let refundAmount = 0;

        if (tx.notes && tx.notes.includes('Return [')) {
          const matchRef = tx.notes.match(/Return\s*\[([^\]]+)\]/);
          if (matchRef && matchRef[1]) parsedRef = matchRef[1];
          const matchRefund = tx.notes.match(/Refund:\s*₹([0-9.]+)/);
          if (matchRefund && matchRefund[1]) refundAmount = parseFloat(matchRefund[1]);
          const matchMethod = tx.notes.match(/via\s*([A-Za-z_]+)/);
          if (matchMethod && matchMethod[1]) refundMethod = matchMethod[1];
          const matchStatus = tx.notes.match(/\((COMPLETED|PENDING|FAILED|CANCELLED)\)/);
          if (matchStatus && matchStatus[1]) refundStatus = matchStatus[1];
        } else if (matchingSale?.returnHistory?.length > 0) {
          const latestLog = matchingSale.returnHistory[matchingSale.returnHistory.length - 1];
          if (latestLog) {
            parsedRef = latestLog.returnRef || parsedRef;
            refundMethod = latestLog.refundMethod || refundMethod;
            refundStatus = latestLog.refundStatus || refundStatus;
            refundAmount = Number(latestLog.refundAmount || 0);
          }
        }

        return {
          id: tx.id,
          returnNumber: parsedRef,
          return_number: parsedRef,
          invoice_number: tx.reference_number || matchingSale?.invoiceNumber || matchingSale?.invoice_number || 'N/A',
          reason: tx.notes || 'Customer Return',
          created_at: tx.transaction_date || tx.created_at,
          customer: matchingSale?.customer || { name: tx.users?.name || 'Walk-in Customer' },
          sale: matchingSale || { invoiceNumber: tx.reference_number, customer: matchingSale?.customer },
          product_name: tx.products?.name || matchingSale?.items?.[0]?.product_name || matchingSale?.items?.[0]?.name || 'Product Item',
          variant_name: variantLabel,
          quantity: Number(tx.quantity || 1),
          refund_amount: refundAmount,
          refundAmount: refundAmount,
          refund_method: refundMethod,
          refundMethod: refundMethod,
          refund_status: refundStatus,
          refundStatus: refundStatus,
          processed_by: tx.users?.name || 'Staff'
        };
      });

      // Map sales that are returned/cancelled but might not have a stock_transaction record
      const returnedSales = (Array.isArray(sales) ? sales : [])
        .filter((s) => s.is_return || s.status === 'CANCELLED' || s.status === 'RETURNED' || s.notes?.toLowerCase().includes('return'))
        .filter((s) => !stockTxReturns.some((st) => st.invoice_number === (s.invoice_number || s.invoiceNumber) || st.sale?.id === s.id))
        .map((s) => {
          const items = s.items || s.sale_items || [];
          const firstItem = items[0] || {};
          const pName = items.length > 1 
            ? items.map(i => i.product_name || i.name).filter(Boolean).join(', ')
            : (firstItem.product_name || firstItem.name || 'Product Item');
          
          const vName = items.length > 1
            ? items.map(i => [i.color, i.size].filter(Boolean).join(' / ') || '-').join(', ')
            : ([firstItem.color, firstItem.size].filter(Boolean).join(' / ') || firstItem.variant || '-');

          const qty = items.length > 0
            ? items.reduce((sum, i) => sum + Number(i.quantity || 1), 0)
            : 1;

          const latestLog = s.returnHistory && s.returnHistory.length > 0 ? s.returnHistory[s.returnHistory.length - 1] : null;

          return {
            id: s.id,
            returnNumber: latestLog?.returnRef || `RET-${s.id.substring(0, 8).toUpperCase()}`,
            return_number: latestLog?.returnRef || `RET-${s.id.substring(0, 8).toUpperCase()}`,
            invoice_number: s.invoice_number || s.invoiceNumber || 'N/A',
            reason: latestLog?.reason || (s.notes ? s.notes.replace(/^\[RETURNED\]:\s*/i, '') : 'Customer Return'),
            created_at: latestLog?.returnedAt || s.created_at || s.createdAt,
            customer: s.customer || { name: 'Walk-in Customer' },
            sale: s,
            product_name: pName,
            variant_name: vName,
            quantity: qty,
            refund_amount: Number(latestLog?.refundAmount || s.returnedAmount || 0),
            refundAmount: Number(latestLog?.refundAmount || s.returnedAmount || 0),
            refund_method: latestLog?.refundMethod || 'CASH',
            refundMethod: latestLog?.refundMethod || 'CASH',
            refund_status: latestLog?.refundStatus || 'COMPLETED',
            refundStatus: latestLog?.refundStatus || 'COMPLETED',
            processed_by: 'Staff'
          };
        });

      const combined = [...stockTxReturns, ...returnedSales];
      const unique = Array.from(new Map(combined.map((item) => [item.id, item])).values());
      return { data: unique };
    } catch (err) {
      console.error('Error fetching sales returns:', err);
      return { data: [] };
    }
  },
  createSalesReturn: async (saleId, data) => {
    const response = await api.post(`/sales/${saleId}/return`, data);
    return response.data;
  },
  getPurchaseReturns: async (params = {}) => {
    try {
      const response = await api.get('/purchases', { params });
      const purchases = response.data?.purchases || response.data || [];
      return { data: Array.isArray(purchases) ? purchases.filter((p) => p.is_return || p.status === 'RETURNED') : [] };
    } catch {
      return { data: [] };
    }
  },
  createPurchaseReturn: async (purchaseId, data) => {
    const response = await api.post(`/purchases/${purchaseId}/return`, data);
    return response.data;
  }
};


