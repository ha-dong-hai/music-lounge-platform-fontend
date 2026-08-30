import { Pencil, Eye, EyeOff, Ticket, Sparkles, Box } from 'lucide-react'

const PackageCard = ({ pkg, onEdit, onToggleStatus }) => {
  return (
    <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 flex flex-col relative group">
      {/* Actions */}
      <div className="absolute top-4 right-4 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
        <button onClick={() => onEdit(pkg)} className="p-1.5 bg-gray-800 text-gray-400 hover:text-[#C3B665] rounded-md transition-colors" title="Chỉnh sửa">
          <Pencil size={14} />
        </button>
        <button onClick={() => onToggleStatus(pkg)} className="p-1.5 bg-gray-800 text-gray-400 hover:text-[#C3B665] rounded-md transition-colors" title={pkg.isActive ? "Ẩn gói" : "Hiện gói"}>
          {pkg.isActive ? <EyeOff size={14} /> : <Eye size={14} />}
        </button>
      </div>

      <div className="flex items-center gap-2 mb-1">
        <h3 className="text-xl font-bold text-white">{pkg.name}</h3>
        {!pkg.isActive && <span className="text-xs px-2 py-0.5 bg-red-500/10 text-red-400 border border-red-500/30 rounded-full">Đang ẩn</span>}
      </div>
      <p className="text-xs text-gray-500 mb-4">Loại hình: Đăng ký theo {pkg.billingCycle === 'Monthly' ? 'Tháng' : pkg.billingCycle}</p>

      <div className="mb-6 flex items-baseline gap-1">
        <span className="text-3xl font-bold text-[#C3B665]">{pkg.price?.toLocaleString('vi-VN')}</span>
        <span className="text-xl font-bold text-[#C3B665]">đ</span>
        {pkg.price > 0 && <span className="text-gray-500 text-sm">/tháng</span>}
      </div>

      <div className="space-y-3 flex-1 border-t border-gray-800 pt-4">
        <p className="text-sm text-gray-300 min-h-[40px]">{pkg.description || "Chưa có mô tả"}</p>

        <div className="flex items-center gap-2 text-sm text-gray-300">
          <Ticket size={16} className="text-[#C3B665] flex-shrink-0" />
          <span>Tối đa {pkg.maxTicketsPerEvent?.toLocaleString('vi-VN')} vé / sự kiện</span>
        </div>

        {pkg.hasAiPoster && (
          <div className="flex items-center gap-2 text-sm text-gray-300">
            <Sparkles size={16} className="text-[#C3B665] flex-shrink-0" />
            <span>Tối đa {pkg.maxAiPostersPerMonth} poster AI / tháng</span>
          </div>
        )}

        {pkg.maxTourScenes > 0 && (
          <div className="flex items-center gap-2 text-sm text-gray-300">
            <Box size={16} className="text-[#C3B665] flex-shrink-0" />
            <span>Tối đa {pkg.maxTourScenes} tour ảo 360°</span>
          </div>
        )}
      </div>
    </div>
  )
}

export default PackageCard