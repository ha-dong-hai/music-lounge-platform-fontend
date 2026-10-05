import { Pencil, EyeOff, Ticket, Sparkles, Box, X } from 'lucide-react'
import { formatCurrency } from '../../../utils/format'

// 30/09/2026: chữ trên thẻ về tiếng Việt (bản cũ in "Monthly", "Ticket / Show", "Do not suport Poster AI", "Unhide");
// bỏ quầng sáng mờ trang trí và đổ bóng phát sáng khi rê chuột; nút sửa/ẩn LUÔN hiện (bản cũ chỉ hiện khi rê chuột —
// trên màn cảm ứng không bấm được) và có nhãn cho trình đọc màn hình.
// Đủ ba giá trị của SubscriptionBillingCycle. Bản cũ thiếu Quarterly và rơi về 'tháng' — gói theo quý bị in giá "/ tháng".
const CHU_KY = { Monthly: 'tháng', Quarterly: 'quý', Yearly: 'năm' }
const chuKy = (c) => CHU_KY[c] ?? c

// Kiểu hiển thị 1 feature
const Feature = ({ icon: Icon, label, enabled }) => (
  <div className="flex items-center gap-3">
    <div className={`w-8 h-8 flex items-center justify-center flex-shrink-0 border ${
      enabled
        ? 'bg-ink/10 border-line'
        : 'bg-danger/5 border-danger/15'
    }`}>
      {enabled
        ? <Icon size={15} className="text-ink" />
        : <X size={15} className="text-danger" strokeWidth={3} />}
    </div>
    <span className={`text-sm ${enabled ? 'text-ink-soft' : 'text-ink-mute'}`}>{label}</span>
  </div>
)

// ============ CARD FULL — dành cho gói ĐANG HIỂN THỊ ============
export const PackageCard = ({ pkg, onEdit, onToggleStatus }) => {
  const features = [
    { icon: Ticket, label: `${pkg.maxTicketsPerEvent?.toLocaleString('vi-VN')} vé mỗi buổi diễn`, enabled: true },
    { icon: Sparkles, label: pkg.hasAiPoster ? `${pkg.maxAiPostersPerMonth} áp phích AI mỗi tháng` : 'Không có áp phích AI', enabled: pkg.hasAiPoster },
    { icon: Box, label: pkg.maxTourScenes > 0 ? `${pkg.maxTourScenes} cảnh tham quan 360°` : 'Không có tham quan 360°', enabled: pkg.maxTourScenes > 0 },
  ]

  return (
    <div className="relative bg-card border border-line p-6 flex flex-col overflow-hidden border-ink">

      {/* ===== HEADER ===== */}
      <div className="relative z-[1]">
        {/* Tên + thao tác cùng một hàng (01/10/2026): bản cũ đặt hai nút tuyệt đối ở góc mà tên chỉ chừa pr-14 (56px) cho
            ~92px nút — tên dài bị cắt và đè lên nút Sửa. Tên nay xuống dòng, không cắt. */}
        <div className="flex items-start justify-between gap-3 mb-2">
          <h3 className="text-xl font-bold text-ink min-w-0 break-words">{pkg.name}</h3>
          <div className="flex gap-2 flex-shrink-0">
            <button type="button" onClick={() => onEdit(pkg)} aria-label={`Sửa gói ${pkg.name}`}
              className="w-11 h-11 inline-flex items-center justify-center border-2 border-ink text-ink hover:bg-ink hover:text-lamp">
              <Pencil size={15} aria-hidden="true" />
            </button>
            <button type="button" onClick={() => onToggleStatus(pkg)} aria-label={`Ẩn gói ${pkg.name}`}
              className="w-11 h-11 inline-flex items-center justify-center border-2 border-ink text-ink hover:bg-ink hover:text-lamp">
              <EyeOff size={15} aria-hidden="true" />
            </button>
          </div>
        </div>
        <span className="inline-flex px-2.5 py-1 text-xs font-semibold border border-ink">
          Trả theo {chuKy(pkg.billingCycle)}
        </span>
        <p 
        title={pkg.description || ''}
        className="text-sm text-ink-mute line-clamp-2 min-h-[40px] mt-3">
          {pkg.description || "Chưa có mô tả"}
        </p>
      </div>

      {/* ===== GIÁ ===== */}
      <div className="relative z-[1] flex items-end gap-1.5 mb-5 mt-3">
        {pkg.price > 0 ? (
          <>
            <span className="font-display text-5xl leading-none text-ink">
              {formatCurrency(pkg.price)}
            </span>
            <span className="text-lg font-bold text-ink mb-0.5">đ</span>
            <span className="text-ink-mute text-sm mb-1">/ {chuKy(pkg.billingCycle)}</span>
          </>
        ) : (
          <span className="text-[34px] leading-none font-bold text-ink">
            Miễn phí
          </span>
        )}
      </div>

      {/* Divider */}
      <div className="relative z-[1] h-px bg-ink/20 mb-5" />

      {/* ===== FEATURE LIST ===== */}
      <div className="relative z-[1] space-y-3.5 flex-1">
        {features.map(f => (
          <Feature key={f.label} icon={f.icon} label={f.label} enabled={f.enabled} />
        ))}
      </div>

        {/* MLACP-672: bỏ chân thẻ chỉ chứa mã gói — tên gói đã ở đầu thẻ, mã không giúp Admin làm gì. */}
    </div>
  )
}

// ============ CARD MINI — dành cho gói ĐANG ẨN (1 hàng ngang, mờ nhẹ) ============
export const HiddenPackageCard = ({ pkg, onEdit, onRestore }) => {
  const miniFeatures = [
    { label: `${pkg.maxTicketsPerEvent?.toLocaleString('vi-VN')} vé`, enabled: true },
    { label: 'Poster AI', enabled: pkg.hasAiPoster },
    { label: 'Cảnh tham quan 360°', enabled: pkg.maxTourScenes > 0 },
  ]

  return (
    <div className="bg-card/60 border border-line/70 p-4 flex flex-col lg:flex-row lg:items-center gap-3 opacity-60 hover:opacity-100 transition-all duration-300 hover:border-line">

      {/* Tên + giá */}
      <div className="flex items-center gap-3 flex-1 min-w-0">
        <div className="w-10 h-10 bg-sunken border border-line/50 flex items-center justify-center flex-shrink-0">
          <Box size={18} className="text-ink-mute" />
        </div>
        <div className="min-w-0">
          <h4 className="text-base font-bold text-ink-soft truncate">{pkg.name}</h4>
          <p className="text-xs text-ink-mute">
            {pkg.price > 0 ? `${formatCurrency(pkg.price)}đ / ${chuKy(pkg.billingCycle)}` : 'Miễn phí'}
          </p>
        </div>
      </div>

      {/* Feature mini pills */}
      <div className="flex items-center gap-2 flex-wrap">
        {miniFeatures.map(f => (
          <span key={f.label} className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-xs border ${
            f.enabled
              ? 'bg-ink/10 text-ink/80 border-line'
              : 'bg-danger/5 text-ink-mute border-danger/15'
          }`}>
            {f.enabled
              ? <span className="w-1.5 h-1.5 bg-ink/70" />
              : <X size={11} className="text-danger/80" strokeWidth={3} />}
            {f.label}
          </span>
        ))}
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2 flex-shrink-0">
        <button
          onClick={() => onEdit(pkg)}
          className="inline-flex items-center justify-center w-11 h-11 flex-shrink-0 border border-line/60 text-ink-mute hover:text-ink hover:border-ink/50 transition-colors"
          title="Sửa gói" aria-label="Sửa gói"
        >
          <Pencil size={14} />
        </button>
        <button
          onClick={() => onRestore(pkg)}
          className="flex items-center gap-1.5 justify-center min-h-[44px] px-4 bg-ink text-lamp text-sm font-semibold hover:bg-board"
        >
          <EyeOff size={13} className="rotate-180" aria-hidden="true" /> Hiện lại
        </button>
      </div>
    </div>
  )
}

export default PackageCard