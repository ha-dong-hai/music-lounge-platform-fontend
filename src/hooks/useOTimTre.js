// src/hooks/useOTimTre.js
//
// Ô TÌM GỬI LÊN MÁY CHỦ SAU KHI NGỪNG GÕ — dùng chung cho mọi danh sách dùng hooks/useDanhSachMayChu (01/10/2026; tách
// ra từ OwnerPerformersPage khi trang thứ hai — AdminAccountsPage — cần đúng việc này).
//
//  - Gõ tới đâu ô hiện tới đó (state riêng), nhưng chỉ ghi lên URL/gọi API sau `tre` ms ngừng gõ — không gọi API mỗi phím.
//    Ghi qua ds.datBoLoc nên luôn về trang 1 (bẫy 1 của useDanhSachMayChu).
//  - Bấm Quay lại làm URL đổi → ô theo URL. Điều chỉnh state ngay lúc vẽ, không dùng effect (React docs "Adjusting some
//    state when a prop changes").
//  - GIỚI HẠN: gõ tiếp trong vài mili-giây giữa lúc hẹn giờ bắn và URL cập nhật thì ô có thể bị đặt lại về giá trị vừa
//    gửi. Chưa gặp khi thử bằng tay; nếu gặp thì so thêm "giá trị đã gửi" trước khi đồng bộ.
import { useEffect, useRef, useState } from 'react'

export const useOTimTre = (ds, khoa, tre = 300) => {
  const trenUrl = ds.boLoc[khoa] ?? ''
  const [oTim, setOTim] = useState(trenUrl)
  const [daDong, setDaDong] = useState(trenUrl)
  if (trenUrl !== daDong) { setDaDong(trenUrl); setOTim(trenUrl) }

  // ds là đối tượng mới mỗi lần vẽ — giữ hàm ghi trong ref để hẹn giờ không bị khởi động lại mỗi lần vẽ.
  const ghi = useRef(ds.datBoLoc)
  useEffect(() => { ghi.current = ds.datBoLoc })
  useEffect(() => {
    if (oTim === trenUrl) return undefined
    const h = setTimeout(() => ghi.current({ [khoa]: oTim.trim() ? oTim : null }), tre)
    return () => clearTimeout(h)
  }, [oTim, trenUrl, khoa, tre])

  return [oTim, setOTim]
}
