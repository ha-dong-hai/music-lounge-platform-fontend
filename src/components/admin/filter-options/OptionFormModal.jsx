import { useState } from 'react'
import { X, Loader2, AlertTriangle } from 'lucide-react'
import toast from 'react-hot-toast'

// GHI CHÚ CHO ĐỘI FE:
// - Backend nhận PUT là GHI ĐÈ TOÀN BỘ: trường nào không gửi là bị xoá. Vì vậy form phải nạp đủ
//   giá trị hiện tại rồi gửi lại tất cả, kể cả trường người dùng không chạm vào.
// - Trước đây nameEn và description KHÔNG đọc được (đường công khai không trả), nên form phải hiện
//   cảnh báo bắt người dùng tự gõ lại. Nay trang cha đọc qua /admin/genres và /admin/event-categories
//   nên hai trường đó có thật — cảnh báo đã bỏ. NẾU AI ĐỔI TRANG CHA VỀ ĐƯỜNG CÔNG KHAI thì bẫy
//   ghi đè quay lại ngay, và lúc đó phải dựng lại cảnh báo chứ không để im.
// - `isActive` chỉ loại buổi diễn mới có. Form giữ nguyên giá trị đang có và không cho sửa ở đây:
//   bật/tắt là hành động riêng ngoài danh sách, có hỏi lại, vì nó ẩn mục khỏi mọi chỗ chọn.
const OptionFormModal = ({ isOpen, typeLabel, hasNameEn, hasDescription, editingOption, isSaving, onClose, onSubmit }) => {
    // FORM ĐƯỢC NẠP MỘT LẦN LÚC DỰNG, không đồng bộ lại bằng useEffect: OptionTypeTab chỉ dựng
    // modal khi mở và truyền `key` theo mục đang sửa, nên mỗi lần mở là một component mới với giá
    // trị khởi tạo đúng. Đặt state trong effect ở đây vừa gây render thừa vừa xoá mất chữ người
    // dùng đang gõ nếu component cha render lại.
    const [formData, setFormData] = useState({
        name: editingOption?.name || '',
        nameEn: editingOption?.nameEn || '',
        description: editingOption?.description || '',
    })

    if (!isOpen) return null
    const isEditing = !!editingOption

    const handleSubmit = (e) => {
        e.preventDefault()
        if (!formData.name.trim()) {
            toast.error('Please enter a name')
            return
        }
        onSubmit({
            name: formData.name.trim(),
            // chỉ kèm nameEn khi type có hỗ trợ
            ...(hasNameEn ? { nameEn: formData.nameEn.trim() } : {}),
            // Giữ nguyên isActive đang có. Mục mới (không có editingOption) luôn là đang bật.
            // KHÔNG dán cứng true: làm vậy là mỗi lần sửa tên một mục đã tắt lại vô tình bật nó lên.
            ...(hasDescription ? {
                description: formData.description.trim(),
                isActive: editingOption ? editingOption.isActive !== false : true,
            } : {}),
        })
    }

    const inputCls = "w-full px-4 py-2.5 bg-black border border-gray-800 rounded-lg text-white text-sm focus:outline-none focus:border-[#C3B665]/50"

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={() => !isSaving && onClose()}></div>

            <div className="relative bg-gray-900 border border-gray-700 rounded-2xl w-full max-w-md shadow-2xl flex flex-col max-h-[90vh]" onClick={(e) => e.stopPropagation()}>

                {/* HEADER */}
                <div className="flex-none flex justify-between items-center p-5 border-b border-gray-800">
                    <h2 className="text-lg font-bold text-white">
                        {isEditing ? `Edit ${typeLabel}` : `Add New ${typeLabel}`}
                    </h2>
                    <button onClick={onClose} disabled={isSaving} className="p-2 hover:bg-gray-800 rounded-full text-gray-400 disabled:opacity-30">
                        <X size={20} />
                    </button>
                </div>

                {/* BODY */}
                <form id="option-form" onSubmit={handleSubmit} className="p-5 space-y-5">
                    <div>
                        <label className="block text-sm font-medium text-gray-400 mb-2">
                            Name (Vietnamese) <span className="text-red-400">*</span>
                        </label>
                        <input
                            type="text"
                            value={formData.name}
                            onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                            placeholder="VD: Nhạc trữ tình"
                            className={inputCls}
                            autoFocus
                        />
                    </div>

                    {/* CHỈ LOẠI BUỔI DIỄN CÓ description */}
                    {hasDescription && (
                        <div>
                            <label className="block text-sm font-medium text-gray-400 mb-2">
                                Mô tả <span className="text-gray-600 text-xs">(không bắt buộc)</span>
                            </label>
                            <textarea
                                rows={3}
                                value={formData.description}
                                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                                placeholder="VD: Đêm nhạc acoustic quy mô nhỏ, dưới 50 khách"
                                className={`${inputCls} resize-none`}
                            />
                        </div>
                    )}

                    {/* CHỈ GENRE CÓ nameEn */}
                    {hasNameEn && (
                        <div>
                            <label className="block text-sm font-medium text-gray-400 mb-2">
                                Name (English) <span className="text-gray-600 text-xs">(optional)</span>
                            </label>
                            <input
                                type="text"
                                value={formData.nameEn}
                                onChange={(e) => setFormData(prev => ({ ...prev, nameEn: e.target.value }))}
                                placeholder="E.g. Ballad"
                                className={inputCls}
                            />
                        </div>
                    )}
                    {/* Mục đang tắt vẫn sửa được, nhưng phải nói rõ trạng thái để người dùng không
                        tưởng mình đang sửa một mục đang dùng. Bật lại là nút riêng ngoài danh sách. */}
                    {isEditing && hasDescription && editingOption?.isActive === false && (
                        <p className="text-xs text-gray-400 flex items-start gap-1.5 leading-relaxed bg-gray-800/40 border border-gray-700 rounded-lg p-3">
                            <AlertTriangle size={13} className="mt-px flex-shrink-0 text-yellow-400" />
                            Mục này đang TẮT — sửa ở đây không bật nó lên. Bật lại bằng nút trong danh sách.
                        </p>
                    )}
                </form>

                {/* FOOTER — form attribute để Enter submit được */}
                <div className="flex-none p-5 border-t border-gray-800 flex gap-3">
                    <button
                        type="button"
                        onClick={onClose}
                        disabled={isSaving}
                        className="flex-1 py-2.5 border border-gray-600 text-gray-300 rounded-lg font-medium hover:bg-gray-800 transition-colors disabled:opacity-50"
                    >
                        Cancel
                    </button>
                    <button
                        type="submit"
                        form="option-form"
                        disabled={isSaving}
                        className="flex-1 py-2.5 bg-[#C3B665] text-black rounded-lg font-bold hover:bg-[#d4c87f] transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
                    >
                        {isSaving
                            ? <><Loader2 size={16} className="animate-spin" /> Saving...</>
                            : (isEditing ? 'Save Changes' : `Create ${typeLabel}`)}
                    </button>
                </div>
            </div>
        </div>
    )
}

export default OptionFormModal