// src/components/myshows/IncomingTransfersTab.jsx
//
// GHI CHÚ CHO ĐỘI FE:
// - Vé được người khác chuyển cho bạn KHÔNG tự vào ví vé: bạn phải đồng ý nhận. Trước khi bạn đồng ý,
//   người gửi vẫn có thể huỷ lượt chuyển — nên đừng hiện những vé này lẫn vào danh sách vé của bạn.
// - Endpoint trả MẢNG TRẦN (IReadOnlyList), không phải phong bì phân trang.
import { useState, useEffect, useCallback } from 'react'
import { Loader2, Inbox, CheckCircle2, Calendar, MapPin } from 'lucide-react'
import dayjs from 'dayjs'
import toast from 'react-hot-toast'
import { getIncomingTicketTransfers, acceptTicketTransfer } from '../../services/ticketServices'

const fmtMoney = (v) => `${Number(v || 0).toLocaleString('vi-VN')}đ`

const IncomingTransfersTab = () => {
  const [items, setItems] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [busyId, setBusyId] = useState(null)

  const load = useCallback(async () => {
    setIsLoading(true)
    try {
      const res = await getIncomingTicketTransfers()
      if (res.success) setItems(res.data ?? [])
    } catch (err) {
      toast.error(err.response?.data?.message || 'Không tải được danh sách vé chuyển đến.')
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => { const chay = async () => { await load() }; chay() }, [load])

  const nhanVe = async (ticketId) => {
    setBusyId(ticketId)
    try {
      await acceptTicketTransfer(ticketId)
      toast.success('Đã nhận vé. Vé giờ nằm trong danh sách vé của bạn.')
      await load()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Không nhận được vé này.')
    } finally {
      setBusyId(null)
    }
  }

  if (isLoading) {
    return <div className="py-16 flex justify-center"><Loader2 size={28} className="animate-spin text-[#C3B665]" /></div>
  }

  if (items.length === 0) {
    return (
      <div className="bg-gray-900 border border-gray-800 rounded-xl p-10 text-center">
        <Inbox size={26} className="mx-auto mb-3 text-gray-700" />
        <p className="text-sm text-gray-500">Không có vé nào đang được chuyển cho bạn.</p>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      <p className="text-xs text-gray-500">
        Những vé này chỉ thuộc về bạn sau khi bạn bấm nhận. Người gửi vẫn có thể huỷ trước lúc đó.
      </p>
      {items.map((t) => (
        <div key={t.ticketId} className="bg-gray-900 border border-gray-800 rounded-xl p-5">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="min-w-0">
              <p className="text-white font-bold">{t.showName}</p>
              <p className="text-xs text-gray-500 mt-1 flex items-center gap-1.5">
                <MapPin size={12} /> {t.loungeName}
              </p>
              <p className="text-xs text-gray-500 mt-0.5 flex items-center gap-1.5">
                <Calendar size={12} /> {dayjs(t.showScheduledStart).format('HH:mm DD/MM/YYYY')}
              </p>
              <p className="text-xs text-gray-600 mt-1">
                {t.tierName} · {t.priceName} · {fmtMoney(t.pricePaid)}
              </p>
            </div>
            <div className="flex-shrink-0 text-right">
              <p className="text-xs text-gray-600 mb-2">
                Chuyển lúc {dayjs(t.initiatedAt).format('HH:mm DD/MM')}
              </p>
              <button onClick={() => nhanVe(t.ticketId)} disabled={busyId !== null}
                className="flex items-center gap-2 px-4 py-2 rounded-lg bg-[#C3B665] text-black text-sm font-bold hover:bg-[#d4c87f] disabled:opacity-50">
                {busyId === t.ticketId ? <Loader2 size={15} className="animate-spin" /> : <CheckCircle2 size={15} />}
                Nhận vé
              </button>
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}

export default IncomingTransfersTab
