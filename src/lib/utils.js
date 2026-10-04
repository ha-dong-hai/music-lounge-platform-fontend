// src/lib/utils.js
// Nguồn: https://ui.shadcn.com/docs/installation/manual (hàm `cn` chuẩn của shadcn/ui, giấy phép MIT)
// Ngày lấy: 05/10/2026
// Đã sửa: bỏ kiểu TypeScript (dự án viết JavaScript).
//
// `cn` gộp tên lớp có điều kiện (clsx) rồi để tailwind-merge bỏ lớp Tailwind bị lớp sau ghi đè — mọi linh kiện trong
// src/components/ui dùng nó.
import { clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs) {
  return twMerge(clsx(inputs))
}
