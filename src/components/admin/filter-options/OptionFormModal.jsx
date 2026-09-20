import { useState, useEffect } from 'react'
import { X, Loader2 } from 'lucide-react'
import toast from 'react-hot-toast'

const OptionFormModal = ({ isOpen, typeLabel, hasNameEn, editingOption, isSaving, onClose, onSubmit }) => {
    const [formData, setFormData] = useState({ name: '', nameEn: '' })

    // RESET FORM mỗi lần mở (tạo mới → rỗng, sửa → map từ option)
    useEffect(() => {
        if (!isOpen) return
        setFormData({
            name: editingOption?.name || '',
            // ⚠️ GET /filter-options KHÔNG trả nameEn → edit luôn trống (xem ghi chú cuối)
            nameEn: editingOption?.nameEn || '',
        })
    }, [isOpen, editingOption])

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