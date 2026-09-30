// src/components/admin/system-config/ConfigEditModal.jsx
import { useState } from 'react'
import { X, Loader2, Save, AlertTriangle } from 'lucide-react'
import toast from 'react-hot-toast'

/**
 * Modal sửa 1 tham số — tự quản value + note (unmount tự reset)
 * ⚠ `note` BẮT BUỘC — là lý do ghi vào lịch sử, đặt ngang hàng ô giá trị.
 * @param {object} config - dòng tham số đang sửa
 * @param {boolean} isSaving
 * @param {function} onClose
 * @param {function} onSubmit - (configValue, note) => page gọi updateSystemConfig
 */
const ConfigEditModal = ({ config, isSaving, onClose, onSubmit }) => {
  const [configValue, setConfigValue] = useState(config.configValue ?? '')
  const [note, setNote] = useState('')

  const submit = (e) => {
    e.preventDefault()
    if (!configValue.trim()) { toast.error('Cần nhập giá trị mới.'); return }
    if (!note.trim()) {
      toast.error('Cần ghi lý do thay đổi — lý do được lưu vào lịch sử.')
      return
    }
    onSubmit(configValue.trim(), note.trim())
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-espresso/80 backdrop-blur-sm" onClick={() => !isSaving && onClose()} />
      <div className="relative bg-card border border-line rounded-2xl w-full max-w-md shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <div className="flex justify-between items-center p-5 border-b border-line">
          <h2 className="text-lg font-bold text-ink truncate">{config.configKey}</h2>
          <button onClick={onClose} disabled={isSaving} className="p-2 hover:bg-sunken rounded-full text-ink-soft disabled:opacity-30 flex-shrink-0">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={submit} className="p-5 space-y-4">
          {config.description && (
            <p className="text-xs text-ink-mute leading-relaxed">{config.description}</p>
          )}

          {config.isMoneyRate && (
            <p className="text-xs text-warning flex items-start gap-1.5 leading-relaxed bg-yellow-500/5 border border-yellow-500/30 rounded-lg p-3">
              <AlertTriangle size={13} className="mt-px flex-shrink-0" />
              Tham số này thuộc nhóm tỉ lệ tiền và có ràng buộc chéo với các tỉ lệ khác. Backend có thể từ chối
              nếu tổng vượt ngưỡng cho phép.
            </p>
          )}

          <div>
            <label className="text-xs text-ink-mute">Giá trị hiện tại</label>
            <p className="mt-1 px-3 py-2 bg-sunken border border-line rounded-lg text-sm text-ink-soft tabular-nums">
              {config.configValue}
            </p>
          </div>

          <div>
            <label className="text-xs text-ink-mute">
              Giá trị mới <span className="text-danger">*</span>
              <span className="text-ink-mute"> · kiểu {config.dataType}</span>
            </label>
            <input value={configValue} onChange={(e) => setConfigValue(e.target.value)} disabled={isSaving}
              className="mt-1 w-full px-3 py-2 bg-page border border-line rounded-lg text-sm text-ink focus:outline-none focus:border-brand/50 tabular-nums disabled:opacity-50" />
          </div>

          <div>
            <label className="text-xs text-ink-mute">Lý do thay đổi <span className="text-danger">*</span></label>
            <textarea value={note} onChange={(e) => setNote(e.target.value)} rows={3} disabled={isSaving}
              className="mt-1 w-full px-3 py-2 bg-page border border-line rounded-lg text-sm text-ink focus:outline-none focus:border-brand/50 resize-none disabled:opacity-50"
              placeholder="Vì sao đổi, theo quyết định nào. Nội dung này lưu vĩnh viễn trong lịch sử." />
          </div>

          <div className="flex gap-3">
            <button type="button" onClick={onClose} disabled={isSaving}
              className="flex-1 py-2.5 border border-line-strong text-ink-soft rounded-lg font-medium hover:bg-sunken disabled:opacity-50">
              Huỷ
            </button>
            <button type="submit" disabled={isSaving}
              className="flex-1 py-2.5 bg-brand text-on-brand rounded-lg font-bold flex items-center justify-center gap-2 disabled:opacity-50">
              {isSaving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />} Lưu
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default ConfigEditModal