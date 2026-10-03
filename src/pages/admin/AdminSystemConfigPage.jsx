// src/pages/admin/AdminSystemConfigPage.jsx
//
// CẤU HÌNH HỆ THỐNG — bản 2 (03/10/2026). Chủ dự án: "khó sử dụng quá, không hiểu gì hết, không phù hợp với người mới".
// Bản 1 in thẳng dữ liệu máy: tên là khoá kỹ thuật, giá trị "0.05", "true", "[]", ô sửa ghi "kiểu Decimal", 26 mục dồn vào
// "Tham số khác", và đầu trang là khối hạ tầng toàn tên khoá biến môi trường với nhãn đỏ.
//
// Bản 2 (lớp hiển thị ở utils/thamSoHeThong.js — giá trị gửi lên KHÔNG đổi dạng):
//  - Mỗi tham số: TÊN ĐỜI THƯỜNG + một câu "nó làm gì", giá trị kèm đơn vị ("15 phút", "5%"). Khoá kỹ thuật chỉ còn ở hộp sửa.
//  - Nhóm theo VIỆC (Vé và giữ chỗ, Chi trả cho phòng trà…), có mục lục nhảy nhóm và ô tìm không dấu.
//  - Ô sửa đúng loại: phần trăm có hậu tố %, số có đơn vị, Bật/Tắt là hai nút chọn, từ cấm mỗi dòng một từ; câu VÍ DỤ tính
//    ngay theo giá trị đang gõ cho tham số tiền (GOV.UK: prefix/suffix cho đơn vị; inputmode thay type="number").
//  - Lý do bắt buộc ≥ 10 ký tự (backend đòi vậy — bản 1 không nói, bấm Lưu mới bị từ chối) có bộ đếm.
//  - Khối hạ tầng chuyển XUỐNG CUỐI, gập lại, đề "dành cho kỹ thuật viên", chỉ để một dòng tóm tắt (NN/g progressive
//    disclosure: thứ người mới cần lên trước, thứ hiếm dùng để sau và gắn nhãn rõ).
//
// GHI CHÚ GIỮ TỪ BẢN 1:
// - `note` là lý do ghi vào lịch sử (SystemConfigHistory) — bắt buộc, lưu vĩnh viễn.
// - `isMoneyRate`: nhóm tỉ lệ tiền có RÀNG BUỘC CHÉO (backend SystemConfigValidation) — lỗi trả về hiện nguyên văn.
// - Khối hạ tầng là khoá biến môi trường của server, KHÔNG sửa được ở đây; API chỉ trả tên khoá + hậu quả, không trả giá trị.
import { useState, useEffect, useCallback, useMemo, useId } from 'react'
import { Loader2, History, Save, X, AlertTriangle, PlugZap, CheckCircle2, Search, ChevronDown } from 'lucide-react'
import dayjs from 'dayjs'
import toast from 'react-hot-toast'
import {
  getSystemConfigs, getSystemConfigHistory, updateSystemConfig, getConfigurationAudit,
} from '../../services/adminServices'
import { TrangLoiTai } from '../../components/bang/KhungTai'
import HopThoai, { TieuDeHop } from '../../components/shared/HopThoai'
import { moTaThamSo, hienGiaTri, giaTriSua, guiLen, gomTheoNhom, khopTim } from '../../utils/thamSoHeThong'

const LY_DO_TOI_THIEU = 10
const O_NHAP = 'w-full min-h-[44px] px-3 py-2 bg-card border-2 border-ink text-ink focus:outline-none focus:ring-2 focus:ring-ink focus:ring-offset-2'

const EditModal = ({ config, onClose, onSaved }) => {
  const m = moTaThamSo(config)
  const id = useId()
  const [nhap, setNhap] = useState(giaTriSua(m, config.configValue))
  const [note, setNote] = useState('')
  const [isBusy, setIsBusy] = useState(false)
  const [daBam, setDaBam] = useState(false)
  const kq = guiLen(m, nhap)
  const khongDoi = kq.ok && kq.value === String(config.configValue)
  const loiLyDo = note.trim().length < LY_DO_TOI_THIEU

  const submit = async (e) => {
    e.preventDefault()
    setDaBam(true)
    if (!kq.ok || khongDoi || loiLyDo) return
    setIsBusy(true)
    try {
      await updateSystemConfig(config.configKey, { configValue: kq.value, note: note.trim() })
      toast.success(`Đã đổi "${m.ten}" thành ${hienGiaTri(m, kq.value)}.`)
      onSaved(); onClose()
    } catch (err) {
      // Ràng buộc chéo giữa các tỉ lệ tiền trả về câu giải thích cụ thể — hiện nguyên văn.
      toast.error(err.response?.data?.message || 'Không cập nhật được tham số.', { duration: 8000 })
    } finally { setIsBusy(false) }
  }

  const viDu = m.viDu && kq.ok ? m.viDu(Number(kq.value)) : null

  return (
    <HopThoai onDong={onClose} className="max-w-lg max-h-[92vh] flex flex-col">
      <div className="flex justify-between items-start gap-3 p-5 border-b border-line">
        <TieuDeHop><h2 className="text-2xl sm:text-3xl text-ink leading-tight">{m.ten}</h2></TieuDeHop>
        <button onClick={onClose} disabled={isBusy} className="inline-flex items-center justify-center w-11 h-11 flex-shrink-0 hover:bg-sunken text-ink-soft disabled:opacity-30" aria-label="Đóng">
          <X size={20} />
        </button>
      </div>

      <form onSubmit={submit} noValidate className="p-5 space-y-5 overflow-y-auto">
        {m.moTa && <p className="text-sm text-ink-soft leading-relaxed">{m.moTa}</p>}

        <p className="text-sm">
          <span className="text-ink-mute">Đang là </span>
          <b className="text-ink tabular-nums">{hienGiaTri(m, config.configValue)}</b>
        </p>

        <div>
          <label htmlFor={`${id}-gt`} className="text-sm font-semibold text-ink">Giá trị mới</label>
          {m.kieu === 'bat' ? (
            <div id={`${id}-gt`} role="radiogroup" aria-label="Giá trị mới" className="mt-2 grid grid-cols-2 gap-2">
              {[['true', 'Bật'], ['false', 'Tắt']].map(([v, ten]) => (
                <button key={v} type="button" role="radio" aria-checked={nhap === v} onClick={() => setNhap(v)}
                  className={`min-h-[44px] border-2 border-ink text-sm font-semibold ${nhap === v ? 'bg-ink text-lamp' : 'bg-card text-ink hover:bg-sunken'}`}>
                  {ten}
                </button>
              ))}
            </div>
          ) : m.kieu === 'dsTu' ? (
            <textarea id={`${id}-gt`} value={nhap} onChange={(e) => setNhap(e.target.value)} rows={5}
              placeholder={'Mỗi dòng một từ hoặc cụm từ\nĐể trống = không chặn từ nào'} className={`mt-1 resize-y ${O_NHAP}`} />
          ) : (
            <div className="mt-1 flex items-stretch">
              <input id={`${id}-gt`} value={nhap} onChange={(e) => setNhap(e.target.value)}
                inputMode={m.kieu === 'so' || m.kieu === 'tien' ? 'numeric' : m.kieu === 'chu' ? undefined : 'decimal'}
                aria-describedby={`${id}-loi`} aria-invalid={daBam && !kq.ok}
                className={`flex-1 min-w-0 tabular-nums ${O_NHAP}`} />
              {(m.kieu === 'tile' || m.donVi || m.kieu === 'tien') && (
                <span aria-hidden="true" className="inline-flex items-center px-3 border-2 border-l-0 border-ink bg-sunken text-sm font-semibold text-ink whitespace-nowrap">
                  {m.kieu === 'tile' ? '%' : m.kieu === 'tien' ? 'đồng' : m.donVi}
                </span>
              )}
            </div>
          )}
          <p id={`${id}-loi`} className="text-xs mt-1.5 min-h-[1rem]">
            {!kq.ok ? <span className={daBam ? 'text-danger' : 'text-ink-mute'}>{kq.loi}</span>
              : khongDoi ? <span className={daBam ? 'text-danger' : 'text-ink-mute'}>Giá trị này giống giá trị hiện tại.</span>
                : viDu ? <span className="text-ink-soft">{viDu}</span> : null}
          </p>
        </div>

        {config.isMoneyRate && (
          <p className="text-xs text-warning flex items-start gap-1.5 leading-relaxed bg-warning/5 border border-warning/30 p-3">
            <AlertTriangle size={13} className="mt-px flex-shrink-0" aria-hidden="true" />
            Tỉ lệ này cộng chung với các tỉ lệ tiền khác trên cùng một khoản tiền. Nếu tổng vượt mức cho phép (phòng trà còn nhận
            dưới 0đ), hệ thống sẽ từ chối và nói rõ lý do.
          </p>
        )}

        <div>
          <label htmlFor={`${id}-ld`} className="text-sm font-semibold text-ink">Vì sao đổi?</label>
          <textarea id={`${id}-ld`} value={note} onChange={(e) => setNote(e.target.value)} rows={3} aria-describedby={`${id}-ldg`}
            className={`mt-1 resize-none ${O_NHAP}`} placeholder="Ví dụ: Theo quyết định họp ngày 03/10, giảm hoa hồng để thu hút phòng trà mới." />
          <p id={`${id}-ldg`} className={`text-xs mt-1 ${daBam && loiLyDo ? 'text-danger' : 'text-ink-mute'}`}>
            Bắt buộc, ít nhất {LY_DO_TOI_THIEU} ký tự ({note.trim().length}/{LY_DO_TOI_THIEU}). Lý do được lưu vĩnh viễn trong lịch sử.
          </p>
        </div>

        <details className="text-xs text-ink-mute">
          <summary className="cursor-pointer min-h-[44px] inline-flex items-center font-semibold text-ink-soft">Chi tiết kỹ thuật</summary>
          <p className="mt-1">Mã tham số: <code className="font-mono text-ink">{config.configKey}</code> · kiểu {config.dataType} · giá trị lưu: <code className="font-mono text-ink">{String(config.configValue)}</code></p>
          {config.description && <p className="mt-1 leading-relaxed">{config.description}</p>}
        </details>

        <div className="flex gap-3 flex-wrap">
          <button type="button" onClick={onClose} disabled={isBusy}
            className="inline-flex flex-1 disabled:opacity-50 items-center justify-center gap-2 min-h-[44px] px-4 border-2 border-ink bg-card text-ink text-sm font-semibold hover:bg-ink hover:text-lamp">
            Huỷ
          </button>
          <button type="submit" disabled={isBusy}
            className="flex-1 flex items-center justify-center gap-2 disabled:opacity-50 min-h-[44px] px-4 bg-ink text-lamp text-sm font-semibold hover:bg-board">
            {isBusy ? <Loader2 size={16} className="animate-spin" aria-hidden="true" /> : <Save size={16} aria-hidden="true" />} Lưu thay đổi
          </button>
        </div>
      </form>
    </HopThoai>
  )
}

const HistoryModal = ({ config, onClose }) => {
  const m = moTaThamSo(config)
  const [rows, setRows] = useState([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const chay = async () => {
      setIsLoading(true)
      try {
        const res = await getSystemConfigHistory(config.configKey)
        if (res.success) setRows(res.data ?? [])
      } catch (err) {
        toast.error(err.response?.data?.message || 'Không tải được lịch sử.')
      } finally {
        setIsLoading(false)
      }
    }
    chay()
  }, [config.configKey])

  return (
    <HopThoai onDong={onClose} className="max-w-lg max-h-[90vh] flex flex-col">
      <div className="flex justify-between items-start gap-3 p-5 border-b border-line">
        <TieuDeHop><h2 className="text-2xl text-ink leading-tight">Lịch sử: {m.ten}</h2></TieuDeHop>
        <button onClick={onClose} className="inline-flex items-center justify-center w-11 h-11 flex-shrink-0 hover:bg-sunken text-ink-soft" aria-label="Đóng"><X size={20} /></button>
      </div>
      <div className="p-5 overflow-y-auto">
        {isLoading ? (
          <div className="py-10 flex justify-center"><Loader2 size={24} className="animate-spin text-ink" /></div>
        ) : rows.length === 0 ? (
          <p className="text-sm text-ink-mute text-center py-8">Tham số này chưa từng bị đổi.</p>
        ) : (
          <ul className="space-y-3">
            {rows.map((h) => (
              <li key={h.id} className="bg-sunken/70 border border-line p-3">
                <div className="flex items-center gap-2 text-sm tabular-nums">
                  <span className="text-ink-mute line-through">{h.oldValue == null ? '—' : hienGiaTri(m, h.oldValue)}</span>
                  <span className="text-ink-mute" aria-label="thành">→</span>
                  <span className="text-ink font-medium">{hienGiaTri(m, h.newValue)}</span>
                </div>
                <p className="text-sm text-ink-soft mt-1.5 leading-relaxed">{h.note}</p>
                <p className="text-xs text-ink-mute mt-1">
                  {h.changedByName ?? 'Không rõ người đổi'} · {dayjs(h.changedAt).format('HH:mm DD/MM/YYYY')}
                </p>
              </li>
            ))}
          </ul>
        )}
      </div>
    </HopThoai>
  )
}

// Một khoá hạ tầng còn thiếu. 'Broken' = tính năng đó hiện KHÔNG dùng được; 'Degraded' = vẫn chạy nhưng mất một lớp.
const GapRow = ({ gap }) => {
  const vo = gap.severity === 'Broken'
  return (
    <div className={`p-4 border ${vo ? 'border-danger/30 bg-danger/5' : 'border-warning/25 bg-warning/5'}`}>
      <div className="flex flex-wrap items-center gap-2">
        <span className={`px-2 py-0.5 text-xs font-bold ${vo ? 'bg-danger/15 text-danger' : 'bg-warning/15 text-warning'}`}>
          {vo ? 'Không dùng được' : 'Chạy thiếu lớp'}
        </span>
        <p className="text-sm text-ink font-medium">{gap.feature}</p>
      </div>
      <p className="text-xs text-ink-soft mt-2 leading-relaxed">{gap.impact}</p>
      <p className="text-xs text-ink-mute mt-1.5 font-mono break-all">{gap.key}</p>
    </div>
  )
}

const DongThamSo = ({ c, m, onSua, onLichSu }) => (
  <li className="py-4 border-t border-line first:border-t-0 grid gap-x-6 gap-y-2 md:grid-cols-[minmax(0,1fr)_auto] md:items-center">
    <div className="min-w-0">
      <h3 className="font-sans text-base font-semibold text-ink">{m.ten}</h3>
      {m.moTa && <p className="text-sm text-ink-soft mt-0.5 leading-relaxed max-w-[62ch]">{m.moTa}</p>}
      <p className="text-xs text-ink-mute mt-1">
        Đổi lần cuối {dayjs(c.updatedAt).format('DD/MM/YYYY')}{c.updatedByName ? ` · ${c.updatedByName}` : ''}
      </p>
    </div>
    <div className="flex flex-wrap items-center gap-2 md:justify-end">
      <span className="text-lg font-semibold text-ink tabular-nums mr-2 [overflow-wrap:anywhere]">{hienGiaTri(m, c.configValue)}</span>
      <button type="button" onClick={onLichSu} aria-label={`Lịch sử thay đổi: ${m.ten}`} title="Lịch sử thay đổi"
        className="inline-flex items-center justify-center w-11 h-11 flex-shrink-0 text-ink-soft hover:bg-sunken">
        <History size={16} aria-hidden="true" />
      </button>
      <button type="button" onClick={onSua} aria-label={`Sửa: ${m.ten}`}
        className="inline-flex items-center justify-center min-h-[44px] px-4 border-2 border-ink bg-card text-ink text-sm font-semibold hover:bg-ink hover:text-lamp">
        Sửa
      </button>
    </div>
  </li>
)

const AdminSystemConfigPage = () => {
  const [configs, setConfigs] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [loiTai, setLoiTai] = useState(false)
  const [editing, setEditing] = useState(null)
  const [historyOf, setHistoryOf] = useState(null)
  const [tim, setTim] = useState('')
  // null = chưa soát được (gọi lỗi). [] = đã soát và không thiếu gì. Hai cái này KHÔNG được hiện giống nhau.
  const [gaps, setGaps] = useState(null)

  const load = useCallback(async () => {
    setIsLoading(true)
    setLoiTai(false)
    // Soát hạ tầng chạy song song và độc lập: nó lỗi thì danh sách tham số vẫn phải hiện.
    const [cfg, audit] = await Promise.allSettled([getSystemConfigs(), getConfigurationAudit()])
    if (cfg.status === 'fulfilled' && cfg.value?.success) setConfigs(cfg.value.data ?? [])
    else setLoiTai(true)
    setGaps(audit.status === 'fulfilled' && audit.value?.success ? (audit.value.data ?? []) : null)
    setIsLoading(false)
  }, [])

  useEffect(() => { const chay = async () => { await load() }; chay() }, [load])

  const nhom = useMemo(() => gomTheoNhom(configs).map((n) => ({ ...n, muc: n.muc.filter(({ c, m }) => khopTim(m, c, tim)) })), [configs, tim])
  const soKhop = nhom.reduce((s, n) => s + n.muc.length, 0)

  if (isLoading) return <div className="py-20 flex justify-center"><Loader2 size={32} className="animate-spin text-ink" /></div>
  if (loiTai) return <TrangLoiTai tieuDe="Cấu hình hệ thống" tenVung="cấu hình hệ thống" taiLai={load} />

  const soVo = gaps?.filter((g) => g.severity === 'Broken').length ?? 0

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-4xl text-ink mb-1">Cấu hình hệ thống</h1>
        <p className="text-ink-soft leading-relaxed max-w-[70ch]">
          Các con số quyết định cách nền tảng vận hành: giữ chỗ bao lâu, thu hoa hồng bao nhiêu, khi nào chuyển tiền cho phòng
          trà. Bấm <b className="text-ink">Sửa</b> ở dòng cần đổi. Mỗi lần đổi phải ghi lý do và được lưu lại trong lịch sử.
        </p>
      </div>

      <div className="flex flex-col lg:flex-row lg:items-center gap-3">
        <div className="relative lg:w-96">
          <Search size={16} aria-hidden="true" className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-mute" />
          <input type="search" value={tim} onChange={(e) => setTim(e.target.value)} aria-label="Tìm tham số"
            placeholder="Tìm: giữ chỗ, hoa hồng, khiếu nại…" className={`pl-9 ${O_NHAP}`} />
        </div>
        <nav aria-label="Nhảy tới nhóm" className="flex flex-wrap gap-x-4 gap-y-1">
          {nhom.filter((n) => n.muc.length > 0).map((n) => (
            <a key={n.id} href={`#nhom-${n.id}`} className="text-sm font-semibold text-ink underline underline-offset-4 decoration-ink/30 hover:decoration-ink min-h-[44px] inline-flex items-center">
              {n.ten} <span className="ml-1 font-normal text-ink-mute">{n.muc.length}</span>
            </a>
          ))}
        </nav>
      </div>

      {tim && soKhop === 0 && (
        <p className="bg-card border border-line p-6 text-ink-soft">
          Không có tham số nào khớp “{tim}”. <button type="button" onClick={() => setTim('')} className="font-semibold text-ink underline underline-offset-4 min-h-[44px]">Xoá ô tìm</button>
        </p>
      )}

      {nhom.filter((n) => n.muc.length > 0).map((n) => (
        <section key={n.id} id={`nhom-${n.id}`} aria-labelledby={`tieu-de-${n.id}`} className="bg-card border border-line px-5 sm:px-6 pt-5 pb-2 scroll-mt-24">
          <h2 id={`tieu-de-${n.id}`} className="text-2xl text-ink">{n.ten}</h2>
          {n.moTa && <p className="text-sm text-ink-mute mt-0.5">{n.moTa}</p>}
          <ul className="mt-2">
            {n.muc.map(({ c, m }) => (
              <DongThamSo key={c.configKey} c={c} m={m} onSua={() => setEditing(c)} onLichSu={() => setHistoryOf(c)} />
            ))}
          </ul>
        </section>
      ))}

      {configs.length === 0 && (
        <div className="bg-card border border-line p-10 text-center"><p className="text-sm text-ink-mute">Không có tham số nào.</p></div>
      )}

      {/* KẾT NỐI DỊCH VỤ NGOÀI — chỉ đọc, sửa ở biến môi trường của server. Gập lại, chỉ để một dòng tóm tắt. */}
      <details className="group bg-card border border-line">
        <summary className="cursor-pointer list-none p-5 sm:px-6 flex flex-wrap items-center gap-x-3 gap-y-1 min-h-[44px]">
          <PlugZap size={16} aria-hidden="true" className="text-ink-soft" />
          <span className="font-semibold text-ink">Kết nối dịch vụ ngoài</span>
          <span className="text-sm text-ink-mute">(dành cho kỹ thuật viên — không sửa được ở trang này)</span>
          <span className="text-sm ml-auto flex items-center gap-2">
            {gaps === null ? <span className="text-warning">Chưa kiểm tra được</span>
              : gaps.length === 0 ? <span className="text-success inline-flex items-center gap-1"><CheckCircle2 size={14} aria-hidden="true" /> Đủ cả</span>
                : <span className={soVo ? 'text-danger' : 'text-warning'}>{soVo ? `${soVo} dịch vụ không dùng được` : `${gaps.length} dịch vụ chạy thiếu`}</span>}
            <ChevronDown size={16} aria-hidden="true" className="transition-transform group-open:rotate-180" />
          </span>
        </summary>
        <div className="px-5 sm:px-6 pb-5">
          <p className="text-sm text-ink-soft leading-relaxed">
            Khoá kết nối tới các dịch vụ ngoài (phát trực tiếp, email, tin nhắn, AI…). Thiếu khoá thì tính năng tương ứng không chạy.
            Kỹ thuật viên phải thêm khoá trong cấu hình triển khai của máy chủ.
          </p>
          {gaps === null ? (
            <p className="mt-3 text-sm text-warning flex items-start gap-1.5"><AlertTriangle size={14} className="mt-0.5 flex-shrink-0" aria-hidden="true" /> Chưa kiểm tra được — điều này KHÔNG có nghĩa là đủ cả.</p>
          ) : gaps.length > 0 && (
            <div className="mt-4 space-y-2">
              {[...gaps].sort((a, b) => (a.severity === b.severity ? 0 : a.severity === 'Broken' ? -1 : 1)).map((g) => <GapRow key={g.key} gap={g} />)}
            </div>
          )}
        </div>
      </details>

      {editing && <EditModal config={editing} onClose={() => setEditing(null)} onSaved={load} />}
      {historyOf && <HistoryModal config={historyOf} onClose={() => setHistoryOf(null)} />}
    </div>
  )
}

export default AdminSystemConfigPage
