// src/components/shared/DoanVanDai.jsx
//
// ĐOẠN VĂN DO NGƯỜI DÙNG NHẬP, CÓ THỂ RẤT DÀI (giới thiệu phòng trà, mô tả buổi diễn) — cắt khi thật sự dài.
//
// VÌ SAO: phần giới thiệu không có giới hạn độ dài; một phòng trà dán 40 dòng là đẩy lịch diễn và chỗ ngồi xuống
// dưới ba màn hình điện thoại.
//
// QUYẾT ĐỊNH VÀ NGUỒN (research_notes/Trang phòng trà ảnh và lịch diễn/bo_anh_va_doan_van_dai.md):
//  - Đoạn ngắn và vừa thì IN HẾT, không có nút. NN/g: trên máy tính cuộn rẻ hơn bấm, và nội dung bị giấu có thể bị
//    bỏ lỡ hẳn.
//  - SO_DONG = 6 dòng khi thu gọn. KHÔNG có nguồn sơ cấp nào cho con số dòng "đúng" — đây là LỰA CHỌN THIẾT KẾ
//    (sáu dòng là một đoạn văn trọn ý ở bề rộng 65 ký tự). Đổi khi có số đo thật.
//  - AN_TOI_THIEU = 3: chỉ cắt khi phần bị giấu từ 3 dòng trở lên. Baymard ("Never truncate a single value", áp
//    tương tự sang đoạn văn): nút mở rộng chiếm chỗ bằng chính thứ nó giấu thì đừng cắt. Đo chiều cao THẬT sau khi
//    dựng, không đếm ký tự — cùng một đoạn văn là 5 dòng trên máy tính và 14 dòng trên điện thoại.
//  - Nút là <button aria-expanded> đặt ngay sau đoạn văn (mẫu "disclosure" của WAI-ARIA APG), nhãn tự mô tả.
//  - Toàn văn vẫn nằm trong trang khi thu gọn (chỉ cắt phần hiển thị): tìm trong trang (Ctrl+F) và trình đọc màn
//    hình vẫn đọc được hết.
//
// GIỚI HẠN ĐÃ BIẾT: chỉ dùng cho chữ thuần. Đoạn có liên kết bên trong thì không được cắt kiểu này (Primer: không
// cắt chữ chứa phần tử bấm được) — liên kết nằm trong vùng bị cắt vẫn nhận focus mà không nhìn thấy.
import { useId, useLayoutEffect, useRef, useState } from 'react'
import IconMoRong from './IconMoRong'

export const SO_DONG = 6
export const AN_TOI_THIEU = 3

const KEP = { display: '-webkit-box', WebkitBoxOrient: 'vertical', WebkitLineClamp: SO_DONG, overflow: 'hidden' }

const DoanVanDai = ({ children, nhanMo = 'Đọc tiếp', nhanDong = 'Thu gọn', className = '' }) => {
  const id = useId()
  const ref = useRef(null)
  const [canCat, setCanCat] = useState(false)
  const [mo, setMo] = useState(false)

  // Đo với phần kẹp đang áp: scrollHeight là chiều cao đủ, clientHeight là chiều cao sau khi kẹp.
  useLayoutEffect(() => {
    const el = ref.current
    if (!el) return
    const do_ = () => {
      const cu = el.getAttribute('style')
      Object.assign(el.style, { display: '-webkit-box', webkitBoxOrient: 'vertical', webkitLineClamp: String(SO_DONG), overflow: 'hidden' })
      const dong = parseFloat(getComputedStyle(el).lineHeight) || 24
      const an = (el.scrollHeight - el.clientHeight) / dong
      if (cu == null) el.removeAttribute('style'); else el.setAttribute('style', cu)
      setCanCat(an >= AN_TOI_THIEU)
    }
    do_()
    const ro = new ResizeObserver(do_)
    ro.observe(el)
    return () => ro.disconnect()
  }, [children])

  return (
    <div>
      <p id={id} ref={ref} style={canCat && !mo ? KEP : undefined} className={`whitespace-pre-line ${className}`}>{children}</p>
      {canCat && (
        <button type="button" onClick={() => setMo((v) => !v)} aria-expanded={mo} aria-controls={id}
          className="inline-flex items-center gap-1.5 min-h-[44px] mt-1 text-sm font-semibold text-ink hover:text-board">
          {mo ? <><IconMoRong mo /> {nhanDong}</> : <><IconMoRong /> {nhanMo}</>}
        </button>
      )}
    </div>
  )
}

export default DoanVanDai
