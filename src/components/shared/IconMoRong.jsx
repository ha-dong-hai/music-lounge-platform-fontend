// src/components/shared/IconMoRong.jsx
//
// BIỂU TƯỢNG MỞ RỘNG / THU GỌN cho nút disclosure (`<button aria-expanded>`): một mũi tên xuống nét mảnh, mở ra thì xoay
// ngược lên — trượt êm 0,3s. Thay cặp dấu +/− kèm chữ gạch dưới (02/10/2026, chủ dự án: gạch dưới xấu, "cứng nhắc").
// WAI-ARIA APG Disclosure pattern dùng mũi tên hướng xuống/lên để báo trạng thái; dấu +/− là hai hình khác nhau nên không
// thể chuyển động liền mạch.
//
// Đặt ở CÙNG vị trí trong cả hai nhánh của toán tử ba ngôi (vd `mo ? <><IconMoRong mo /> Thu gọn</> : <><IconMoRong /> Xem
// thêm</>`) — React giữ nguyên phần tử nên lớp rotate đổi tại chỗ và CSS transition chạy được.
import { ChevronDown } from 'lucide-react'

const IconMoRong = ({ mo = false, size = 18 }) => (
  <ChevronDown size={size} strokeWidth={1.75} aria-hidden="true"
    className={`flex-shrink-0 motion-safe:transition-transform motion-safe:duration-300 motion-safe:ease-[cubic-bezier(.22,1,.36,1)] ${mo ? 'rotate-180' : ''}`} />
)

export default IconMoRong
