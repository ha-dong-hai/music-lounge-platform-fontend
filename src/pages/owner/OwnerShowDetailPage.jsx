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
//   toàn bộ. Nhưng PerformerSummaryDto KHÔNG trả orderIndex, nên FE không biết thứ tự hiện tại là
//   số mấy. Cách xử lý: danh sách backend trả về ĐÃ được sắp theo orderIndex (xem
//   LoungeShowMappingExtensions), nên dùng vị trí trong mảng làm orderIndex. Ghi lại thứ tự thành
//   0,1,2... có thể khác số cũ (0,5,10) nhưng giữ đúng THỨ TỰ — và thứ tự là thứ duy nhất được dùng.
// - Đổi sang nghệ sĩ khác thì phải xoá rồi thêm lại; PUT không đổi được người.
// - SỬA HẠNG VÉ chỉ đổi được tên / mô tả / sức chứa. GIÁ KHÔNG SỬA Ở ĐÂY — giá thuộc đợt giá riêng.
import { useState, useEffect, useCallback } from 'react'
import { useParams, Link } from 'react-router-dom'
import {
  ArrowLeft, Loader2, Plus, Trash2, Check, X, Send, Ticket, Users, FileCheck,
  Pencil, ArrowUp, ArrowDown, Save,
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
    <span className={`mt-0.5 w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 ${ok ? 'bg-green-500/15 text-green-400' : 'bg-gray-800 text-gray-600'}`}>
      {ok ? <Check size={13} /> : <X size={13} />}
    </span>
    <div>
      <p className={`text-sm ${ok ? 'text-gray-300' : 'text-white font-medium'}`}>{label}</p>
      {!ok && hint && <p className="text-xs text-gray-500 mt-0.5">{hint}</p>}
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

  // Lưu một tiết mục đã sửa. orderIndex = vị trí hiện tại trong mảng (xem ghi chú đầu tệp).
  // setTime là TimeOnly ở backend: gửi "HH:mm" hoặc null, KHÔNG gửi chuỗi rỗng.
  const handleLuuTietMuc = async () => {
    if (!suaTietMuc) return
    const viTri = show.performers.findIndex((x) => x.performanceId === suaTietMuc.performanceId)
    setBusy(`perf-${suaTietMuc.performanceId}`)
    try {
      await updatePerformance(id, suaTietMuc.performanceId, {
        role: suaTietMuc.role,
        orderIndex: viTri < 0 ? 0 : viTri,
        setTime: suaTietMuc.setTime ? suaTietMuc.setTime : null,
        acceptsDonation: suaTietMuc.acceptsDonation,
      })
      toast.success('Đã lưu tiết mục.')
      setSuaTietMuc(null)
      await load()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Không lưu được tiết mục.')
    } finally { setBusy(null) }
  }

  // Đổi thứ tự bằng cách gửi lại orderIndex mới cho HAI tiết mục đổi chỗ. Backend không có lệnh
  // "đổi chỗ", nên phải tự tính. Làm tuần tự chứ không song song: hai PUT cùng lúc lên cùng một
  // buổi diễn dễ dẫn tới thứ tự cuối cùng phụ thuộc vào cái nào về trước.
  const handleDoiThuTu = async (performanceId, huong) => {
    const ds = show.performers ?? []
    const i = ds.findIndex((x) => x.performanceId === performanceId)
    const j = i + huong
    if (i < 0 || j < 0 || j >= ds.length) return
    setBusy(`perf-${performanceId}`)
    try {
      const a = ds[i]
      const b = ds[j]
      const goi = (p, idx) => updatePerformance(id, p.performanceId, {
        role: p.role,
        orderIndex: idx,
        setTime: p.setTime ?? null,
        acceptsDonation: p.acceptsDonation,
      })
      await goi(a, j)
      await goi(b, i)
      await load()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Không đổi được thứ tự.')
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
    return <div className="py-20 flex justify-center"><Loader2 size={32} className="animate-spin text-[#C3B665]" /></div>
  }
  if (!show) {
    return <div className="text-gray-500">Không tìm thấy buổi diễn.</div>
  }

  const isDraft = show.status === 'Draft'
  const hasTiers = tiers.length > 0
  const hasPerformers = (show.performers?.length || 0) > 0
  // Chỉ chặn theo 2 điều kiện ĐỌC ĐƯỢC. Hai điều kiện còn lại để backend trả lời (xem ghi chú đầu file).
  const readyToSubmit = hasTiers && hasPerformers

  return (
    <div className="space-y-6">
      <Link to="/owner/shows" className="inline-flex items-center gap-2 text-gray-400 hover:text-white text-sm">
        <ArrowLeft size={16} /> Danh sách buổi diễn
      </Link>

      <div>
        <h1 className="text-2xl font-bold text-white mb-1">{show.name}</h1>
        <p className="text-gray-400 text-sm">
          {dayjs(show.scheduledStart).format('HH:mm DD/MM/YYYY')} · {show.lounge?.name} · Trạng thái: {show.status}
        </p>
      </div>

      {!isDraft && (
        <div className="bg-yellow-500/5 border border-yellow-500/20 rounded-xl p-4 text-sm text-yellow-400">
          Buổi diễn không còn ở trạng thái Nháp nên không sửa được nữa. Trang này chỉ còn để xem.
        </div>
      )}

      {/* === CHECKLIST GỬI DUYỆT === */}
      <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
        <h2 className="text-lg font-semibold text-white mb-4">Điều kiện gửi duyệt</h2>
        <div className="space-y-3">
          <ChecklistRow ok={hasTiers} label="Có ít nhất 1 hạng vé" hint="Thêm ở mục Hạng vé bên dưới" />
          <ChecklistRow ok={hasPerformers} label="Có ít nhất 1 nghệ sĩ trong line-up" hint="Thêm ở mục Line-up bên dưới" />
          <div className="flex items-start gap-2.5">
            <span className="mt-0.5 w-5 h-5 rounded-full bg-gray-800 text-gray-600 flex items-center justify-center flex-shrink-0 text-[10px]">?</span>
            <div>
              <p className="text-sm text-gray-300">Đã khai văn bản chấp thuận tổ chức biểu diễn</p>
              <p className="text-xs text-gray-500 mt-0.5">
                Theo NĐ 144/2020 Điều 10. Hệ thống chưa cho đọc lại nội dung đã khai, nên mục này sẽ
                được kiểm khi bấm gửi.
              </p>
            </div>
          </div>
          <div className="flex items-start gap-2.5">
            <span className="mt-0.5 w-5 h-5 rounded-full bg-gray-800 text-gray-600 flex items-center justify-center flex-shrink-0 text-[10px]">?</span>
            <p className="text-sm text-gray-500">
              Nộp trước tối thiểu số ngày làm việc quy định — cũng được kiểm khi bấm gửi.
            </p>
          </div>
        </div>

        {isDraft && (
          <button onClick={handleSubmit} disabled={!readyToSubmit || !!busy}
            className="mt-5 flex items-center gap-2 px-4 py-2 rounded-lg bg-[#C3B665] text-black text-sm font-bold hover:bg-[#d4c87f] disabled:opacity-40 disabled:cursor-not-allowed">
            <Send size={16} /> {busy === 'submit' ? 'Đang gửi...' : 'Gửi duyệt'}
          </button>
        )}
      </div>

      {/* === VĂN BẢN CHẤP THUẬN === */}
      <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
        <h2 className="text-lg font-semibold text-white mb-1 flex items-center gap-2">
          <FileCheck size={18} className="text-[#C3B665]" /> Văn bản chấp thuận biểu diễn
        </h2>
        <p className="text-gray-500 text-xs mb-4">
          Số văn bản hoặc liên kết tới văn bản chấp thuận của cơ quan quản lý.
          Lưu xong hệ thống chưa hiển thị lại được nội dung đã khai — khai lại sẽ ghi đè giá trị cũ.
        </p>
        {isDraft ? (
          <div className="flex gap-2">
            <input value={legalRef} onChange={(e) => setLegalRef(e.target.value)}
              placeholder="VD: 1234/SVHTT-QLVH hoặc đường dẫn tới văn bản"
              className="flex-1 px-3 py-2 bg-black border border-gray-700 rounded-lg text-sm text-white placeholder:text-gray-600" />
            <button onClick={handleSaveLegal} disabled={!legalRef.trim() || !!busy}
              className="px-4 py-2 rounded-lg border border-gray-700 text-gray-300 text-sm font-bold hover:bg-gray-800 disabled:opacity-50">
              Lưu
            </button>
          </div>
        ) : <p className="text-gray-500 text-sm">Chưa khai báo.</p>}
      </div>

      {/* === LINE-UP === */}
      <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
        <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
          <Users size={18} className="text-[#C3B665]" /> Line-up nghệ sĩ
        </h2>

        {show.performers?.length > 0 ? (
          <div className="space-y-2 mb-4">
            {show.performers.map((p, i, arr) => (
              <div key={p.performanceId} className="border border-gray-800 rounded-lg px-4 py-3">
                <div className="flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-white text-sm font-medium">
                      <span className="text-gray-600 mr-1.5 tabular-nums">{i + 1}.</span>{p.name}
                    </p>
                    <p className="text-gray-500 text-xs">
                      {ROLES.find((r) => r.value === p.role)?.label || p.role}
                      {p.setTime && ` · ${String(p.setTime).slice(0, 5)}`}
                      {p.acceptsDonation && ' · nhận donate'}
                    </p>
                  </div>
                  {isDraft && (
                    <div className="flex items-center gap-1 flex-shrink-0">
                      <button onClick={() => handleDoiThuTu(p.performanceId, -1)} disabled={!!busy || i === 0}
                        title="Diễn sớm hơn"
                        className="p-1.5 rounded-lg text-gray-500 hover:text-white disabled:opacity-30">
                        <ArrowUp size={14} />
                      </button>
                      <button onClick={() => handleDoiThuTu(p.performanceId, 1)} disabled={!!busy || i === arr.length - 1}
                        title="Diễn muộn hơn"
                        className="p-1.5 rounded-lg text-gray-500 hover:text-white disabled:opacity-30">
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
                        className="p-1.5 rounded-lg text-gray-500 hover:text-[#C3B665] disabled:opacity-50">
                        <Pencil size={14} />
                      </button>
                      <button onClick={() => handleRemovePerformer(p.performanceId)} disabled={!!busy}
                        title="Gỡ khỏi line-up"
                        className="p-1.5 rounded-lg text-gray-500 hover:text-red-400 disabled:opacity-50">
                        <Trash2 size={14} />
                      </button>
                    </div>
                  )}
                </div>

                {/* FORM SỬA TIẾT MỤC — không đổi được người diễn, muốn đổi thì gỡ rồi thêm lại */}
                {suaTietMuc?.performanceId === p.performanceId && (
                  <div className="mt-3 pt-3 border-t border-gray-800 grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="text-xs text-gray-500">Vai trò</label>
                      <select value={suaTietMuc.role}
                        onChange={(e) => setSuaTietMuc((v) => ({ ...v, role: e.target.value }))}
                        className="mt-1 w-full px-3 py-2 bg-black border border-gray-700 rounded-lg text-sm text-white">
                        {ROLES.map((r) => <option key={r.value} value={r.value}>{r.label}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="text-xs text-gray-500">Giờ diễn</label>
                      <input type="time" value={suaTietMuc.setTime}
                        onChange={(e) => setSuaTietMuc((v) => ({ ...v, setTime: e.target.value }))}
                        className="mt-1 w-full px-3 py-2 bg-black border border-gray-700 rounded-lg text-sm text-white" />
                      <p className="text-[11px] text-gray-600 mt-1">Để trống nếu chưa chốt giờ.</p>
                    </div>
                    <div className="flex flex-col justify-between">
                      <label className="flex items-center gap-2 text-sm text-gray-300 mt-1">
                        <input type="checkbox" checked={suaTietMuc.acceptsDonation}
                          onChange={(e) => setSuaTietMuc((v) => ({ ...v, acceptsDonation: e.target.checked }))}
                          className="accent-[#C3B665]" />
                        Nhận donate
                      </label>
                      <div className="flex gap-2 mt-2">
                        <button onClick={handleLuuTietMuc} disabled={!!busy}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#C3B665] text-black text-xs font-bold disabled:opacity-50">
                          {busy === `perf-${p.performanceId}` ? <Loader2 size={13} className="animate-spin" /> : <Save size={13} />} Lưu
                        </button>
                        <button onClick={() => setSuaTietMuc(null)} disabled={!!busy}
                          className="px-3 py-1.5 rounded-lg border border-gray-700 text-gray-300 text-xs font-bold hover:bg-gray-800">
                          Huỷ
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : <p className="text-gray-500 text-sm mb-4">Chưa có nghệ sĩ nào.</p>}

        {isDraft && (
          <div className="relative">
            <input value={performerQuery} onChange={(e) => handleSearchPerformer(e.target.value)}
              placeholder="Gõ tên nghệ sĩ để tìm (từ 2 ký tự)"
              className="w-full px-3 py-2 bg-black border border-gray-700 rounded-lg text-sm text-white placeholder:text-gray-600" />
            {performerResults.length > 0 && (
              <div className="absolute left-0 right-0 mt-1 bg-[#1a1a1a] border border-gray-700 rounded-lg z-10 overflow-hidden">
                {performerResults.map((p) => (
                  <button key={p.id} onClick={() => handleAddPerformer(p)} disabled={!!busy}
                    className="w-full text-left px-4 py-2.5 text-sm text-gray-300 hover:bg-gray-800 disabled:opacity-50">
                    {p.name}
                    {p.genreNames?.length > 0 && <span className="text-gray-600 text-xs"> · {p.genreNames.join(', ')}</span>}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* === HẠNG VÉ === */}
      <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-white flex items-center gap-2">
            <Ticket size={18} className="text-[#C3B665]" /> Hạng vé
          </h2>
          {isDraft && !showTierForm && (
            <button onClick={() => setShowTierForm(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-gray-700 text-gray-300 text-xs font-bold hover:bg-gray-800">
              <Plus size={14} /> Thêm hạng vé
            </button>
          )}
        </div>

        {tiers.length > 0 ? (
          <div className="space-y-2 mb-4">
            {tiers.map((t) => (
              <div key={t.id} className="border border-gray-800 rounded-lg px-4 py-3">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-white text-sm font-medium">
                      {t.name}
                      <span className="ml-2 px-2 py-0.5 rounded-md bg-gray-800 text-gray-400 text-xs">
                        {t.accessType === 'Livestream' ? 'Trực tuyến' : 'Tại chỗ'}
                      </span>
                    </p>
                    <div className="mt-1.5 space-y-0.5">
                      {t.prices?.map((pr) => (
                        <p key={pr.id} className="text-xs text-gray-400">
                          {pr.name}: <span className="text-[#C3B665] font-medium">{fmtMoney(pr.price)}</span>
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
                        className="p-1.5 rounded-lg text-gray-500 hover:text-[#C3B665] disabled:opacity-50">
                        <Pencil size={14} />
                      </button>
                      <button onClick={() => handleDeleteTier(t.id)} disabled={!!busy}
                        title="Xoá hạng vé"
                        className="p-1.5 rounded-lg text-gray-500 hover:text-red-400 disabled:opacity-50">
                        <Trash2 size={14} />
                      </button>
                    </div>
                  )}
                </div>

                {/* FORM SỬA HẠNG VÉ — GIÁ KHÔNG NẰM Ở ĐÂY, giá thuộc đợt giá riêng */}
                {suaHangVe?.id === t.id && (
                  <div className="mt-3 pt-3 border-t border-gray-800 space-y-3">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="text-xs text-gray-500">Tên hạng vé *</label>
                        <input value={suaHangVe.name}
                          onChange={(e) => setSuaHangVe((v) => ({ ...v, name: e.target.value }))}
                          className="mt-1 w-full px-3 py-2 bg-black border border-gray-700 rounded-lg text-sm text-white" />
                      </div>
                      <div>
                        <label className="text-xs text-gray-500">Sức chứa</label>
                        <input type="number" min="1" value={suaHangVe.totalCapacity}
                          onChange={(e) => setSuaHangVe((v) => ({ ...v, totalCapacity: e.target.value }))}
                          className="mt-1 w-full px-3 py-2 bg-black border border-gray-700 rounded-lg text-sm text-white" />
                        <p className="text-[11px] text-gray-600 mt-1">Để trống = không giới hạn.</p>
                      </div>
                    </div>
                    <div>
                      <label className="text-xs text-gray-500">Mô tả</label>
                      <input value={suaHangVe.description}
                        onChange={(e) => setSuaHangVe((v) => ({ ...v, description: e.target.value }))}
                        placeholder="VD: Ghế sát sân khấu, có nước uống"
                        className="mt-1 w-full px-3 py-2 bg-black border border-gray-700 rounded-lg text-sm text-white" />
                    </div>
                    <p className="text-[11px] text-gray-600">
                      Giá vé không sửa ở đây — giá thuộc đợt giá riêng của hạng vé.
                    </p>
                    <div className="flex gap-2">
                      <button onClick={handleLuuHangVe} disabled={!!busy}
                        className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-[#C3B665] text-black text-sm font-bold disabled:opacity-50">
                        {busy === `tier-${t.id}` ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />} Lưu
                      </button>
                      <button onClick={() => setSuaHangVe(null)} disabled={!!busy}
                        className="px-4 py-2 rounded-lg border border-gray-700 text-gray-300 text-sm font-bold hover:bg-gray-800">
                        Huỷ
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : <p className="text-gray-500 text-sm mb-4">Chưa có hạng vé nào.</p>}

        {showTierForm && isDraft && (
          <form onSubmit={handleCreateTier} className="border-t border-gray-800 pt-4 space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-gray-500">Tên hạng vé *</label>
                <input value={tierForm.name} onChange={(e) => setTierForm((p) => ({ ...p, name: e.target.value }))}
                  placeholder="VD: Ghế thường"
                  className="mt-1 w-full px-3 py-2 bg-black border border-gray-700 rounded-lg text-sm text-white" />
              </div>
              <div>
                <label className="text-xs text-gray-500">Loại</label>
                <select value={tierForm.accessType} onChange={(e) => setTierForm((p) => ({ ...p, accessType: e.target.value }))}
                  className="mt-1 w-full px-3 py-2 bg-black border border-gray-700 rounded-lg text-sm text-white">
                  <option value="Physical">Vào xem tại chỗ</option>
                  <option value="Livestream">Xem trực tuyến</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="text-xs text-gray-500">Giá (đồng) *</label>
                <input type="number" min="1" step="1" value={tierForm.price}
                  onChange={(e) => setTierForm((p) => ({ ...p, price: e.target.value }))}
                  className="mt-1 w-full px-3 py-2 bg-black border border-gray-700 rounded-lg text-sm text-white" />
              </div>
              <div>
                <label className="text-xs text-gray-500">Số lượng</label>
                <input type="number" min="1" value={tierForm.quota}
                  onChange={(e) => setTierForm((p) => ({ ...p, quota: e.target.value }))}
                  className="mt-1 w-full px-3 py-2 bg-black border border-gray-700 rounded-lg text-sm text-white" />
              </div>
              <div>
                <label className="text-xs text-gray-500">Kênh bán</label>
                <select value={tierForm.purchaseChannel} onChange={(e) => setTierForm((p) => ({ ...p, purchaseChannel: e.target.value }))}
                  className="mt-1 w-full px-3 py-2 bg-black border border-gray-700 rounded-lg text-sm text-white">
                  <option value="Both">Online + tại quầy</option>
                  <option value="Online">Chỉ online</option>
                  <option value="Offline">Chỉ tại quầy</option>
                </select>
              </div>
            </div>

            <p className="text-[11px] text-gray-600">
              Vé mở bán ngay và bán tới khi buổi diễn kết thúc. Giá phải là số nguyên đồng.
            </p>

            <div className="flex gap-2">
              <button type="submit" disabled={!!busy}
                className="px-4 py-2 rounded-lg bg-[#C3B665] text-black text-sm font-bold hover:bg-[#d4c87f] disabled:opacity-50">
                {busy === 'tier' ? 'Đang tạo...' : 'Tạo hạng vé'}
              </button>
              <button type="button" onClick={() => setShowTierForm(false)}
                className="px-4 py-2 rounded-lg border border-gray-700 text-gray-300 text-sm font-bold hover:bg-gray-800">
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
