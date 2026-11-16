import { z } from 'zod';

export const loginSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(1, 'Password is required')
});

export const registerSchema = z.object({
  business_type: z.enum(['RETAIL', 'WHOLESALE', 'GARMENT', 'TEXTILE', 'RETAIL_WHOLESALE', 'GARMENT_TEXTILE']),
  business_name: z.string().min(2, 'Business name must be at least 2 characters'),
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Please enter a valid email address'),
  phone: z.string().min(10, 'Phone number must be at least 10 digits'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  confirm_password: z.string()
}).refine(data => data.password === data.confirm_password, {
  message: 'Passwords do not match',
  path: ['confirm_password']
});
