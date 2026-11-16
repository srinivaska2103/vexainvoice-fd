import { z } from 'zod';

export const productSchema = z.object({
  name: z.string().min(2, 'Product name is required'),
  sku: z.string().min(2, 'SKU is required'),
  hsnCode: z.string().optional(),
  categoryId: z.string().min(1, 'Category is required'),
  brandId: z.string().optional(),
  taxRateId: z.string().optional(),
  unit: z.enum(['PCS', 'DOZEN', 'BOX', 'BUNDLE', 'METER', 'KG', 'GRAM', 'ROLL', 'SET']).default('PCS'),
  retailPrice: z.number().min(0, 'Retail price must be positive'),
  wholesalePrice: z.number().min(0, 'Wholesale price must be positive'),
  purchasePrice: z.number().min(0).optional(),
  minSalePrice: z.number().min(0).optional(),
  openingStock: z.number().min(0).optional(),
  lowStockWarning: z.number().min(0).optional(),
  size: z.string().optional(),
  color: z.string().optional()
});
