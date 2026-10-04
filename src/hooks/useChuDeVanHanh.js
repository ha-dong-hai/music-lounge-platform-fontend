// src/hooks/useChuDeVanHanh.js
//
// KIỂU MÀU của màn vận hành (index.css `.khung-van-hanh[data-mau]`, bảy kiểu D…J theo mẫu thật). Tách khỏi PortalShell
// (05/10/2026) vì khung quản trị mới (components/ui/admin/khung-quan-tri) cũng cần.
//
// XEM THỬ: thêm `?mau=E` vào địa chỉ — lựa chọn được nhớ trong phiên trình duyệt. Khi chủ dự án chốt một kiểu thì bỏ tham
// số này và trả về hằng.
//
// `ganLenGoc`: gắn lớp + thuộc tính lên <html> trong lúc khung đang mở. Lý do: hộp thoại, menu thả, ngăn kéo điện thoại
// của Radix được vẽ qua cổng (portal) ngay dưới <body>, NẰM NGOÀI khung — nếu biến màu chỉ đặt trên khung thì các lớp nổi
// đó rơi về màu trang khán giả.
import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'

export const CHU_DE = ['D', 'E', 'F', 'G', 'H', 'I', 'J']
const KHOA = 'mau-van-hanh'

export const useChuDeVanHanh = ({ ganLenGoc = false } = {}) => {
  const { search } = useLocation()
  const q = new URLSearchParams(search).get('mau')
  let chuDe = 'D'
  try {
    if (q && CHU_DE.includes(q)) { sessionStorage.setItem(KHOA, q); chuDe = q } else {
      const nho = sessionStorage.getItem(KHOA)
      if (CHU_DE.includes(nho)) chuDe = nho
    }
  } catch { if (CHU_DE.includes(q)) chuDe = q }

  useEffect(() => {
    if (!ganLenGoc) return undefined
    const goc = document.documentElement
    goc.classList.add('khung-van-hanh')
    goc.setAttribute('data-mau', chuDe)
    return () => { goc.classList.remove('khung-van-hanh'); goc.removeAttribute('data-mau') }
  }, [ganLenGoc, chuDe])

  return chuDe
}
