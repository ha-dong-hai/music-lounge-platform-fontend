// src/pages/user/NotificationsPage.jsx
//
// GHI CHÚ CHO ĐỘI FE:
// - VÌ SAO CẦN TRANG NÀY dù đã có chuông: chuông chỉ lấy 15 thông báo mới nhất và không phân trang.
//   Thông báo thứ 16 trở đi không có đường nào xem được — mà đó là chỗ nằm của những thứ người dùng
//   cần tra lại: vé đã mua, kết quả duyệt, hạn chuyển tiền. Endpoint vốn đã nhận page/pageSize.
// - LUẬT DẪN ĐƯỜNG dùng chung với chuông (notificationLink.js). Đừng chép lại: hai bản sẽ lệch, rồi
//   cùng một thông báo bấm ở chuông và bấm ở đây lại ra hai trang khác nhau.
// - Thông báo KHÔNG CÓ LINK là chuyện bình thường, không phải lỗi: có những loại chưa có màn tương
//   ứng ở FE, và có loại mà vai trò đang đăng nhập không được vào. Lúc đó vẫn hiện nội dung và vẫn
//   bấm được để đánh dấu đã đọc, chỉ là không đi đâu cả.
// - Bấm vào một thông báo CHƯA ĐỌC thì đánh dấu đã đọc ngay tại chỗ thay vì tải lại cả danh sách:
//   tải lại sẽ làm dòng vừa bấm đổi màu rồi nhảy vị trí ngay dưới tay người dùng.
import { useState, useEffect, useCallback } from 'react'
import { Link } from 'react-router-dom'
import { Bell, Loader2, CheckCheck, ArrowLeft, Inbox } from 'lucide-react'
import dayjs from 'dayjs'
import toast from 'react-hot-toast'
import { useAuthStore } from '../../store/useAuthStore'
import { buildLink } from '../../components/notifications/notificationLink'
import {
  getMyNotifications, markNotificationRead, markAllNotificationsRead,
} from '../../services/notificationServices'

const TRANG = 20

const NotificationsPage = () => {
  const { user } = useAuthStore()
  const role = user?.role

  const [items, setItems] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [totalCount, setTotalCount] = useState(0)
  const [isBusy, setIsBusy] = useState(false)

  const load = useCallback(async () => {
    setIsLoading(true)
    try {
      const res = await getMyNotifications({ page, pageSize: TRANG })
      if (res.success) {
        setItems(res.data?.items ?? [])
        setTotalPages(res.data?.totalPages ?? 1)
        setTotalCount(res.data?.totalCount ?? 0)
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Không tải được thông báo.')
      setItems([])
    } finally {
      setIsLoading(false)
    }
  }, [page])

  useEffect(() => { const chay = async () => { await load() }; chay() }, [load])

  // Đánh dấu đã đọc NGAY TRÊN DANH SÁCH đang hiện, không tải lại: tải lại thì dòng vừa bấm đổi màu
  // và có thể nhảy vị trí ngay dưới tay người dùng.
  const danhDauDaDoc = async (n) => {
    if (n.isRead) return
    setItems((ds) => ds.map((x) => (x.id === n.id ? { ...x, isRead: true } : x)))
    try {
      await markNotificationRead(n.id)
    } catch {
      // Hỏng thì trả lại trạng thái cũ, đừng để màn hình nói dối là đã đọc.
      setItems((ds) => ds.map((x) => (x.id === n.id ? { ...x, isRead: false } : x)))
    }
  }

  const danhDauTatCa = async () => {
    setIsBusy(true)
    try {
      await markAllNotificationsRead()
      toast.success('Đã đánh dấu tất cả là đã đọc.')
      await load()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Không đánh dấu được.')
    } finally { setIsBusy(false) }
  }

  const soChuaDoc = items.filter((n) => !n.isRead).length

  if (!user) {
    return (
      <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center px-6">
        <Bell size={34} className="text-gray-700 mb-4" />
        <p className="text-lg font-semibold mb-2">Cần đăng nhập để xem thông báo</p>
        <Link to="/login" className="mt-2 px-6 py-2.5 bg-[#C3B665] text-black rounded-lg font-bold hover:bg-[#d4c87f]">
          Đăng nhập
        </Link>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-black text-white pb-20">
      <div className="max-w-3xl mx-auto px-6 py-8">
        <Link to="/" className="inline-flex items-center gap-2 text-sm font-medium text-gray-400 hover:text-[#C3B665] mb-6">
          <ArrowLeft size={18} /> Về trang chủ
        </Link>

        <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
          <div className="flex items-center gap-3">
            <Bell size={26} className="text-[#C3B665]" />
            <div>
              <h1 className="text-2xl font-bold">Thông báo</h1>
              {totalCount > 0 && (
                <p className="text-sm text-gray-500 mt-0.5">{totalCount.toLocaleString('vi-VN')} thông báo</p>
              )}
            </div>
          </div>

          {soChuaDoc > 0 && (
            <button onClick={danhDauTatCa} disabled={isBusy}
              className="flex items-center gap-2 px-4 py-2 rounded-lg border border-gray-700 text-gray-300 text-sm font-bold hover:bg-gray-800 disabled:opacity-50">
              {isBusy ? <Loader2 size={15} className="animate-spin" /> : <CheckCheck size={15} />}
              Đánh dấu tất cả đã đọc
            </button>
          )}
        </div>

        {isLoading ? (
          <div className="py-24 flex justify-center"><Loader2 size={30} className="animate-spin text-[#C3B665]" /></div>
        ) : items.length === 0 ? (
          <div className="bg-gray-900 border border-gray-800 rounded-2xl p-16 text-center">
            <Inbox size={34} className="mx-auto mb-4 text-gray-700" />
            <p className="text-lg font-semibold mb-1">Chưa có thông báo nào</p>
            <p className="text-sm text-gray-500">
              Khi có vé mới, kết quả duyệt hay thay đổi buổi diễn, thông báo sẽ hiện ở đây.
            </p>
          </div>
        ) : (
          <div className="bg-gray-900 border border-gray-800 rounded-2xl divide-y divide-gray-800 overflow-hidden">
            {items.map((n) => {
              const link = buildLink(n, role)
              const ruot = (
                <div className={`px-5 py-4 transition-colors hover:bg-gray-800/50 ${n.isRead ? '' : 'bg-[#C3B665]/5'}`}>
                  <div className="flex items-start gap-3">
                    {n.isRead
                      ? <span className="mt-1.5 w-2 h-2 flex-shrink-0" />
                      : <span className="mt-1.5 w-2 h-2 rounded-full bg-[#C3B665] flex-shrink-0" />}
                    <div className="min-w-0">
                      <p className={`text-sm ${n.isRead ? 'text-gray-400' : 'text-white font-semibold'}`}>{n.title}</p>
                      {n.body && <p className="text-sm text-gray-500 mt-1 leading-relaxed">{n.body}</p>}
                      <p className="text-xs text-gray-600 mt-1.5">
                        {dayjs(n.createdAt).format('HH:mm DD/MM/YYYY')}
                      </p>
                    </div>
                  </div>
                </div>
              )

              // Không có link là bình thường (loại chưa có màn, hoặc vai trò không vào được) —
              // vẫn bấm được để đánh dấu đã đọc, chỉ là không đi đâu.
              return link ? (
                <Link key={n.id} to={link} onClick={() => danhDauDaDoc(n)} className="block">
                  {ruot}
                </Link>
              ) : (
                <button key={n.id} onClick={() => danhDauDaDoc(n)} className="block w-full text-left">
                  {ruot}
                </button>
              )
            })}
          </div>
        )}

        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-3 mt-6">
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
      </div>
    </div>
  )
}

export default NotificationsPage
