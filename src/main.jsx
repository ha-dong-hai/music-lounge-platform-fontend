import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
// Đa ngôn ngữ: khởi tạo i18next TRƯỚC khi render. File này cũng đặt locale dayjs (thứ, tháng)
// theo ngôn ngữ người dùng chọn (mặc định tiếng Việt).
import './i18n'
import App from './App.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
