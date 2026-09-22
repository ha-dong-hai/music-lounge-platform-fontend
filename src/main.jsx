import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
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
