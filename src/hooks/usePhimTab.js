// src/hooks/usePhimTab.js
//
// BÀN PHÍM CHO TABLIST — theo WAI-ARIA APG, mẫu Tabs kích hoạt tự động (https://www.w3.org/WAI/ARIA/apg/patterns/tabs/):
//  - Mũi tên phải/trái: sang tab kế/trước (vòng tròn), chọn luôn và chuyển focus theo.
//  - Home/End: tab đầu/cuối.
//  - Roving tabindex: chỉ tab ĐANG CHỌN có tabIndex 0; các tab khác -1 → phím Tab đi thẳng vào nội dung, không phải
//    nhấn qua từng tab.
// Một nguồn cho mọi tablist của web (03/10/2026): trước đây chỉ KhongGianPhongTra làm đủ, còn trang buổi diễn và Vé của
// tôi chỉ bấm chuột được — người dùng bàn phím phải Tab qua từng tab và không có phím mũi tên.
//
// Dùng: const phim = usePhimTab(dsKhoa, khoaDangChon, chon)  →  <button role="tab" {...phim(khoa)} …>
import { useCallback, useRef } from 'react'

export default function usePhimTab(dsKhoa, dangChon, chon) {
  const tabRef = useRef({})
  return useCallback((khoa) => ({
    ref: (el) => { tabRef.current[khoa] = el },
    tabIndex: khoa === dangChon ? 0 : -1,
    onKeyDown: (e) => {
      const n = dsKhoa.length
      const i = dsKhoa.indexOf(khoa)
      const toi = { ArrowRight: (i + 1) % n, ArrowLeft: (i - 1 + n) % n, Home: 0, End: n - 1 }[e.key]
      if (toi == null) return
      e.preventDefault()
      chon(dsKhoa[toi])
      tabRef.current[dsKhoa[toi]]?.focus()
    },
  }), [dsKhoa, dangChon, chon])
}
