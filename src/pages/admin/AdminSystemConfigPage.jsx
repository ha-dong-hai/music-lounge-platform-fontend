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
// - KHỐI "CẤU HÌNH CÒN THIẾU" LÀ MỘT THỨ KHÁC HẲN phần dưới, đừng gộp vào cùng bảng:
//     Phần dưới  = tham số nghiệp vụ, Admin sửa được ngay trên giao diện.
//     Khối trên  = khoá hạ tầng (khoá Mux, khoá Firebase…) nằm trong biến môi trường của server,
//                  SỬA Ở ĐÂY KHÔNG ĐƯỢC — phải vào cấu hình triển khai. Nó chỉ trả về TÊN khoá và
//                  hậu quả khi thiếu, không bao giờ trả giá trị, nên không lo lộ secret.
import { useState, useEffect, useCallback } from 'react'
import { Loader2, SlidersHorizontal, History, Save, X, AlertTriangle, Coins, PlugZap, CheckCircle2 } from 'lucide-react'
import dayjs from 'dayjs'
import toast from 'react-hot-toast'
import {
  getSystemConfigs, getSystemConfigHistory, updateSystemConfig, getConfigurationAudit,
} from '../../services/adminServices'

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
      <div className="absolute inset-0 bg-espresso/80 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-card border border-line rounded-2xl w-full max-w-md shadow-2xl">
        <div className="flex justify-between items-center p-5 border-b border-line">
          <h2 className="text-lg font-bold text-ink truncate">{config.configKey}</h2>
          <button onClick={onClose} disabled={isBusy} className="p-2 hover:bg-sunken rounded-full text-ink-soft disabled:opacity-30 flex-shrink-0">
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
            <p className="mt-1 px-3 py-2 bg-espresso/60 border border-line rounded-lg text-sm text-ink-soft tabular-nums">
              {config.configValue}
            </p>
          </div>

          <div>
            <label className="text-xs text-ink-mute">
              Giá trị mới <span className="text-danger">*</span>
              <span className="text-ink-mute"> · kiểu {config.dataType}</span>
            </label>
            <input value={configValue} onChange={(e) => setConfigValue(e.target.value)}
              className="mt-1 w-full px-3 py-2 bg-page border border-line rounded-lg text-sm text-ink focus:outline-none focus:border-brand/50 tabular-nums" />
          </div>

          <div>
            <label className="text-xs text-ink-mute">Lý do thay đổi <span className="text-danger">*</span></label>
            <textarea value={note} onChange={(e) => setNote(e.target.value)} rows={3}
              className="mt-1 w-full px-3 py-2 bg-page border border-line rounded-lg text-sm text-ink focus:outline-none focus:border-brand/50 resize-none"
              placeholder="Vì sao đổi, theo quyết định nào. Nội dung này lưu vĩnh viễn trong lịch sử." />
          </div>

          <div className="flex gap-3">
            <button type="button" onClick={onClose} disabled={isBusy}
              className="flex-1 py-2.5 border border-line-strong text-ink-soft rounded-lg font-medium hover:bg-sunken disabled:opacity-50">
              Huỷ
            </button>
            <button type="submit" disabled={isBusy}
              className="flex-1 py-2.5 bg-brand text-on-brand rounded-lg font-bold flex items-center justify-center gap-2 disabled:opacity-50">
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
      <div className="absolute inset-0 bg-espresso/80 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-card border border-line rounded-2xl w-full max-w-lg shadow-2xl max-h-[90vh] flex flex-col">
        <div className="flex justify-between items-center p-5 border-b border-line">
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
                <li key={h.id} className="bg-espresso/40 border border-line rounded-lg p-3">
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

// Một khoá hạ tầng còn thiếu. `severity`: 'Broken' = tính năng đó hiện KHÔNG dùng được,
// 'Degraded' = vẫn chạy nhưng mất một lớp (thường là lớp bảo vệ). Hai mức phải trông khác nhau,
// vì cách xử lý khác nhau: Broken là đi sửa ngay, Degraded là đưa vào việc cần làm.
const GapRow = ({ gap }) => {
  const vo = gap.severity === 'Broken'
  return (
    <div className={`p-4 rounded-lg border ${vo ? 'border-red-500/30 bg-red-500/5' : 'border-yellow-500/25 bg-yellow-500/5'}`}>
      <div className="flex flex-wrap items-center gap-2">
        <span className={`px-2 py-0.5 rounded-md text-xs font-bold ${vo ? 'bg-red-500/15 text-danger' : 'bg-yellow-500/15 text-warning'}`}>
          {vo ? 'Không dùng được' : 'Chạy thiếu lớp'}
        </span>
        <p className="text-sm text-ink font-medium">{gap.feature}</p>
      </div>
      <p className="text-xs text-ink-soft mt-2 leading-relaxed">{gap.impact}</p>
      <p className="text-xs text-ink-mute mt-1.5 font-mono break-all">{gap.key}</p>
    </div>
  )
}

const AdminSystemConfigPage = () => {
  const [configs, setConfigs] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [editing, setEditing] = useState(null)
  const [historyKey, setHistoryKey] = useState(null)
  // null = chưa soát được (gọi lỗi). [] = đã soát và không thiếu gì. Hai cái này KHÔNG được
  // hiện giống nhau, nếu không thì gọi lỗi lại trông như "mọi thứ đủ".
  const [gaps, setGaps] = useState(null)

  const load = useCallback(async () => {
    setIsLoading(true)
    // Soát cấu hình chạy song song và độc lập: nó lỗi thì bảng tham số bên dưới vẫn phải hiện.
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

  if (isLoading) {
    return <div className="py-20 flex justify-center"><Loader2 size={32} className="animate-spin text-brand-text" /></div>
  }

  const tienTe = configs.filter((c) => c.isMoneyRate)
  const conLai = configs.filter((c) => !c.isMoneyRate)

  const renderBang = (ds) => (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="text-xs text-ink-mute border-b border-line">
            <th className="text-left py-2 pr-3 font-medium">Tham số</th>
            <th className="text-left py-2 pr-3 font-medium">Giá trị</th>
            <th className="text-left py-2 pr-3 font-medium">Đổi lần cuối</th>
            <th className="py-2 font-medium" />
          </tr>
        </thead>
        <tbody>
          {ds.map((c) => (
            <tr key={c.configKey} className="border-b border-line/60">
              <td className="py-3 pr-3 align-top">
                <p className="text-ink font-medium break-all">{c.configKey}</p>
                {c.description && <p className="text-xs text-ink-mute mt-0.5 leading-relaxed">{c.description}</p>}
              </td>
              <td className="py-3 pr-3 align-top text-ink-soft tabular-nums whitespace-nowrap">{c.configValue}</td>
              <td className="py-3 pr-3 align-top text-xs text-ink-mute whitespace-nowrap">
                {dayjs(c.updatedAt).format('DD/MM/YYYY')}
                {c.updatedByName && <span className="block text-ink-mute">{c.updatedByName}</span>}
              </td>
              <td className="py-3 align-top">
                <div className="flex gap-1 justify-end">
                  <button onClick={() => setHistoryKey(c.configKey)} title="Lịch sử thay đổi"
                    className="p-2 rounded-lg text-ink-soft hover:bg-sunken">
                    <History size={14} />
                  </button>
                  <button onClick={() => setEditing(c)} title="Sửa"
                    className="px-3 py-1.5 rounded-lg border border-line text-ink-soft text-xs font-bold hover:bg-sunken">
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
        <h1 className="text-2xl font-bold text-ink mb-1">Cấu hình hệ thống</h1>
        <p className="text-ink-soft text-sm leading-relaxed">
          Những tham số này điều khiển cách hệ thống tính tiền và xử lý thời hạn. Mỗi lần đổi đều phải ghi lý do
          và được lưu vào lịch sử.
        </p>
      </div>

      {/* CẤU HÌNH HẠ TẦNG CÒN THIẾU — chỉ đọc, sửa ở biến môi trường của server chứ không ở đây */}
      <div className="bg-card border border-line rounded-xl p-6">
        <h2 className="text-base font-semibold text-ink flex items-center gap-2">
          <PlugZap size={16} /> Cấu hình hạ tầng
        </h2>
        <p className="text-xs text-ink-mute mt-1 leading-relaxed">
          Những khoá kết nối dịch vụ ngoài (phát trực tiếp, thông báo đẩy, thanh toán). Đây là chỗ
          xem TRƯỚC khi đi tìm lỗi &quot;tự nhiên tính năng này không chạy trên môi trường này&quot;.
          Không sửa được trên giao diện — phải đổi trong cấu hình triển khai của server.
        </p>

        {gaps === null ? (
          <p className="mt-4 text-xs text-warning flex items-start gap-1.5 leading-relaxed">
            <AlertTriangle size={13} className="mt-px flex-shrink-0" />
            Chưa soát được cấu hình hạ tầng. Đây KHÔNG có nghĩa là không thiếu gì.
          </p>
        ) : gaps.length === 0 ? (
          <p className="mt-4 text-sm text-success flex items-center gap-2">
            <CheckCircle2 size={15} /> Không thiếu khoá cấu hình nào.
          </p>
        ) : (
          <div className="mt-4 space-y-2">
            {/* Broken lên trước: đó là thứ đang làm người dùng không dùng được tính năng. */}
            {[...gaps].sort((a, b) => (a.severity === b.severity ? 0 : a.severity === 'Broken' ? -1 : 1))
              .map((g) => <GapRow key={g.key} gap={g} />)}
          </div>
        )}
      </div>

      {tienTe.length > 0 && (
        <div className="bg-card border border-line rounded-xl p-6">
          <h2 className="text-base font-semibold text-ink flex items-center gap-2">
            <Coins size={16} className="text-warning" /> Tỉ lệ tiền
          </h2>
          <p className="text-xs text-ink-mute mt-1 mb-4 leading-relaxed">
            Nhóm này có ràng buộc chéo với nhau — đổi một tham số có thể bị từ chối nếu tổng vượt ngưỡng.
          </p>
          {renderBang(tienTe)}
        </div>
      )}

      {conLai.length > 0 && (
        <div className="bg-card border border-line rounded-xl p-6">
          <h2 className="text-base font-semibold text-ink flex items-center gap-2">
            <SlidersHorizontal size={16} /> Tham số khác
          </h2>
          <div className="mt-4">{renderBang(conLai)}</div>
        </div>
      )}

      {configs.length === 0 && (
        <div className="bg-card border border-line rounded-xl p-10 text-center">
          <p className="text-sm text-ink-mute">Không có tham số nào.</p>
        </div>
      )}

      {editing && <EditModal config={editing} onClose={() => setEditing(null)} onSaved={load} />}
      {historyKey && <HistoryModal configKey={historyKey} onClose={() => setHistoryKey(null)} />}
    </div>
  )
}

export default AdminSystemConfigPage
