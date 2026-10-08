// src/utils/viecMoBan.js
//
// MLACP-606: "VIỆC CẦN LÀM ĐỂ MỞ BÁN" cho chủ phòng trà. Pre-mortem 04/10/2026 (rủi ro H4): từ lúc đăng ký tới lúc bán
// được vé đầu tiên có khoảng 12 bước rải trên 7 trang, hai lần chờ quản trị viên duyệt — và không chỗ nào nói cho chủ mới
// biết còn thiếu gì. Chủ chỉ phát hiện khi bấm "Gửi duyệt" rồi bị từ chối, từng lỗi một.
//
// Hàm thuần: nhận dữ liệu đã có sẵn ở các API hiện tại, trả danh sách bước kèm trạng thái và trang để làm. Không tự đặt
// luật mới — mỗi bước chỉ phản chiếu một cổng backend ĐANG chặn:
//   phòng trà phải được duyệt (MLACP-307) · chủ phải được duyệt danh tính (MLACP-397) · tài khoản nhận tiền phải được xác
//   minh mới chi trả (MLACP-395) · hạng vé vào cửa phải gắn khu (MLACP-589) · buổi diễn phải được duyệt trước khi mở bán.
//
// Trạng thái: 'xong' | 'cho' (đã nộp, đang chờ quản trị viên) | 'tu-choi' (bị trả về, phải sửa) | 'lam' (chưa làm).
// Dữ liệu nào chưa tải được (undefined) thì bước đó mang trạng thái 'chua-ro' — không đoán là xong hay chưa.

const B = (khoa, ten, trangThai, moTa, to) => ({ khoa, ten, trangThai, moTa, to })

export const buocMoBan = ({ lounge, cccd, taiKhoan, soKhu, buoi } = {}) => {
  const ds = []

  // 1. Hồ sơ phòng trà
  if (lounge === undefined) ds.push(B('phong-tra', 'Hồ sơ phòng trà', 'chua-ro', 'Chưa tải được.', '/owner/lounge'))
  else if (!lounge) ds.push(B('phong-tra', 'Hồ sơ phòng trà', 'lam', 'Khai tên, địa chỉ, ảnh và giấy phép kinh doanh rồi gửi duyệt.', '/owner/lounge'))
  // MLACP-701: có phòng trà nhưng KHÔNG có trạng thái (vd. item của GET /lounges?mine=true — danh sách không trả status) là
  // dữ liệu chưa đủ, không phải "đã duyệt". Trước đây rơi xuống nhánh cuối: chủ vừa nộp hồ sơ được báo "Xong · Đã được duyệt".
  else if (!lounge.status) ds.push(B('phong-tra', 'Hồ sơ phòng trà', 'chua-ro', 'Chưa tải được.', '/owner/lounge'))
  else if (lounge.status === 'Pending') ds.push(B('phong-tra', 'Hồ sơ phòng trà', 'cho', 'Đã gửi, đang chờ quản trị viên duyệt.', '/owner/lounge'))
  else if (lounge.status === 'Rejected') ds.push(B('phong-tra', 'Hồ sơ phòng trà', 'tu-choi', 'Hồ sơ bị trả về. Xem lý do, sửa rồi gửi lại.', '/owner/lounge'))
  else ds.push(B('phong-tra', 'Hồ sơ phòng trà', 'xong', 'Đã được duyệt.', '/owner/lounge'))

  // 2. Xác minh danh tính (CCCD) — cổng bắt buộc để đăng buổi diễn và bán vé
  const to2 = '/account?tab=identity'
  if (cccd === undefined) ds.push(B('dinh-danh', 'Xác minh danh tính', 'chua-ro', 'Chưa tải được.', to2))
  else if (cccd?.canSell || cccd?.reviewStatus === 'Approved') ds.push(B('dinh-danh', 'Xác minh danh tính', 'xong', 'Căn cước công dân đã được duyệt.', to2))
  else if (cccd?.reviewStatus === 'Rejected') ds.push(B('dinh-danh', 'Xác minh danh tính', 'tu-choi', 'Hồ sơ căn cước bị từ chối. Xem lý do rồi nộp lại.', to2))
  else if (cccd?.submittedAt) ds.push(B('dinh-danh', 'Xác minh danh tính', 'cho', 'Đã nộp căn cước, đang chờ duyệt.', to2))
  else ds.push(B('dinh-danh', 'Xác minh danh tính', 'lam', 'Nộp ảnh hai mặt căn cước công dân. Chưa được duyệt thì chưa đăng được buổi diễn.', to2))

  // 3. Tài khoản nhận tiền
  const to3 = '/owner/bank-accounts'
  if (taiKhoan === undefined) ds.push(B('nhan-tien', 'Tài khoản nhận tiền', 'chua-ro', 'Chưa tải được.', to3))
  else if ((taiKhoan ?? []).some((a) => a.isVerified)) ds.push(B('nhan-tien', 'Tài khoản nhận tiền', 'xong', 'Đã có tài khoản được xác minh.', to3))
  else if ((taiKhoan ?? []).length > 0) ds.push(B('nhan-tien', 'Tài khoản nhận tiền', 'cho', 'Đã khai, đang chờ quản trị viên xác minh. Bán vé được, nhưng tiền chỉ chuyển sau khi tài khoản được xác minh.', to3))
  else ds.push(B('nhan-tien', 'Tài khoản nhận tiền', 'lam', 'Khai tài khoản ngân hàng để nhận tiền vé sau mỗi buổi diễn.', to3))

  // 4. Khu vực chỗ ngồi — hạng vé vào cửa phải gắn với một khu
  const to4 = '/owner/zones'
  if (soKhu === undefined) ds.push(B('khu', 'Khu vực chỗ ngồi', 'chua-ro', 'Chưa tải được.', to4))
  else if (soKhu > 0) ds.push(B('khu', 'Khu vực chỗ ngồi', 'xong', `Đã có ${soKhu} khu.`, to4))
  else ds.push(B('khu', 'Khu vực chỗ ngồi', 'lam', 'Vẽ ít nhất một khu ghế. Mỗi hạng vé vào cửa phải gắn với một khu.', to4))

  // 5. Buổi diễn đầu tiên
  const to5 = '/owner/shows'
  if (buoi === undefined) ds.push(B('buoi-dien', 'Buổi diễn đầu tiên', 'chua-ro', 'Chưa tải được.', to5))
  else if (buoi.daDang > 0) ds.push(B('buoi-dien', 'Buổi diễn đầu tiên', 'xong', 'Đã có buổi diễn được duyệt và mở bán.', to5))
  else if (buoi.choDuyet > 0) ds.push(B('buoi-dien', 'Buổi diễn đầu tiên', 'cho', 'Đã gửi duyệt, đang chờ quản trị viên.', to5))
  else if (buoi.tong > 0) ds.push(B('buoi-dien', 'Buổi diễn đầu tiên', 'lam', 'Đã có bản nháp. Thêm hạng vé, khai mã tác quyền rồi gửi duyệt — nhớ gửi trước ngày diễn đủ số ngày làm việc quy định.', to5))
  else ds.push(B('buoi-dien', 'Buổi diễn đầu tiên', 'lam', 'Tạo buổi diễn, thêm hạng vé rồi gửi duyệt — nhớ gửi trước ngày diễn đủ số ngày làm việc quy định.', to5))

  return ds
}

// Xong hết thì giao diện ẩn hẳn danh sách (chủ đang vận hành bình thường không cần nhìn nó mỗi ngày).
export const daMoBanDuoc = (ds) => ds.length > 0 && ds.every((b) => b.trangThai === 'xong')

// Bước nên làm NGAY: bước đầu tiên chưa xong mà không phải đang chờ người khác.
export const buocKeTiep = (ds) => ds.find((b) => b.trangThai === 'tu-choi') ?? ds.find((b) => b.trangThai === 'lam') ?? null

export const demXong = (ds) => ds.filter((b) => b.trangThai === 'xong').length
