// src/pages/owner/OwnerShowDetailPage.jsx
//
// Màn chuẩn bị buổi diễn trước khi gửi duyệt. Backend đòi đủ 4 điều kiện mới cho gửi:
//   1) >= 1 hạng vé   2) >= 1 nghệ sĩ trong line-up
//   3) đã khai văn bản chấp thuận biểu diễn (D18 — NĐ 144/2020 Điều 10)
//   4) nộp trước tối thiểu N ngày làm việc so với ngày diễn
//
// GHI CHÚ CHO ĐỘI FE — LỖ HỔNG DỮ LIỆU QUAN TRỌNG, đừng "sửa" bằng cách đoán:
// Chỉ 2 trong 4 điều kiện đọc được từ API (số hạng vé, số nghệ sĩ). Hai điều kiện còn lại KHÔNG có
// cách nào đọc:
//   - Văn bản chấp thuận: chủ khai vào `LegalApprovalReference`, nhưng KHÔNG DTO NÀO TRẢ TRƯỜNG ĐÓ.
//     Trường `legalApprovalConfirmed` trong LoungeShowDetailDto là chuyện KHÁC HẲN — nó map từ
//     `LegalApprovalConfirmedAt`, do ADMIN đặt lúc duyệt (ReviewShowCommandHandler), nên với buổi
//     diễn còn Draft nó LUÔN false kể cả khi chủ đã khai xong. Dùng nó làm checklist là sai.
//   - Số ngày làm việc tối thiểu: luật nằm ở backend.
// Vì vậy nút "Gửi duyệt" KHÔNG khoá theo 2 điều kiện không đọc được — cứ cho bấm, backend trả 422
// kèm lý do cụ thể và hiển thị nguyên văn. Đặt luật ở hai nơi rồi lệch nhau còn tệ hơn.
// Khi backend bổ sung trường "chủ đã khai văn bản chưa" thì mới nên siết lại checklist.
// - Phần khai VCPMC nằm ở trang Livestream, không nằm ở đây (cũng cùng lỗ hổng: không đọc lại được).
// - Mọi thứ trên trang này chỉ sửa được khi buổi diễn còn ở trạng thái Nháp.
// - SỬA LINE-UP: backend nhận PUT với đủ (role, orderIndex, setTime, acceptsDonation) — ghi đè
//   toàn bộ. `performers[].orderIndex` nay CÓ trong chi tiết buổi diễn, nên sửa một người là gửi
//   lại ĐÚNG SỐ ĐANG LƯU của người đó, một lệnh PUT.
//   ĐỪNG QUAY LẠI CÁCH CŨ: trước khi backend trả orderIndex, FE suy ra bằng vị trí trong mảng —
//   sai, vì nếu số đang lưu là 0, 5, 10 (A, B, C) thì sửa vai trò của C sẽ gửi 2, thành 0, 5, 2 và
//   C nhảy lên trước B dù người dùng không đổi thứ tự. Vị trí trong mảng và số đang lưu là hai
//   không gian khác nhau. Nếu có hàng nào thiếu orderIndex (dữ liệu cũ), code dưới rơi về đánh số
//   lại cả danh sách thay vì đoán.
// - Đổi sang nghệ sĩ khác thì phải xoá rồi thêm lại; PUT không đổi được người.
// - SỬA HẠNG VÉ chỉ đổi được tên / mô tả / sức chứa. GIÁ KHÔNG SỬA Ở ĐÂY — giá thuộc đợt giá riêng.
import { useState, useEffect, useCallback } from 'react'
import { useParams, Link } from 'react-router-dom'
import {
  ArrowLeft, Loader2, Plus, Trash2, Check, X, Send, Ticket, Users, FileCheck,
  Pencil, ArrowUp, ArrowDown, Save, XCircle, Clock,
} from 'lucide-react'
import dayjs from 'dayjs'
import toast from 'react-hot-toast'
import {
  getShowDetail, submitShow, setLegalApproval, addPerformance, deletePerformance,
  updatePerformance,
} from '../../services/showServices'
import { getTiers, createTier, deleteTier, updateTier } from '../../services/ticketTierServices'
import ShowAnalyticsSection from '../../components/owner/ShowAnalyticsSection'
import { searchPerformers } from '../../services/catalogServices'

const fmtMoney = (v) => `${Number(v || 0).toLocaleString('vi-VN')}đ`

const ROLES = [
  { value: 'Main', label: 'Chính' },
  { value: 'Guest', label: 'Khách mời' },
  { value: 'Host', label: 'Dẫn chương trình' },
]

const ChecklistRow = ({ ok, label, hint }) => (
  <div className="flex items-start gap-2.5">
    <span className={`mt-0.5 w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 ${ok ? 'bg-green-500/15 text-success' : 'bg-sunken text-ink-mute'}`}>
      {ok ? <Check size={13} /> : <X size={13} />}
    </span>
    <div>
      <p className={`text-sm ${ok ? 'text-ink-soft' : 'text-ink font-medium'}`}>{label}</p>
      {!ok && hint && <p className="text-xs text-ink-mute mt-0.5">{hint}</p>}
    </div>
  </div>
)

const OwnerShowDetailPage = () => {
  const { id } = useParams()
  const [show, setShow] = useState(null)
  const [tiers, setTiers] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [busy, setBusy] = useState(null)

  const [legalRef, setLegalRef] = useState('')
  const [performerQuery, setPerformerQuery] = useState('')
  const [performerResults, setPerformerResults] = useState([])
  // Đang sửa tiết mục nào / hạng vé nào (giữ bản nháp riêng để không ghi vào state gốc khi chưa lưu)
  const [suaTietMuc, setSuaTietMuc] = useState(null)   // { performanceId, role, setTime, acceptsDonation }
  const [suaHangVe, setSuaHangVe] = useState(null)     // { id, name, description, totalCapacity }
  const [showTierForm, setShowTierForm] = useState(false)
  const [tierForm, setTierForm] = useState({
    name: '', accessType: 'Physical', totalCapacity: '',
    priceName: 'Vé thường', price: '', quota: '', purchaseChannel: 'Both',
  })

  const load = useCallback(async () => {
    try {
      const [sRes, tRes] = await Promise.all([getShowDetail(id), getTiers(id)])
      if (sRes.success) setShow(sRes.data)
      if (tRes.success) setTiers(tRes.data || [])
    } catch {
      toast.error('Không tải được buổi diễn.')
    }
  }, [id])

  useEffect(() => {
    const run = async () => { setIsLoading(true); await load(); setIsLoading(false) }
    run()
  }, [load])

  const handleSaveLegal = async () => {
    if (!legalRef.trim()) return
    setBusy('legal')
    try {
      await setLegalApproval(id, legalRef.trim())
      toast.success('Đã lưu văn bản chấp thuận.')
      setLegalRef('')
      await load()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Không lưu được.')
    } finally { setBusy(null) }
  }

  const handleSearchPerformer = async (q) => {
    setPerformerQuery(q)
    if (q.trim().length < 2) { setPerformerResults([]); return }
    try {
      const res = await searchPerformers({ search: q.trim(), pageSize: 5 })
      if (res.success) setPerformerResults(res.data.items || [])
    } catch { /* ô tìm kiếm lỗi không nên chặn cả trang */ }
  }

  const handleAddPerformer = async (performer) => {
    setBusy('performer')
    try {
      await addPerformance(id, {
        performerId: performer.id,
        performerName: null,
        role: show.performers?.length ? 'Guest' : 'Main',
        orderIndex: (show.performers?.length || 0) + 1,
        setTime: null,
        acceptsDonation: true,
      })
      toast.success(`Đã thêm ${performer.name} vào line-up.`)
      setPerformerQuery(''); setPerformerResults([])
      await load()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Không thêm được nghệ sĩ.')
    } finally { setBusy(null) }
  }

  const handleRemovePerformer = async (performanceId) => {
    setBusy(`perf-${performanceId}`)
    try {
      await deletePerformance(id, performanceId)
      toast.success('Đã gỡ khỏi line-up.')
      await load()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Không gỡ được.')
    } finally { setBusy(null) }
  }

  // Mọi hàng đều có orderIndex thì mới tin được số đang lưu. Thiếu một hàng (dữ liệu cũ, hoặc
  // backend chưa deploy bản có trường này) là không so sánh được nữa — lúc đó phải đánh số lại cả
  // danh sách chứ KHÔNG đoán bằng vị trí mảng cho một người.
  const coDuThuTu = (ds) => ds.every((p) => Number.isInteger(p.orderIndex))

  // setTime là TimeOnly ở backend: gửi "HH:mm" (từ ô input) hoặc "HH:mm:ss" (từ DTO) đều được,
  // nhưng KHÔNG gửi chuỗi rỗng — phải quy về null.
  const guiTietMuc = (p, orderIndex) => updatePerformance(id, p.performanceId, {
    role: p.role,
    orderIndex,
    setTime: p.setTime ? String(p.setTime) : null,
    acceptsDonation: !!p.acceptsDonation,
  })

  // Đánh số lại cả danh sách thành 0,1,2... theo đúng thứ tự truyền vào. Gửi TUẦN TỰ: nhiều PUT
  // song song lên cùng một buổi diễn thì thứ tự cuối cùng phụ thuộc lệnh nào về trước.
  const ghiLaiThuTu = async (danhSach) => {
    for (let i = 0; i < danhSach.length; i += 1) {
      await guiTietMuc(danhSach[i], i)
    }
  }

  const handleLuuTietMuc = async () => {
    if (!suaTietMuc) return
    const ds = show.performers ?? []
    const goc = ds.find((x) => x.performanceId === suaTietMuc.performanceId)
    if (!goc) return

    const daSua = {
      ...goc,
      role: suaTietMuc.role,
      setTime: suaTietMuc.setTime || null,
      acceptsDonation: suaTietMuc.acceptsDonation,
    }

    setBusy(`perf-${suaTietMuc.performanceId}`)
    try {
      if (Number.isInteger(goc.orderIndex)) {
        // Đường thường: gửi lại đúng số đang lưu, một lệnh, không đụng tới ai khác.
        await guiTietMuc(daSua, goc.orderIndex)
      } else {
        // Dữ liệu cũ không có orderIndex — chuẩn hoá cả danh sách về 0,1,2... giữ nguyên thứ tự
        // đang hiện, rồi từ lần sau lại về đường một lệnh.
        await ghiLaiThuTu(ds.map((p) => (p.performanceId === daSua.performanceId ? daSua : p)))
      }
      toast.success('Đã lưu tiết mục.')
      setSuaTietMuc(null)
      await load()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Không lưu được tiết mục.')
      await load()
    } finally { setBusy(null) }
  }

  const handleDoiThuTu = async (performanceId, huong) => {
    const ds = [...(show.performers ?? [])]
    const i = ds.findIndex((x) => x.performanceId === performanceId)
    const j = i + huong
    if (i < 0 || j < 0 || j >= ds.length) return

    setBusy(`perf-${performanceId}`)
    try {
      if (coDuThuTu(ds)) {
        // Đổi chỗ đúng hai số đang lưu của hai người — không đụng tới phần còn lại của danh sách.
        const a = ds[i]
        const b = ds[j]
        await guiTietMuc(a, b.orderIndex)
        await guiTietMuc(b, a.orderIndex)
      } else {
        ;[ds[i], ds[j]] = [ds[j], ds[i]]
        await ghiLaiThuTu(ds)
      }
      await load()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Không đổi được thứ tự.')
      // Ghi dở nửa đường thì thứ tự trên máy chủ đang lệch với màn hình.
      await load()
    } finally { setBusy(null) }
  }

  // Sửa hạng vé: chỉ tên / mô tả / sức chứa. Sức chứa để trống = không giới hạn (null), KHÔNG phải 0.
  const handleLuuHangVe = async () => {
    if (!suaHangVe) return
    if (!suaHangVe.name.trim()) { toast.error('Cần tên hạng vé.'); return }
    setBusy(`tier-${suaHangVe.id}`)
    try {
      await updateTier(suaHangVe.id, {
        name: suaHangVe.name.trim(),
        description: suaHangVe.description?.trim() || null,
        totalCapacity: suaHangVe.totalCapacity === '' || suaHangVe.totalCapacity == null
          ? null
          : Number(suaHangVe.totalCapacity),
      })
      toast.success('Đã lưu hạng vé.')
      setSuaHangVe(null)
      await load()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Không lưu được hạng vé.')
    } finally { setBusy(null) }
  }

  const handleCreateTier = async (e) => {
    e.preventDefault()
    const price = Number(tierForm.price)
    if (!tierForm.name.trim() || !price) { toast.error('Cần tên hạng vé và giá.'); return }
    if (!Number.isInteger(price)) { toast.error('Giá vé phải là số nguyên đồng.'); return }
    setBusy('tier')
    try {
      await createTier({
        showId: Number(id),
        name: tierForm.name.trim(),
        description: null,
        accessType: tierForm.accessType,
        zoneId: null,
        totalCapacity: tierForm.totalCapacity ? Number(tierForm.totalCapacity) : null,
        prices: [{
          name: tierForm.priceName.trim() || 'Vé thường',
          price,
          quota: tierForm.quota ? Number(tierForm.quota) : null,
          purchaseChannel: tierForm.purchaseChannel,
          saleStart: new Date().toISOString(),
          saleEnd: null, // bỏ trống = bán tới khi buổi diễn kết thúc (BR-31)
        }],
      })
      toast.success('Đã tạo hạng vé.')
      setShowTierForm(false)
      setTierForm({ name: '', accessType: 'Physical', totalCapacity: '', priceName: 'Vé thường', price: '', quota: '', purchaseChannel: 'Both' })
      await load()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Không tạo được hạng vé.', { duration: 6000 })
    } finally { setBusy(null) }
  }

  const handleDeleteTier = async (tierId) => {
    setBusy(`tier-${tierId}`)
    try {
      await deleteTier(tierId)
      toast.success('Đã xoá hạng vé.')
      await load()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Không xoá được.')
    } finally { setBusy(null) }
  }

  const handleSubmit = async () => {
    setBusy('submit')
    try {
      await submitShow(id)
      toast.success('Đã gửi duyệt. Chờ Admin xét duyệt.')
      await load()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Không gửi duyệt được.', { duration: 7000 })
    } finally { setBusy(null) }
  }

  if (isLoading) {
    return <div className="py-20 flex justify-center"><Loader2 size={32} className="animate-spin text-brand-text" /></div>
  }
  if (!show) {
    return <div className="text-ink-mute">Không tìm thấy buổi diễn.</div>
  }

  // operatorInfo CHỈ trả cho người vận hành phòng trà (chủ, nhân viên được phân công, Admin).
  // Endpoint chi tiết buổi diễn là công khai, nên khán giả nhận null — lý do bị từ chối và mã tác
  // quyền không được lộ ra ngoài. Vì vậy mọi chỗ đọc nó đều phải chịu được null.
  const vanHanh = show.operatorInfo ?? null
  const duyet = vanHanh?.moderation ?? null
  const daKhaiVanBan = !!vanHanh?.legalApprovalReference

  const isDraft = show.status === 'Draft'
  const hasTiers = tiers.length > 0
  const hasPerformers = (show.performers?.length || 0) > 0
  // Chỉ chặn theo 2 điều kiện ĐỌC ĐƯỢC. Hai điều kiện còn lại để backend trả lời (xem ghi chú đầu file).
  // Điều kiện FE kiểm được trước khi gửi. Số ngày nộp trước thì chỉ máy chủ biết, nên vẫn để máy
  // chủ trả lời — nhưng cái nào chặn sớm được thì đừng bắt người dùng đi một vòng mạng.
  //
  // CẨN THẬN VỚI `daKhaiVanBan`: nó suy ra từ operatorInfo. Nếu bản API đang chạy CHƯA trả khối đó
  // (hoặc người xem không phải người vận hành) thì nó luôn false, và nếu đưa thẳng vào điều kiện
  // này thì nút Gửi duyệt bị KHOÁ VĨNH VIỄN — làm tắc luồng, tệ hơn hẳn việc không kiểm được.
  // Nên chỉ tính nó khi thực sự đọc được khối operatorInfo; không đọc được thì để máy chủ từ chối
  // kèm lý do, y như trước đây.
  const readyToSubmit = hasTiers && hasPerformers && (!vanHanh || daKhaiVanBan)

  return (
    <div className="space-y-6">
      <Link to="/owner/shows" className="inline-flex items-center gap-2 text-ink-soft hover:text-ink text-sm">
        <ArrowLeft size={16} /> Danh sách buổi diễn
      </Link>

      <div>
        <h1 className="text-2xl font-bold text-ink mb-1">{show.name}</h1>
        <p className="text-ink-soft text-sm">
          {dayjs(show.scheduledStart).format('HH:mm DD/MM/YYYY')} · {show.lounge?.name} · Trạng thái: {show.status}
        </p>
      </div>

      {/* KẾT QUẢ KIỂM DUYỆT — KHỐI QUAN TRỌNG NHẤT TRANG NÀY KHI BỊ TỪ CHỐI.
          Buổi diễn bị từ chối sẽ QUAY VỀ trạng thái Draft, trông y hệt một bản nháp chưa từng gửi.
          Không hiện khối này thì chủ phòng trà không biết mình đã bị từ chối, không biết vì sao, và
          gửi lại đúng thứ vừa bị loại — vòng lặp đó chỉ dừng khi có người gọi điện hỏi.
          Backend làm riêng khối `moderation` đúng để chữa chuyện đó; trước đây FE không đọc nó. */}
      {duyet && (
        duyet.decision === 'Rejected' ? (
          <div className="bg-red-500/5 border border-red-500/40 rounded-xl p-5">
            <h2 className="text-base font-semibold text-danger flex items-center gap-2">
              <XCircle size={17} /> Admin đã từ chối buổi diễn này
            </h2>
            <p className="text-sm text-ink-soft mt-2 leading-relaxed">
              <span className="text-ink-mute">Lý do: </span>
              {duyet.reviewNote || 'Admin không ghi lý do. Hãy liên hệ Admin trước khi gửi lại.'}
            </p>
            <p className="text-xs text-ink-mute mt-2">
              Gửi duyệt {dayjs(duyet.submittedAt).format('HH:mm DD/MM/YYYY')}
              {duyet.reviewedAt && ` · từ chối ${dayjs(duyet.reviewedAt).format('HH:mm DD/MM/YYYY')}`}
            </p>
            <p className="text-xs text-danger/90 mt-3 leading-relaxed">
              Buổi diễn đã quay về trạng thái Nháp nên bạn sửa được. Sửa đúng chỗ bị nêu rồi bấm
              Gửi duyệt lại — gửi lại nguyên như cũ thì sẽ bị từ chối tiếp.
            </p>
          </div>
        ) : duyet.decision === 'Approved' ? (
          <div className="bg-green-500/5 border border-green-500/30 rounded-xl p-5">
            <h2 className="text-base font-semibold text-success flex items-center gap-2">
              <Check size={17} /> Admin đã duyệt
            </h2>
            <p className="text-xs text-ink-mute mt-1.5">
              Duyệt lúc {duyet.reviewedAt ? dayjs(duyet.reviewedAt).format('HH:mm DD/MM/YYYY') : '—'}
              {duyet.reviewNote && ` · ghi chú: ${duyet.reviewNote}`}
            </p>
          </div>
        ) : (
          <div className="bg-yellow-500/5 border border-yellow-500/30 rounded-xl p-5">
            <h2 className="text-base font-semibold text-warning flex items-center gap-2">
              <Clock size={17} /> Đang chờ Admin duyệt
            </h2>
            <p className="text-xs text-ink-mute mt-1.5">
              Gửi lúc {dayjs(duyet.submittedAt).format('HH:mm DD/MM/YYYY')}
              {duyet.slaDeadline && ` · hạn Admin phải xử lý: ${dayjs(duyet.slaDeadline).format('HH:mm DD/MM/YYYY')}`}
            </p>
            {duyet.slaDeadline && dayjs(duyet.slaDeadline).isBefore(dayjs()) && (
              <p className="text-xs text-warning mt-2">
                Đã quá hạn xử lý. Bạn có thể liên hệ Admin để hỏi.
              </p>
            )}
          </div>
        )
      )}

      {!isDraft && (
        <div className="bg-yellow-500/5 border border-yellow-500/20 rounded-xl p-4 text-sm text-warning">
          Buổi diễn không còn ở trạng thái Nháp nên không sửa được nữa. Trang này chỉ còn để xem.
        </div>
      )}

      {/* === CHECKLIST GỬI DUYỆT === */}
      <div className="bg-card border border-line rounded-xl p-6">
        <h2 className="text-lg font-semibold text-ink mb-4">Điều kiện gửi duyệt</h2>
        <div className="space-y-3">
          <ChecklistRow ok={hasTiers} label="Có ít nhất 1 hạng vé" hint="Thêm ở mục Hạng vé bên dưới" />
          <ChecklistRow ok={hasPerformers} label="Có ít nhất 1 nghệ sĩ trong line-up" hint="Thêm ở mục Line-up bên dưới" />
          {/* Kiểm được THẬT khi đọc được operatorInfo (backend trả số văn bản đã khai). Trước đây
              mục này luôn là dấu hỏi vì FE không đọc giá trị đó, nên người dùng không biết mình đã
              khai hay chưa cho tới lúc bấm gửi và bị từ chối.
              Không đọc được khối đó thì GIỮ dấu hỏi thay vì báo đỏ — báo đỏ khi mình không biết là
              nói sai với người dùng. */}
          {vanHanh ? (
            <ChecklistRow ok={daKhaiVanBan}
              label="Đã khai văn bản chấp thuận tổ chức biểu diễn"
              hint="Theo NĐ 144/2020 Điều 10. Khai ở mục Văn bản chấp thuận bên dưới" />
          ) : (
            <div className="flex items-start gap-2.5">
              <span className="mt-0.5 w-5 h-5 rounded-full bg-sunken text-ink-mute flex items-center justify-center flex-shrink-0 text-[10px]">?</span>
              <div>
                <p className="text-sm text-ink-soft">Đã khai văn bản chấp thuận tổ chức biểu diễn</p>
                <p className="text-xs text-ink-mute mt-0.5">
                  Theo NĐ 144/2020 Điều 10. Chưa đọc được trạng thái đã khai, nên mục này sẽ được
                  kiểm khi bấm gửi.
                </p>
              </div>
            </div>
          )}
          <div className="flex items-start gap-2.5">
            <span className="mt-0.5 w-5 h-5 rounded-full bg-sunken text-ink-mute flex items-center justify-center flex-shrink-0 text-[10px]">?</span>
            <p className="text-sm text-ink-mute">
              Nộp trước tối thiểu số ngày làm việc quy định — cũng được kiểm khi bấm gửi.
            </p>
          </div>
        </div>

        {isDraft && (
          <button onClick={handleSubmit} disabled={!readyToSubmit || !!busy}
            className="mt-5 flex items-center gap-2 px-4 py-2 rounded-lg bg-brand text-on-brand text-sm font-bold hover:bg-brand-hover disabled:opacity-40 disabled:cursor-not-allowed">
            <Send size={16} /> {busy === 'submit' ? 'Đang gửi...' : 'Gửi duyệt'}
          </button>
        )}
      </div>

      {/* === VĂN BẢN CHẤP THUẬN === */}
      <div className="bg-card border border-line rounded-xl p-6">
        <h2 className="text-lg font-semibold text-ink mb-1 flex items-center gap-2">
          <FileCheck size={18} className="text-brand-text" /> Văn bản chấp thuận biểu diễn
        </h2>
        <p className="text-ink-mute text-xs mb-4">
          Số văn bản hoặc liên kết tới văn bản chấp thuận của cơ quan quản lý. Khai lại sẽ ghi đè
          giá trị cũ.
        </p>

        {/* HIỆN LẠI GIÁ TRỊ ĐÃ KHAI. Trước đây màn này ghi "hệ thống chưa hiển thị lại được nội
            dung đã khai" — câu đó đúng vào lúc viết, nhưng backend đã trả về qua operatorInfo.
            Không đọc thì chủ phòng trà khai xong không còn chỗ nào xem lại để đối chiếu hay sửa. */}
        {daKhaiVanBan && (
          <div className="mb-4 p-3 rounded-lg bg-sunken/70 border border-line">
            <p className="text-xs text-ink-mute">Đã khai</p>
            <p className="text-sm text-ink mt-0.5 break-all">{vanHanh.legalApprovalReference}</p>
            <p className="text-xs mt-1.5">
              {vanHanh.legalApprovalConfirmedAt ? (
                <span className="text-success">
                  Admin đã xác nhận {dayjs(vanHanh.legalApprovalConfirmedAt).format('DD/MM/YYYY')}
                </span>
              ) : (
                <span className="text-ink-mute">Admin chưa xác nhận văn bản này.</span>
              )}
            </p>
          </div>
        )}

        {isDraft ? (
          <div className="flex gap-2">
            <input value={legalRef} onChange={(e) => setLegalRef(e.target.value)}
              placeholder={daKhaiVanBan ? 'Nhập số mới để thay giá trị đang khai' : 'VD: 1234/SVHTT-QLVH hoặc đường dẫn tới văn bản'}
              className="flex-1 px-3 py-2 bg-page border border-line rounded-lg text-sm text-ink placeholder:text-ink-mute" />
            <button onClick={handleSaveLegal} disabled={!legalRef.trim() || !!busy}
              className="px-4 py-2 rounded-lg border border-line text-ink-soft text-sm font-bold hover:bg-sunken disabled:opacity-50">
              {daKhaiVanBan ? 'Thay' : 'Lưu'}
            </button>
          </div>
        ) : !daKhaiVanBan && <p className="text-ink-mute text-sm">Chưa khai báo.</p>}
      </div>

      {/* === LINE-UP === */}
      <div className="bg-card border border-line rounded-xl p-6">
        <h2 className="text-lg font-semibold text-ink mb-4 flex items-center gap-2">
          <Users size={18} className="text-brand-text" /> Line-up nghệ sĩ
        </h2>

        {show.performers?.length > 0 ? (
          <div className="space-y-2 mb-4">
            {show.performers.map((p, i, arr) => (
              <div key={p.performanceId} className="border border-line rounded-lg px-4 py-3">
                <div className="flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-ink text-sm font-medium">
                      <span className="text-ink-mute mr-1.5 tabular-nums">{i + 1}.</span>{p.name}
                    </p>
                    <p className="text-ink-mute text-xs">
                      {ROLES.find((r) => r.value === p.role)?.label || p.role}
                      {p.setTime && ` · ${String(p.setTime).slice(0, 5)}`}
                      {p.acceptsDonation && ' · nhận donate'}
                    </p>
                  </div>
                  {isDraft && (
                    <div className="flex items-center gap-1 flex-shrink-0">
                      <button onClick={() => handleDoiThuTu(p.performanceId, -1)} disabled={!!busy || i === 0}
                        title="Diễn sớm hơn"
                        className="p-1.5 rounded-lg text-ink-mute hover:text-ink disabled:opacity-30">
                        <ArrowUp size={14} />
                      </button>
                      <button onClick={() => handleDoiThuTu(p.performanceId, 1)} disabled={!!busy || i === arr.length - 1}
                        title="Diễn muộn hơn"
                        className="p-1.5 rounded-lg text-ink-mute hover:text-ink disabled:opacity-30">
                        <ArrowDown size={14} />
                      </button>
                      <button
                        onClick={() => setSuaTietMuc({
                          performanceId: p.performanceId,
                          role: p.role,
                          // TimeOnly về dạng "HH:mm:ss" — ô input type=time chỉ nhận "HH:mm".
                          setTime: p.setTime ? String(p.setTime).slice(0, 5) : '',
                          acceptsDonation: !!p.acceptsDonation,
                        })}
                        disabled={!!busy} title="Sửa tiết mục"
                        className="p-1.5 rounded-lg text-ink-mute hover:text-brand-text disabled:opacity-50">
                        <Pencil size={14} />
                      </button>
                      <button onClick={() => handleRemovePerformer(p.performanceId)} disabled={!!busy}
                        title="Gỡ khỏi line-up"
                        className="p-1.5 rounded-lg text-ink-mute hover:text-danger disabled:opacity-50">
                        <Trash2 size={14} />
                      </button>
                    </div>
                  )}
                </div>

                {/* FORM SỬA TIẾT MỤC — không đổi được người diễn, muốn đổi thì gỡ rồi thêm lại */}
                {suaTietMuc?.performanceId === p.performanceId && (
                  <div className="mt-3 pt-3 border-t border-line grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="text-xs text-ink-mute">Vai trò</label>
                      <select value={suaTietMuc.role}
                        onChange={(e) => setSuaTietMuc((v) => ({ ...v, role: e.target.value }))}
                        className="mt-1 w-full px-3 py-2 bg-page border border-line rounded-lg text-sm text-ink">
                        {ROLES.map((r) => <option key={r.value} value={r.value}>{r.label}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="text-xs text-ink-mute">Giờ diễn</label>
                      <input type="time" value={suaTietMuc.setTime}
                        onChange={(e) => setSuaTietMuc((v) => ({ ...v, setTime: e.target.value }))}
                        className="mt-1 w-full px-3 py-2 bg-page border border-line rounded-lg text-sm text-ink" />
                      <p className="text-[11px] text-ink-mute mt-1">Để trống nếu chưa chốt giờ.</p>
                    </div>
                    <div className="flex flex-col justify-between">
                      <label className="flex items-center gap-2 text-sm text-ink-soft mt-1">
                        <input type="checkbox" checked={suaTietMuc.acceptsDonation}
                          onChange={(e) => setSuaTietMuc((v) => ({ ...v, acceptsDonation: e.target.checked }))}
                          className="accent-brand" />
                        Nhận donate
                      </label>
                      <div className="flex gap-2 mt-2">
                        <button onClick={handleLuuTietMuc} disabled={!!busy}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-brand text-on-brand text-xs font-bold disabled:opacity-50">
                          {busy === `perf-${p.performanceId}` ? <Loader2 size={13} className="animate-spin" /> : <Save size={13} />} Lưu
                        </button>
                        <button onClick={() => setSuaTietMuc(null)} disabled={!!busy}
                          className="px-3 py-1.5 rounded-lg border border-line text-ink-soft text-xs font-bold hover:bg-sunken">
                          Huỷ
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : <p className="text-ink-mute text-sm mb-4">Chưa có nghệ sĩ nào.</p>}

        {isDraft && (
          <div className="relative">
            <input value={performerQuery} onChange={(e) => handleSearchPerformer(e.target.value)}
              placeholder="Gõ tên nghệ sĩ để tìm (từ 2 ký tự)"
              className="w-full px-3 py-2 bg-page border border-line rounded-lg text-sm text-ink placeholder:text-ink-mute" />
            {performerResults.length > 0 && (
              <div className="absolute left-0 right-0 mt-1 bg-card border border-line rounded-lg shadow-lift z-10 overflow-hidden">
                {performerResults.map((p) => (
                  <button key={p.id} onClick={() => handleAddPerformer(p)} disabled={!!busy}
                    className="w-full text-left px-4 py-2.5 text-sm text-ink-soft hover:bg-sunken disabled:opacity-50">
                    {p.name}
                    {p.genreNames?.length > 0 && <span className="text-ink-mute text-xs"> · {p.genreNames.join(', ')}</span>}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* === HẠNG VÉ === */}
      <div className="bg-card border border-line rounded-xl p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-ink flex items-center gap-2">
            <Ticket size={18} className="text-brand-text" /> Hạng vé
          </h2>
          {isDraft && !showTierForm && (
            <button onClick={() => setShowTierForm(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-line text-ink-soft text-xs font-bold hover:bg-sunken">
              <Plus size={14} /> Thêm hạng vé
            </button>
          )}
        </div>

        {tiers.length > 0 ? (
          <div className="space-y-2 mb-4">
            {tiers.map((t) => (
              <div key={t.id} className="border border-line rounded-lg px-4 py-3">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-ink text-sm font-medium">
                      {t.name}
                      <span className="ml-2 px-2 py-0.5 rounded-md bg-sunken text-ink-soft text-xs">
                        {t.accessType === 'Livestream' ? 'Trực tuyến' : 'Tại chỗ'}
                      </span>
                    </p>
                    <div className="mt-1.5 space-y-0.5">
                      {t.prices?.map((pr) => (
                        <p key={pr.id} className="text-xs text-ink-soft">
                          {pr.name}: <span className="text-brand-text font-medium">{fmtMoney(pr.price)}</span>
                          {pr.quota != null && ` · ${pr.availableSlots}/${pr.quota} còn lại`}
                          {` · ${pr.purchaseChannel === 'Both' ? 'online + tại quầy' : pr.purchaseChannel === 'Online' ? 'chỉ online' : 'chỉ tại quầy'}`}
                        </p>
                      ))}
                    </div>
                  </div>
                  {isDraft && (
                    <div className="flex items-center gap-1 flex-shrink-0">
                      <button
                        onClick={() => setSuaHangVe({
                          id: t.id,
                          name: t.name,
                          description: t.description ?? '',
                          totalCapacity: t.totalCapacity ?? '',
                        })}
                        disabled={!!busy} title="Sửa hạng vé"
                        className="p-1.5 rounded-lg text-ink-mute hover:text-brand-text disabled:opacity-50">
                        <Pencil size={14} />
                      </button>
                      <button onClick={() => handleDeleteTier(t.id)} disabled={!!busy}
                        title="Xoá hạng vé"
                        className="p-1.5 rounded-lg text-ink-mute hover:text-danger disabled:opacity-50">
                        <Trash2 size={14} />
                      </button>
                    </div>
                  )}
                </div>

                {/* FORM SỬA HẠNG VÉ — GIÁ KHÔNG NẰM Ở ĐÂY, giá thuộc đợt giá riêng */}
                {suaHangVe?.id === t.id && (
                  <div className="mt-3 pt-3 border-t border-line space-y-3">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="text-xs text-ink-mute">Tên hạng vé *</label>
                        <input value={suaHangVe.name}
                          onChange={(e) => setSuaHangVe((v) => ({ ...v, name: e.target.value }))}
                          className="mt-1 w-full px-3 py-2 bg-page border border-line rounded-lg text-sm text-ink" />
                      </div>
                      <div>
                        <label className="text-xs text-ink-mute">Sức chứa</label>
                        <input type="number" min="1" value={suaHangVe.totalCapacity}
                          onChange={(e) => setSuaHangVe((v) => ({ ...v, totalCapacity: e.target.value }))}
                          className="mt-1 w-full px-3 py-2 bg-page border border-line rounded-lg text-sm text-ink" />
                        <p className="text-[11px] text-ink-mute mt-1">Để trống = không giới hạn.</p>
                      </div>
                    </div>
                    <div>
                      <label className="text-xs text-ink-mute">Mô tả</label>
                      <input value={suaHangVe.description}
                        onChange={(e) => setSuaHangVe((v) => ({ ...v, description: e.target.value }))}
                        placeholder="VD: Ghế sát sân khấu, có nước uống"
                        className="mt-1 w-full px-3 py-2 bg-page border border-line rounded-lg text-sm text-ink" />
                    </div>
                    <p className="text-[11px] text-ink-mute">
                      Giá vé không sửa ở đây — giá thuộc đợt giá riêng của hạng vé.
                    </p>
                    <div className="flex gap-2">
                      <button onClick={handleLuuHangVe} disabled={!!busy}
                        className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-brand text-on-brand text-sm font-bold disabled:opacity-50">
                        {busy === `tier-${t.id}` ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />} Lưu
                      </button>
                      <button onClick={() => setSuaHangVe(null)} disabled={!!busy}
                        className="px-4 py-2 rounded-lg border border-line text-ink-soft text-sm font-bold hover:bg-sunken">
                        Huỷ
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : <p className="text-ink-mute text-sm mb-4">Chưa có hạng vé nào.</p>}

        {showTierForm && isDraft && (
          <form onSubmit={handleCreateTier} className="border-t border-line pt-4 space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-ink-mute">Tên hạng vé *</label>
                <input value={tierForm.name} onChange={(e) => setTierForm((p) => ({ ...p, name: e.target.value }))}
                  placeholder="VD: Ghế thường"
                  className="mt-1 w-full px-3 py-2 bg-page border border-line rounded-lg text-sm text-ink" />
              </div>
              <div>
                <label className="text-xs text-ink-mute">Loại</label>
                <select value={tierForm.accessType} onChange={(e) => setTierForm((p) => ({ ...p, accessType: e.target.value }))}
                  className="mt-1 w-full px-3 py-2 bg-page border border-line rounded-lg text-sm text-ink">
                  <option value="Physical">Vào xem tại chỗ</option>
                  <option value="Livestream">Xem trực tuyến</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="text-xs text-ink-mute">Giá (đồng) *</label>
                <input type="number" min="1" step="1" value={tierForm.price}
                  onChange={(e) => setTierForm((p) => ({ ...p, price: e.target.value }))}
                  className="mt-1 w-full px-3 py-2 bg-page border border-line rounded-lg text-sm text-ink" />
              </div>
              <div>
                <label className="text-xs text-ink-mute">Số lượng</label>
                <input type="number" min="1" value={tierForm.quota}
                  onChange={(e) => setTierForm((p) => ({ ...p, quota: e.target.value }))}
                  className="mt-1 w-full px-3 py-2 bg-page border border-line rounded-lg text-sm text-ink" />
              </div>
              <div>
                <label className="text-xs text-ink-mute">Kênh bán</label>
                <select value={tierForm.purchaseChannel} onChange={(e) => setTierForm((p) => ({ ...p, purchaseChannel: e.target.value }))}
                  className="mt-1 w-full px-3 py-2 bg-page border border-line rounded-lg text-sm text-ink">
                  <option value="Both">Online + tại quầy</option>
                  <option value="Online">Chỉ online</option>
                  <option value="Offline">Chỉ tại quầy</option>
                </select>
              </div>
            </div>

            <p className="text-[11px] text-ink-mute">
              Vé mở bán ngay và bán tới khi buổi diễn kết thúc. Giá phải là số nguyên đồng.
            </p>

            <div className="flex gap-2">
              <button type="submit" disabled={!!busy}
                className="px-4 py-2 rounded-lg bg-brand text-on-brand text-sm font-bold hover:bg-brand-hover disabled:opacity-50">
                {busy === 'tier' ? 'Đang tạo...' : 'Tạo hạng vé'}
              </button>
              <button type="button" onClick={() => setShowTierForm(false)}
                className="px-4 py-2 rounded-lg border border-line text-ink-soft text-sm font-bold hover:bg-sunken">
                Huỷ
              </button>
            </div>
          </form>
        )}
      </div>

      {/* THỐNG KÊ — chỉ có ý nghĩa khi buổi diễn đã rời trạng thái Nháp (chưa duyệt thì chưa ai
          xem, chưa ai mua, và dự báo không có gì để dựa vào). */}
      {!isDraft && <ShowAnalyticsSection showId={id} />}
    </div>
  )
}

export default OwnerShowDetailPage
