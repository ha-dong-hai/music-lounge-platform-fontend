// src/components/shared/OTruong.jsx
//
// Ô NHẬP DÙNG CHUNG cho mọi form ngoài năm trang tài khoản (30/09/2026): OTruong bọc một ô bất kỳ (<input>, <select>,
// <textarea>) với nhãn LUÔN NHÌN THẤY + gợi ý + lỗi, và tự nối chúng với ô:
//   nhãn  → <label htmlFor={id}>          (tên của ô cho trình đọc màn hình, WCAG 1.3.1 / 4.1.2)
//   gợi ý → aria-describedby, in TRƯỚC ô và luôn hiện (người dùng đọc luật trước khi gõ)
//   lỗi   → aria-describedby + aria-invalid, in dưới ô, chữ đậm màu danger kèm chữ (không chỉ màu)
// Có từ khi rà soát thấy 150/178 ô nhập của web không có tên (scripts/kiem-o-nhap-khong-ten.mjs).
//
// Cách dùng: <OTruong nhan="Mã buổi diễn" batBuoc goiY="…" loi={loi.ma}>{(p) => <input {...p} value=… onChange=… />}</OTruong>
// Hàm con nhận sẵn { id, className, aria-* } — trải vào ô là xong.
import { useId } from 'react'
import { useTranslation } from 'react-i18next'

const LOP_O = 'w-full min-h-[48px] px-3 bg-card border-2 text-ink text-base focus:outline-none focus:ring-2 focus:ring-ink focus:ring-offset-2 focus:ring-offset-card disabled:bg-sunken disabled:text-ink-mute'

const OTruong = ({ nhan, goiY, loi, batBuoc = false, khongBatBuoc = false, className = '', children }) => {
  const { t } = useTranslation()
  const id = useId()
  const moTa = [goiY ? `${id}-goi-y` : null, loi ? `${id}-loi` : null].filter(Boolean).join(' ') || undefined
  return (
    <div className={className}>
      <label htmlFor={id} className="block font-semibold text-ink mb-1">
        {nhan}
        {batBuoc && <span className="text-danger" aria-hidden="true"> *</span>}
        {batBuoc && <span className="sr-only"> {t('(bắt buộc)')}</span>}
        {khongBatBuoc && <span className="font-normal text-ink-mute"> {t('(không bắt buộc)')}</span>}
      </label>
      {goiY && <p id={`${id}-goi-y`} className="text-sm text-ink-soft mb-1.5">{goiY}</p>}
      {children({
        id,
        'aria-describedby': moTa,
        'aria-invalid': loi ? 'true' : undefined,
        'aria-required': batBuoc || undefined,
        className: `${LOP_O} ${loi ? 'border-danger' : 'border-ink'}`,
      })}
      {loi && <p id={`${id}-loi`} className="mt-1.5 text-sm font-semibold text-danger">{loi}</p>}
    </div>
  )
}

export default OTruong
