// src/pages/admin/AdminPenaltyAppealsPage.jsx
//
// GHI CHÚ CHO ĐỘI FE:
// - Đây là phía ĐỐI XỨNG của màn Án phạt bên chủ phòng trà: chủ gửi khiếu nại ở /owner/penalties,
//   Admin xử lý ở đây. Backend trả CÙNG VenuePenaltyDto cho cả hai bên, nên cách hiển thị án phạt
//   giữ giống nhau có chủ đích — người dùng hai bên nói chuyện về cùng một thứ.
// - HAI QUYẾT ĐỊNH, KHÔNG ĐỐI XỨNG VỀ HẬU QUẢ:
//     Overturned = HUỶ án phạt. Phòng trà đang bị đình chỉ sẽ hoạt động lại.
//     Upheld     = GIỮ NGUYÊN. Án phạt tiếp tục có hiệu lực.
//   Vì vậy hai nút không cùng màu và câu xác nhận nói rõ chuyện gì xảy ra sau đó.
// - `reviewNote` là thứ chủ phòng trà đọc để biết vì sao khiếu nại của họ được chấp nhận hay bị bác.
//   Bắt buộc nhập cho cả hai quyết định: "bác đơn" không kèm lý do là câu trả lời vô nghĩa.
// - Không có đường hoàn tác quyết định. Xử lý xong là xong.
// - `appealResult` là null khi chưa xử lý, còn lại 'Overturned' / 'Upheld'. Dùng ĐÚNG trường này để
//   biết đơn đã được quyết hay chưa — đừng suy từ `status` của án phạt, vì án phạt có thể vẫn ở
//   'Active' trong lúc khiếu nại đang chờ.
import { useState, useEffect, useCallback } from 'react'
import { Link } from 'react-router-dom'
import {
  Loader2, Gavel, AlertTriangle, ShieldAlert, Ban, RefreshCw, X, CheckCircle2, XCircle, MessageSquareWarning,
} from 'lucide-react'
import dayjs from 'dayjs'
import toast from 'react-hot-toast'
import { getPenaltyAppeals, reviewPenaltyAppeal } from '../../services/penaltyServices'

// Giữ trùng với OwnerPenaltiesPage: hai bên phải gọi cùng một mức phạt bằng cùng một chữ.
const TYPE_VIEW = {
  Warning: { label: 'Cảnh cáo', cls: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/30', icon: AlertTriangle },
  Suspension: { label: 'Tạm đình chỉ', cls: 'bg-orange-500/10 text-orange-400 border-orange-500/30', icon: ShieldAlert },
  Ban: { label: 'Cấm hoạt động', cls: 'bg-red-500/10 text-red-400 border-red-500/30', icon: Ban },
}

const STATUS_VIEW = {
  Active: { label: 'Đang hiệu lực', cls: 'text-red-400' },
  Appealed: { label: 'Đã khiếu nại, chờ xử lý', cls: 'text-yellow-400' },
  Overturned: { label: 'Đã huỷ sau khiếu nại', cls: 'text-green-400' },
  Upheld: { label: 'Giữ nguyên án phạt', cls: 'text-gray-400' },
  Expired: { label: 'Đã hết hiệu lực', cls: 'text-gray-500' },
}

const ReviewModal = ({ item, decision, onClose, onSaved }) => {
  const [reviewNote, setReviewNote] = useState('')
  const [isBusy, setIsBusy] = useState(false)
  const laHuy = decision === 'Overturned'

  const submit = async (e) => {
    e.preventDefault()
    if (!reviewNote.trim()) {
      toast.error('Phải ghi lý do — chủ phòng trà đọc đúng câu này để hiểu quyết định.')
      return
    }
    setIsBusy(true)
    try {
      await reviewPenaltyAppeal(item.id, { decision, reviewNote: reviewNote.trim() })
      toast.success(laHuy ? 'Đã huỷ án phạt.' : 'Đã giữ nguyên án phạt.')
      onSaved()
      onClose()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Không xử lý được khiếu nại.', { duration: 6000 })
    } finally { setIsBusy(false) }
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={() => !isBusy && onClose()} />
      <div className="relative bg-gray-900 border border-gray-700 rounded-2xl w-full max-w-lg shadow-2xl flex flex-col max-h-[90vh]">
        <div className="flex-none flex justify-between items-center p-5 border-b border-gray-800">
          <h2 className="text-lg font-bold text-white">
            {laHuy ? 'Huỷ án phạt này?' : 'Giữ nguyên án phạt?'}
          </h2>
          <button onClick={onClose} disabled={isBusy}
            className="p-2 hover:bg-gray-800 rounded-full text-gray-400 disabled:opacity-30">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={submit} className="p-5 space-y-4 overflow-y-auto">
          <div className="p-3 rounded-lg bg-black/50 border border-gray-800 space-y-1.5">
            <p className="text-sm text-white">{item.loungeName}</p>
            <p className="text-xs text-gray-400">
              {TYPE_VIEW[item.penaltyType]?.label ?? item.penaltyType}
              {item.suspensionDays ? ` · ${item.suspensionDays} ngày` : ''}
            </p>
            <p className="text-xs text-gray-500 leading-relaxed">Lý do phạt: {item.reason}</p>
            {item.appealReason && (
              <p className="text-xs text-gray-300 italic leading-relaxed pt-1.5 border-t border-gray-800">
                Chủ phòng trà khiếu nại: “{item.appealReason}”
              </p>
            )}
          </div>

          <p className={`text-xs flex items-start gap-1.5 leading-relaxed rounded-lg p-3 border ${
            laHuy ? 'text-green-400 bg-green-500/5 border-green-500/30' : 'text-gray-300 bg-gray-800/40 border-gray-700'
          }`}>
            <AlertTriangle size={13} className="mt-px flex-shrink-0" />
            {laHuy
              ? 'Án phạt bị huỷ. Nếu phòng trà đang bị đình chỉ thì sẽ hoạt động trở lại ngay.'
              : 'Án phạt tiếp tục có hiệu lực như cũ. Chủ phòng trà không khiếu nại lại được.'}
          </p>

          <div>
            <label className="text-xs text-gray-500">Lý do quyết định <span className="text-red-400">*</span></label>
            <textarea rows={4} value={reviewNote} onChange={(e) => setReviewNote(e.target.value)}
              placeholder={laHuy
                ? 'VD: đã xem lại bằng chứng, sự việc do lỗi hệ thống chứ không do phòng trà'
                : 'VD: bằng chứng chủ phòng trà đưa ra không bác được sự việc đã ghi nhận ngày 12/09'}
              className="mt-1 w-full px-3 py-2 bg-black border border-gray-700 rounded-lg text-sm text-white resize-none focus:outline-none focus:border-[#C3B665]/50" />
          </div>

          <div className="flex gap-3">
            <button type="button" onClick={onClose} disabled={isBusy}
              className="flex-1 py-2.5 border border-gray-600 text-gray-300 rounded-lg font-medium hover:bg-gray-800 disabled:opacity-50">
              Huỷ bỏ
            </button>
            <button type="submit" disabled={isBusy}
              className={`flex-1 py-2.5 rounded-lg font-bold flex items-center justify-center gap-2 disabled:opacity-50 ${
                laHuy ? 'bg-green-500 text-black hover:bg-green-400' : 'bg-gray-700 text-white hover:bg-gray-600'
              }`}>
              {isBusy && <Loader2 size={16} className="animate-spin" />}
              {laHuy ? 'Huỷ án phạt' : 'Giữ nguyên'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

const AdminPenaltyAppealsPage = () => {
  const [items, setItems] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [daXuLy, setDaXuLy] = useState(false)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [totalCount, setTotalCount] = useState(0)
  const [target, setTarget] = useState(null) // { item, decision }

  const load = useCallback(async () => {
    setIsLoading(true)
    try {
      const res = await getPenaltyAppeals({ resolved: daXuLy, page, pageSize: 20 })
      if (res.success) {
        setItems(res.data?.items ?? [])
        setTotalPages(res.data?.totalPages ?? 1)
        setTotalCount(res.data?.totalCount ?? 0)
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Không tải được danh sách khiếu nại.')
      setItems([])
    } finally {
      setIsLoading(false)
    }
  }, [daXuLy, page])

  useEffect(() => { const chay = async () => { await load() }; chay() }, [load])

  const doiTab = (v) => { setDaXuLy(v); setPage(1) }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          <Gavel size={28} className="text-[#C3B665]" />
          <div>
            <h1 className="text-2xl font-bold text-white">Khiếu nại án phạt</h1>
            <p className="text-gray-400 text-sm leading-relaxed">
              Chủ phòng trà gửi khiếu nại khi cho rằng án phạt không đúng. Quyết định ở đây có hiệu
              lực ngay và không hoàn tác được.
            </p>
          </div>
        </div>
        <button onClick={load} disabled={isLoading}
          className="flex items-center gap-2 px-4 py-2 rounded-lg border border-gray-700 text-gray-300 text-sm font-bold hover:bg-gray-800 disabled:opacity-50">
          <RefreshCw size={16} className={isLoading ? 'animate-spin' : ''} /> Tải lại
        </button>
      </div>

      <div className="flex flex-wrap gap-2">
        <button onClick={() => doiTab(false)}
          className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
            !daXuLy ? 'bg-gray-800 border-[#C3B665]/40 text-[#C3B665]' : 'bg-black border-gray-800 text-gray-400 hover:text-white'
          }`}>
          Chờ xử lý{!daXuLy && totalCount > 0 ? ` (${totalCount})` : ''}
        </button>
        <button onClick={() => doiTab(true)}
          className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
            daXuLy ? 'bg-gray-800 border-[#C3B665]/40 text-[#C3B665]' : 'bg-black border-gray-800 text-gray-400 hover:text-white'
          }`}>
          Đã xử lý
        </button>
      </div>

      {isLoading ? (
        <div className="py-20 flex justify-center"><Loader2 size={30} className="animate-spin text-[#C3B665]" /></div>
      ) : items.length === 0 ? (
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-12 text-center">
          <MessageSquareWarning size={30} className="mx-auto mb-3 text-gray-700" />
          <p className="text-sm text-gray-500">
            {daXuLy ? 'Chưa có khiếu nại nào được xử lý.' : 'Không có khiếu nại nào đang chờ.'}
          </p>
        </div>
      ) : (
        <ul className="space-y-3">
          {items.map((p) => {
            const loai = TYPE_VIEW[p.penaltyType] ?? { label: p.penaltyType, cls: 'bg-gray-500/10 text-gray-400 border-gray-500/30', icon: ShieldAlert }
            const tt = STATUS_VIEW[p.status] ?? { label: p.status, cls: 'text-gray-400' }
            const Icon = loai.icon
            // Điều kiện hiện nút: đang ở tab CHỜ XỬ LÝ và chưa có kết quả nào được ghi.
            // KHÔNG dựa vào `status === 'Appealed'`: mẫu dữ liệu thật của endpoint này có hàng
            // status = 'Active' dù đang chờ xử lý, nghĩa là trạng thái án phạt không nhất thiết đổi
            // khi có khiếu nại. Bám vào nó thì nút biến mất và cả màn thành vô dụng.
            // `resolved=false` đã lọc sẵn ở máy chủ, nên trong tab này mọi hàng đều cần quyết định.
            const xuLyDuoc = !daXuLy && !p.appealResult

            return (
              <li key={p.id} className="bg-gray-900 border border-gray-800 rounded-xl p-5">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md border text-xs font-medium ${loai.cls}`}>
                        <Icon size={12} /> {loai.label}
                      </span>
                      <Link to={`/lounge/${p.loungeId}`} target="_blank"
                        className="text-white font-bold hover:text-[#C3B665]">
                        {p.loungeName}
                      </Link>
                      <span className={`text-xs ${tt.cls}`}>· {tt.label}</span>
                    </div>

                    <p className="text-xs text-gray-600 mt-1">
                      Áp dụng {dayjs(p.issuedAt).format('DD/MM/YYYY')}
                      {p.suspensionDays ? ` · ${p.suspensionDays} ngày` : ''}
                      {p.suspensionEnd ? ` · hết hiệu lực ${dayjs(p.suspensionEnd).format('DD/MM/YYYY')}` : ''}
                    </p>

                    <p className="text-sm text-gray-300 mt-3 leading-relaxed">
                      <span className="text-gray-500">Lý do phạt: </span>{p.reason}
                    </p>
                    {p.evidenceRef && (
                      <p className="text-xs text-gray-600 mt-1">Bằng chứng: {p.evidenceRef}</p>
                    )}

                    {p.appealReason && (
                      <div className="mt-3 pl-3 border-l-2 border-yellow-500/40">
                        <p className="text-xs text-gray-500">
                          Khiếu nại {p.appealedAt ? dayjs(p.appealedAt).format('DD/MM/YYYY') : ''}
                        </p>
                        <p className="text-sm text-gray-300 italic mt-0.5 leading-relaxed">“{p.appealReason}”</p>
                      </div>
                    )}

                    {p.appealResult && (
                      <div className="mt-3 pt-3 border-t border-gray-800 text-xs">
                        <p className={p.appealResult === 'Overturned' ? 'text-green-400' : 'text-gray-400'}>
                          Đã quyết: {p.appealResult === 'Overturned' ? 'huỷ án phạt' : 'giữ nguyên án phạt'}
                          {p.reviewedAt && ` · ${dayjs(p.reviewedAt).format('DD/MM/YYYY')}`}
                        </p>
                        {p.reviewNote && <p className="text-gray-500 mt-0.5 leading-relaxed">{p.reviewNote}</p>}
                      </div>
                    )}
                  </div>

                  {xuLyDuoc && (
                    <div className="flex flex-col gap-2 flex-shrink-0">
                      <button onClick={() => setTarget({ item: p, decision: 'Overturned' })}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-green-500/40 text-green-400 text-xs font-bold hover:bg-green-500/10">
                        <CheckCircle2 size={13} /> Huỷ án phạt
                      </button>
                      <button onClick={() => setTarget({ item: p, decision: 'Upheld' })}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-gray-700 text-gray-300 text-xs font-bold hover:bg-gray-800">
                        <XCircle size={13} /> Giữ nguyên
                      </button>
                    </div>
                  )}
                </div>
              </li>
            )
          })}
        </ul>
      )}

      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-3">
          <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page <= 1}
            className="px-4 py-2 rounded-lg border border-gray-700 text-sm text-gray-300 hover:bg-gray-800 disabled:opacity-40">
            Trước
          </button>
          <span className="text-sm text-gray-500">Trang {page}/{totalPages}</span>
          <button onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page >= totalPages}
            className="px-4 py-2 rounded-lg border border-gray-700 text-sm text-gray-300 hover:bg-gray-800 disabled:opacity-40">
            Sau
          </button>
        </div>
      )}

      {target && (
        <ReviewModal item={target.item} decision={target.decision}
          onClose={() => setTarget(null)} onSaved={load} />
      )}
    </div>
  )
}

export default AdminPenaltyAppealsPage
