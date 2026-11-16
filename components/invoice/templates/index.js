import A5CustomerShopCopy from './A5CustomerShopCopy';
import Thermal80mm from './Thermal80mm';

export const INVOICE_TEMPLATES = {
  DEFAULT_A4: {
    id: 'DEFAULT_A4',
    name: 'Standard A4 Modern',
    paperSize: 'A4 Portrait',
    description: 'Clean modern full-page invoice template with tax breakdowns and customer details.',
    previewType: 'A4',
  },
  A5_CUSTOMER_SHOP_COPY: {
    id: 'A5_CUSTOMER_SHOP_COPY',
    name: 'A5 Customer + Shop Copy',
    paperSize: 'A5 Portrait (148mm × 210mm)',
    description: 'A5 portrait invoice with Customer Copy at top, Shop Owner Copy at bottom, and cut line.',
    previewType: 'A5_TWO_COPY',
    component: A5CustomerShopCopy,
  },
  THERMAL_80MM: {
    id: 'THERMAL_80MM',
    name: 'Thermal 80mm',
    paperSize: '80mm Thermal Paper',
    description: 'Compact 80mm receipt format optimized for thermal POS printers.',
    previewType: 'THERMAL',
    component: Thermal80mm,
  },
};

export function getTemplateComponent(templateId) {
  if (templateId === 'A5_CUSTOMER_SHOP_COPY') {
    return A5CustomerShopCopy;
  }
  if (templateId === 'THERMAL_80MM') {
    return Thermal80mm;
  }
  return null; // Fallback to standard A4 layout in InvoicePrintTemplate
}
