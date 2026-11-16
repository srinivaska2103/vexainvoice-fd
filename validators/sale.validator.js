import { z } from 'zod';

export const saleSchema = z.object({
  invoiceType: z.enum(['RETAIL', 'WHOLESALE']).default('RETAIL'),
  customerId: z.string().optional().nullable(),
  paymentMethod: z.enum(['CASH', 'UPI', 'CARD', 'NET_BANKING', 'CREDIT']).default('CASH'),
  discountAmount: z.number().min(0).default(0),
  items: z.array(
    z.object({
      productId: z.string().min(1, 'Product is required'),
      quantity: z.number().min(1, 'Quantity must be at least 1'),
      unitPrice: z.number().min(0, 'Unit price must be positive'),
      taxRate: z.number().min(0).default(0)
    })
  ).min(1, 'At least one item is required')
});
