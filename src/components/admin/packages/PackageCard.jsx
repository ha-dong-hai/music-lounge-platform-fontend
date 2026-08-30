import { Pencil, EyeOff, Ticket, Sparkles, Box, X } from 'lucide-react'

// Kiểu hiển thị 1 feature
const Feature = ({ icon: Icon, label, enabled }) => (
  <div className="flex items-center gap-3">
    <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 border ${
      enabled
        ? 'bg-[#C3B665]/10 border-[#C3B665]/25'
        : 'bg-red-500/5 border-red-500/15'
    }`}>
      {enabled
        ? <Icon size={15} className="text-[#C3B665]" />
        : <X size={15} className="text-red-400" strokeWidth={3} />}
    </div>
    <span className={`text-sm ${enabled ? 'text-gray-200' : 'text-gray-500'}`}>{label}</span>
  </div>
)

// ============ CARD FULL — dành cho gói ĐANG HIỂN THỊ ============
export const PackageCard = ({ pkg, onEdit, onToggleStatus }) => {
  const features = [
    { icon: Ticket, label: `${pkg.maxTicketsPerEvent?.toLocaleString('vi-VN')} vé / sự kiện`, enabled: true },
    { icon: Sparkles, label: pkg.hasAiPoster ? `${pkg.maxAiPostersPerMonth} poster AI / tháng` : 'Không hỗ trợ Poster AI', enabled: pkg.hasAiPoster },
    { icon: Box, label: pkg.maxTourScenes > 0 ? `${pkg.maxTourScenes} tour ảo 360°` : 'Không hỗ trợ Tour ảo 360°', enabled: pkg.maxTourScenes > 0 },
  ]

  return (
    <div className="relative bg-gray-900 rounded-2xl border border-gray-800 p-6 flex flex-col overflow-hidden transition-all duration-300 group hover:border-[#C3B665]/60 hover:-translate-y-1.5 hover:shadow-[0_12px_45px_rgba(195,182,101,0.13)]">

      {/* Ánh vàng trang trí */}
      <div className="absolute -top-12 -right-12 w-44 h-44 bg-[#C3B665]/8 rounded-full blur-3xl pointer-events-none" />

      {/* ===== ACTIONS — hiện khi hover góc phải (giữ nguyên) ===== */}
      <div className="absolute top-4 right-4 z-10 flex gap-1.5 opacity-0 group-hover:opacity-100 translate-y-1 group-hover:translate-y-0 transition-all duration-200">
        <button
          onClick={() => onEdit(pkg)}
          className="p-2 bg-black/70 backdrop-blur-md border border-white/10 text-gray-300 hover:text-[#C3B665] hover:border-[#C3B665]/50 rounded-lg transition-colors"
          title="Chỉnh sửa gói"
        >
          <Pencil size={13} />
        </button>
        <button
          onClick={() => onToggleStatus(pkg)}
          className="p-2 bg-black/70 backdrop-blur-md border border-white/10 text-gray-300 hover:text-[#C3B665] hover:border-[#C3B665]/50 rounded-lg transition-colors"
          title="Ẩn gói khỏi trang đăng ký"
        >
          <EyeOff size={13} />
        </button>
      </div>

      {/* ===== HEADER ===== */}
      <div className="relative z-[1]">
        <div className="flex items-center gap-2.5 mb-2 pr-14">
          <h3 className="text-xl font-bold text-white truncate">{pkg.name}</h3>
        </div>
        <span className="inline-flex px-2.5 py-1 rounded-full text-[11px] font-bold bg-[#C3B665]/10 text-[#C3B665] border border-[#C3B665]/25 uppercase tracking-wide">
          {pkg.billingCycle === 'Yearly' ? 'Theo năm' : 'Theo tháng'}
        </span>
        <p className="text-sm text-gray-500 line-clamp-2 min-h-[40px] mt-3">
          {pkg.description || "Chưa có mô tả"}
        </p>
      </div>

      {/* ===== GIÁ ===== */}
      <div className="relative z-[1] flex items-end gap-1.5 mb-5 mt-3">
        {pkg.price > 0 ? (
          <>
            <span className="text-[38px] leading-none font-bold bg-gradient-to-r from-[#C3B665] to-[#ede2a0] bg-clip-text text-transparent">
              {pkg.price.toLocaleString('vi-VN')}
            </span>
            <span className="text-lg font-bold text-[#C3B665] mb-0.5">đ</span>
            <span className="text-gray-500 text-xs mb-1">/ {pkg.billingCycle === 'Yearly' ? 'năm' : 'tháng'}</span>
          </>
        ) : (
          <span className="text-[34px] leading-none font-bold bg-gradient-to-r from-[#C3B665] to-[#ede2a0] bg-clip-text text-transparent">
            Miễn phí
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
      <div className="relative z-[1] -mx-6 -mb-6 mt-6 px-6 py-2.5 border-t border-gray-800 bg-black/20 flex justify-end">
        <span className="text-[10px] text-gray-600 font-mono">#{pkg.id}</span>
      </div>
    </div>
  )
}

// ============ CARD MINI — dành cho gói ĐANG ẨN (1 hàng ngang, mờ nhẹ) ============
export const HiddenPackageCard = ({ pkg, onEdit, onRestore }) => {
  const miniFeatures = [
    { label: `${pkg.maxTicketsPerEvent?.toLocaleString('vi-VN')} vé`, enabled: true },
    { label: 'Poster AI', enabled: pkg.hasAiPoster },
    { label: 'Tour ảo', enabled: pkg.maxTourScenes > 0 },
  ]

  return (
    <div className="bg-gray-900/60 border border-gray-800/70 rounded-xl p-4 flex flex-col lg:flex-row lg:items-center gap-3 opacity-60 hover:opacity-100 transition-all duration-300 hover:border-gray-700">

      {/* Tên + giá */}
      <div className="flex items-center gap-3 flex-1 min-w-0">
        <div className="w-10 h-10 rounded-lg bg-gray-800/60 border border-gray-700/50 flex items-center justify-center flex-shrink-0">
          <Box size={18} className="text-gray-500" />
        </div>
        <div className="min-w-0">
          <h4 className="text-base font-bold text-gray-300 truncate">{pkg.name}</h4>
          <p className="text-xs text-gray-600">
            {pkg.price > 0 ? `${pkg.price.toLocaleString('vi-VN')}đ / ${pkg.billingCycle === 'Yearly' ? 'năm' : 'tháng'}` : 'Miễn phí'} · #{pkg.id}
          </p>
        </div>
      </div>

      {/* Feature mini pills */}
      <div className="flex items-center gap-2 flex-wrap">
        {miniFeatures.map(f => (
          <span key={f.label} className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs border ${
            f.enabled
              ? 'bg-[#C3B665]/10 text-[#C3B665]/80 border-[#C3B665]/20'
              : 'bg-red-500/5 text-gray-500 border-red-500/15'
          }`}>
            {f.enabled
              ? <span className="w-1.5 h-1.5 rounded-full bg-[#C3B665]/70" />
              : <X size={11} className="text-red-400/80" strokeWidth={3} />}
            {f.label}
          </span>
        ))}
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2 flex-shrink-0">
        <button
          onClick={() => onEdit(pkg)}
          className="p-2 rounded-lg border border-gray-700/60 text-gray-500 hover:text-[#C3B665] hover:border-[#C3B665]/50 transition-colors"
          title="Chỉnh sửa gói"
        >
          <Pencil size={14} />
        </button>
        <button
          onClick={() => onRestore(pkg)}
          className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-[#C3B665] text-black text-xs font-bold hover:bg-[#d4c87f] transition-colors"
        >
          <EyeOff size={13} className="rotate-180" /> Hiện lại
        </button>
      </div>
    </div>
  )
}

export default PackageCard