// src/pages/owner/OwnerPenaltiesPage.jsx
//
// GHI CHÚ CHO ĐỘI FE:
// - Án phạt ảnh hưởng trực tiếp tới việc kinh doanh: bị Suspension hoặc Ban thì phòng trà không mở
//   buổi diễn mới và không bán vé được. Vì vậy màn này nói rõ hiệu lực, thời hạn, và HẠN KHIẾU NẠI.
// - `appealDeadline` là cửa sổ duy nhất để phản hồi — quá hạn backend từ chối nhận khiếu nại. Nút
//   khiếu nại vì thế tự tắt khi hết hạn, kèm câu giải thích, thay vì để người dùng bấm rồi nhận lỗi.
// - Mỗi án phạt chỉ khiếu nại MỘT lần: đã có `appealedAt` thì chuyển sang xem kết quả, không hiện
//   lại nút gửi.
// - Trạng thái: Active (đang hiệu lực) · Appealed (đã khiếu nại, chờ Admin) · Overturned (đã được
//   huỷ) · Upheld (Admin giữ nguyên án phạt) · Expired (đã hết hiệu lực).
import { useState, useEffect, useCallback } from 'react'
import { Loader2, ShieldAlert, AlertTriangle, Ban, CheckCircle2, Clock, X, Gavel } from 'lucide-react'
import dayjs from 'dayjs'
import toast from 'react-hot-toast'
import { getMyPenalties, submitPenaltyAppeal } from '../../services/penaltyServices'

const TYPE_VIEW = {
  Warning: { label: 'Cảnh cáo', cls: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/30', icon: AlertTriangle,
    hint: 'Ghi lại để theo dõi. Phòng trà vẫn hoạt động bình thường.' },
  Suspension: { label: 'Tạm đình chỉ', cls: 'bg-orange-500/10 text-orange-400 border-orange-500/30', icon: ShieldAlert,
    hint: 'Trong thời gian đình chỉ, phòng trà không mở buổi diễn mới và không bán vé được.' },
  Ban: { label: 'Cấm hoạt động', cls: 'bg-red-500/10 text-red-400 border-red-500/30', icon: Ban,
    hint: 'Phòng trà bị cấm hoạt động trên nền tảng.' },
}

const STATUS_VIEW = {
  Active: { label: 'Đang hiệu lực', cls: 'text-red-400' },
  Appealed: { label: 'Đã khiếu nại, chờ Admin xử lý', cls: 'text-yellow-400' },
  Overturned: { label: 'Đã được huỷ sau khiếu nại', cls: 'text-green-400' },
  Upheld: { label: 'Admin giữ nguyên án phạt', cls: 'text-gray-400' },
  Expired: { label: 'Đã hết hiệu lực', cls: 'text-gray-500' },
}

const AppealModal = ({ penalty, onClose, onSaved }) => {
  const [reason, setReason] = useState('')
  const [isBusy, setIsBusy] = useState(false)

  const submit = async (e) => {
    e.preventDefault()
    if (reason.trim().length < 10) {
      toast.error('Hãy trình bày lý do khiếu nại rõ ràng hơn (ít nhất 10 ký tự).')
      return
    }
    setIsBusy(true)
    try {
      await submitPenaltyAppeal(penalty.id, reason.trim())
      toast.success('Đã gửi khiếu nại. Admin sẽ xem xét và phản hồi.')
      onSaved(); onClose()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Không gửi được khiếu nại.')
    } finally { setIsBusy(false) }
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-gray-900 border border-gray-700 rounded-2xl w-full max-w-md shadow-2xl">
        <div className="flex justify-between items-center p-5 border-b border-gray-800">
          <h2 className="text-lg font-bold text-white">Khiếu nại án phạt</h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-800 rounded-full text-gray-400"><X size={20} /></button>
        </div>

        <form onSubmit={submit} className="p-5 space-y-4">
          <div className="bg-black/40 border border-gray-800 rounded-lg p-4">
            <p className="text-sm text-white font-medium">{TYPE_VIEW[penalty.penaltyType]?.label ?? penalty.penaltyType}</p>
            <p className="text-xs text-gray-500 mt-1 leading-relaxed">{penalty.reason}</p>
          </div>

          <div>
            <label className="text-xs text-gray-500">Lý do khiếu nại</label>
            <textarea value={reason} onChange={(e) => setReason(e.target.value)} rows={5}
              className="mt-1 w-full px-3 py-2 bg-black border border-gray-700 rounded-lg text-sm text-white focus:outline-none focus:border-[#C3B665]/50 resize-none"
              placeholder="Trình bày vì sao bạn cho rằng án phạt này không đúng, kèm thông tin đối chiếu nếu có." />
            <p className="text-xs text-gray-600 mt-1">
              Mỗi án phạt chỉ khiếu nại được một lần, nên hãy trình bày đầy đủ ngay lần này.
            </p>
          </div>

          <button type="submit" disabled={isBusy}
            className="w-full py-2.5 bg-[#C3B665] text-black rounded-lg font-bold flex items-center justify-center gap-2 disabled:opacity-50">
            {isBusy && <Loader2 size={16} className="animate-spin" />} Gửi khiếu nại
          </button>
        </form>
      </div>
    </div>
  )
}

const OwnerPenaltiesPage = () => {
  const [items, setItems] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [khieuNai, setKhieuNai] = useState(null)

  const load = useCallback(async () => {
    setIsLoading(true)
    try {
      const res = await getMyPenalties({ pageSize: 50 })
      if (res.success) setItems(res.data.items ?? [])
    } catch (err) {
      toast.error(err.response?.data?.message || 'Không tải được danh sách án phạt.')
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => { const chay = async () => { await load() }; chay() }, [load])

  if (isLoading) {
    return <div className="py-20 flex justify-center"><Loader2 size={32} className="animate-spin text-[#C3B665]" /></div>
  }

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <h1 className="text-2xl font-bold text-white mb-1">Án phạt</h1>
        <p className="text-gray-400 text-sm">Các án phạt đã áp lên phòng trà của bạn, và kết quả khiếu nại.</p>
      </div>

      {items.length === 0 ? (
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-10 text-center">
          <CheckCircle2 size={28} className="mx-auto mb-3 text-green-500/40" />
          <p className="text-sm text-gray-500">Phòng trà của bạn chưa có án phạt nào.</p>
        </div>
      ) : (
        <ul className="space-y-4">
          {items.map((p) => {
            const loai = TYPE_VIEW[p.penaltyType] ?? { label: p.penaltyType, cls: 'bg-gray-500/10 text-gray-400 border-gray-500/30', icon: ShieldAlert, hint: '' }
            const tt = STATUS_VIEW[p.status] ?? { label: p.status, cls: 'text-gray-400' }
            const conHanKhieuNai = p.appealDeadline && dayjs(p.appealDeadline).isAfter(dayjs())
            const daKhieuNai = !!p.appealedAt
            const khieuNaiDuoc = !daKhieuNai && conHanKhieuNai && ['Active'].includes(p.status)

            return (
              <li key={p.id} className="bg-gray-900 border border-gray-800 rounded-xl p-5">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="flex items-start gap-3 min-w-0">
                    <span className={`p-2 rounded-lg border flex-shrink-0 ${loai.cls}`}>
                      <loai.icon size={16} />
                    </span>
                    <div className="min-w-0">
                      <p className="text-white font-bold">{loai.label}</p>
                      <p className="text-xs text-gray-500 mt-0.5">
                        {p.loungeName} · áp dụng {dayjs(p.issuedAt).format('DD/MM/YYYY')}
                      </p>
                      <p className={`text-xs mt-1 font-medium ${tt.cls}`}>{tt.label}</p>
                    </div>
                  </div>
                </div>

                <p className="text-sm text-gray-300 mt-3 leading-relaxed">{p.reason}</p>
                {loai.hint && <p className="text-xs text-gray-600 mt-1">{loai.hint}</p>}
                {p.evidenceRef && <p className="text-xs text-gray-600 mt-1">Bằng chứng: {p.evidenceRef}</p>}

                <div className="mt-3 pt-3 border-t border-gray-800 space-y-1.5 text-xs">
                  <p className="text-gray-500">
                    Hiệu lực từ {dayjs(p.effectiveAt).format('HH:mm DD/MM/YYYY')}
                    {p.suspensionDays && ` · ${p.suspensionDays} ngày`}
                    {p.suspensionEnd && ` · hết hiệu lực ${dayjs(p.suspensionEnd).format('DD/MM/YYYY')}`}
                  </p>

                  {daKhieuNai ? (
                    <>
                      <p className="text-gray-500">Đã khiếu nại {dayjs(p.appealedAt).format('DD/MM/YYYY')}</p>
                      {p.appealReason && <p className="text-gray-400 italic">“{p.appealReason}”</p>}
                      {p.appealResult && (
                        <p className="text-gray-300">
                          Kết quả: {p.appealResult}
                          {p.reviewedAt && ` (${dayjs(p.reviewedAt).format('DD/MM/YYYY')})`}
                        </p>
                      )}
                      {!p.appealResult && (
                        <p className="text-yellow-400 inline-flex items-center gap-1.5">
                          <Clock size={12} /> Đang chờ Admin xử lý khiếu nại
                        </p>
                      )}
                    </>
                  ) : p.appealDeadline ? (
                    <p className={conHanKhieuNai ? 'text-gray-500' : 'text-gray-600'}>
                      {conHanKhieuNai
                        ? `Hạn khiếu nại tới ${dayjs(p.appealDeadline).format('HH:mm DD/MM/YYYY')}`
                        : `Đã hết hạn khiếu nại (${dayjs(p.appealDeadline).format('DD/MM/YYYY')})`}
                    </p>
                  ) : null}
                </div>

                {khieuNaiDuoc && (
                  <button onClick={() => setKhieuNai(p)}
                    className="mt-4 flex items-center gap-2 px-4 py-2 rounded-lg border border-gray-700 text-gray-300 text-sm font-bold hover:bg-gray-800">
                    <Gavel size={15} /> Khiếu nại án phạt này
                  </button>
                )}
              </li>
            )
          })}
        </ul>
      )}

      {khieuNai && (
        <AppealModal penalty={khieuNai} onClose={() => setKhieuNai(null)} onSaved={load} />
      )}
    </div>
  )
}

export default OwnerPenaltiesPage
