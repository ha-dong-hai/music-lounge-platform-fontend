// src/hooks/useHangDoiViec.js
//
// MLACP-618: số việc đang chờ Admin ở từng hàng đợi (GET /admin/work-queue). Dùng chung cho huy hiệu menu và khối
// "Việc cần xử lý" — cùng một queryKey nên hai nơi luôn cùng một con số và chỉ tốn một yêu cầu.
//
// Tải lại mỗi 60 giây và khi quay lại thẻ trình duyệt: Admin xử lý xong một việc ở trang khác thì con số tự đúng lại
// sau tối đa một phút. Một yêu cầu mỗi phút cho mỗi thẻ đang mở — xa dưới ngưỡng 100 yêu cầu/phút của máy chủ.
// Lỗi tải thì im lặng (trả rỗng, không huy hiệu): một con số trên menu không đáng làm phiền người dùng.
import { useQuery } from '@tanstack/react-query'
import { getWorkQueue } from '../services/adminServices'

export const KHOA_HANG_DOI_VIEC = ['admin', 'work-queue']

export const useHangDoiViec = (batBuoc = true) => useQuery({
  queryKey: KHOA_HANG_DOI_VIEC,
  queryFn: async () => {
    const r = await getWorkQueue()
    if (!r?.success) throw new Error('khong-tai-duoc')
    return r.data ?? []
  },
  enabled: batBuoc,
  staleTime: 30_000,
  refetchInterval: 60_000,
  refetchOnWindowFocus: true,
  retry: false,
})
