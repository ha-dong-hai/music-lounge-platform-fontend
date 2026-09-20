// src/pages/admin/AdminSystemConfigPage.jsx
//
// GHI CHÚ CHO ĐỘI FE:
// - Đây là những tham số điều khiển hành vi thật của hệ thống: tỉ lệ hoa hồng, thời gian giữ vé,
//   hạn hoàn tiền, ngưỡng quyết toán. Đổi một dòng ở đây là đổi cách hệ thống tính tiền.
// - `note` LÀ BẮT BUỘC, không phải trường phụ: nó là lý do ghi vào lịch sử. Một tỉ lệ tiền bị đổi mà
//   không ai biết vì sao là thứ không truy được về sau. Form vì vậy đặt ô lý do ngang hàng ô giá trị.
// - `isMoneyRate` đánh dấu nhóm tham số tiền. Nhóm này có RÀNG BUỘC CHÉO với nhau: đổi một cái có thể
//   bị backend từ chối vì tổng vượt ngưỡng. Lỗi trả về giải thích rõ, nên hiển thị nguyên văn.
// - Backend trả MẢNG TRẦN cho danh sách, và lịch sử là mảng riêng theo từng khoá.
import { useState, useEffect, useCallback } from 'react'
import { Loader2, SlidersHorizontal, History, Save, X, AlertTriangle, Coins } from 'lucide-react'
import dayjs from 'dayjs'
import toast from 'react-hot-toast'
import { getSystemConfigs, getSystemConfigHistory, updateSystemConfig } from '../../services/adminServices'

const EditModal = ({ config, onClose, onSaved }) => {
  const [configValue, setConfigValue] = useState(config.configValue ?? '')
  const [note, setNote] = useState('')
  const [isBusy, setIsBusy] = useState(false)

  const submit = async (e) => {
    e.preventDefault()
    if (!configValue.trim()) { toast.error('Cần nhập giá trị mới.'); return }
    if (!note.trim()) {
      toast.error('Cần ghi lý do thay đổi — lý do được lưu vào lịch sử.')
      return
    }
    setIsBusy(true)
    try {
      await updateSystemConfig(config.configKey, { configValue: configValue.trim(), note: note.trim() })
      toast.success('Đã cập nhật tham số.')
      onSaved(); onClose()
    } catch (err) {
      // Ràng buộc chéo giữa các tỉ lệ tiền trả về câu giải thích cụ thể — hiện nguyên văn.
      toast.error(err.response?.data?.message || 'Không cập nhật được tham số.', { duration: 6000 })
    } finally { setIsBusy(false) }
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-gray-900 border border-gray-700 rounded-2xl w-full max-w-md shadow-2xl">
        <div className="flex justify-between items-center p-5 border-b border-gray-800">
          <h2 className="text-lg font-bold text-white truncate">{config.configKey}</h2>
          <button onClick={onClose} disabled={isBusy} className="p-2 hover:bg-gray-800 rounded-full text-gray-400 disabled:opacity-30 flex-shrink-0">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={submit} className="p-5 space-y-4">
          {config.description && (
            <p className="text-xs text-gray-500 leading-relaxed">{config.description}</p>
          )}

          {config.isMoneyRate && (
            <p className="text-xs text-yellow-400 flex items-start gap-1.5 leading-relaxed bg-yellow-500/5 border border-yellow-500/30 rounded-lg p-3">
              <AlertTriangle size={13} className="mt-px flex-shrink-0" />
              Tham số này thuộc nhóm tỉ lệ tiền và có ràng buộc chéo với các tỉ lệ khác. Backend có thể từ chối
              nếu tổng vượt ngưỡng cho phép.
            </p>
          )}

          <div>
            <label className="text-xs text-gray-500">Giá trị hiện tại</label>
            <p className="mt-1 px-3 py-2 bg-black/60 border border-gray-800 rounded-lg text-sm text-gray-400 tabular-nums">
              {config.configValue}
            </p>
          </div>

          <div>
            <label className="text-xs text-gray-500">
              Giá trị mới <span className="text-red-400">*</span>
              <span className="text-gray-600"> · kiểu {config.dataType}</span>
            </label>
            <input value={configValue} onChange={(e) => setConfigValue(e.target.value)}
              className="mt-1 w-full px-3 py-2 bg-black border border-gray-700 rounded-lg text-sm text-white focus:outline-none focus:border-[#C3B665]/50 tabular-nums" />
          </div>

          <div>
            <label className="text-xs text-gray-500">Lý do thay đổi <span className="text-red-400">*</span></label>
            <textarea value={note} onChange={(e) => setNote(e.target.value)} rows={3}
              className="mt-1 w-full px-3 py-2 bg-black border border-gray-700 rounded-lg text-sm text-white focus:outline-none focus:border-[#C3B665]/50 resize-none"
              placeholder="Vì sao đổi, theo quyết định nào. Nội dung này lưu vĩnh viễn trong lịch sử." />
          </div>

          <div className="flex gap-3">
            <button type="button" onClick={onClose} disabled={isBusy}
              className="flex-1 py-2.5 border border-gray-600 text-gray-300 rounded-lg font-medium hover:bg-gray-800 disabled:opacity-50">
              Huỷ
            </button>
            <button type="submit" disabled={isBusy}
              className="flex-1 py-2.5 bg-[#C3B665] text-black rounded-lg font-bold flex items-center justify-center gap-2 disabled:opacity-50">
              {isBusy ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />} Lưu
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

const HistoryModal = ({ configKey, onClose }) => {
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
      <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-gray-900 border border-gray-700 rounded-2xl w-full max-w-lg shadow-2xl max-h-[90vh] flex flex-col">
        <div className="flex justify-between items-center p-5 border-b border-gray-800">
          <h2 className="text-lg font-bold text-white truncate">Lịch sử: {configKey}</h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-800 rounded-full text-gray-400 flex-shrink-0"><X size={20} /></button>
        </div>

        <div className="p-5 overflow-y-auto">
          {isLoading ? (
            <div className="py-10 flex justify-center"><Loader2 size={24} className="animate-spin text-[#C3B665]" /></div>
          ) : rows.length === 0 ? (
            <p className="text-sm text-gray-500 text-center py-8">Tham số này chưa từng bị đổi.</p>
          ) : (
            <ul className="space-y-3">
              {rows.map((h) => (
                <li key={h.id} className="bg-black/40 border border-gray-800 rounded-lg p-3">
                  <div className="flex items-center gap-2 text-sm tabular-nums">
                    <span className="text-gray-500 line-through">{h.oldValue ?? '—'}</span>
                    <span className="text-gray-600">→</span>
                    <span className="text-white font-medium">{h.newValue}</span>
                  </div>
                  <p className="text-xs text-gray-400 mt-1.5 leading-relaxed">{h.note}</p>
                  <p className="text-xs text-gray-600 mt-1">
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

const AdminSystemConfigPage = () => {
  const [configs, setConfigs] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [editing, setEditing] = useState(null)
  const [historyKey, setHistoryKey] = useState(null)

  const load = useCallback(async () => {
    setIsLoading(true)
    try {
      const res = await getSystemConfigs()
      if (res.success) setConfigs(res.data ?? [])
    } catch (err) {
      toast.error(err.response?.data?.message || 'Không tải được cấu hình hệ thống.')
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => { const chay = async () => { await load() }; chay() }, [load])

  if (isLoading) {
    return <div className="py-20 flex justify-center"><Loader2 size={32} className="animate-spin text-[#C3B665]" /></div>
  }

  const tienTe = configs.filter((c) => c.isMoneyRate)
  const conLai = configs.filter((c) => !c.isMoneyRate)

  const renderBang = (ds) => (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="text-xs text-gray-500 border-b border-gray-800">
            <th className="text-left py-2 pr-3 font-medium">Tham số</th>
            <th className="text-left py-2 pr-3 font-medium">Giá trị</th>
            <th className="text-left py-2 pr-3 font-medium">Đổi lần cuối</th>
            <th className="py-2 font-medium" />
          </tr>
        </thead>
        <tbody>
          {ds.map((c) => (
            <tr key={c.configKey} className="border-b border-gray-800/60">
              <td className="py-3 pr-3 align-top">
                <p className="text-white font-medium break-all">{c.configKey}</p>
                {c.description && <p className="text-xs text-gray-500 mt-0.5 leading-relaxed">{c.description}</p>}
              </td>
              <td className="py-3 pr-3 align-top text-gray-300 tabular-nums whitespace-nowrap">{c.configValue}</td>
              <td className="py-3 pr-3 align-top text-xs text-gray-500 whitespace-nowrap">
                {dayjs(c.updatedAt).format('DD/MM/YYYY')}
                {c.updatedByName && <span className="block text-gray-600">{c.updatedByName}</span>}
              </td>
              <td className="py-3 align-top">
                <div className="flex gap-1 justify-end">
                  <button onClick={() => setHistoryKey(c.configKey)} title="Lịch sử thay đổi"
                    className="p-2 rounded-lg text-gray-400 hover:bg-gray-800">
                    <History size={14} />
                  </button>
                  <button onClick={() => setEditing(c)} title="Sửa"
                    className="px-3 py-1.5 rounded-lg border border-gray-700 text-gray-300 text-xs font-bold hover:bg-gray-800">
                    Sửa
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white mb-1">Cấu hình hệ thống</h1>
        <p className="text-gray-400 text-sm leading-relaxed">
          Những tham số này điều khiển cách hệ thống tính tiền và xử lý thời hạn. Mỗi lần đổi đều phải ghi lý do
          và được lưu vào lịch sử.
        </p>
      </div>

      {tienTe.length > 0 && (
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
          <h2 className="text-base font-semibold text-white flex items-center gap-2">
            <Coins size={16} className="text-yellow-400" /> Tỉ lệ tiền
          </h2>
          <p className="text-xs text-gray-500 mt-1 mb-4 leading-relaxed">
            Nhóm này có ràng buộc chéo với nhau — đổi một tham số có thể bị từ chối nếu tổng vượt ngưỡng.
          </p>
          {renderBang(tienTe)}
        </div>
      )}

      {conLai.length > 0 && (
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
          <h2 className="text-base font-semibold text-white flex items-center gap-2">
            <SlidersHorizontal size={16} /> Tham số khác
          </h2>
          <div className="mt-4">{renderBang(conLai)}</div>
        </div>
      )}

      {configs.length === 0 && (
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-10 text-center">
          <p className="text-sm text-gray-500">Không có tham số nào.</p>
        </div>
      )}

      {editing && <EditModal config={editing} onClose={() => setEditing(null)} onSaved={load} />}
      {historyKey && <HistoryModal configKey={historyKey} onClose={() => setHistoryKey(null)} />}
    </div>
  )
}

export default AdminSystemConfigPage
