// src/hooks/useGiamChuyenDong.js
//
// Người dùng có bật "giảm chuyển động" ở hệ điều hành không.
//
// Tách riêng khỏi MotionGuard.jsx vì một file vừa xuất component vừa xuất hook thì Fast Refresh của
// Vite không chạy được (eslint-plugin-react-refresh báo đúng chỗ này) — sửa một dòng là cả trang
// tải lại thay vì thay nóng.
//
// Theo dõi tiếp chứ không chỉ đọc một lần: người dùng đổi cài đặt giữa chừng thì giao diện phải đổi
// theo mà không cần tải lại trang.
import { useState, useEffect } from 'react'

export const useGiamChuyenDong = () => {
  const [giam, setGiam] = useState(
    () => typeof matchMedia !== 'undefined' && matchMedia('(prefers-reduced-motion: reduce)').matches
  )
  useEffect(() => {
    if (typeof matchMedia === 'undefined') return
    const mq = matchMedia('(prefers-reduced-motion: reduce)')
    const doi = (e) => setGiam(e.matches)
    mq.addEventListener('change', doi)
    return () => mq.removeEventListener('change', doi)
  }, [])
  return giam
}
