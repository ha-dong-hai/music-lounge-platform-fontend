import { z } from 'zod';

export const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});


export const audienceRegisterSchema = z.object({
  fullName: z.string().min(2, 'Full name must be at least 2 characters').max(200, 'Full name is too long'),
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  phone: z.string().optional(),
  dateOfBirth: z.string().min(1, 'Please select your date of birth'),
});


export const ownerRegisterSchema = z.object({
  fullName: z.string().min(2, 'Full name must be at least 2 characters').max(200, 'Full name is too long'),
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  phone: z.string().min(10, 'Invalid phone number'), 
});


export const ownerVerifySchema = z.object({
  loungeName: z.string().min(2, 'Lounge name is required'),
  province: z.string().min(1, 'Province/City is required'),
  ward: z.string().min(1, 'Ward/Commune is required'),
  addressNote: z.string().optional(),
  capacity: z.string().min(1, 'Capacity is required'),
});


export const registerSchema = z.object({
  fullName: z.string().min(2, 'Full name must be at least 2 characters').max(200, 'Full name is too long'),
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  confirmPassword: z.string().min(6, 'Please confirm your password'),
  phone: z.string().optional(),
}).refine((data) => data.password === data.confirmPassword, {
  message: 'Passwords do not match',
  path: ['confirmPassword'],
});