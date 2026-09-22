import { Pencil, EyeOff, Ticket, Sparkles, Box, X } from 'lucide-react'
import { formatCurrency } from '../../../utils/format'

// Kiểu hiển thị 1 feature
const Feature = ({ icon: Icon, label, enabled }) => (
  <div className="flex items-center gap-3">
    <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 border ${
      enabled
        ? 'bg-brand/10 border-brand/25'
        : 'bg-red-500/5 border-red-500/15'
    }`}>
      {enabled
        ? <Icon size={15} className="text-brand-text" />
        : <X size={15} className="text-danger" strokeWidth={3} />}
    </div>
    <span className={`text-sm ${enabled ? 'text-ink-soft' : 'text-ink-mute'}`}>{label}</span>
  </div>
)

// ============ CARD FULL — dành cho gói ĐANG HIỂN THỊ ============
export const PackageCard = ({ pkg, onEdit, onToggleStatus }) => {
  const features = [
    { icon: Ticket, label: `${pkg.maxTicketsPerEvent?.toLocaleString('vi-VN')} Ticket / Show`, enabled: true },
    { icon: Sparkles, label: pkg.hasAiPoster ? `${pkg.maxAiPostersPerMonth} poster AI / Month` : 'Do not suport Poster AI', enabled: pkg.hasAiPoster },
    { icon: Box, label: pkg.maxTourScenes > 0 ? `${pkg.maxTourScenes} tour digital 360°` : 'Do not support Tour digital 360°', enabled: pkg.maxTourScenes > 0 },
  ]

  return (
    <div className="relative bg-card rounded-2xl border border-line p-6 flex flex-col overflow-hidden transition-all duration-300 group hover:border-brand/60 hover:-translate-y-1.5 hover:shadow-[0_12px_45px_rgba(195,182,101,0.13)]">

      {/* Ánh vàng trang trí */}
      <div className="absolute -top-12 -right-12 w-44 h-44 bg-brand/8 rounded-full blur-3xl pointer-events-none" />

      {/* ===== ACTIONS — hiện khi hover góc phải (giữ nguyên) ===== */}
      <div className="absolute top-4 right-4 z-10 flex gap-1.5 opacity-0 group-hover:opacity-100 translate-y-1 group-hover:translate-y-0 transition-all duration-200">
        <button
          onClick={() => onEdit(pkg)}
          className="p-2 bg-espresso/70 backdrop-blur-md border border-white/10 text-ink-soft hover:text-brand-text hover:border-brand/50 rounded-lg transition-colors"
          title="Edit Package"
        >
          <Pencil size={13} />
        </button>
        <button
          onClick={() => onToggleStatus(pkg)}
          className="p-2 bg-espresso/70 backdrop-blur-md border border-white/10 text-ink-soft hover:text-brand-text hover:border-brand/50 rounded-lg transition-colors"
          title="Hide Package"
        >
          <EyeOff size={13} />
        </button>
      </div>

      {/* ===== HEADER ===== */}
      <div className="relative z-[1]">
        <div className="flex items-center gap-2.5 mb-2 pr-14">
          <h3 className="text-xl font-bold text-ink truncate">{pkg.name}</h3>
        </div>
        <span className="inline-flex px-2.5 py-1 rounded-full text-[11px] font-bold bg-brand/10 text-brand-text border border-brand/25 uppercase tracking-wide">
          {pkg.billingCycle === 'Yearly' ? 'Yearly' : 'Monthly'}
        </span>
        <p 
        title={pkg.description || ''}
        className="text-sm text-ink-mute line-clamp-2 min-h-[40px] mt-3">
          {pkg.description || "No description"}
        </p>
      </div>

      {/* ===== GIÁ ===== */}
      <div className="relative z-[1] flex items-end gap-1.5 mb-5 mt-3">
        {pkg.price > 0 ? (
          <>
            <span className="text-[38px] leading-none font-bold bg-gradient-to-r from-brand to-brand-hover bg-clip-text text-transparent">
              {formatCurrency(pkg.price)}
            </span>
            <span className="text-lg font-bold text-brand-text mb-0.5">đ</span>
            <span className="text-ink-mute text-xs mb-1">/ {pkg.billingCycle === 'Yearly' ? 'Yearly' : 'Monthly'}</span>
          </>
        ) : (
          <span className="text-[34px] leading-none font-bold bg-gradient-to-r from-brand to-brand-hover bg-clip-text text-transparent">
            Free
          </span>
        )}
      </div>

      {/* Divider */}
      <div className="relative z-[1] h-px bg-gradient-to-r from-transparent via-gray-700/70 to-transparent mb-5" />

      {/* ===== FEATURE LIST ===== */}
      <div className="relative z-[1] space-y-3.5 flex-1">
        {features.map(f => (
          <Feature key={f.label} icon={f.icon} label={f.label} enabled={f.enabled} />
        ))}
      </div>

      {/* ===== FOOTER: chỉ còn #ID góc phải, gọn gàng ===== */}
      <div className="relative z-[1] -mx-6 -mb-6 mt-6 px-6 py-2.5 border-t border-line bg-sunken/40 flex justify-end">
        <span className="text-[10px] text-ink-mute font-mono">#{pkg.id}</span>
      </div>
    </div>
  )
}

// ============ CARD MINI — dành cho gói ĐANG ẨN (1 hàng ngang, mờ nhẹ) ============
export const HiddenPackageCard = ({ pkg, onEdit, onRestore }) => {
  const miniFeatures = [
    { label: `${pkg.maxTicketsPerEvent?.toLocaleString('vi-VN')} Ticket`, enabled: true },
    { label: 'Poster AI', enabled: pkg.hasAiPoster },
    { label: 'Tour Scenes', enabled: pkg.maxTourScenes > 0 },
  ]

  return (
    <div className="bg-card/60 border border-line/70 rounded-xl p-4 flex flex-col lg:flex-row lg:items-center gap-3 opacity-60 hover:opacity-100 transition-all duration-300 hover:border-line">

      {/* Tên + giá */}
      <div className="flex items-center gap-3 flex-1 min-w-0">
        <div className="w-10 h-10 rounded-lg bg-sunken/60 border border-line/50 flex items-center justify-center flex-shrink-0">
          <Box size={18} className="text-ink-mute" />
        </div>
        <div className="min-w-0">
          <h4 className="text-base font-bold text-ink-soft truncate">{pkg.name}</h4>
          <p className="text-xs text-ink-mute">
            {pkg.price > 0 ? `${formatCurrency(pkg.price)}đ / ${pkg.billingCycle === 'Yearly' ? 'Yearly' : 'Monthly'}` : 'Free'} · #{pkg.id}
          </p>
        </div>
      </div>

      {/* Feature mini pills */}
      <div className="flex items-center gap-2 flex-wrap">
        {miniFeatures.map(f => (
          <span key={f.label} className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs border ${
            f.enabled
              ? 'bg-brand/10 text-brand-text/80 border-brand/20'
              : 'bg-red-500/5 text-ink-mute border-red-500/15'
          }`}>
            {f.enabled
              ? <span className="w-1.5 h-1.5 rounded-full bg-brand/70" />
              : <X size={11} className="text-danger/80" strokeWidth={3} />}
            {f.label}
          </span>
        ))}
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2 flex-shrink-0">
        <button
          onClick={() => onEdit(pkg)}
          className="p-2 rounded-lg border border-line/60 text-ink-mute hover:text-brand-text hover:border-brand/50 transition-colors"
          title="Edit Package"
        >
          <Pencil size={14} />
        </button>
        <button
          onClick={() => onRestore(pkg)}
          className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-brand text-on-brand text-xs font-bold hover:bg-brand-hover transition-colors"
        >
          <EyeOff size={13} className="rotate-180" /> Unhide
        </button>
      </div>
    </div>
  )
}

export default PackageCard