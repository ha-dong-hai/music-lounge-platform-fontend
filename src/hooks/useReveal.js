// src/hooks/useReveal.js
//
// GHI CHÚ CHO ĐỘI FE:
// - Hiệu ứng "hiện dần khi cuộn tới" — tương đương onScroll({ sync: true }) của animejs, viết bằng
//   IntersectionObserver thuần để không thêm thư viện cho vài chuyển động nhỏ (lý do đầy đủ ở
//   docs/design/TRANG-CHU-BRIEF.md §5).
// - Chỉ bật một lần: phần tử hiện ra rồi thì ngừng quan sát, không lặp lại khi cuộn lên cuộn xuống —
//   tránh đúng lỗi "Continuous Animation" (mức High) mà công cụ tra cứu UI/UX cục bộ cảnh báo.
// - prefers-reduced-motion đã có sẵn ở tầng CSS (.reveal trong index.css), hook này không cần biết
//   tới nó — trình duyệt tự bỏ qua transition khi người dùng bật cờ đó.
import { useEffect, useRef, useState } from 'react'

export function useReveal(threshold = 0.15) {
  const ref = useRef(null)
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    const node = ref.current
    if (!node) return
    // IntersectionObserver không có trong môi trường test/SSR nào đó lỡ thiếu — hiện luôn cho an toàn.
    if (typeof IntersectionObserver === 'undefined') {
      setIsVisible(true)
      return
    }
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true)
          observer.disconnect()
        }
      },
      { threshold, rootMargin: '0px 0px -60px 0px' }
    )
    observer.observe(node)
    return () => observer.disconnect()
  }, [threshold])

  return { ref, isVisible }
}
