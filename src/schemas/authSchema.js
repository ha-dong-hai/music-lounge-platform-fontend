import { z } from 'zod';

const passwordRule = z
  .string()
  .min(15, 'Mật khẩu phải có ít nhất 15 ký tự.')
  .max(64, 'Mật khẩu không được dài quá 64 ký tự.');

export const loginSchema = z.object({
  email: z.string().email('Email không hợp lệ.'),
  password: z.string().min(1, 'Vui lòng nhập mật khẩu.'),
});