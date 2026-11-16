import { z } from 'zod';

export const customerSchema = z.object({
  name: z.string().min(2, 'Customer name is required'),
  phone: z.string().optional(),
  email: z.string().email('Invalid email address').optional().or(z.literal('')),
  gstin: z.string().optional(),
  customerType: z.enum(['RETAIL', 'WHOLESALE']).default('RETAIL'),
  address: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  openingBalance: z.number().optional()
});
