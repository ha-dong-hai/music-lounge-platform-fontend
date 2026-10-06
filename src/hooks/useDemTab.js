// src/hooks/useDemTab.js
//
// SỐ ĐẾM TRÊN NHÓM TAB — MLACP-685 (chủ dự án 06/10/2026): "những thành phần như vầy bất kể trang quản trị hay trang người
// dùng đều cần hiển thị con số … chứ không phải chờ bấm vào rồi mới thấy", và "các số này phải được cập nhật đúng khi có
// sự thay đổi số lượng liên quan". Trước đây chỉ vài trang có số, và đa số chỉ hiện số của TAB ĐANG MỞ (vì chỉ biết tổng
// của danh sách đang tải).
//
// CÁCH ĐẾM: gọi CHÍNH API danh sách của từng tab, cùng bộ lọc, với pageSize 1, rồi đọc `totalCount` (PaginatedResult) hoặc
// độ dài mảng (endpoint không phân trang). Không thêm API đếm riêng: cùng một truy vấn với danh sách thì số trên tab và số
// dòng thấy khi bấm vào không bao giờ lệch nhau. Trần đã biết: mỗi tab thêm một yêu cầu nhỏ lúc mở trang (hạn mức
// 100 yêu cầu/phút/tài khoản — MLACP-670); trang nhiều tab mà gặp giới hạn thì nâng lên một endpoint đếm gộp phía backend.
//
// CẬP NHẬT KHI SỐ LƯỢNG ĐỔI — ba đường, đủ cho cả thay đổi do người khác lẫn do chính mình:
//   1. Backend báo có thay đổi (lib/thoiGianThuc: làm mới mọi truy vấn đang hiện) → các truy vấn đếm này tự gọi lại.
//   2. Chính người dùng thao tác trong tab (bỏ yêu thích, nhận vé chuyển, duyệt hồ sơ…) → danh sách tải lại → bộ nghe
//      cache bên dưới thấy một truy vấn danh sách vừa có dữ liệu mới và gọi lại toàn bộ số đếm (gom trong 400 ms).
//   3. Tab tự tải bằng useEffect (chưa dùng TanStack) → gọi lamMoiDemTab() sau khi tải xong.
//   Quay lại cửa sổ trình duyệt thì TanStack tự làm mới (refetchOnWindowFocus).
import { useQueries } from '@tanstack/react-query'
import { queryClient } from '../lib/queryClient'

export const KHOA_DEM = 'dem-tab'

// HẠN MỨC: trang Buổi diễn của chủ phòng trà từng dính 429 vì gọi 7–8 lệnh mỗi lần đổi tab (xem OwnerShowsPage). Nên:
//  - số vừa lấy chưa quá MOI_TOI_THIEU thì không lấy lại (lần mở trang: danh sách tải xong ngay sau số đếm → không gọi đôi);
//  - đường 2 chỉ chạy khi danh sách TẢI LẠI (dataUpdateCount > 1), không chạy ở lần tải đầu;
//  - trang nhiều tab mà một lệnh lấy đủ cả danh sách thì đếm tại chỗ bằng một lệnh (không dùng hook này).
const MOI_TOI_THIEU = 2000
let hen = null
/** Gọi lại mọi số đếm tab đang hiện. Gom các lần gọi dồn dập trong 400 ms thành một. */
export const lamMoiDemTab = () => {
  clearTimeout(hen)
  hen = setTimeout(() => queryClient.invalidateQueries({
    queryKey: [KHOA_DEM],
    refetchType: 'active',
    predicate: (q) => Date.now() - q.state.dataUpdatedAt > MOI_TOI_THIEU,
  }), 400)
}

// Đường 2: một truy vấn KHÁC (danh sách) vừa nhận dữ liệu mới SAU lần tải đầu → đếm lại. Bỏ qua chính các truy vấn đếm,
// nếu không sẽ tự gọi mình vòng tròn.
let daNghe = false
const ngheDanhSachDoi = () => {
  if (daNghe) return
  daNghe = true
  queryClient.getQueryCache().subscribe((e) => {
    if (e.type !== 'updated' || e.action?.type !== 'success') return
    if (e.query.queryKey?.[0] === KHOA_DEM) return
    if (e.query.state.dataUpdateCount <= 1) return
    lamMoiDemTab()
  })
}

const docSo = (res) => {
  if (!res?.success) throw new Error(res?.message || 'Không đếm được.')
  const d = res.data
  return Array.isArray(d) ? d.length : Array.isArray(d?.items) && d.totalCount == null ? d.items.length : d?.totalCount ?? 0
}

/**
 * khoa  — tên nhóm tab, duy nhất trong ứng dụng (vd. 've-cua-toi').
 * cacGoi — { [khoaTab]: () => Promise<response đã bóc> } — gọi đúng API + bộ lọc của tab đó, pageSize 1.
 *          Hoặc { [khoaTab]: { khoa, goi } } khi nhiều nhóm tab có ô CÙNG tham số: cùng `khoa` → TanStack gộp thành một lệnh.
 * Trả { [khoaTab]: số | undefined } — undefined khi đang tải hoặc lỗi (NhomTab/thanh tab không hiện số thay vì hiện 0 sai).
 */
export const useDemTab = (khoa, cacGoi, { batDau = true } = {}) => {
  ngheDanhSachDoi()
  const cacKhoa = Object.keys(cacGoi)
  const goiCua = (k) => (typeof cacGoi[k] === 'function' ? cacGoi[k] : cacGoi[k].goi)
  const khoaCua = (k) => (typeof cacGoi[k] === 'function' ? [KHOA_DEM, khoa, k] : [KHOA_DEM, cacGoi[k].khoa])
  return useQueries({
    queries: cacKhoa.map((k) => ({
      queryKey: khoaCua(k),
      queryFn: async () => docSo(await goiCua(k)()),
      enabled: batDau,
    })),
    combine: (kq) => Object.fromEntries(cacKhoa.map((k, i) => [k, kq[i].data])),
  })
}
