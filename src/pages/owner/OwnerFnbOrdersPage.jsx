// src/pages/owner/OwnerFnbOrdersPage.jsx
//
// GHI CHÚ CHO ĐỘI FE:
// - Màn của NHÂN VIÊN phục vụ/bếp. Đổi trạng thái đơn và thu tiền đều là RequireVenueOperator, nên
//   nhân viên dùng được — đặt ngoài nhóm route chỉ dành cho chủ.
// - `status` và `isPaid` là HAI CHUYỆN KHÁC NHAU (MLACP-349). Đơn trả trước qua VNPay vẫn nằm ở
//   Pending/Preparing cho tới khi phục vụ xong, nên KHÔNG được suy ra "đã trả tiền" từ status, và
//   ngược lại. Màn này hiện hai thứ đó tách biệt.
// - `onlinePaymentLiveUntil`: khách đang giữ một liên kết VNPay còn trả được tới thời điểm đó. Trong
//   lúc đó backend TỪ CHỐI thu tiền mặt và từ chối huỷ đơn — nếu không nói lý do thì nhân viên sẽ
//   tưởng hệ thống hỏng. Hai nút liên quan bị khoá kèm giải thích cho tới khi hết hạn.
// - Luồng trạng thái theo bếp: Pending → Preparing → Served. Paid là kết quả của việc thu tiền, còn
//   Cancelled là huỷ đơn. Không cho nhảy lùi, vì backend cũng không cho.
import { useState, useEffect, useCallback } from 'react'
import { Loader2, RefreshCw, UtensilsCrossed, Banknote, CheckCircle2, XCircle, Clock, CreditCard } from 'lucide-react'
import dayjs from 'dayjs'
import toast from 'react-hot-toast'
import { getLounges } from '../../services/loungeServices'
import { getLoungeFnbOrders, updateFnbOrderStatus, payFnbOrder } from '../../services/fnbServices'

const fmtMoney = (v) => `${Number(v || 0).toLocaleString('vi-VN')}đ`

const STATUS_VIEW = {
  Pending: { label: 'Chờ làm', cls: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/30' },
  Preparing: { label: 'Đang làm', cls: 'bg-blue-500/10 text-blue-400 border-blue-500/30' },
  Served: { label: 'Đã phục vụ', cls: 'bg-green-500/10 text-green-400 border-green-500/30' },
  Paid: { label: 'Đã thanh toán', cls: 'bg-gray-500/10 text-gray-400 border-gray-500/30' },
  Cancelled: { label: 'Đã huỷ', cls: 'bg-red-500/10 text-red-400 border-red-500/30' },
}

// Bước tiếp theo hợp lệ của bếp. Không có đường lùi — backend cũng không cho.
const BUOC_TIEP = { Pending: 'Preparing', Preparing: 'Served' }
const NHAN_BUOC_TIEP = { Preparing: 'Bắt đầu làm', Served: 'Đã phục vụ xong' }

const LOC = [
  { key: 'dang-lam', label: 'Đang xử lý', statuses: ['Pending', 'Preparing', 'Served'] },
  { key: 'tat-ca', label: 'Tất cả', statuses: null },
]

const OwnerFnbOrdersPage = () => {
  const [lounge, setLounge] = useState(null)
  const [orders, setOrders] = useState([])
  const [loc, setLoc] = useState('dang-lam')
  const [isLoading, setIsLoading] = useState(true)
  const [busyId, setBusyId] = useState(null)

  const loadLounge = useCallback(async () => {
    try {
      const res = await getLounges({ mine: true })
      if (res.success) {
        const items = Array.isArray(res.data) ? res.data : res.data?.items
        setLounge(items?.[0] ?? null)
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Không tải được thông tin phòng trà.')
    }
  }, [])

  const loadOrders = useCallback(async () => {
    if (!lounge) { setIsLoading(false); return }
    setIsLoading(true)
    try {
      const res = await getLoungeFnbOrders(lounge.id, { pageSize: 100 })
      if (res.success) {
        const items = Array.isArray(res.data) ? res.data : res.data?.items ?? []
        setOrders(items)
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Không tải được danh sách đơn.')
    } finally {
      setIsLoading(false)
    }
  }, [lounge])

  useEffect(() => { const chay = async () => { await loadLounge() }; chay() }, [loadLounge])
  useEffect(() => { const chay = async () => { await loadOrders() }; chay() }, [loadOrders])

  const doiTrangThai = async (order, status) => {
    setBusyId(order.id)
    try {
      await updateFnbOrderStatus(order.id, status)
      toast.success('Đã cập nhật đơn.')
      await loadOrders()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Không cập nhật được đơn.')
    } finally {
      setBusyId(null)
    }
  }

  const thuTien = async (order) => {
    setBusyId(order.id)
    try {
      await payFnbOrder(order.id)
      toast.success('Đã ghi nhận thanh toán.')
      await loadOrders()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Không ghi nhận được thanh toán.')
    } finally {
      setBusyId(null)
    }
  }

  if (isLoading && !orders.length) {
    return <div className="py-20 flex justify-center"><Loader2 size={32} className="animate-spin text-[#C3B665]" /></div>
  }

  if (!lounge) {
    return (
      <div className="max-w-2xl">
        <h1 className="text-2xl font-bold text-white mb-1">Đơn gọi món</h1>
        <div className="mt-4 bg-gray-900 border border-gray-800 rounded-xl p-6">
          <p className="text-sm text-gray-400">Chưa có phòng trà nào để nhận đơn.</p>
        </div>
      </div>
    )
  }

  const boLoc = LOC.find((l) => l.key === loc)
  const hienThi = boLoc.statuses ? orders.filter((o) => boLoc.statuses.includes(o.status)) : orders

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-white mb-1">Đơn gọi món</h1>
          <p className="text-gray-400 text-sm">Đơn khách đặt tại bàn. Trạng thái bếp và việc thu tiền là hai việc tách nhau.</p>
        </div>
        <button onClick={loadOrders} disabled={isLoading}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-gray-700 text-gray-300 text-xs font-bold hover:bg-gray-800 disabled:opacity-50">
          <RefreshCw size={14} className={isLoading ? 'animate-spin' : ''} /> Tải lại
        </button>
      </div>

      <div className="flex gap-2">
        {LOC.map((l) => (
          <button key={l.key} onClick={() => setLoc(l.key)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${loc === l.key
              ? 'bg-gray-800 border-[#C3B665]/40 text-[#C3B665]'
              : 'bg-black border-gray-800 text-gray-400 hover:text-white'}`}>
            {l.label}
          </button>
        ))}
      </div>

      {hienThi.length === 0 ? (
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-10 text-center">
          <UtensilsCrossed size={28} className="mx-auto mb-3 text-gray-700" />
          <p className="text-sm text-gray-500">Không có đơn nào trong mục này.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {hienThi.map((o) => {
            const tt = STATUS_VIEW[o.status] ?? { label: o.status, cls: 'bg-gray-500/10 text-gray-400 border-gray-500/30' }
            const buocTiep = BUOC_TIEP[o.status]
            // Liên kết VNPay còn sống: backend chặn thu tiền mặt và chặn huỷ cho tới lúc đó.
            const conLinkOnline = o.onlinePaymentLiveUntil && dayjs(o.onlinePaymentLiveUntil).isAfter(dayjs())
            const dangBan = busyId === o.id

            return (
              <div key={o.id} className="bg-gray-900 border border-gray-800 rounded-xl p-5 flex flex-col">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="text-white font-bold">#{o.id}</p>
                    <p className="text-xs text-gray-500 mt-0.5">
                      {o.tableNote ? `Bàn: ${o.tableNote}` : 'Không ghi bàn'} · {dayjs(o.createdAt).format('HH:mm DD/MM')}
                    </p>
                  </div>
                  <span className={`px-2 py-0.5 rounded-md border text-xs font-medium whitespace-nowrap ${tt.cls}`}>
                    {tt.label}
                  </span>
                </div>

                <ul className="mt-3 space-y-1 flex-1">
                  {o.items.map((it) => (
                    <li key={it.id} className={`flex justify-between text-sm gap-3 ${it.cancelled ? 'opacity-40 line-through' : ''}`}>
                      <span className="text-gray-300 min-w-0">
                        <span className="text-gray-500 tabular-nums">{it.quantity}×</span> {it.menuItemName}
                        {it.note && <span className="block text-xs text-gray-600">{it.note}</span>}
                      </span>
                      <span className="text-gray-400 tabular-nums flex-shrink-0">{fmtMoney(it.unitPrice * it.quantity)}</span>
                    </li>
                  ))}
                </ul>

                {o.note && <p className="mt-2 text-xs text-gray-500 italic">Ghi chú: {o.note}</p>}

                <div className="mt-3 pt-3 border-t border-gray-800 flex items-center justify-between">
                  <span className="text-sm text-gray-400">Tổng</span>
                  <span className="text-white font-bold tabular-nums">{fmtMoney(o.totalAmount)}</span>
                </div>

                {/* Trả tiền hay chưa là thông tin RIÊNG, không suy ra từ trạng thái bếp */}
                <div className="mt-2 flex items-center gap-2 text-xs">
                  {o.isPaid ? (
                    <span className="inline-flex items-center gap-1.5 text-green-400"><CheckCircle2 size={13} /> Khách đã trả tiền</span>
                  ) : (
                    <span className="inline-flex items-center gap-1.5 text-yellow-400"><Clock size={13} /> Chưa thu tiền</span>
                  )}
                  <span className="text-gray-600">·</span>
                  <span className="text-gray-500">{o.paymentMethod}</span>
                </div>

                {conLinkOnline && (
                  <p className="mt-2 text-xs text-blue-400/90 flex items-start gap-1.5 leading-relaxed">
                    <CreditCard size={13} className="mt-px flex-shrink-0" />
                    Khách đang giữ liên kết thanh toán online (còn hạn tới {dayjs(o.onlinePaymentLiveUntil).format('HH:mm')}).
                    Trong lúc này hệ thống không cho thu tiền mặt và không cho huỷ đơn.
                  </p>
                )}

                <div className="mt-3 flex flex-wrap gap-2">
                  {buocTiep && (
                    <button onClick={() => doiTrangThai(o, buocTiep)} disabled={dangBan}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#C3B665] text-black text-xs font-bold hover:bg-[#d4c87f] disabled:opacity-50">
                      {dangBan ? <Loader2 size={13} className="animate-spin" /> : <UtensilsCrossed size={13} />}
                      {NHAN_BUOC_TIEP[buocTiep]}
                    </button>
                  )}
                  {!o.isPaid && o.status !== 'Cancelled' && (
                    <button onClick={() => thuTien(o)} disabled={dangBan || conLinkOnline}
                      title={conLinkOnline ? 'Khách đang có liên kết thanh toán online còn hạn' : undefined}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-green-500/40 text-green-400 text-xs font-bold hover:bg-green-500/10 disabled:opacity-40 disabled:cursor-not-allowed">
                      <Banknote size={13} /> Thu tiền
                    </button>
                  )}
                  {o.status !== 'Cancelled' && o.status !== 'Paid' && (
                    <button onClick={() => doiTrangThai(o, 'Cancelled')} disabled={dangBan || conLinkOnline}
                      title={conLinkOnline ? 'Không huỷ được khi khách còn liên kết thanh toán online' : undefined}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-gray-700 text-gray-400 text-xs font-bold hover:bg-gray-800 disabled:opacity-40 disabled:cursor-not-allowed">
                      <XCircle size={13} /> Huỷ đơn
                    </button>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

export default OwnerFnbOrdersPage
