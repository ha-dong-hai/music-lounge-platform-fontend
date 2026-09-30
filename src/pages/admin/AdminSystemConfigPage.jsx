// src/pages/admin/AdminSystemConfigPage.jsx
// Tham số điều khiển hành vi THẬT của hệ thống (tỉ lệ hoa hồng, thời gian giữ vé...).
// Đổi một dòng ở đây là đổi cách hệ thống tính tiền.
import { useState, useEffect, useCallback } from 'react'
import { Loader2, SlidersHorizontal, Coins } from 'lucide-react'
import toast from 'react-hot-toast'
import { getSystemConfigs, updateSystemConfig, getConfigurationAudit } from '../../services/adminServices'
import ConfigAuditCard from '../../components/admin/system-config/ConfigAuditCard'
import ConfigTable from '../../components/admin/system-config/ConfigTable'
import ConfigEditModal from '../../components/admin/system-config/ConfigEditModal'
import ConfigHistoryModal from '../../components/admin/system-config/ConfigHistoryModal'

const AdminSystemConfigPage = () => {
  const [configs, setConfigs] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [editing, setEditing] = useState(null)
  const [historyKey, setHistoryKey] = useState(null)
  const [isSaving, setIsSaving] = useState(false)
  // null = chưa soát được (lỗi) | [] = đã soát và không thiếu gì
  const [gaps, setGaps] = useState(null)

  // 1. FETCH: bảng tham số + audit chạy song song, ĐỘC LẬP (allSettled) — audit lỗi thì bảng vẫn hiện
  const load = useCallback(async () => {
    setIsLoading(true)
    const [cfg, audit] = await Promise.allSettled([getSystemConfigs(), getConfigurationAudit()])
    if (cfg.status === 'fulfilled' && cfg.value?.success) {
      setConfigs(cfg.value.data ?? [])
    } else {
      toast.error(cfg.reason?.response?.data?.message || 'Không tải được cấu hình hệ thống.')
    }
    setGaps(audit.status === 'fulfilled' && audit.value?.success ? (audit.value.data ?? []) : null)
    setIsLoading(false)
  }, [])

  useEffect(() => { const chay = async () => { await load() }; chay() }, [load])

  // 2. SUBMIT SỬA — modal lo validate, page gọi API (ràng buộc chéo trả message cụ thể → hiện nguyên văn)
  const handleUpdate = async (configValue, note) => {
    if (!editing) return
    setIsSaving(true)
    try {
      await updateSystemConfig(editing.configKey, { configValue, note })
      toast.success('Đã cập nhật tham số.')
      setEditing(null)
      await load()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Không cập nhật được tham số.', { duration: 6000 })
    } finally {
      setIsSaving(false)
    }
  }

  if (isLoading) {
    return <div className="py-20 flex justify-center"><Loader2 size={32} className="animate-spin text-brand-text" /></div>
  }

  const tienTe = configs.filter((c) => c.isMoneyRate)
  const conLai = configs.filter((c) => !c.isMoneyRate)

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-ink mb-1">Cấu hình hệ thống</h1>
        <p className="text-ink-soft text-sm leading-relaxed">
          Những tham số này điều khiển cách hệ thống tính tiền và xử lý thời hạn. Mỗi lần đổi đều phải ghi lý do
          và được lưu vào lịch sử.
        </p>
      </div>

      {/* CẤU HÌNH HẠ TẦNG — chỉ đọc, sửa ở biến môi trường server */}
      <ConfigAuditCard gaps={gaps} />

      {tienTe.length > 0 && (
        <div className="bg-card border border-line rounded-xl p-6">
          <h2 className="text-base font-semibold text-ink flex items-center gap-2">
            <Coins size={16} className="text-warning" /> Tỉ lệ tiền
          </h2>
          <p className="text-xs text-ink-mute mt-1 mb-4 leading-relaxed">
            Nhóm này có ràng buộc chéo với nhau — đổi một tham số có thể bị từ chối nếu tổng vượt ngưỡng.
          </p>
          <ConfigTable configs={tienTe} onEdit={setEditing} onHistory={setHistoryKey} />
        </div>
      )}

      {conLai.length > 0 && (
        <div className="bg-card border border-line rounded-xl p-6">
          <h2 className="text-base font-semibold text-ink flex items-center gap-2">
            <SlidersHorizontal size={16} /> Tham số khác
          </h2>
          <div className="mt-4">
            <ConfigTable configs={conLai} onEdit={setEditing} onHistory={setHistoryKey} />
          </div>
        </div>
      )}

      {configs.length === 0 && (
        <div className="bg-card border border-line rounded-xl p-10 text-center">
          <p className="text-sm text-ink-mute">Không có tham số nào.</p>
        </div>
      )}

      {editing && (
        <ConfigEditModal
          config={editing}
          isSaving={isSaving}
          onClose={() => setEditing(null)}
          onSubmit={handleUpdate}
        />
      )}
      {historyKey && <ConfigHistoryModal configKey={historyKey} onClose={() => setHistoryKey(null)} />}
    </div>
  )
}

export default AdminSystemConfigPage