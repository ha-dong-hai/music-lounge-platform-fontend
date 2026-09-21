// src/pages/user/ComplaintPage.jsx
//
// GHI CHÚ CHO ĐỘI FE:
// - Trang CÔNG KHAI: khách chưa đăng nhập cũng gửi được khiếu nại, nhưng khi đó phải để lại số điện
//   thoại — nếu không Admin không có cách nào liên hệ lại.
// - `lookupReference` trả về sau khi gửi là thứ DUY NHẤT để khách không có tài khoản tra lại kết quả.
//   Backend không gửi SMS, không có đường nào khác. Vì vậy màn này hiện mã đó thật to, có nút sao chép,
//   và không cho nó biến mất khi người dùng bấm chỗ khác.
// - Tra cứu bằng mã: backend trả CÙNG MỘT câu cho mã sai và mã không tồn tại (cố tình, để không thành
//   công cụ dò mã). Đừng cố đoán và nói "mã không tồn tại".
// - `evidenceUrls` gửi lên là MỘT CHUỖI chứa mảng JSON, không phải mảng.
import { useState, useEffect, useCallback } from 'react'
import { Link } from 'react-router-dom'
import {
  Loader2, MessageSquareWarning, Search, Send, Copy, CheckCircle2, Clock, ArrowLeft, Upload, X,
} from 'lucide-react'
import dayjs from 'dayjs'
import toast from 'react-hot-toast'
import { createComplaint, lookupComplaint, getMyComplaints } from '../../services/complaintServices'
import { uploadImage } from '../../services/userServices'
import { useAuthStore } from '../../store/useAuthStore'

const inputCls = 'mt-1 w-full px-3 py-2.5 bg-page border border-line rounded-lg text-sm text-ink focus:outline-none focus:border-brand/50'

// Đúng 6 giá trị targetType backend nhận.
const TARGET_TYPES = [
  { value: 'show', label: 'Buổi diễn', hint: 'Mã buổi diễn nằm trên đường dẫn trang buổi diễn' },
  { value: 'venue', label: 'Phòng trà', hint: 'Mã phòng trà nằm trên đường dẫn trang phòng trà' },
  { value: 'ticket', label: 'Vé', hint: 'Mã vé nằm trong trang chi tiết vé của bạn' },
  { value: 'donation', label: 'Lượt donate', hint: '' },
  { value: 'livestream', label: 'Buổi phát trực tiếp', hint: '' },
  { value: 'penalty', label: 'Án phạt', hint: '' },
]

// Đúng 8 giá trị ComplaintCategory của backend.
const CATEGORIES = [
  { value: 'EventMisrepresentation', label: 'Buổi diễn không như quảng cáo' },
  { value: 'RefundDispute', label: 'Tranh chấp hoàn tiền' },
  { value: 'DonationNotPaid', label: 'Tiền donate chưa tới nghệ sĩ' },
  { value: 'TechnicalIssue', label: 'Sự cố kỹ thuật' },
  { value: 'VenueConduct', label: 'Thái độ, cách phục vụ của phòng trà' },
  { value: 'PenaltyAppeal', label: 'Khiếu nại án phạt' },
  { value: 'ContentViolation', label: 'Nội dung vi phạm' },
  { value: 'Other', label: 'Khác' },
]

const STATUS_LABELS = {
  Open: 'Đã tiếp nhận, chờ xử lý',
  Investigating: 'Đang xem xét',
  Resolved: 'Đã xử lý',
  Rejected: 'Bị từ chối',
}

const TABS = [
  { key: 'new', label: 'Gửi khiếu nại' },
  { key: 'lookup', label: 'Tra cứu bằng mã' },
  { key: 'mine', label: 'Khiếu nại của tôi' },
]

const ComplaintPage = () => {
  const user = useAuthStore((s) => s.user)
  const [tab, setTab] = useState('new')

  // --- gửi mới ---
  const [form, setForm] = useState({
    targetType: 'show', targetId: '', category: 'Other', description: '', contactPhone: '',
  })
  const [evidences, setEvidences] = useState([])
  const [isUploading, setIsUploading] = useState(false)
  const [isSending, setIsSending] = useState(false)
  const [ketQua, setKetQua] = useState(null) // { id, lookupReference }
  const set = (k, v) => setForm((p) => ({ ...p, [k]: v }))

  // --- tra cứu ---
  const [maTraCuu, setMaTraCuu] = useState('')
  const [ketQuaTraCuu, setKetQuaTraCuu] = useState(null)
  const [isLookingUp, setIsLookingUp] = useState(false)

  // --- của tôi ---
  const [mine, setMine] = useState([])
  const [isLoadingMine, setIsLoadingMine] = useState(false)

  const loadMine = useCallback(async () => {
    if (!user) return
    setIsLoadingMine(true)
    try {
      const res = await getMyComplaints({ pageSize: 50 })
      if (res.success) setMine(res.data.items ?? [])
    } catch (err) {
      toast.error(err.response?.data?.message || 'Không tải được khiếu nại của bạn.')
    } finally {
      setIsLoadingMine(false)
    }
  }, [user])

  useEffect(() => {
    if (tab !== 'mine') return
    const chay = async () => { await loadMine() }
    chay()
  }, [tab, loadMine])

  const taiBangChung = async (file) => {
    if (!file) return
    setIsUploading(true)
    try {
      const up = await uploadImage(file)
      if (!up.success) throw new Error(up.message)
      setEvidences((p) => [...p, up.data?.url ?? up.data])
      toast.success('Đã tải ảnh lên.')
    } catch (err) {
      toast.error(err.response?.data?.message || 'Không tải được ảnh.')
    } finally {
      setIsUploading(false)
    }
  }

  const guiKhieuNai = async (e) => {
    e.preventDefault()
    if (!form.targetId || form.description.trim().length < 10) {
      toast.error('Cần nhập mã đối tượng và mô tả sự việc (ít nhất 10 ký tự).')
      return
    }
    if (!user && !form.contactPhone.trim()) {
      toast.error('Bạn chưa đăng nhập, nên cần để lại số điện thoại để chúng tôi liên hệ lại.')
      return
    }
    setIsSending(true)
    try {
      const res = await createComplaint({
        targetType: form.targetType,
        targetId: Number(form.targetId),
        category: form.category,
        description: form.description.trim(),
        // Backend lưu nguyên chuỗi JSON, không nhận mảng.
        evidenceUrls: evidences.length ? JSON.stringify(evidences) : null,
        contactPhone: form.contactPhone.trim() || null,
      })
      if (res.success) {
        setKetQua(res.data)
        setForm({ targetType: 'show', targetId: '', category: 'Other', description: '', contactPhone: '' })
        setEvidences([])
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Không gửi được khiếu nại.')
    } finally {
      setIsSending(false)
    }
  }

  const traCuu = async (e) => {
    e.preventDefault()
    if (!maTraCuu.trim()) return
    setIsLookingUp(true)
    setKetQuaTraCuu(null)
    try {
      const res = await lookupComplaint(maTraCuu.trim())
      if (res.success) setKetQuaTraCuu(res.data)
    } catch (err) {
      toast.error(err.response?.data?.message || 'Không tra cứu được với mã này.')
    } finally {
      setIsLookingUp(false)
    }
  }

  const saoChepMa = async () => {
    try {
      await navigator.clipboard.writeText(ketQua.lookupReference)
      toast.success('Đã sao chép mã.')
    } catch {
      toast.error('Không sao chép được — hãy chọn và copy thủ công.')
    }
  }

  const loaiHienTai = TARGET_TYPES.find((t) => t.value === form.targetType)

  return (
    <div className="min-h-screen bg-page text-ink">
      <div className="max-w-2xl mx-auto px-4 sm:px-6 py-8">
        <Link to="/" className="inline-flex items-center gap-1.5 text-sm text-ink-mute hover:text-ink mb-6">
          <ArrowLeft size={16} /> Về trang chủ
        </Link>

        <h1 className="text-2xl font-bold mb-1">Khiếu nại &amp; báo cáo</h1>
        <p className="text-ink-soft text-sm mb-6">
          Gửi khiếu nại về buổi diễn, phòng trà, vé hoặc tiền donate. Bạn không cần đăng nhập để gửi.
        </p>

        <div className="flex flex-wrap gap-2 mb-6">
          {TABS.map((t) => (
            <button key={t.key} onClick={() => setTab(t.key)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${tab === t.key
                ? 'bg-sunken border-brand/40 text-brand-text'
                : 'bg-page border-line text-ink-soft hover:text-ink'}`}>
              {t.label}
            </button>
          ))}
        </div>

        {/* ===== GỬI MỚI ===== */}
        {tab === 'new' && (ketQua ? (
          <div className="bg-card border border-green-500/30 rounded-xl p-6">
            <div className="flex items-start gap-3">
              <CheckCircle2 size={20} className="text-success mt-0.5 flex-shrink-0" />
              <div>
                <p className="font-semibold text-ink">Đã gửi khiếu nại</p>
                <p className="text-sm text-ink-soft mt-1">
                  Khiếu nại số #{ketQua.id}. Chúng tôi sẽ xem xét và phản hồi.
                </p>
              </div>
            </div>

            {ketQua.lookupReference && (
              <div className="mt-5 bg-sunken border border-line rounded-lg p-4">
                <p className="text-xs text-ink-mute">Mã tra cứu của bạn</p>
                <div className="flex items-center gap-3 mt-1.5 flex-wrap">
                  <code className="text-lg font-bold text-brand-text tracking-wide break-all">{ketQua.lookupReference}</code>
                  <button onClick={saoChepMa}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-line text-ink-soft text-xs font-bold hover:bg-sunken">
                    <Copy size={13} /> Sao chép
                  </button>
                </div>
                <p className="text-xs text-warning/90 mt-3 leading-relaxed">
                  Hãy lưu lại mã này. Nếu bạn không có tài khoản, đây là cách duy nhất để tra lại kết quả —
                  hệ thống không gửi tin nhắn thông báo.
                </p>
              </div>
            )}

            <button onClick={() => setKetQua(null)}
              className="mt-5 text-sm text-ink-soft hover:text-ink underline">
              Gửi một khiếu nại khác
            </button>
          </div>
        ) : (
          <form onSubmit={guiKhieuNai} className="bg-card border border-line rounded-xl p-6 space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-xs text-ink-mute">Khiếu nại về</label>
                <select value={form.targetType} onChange={(e) => set('targetType', e.target.value)} className={inputCls}>
                  {TARGET_TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs text-ink-mute">Mã {loaiHienTai?.label.toLowerCase()} <span className="text-danger">*</span></label>
                <input type="number" value={form.targetId} onChange={(e) => set('targetId', e.target.value)} className={inputCls} />
                {loaiHienTai?.hint && <p className="text-xs text-ink-mute mt-1">{loaiHienTai.hint}</p>}
              </div>
            </div>

            <div>
              <label className="text-xs text-ink-mute">Loại vấn đề</label>
              <select value={form.category} onChange={(e) => set('category', e.target.value)} className={inputCls}>
                {CATEGORIES.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
              </select>
            </div>

            <div>
              <label className="text-xs text-ink-mute">Mô tả sự việc <span className="text-danger">*</span></label>
              <textarea value={form.description} onChange={(e) => set('description', e.target.value)} rows={5}
                className={`${inputCls} resize-none`}
                placeholder="Kể rõ chuyện gì đã xảy ra, thời điểm, và bạn mong muốn được giải quyết thế nào." />
            </div>

            <div>
              <label className="text-xs text-ink-mute">Ảnh bằng chứng</label>
              <div className="mt-1.5 flex flex-wrap items-center gap-2">
                {evidences.map((url, i) => (
                  <span key={url} className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-page border border-line text-xs text-ink-soft">
                    Ảnh {i + 1}
                    <button type="button" onClick={() => setEvidences((p) => p.filter((u) => u !== url))}
                      className="text-ink-mute hover:text-danger"><X size={12} /></button>
                  </span>
                ))}
                <label className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border border-line text-ink-soft text-xs font-medium hover:bg-sunken cursor-pointer">
                  {isUploading ? <Loader2 size={13} className="animate-spin" /> : <Upload size={13} />}
                  Thêm ảnh
                  <input type="file" accept="image/*" className="hidden" disabled={isUploading}
                    onChange={(e) => taiBangChung(e.target.files?.[0])} />
                </label>
              </div>
            </div>

            <div>
              <label className="text-xs text-ink-mute">
                Số điện thoại liên hệ {!user && <span className="text-danger">*</span>}
              </label>
              <input value={form.contactPhone} onChange={(e) => set('contactPhone', e.target.value)}
                className={inputCls} inputMode="tel" />
              <p className="text-xs text-ink-mute mt-1">
                {user
                  ? 'Không bắt buộc — chúng tôi có thể liên hệ qua tài khoản của bạn.'
                  : 'Bắt buộc vì bạn chưa đăng nhập. Không có số này thì chúng tôi không liên hệ lại được.'}
              </p>
            </div>

            <button type="submit" disabled={isSending || isUploading}
              className="w-full py-3 bg-brand text-on-brand rounded-lg font-bold flex items-center justify-center gap-2 disabled:opacity-50">
              {isSending ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />} Gửi khiếu nại
            </button>
          </form>
        ))}

        {/* ===== TRA CỨU ===== */}
        {tab === 'lookup' && (
          <div className="space-y-4">
            <form onSubmit={traCuu} className="bg-card border border-line rounded-xl p-6">
              <label className="text-xs text-ink-mute">Mã tra cứu nhận được lúc gửi</label>
              <div className="mt-1.5 flex gap-2">
                <input value={maTraCuu} onChange={(e) => setMaTraCuu(e.target.value)}
                  className="flex-1 px-3 py-2.5 bg-page border border-line rounded-lg text-sm text-ink focus:outline-none focus:border-brand/50" />
                <button type="submit" disabled={isLookingUp || !maTraCuu.trim()}
                  className="flex items-center gap-1.5 px-4 rounded-lg bg-brand text-on-brand text-sm font-bold disabled:opacity-50">
                  {isLookingUp ? <Loader2 size={16} className="animate-spin" /> : <Search size={16} />} Tra cứu
                </button>
              </div>
              <p className="text-xs text-ink-mute mt-2">
                Dành cho người gửi khiếu nại mà không có tài khoản.
              </p>
            </form>

            {ketQuaTraCuu && (
              <div className="bg-card border border-line rounded-xl p-6">
                <p className="text-ink font-semibold">Khiếu nại #{ketQuaTraCuu.id}</p>
                <p className="text-sm text-ink-soft mt-1">
                  {STATUS_LABELS[ketQuaTraCuu.status] ?? ketQuaTraCuu.status}
                </p>
                <div className="mt-3 pt-3 border-t border-line space-y-1.5 text-xs text-ink-mute">
                  <p>Gửi lúc {dayjs(ketQuaTraCuu.createdAt).format('HH:mm DD/MM/YYYY')}</p>
                  {ketQuaTraCuu.slaDeadline && (
                    <p className="inline-flex items-center gap-1.5">
                      <Clock size={12} /> Hạn phản hồi {dayjs(ketQuaTraCuu.slaDeadline).format('DD/MM/YYYY')}
                    </p>
                  )}
                  {ketQuaTraCuu.resolvedAt && <p>Đã xử lý {dayjs(ketQuaTraCuu.resolvedAt).format('DD/MM/YYYY')}</p>}
                </div>
                {ketQuaTraCuu.resolution && (
                  <div className="mt-3 bg-sunken/70 border border-line rounded-lg p-3">
                    <p className="text-xs text-ink-mute mb-1">Phản hồi của chúng tôi</p>
                    <p className="text-sm text-ink-soft leading-relaxed">{ketQuaTraCuu.resolution}</p>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* ===== CỦA TÔI ===== */}
        {tab === 'mine' && (
          !user ? (
            <div className="bg-card border border-line rounded-xl p-6">
              <p className="text-sm text-ink-soft">
                Bạn cần <Link to="/login" className="text-brand-text underline">đăng nhập</Link> để xem khiếu nại của mình.
                Nếu đã gửi khi chưa đăng nhập, hãy dùng tab “Tra cứu bằng mã”.
              </p>
            </div>
          ) : isLoadingMine ? (
            <div className="py-16 flex justify-center"><Loader2 size={28} className="animate-spin text-brand-text" /></div>
          ) : mine.length === 0 ? (
            <div className="bg-card border border-line rounded-xl p-10 text-center">
              <MessageSquareWarning size={26} className="mx-auto mb-3 text-ink-mute" />
              <p className="text-sm text-ink-mute">Bạn chưa gửi khiếu nại nào.</p>
            </div>
          ) : (
            <ul className="space-y-3">
              {mine.map((c) => (
                <li key={c.id} className="bg-card border border-line rounded-xl p-5">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-ink font-semibold">#{c.id} · {CATEGORIES.find((x) => x.value === c.category)?.label ?? c.category}</p>
                      <p className="text-xs text-ink-mute mt-0.5">
                        {TARGET_TYPES.find((t) => t.value === c.targetType)?.label ?? c.targetType} #{c.targetId}
                        {' · '}{dayjs(c.createdAt).format('DD/MM/YYYY')}
                      </p>
                    </div>
                    <span className="text-xs text-ink-soft flex-shrink-0">{STATUS_LABELS[c.status] ?? c.status}</span>
                  </div>
                  <p className="text-sm text-ink-soft mt-2 line-clamp-3">{c.description}</p>
                  {c.resolution && (
                    <div className="mt-3 bg-sunken/70 border border-line rounded-lg p-3">
                      <p className="text-xs text-ink-mute mb-1">Phản hồi</p>
                      <p className="text-sm text-ink-soft leading-relaxed">{c.resolution}</p>
                    </div>
                  )}
                </li>
              ))}
            </ul>
          )
        )}
      </div>
    </div>
  )
}

export default ComplaintPage
