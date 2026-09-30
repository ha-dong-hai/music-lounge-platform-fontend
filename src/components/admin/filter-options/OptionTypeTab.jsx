import { useState } from 'react'
import { Plus, Pencil, Trash2, Music2, EyeOff, Eye } from 'lucide-react'
import toast from 'react-hot-toast'
import { createFilterOption, updateFilterOption, deleteFilterOption } from '../../../services/adminServices'
import ConfirmModal from '../../shared/ConfirmModal'
import OptionFormModal from './OptionFormModal'


const OptionTypeTab = ({ typeKey, typeLabel, hasNameEn, hasDescription, hasIsActive, options, onRefresh }) => {
  // Loại buổi diễn là loại DUY NHẤT có isActive. Xoá bị backend chặn (409) khi đang có buổi diễn
  // dùng tới, nên "tắt" là cách thật để cho một loại nghỉ hưu.
  // Trang cha đọc qua /admin/event-categories (không lọc mục đã tắt) nên BẬT LẠI ĐƯỢC — trước đây
  // đọc bằng đường công khai thì tắt xong là mất hẳn khỏi giao diện.
  const coTat = !!hasIsActive
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
        toast.success(editingOption ? 'Đã cập nhật.' : 'Đã tạo mới.')
        setIsFormOpen(false)
        onRefresh() // refetch cả 3 loại về page
      } else {
        toast.error(res.message || 'Thao tác không thành công.')
      }
    } catch (err) {
      // BE có thể trả lỗi nghiệp vụ: VD genre đang được show dùng → không cho xóa
      const beMessage = err?.response?.data?.message
      toast.error(beMessage || 'Thao tác không thành công.')
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
        toast.success(`Đã xoá "${deleteTarget.name}"`)
        setDeleteTarget(null)
        onRefresh()
      } else {
        toast.error(res.message || 'Không xoá được.')
      }
    } catch (err) {
      const beMessage = err?.response?.data?.message
      toast.error(beMessage || 'Không xoá được.')
    } finally {
      setIsDeleting(false)
    }
  }

  // ===== BẬT / TẮT (chỉ loại buổi diễn) =====
  // PUT ghi đè toàn bộ nên phải gửi lại cả name và description, không chỉ mỗi isActive.
  // Danh sách nay có description thật (đọc từ /admin/event-categories) nên gửi lại không mất gì.
  const doiTrangThai = async (muc, bat) => {
    setIsHiding(true)
    try {
      const res = await updateFilterOption(typeKey, muc.id, {
        name: muc.name,
        description: muc.description ?? null,
        isActive: bat,
      })
      if (res.success) {
        toast.success(bat ? `Đã bật lại "${muc.name}"` : `Đã tắt "${muc.name}"`)
        setHideTarget(null)
        onRefresh()
      } else {
        toast.error(res.message || 'Không đổi được trạng thái.')
      }
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Không đổi được trạng thái.')
    } finally {
      setIsHiding(false)
    }
  }

  const executeHide = async () => {
    if (!hideTarget) return
    await doiTrangThai(hideTarget, false)
  }

  return (
    <div className="space-y-4">

      {/* HEADER + NÚT ADD */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-ink-mute">
          {options.length} {typeLabel.toLowerCase()}{options.length !== 1 ? 's' : ''} in use
        </p>
        <button
          onClick={openCreate}
          className="flex items-center gap-2 bg-ink text-lamp px-4 py-2.5 font-bold text-sm hover:bg-board transition-colors"
        >
          <Plus size={16} /> Add {typeLabel}
        </button>
      </div>

      {/* TABLE */}
      <div className="bg-card border border-line overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left whitespace-nowrap">
            <thead className="bg-sunken/70 border-b border-line">
              <tr>
                <th className="p-4 text-sm font-semibold text-ink-softr w-24">ID</th>
                <th className="p-4 text-sm font-semibold text-ink-softr">Tên</th>
                {hasNameEn && (
                  <th className="p-4 text-sm font-semibold text-ink-softr">Name (EN)</th>
                )}
                {hasDescription && (
                  <th className="p-4 text-sm font-semibold text-ink-softr">Mô tả</th>
                )}
                {coTat && (
                  <th className="p-4 text-sm font-semibold text-ink-softr">Trạng thái</th>
                )}
                <th className="p-4 text-sm font-semibold text-ink-softr text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {options.length > 0 ? (
                options.map(opt => (
                  <tr key={opt.id} className="hover:bg-sunken/30 transition-colors group">
                    <td className="p-4 text-xs text-ink-mute font-mono">#{opt.id}</td>
                    <td className="p-4 text-sm text-ink font-medium">{opt.name}</td>
                    {hasNameEn && (
                      <td className="p-4 text-sm text-ink-soft">{opt.nameEn || <span className="text-ink-mute italic">—</span>}</td>
                    )}
                    {hasDescription && (
                      <td className="p-4 text-sm text-ink-soft whitespace-normal max-w-xs leading-relaxed">
                        {opt.description || <span className="text-ink-mute italic">—</span>}
                      </td>
                    )}
                    {coTat && (
                      <td className="p-4">
                        {opt.isActive === false ? (
                          <span className="px-2 py-0.5 rounded-md bg-sunken text-ink-mute text-xs">Đã tắt</span>
                        ) : (
                          <span className="px-2 py-0.5 rounded-md bg-success/10 text-success text-xs">Đang bật</span>
                        )}
                      </td>
                    )}
                    <td className="p-4">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => openEdit(opt)}
                          className="p-2 bg-line/30 text-ink-soft hover:bg-line/50 hover:text-ink transition-colors"
                          title="Sửa"
                        >
                          <Pencil size={14} />
                        </button>
                        {coTat && (
                          opt.isActive === false ? (
                            <button
                              onClick={() => doiTrangThai(opt, true)}
                              disabled={isHiding}
                              className="p-2 bg-line/30 text-ink-soft hover:bg-line/50 hover:text-success transition-colors disabled:opacity-40"
                              title="Bật lại (hiện trong danh sách chọn)"
                            >
                              <Eye size={14} />
                            </button>
                          ) : (
                            <button
                              onClick={() => setHideTarget(opt)}
                              className="p-2 bg-line/30 text-ink-soft hover:bg-line/50 hover:text-warning transition-colors"
                              title="Tắt (ẩn khỏi danh sách chọn)"
                            >
                              <EyeOff size={14} />
                            </button>
                          )
                        )}
                        <button
                          onClick={() => setDeleteTarget(opt)}
                          className="p-2 bg-line/30 text-ink-soft hover:bg-danger/15 hover:text-danger transition-colors"
                          title="Xoá"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={3 + (hasNameEn ? 1 : 0) + (hasDescription ? 1 : 0) + (coTat ? 1 : 0)} className="p-10 text-center text-ink-mute">
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
        title={`Xoá ${typeLabel.toLowerCase()}?`}
        message={`"${deleteTarget?.name}" sẽ bị xoá hẳn khỏi hệ thống. Các buổi diễn đang dùng ${typeLabel.toLowerCase()} này có thể bị ảnh hưởng.`}
        confirmText="Xoá"
        processingText="Đang xoá…"
        danger={true}
        isProcessing={isDeleting}
        onClose={() => setDeleteTarget(null)}
        onConfirm={executeDelete}
      />

      <ConfirmModal
        isOpen={!!hideTarget}
        title="Tắt loại buổi diễn này?"
        message={`"${hideTarget?.name}" sẽ không còn hiện trong danh sách chọn khi tạo buổi diễn. Buổi diễn cũ đang dùng nó KHÔNG bị ảnh hưởng, và bạn bật lại được bất cứ lúc nào bằng nút trong danh sách này.`}
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