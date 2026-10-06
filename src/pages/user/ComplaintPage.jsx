// src/pages/user/ComplaintPage.jsx
//
// KHIẾU NẠI VÀ BÁO CÁO — trang công khai, gửi được khi CHƯA đăng nhập (khi đó bắt buộc để lại số điện thoại và nhận
// một mã tra cứu). Làm lại 30/09/2026 (reports/Form lọc vé và màn vận hành.md):
//  - Mọi ô có nhãn nối với ô (OTruong). Bản cũ: 6 ô nhập không có tên cho trình đọc màn hình.
//  - LỖI HIỆN TẠI Ô, không chỉ một thông báo nổi rồi biến mất; bấm gửi mà thiếu thì focus về ô lỗi đầu tiên
//    (GOV.UK: lỗi nằm cạnh ô, dẫn người dùng tới chỗ cần sửa).
//  - Ba "tab" là nút có aria-pressed (lọc nội dung trong trang), kèm tiêu đề cho từng phần.
//  - Sau khi gửi: trang xác nhận nói mã, việc tiếp theo và cách tra lại (GOV.UK confirmation page).
//  - Ngày tháng qua utils/ngayVietNam; trạng thái qua NhanTrangThai.
// GIỮ NGUYÊN: 6 loại đối tượng và 8 loại vấn đề đúng như backend; bằng chứng gửi dạng chuỗi JSON (backend không nhận mảng).
import { useState, useRef } from 'react'
import { parseAsStringLiteral, useQueryState } from 'nuqs'
import { Link, useSearchParams } from 'react-router-dom'
import { Loader2, Upload, X } from 'lucide-react'
import toast from 'react-hot-toast'
import { createComplaint, lookupComplaint, getMyComplaints } from '../../services/complaintServices'
import { uploadImage } from '../../services/userServices'
import { useAuthStore } from '../../store/useAuthStore'
import OTruong from '../../components/shared/OTruong'
import NhanTrangThai from '../../components/shared/NhanTrangThai'
import { useDanhSachMayChu } from '../../hooks/useDanhSachMayChu'
import { useDemTab } from '../../hooks/useDemTab'
import PhanTrang from '../../components/bang/PhanTrang'
import { ngayDayDu, gioTrongNgay } from '../../utils/ngayVietNam'
import { laGuid } from '../../utils/format'
import LienKetMuiTen from '../../components/shared/LienKetMuiTen'
import ChonDoiTuongKhieuNai from '../../components/complaints/ChonDoiTuongKhieuNai'

// Đúng 6 giá trị targetType backend nhận.
const TARGET_TYPES = [
  // MLACP-680: gợi ý nói cách CHỌN, không nói về dãy mã. Mỗi trang buổi diễn / phòng trà / vé / khoản ủng hộ cũng có lối
  // "Khiếu nại về …" mở thẳng trang này với đối tượng điền sẵn.
  { value: 'show', label: 'Buổi diễn', hint: 'Buổi bạn đã mua vé có sẵn trong danh sách. Buổi khác: dán đường dẫn trang buổi diễn.' },
  { value: 'venue', label: 'Phòng trà', hint: 'Chọn phòng trà trong danh sách.' },
  { value: 'ticket', label: 'Vé', hint: 'Chọn vé của bạn trong danh sách.' },
  { value: 'donation', label: 'Lượt ủng hộ', hint: 'Chọn khoản ủng hộ của bạn trong danh sách.' },
  { value: 'livestream', label: 'Buổi phát trực tuyến', hint: 'Buổi bạn đã mua vé có sẵn trong danh sách. Buổi khác: dán đường dẫn trang xem trực tuyến.' },
  { value: 'penalty', label: 'Án phạt', hint: 'Chủ phòng trà: chọn án phạt trong danh sách.' },
]

// Đúng 8 giá trị ComplaintCategory của backend.
const CATEGORIES = [
  { value: 'EventMisrepresentation', label: 'Buổi diễn không như quảng cáo' },
  { value: 'RefundDispute', label: 'Tranh chấp hoàn tiền' },
  { value: 'DonationNotPaid', label: 'Tiền ủng hộ chưa tới nghệ sĩ' },
  { value: 'TechnicalIssue', label: 'Sự cố kỹ thuật' },
  { value: 'VenueConduct', label: 'Thái độ, cách phục vụ của phòng trà' },
  { value: 'PenaltyAppeal', label: 'Khiếu nại án phạt' },
  { value: 'ContentViolation', label: 'Nội dung vi phạm' },
  { value: 'Other', label: 'Khác' },
]

const TRANG_THAI = {
  Open: ['cho', 'Đã tiếp nhận, chờ xử lý'],
  Investigating: ['cho', 'Đang xem xét'],
  Resolved: ['tot', 'Đã xử lý'],
  Rejected: ['tat', 'Không chấp nhận'],
}
const NhanKhieuNai = ({ status }) => {
  const [sacThai, nhan] = TRANG_THAI[status] ?? ['trung', status]
  return <NhanTrangThai sacThai={sacThai}>{nhan}</NhanTrangThai>
}

const TABS = [
  { key: 'new', label: 'Gửi khiếu nại' },
  { key: 'lookup', label: 'Tra cứu bằng mã' },
  { key: 'mine', label: 'Khiếu nại của tôi' },
]
// Việc đang chọn nằm trên URL (?muc=mine, 01/10/2026) — danh sách "của tôi" có trang trên URL (knTrang), tải lại hay
// Quay lại phải mở đúng phần chứa nó; đăng nhập xong cũng quay về đúng phần "của tôi".
const MUC = parseAsStringLiteral(TABS.map((t) => t.key)).withDefault('new').withOptions({ history: 'push' })

const MO_TA_TOI_THIEU = 10
// MLACP-679: gọi khiếu nại theo ngày gửi thay cho mã GUID ("Khiếu nại số 01a1…").
const ngayGui = (t) => (t ? `gửi ngày ${ngayDayDu(t)}` : '')
const NUT_DAC = 'inline-flex items-center justify-center gap-2 min-h-[48px] px-6 bg-ink text-lamp font-semibold hover:bg-board transition-colors disabled:opacity-60'
const NUT_VIEN = 'inline-flex items-center justify-center gap-2 min-h-[44px] px-4 border-2 border-ink text-ink font-semibold hover:bg-ink hover:text-lamp transition-colors disabled:opacity-60'

const PhanHoi = ({ c }) => (
  <>
    <div className="mt-3 text-sm text-ink-soft space-y-0.5">
      <p>Gửi lúc {gioTrongNgay(c.createdAt)} ngày {ngayDayDu(c.createdAt)}</p>
      {c.slaDeadline && !c.resolvedAt && <p>Hạn phản hồi: {ngayDayDu(c.slaDeadline)}</p>}
      {c.resolvedAt && <p>Đã xử lý ngày {ngayDayDu(c.resolvedAt)}</p>}
    </div>
    {c.resolution && (
      <div className="mt-3 border-l-4 border-ink bg-sunken p-3">
        <p className="text-sm font-semibold">Phản hồi của chúng tôi</p>
        <p className="text-ink-soft leading-relaxed mt-0.5 whitespace-pre-line">{c.resolution}</p>
      </div>
    )}
  </>
)

const ComplaintPage = () => {
  const user = useAuthStore((s) => s.user)
  const [tab, setTab] = useQueryState('muc', MUC)

  // --- gửi mới ---
  // MLACP-679: mở từ một trang cụ thể (vd. "Khiếu nại về vé này") thì đối tượng đã biết — điền sẵn và gọi bằng TÊN, người
  // dùng không phải đi tìm rồi dán một dãy mã. ?loai=ticket&ma=<id>&ten=<tên hiển thị>.
  const [thamSo] = useSearchParams()
  const [dienSan] = useState(() => {
    const loai = thamSo.get('loai'), ma = thamSo.get('ma')
    return loai && ma && TARGET_TYPES.some((t) => t.value === loai) && laGuid(ma) ? { loai, ma, ten: thamSo.get('ten') || '' } : null
  })
  const [form, setForm] = useState({
    targetType: dienSan?.loai ?? 'show', targetId: dienSan?.ma ?? '', category: 'Other', description: '', contactPhone: '',
  })
  const [loi, setLoi] = useState({})
  const [evidences, setEvidences] = useState([])
  const [isUploading, setIsUploading] = useState(false)
  const [isSending, setIsSending] = useState(false)
  const [ketQua, setKetQua] = useState(null) // { id, lookupReference }
  const oForm = useRef(null)
  const set = (k, v) => { setForm((p) => ({ ...p, [k]: v })); if (loi[k]) setLoi((l) => ({ ...l, [k]: null })) }

  // --- tra cứu ---
  const [maTraCuu, setMaTraCuu] = useState('')
  const [loiTraCuu, setLoiTraCuu] = useState(null)
  const [ketQuaTraCuu, setKetQuaTraCuu] = useState(null)
  const [isLookingUp, setIsLookingUp] = useState(false)

  // --- của tôi ---
  // PHÂN TRANG (01/10/2026): bản cũ xin cố định pageSize 50 không có trang tiếp — khiếu nại thứ 51 trở đi (cùng phản
  // hồi của Admin) không bao giờ hiện. Chỉ tải khi đã đăng nhập VÀ đang mở phần này.
  const dsMine = useDanhSachMayChu({ khoa: ['khieu-nai-cua-toi', user?.id], goi: getMyComplaints, tien: 'kn', coMacDinh: 10, batDau: Boolean(user) && tab === 'mine' })
  const mine = dsMine.items
  const loadMine = () => dsMine.taiLai()
  // MLACP-685: số khiếu nại của tôi hiện ngay trên nút, không phải bấm vào mới thấy (hai việc còn lại không có danh sách).
  const demCuaToi = useDemTab(`khieu-nai-cua-toi-${user?.id}`, { mine: () => getMyComplaints({ page: 1, pageSize: 1 }) }, { batDau: Boolean(user) })

  const taiBangChung = async (file) => {
    if (!file) return
    setIsUploading(true)
    try {
      const up = await uploadImage(file)
      if (!up.success) throw new Error(up.message)
      setEvidences((p) => [...p, up.data?.url ?? up.data])
      toast.success('Đã tải ảnh lên.')
    } catch (err) {
      toast.error(err.response?.data?.message || err.message || 'Không tải được ảnh. Ảnh phải là tệp hình, dung lượng vừa phải.')
    } finally {
      setIsUploading(false)
    }
  }

  const kiemForm = () => {
    const l = {}
    const loai = TARGET_TYPES.find((t) => t.value === form.targetType)
    // MLACP-516/680: chưa chọn được đối tượng — nói cách làm, không nói về dạng mã.
    if (!laGuid(String(form.targetId))) l.targetId = `Chọn ${loai.label.toLowerCase()} trong danh sách, hoặc dán nguyên đường dẫn trang ${loai.label.toLowerCase()}.`
    if (form.description.trim().length < MO_TA_TOI_THIEU) l.description = `Mô tả sự việc cần ít nhất ${MO_TA_TOI_THIEU} ký tự.`
    if (!user && !form.contactPhone.trim()) l.contactPhone = 'Bạn chưa đăng nhập, nên cần để lại số điện thoại để chúng tôi liên hệ lại.'
    return l
  }

  const guiKhieuNai = async (e) => {
    e.preventDefault()
    const l = kiemForm()
    setLoi(l)
    if (Object.keys(l).length) {
      // Focus ô lỗi ĐẦU TIÊN theo thứ tự trên trang.
      const dau = oForm.current?.querySelector('[aria-invalid="true"]')
      setTimeout(() => (oForm.current?.querySelector('[aria-invalid="true"]') ?? dau)?.focus(), 0)
      return
    }
    setIsSending(true)
    try {
      const res = await createComplaint({
        targetType: form.targetType,
        targetId: String(form.targetId).trim(),
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
        window.scrollTo({ top: 0 })
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Chưa gửi được khiếu nại. Hãy thử lại sau ít phút.', { duration: 6000 })
    } finally {
      setIsSending(false)
    }
  }

  const traCuu = async (e) => {
    e.preventDefault()
    if (!maTraCuu.trim()) { setLoiTraCuu('Nhập mã tra cứu bạn nhận được lúc gửi.'); return }
    setLoiTraCuu(null)
    setIsLookingUp(true)
    setKetQuaTraCuu(null)
    try {
      const res = await lookupComplaint(maTraCuu.trim())
      if (res.success) setKetQuaTraCuu(res.data)
    } catch (err) {
      setLoiTraCuu(err.response?.status === 404 ? 'Không tìm thấy khiếu nại nào với mã này. Kiểm tra lại từng ký tự.' : (err.response?.data?.message || 'Chưa tra cứu được. Hãy thử lại sau ít phút.'))
    } finally {
      setIsLookingUp(false)
    }
  }

  const saoChepMa = async () => {
    try {
      await navigator.clipboard.writeText(ketQua.lookupReference)
      toast.success('Đã sao chép mã.')
    } catch {
      toast.error('Trình duyệt không cho sao chép. Hãy chọn mã và chép thủ công.')
    }
  }

  const loaiHienTai = TARGET_TYPES.find((t) => t.value === form.targetType)

  return (
    <div className="min-h-[70vh] bg-stock text-ink">
      <div className="max-w-2xl mx-auto px-4 sm:px-8 py-10">
        <p><LienKetMuiTen to="/" lui nho>Về trang chủ</LienKetMuiTen></p>

        <h1 className="text-5xl mt-2">Khiếu nại và báo cáo</h1>
        <p className="text-ink-soft mt-2 mb-7">
          Gửi khiếu nại về buổi diễn, phòng trà, vé hoặc tiền ủng hộ. Không cần đăng nhập để gửi.
        </p>

        <div role="group" aria-label="Chọn việc cần làm" className="flex flex-wrap gap-2 mb-8">
          {TABS.map((t) => (
            <button key={t.key} type="button" aria-pressed={tab === t.key} onClick={() => { setTab(t.key === 'new' ? null : t.key); if (t.key !== 'mine') dsMine.datTrang(1) }}
              className={`min-h-[44px] px-4 border-2 border-ink font-semibold transition-colors ${tab === t.key ? 'bg-ink text-lamp' : 'bg-card text-ink hover:bg-sunken'}`}>
              {t.label}
              {demCuaToi[t.key] != null && <span className="ml-2 font-mono text-sm tabular-nums">{demCuaToi[t.key]}</span>}
            </button>
          ))}
        </div>

        {/* ===== GỬI MỚI ===== */}
        {tab === 'new' && (ketQua ? (
          <section aria-labelledby="da-gui-td" className="border-2 border-ink bg-card p-6 sm:p-8">
            <div role="status">
              <p className="font-mono text-sm">Đã xong</p>
              {/* MLACP-679: bản cũ in "khiếu nại số <GUID>" — mã nội bộ, không tra cứu được bằng gì. Mã người dùng cần là mã tra cứu ngay dưới. */}
              <h2 id="da-gui-td" className="text-4xl mt-1">Đã gửi khiếu nại</h2>
            </div>
            {ketQua.lookupReference && (
              <div className="mt-5 border-l-4 border-ink bg-sunken p-4">
                <p className="text-sm font-semibold">Mã tra cứu của bạn</p>
                <div className="flex items-center gap-3 mt-1.5 flex-wrap">
                  <code className="font-mono text-xl font-semibold break-all select-all">{ketQua.lookupReference}</code>
                  <button type="button" onClick={saoChepMa} className={NUT_VIEN}>Sao chép mã</button>
                </div>
                <p className="text-ink-soft mt-3">
                  Hãy lưu lại mã này. Nếu bạn không có tài khoản, đây là cách duy nhất để tra lại kết quả: hệ thống không gửi tin nhắn thông báo.
                </p>
              </div>
            )}
            <div className="mt-6 border-t border-ink/20 pt-5">
              <h3 className="text-base">Tiếp theo</h3>
              <p className="text-ink-soft mt-1">
                Quản trị viên xem khiếu nại và phản hồi. Tra lại kết quả bằng mục “{user ? 'Khiếu nại của tôi' : 'Tra cứu bằng mã'}” ở trên.
              </p>
            </div>
            <button type="button" onClick={() => setKetQua(null)} className={`${NUT_VIEN} mt-6`}>Gửi một khiếu nại khác</button>
          </section>
        ) : (
          <form ref={oForm} onSubmit={guiKhieuNai} noValidate className="border-2 border-ink bg-card p-5 sm:p-8 space-y-6">
            {dienSan && form.targetId === dienSan.ma ? (
              <div className="border-l-4 border-ink bg-sunken p-4">
                <p className="text-sm text-ink-soft">Khiếu nại về</p>
                <p className="font-semibold mt-0.5">{TARGET_TYPES.find((t) => t.value === dienSan.loai)?.label}{dienSan.ten ? `: ${dienSan.ten}` : ''}</p>
              </div>
            ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <OTruong nhan="Khiếu nại về">
                {(p) => (
                  <select {...p} value={form.targetType} onChange={(e) => { set('targetType', e.target.value); set('targetId', '') }}>
                    {TARGET_TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
                  </select>
                )}
              </OTruong>
              {/* MLACP-680: CHỌN trong danh sách của mình (hoặc dán cả đường dẫn trang) — không bắt dán một dãy mã. */}
              <OTruong nhan={`Chọn ${loaiHienTai?.label.toLowerCase()}`} batBuoc goiY={loaiHienTai?.hint || undefined} loi={loi.targetId}>
                {(p) => <ChonDoiTuongKhieuNai key={form.targetType} loai={form.targetType} giaTri={form.targetId} user={user}
                  onChon={(id) => set('targetId', id)} p={p} />}
              </OTruong>
            </div>
            )}

            <OTruong nhan="Loại vấn đề">
              {(p) => (
                <select {...p} value={form.category} onChange={(e) => set('category', e.target.value)}>
                  {CATEGORIES.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
                </select>
              )}
            </OTruong>

            <OTruong nhan="Mô tả sự việc" batBuoc goiY={`Chuyện gì đã xảy ra, lúc nào, và bạn mong được giải quyết thế nào. Ít nhất ${MO_TA_TOI_THIEU} ký tự.`} loi={loi.description}>
              {(p) => <textarea {...p} rows={6} value={form.description} onChange={(e) => set('description', e.target.value)} className={`${p.className} py-2 resize-y`} />}
            </OTruong>

            <fieldset className="min-w-0">
              <legend className="font-semibold">Ảnh bằng chứng <span className="font-normal text-ink-mute">(không bắt buộc)</span></legend>
              <div className="mt-2 flex flex-wrap items-center gap-2">
                {evidences.map((url, i) => (
                  <span key={url} className="inline-flex items-center gap-1 pl-3 border border-ink text-sm">
                    Ảnh {i + 1}
                    <button type="button" onClick={() => setEvidences((p) => p.filter((u) => u !== url))} aria-label={`Bỏ ảnh ${i + 1}`}
                      className="w-10 h-10 inline-flex items-center justify-center hover:bg-ink hover:text-lamp"><X size={14} aria-hidden="true" /></button>
                  </span>
                ))}
                <label className={`${NUT_VIEN} cursor-pointer has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-ink has-[:focus-visible]:ring-offset-2`}>
                  {isUploading ? <Loader2 size={16} className="animate-spin" aria-hidden="true" /> : <Upload size={16} aria-hidden="true" />}
                  {isUploading ? 'Đang tải ảnh…' : 'Thêm ảnh'}
                  <input type="file" accept="image/*" className="sr-only" disabled={isUploading}
                    onChange={(e) => { taiBangChung(e.target.files?.[0]); e.target.value = '' }} />
                </label>
              </div>
            </fieldset>

            <OTruong nhan="Số điện thoại liên hệ" batBuoc={!user} khongBatBuoc={Boolean(user)} loi={loi.contactPhone}
              goiY={user ? 'Chúng tôi có thể liên hệ qua tài khoản của bạn.' : 'Bạn chưa đăng nhập: không có số này thì chúng tôi không liên hệ lại được.'}>
              {(p) => <input {...p} type="tel" inputMode="tel" autoComplete="tel" value={form.contactPhone} onChange={(e) => set('contactPhone', e.target.value)} />}
            </OTruong>

            <button type="submit" disabled={isSending || isUploading} className={`${NUT_DAC} w-full`}>
              {isSending && <Loader2 size={18} className="animate-spin" aria-hidden="true" />} {isSending ? 'Đang gửi…' : 'Gửi khiếu nại'}
            </button>
          </form>
        ))}

        {/* ===== TRA CỨU ===== */}
        {tab === 'lookup' && (
          <div className="space-y-6">
            <form onSubmit={traCuu} noValidate className="border-2 border-ink bg-card p-5 sm:p-8">
              <OTruong nhan="Mã tra cứu nhận được lúc gửi" goiY="Dành cho người gửi khiếu nại khi chưa có tài khoản." loi={loiTraCuu}>
                {(p) => (
                  <div className="flex gap-2">
                    <input {...p} autoCapitalize="characters" spellCheck={false} value={maTraCuu}
                      onChange={(e) => { setMaTraCuu(e.target.value); setLoiTraCuu(null) }} className={`${p.className} flex-1 min-w-0 font-mono`} />
                    <button type="submit" disabled={isLookingUp} className={NUT_DAC}>
                      {isLookingUp && <Loader2 size={16} className="animate-spin" aria-hidden="true" />} Tra cứu
                    </button>
                  </div>
                )}
              </OTruong>
            </form>

            {ketQuaTraCuu && (
              <section aria-label="Kết quả tra cứu" className="border-2 border-ink bg-card p-5 sm:p-8">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <h2 className="text-3xl">Khiếu nại {ngayGui(ketQuaTraCuu.createdAt)}</h2>
                  <NhanKhieuNai status={ketQuaTraCuu.status} />
                </div>
                <PhanHoi c={ketQuaTraCuu} />
              </section>
            )}
          </div>
        )}

        {/* ===== CỦA TÔI ===== */}
        {tab === 'mine' && (
          !user ? (
            <div className="border-2 border-ink bg-card p-6">
              <p>
                Bạn cần <Link to="/login" state={{ from: '/complaints?muc=mine' }} className="font-semibold underline underline-offset-4">đăng nhập</Link> để xem khiếu nại của mình.
                Nếu đã gửi khi chưa đăng nhập, hãy dùng “Tra cứu bằng mã”.
              </p>
            </div>
          ) : dsMine.dangTai ? (
            <div className="h-48 border-2 border-ink/20 bg-ink/5 animate-pulse" aria-busy="true" aria-label="Đang tải khiếu nại của bạn" />
          ) : dsMine.loi ? (
            <div role="alert" className="flex flex-wrap items-center gap-4 border-2 border-ink p-5">
              <p>Danh sách khiếu nại chưa tải được.</p>
              <button type="button" onClick={loadMine} className={NUT_DAC}>Thử lại</button>
            </div>
          ) : mine.length === 0 ? (
            <div className="border-2 border-ink bg-card p-6"><p>Bạn chưa gửi khiếu nại nào.</p></div>
          ) : (
            <div className="space-y-4">
            <PhanTrang ds={dsMine} tenDonVi="khiếu nại" idDanhSach="ds-khieu-nai-cua-toi" />
            <ul id="ds-khieu-nai-cua-toi" tabIndex={-1} className={`border-y-2 border-ink focus:outline-none ${dsMine.laDuLieuCu ? 'opacity-60' : ''}`}>
              {mine.map((c) => (
                <li key={c.id} className="py-5 border-t border-ink/20 first:border-t-0">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="min-w-0">
                      <h2 className="font-sans font-bold text-lg">{CATEGORIES.find((x) => x.value === c.category)?.label ?? c.category} <span className="font-normal text-ink-soft">· {ngayGui(c.createdAt)}</span></h2>
                      <p className="text-sm text-ink-soft mt-0.5">
                        {TARGET_TYPES.find((t) => t.value === c.targetType)?.label ?? c.targetType}: {c.targetName || '(không còn tồn tại)'}
                      </p>
                    </div>
                    <NhanKhieuNai status={c.status} />
                  </div>
                  <p className="text-ink-soft mt-2 line-clamp-3">{c.description}</p>
                  <PhanHoi c={c} />
                </li>
              ))}
            </ul>
            <PhanTrang ds={dsMine} tenDonVi="khiếu nại" idDanhSach="ds-khieu-nai-cua-toi" />
            </div>
          )
        )}
      </div>
    </div>
  )
}

export default ComplaintPage
