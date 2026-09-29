// src/components/shared/MotionGuard.jsx
//
// ĐÃ CHUYỂN KHỎI src/components/reactbits/ ngày 23/09/2026. Lý do: file này là ĐỒ TỰ VIẾT, không
// phải component của react-bits — để nó nằm trong thư mục hàng đi lấy về khiến cây thư mục nói dối
// rằng đã dùng thư viện nhiều hơn thực tế. Cổng scripts/kiem-component.mjs sinh ra để bắt đúng
// kiểu nhầm lẫn này.
//
// TUỔI THỌ NGẮN: khi tầng chuyển động chuyển sang framer-motion (§11), file này bị XOÁ — thư viện
// đó có sẵn useReducedMotion() và <MotionConfig reducedMotion="user">, không cần lớp bọc tự may.
//
// LỚP BẢO VỆ cho các component lấy từ thư viện React Bits.
//
// VÌ SAO CẦN: đã kiểm từng file tải về — KHÔNG file nào xử lý `prefers-reduced-motion`
// (grep 'prefers-reduced-motion|reducedMotion|matchMedia' trên cả thư mục: 0 kết quả). Trong khi
// đó cả WCAG 2.3.3 lẫn chính brief của dự án (docs/design/TRANG-CHU-BRIEF.md §5) đều bắt buộc mọi
// chuyển động trang trí phải dừng khi người dùng bật cờ đó ở hệ điều hành.
//
// Vì vậy KHÔNG gọi thẳng component của thư viện vào trang. Bọc qua đây: bật cờ giảm chuyển động
// thì render thẳng nội dung tĩnh, không nạp hiệu ứng nào cả — nhanh hơn và đúng chuẩn hơn là chạy
// hiệu ứng rồi tắt ở tầng CSS.
//
// NGUỒN THƯ VIỆN: react-bits (github.com/DavidHDev/react-bits), giấy phép MIT + Commons Clause —
// dùng được cho cả mục đích thương mại; Commons Clause chỉ cấm bán lại CHÍNH thư viện đó.
// Bản lấy về là biến thể JS + Tailwind (src/tailwind), khớp stack dự án (JavaScript, không TS).
import { useGiamChuyenDong } from '../../hooks/useGiamChuyenDong'

// `khiTat` là thứ hiển thị khi người dùng tắt chuyển động — phải là BẢN TĨNH CÙNG NỘI DUNG,
// không phải khoảng trống. Tắt hiệu ứng không được làm mất chữ.
const MotionGuard = ({ khiTat, children }) => {
  const giam = useGiamChuyenDong()
  return giam ? khiTat : children
}

export default MotionGuard
