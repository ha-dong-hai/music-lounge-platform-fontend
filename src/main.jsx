import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
// Font tự host (có phân vùng tiếng Việt) — không phụ thuộc Google Fonts lúc chạy.
// Anton: tiêu đề khối hẹp của tờ chương trình · Be Vietnam Pro: chữ thân · JetBrains Mono: giờ, số tiền, số sê-ri.
import '@fontsource/anton/400.css'
import '@fontsource/be-vietnam-pro/400.css'
import '@fontsource/be-vietnam-pro/500.css'
import '@fontsource/be-vietnam-pro/600.css'
import '@fontsource/be-vietnam-pro/700.css'
import '@fontsource/jetbrains-mono/400.css'
import '@fontsource/jetbrains-mono/600.css'
import './index.css'
import dayjs from 'dayjs'
import 'dayjs/locale/vi'

// Ngày giờ hiển thị bằng tiếng Việt (thứ, tháng) trên toàn ứng dụng.
dayjs.locale('vi')
import App from './App.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
