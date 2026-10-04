// src/utils/viecCho.js
//
// MLACP-618: VIỆC ĐANG CHỜ ADMIN — huy hiệu trên menu và khối "Việc cần xử lý" ở trang Tổng quan. Số liệu từ
// GET /admin/work-queue (backend MLACP-617): mỗi hàng đợi có `count` (đúng số dòng của trang đó), `overdueCount`
// (số việc đã quá thời hạn cam kết; null = hàng đợi CHƯA có thời hạn nào) và `nextDueAt` (hạn gần nhất chưa qua).
//
// ĐỘ ƯU TIÊN — chỉ dùng thứ có căn cứ (Jira Service Management và Zendesk cùng xếp hàng đợi theo SLA: đã quá hạn trước,
// rồi tới hạn gần nhất):
//   1. Hàng có việc QUÁ HẠN, nhiều việc quá hạn hơn đứng trước.
//   2. Rồi hàng có HẠN GẦN NHẤT sớm hơn.
//   3. Rồi hàng không có thời hạn, nhiều việc hơn đứng trước.
// KHÔNG có mức "sắp quá hạn": backend không có ngưỡng đó và giao diện không tự đặt (tham số nghiệp vụ nằm ở
// system_config). Thay vào đó nói thẳng "hạn gần nhất còn bao lâu".
//
// Khoảng thời gian đọc bằng dayjs relativeTime, ép locale 'vi' từng lần gọi (cùng cách utils/thoiGianCho.js).
import dayjs from 'dayjs'
import relativeTime from 'dayjs/plugin/relativeTime.js'
import 'dayjs/locale/vi.js'

dayjs.extend(relativeTime)

// Mã hàng đợi của backend = đoạn đường dẫn sau /admin/ — khớp menu AdminLayout.
export const duongDanCua = (key) => `/admin/${key}`

const hanCua = (v) => {
  const h = v?.nextDueAt ? dayjs(v.nextDueAt) : null
  return h && h.isValid() ? h : null
}

// Chỉ giữ hàng có việc, xếp theo độ ưu tiên ở đầu tệp. Không đổi mảng gốc.
export const sapXepTheoUuTien = (ds = []) =>
  ds.filter((v) => (v?.count ?? 0) > 0).slice().sort((a, b) => {
    const qa = a.overdueCount ?? 0
    const qb = b.overdueCount ?? 0
    if (qa !== qb) return qb - qa
    const ha = hanCua(a)
    const hb = hanCua(b)
    if (ha && hb && !ha.isSame(hb)) return ha.valueOf() - hb.valueOf()
    if (ha && !hb) return -1
    if (!ha && hb) return 1
    return (b.count ?? 0) - (a.count ?? 0)
  })

// Câu ngắn về hạn của một hàng đợi; null khi hàng đó không có thời hạn và không quá hạn.
export const moTaHan = (v, bayGio = dayjs()) => {
  if (!v) return null
  if ((v.overdueCount ?? 0) > 0) return { quaHan: true, chu: `${v.overdueCount} việc quá hạn` }
  const h = hanCua(v)
  if (h && h.isAfter(bayGio)) return { quaHan: false, chu: `Hạn gần nhất còn ${h.locale('vi').from(bayGio, true)}` }
  return null
}

// Nhãn cho trình đọc màn hình — huy hiệu chỉ là con số, phải nói rõ con số đó là gì.
export const nhanDocCua = (v) => {
  if (!v || (v.count ?? 0) === 0) return ''
  const qua = v.overdueCount ?? 0
  return qua > 0 ? `${v.count} việc đang chờ, ${qua} quá hạn` : `${v.count} việc đang chờ`
}
