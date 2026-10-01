// src/components/myshows/MyDonationsTab.jsx

import { useState, useEffect, useCallback } from 'react'
import { Link } from 'react-router-dom'
import { Loader2, Heart, Clock, CheckCircle2, EyeOff, ExternalLink } from 'lucide-react'
import dayjs from 'dayjs'
import toast from 'react-hot-toast'
import { getMyDonations } from '../../services/donationServices'

const fmtTien = (v) => `${Number(v || 0).toLocaleString('vi-VN')}đ`

// Status của backend là chuỗi; chỉ ánh xạ những giá trị đã biết, còn lại hiện nguyên văn thay vì
// đoán bừa — hiện sai trạng thái của một khoản tiền tệ hơn là hiện chữ lạ.
const NHAN_TRANG_THAI = {
  Pending: { chu: 'Chờ thanh toán', mau: 'text-warning bg-yellow-500/10', icon: Clock },
  Paid: { chu: 'Đã thanh toán', mau: 'text-success bg-green-500/10', icon: CheckCircle2 },
  Completed: { chu: 'Đã chuyển tới nghệ sĩ', mau: 'text-success bg-green-500/10', icon: CheckCircle2 },
  Failed: { chu: 'Thanh toán thất bại', mau: 'text-danger bg-red-500/10', icon: Clock },
  Cancelled: { chu: 'Đã huỷ', mau: 'text-ink-soft bg-line-strong/10', icon: Clock },
}

const MyDonationsTab = () => {
  const [items, setItems] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)

  const load = useCallback(async () => {
    setIsLoading(true)
    try {
      const res = await getMyDonations({ page, pageSize: 10 })
      if (res.success) {
        setItems(res.data?.items ?? [])
        setTotalPages(res.data?.totalPages ?? 1)
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Không tải được lịch sử donate.')
    } finally {
      setIsLoading(false)
    }
  }, [page])

  useEffect(() => { const chay = async () => { await load() }; chay() }, [load])

  if (isLoading) {
    return <div className="py-20 flex justify-center"><Loader2 size={30} className="animate-spin text-brand-text" /></div>
  }

  if (items.length === 0) {
    return (
      <div className="bg-card border border-line rounded-2xl p-12 text-center">
        <Heart size={32} className="mx-auto mb-3 text-ink-mute" />
        <p className="text-lg font-semibold text-ink mb-1">Bạn chưa donate cho nghệ sĩ nào.</p>
        <p className="text-sm text-ink-mute">Trong buổi phát trực tiếp, bạn có thể tặng tiền cho nghệ sĩ đang biểu diễn.</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="bg-card border border-line rounded-2xl divide-y divide-line">
        {items.map((d) => {
          const tt = NHAN_TRANG_THAI[d.status]
          const Icon = tt?.icon
          return (
            <div key={d.id} className="p-5 flex flex-wrap items-start justify-between gap-4">
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  {d.performerId ? (
                    <Link to={`/performers/${d.performerId}/donations`}
                      className="text-base font-semibold text-ink hover:text-brand-text inline-flex items-center gap-1.5"
                      title="Xem sao kê donate công khai của nghệ sĩ này">
                      {d.performerName} <ExternalLink size={13} className="text-ink-mute" />
                    </Link>
                  ) : (
                    <p className="text-base font-semibold text-ink">{d.performerName}</p>
                  )}
                  {d.isAnonymous && (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-sunken text-ink-soft text-xs">
                      <EyeOff size={11} /> Ẩn danh
                    </span>
                  )}
                </div>
                <p className="text-sm text-ink-soft mt-0.5">{d.showName}</p>
                {d.message && (
                  <p className="text-sm text-ink-soft mt-2 italic border-l-2 border-line pl-3 leading-relaxed">
                    “{d.message}”
                  </p>
                )}
                <p className="text-xs text-ink-mute mt-2">
                  Gửi lúc {dayjs(d.createdAt).format('HH:mm DD/MM/YYYY')}
                  {d.paymentConfirmedAt && ` · Xác nhận thanh toán ${dayjs(d.paymentConfirmedAt).format('HH:mm DD/MM/YYYY')}`}
                </p>
              </div>

              <div className="text-right flex-shrink-0">
                <p className="text-lg font-bold text-brand-text tabular-nums">{fmtTien(d.gross)}</p>
                <span className={`mt-1.5 inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-medium ${tt?.mau ?? 'text-ink-soft bg-line-strong/10'}`}>
                  {Icon && <Icon size={11} />} {tt?.chu ?? d.status}
                </span>
              </div>
            </div>
          )
        })}
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-3">
          <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page <= 1}
            className="px-4 py-2 rounded-lg border border-line text-sm text-ink-soft hover:bg-sunken disabled:opacity-40">
            Trước
          </button>
          <span className="text-sm text-ink-mute">Trang {page}/{totalPages}</span>
          <button onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page >= totalPages}
            className="px-4 py-2 rounded-lg border border-line text-sm text-ink-soft hover:bg-sunken disabled:opacity-40">
            Sau
          </button>
        </div>
      )}
    </div>
  )
}

export default MyDonationsTab
