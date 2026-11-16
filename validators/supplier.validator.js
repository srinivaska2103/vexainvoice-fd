import { z } from 'zod';

export const supplierSchema = z.object({
  name: z.string().min(2, 'Supplier name is required'),
  phone: z.string().optional(),
  email: z.string().email('Invalid email address').optional().or(z.literal('')),
  gstin: z.string().optional(),
  address: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional()
});
