import { useState } from 'react'
import { Plus, Pencil, Trash2, Music2, EyeOff } from 'lucide-react'
import toast from 'react-hot-toast'
import { createFilterOption, updateFilterOption, deleteFilterOption } from '../../../services/adminServices'
import ConfirmModal from '../../shared/ConfirmModal'
import OptionFormModal from './OptionFormModal'


const OptionTypeTab = ({ typeKey, typeLabel, hasNameEn, hasDescription, options, onRefresh }) => {
  // Loại buổi diễn là loại DUY NHẤT có isActive. Xoá bị backend chặn (409) khi đang có buổi diễn
  // dùng tới, nên "tắt" là cách thật để cho một loại nghỉ hưu — nhưng danh sách chỉ trả mục đang
  // bật, nên tắt rồi là KHÔNG BẬT LẠI ĐƯỢC trên giao diện. Vì vậy nó là một hành động riêng, có
  // hỏi lại, chứ không phải một ô tích trong form.
  const coTat = typeKey === 'eventCategories'
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [editingOption, setEditingOption] = useState(null)
  const [isSaving, setIsSaving] = useState(false)

  const [deleteTarget, setDeleteTarget] = useState(null)
  const [isDeleting, setIsDeleting] = useState(false)

  const [hideTarget, setHideTarget] = useState(null)
  const [isHiding, setIsHiding] = useState(false)

  // ===== ADD / EDIT =====
  const openCreate = () => {
    setEditingOption(null)
    setIsFormOpen(true)
  }

  const openEdit = (option) => {
    setEditingOption(option)
    setIsFormOpen(true)
  }

  const handleSubmit = async (formData) => {
    setIsSaving(true)
    try {
      const res = editingOption
        ? await updateFilterOption(typeKey, editingOption.id, formData)
        : await createFilterOption(typeKey, formData)

      if (res.success) {
        toast.success(editingOption ? 'Updated successfully!' : 'Created successfully!')
        setIsFormOpen(false)
        onRefresh() // refetch cả 3 loại về page
      } else {
        toast.error(res.message || 'Operation failed.')
      }
    } catch (err) {
      // BE có thể trả lỗi nghiệp vụ: VD genre đang được show dùng → không cho xóa
      const beMessage = err?.response?.data?.message
      toast.error(beMessage || 'Operation failed.')
    } finally {
      setIsSaving(false)
    }
  }

  // ===== DELETE =====
  const executeDelete = async () => {
    if (!deleteTarget) return
    setIsDeleting(true)
    try {
      const res = await deleteFilterOption(typeKey, deleteTarget.id)
      if (res.success) {
        toast.success(`Deleted "${deleteTarget.name}"`)
        setDeleteTarget(null)
        onRefresh()
      } else {
        toast.error(res.message || 'Delete failed.')
      }
    } catch (err) {
      const beMessage = err?.response?.data?.message
      toast.error(beMessage || 'Delete failed.')
    } finally {
      setIsDeleting(false)
    }
  }

  // ===== TẮT (chỉ loại buổi diễn) =====
  // Gửi isActive: false. PUT ghi đè toàn bộ nên vẫn phải gửi lại name; description thì danh sách
  // không trả về, gửi rỗng là mất — đó là lý do câu xác nhận nói rõ chuyện này.
  const executeHide = async () => {
    if (!hideTarget) return
    setIsHiding(true)
    try {
      const res = await updateFilterOption(typeKey, hideTarget.id, {
        name: hideTarget.name,
        description: hideTarget.description ?? null,
        isActive: false,
      })
      if (res.success) {
        toast.success(`Đã tắt "${hideTarget.name}"`)
        setHideTarget(null)
        onRefresh()
      } else {
        toast.error(res.message || 'Không tắt được.')
      }
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Không tắt được.')
    } finally {
      setIsHiding(false)
    }
  }

  return (
    <div className="space-y-4">

      {/* HEADER + NÚT ADD */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-500">
          {options.length} {typeLabel.toLowerCase()}{options.length !== 1 ? 's' : ''} in use
        </p>
        <button
          onClick={openCreate}
          className="flex items-center gap-2 bg-[#C3B665] text-black px-4 py-2.5 rounded-lg font-bold text-sm hover:bg-[#d4c87f] transition-colors"
        >
          <Plus size={16} /> Add {typeLabel}
        </button>
      </div>

      {/* TABLE */}
      <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left whitespace-nowrap">
            <thead className="bg-black/40 border-b border-gray-800">
              <tr>
                <th className="p-4 text-xs font-semibold text-gray-400 uppercase tracking-wider w-24">ID</th>
                <th className="p-4 text-xs font-semibold text-gray-400 uppercase tracking-wider">Name</th>
                {hasNameEn && (
                  <th className="p-4 text-xs font-semibold text-gray-400 uppercase tracking-wider">Name (EN)</th>
                )}
                {hasDescription && (
                  <th className="p-4 text-xs font-semibold text-gray-400 uppercase tracking-wider">Mô tả</th>
                )}
                <th className="p-4 text-xs font-semibold text-gray-400 uppercase tracking-wider text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800">
              {options.length > 0 ? (
                options.map(opt => (
                  <tr key={opt.id} className="hover:bg-gray-800/30 transition-colors group">
                    <td className="p-4 text-xs text-gray-600 font-mono">#{opt.id}</td>
                    <td className="p-4 text-sm text-white font-medium">{opt.name}</td>
                    {hasNameEn && (
                      <td className="p-4 text-sm text-gray-400">{opt.nameEn || <span className="text-gray-600 italic">—</span>}</td>
                    )}
                    {hasDescription && (
                      // Danh sách của backend chỉ trả id + name. Để trống thì người dùng tưởng mô tả
                      // rỗng, nên nói thẳng là không đọc được chứ không phải không có.
                      <td className="p-4 text-sm text-gray-400 whitespace-normal max-w-xs leading-relaxed">
                        {opt.description || <span className="text-gray-600 italic">không đọc được</span>}
                      </td>
                    )}
                    <td className="p-4">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => openEdit(opt)}
                          className="p-2 rounded-lg bg-gray-700/30 text-gray-400 hover:bg-gray-700/50 hover:text-[#C3B665] transition-colors"
                          title="Edit"
                        >
                          <Pencil size={14} />
                        </button>
                        {coTat && (
                          <button
                            onClick={() => setHideTarget(opt)}
                            className="p-2 rounded-lg bg-gray-700/30 text-gray-400 hover:bg-gray-700/50 hover:text-yellow-400 transition-colors"
                            title="Tắt (ẩn khỏi danh sách chọn)"
                          >
                            <EyeOff size={14} />
                          </button>
                        )}
                        <button
                          onClick={() => setDeleteTarget(opt)}
                          className="p-2 rounded-lg bg-gray-700/30 text-gray-400 hover:bg-red-500/15 hover:text-red-400 transition-colors"
                          title="Delete"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={3 + (hasNameEn ? 1 : 0) + (hasDescription ? 1 : 0)} className="p-10 text-center text-gray-500">
                    <Music2 size="32" className="mx-auto mb-3 opacity-50" />
                    No {typeLabel.toLowerCase()}s yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ===== MODALS ===== */}
      {/* Chỉ dựng khi mở, và `key` đổi theo mục đang sửa → form tự có giá trị khởi tạo đúng,
          không cần useEffect đồng bộ lại state (xem ghi chú trong OptionFormModal). */}
      {isFormOpen && (
      <OptionFormModal
        key={editingOption?.id ?? 'moi'}
        isOpen={isFormOpen}
        typeLabel={typeLabel}
        hasNameEn={hasNameEn}
        hasDescription={hasDescription}
        editingOption={editingOption}
        isSaving={isSaving}
        onClose={() => setIsFormOpen(false)}
        onSubmit={handleSubmit}
      />
      )}

      <ConfirmModal
        isOpen={!!deleteTarget}
        title={`Delete ${typeLabel.toLowerCase()}?`}
        message={`"${deleteTarget?.name}" will be permanently removed from the system. Shows currently using this ${typeLabel.toLowerCase()} may be affected.`}
        confirmText="Delete"
        processingText="Deleting..."
        danger={true}
        isProcessing={isDeleting}
        onClose={() => setDeleteTarget(null)}
        onConfirm={executeDelete}
      />

      <ConfirmModal
        isOpen={!!hideTarget}
        title="Tắt loại buổi diễn này?"
        message={`"${hideTarget?.name}" sẽ không còn hiện trong danh sách chọn khi tạo buổi diễn. Buổi diễn cũ đang dùng nó KHÔNG bị ảnh hưởng. Lưu ý: backend không có đường liệt kê loại đã tắt, nên bật lại phải làm trực tiếp dưới cơ sở dữ liệu — và mô tả của loại này sẽ bị xoá vì danh sách không trả về mô tả cũ.`}
        confirmText="Tắt"
        processingText="Đang tắt..."
        isProcessing={isHiding}
        onClose={() => setHideTarget(null)}
        onConfirm={executeHide}
      />
    </div>
  )
}

export default OptionTypeTab