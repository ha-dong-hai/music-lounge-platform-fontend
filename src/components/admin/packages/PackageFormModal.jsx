import { useState, useEffect } from 'react'
import { X, Sparkles, Box, Loader2 } from 'lucide-react'
import toast from 'react-hot-toast'

const EMPTY_FORM = {
  name: '', description: '', price: 0, billingCycle: 'Monthly',
  maxTicketsPerEvent: 0, hasAiPoster: false, maxAiPostersPerMonth: 0, maxTourScenes: 0,
  isActive: true
}

const PackageFormModal = ({ isOpen, editingPkg, isSaving, onClose, onSubmit }) => {
  const [formData, setFormData] = useState(EMPTY_FORM)
  const isEditing = !!editingPkg

  // RESET FORM mỗi lần mở modal (tạo mới → rỗng, sửa → map từ pkg)
  useEffect(() => {
    if (!isOpen) return
    setFormData(editingPkg
      ? {
          name: editingPkg.name,
          description: editingPkg.description || '',
          price: editingPkg.price,
          billingCycle: editingPkg.billingCycle || 'Monthly',
          maxTicketsPerEvent: editingPkg.maxTicketsPerEvent || 0,
          hasAiPoster: editingPkg.hasAiPoster || false,
          maxAiPostersPerMonth: editingPkg.maxAiPostersPerMonth || 0,
          maxTourScenes: editingPkg.maxTourScenes || 0,
          isActive: editingPkg.isActive
        }
      : EMPTY_FORM
    )
  }, [isOpen, editingPkg])

  if (!isOpen) return null

  const handlePriceChange = (e) => {
    const rawValue = e.target.value.replace(/\D/g, '')
    setFormData(prev => ({ ...prev, price: rawValue ? Number(rawValue) : 0 }))
  }

  // Tắt AI Poster → reset hạn mức về 0 | Bật lại → default 1 nếu đang 0
  const handleToggleAiPoster = (checked) => {
    setFormData(prev => ({
      ...prev,
      hasAiPoster: checked,
      maxAiPostersPerMonth: checked ? (Number(prev.maxAiPostersPerMonth) || 1) : 0
    }))
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!formData.name.trim()) {
      toast.error('Vui lòng nhập tên gói')
      return
    }
    onSubmit(formData)
  }

  const inputCls = "w-full px-4 py-2.5 bg-black border border-gray-800 rounded-lg text-white text-sm focus:outline-none focus:border-[#C3B665]/50"

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={() => !isSaving && onClose()}></div>

      <div className="relative bg-gray-900 border border-gray-700 rounded-2xl w-full max-w-lg shadow-2xl flex flex-col max-h-[90vh]">
        {/* HEADER */}
        <div className="flex justify-between items-center p-6 border-b border-gray-800">
          <h2 className="text-xl font-bold text-white">{isEditing ? 'Chỉnh sửa gói Package' : 'Tạo gói Package mới'}</h2>
          <button onClick={onClose} disabled={isSaving} className="p-2 hover:bg-gray-800 rounded-full text-gray-400 disabled:opacity-30">
            <X size={20} />
          </button>
        </div>

        {/* BODY */}
        <form id="package-form" onSubmit={handleSubmit} className="p-6 space-y-5 overflow-y-auto">
          {/* Tên gói & Giá */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-2">Tên gói</label>
              <input
                type="text" required
                disabled={isEditing} // BE không cho sửa tên khi EDIT
                value={formData.name}
                onChange={e => setFormData({...formData, name: e.target.value})}
                className={`${inputCls} disabled:opacity-50 disabled:cursor-not-allowed`}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-2">Giá (VNĐ)</label>
              <div className="relative">
                <input
                  type="text" required
                  inputMode="numeric"
                  value={formData.price === 0 ? '' : formData.price.toLocaleString('vi-VN')}
                  onChange={handlePriceChange}
                  placeholder="0"
                  className={`${inputCls} pr-8`}
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 text-sm">đ</span>
              </div>
            </div>
          </div>

          {/* Chu kỳ & Max Tickets */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-2">Chu kỳ thanh toán</label>
              <select
                disabled={isEditing} // BE không cho sửa chu kỳ khi EDIT
                value={formData.billingCycle}
                onChange={e => setFormData({...formData, billingCycle: e.target.value})}
                className={`${inputCls} cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed`}
              >
                <option value="Monthly">Theo Tháng</option>
                <option value="Yearly">Theo Năm</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-2">Max vé/sự kiện</label>
              <input
                type="number" required min="0"
                value={formData.maxTicketsPerEvent}
                onChange={e => setFormData({...formData, maxTicketsPerEvent: e.target.value})}
                className={inputCls}
              />
            </div>
          </div>

          {/* Hạn mức AI Poster & Tour ảo */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-2 flex items-center gap-1.5">
                <Sparkles size={14} className="text-[#C3B665]" /> Poster AI / tháng
              </label>
              <input
                type="number" min="0"
                value={formData.maxAiPostersPerMonth}
                disabled={!formData.hasAiPoster} // Chỉ nhập được khi bật AI Poster
                onChange={e => setFormData({...formData, maxAiPostersPerMonth: e.target.value})}
                placeholder="0"
                className={`${inputCls} disabled:opacity-40 disabled:cursor-not-allowed`}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-2 flex items-center gap-1.5">
                <Box size={14} className="text-[#C3B665]" /> Tour ảo 360°
              </label>
              <input
                type="number" min="0"
                value={formData.maxTourScenes}
                onChange={e => setFormData({...formData, maxTourScenes: e.target.value})}
                placeholder="0"
                className={inputCls}
              />
            </div>
          </div>

          {/* Mô tả */}
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-2">Mô tả gói</label>
            <textarea
              rows="3"
              value={formData.description}
              onChange={e => setFormData({...formData, description: e.target.value})}
              className={`${inputCls} resize-none`}
              placeholder="Mô tả ngắn gọn quyền lợi của gói..."
            />
          </div>

          {/* Checkboxes */}
          <div className="flex flex-col gap-3 pt-2">
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.hasAiPoster}
                onChange={e => handleToggleAiPoster(e.target.checked)}
                className="w-4 h-4 rounded border-gray-600 bg-gray-800 text-[#C3B665] focus:ring-[#C3B665] focus:ring-offset-0"
              />
              <span className="text-sm text-white flex items-center gap-1.5"><Sparkles size={14} className="text-[#C3B665]" /> Hỗ trợ tạo Poster bằng AI</span>
            </label>

            {/* Chỉ hiện khi Edit, vì Create BE tự mặc định true */}
            {isEditing && (
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.isActive}
                  onChange={e => setFormData({...formData, isActive: e.target.checked})}
                  className="w-4 h-4 rounded border-gray-600 bg-gray-800 text-[#C3B665] focus:ring-[#C3B665] focus:ring-offset-0"
                />
                <span className="text-sm text-white">Hiển thị gói này cho Chủ phòng trà</span>
              </label>
            )}
          </div>
        </form>

        {/* FOOTER — dùng form="package-form" để Enter cũng submit được */}
        <div className="p-6 border-t border-gray-800 flex gap-3">
          <button
            type="button"
            onClick={onClose}
            disabled={isSaving}
            className="flex-1 py-2.5 border border-gray-600 text-gray-300 rounded-lg font-medium hover:bg-gray-800 transition-colors disabled:opacity-50"
          >
            Hủy
          </button>
          <button
            type="submit"
            form="package-form"
            disabled={isSaving}
            className="flex-1 py-2.5 bg-[#C3B665] text-black rounded-lg font-bold hover:bg-[#d4c87f] transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {isSaving ? <><Loader2 size={16} className="animate-spin" /> Đang lưu...</> : (isEditing ? 'Lưu thay đổi' : 'Tạo gói')}
          </button>
        </div>
      </div>
    </div>
  )
}

export default PackageFormModal