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
import { useState, useEffect, useCallback } from 'react'
import { useParams, Link } from 'react-router-dom'
import {
  ArrowLeft, Loader2, Plus, Trash2, Check, X, Send, Ticket, Users, FileCheck,
} from 'lucide-react'
import dayjs from 'dayjs'
import toast from 'react-hot-toast'
import {
  getShowDetail, submitShow, setLegalApproval, addPerformance, deletePerformance,
} from '../../services/showServices'
import { getTiers, createTier, deleteTier } from '../../services/ticketTierServices'
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
            {show.performers.map((p) => (
              <div key={p.performanceId} className="flex items-center justify-between border border-gray-800 rounded-lg px-4 py-3">
                <div>
                  <p className="text-white text-sm font-medium">{p.name}</p>
                  <p className="text-gray-500 text-xs">
                    {ROLES.find((r) => r.value === p.role)?.label || p.role}
                    {p.acceptsDonation && ' · nhận donate'}
                  </p>
                </div>
                {isDraft && (
                  <button onClick={() => handleRemovePerformer(p.performanceId)} disabled={!!busy}
                    className="p-1.5 rounded-lg text-gray-500 hover:text-red-400 disabled:opacity-50">
                    <Trash2 size={14} />
                  </button>
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
                    <button onClick={() => handleDeleteTier(t.id)} disabled={!!busy}
                      className="p-1.5 rounded-lg text-gray-500 hover:text-red-400 disabled:opacity-50 flex-shrink-0">
                      <Trash2 size={14} />
                    </button>
                  )}
                </div>
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
    </div>
  )
}

export default OwnerShowDetailPage
