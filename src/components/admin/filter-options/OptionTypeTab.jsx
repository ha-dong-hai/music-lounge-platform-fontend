import { useState } from 'react'
import { Plus, Pencil, Trash2, Loader2, Music2 } from 'lucide-react'
import toast from 'react-hot-toast'
import { createFilterOption, updateFilterOption, deleteFilterOption } from '../../../services/adminServices'
import ConfirmModal from '../../shared/ConfirmModal'
import OptionFormModal from './OptionFormModal'


const OptionTypeTab = ({ typeKey, typeLabel, hasNameEn, options, onRefresh }) => {
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [editingOption, setEditingOption] = useState(null)
  const [isSaving, setIsSaving] = useState(false)

  const [deleteTarget, setDeleteTarget] = useState(null)
  const [isDeleting, setIsDeleting] = useState(false)

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
                    <td className="p-4">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => openEdit(opt)}
                          className="p-2 rounded-lg bg-gray-700/30 text-gray-400 hover:bg-gray-700/50 hover:text-[#C3B665] transition-colors"
                          title="Edit"
                        >
                          <Pencil size={14} />
                        </button>
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
                  <td colSpan={hasNameEn ? 4 : 3} className="p-10 text-center text-gray-500">
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
      <OptionFormModal
        isOpen={isFormOpen}
        typeLabel={typeLabel}
        hasNameEn={hasNameEn}
        editingOption={editingOption}
        isSaving={isSaving}
        onClose={() => setIsFormOpen(false)}
        onSubmit={handleSubmit}
      />

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
    </div>
  )
}

export default OptionTypeTab