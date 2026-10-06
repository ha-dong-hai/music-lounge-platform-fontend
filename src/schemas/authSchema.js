import { z } from 'zod';

// Khớp RegisterCommandValidator.cs thật — không bịa thêm rule độ phức tạp (chữ hoa/số/ký tự đặc
// biệt) vì backend không yêu cầu, chỉ yêu cầu độ dài 15-64 (NIST SP 800-63B, không MFA).
const passwordRule = z
  .string()
  .min(15, 'Mật khẩu phải có ít nhất 15 ký tự.')
  .max(64, 'Mật khẩu không được dài quá 64 ký tự.');

export const loginSchema = z.object({
  email: z.string().email('Email không hợp lệ.'),
  password: z.string().min(1, 'Vui lòng nhập mật khẩu.'),
});

export const registerSchema = z.object({
  email: z.string().email('Email không hợp lệ.').max(255),
  password: passwordRule,
  fullName: z.string().min(1, 'Họ tên không được để trống.').max(255),
  phone: z.string().max(20).optional().or(z.literal('')),
  acceptTerms: z.literal(true, {
    errorMap: () => ({ message: 'Bạn cần đồng ý với Điều khoản dịch vụ và Chính sách bảo mật.' }),
  }),
});

export const resetPasswordSchema = z
  .object({
    newPassword: passwordRule,
    confirmPassword: z.string(),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: 'Mật khẩu xác nhận không khớp.',
    path: ['confirmPassword'],
  });

export const forgotPasswordSchema = z.object({
  email: z.string().email('Email không hợp lệ.'),
});
