// src/lib/queryClient.js
//
// MỘT QueryClient cho cả ứng dụng (TanStack Query 5.104 — chốt 01/10/2026, xem kb/TOOLS.md và
// reports/Thư viện bảng lọc phân trang dữ liệu lớn.md). Dùng cho danh sách có phân trang/bộ lọc phía máy chủ.
//
// - staleTime 30 giây: quay lại trang vừa xem không gọi lại API ngay; dữ liệu vận hành (đơn món, vé) vẫn tự làm
//   mới khi người dùng quay lại tab (refetchOnWindowFocus mặc định bật).
// - retry 1: lỗi mạng thử lại một lần; lỗi 4xx (sai quyền, sai tham số) thử lại không có ích nên bỏ qua.
// - Backend kẹp pageSize 100 toàn cục và 50 ở nhiều endpoint — xem hooks/useDanhSachMayChu.js.
import { QueryClient } from '@tanstack/react-query'

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      retry: (lan, err) => lan < 1 && !(err?.response?.status >= 400 && err?.response?.status < 500),
    },
  },
})
