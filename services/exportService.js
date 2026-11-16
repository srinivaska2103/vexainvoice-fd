import api, { getApiBaseUrl } from '@/lib/axios';
import { getSessionToken } from '@/store/useAuthStore';

export const exportService = {
  exportSales: async (params = {}) => {
    const token = getSessionToken();
    const baseURL = getApiBaseUrl();
    
    const query = new URLSearchParams(params).toString();
    const url = `${baseURL}/export/sales${query ? `?${query}` : ''}`;

    let res = await fetch(url, {
      method: 'GET',
      headers: {
        ...(token ? { Authorization: `Bearer ${token}` } : {})
      }
    });

    if (!res.ok) {
      // Fallback to /sales/export if /export/sales isn't caught
      const fallbackUrl = `${baseURL}/sales/export${query ? `?${query}` : ''}`;
      const resFallback = await fetch(fallbackUrl, {
        method: 'GET',
        headers: {
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        }
      });
      if (resFallback.ok) {
        res = resFallback;
      } else {
        const errJson = await res.json().catch(() => ({}));
        throw new Error(errJson.message || 'Unable to export sales data');
      }
    }

    const blob = await res.blob();
    const contentDisposition = res.headers.get('Content-Disposition');
    let filename = `Sales_Report_${new Date().toISOString().split('T')[0]}.xlsx`;
    if (contentDisposition) {
      const match = contentDisposition.match(/filename="?([^";]+)"?/);
      if (match && match[1]) filename = match[1];
    }

    const downloadUrl = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = downloadUrl;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    window.URL.revokeObjectURL(downloadUrl);
  },

  exportCustomers: async (params = {}) => {
    const token = getSessionToken();
    const baseURL = getApiBaseUrl();
    
    const query = new URLSearchParams(params).toString();
    const url = `${baseURL}/export/customers${query ? `?${query}` : ''}`;

    let res = await fetch(url, {
      method: 'GET',
      headers: {
        ...(token ? { Authorization: `Bearer ${token}` } : {})
      }
    });

    if (!res.ok) {
      const fallbackUrl = `${baseURL}/customers/export${query ? `?${query}` : ''}`;
      const resFallback = await fetch(fallbackUrl, {
        method: 'GET',
        headers: {
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        }
      });
      if (resFallback.ok) {
        res = resFallback;
      } else {
        const errJson = await res.json().catch(() => ({}));
        throw new Error(errJson.message || 'Unable to export customers data');
      }
    }

    const blob = await res.blob();
    const contentDisposition = res.headers.get('Content-Disposition');
    let filename = `Customers_${new Date().toISOString().split('T')[0]}.xlsx`;
    if (contentDisposition) {
      const match = contentDisposition.match(/filename="?([^";]+)"?/);
      if (match && match[1]) filename = match[1];
    }

    const downloadUrl = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = downloadUrl;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    window.URL.revokeObjectURL(downloadUrl);
  }
};
