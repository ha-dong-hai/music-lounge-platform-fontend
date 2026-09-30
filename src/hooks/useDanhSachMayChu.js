// src/hooks/useDanhSachMayChu.js
//
// DANH SÁCH PHÂN TRANG PHÍA MÁY CHỦ — hook dùng chung (01/10/2026). Thay cho việc mỗi trang tự giữ
// {page, totalPages, totalCount} và tự lọc trên trình duyệt (đo 01/10: ~19 màn lọc trong trang hoặc bị backend cắt bớt
// mà không báo — reports/Thư viện bảng lọc phân trang dữ liệu lớn.md).
//
// Thư viện, không tự viết: TanStack Query (gọi API, giữ trang cũ khi đang tải trang mới — keepPreviousData) + nuqs
// (trang, cỡ trang, bộ lọc nằm trên URL → nút Quay lại trả đúng chỗ, chép link gửi người khác được). Bảng dữ liệu dùng
// thêm TanStack Table qua components/bang/BangDuLieu.jsx; danh sách dạng thẻ chỉ cần hook này + PhanTrang.
//
// Hợp đồng backend (PaginatedResult.cs): { items, page, pageSize, totalCount, totalPages }. Ba bẫy đã gặp, xử lý ở đây:
//  1. Đổi bộ lọc mà giữ trang 5 → trang rỗng. Mọi thay đổi bộ lọc đưa về trang 1.
//  2. Tổng số giảm (vừa huỷ/đổi trạng thái đơn) → đang ở trang không còn tồn tại. Kẹp về trang cuối.
//  3. Backend kẹp pageSize (100 toàn cục, 50 ở nhiều endpoint) → đọc lại `pageSize` trong response, không tin số đã gửi.
//
// Tham số:
//   khoa    — tiền tố queryKey, duy nhất cho mỗi danh sách (vd. 'don-mon').
//   goi     — async ({ page, pageSize, ...boLoc }) => response axios đã bóc ({ success, data }).
//   boLoc   — { ten: parser nuqs } (vd. { trangThai: parseAsStringLiteral([...]).withDefault('Pending') }).
//   coMacDinh, cacCo — cỡ trang mặc định và các lựa chọn (mặc định 10/20/50 vì nhiều endpoint kẹp ở 50).
//   batDau  — false thì chưa gọi (vd. chưa biết phòng trà nào).
//   tien    — tiền tố tham số trên URL khi một trang có hai danh sách (vd. 'khach' → khachTrang, khachCo).
//   lamMoiMoi — số mili-giây tự tải lại (vd. màn bếp cần thấy đơn mới); bỏ trống thì không tự tải.
import { useEffect, useMemo } from 'react'
import { keepPreviousData, useQuery } from '@tanstack/react-query'
import { parseAsInteger, useQueryStates } from 'nuqs'

export const CAC_CO_MAC_DINH = [10, 20, 50]

export const useDanhSachMayChu = ({ khoa, goi, boLoc = {}, coMacDinh = 20, cacCo = CAC_CO_MAC_DINH, batDau = true, tien = '', lamMoiMoi } = {}) => {
  const kTrang = tien ? `${tien}Trang` : 'trang'
  const kCo = tien ? `${tien}Co` : 'co'
  const [url, datUrl] = useQueryStates(
    { [kTrang]: parseAsInteger.withDefault(1), [kCo]: parseAsInteger.withDefault(coMacDinh), ...boLoc },
    // push: mỗi lần đổi trang / bộ lọc là một mục lịch sử — Quay lại trả về trang trước (Baymard: >90% trang "tải thêm"
    // làm hỏng nút Quay lại). scroll false: tự đưa tiêu điểm lên đầu danh sách thay vì nhảy trang.
    { history: 'push' },
  )
  const trang = Math.max(1, url[kTrang])
  const co = cacCo.includes(url[kCo]) ? url[kCo] : coMacDinh
  const giaTriLoc = useMemo(() => Object.fromEntries(Object.keys(boLoc).map((k) => [k, url[k]])), [boLoc, url])

  const q = useQuery({
    queryKey: [khoa, trang, co, giaTriLoc],
    queryFn: async () => {
      const res = await goi({ page: trang, pageSize: co, ...giaTriLoc })
      if (!res?.success) throw new Error(res?.message || 'Không tải được danh sách.')
      return res.data
    },
    placeholderData: keepPreviousData,
    enabled: batDau,
    refetchInterval: lamMoiMoi,
  })

  const du = q.data
  const items = useMemo(() => (Array.isArray(du) ? du : du?.items) ?? [], [du])
  const tong = Array.isArray(du) ? du.length : du?.totalCount ?? 0
  const coThuc = Array.isArray(du) ? co : du?.pageSize ?? co
  const soTrang = Array.isArray(du) ? 1 : du?.totalPages ?? Math.max(1, Math.ceil(tong / coThuc))

  // Bẫy 2: tổng giảm → kẹp về trang cuối còn tồn tại (setter của nuqs, không phải setState của React).
  useEffect(() => {
    if (du && !q.isPlaceholderData && soTrang > 0 && trang > soTrang) datUrl({ [kTrang]: soTrang })
  }, [du, q.isPlaceholderData, soTrang, trang, datUrl, kTrang])

  return {
    items,
    tong,
    trang,
    soTrang: Math.max(1, soTrang),
    co,
    coThuc,
    cacCo,
    boLoc: giaTriLoc,
    dangTai: q.isPending && batDau,
    dangTaiLai: q.isFetching,
    laDuLieuCu: q.isPlaceholderData,
    loi: q.error,
    taiLai: q.refetch,
    datTrang: (n) => datUrl({ [kTrang]: Math.min(Math.max(1, n), Math.max(1, soTrang)) }),
    datCo: (n) => datUrl({ [kCo]: n, [kTrang]: 1 }),
    // Bẫy 1: đổi bộ lọc luôn về trang 1.
    datBoLoc: (vaChinh) => datUrl({ ...vaChinh, [kTrang]: 1 }),
    xoaBoLoc: () => datUrl({ ...Object.fromEntries(Object.keys(boLoc).map((k) => [k, null])), [kTrang]: 1 }),
  }
}

// Dải số trang kiểu GOV.UK: trang đầu, trang cuối, trang hiện tại và hai trang kề; chỗ bị bỏ là '…'.
// dayTrang(1, 1) → [1]; dayTrang(6, 12) → [1, '…', 5, 6, 7, '…', 12].
export const dayTrang = (trang, soTrang) => {
  const giu = new Set([1, soTrang, trang - 1, trang, trang + 1].filter((n) => n >= 1 && n <= soTrang))
  const ds = [...giu].sort((a, b) => a - b)
  const ra = []
  for (let i = 0; i < ds.length; i++) {
    if (i > 0 && ds[i] - ds[i - 1] === 2) ra.push(ds[i] - 1)
    else if (i > 0 && ds[i] - ds[i - 1] > 2) ra.push('…')
    ra.push(ds[i])
  }
  return ra
}
