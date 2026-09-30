// src/components/auth/kieuNut.js
//
// Kiểu nút và liên kết dùng chung cho năm trang tài khoản — một chỗ để năm trang không lệch nhau.
// Nút chính: khối mực, chữ khối (cùng vật liệu với nút "Đặt chỗ" của bảng giờ diễn). Nút phụ: viền mực.
// Liên kết trong form LUÔN gạch chân: màu không phải dấu hiệu duy nhất của một liên kết (WCAG 1.4.1).
export const NUT_CHINH = 'w-full min-h-[52px] px-6 bg-ink text-lamp font-display text-2xl inline-flex items-center justify-center gap-2 hover:bg-board transition-colors disabled:opacity-60 disabled:cursor-not-allowed'
export const NUT_PHU = 'w-full min-h-[48px] px-5 bg-card border-2 border-ink text-ink font-semibold inline-flex items-center justify-center gap-3 hover:bg-ink hover:text-lamp transition-colors disabled:opacity-60'
export const LIEN_KET = 'inline-flex items-center gap-1.5 min-h-[44px] font-semibold text-ink underline underline-offset-4 decoration-2 hover:text-board'
export const LIEN_KET_NHE = 'inline-flex items-center gap-1.5 min-h-[44px] text-ink-soft underline underline-offset-4 hover:text-ink'
