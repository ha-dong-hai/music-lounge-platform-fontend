import { useState, useEffect, useMemo } from 'react'
import { useParams, Link } from 'react-router-dom'
import { Loader2, Plus, Minus, ShoppingCart, ArrowLeft, CreditCard, Receipt } from 'lucide-react'
import dayjs from 'dayjs'
import toast from 'react-hot-toast'
import { getLoungeDetail } from '../../services/loungeServices'
import { getMenus, getMenuItems, createFnbOrder, getMyFnbOrders, payFnbOrder } from '../../services/fnbServices'
import { useAuthStore } from '../../store/useAuthStore'
import { ghiNhoThanhToan, LOAI_THANH_TOAN } from '../../utils/paymentContext'

const fmtMoney = (v) => `${Number(v || 0).toLocaleString('vi-VN')}đ`

const STATUS_LABELS = {
  Pending: 'Chờ xác nhận',
  Preparing: 'Đang chuẩn bị',
  Served: 'Đã phục vụ',
  Paid: 'Đã thanh toán',
  Cancelled: 'Đã huỷ',
}

const FnbOrderPage = () => {
  const { id: loungeId } = useParams()
  const user = useAuthStore((s) => s.user)

  const [lounge, setLounge] = useState(null)
  const [items, setItems] = useState([])
  const [cart, setCart] = useState({}) // { [menuItemId]: quantity }
  const [tableNote, setTableNote] = useState('')
  const [orders, setOrders] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [busy, setBusy] = useState(null)

  const loadOrders = async () => {
    if (!user) return
    try {
      const res = await getMyFnbOrders({ pageSize: 10 })
      if (res.success) {
        // API trả đơn của mọi phòng trà — lọc lại đúng phòng đang xem cho đỡ rối.
        setOrders(res.data.items.filter((o) => String(o.loungeId) === String(loungeId)))
      }
    } catch {
      // Không chặn cả trang chỉ vì phần lịch sử đơn lỗi.
    }
  }

  useEffect(() => {
    const run = async () => {
      setIsLoading(true)
      try {
        const [lRes, mRes] = await Promise.all([getLoungeDetail(loungeId), getMenus(loungeId)])
        if (lRes.success) setLounge(lRes.data)

        const menus = (mRes.data?.items || mRes.data || []).filter((m) => m.isActive)
        // Mỗi thực đơn là 1 lần gọi riêng — gộp song song rồi nối lại.
        const itemLists = await Promise.all(menus.map((m) => getMenuItems(m.id)))
        const all = itemLists.flatMap((r) => r.data?.items || r.data || [])
        setItems(all.filter((i) => i.isAvailable))

        await loadOrders()
      } catch {
        toast.error('Không tải được thực đơn.')
      } finally {
        setIsLoading(false)
      }
    }
    run()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loungeId])

  const grouped = useMemo(() => {
    const g = {}
    items.forEach((i) => {
      if (!g[i.category]) g[i.category] = []
      g[i.category].push(i)
    })
    return g
  }, [items])

  const cartTotal = useMemo(
    () => Object.entries(cart).reduce((sum, [id, qty]) => {
      const item = items.find((i) => String(i.id) === String(id))
      return sum + (item ? item.price * qty : 0)
    }, 0),
    [cart, items]
  )

  const cartCount = Object.values(cart).reduce((a, b) => a + b, 0)

  const changeQty = (itemId, delta) => {
    setCart((prev) => {
      const next = { ...prev }
      const q = (next[itemId] || 0) + delta
      if (q <= 0) delete next[itemId]
      else next[itemId] = q
      return next
    })
  }

  const handleSubmit = async () => {
    if (!cartCount) return
    setBusy('submit')
    try {
      const payload = {
        loungeId: Number(loungeId),
        tableNote: tableNote.trim() || null,
        items: Object.entries(cart).map(([menuItemId, quantity]) => ({
          menuItemId: Number(menuItemId), quantity, note: null,
        })),
      }
      const res = await createFnbOrder(payload)
      if (res.success) {
        toast.success('Đã gửi đơn tới quầy. Bạn có thể trả tiền mặt hoặc chuyển sang trả online.')
        setCart({})
        setTableNote('')
        await loadOrders()
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Không gửi được đơn.')
    } finally {
      setBusy(null)
    }
  }

  const handlePayOnline = async (orderId) => {
    setBusy(`pay-${orderId}`)
    try {
      const res = await payFnbOrder(orderId)
      if (res.success && res.data?.paymentUrl) {
        // Kèm đường quay về đúng thực đơn của quán khách đang ngồi.
        ghiNhoThanhToan(LOAI_THANH_TOAN.GOI_MON, window.location.pathname)
        window.location.assign(res.data.paymentUrl)
        return
      }
      toast.error('Không nhận được liên kết thanh toán.')
    } catch (err) {
      toast.error(err.response?.data?.message || 'Không khởi tạo được thanh toán.')
    } finally {
      setBusy(null)
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-[60vh] bg-page flex items-center justify-center">
        <Loader2 size={32} className="animate-spin text-ink" />
      </div>
    )
  }

  return (
    <div className="min-h-[60vh] bg-page text-ink px-4 sm:px-6 py-8 max-w-5xl mx-auto">
      <Link to={`/lounge/${loungeId}`} className="inline-flex items-center gap-2 text-ink-soft hover:text-ink text-sm mb-6">
        <ArrowLeft size={16} /> Quay lại phòng trà
      </Link>

      <h1 className="text-4xl mb-1">Đặt đồ uống &amp; món ăn</h1>
      <p className="text-ink-soft text-sm mb-8">{lounge?.name}</p>

      {!user && (
        <div className="bg-warning/5 border border-warning/20 p-4 mb-6">
          <p className="text-warning text-sm">
            Bạn cần <Link to="/login" className="underline font-medium">đăng nhập</Link> để gửi đơn.
          </p>
        </div>
      )}

      {items.length === 0 ? (
        <div className="bg-card border border-line p-8 text-center text-ink-mute">
          Phòng trà này chưa có thực đơn.
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* THỰC ĐƠN */}
          <div className="lg:col-span-2 space-y-6">
            {Object.entries(grouped).map(([category, list]) => (
              <div key={category}>
                <h2 className="font-sans font-bold text-sm text-ink mb-3">{category}</h2>
                <div className="space-y-2">
                  {list.map((item) => (
                    <div key={item.id} className="bg-card border border-line p-4 flex items-center justify-between gap-4">
                      <div className="min-w-0">
                        <p className="text-ink font-medium">{item.name}</p>
                        {item.description && <p className="text-xs text-ink-mute mt-0.5">{item.description}</p>}
                        <p className="font-mono mt-1">{fmtMoney(item.price)}</p>
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        {cart[item.id] ? (
                          <>
                            <button type="button" onClick={() => changeQty(item.id, -1)} className="w-11 h-11 border-2 border-ink flex items-center justify-center hover:bg-ink hover:text-lamp" aria-label={`Bớt một ${item.name}`}>
                              <Minus size={16} aria-hidden="true" />
                            </button>
                            {/* Số lượng đọc lên khi đổi (aria-live): người dùng trình đọc màn hình biết lượt bấm đã có tác dụng. */}
                            <span className="w-8 text-center font-mono font-semibold" aria-live="polite" aria-label={`${cart[item.id]} phần ${item.name}`}>{cart[item.id]}</span>
                          </>
                        ) : null}
                        <button type="button" onClick={() => changeQty(item.id, 1)} className="w-11 h-11 bg-ink text-lamp flex items-center justify-center hover:bg-board" aria-label={`Thêm một ${item.name}`}>
                          <Plus size={16} aria-hidden="true" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>

          {/* GIỎ + ĐƠN CỦA TÔI */}
          <div className="space-y-4">
            <div className="bg-card border border-line p-5 sticky top-24">
              <h2 className="flex items-center gap-2 mb-4">
                <ShoppingCart size={18} className="text-ink" /> Đơn của bạn
              </h2>

              {cartCount === 0 ? (
                <p className="text-ink-mute text-sm">Chưa chọn món nào.</p>
              ) : (
                <>
                  <div className="space-y-2 mb-4">
                    {Object.entries(cart).map(([id, qty]) => {
                      const item = items.find((i) => String(i.id) === String(id))
                      if (!item) return null
                      return (
                        <div key={id} className="flex justify-between text-sm">
                          <span className="text-ink-soft">{item.name} × {qty}</span>
                          <span className="text-ink">{fmtMoney(item.price * qty)}</span>
                        </div>
                      )
                    })}
                  </div>

                  <label htmlFor="goi-mon-so-ban" className="block font-semibold mb-1">Số bàn hoặc vị trí <span className="font-normal text-ink-mute">(không bắt buộc)</span></label>
                  <input
                    id="goi-mon-so-ban"
                    value={tableNote}
                    onChange={(e) => setTableNote(e.target.value)}
                    className="w-full min-h-[44px] px-3 bg-card border-2 border-ink text-ink mb-3 focus:outline-none focus:ring-2 focus:ring-ink focus:ring-offset-2"
                  />

                  <div className="flex justify-between font-bold border-t border-line pt-3 mb-4">
                    <span>Tổng cộng</span>
                    <span className="text-ink">{fmtMoney(cartTotal)}</span>
                  </div>

                  <button
                    type="button"
                    onClick={handleSubmit}
                    disabled={!user || !!busy}
                    aria-describedby={!user ? 'goi-mon-can-dang-nhap' : undefined}
                    className="w-full min-h-[48px] bg-ink text-lamp font-semibold hover:bg-board disabled:opacity-50"
                  >
                    {busy === 'submit' ? 'Đang gửi…' : 'Gửi đơn tới quầy'}
                  </button>
                  {/* Nút bị khoá thì lý do phải nằm NGAY cạnh nút, không chỉ ở đầu trang. */}
                  {!user && (
                    <p id="goi-mon-can-dang-nhap" className="text-sm mt-2">
                      Cần <Link to="/login" state={{ from: `/lounge/${loungeId}/order` }} className="font-semibold underline underline-offset-4">đăng nhập</Link> để gửi đơn.
                    </p>
                  )}
                  <p className="text-sm text-ink-soft mt-2 leading-relaxed">
                    Đơn gửi đi mặc định là trả tiền mặt tại quầy. Sau khi gửi, bạn có thể chọn trả online.
                  </p>
                </>
              )}
            </div>

            {/* ĐƠN GẦN ĐÂY */}
            {orders.length > 0 && (
              <div className="bg-card border border-line p-5">
                <h2 className="flex items-center gap-2 mb-4">
                  <Receipt size={18} className="text-ink" /> Đơn gần đây
                </h2>
                <div className="space-y-3">
                  {orders.map((o) => (
                    <div key={o.id} className="border border-line p-3">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm font-medium">#{o.id}</span>
                        <span className="text-xs px-2 py-0.5 bg-sunken text-ink-soft">
                          {STATUS_LABELS[o.status] || o.status}
                        </span>
                      </div>
                      <p className="text-xs text-ink-mute">{dayjs(o.createdAt).format('HH:mm DD/MM/YYYY')}</p>
                      <p className="text-sm text-ink font-bold mt-1">{fmtMoney(o.totalAmount)}</p>
                      <p className="text-xs mt-1">
                        {o.isPaid
                          ? <span className="text-success">Đã thanh toán</span>
                          : <span className="text-warning">Chưa thanh toán</span>}
                      </p>

                      {/* Chỉ mời trả online khi đơn thật sự chưa trả và chưa bị huỷ. */}
                      {!o.isPaid && o.status !== 'Cancelled' && (
                        <button
                          onClick={() => handlePayOnline(o.id)}
                          disabled={!!busy}
                          className="mt-2 w-full inline-flex items-center justify-center gap-1.5 py-2 border border-ink text-ink text-xs font-bold hover:bg-board hover:text-lamp transition-colors disabled:opacity-50"
                        >
                          <CreditCard size={14} />
                          {busy === `pay-${o.id}` ? 'Đang chuyển...' : 'Trả online'}
                        </button>
                      )}
                      {o.onlinePaymentLiveUntil && !o.isPaid && (
                        <p className="text-[11px] text-ink-mute mt-1.5">
                          Đang có liên kết thanh toán còn hiệu lực tới {dayjs(o.onlinePaymentLiveUntil).format('HH:mm')} —
                          trong lúc này quầy không thu tiền mặt được.
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

export default FnbOrderPage
