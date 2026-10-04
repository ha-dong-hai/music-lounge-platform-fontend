// src/utils/tieuDeTrang.js
//
// MLACP-602: TIÊU ĐỀ TAB TRÌNH DUYỆT theo từng trang. Trước đây cả ~75 trang dùng chung một tiêu đề trong index.html
// ("MusicLounge — Đặt vé phòng trà Sài Gòn"): mở nhiều tab không phân biệt được, lịch sử trình duyệt toàn dòng giống nhau,
// trình đọc màn hình không báo được đã sang trang nào (WCAG 2.4.2 Page Titled).
//
// Một bảng đường dẫn → tên trang, hàm thuần để kiểm thử. Trang có tên RIÊNG theo dữ liệu (buổi diễn, phòng trà, nghệ sĩ)
// trả `null` ở đây và tự in <title> khi có dữ liệu — không bao giờ để hai <title> cùng lúc (React 19: nhiều <title> cùng
// lúc thì hành vi trình duyệt không xác định).
export const TEN_SAN_PHAM = 'MusicLounge'
export const TIEU_DE_MAC_DINH = 'MusicLounge — Đặt vé phòng trà Sài Gòn'

// Thứ tự: đường cụ thể trước, đường có tham số sau. `null` = trang tự đặt tiêu đề theo dữ liệu.
const BANG = [
  [/^\/$/, TIEU_DE_MAC_DINH, true],
  [/^\/shows(\/search)?$/, 'Buổi diễn'],
  [/^\/shows\/[^/]+$/, null],
  [/^\/lounges$/, 'Phòng trà'],
  [/^\/lounge\/[^/]+\/order$/, 'Gọi món tại bàn'],
  [/^\/lounge\/[^/]+$/, null],
  [/^\/performers\/[^/]+\/donations$/, 'Sao kê tiền ủng hộ'],
  [/^\/performers\/[^/]+$/, null],
  [/^\/minh-bach$/, 'Minh bạch tiền ủng hộ'],
  [/^\/complaints$/, 'Khiếu nại'],
  [/^\/account$/, 'Tài khoản của tôi'],
  [/^\/my-shows\/ticket\/[^/]+$/, 'Chi tiết vé'],
  [/^\/my-shows$/, 'Vé của tôi'],
  [/^\/notifications$/, 'Thông báo'],
  [/^\/dieu-khoan$/, 'Điều khoản dịch vụ'],
  [/^\/bao-mat$/, 'Chính sách bảo mật'],
  [/^\/livestream\/[^/]+$/, 'Xem trực tiếp'],
  [/^\/performer-confirmation$/, 'Xác nhận lịch diễn'],
  [/^\/login$/, 'Đăng nhập'],
  [/^\/register$/, 'Tạo tài khoản'],
  [/^\/verify-email$/, 'Xác thực email'],
  [/^\/forgot-password$/, 'Quên mật khẩu'],
  [/^\/reset-password$/, 'Đặt lại mật khẩu'],
  [/^\/payment\/success$/, 'Thanh toán thành công'],
  [/^\/payment\/failed$/, 'Thanh toán chưa thành công'],
  [/^\/payment\/processing$/, 'Đang xử lý thanh toán'],
  // Khu phòng trà
  [/^\/owner$/, 'Khu phòng trà'],
  [/^\/owner\/lounge$/, 'Hồ sơ phòng trà'],
  [/^\/owner\/zones$/, 'Khu vực chỗ ngồi'],
  [/^\/owner\/tour$/, 'Tham quan 360°'],
  [/^\/owner\/performers$/, 'Nghệ sĩ'],
  [/^\/owner\/staff$/, 'Nhân viên'],
  [/^\/owner\/fnb-menus$/, 'Thực đơn'],
  [/^\/owner\/shows\/[^/]+\/settings$/, 'Poster và cài đặt buổi diễn'],
  [/^\/owner\/shows\/[^/]+$/, 'Chuẩn bị buổi diễn'],
  [/^\/owner\/shows$/, 'Buổi diễn của phòng trà'],
  [/^\/owner\/livestreams$/, 'Phát trực tuyến'],
  [/^\/owner\/operate$/, 'Vận hành đêm diễn'],
  [/^\/owner\/fnb-orders$/, 'Đơn gọi món'],
  [/^\/owner\/finance$/, 'Tiền và quyết toán'],
  [/^\/owner\/analytics$/, 'Báo cáo doanh thu'],
  [/^\/owner\/donations$/, 'Tiền ủng hộ nghệ sĩ'],
  [/^\/owner\/bank-accounts$/, 'Tài khoản nhận tiền'],
  [/^\/owner\/subscription$/, 'Gói dịch vụ'],
  [/^\/owner\/penalties$/, 'Án phạt'],
  // Quản trị
  [/^\/admin$/, 'Tổng quan quản trị'],
  [/^\/admin\/insights$/, 'Nội dung và tương tác'],
  [/^\/admin\/shows\/[^/]+$/, 'Duyệt buổi diễn'],
  [/^\/admin\/shows$/, 'Buổi diễn (quản trị)'],
  [/^\/admin\/venues$/, 'Duyệt phòng trà'],
  [/^\/admin\/kyc-reviews$/, 'Định danh người bán'],
  [/^\/admin\/content-reports$/, 'Báo cáo vi phạm'],
  [/^\/admin\/refunds$/, 'Hoàn tiền'],
  [/^\/admin\/settlements$/, 'Quyết toán'],
  [/^\/admin\/ledger$/, 'Sổ cái'],
  [/^\/admin\/bank-accounts$/, 'Duyệt tài khoản nhận tiền'],
  [/^\/admin\/packages$/, 'Gói dịch vụ (quản trị)'],
  [/^\/admin\/complaint$/, 'Xử lý khiếu nại'],
  [/^\/admin\/penalty-appeals$/, 'Khiếu nại án phạt'],
  [/^\/admin\/accounts$/, 'Tài khoản người dùng'],
  [/^\/admin\/filter-options$/, 'Danh mục'],
  [/^\/admin\/system-config$/, 'Cấu hình hệ thống'],
]

// Trả: chuỗi tiêu đề đầy đủ; `null` nếu trang tự đặt; đường lạ (404) → "Không có trang này".
export const tieuDeTheoDuong = (pathname = '/') => {
  const p = pathname.replace(/\/+$/, '') || '/'
  const dong = BANG.find(([re]) => re.test(p))
  if (!dong) return `Không có trang này — ${TEN_SAN_PHAM}`
  const [, ten, nguyenVan] = dong
  if (ten === null) return null
  return nguyenVan ? ten : `${ten} — ${TEN_SAN_PHAM}`
}

// Cho trang tự đặt tiêu đề theo dữ liệu ("Tình khúc vượt thời gian — MusicLounge").
export const tieuDeRieng = (ten) => (ten ? `${ten} — ${TEN_SAN_PHAM}` : TIEU_DE_MAC_DINH)
