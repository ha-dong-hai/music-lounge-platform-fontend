import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
// Font tự host (có phân vùng tiếng Việt) — không phụ thuộc Google Fonts lúc chạy.
// Anton: tiêu đề khối hẹp của tờ chương trình · Be Vietnam Pro: chữ thân · JetBrains Mono: giờ, số tiền, số sê-ri ·
// Patrick Hand: chú thích viết tay trên ảnh Polaroid.
import '@fontsource/anton/400.css'
import '@fontsource/patrick-hand/400.css'
import '@fontsource/be-vietnam-pro/400.css'
import '@fontsource/be-vietnam-pro/500.css'
import '@fontsource/be-vietnam-pro/600.css'
import '@fontsource/be-vietnam-pro/700.css'
import '@fontsource/jetbrains-mono/400.css'
import '@fontsource/jetbrains-mono/600.css'
import './index.css'
// Lớp chuyển ngữ (i18next) — nạp TRƯỚC App; nó cũng đặt locale dayjs ('vi' mặc định, 'en' khi khách chọn English).
import './i18n'
import App from './App.jsx'

// Deploy mới thay toàn bộ tệp mã có mã băm trong tên; tab đang mở bản cũ sẽ không tải được trang kế tiếp
// ("Failed to fetch dynamically imported module", gặp thật 05/10/2026 ngay sau lần deploy thứ hai).
// MLACP-697: việc tự tải lại nay nằm ở MỘT chỗ — pages/TrangLoiUngDung.jsx (errorElement của route gốc) theo lịch ở
// utils/loiTaiTep.js. Lớp nghe vite:preloadError từng đặt ở đây đã bỏ: nó chỉ thử một lần trong 10 giây rồi để lọt ra
// trang lỗi thô của React Router (đo 06/10/2026).

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
