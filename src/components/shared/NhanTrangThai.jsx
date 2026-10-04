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
//
// MLACP-619 (04/10/2026) — ĐỘ NỔI THEO MỨC CẦN CHÚ Ý. Chủ dự án: trạng thái "mờ nhạt, lẫn lộn, khó phân biệt". Đo được:
// bản cũ chỉ tô màu ở viền 1px và chữ 12px trên nền giấy, mà ba màu trạng thái đã phải làm tối để đạt AA nên ở cỡ nhỏ trông
// gần như cùng một màu nâu sẫm. Đã dựng thử trên trang thật (ảnh ban-mau/rasoat/mau_*.png):
//   - nền nhạt 15% cho cả ba (thẻ GOV.UK): gần như không khác bản cũ — nền chỉ chênh 1,2 lần so với giấy;
//   - nền đặc cho cả ba: rõ, nhưng cả cột "Đã xuất bản" xanh đặc kéo mắt vào trạng thái KHÔNG cần làm gì.
// Chốt theo Atlassian Design System — Lozenge: kiểu đặc (bold) dùng tiết chế, cho trạng thái cần chú ý:
//   - cho (đang chờ ai đó làm gì) và xau (từ chối, khoá, thất bại): NỀN ĐẶC, chữ lamp — 6,01:1 và 5,48:1;
//   - tot (xong, hợp lệ): nền nhạt 15% cùng sắc, chữ success — khoảng 5,4:1; vẫn phân biệt được nhưng không gây ồn;
//   - trung, tat: giữ viền như cũ; dien: vàng thếp đặc (luật riêng).
// Mọi cặp chữ/nền đều >= 4.5:1 (WCAG 2.2 SC 1.4.3), đo bằng công thức WCAG sau khi trộn màu như color-mix(in srgb).
import { CheckCircle2, Clock, XCircle, Circle, MinusCircle, Radio } from 'lucide-react'

const SAC_THAI = {
  tot: { icon: CheckCircle2, lop: 'border-success text-success bg-success/15' },   // xong, hợp lệ, đang hoạt động
  cho: { icon: Clock, lop: 'border-warning bg-warning text-lamp' },                 // đang chờ ai đó làm gì
  xau: { icon: XCircle, lop: 'border-danger bg-danger text-lamp' },                 // bị từ chối, khoá, thất bại
  trung: { icon: Circle, lop: 'border-ink text-ink' },               // trạng thái bình thường, không cần làm gì
  tat: { icon: MinusCircle, lop: 'border-ink/40 text-ink-mute' },    // đã kết thúc, hết hiệu lực, nháp
  dien: { icon: Radio, lop: 'border-ember bg-ember text-board' },    // đang diễn
}

// Sắc thái tự tô nền — không phủ bg-card lên.
const CO_NEN_RIENG = new Set(['tot', 'cho', 'xau', 'dien'])

const NhanTrangThai = ({ sacThai = 'trung', children, icon, className = '' }) => {
  const s = SAC_THAI[sacThai] ?? SAC_THAI.trung
  const Icon = icon ?? s.icon
  return (
    <span className={`inline-flex items-center gap-1.5 px-2 min-h-[26px] border text-xs font-semibold whitespace-nowrap ${CO_NEN_RIENG.has(sacThai) ? '' : 'bg-card'} ${s.lop} ${className}`}>
      <Icon size={13} aria-hidden="true" className="flex-shrink-0" />
      <span className="text-current">{children}</span>
    </span>
  )
}

export default NhanTrangThai
