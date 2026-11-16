import { z } from 'zod';

export const purchaseSchema = z.object({
  supplierId: z.string().min(1, 'Supplier is required'),
  supplierInvoiceNumber: z.string().optional(),
  purchaseDate: z.string().optional(),
  items: z.array(
    z.object({
      productId: z.string().min(1, 'Product is required'),
      quantity: z.number().min(1, 'Quantity must be at least 1'),
      unitCost: z.number().min(0, 'Unit cost must be positive'),
      taxRate: z.number().min(0).default(0)
    })
  ).min(1, 'At least one item is required')
});
