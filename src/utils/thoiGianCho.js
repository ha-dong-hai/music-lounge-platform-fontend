// src/utils/thoiGianCho.js
//
// MLACP-596: "ĐÃ CHỜ BAO LÂU" cho các hàng chờ của Admin (duyệt buổi diễn, phòng trà, định danh, tài khoản nhận tiền,
// khiếu nại, kháng nghị). Hàng chờ là màn VẬN HÀNH: người duyệt cần thấy việc nào chờ lâu nhất, không cần lọc theo ngày
// (NN/g: dashboard vận hành ≠ phân tích). Backend đã xếp "cũ nhất trước"; thiếu là con số tuổi của từng việc — trước đây
// chỉ in ngày giờ nộp, người duyệt phải tự trừ.
//
// Khoảng thời gian do plugin relativeTime của dayjs tính và đọc ra tiếng Việt ("3 ngày", "một giờ") — không tự viết bảng
// làm tròn. Ép locale 'vi' trên từng lần gọi: khu quản trị luôn tiếng Việt dù dayjs toàn cục đang là 'en'.
//
// HẠN XỬ LÝ: chỉ báo "quá hạn" khi backend TRẢ hạn (vd. slaDeadline của hàng chờ kiểm duyệt). Hàng chờ nào backend chưa có
// hạn thì chỉ ghi tuổi — không tự đặt hạn ở giao diện (tham số nghiệp vụ phải nằm ở system_config).
import dayjs from 'dayjs'
import relativeTime from 'dayjs/plugin/relativeTime.js'
import 'dayjs/locale/vi.js'

dayjs.extend(relativeTime)

// Trả null khi không có mốc hợp lệ. `quaHan` chỉ true khi có `han` và đã qua hạn.
export const trangThaiCho = (luc, han = null, bayGio = dayjs()) => {
  const l = luc ? dayjs(luc) : null
  if (!l || !l.isValid()) return null
  const h = han ? dayjs(han) : null
  if (h && h.isValid() && bayGio.isAfter(h)) {
    return { quaHan: true, chu: `Quá hạn ${h.locale('vi').from(bayGio, true)}` }
  }
  return { quaHan: false, chu: `Đã chờ ${l.locale('vi').from(bayGio, true)}` }
}
