// src/i18n/VungTiengViet.jsx
//
// VÙNG LUÔN TIẾNG VIỆT — khu chủ phòng trà / nhân viên / admin (PortalShell bọc cả hai). Chủ dự án chọn chỉ dịch phần khán
// giả; nhưng ngôn ngữ là lựa chọn TOÀN TRANG, và các khối dùng chung (bảng, phân trang, hộp xác nhận…) đã có t(). Không có
// vùng này thì người chọn English rồi vào /owner sẽ thấy câu nửa Anh nửa Việt ("No buổi diễn"), ngày "Saturday", và lỗi
// máy chủ tiếng Anh giữa giao diện tiếng Việt.
//
// Trong vùng: (1) useTranslation() nhận bản i18n khoá 'vi' → mọi t() trả câu gốc; (2) dayjs đặt 'vi' ngay khi vẽ;
// (3) axios gửi Accept-Language: vi (đọc ngonNguGuiMayChu()). Ra khỏi vùng thì trả về ngôn ngữ người dùng đã chọn.
import { useEffect } from 'react'
import { I18nextProvider } from 'react-i18next'
import dayjs from 'dayjs'
import i18n, { batVungViet } from './index'

const banViet = i18n.cloneInstance({ lng: 'vi' })

const VungTiengViet = ({ children }) => {
  // Đặt ngay lúc vẽ (không đợi effect): con vẽ TRƯỚC khi effect chạy, đợi thì lần vẽ đầu đã in ngày tiếng Anh.
  dayjs.locale('vi')
  useEffect(() => batVungViet(), [])
  return <I18nextProvider i18n={banViet}>{children}</I18nextProvider>
}

export default VungTiengViet
