// src/components/admin/system-config/ConfigHistoryModal.jsx
// Tự fetch lịch sử theo configKey khi mở (read-only, chỉ dùng trong modal — giữ fetch tại chỗ
// cho page orchestrator gọn; lỗi không ảnh hưởng bảng tham số).
import { useState, useEffect } from 'react'
import { X, Loader2 } from 'lucide-react'
import dayjs from 'dayjs'
import toast from 'react-hot-toast'
import { getSystemConfigHistory } from '../../../services/adminServices'

const ConfigHistoryModal = ({ configKey, onClose }) => {
  const [rows, setRows] = useState([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const chay = async () => {
      setIsLoading(true)
      try {
        const res = await getSystemConfigHistory(configKey)
        if (res.success) setRows(res.data ?? [])
      } catch (err) {
        toast.error(err.response?.data?.message || 'Không tải được lịch sử.')
      } finally {
        setIsLoading(false)
      }
    }
    chay()
  }, [configKey])

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-espresso/80 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-card border border-line rounded-2xl w-full max-w-lg shadow-2xl max-h-[90vh] flex flex-col">
        <div className="flex-none flex justify-between items-center p-5 border-b border-line">
          <h2 className="text-lg font-bold text-ink truncate">Lịch sử: {configKey}</h2>
          <button onClick={onClose} className="p-2 hover:bg-sunken rounded-full text-ink-soft flex-shrink-0"><X size={20} /></button>
        </div>

        <div className="p-5 overflow-y-auto">
          {isLoading ? (
            <div className="py-10 flex justify-center"><Loader2 size={24} className="animate-spin text-brand-text" /></div>
          ) : rows.length === 0 ? (
            <p className="text-sm text-ink-mute text-center py-8">Tham số này chưa từng bị đổi.</p>
          ) : (
            <ul className="space-y-3">
              {rows.map((h) => (
                <li key={h.id} className="bg-sunken/70 border border-line rounded-lg p-3">
                  <div className="flex items-center gap-2 text-sm tabular-nums">
                    <span className="text-ink-mute line-through">{h.oldValue ?? '—'}</span>
                    <span className="text-ink-mute">→</span>
                    <span className="text-ink font-medium">{h.newValue}</span>
                  </div>
                  <p className="text-xs text-ink-soft mt-1.5 leading-relaxed">{h.note}</p>
                  <p className="text-xs text-ink-mute mt-1">
                    {h.changedByName ?? `Người dùng #${h.changedBy}`} · {dayjs(h.changedAt).format('HH:mm DD/MM/YYYY')}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  )
}

export default ConfigHistoryModal