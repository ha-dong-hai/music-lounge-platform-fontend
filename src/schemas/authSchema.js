import { z } from 'zod';

// Khớp RegisterCommandValidator.cs thật — không bịa thêm rule độ phức tạp (chữ hoa/số/ký tự đặc
// biệt) vì backend không yêu cầu, chỉ yêu cầu độ dài 15-64 (NIST SP 800-63B, không MFA).
// Thông báo lỗi là KEY DỊCH (src/i18n/locales/*.js, nhóm `validation`), không phải câu chữ: schema được tạo
// một lần lúc nạp module nên không biết người dùng đang chọn ngôn ngữ nào. Nơi hiển thị (AuthField) gọi t(message).
const passwordRule = z
  .string()
  .min(15, 'validation.passwordMin')
  .max(64, 'validation.passwordMax');

export const loginSchema = z.object({
  email: z.string().email('validation.emailInvalid'),
  password: z.string().min(1, 'validation.passwordRequired'),
});

export const registerSchema = z.object({
  email: z.string().email('validation.emailInvalid').max(255),
  password: passwordRule,
  fullName: z.string().min(1, 'validation.fullNameRequired').max(255),
  phone: z.string().max(20).optional().or(z.literal('')),
  acceptTerms: z.literal(true, {
    errorMap: () => ({ message: 'validation.acceptTerms' }),
  }),
});

export const resetPasswordSchema = z
  .object({
    newPassword: passwordRule,
    confirmPassword: z.string(),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: 'validation.passwordMismatch',
    path: ['confirmPassword'],
  });

export const forgotPasswordSchema = z.object({
  email: z.string().email('validation.emailInvalid'),
});
