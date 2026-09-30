// src/components/shared/NhanTrangThai.jsx
//
// NHÃN TRẠNG THÁI DÙNG CHUNG cho mọi màn vận hành (30/09/2026). Trước đây sáu tệp (ShowBadges, VenueBadges, accounts/
// Badges, KycBadges, PenaltyBadges, ComplaintBadges) tự đặt màu riêng; vài nhãn chỉ khác nhau bằng một chấm màu, vài
// nhãn in chữ tiếng Anh ("Active", "Banned", mã trạng thái thô).
//
// LUẬT (reports/Form lọc vé và màn vận hành.md):
//  - Màu KHÔNG là tín hiệu duy nhất (WCAG 2.2 SC 1.4.1): mỗi sắc thái có một BIỂU TƯỢNG riêng, và chữ luôn nói trạng thái.
//  - Ít sắc thái: IBM Carbon lưu ý quá 5–6 kiểu chỉ báo là quá tải. Ở đây đúng 5 + "đang diễn" (ember, luật riêng của
//    thế giới: vàng thếp CHỈ cho buổi đang diễn).
//  - Nhãn KHÔNG bấm được (GOV.UK tag) và dùng tính từ, không dùng động từ.
import { CheckCircle2, Clock, XCircle, Circle, MinusCircle, Radio } from 'lucide-react'

const SAC_THAI = {
  tot: { icon: CheckCircle2, lop: 'border-success text-success' },   // xong, hợp lệ, đang hoạt động
  cho: { icon: Clock, lop: 'border-warning text-warning' },          // đang chờ ai đó làm gì
  xau: { icon: XCircle, lop: 'border-danger text-danger' },          // bị từ chối, khoá, thất bại
  trung: { icon: Circle, lop: 'border-ink text-ink' },               // trạng thái bình thường, không cần làm gì
  tat: { icon: MinusCircle, lop: 'border-ink/40 text-ink-mute' },    // đã kết thúc, hết hiệu lực, nháp
  dien: { icon: Radio, lop: 'border-ember bg-ember text-board' },    // đang diễn
}

const NhanTrangThai = ({ sacThai = 'trung', children, icon, className = '' }) => {
  const s = SAC_THAI[sacThai] ?? SAC_THAI.trung
  const Icon = icon ?? s.icon
  return (
    <span className={`inline-flex items-center gap-1.5 px-2 min-h-[26px] border text-xs font-semibold whitespace-nowrap ${sacThai === 'dien' ? '' : 'bg-card'} ${s.lop} ${className}`}>
      <Icon size={13} aria-hidden="true" className="flex-shrink-0" />
      <span className="text-current">{children}</span>
    </span>
  )
}

export default NhanTrangThai
