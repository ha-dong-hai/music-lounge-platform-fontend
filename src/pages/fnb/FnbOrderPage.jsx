// src/pages/fnb/FnbOrderPage.jsx
//
// GHI CHÚ CHO ĐỘI FE:
// - Trang này dựng tối giản để nối thông luồng đặt món, KHÔNG qua quy trình thiết kế Stitch — đây là
//   màn khán giả nên nếu muốn đồng bộ thẩm mỹ với phần còn lại thì cần thiết kế lại.
// - Quy tắc backend phải tôn trọng, đừng "tối ưu" đi:
//     + Lúc TẠO đơn, paymentMethod bắt buộc là 'Cash'. Trả online là bước RIÊNG sau khi đã có đơn
//       (POST /fnb-orders/{id}/pay), vì trước đó chưa tồn tại bản ghi Payment nào.
//     + status (bếp làm tới đâu) TÁCH BIỆT với isPaid (đã trả tiền chưa). Đơn trả trước qua VNPay
//       vẫn nằm ở Pending/Preparing cho tới khi phục vụ xong — không được suy isPaid từ status.
//     + onlinePaymentLiveUntil != null nghĩa là đang có link VNPay còn hiệu lực; trong lúc đó backend
//       từ chối thu tiền mặt và từ chối huỷ đơn.
// - Chưa nối chọn khu vực (zoneId) vì chưa có UI chọn bàn/khu — hiện chỉ gửi ghi chú bàn dạng chữ.
import { useState, useEffect, useMemo } from 'react'
import { useParams, Link } from 'react-router-dom'
import { Loader2, Plus, Minus, ShoppingCart, ArrowLeft, CreditCard, Receipt } from 'lucide-react'
import dayjs from 'dayjs'
import toast from 'react-hot-toast'
import { getLoungeDetail } from '../../services/loungeServices'
import { getMenus, getMenuItems, createFnbOrder, getMyFnbOrders, payFnbOrder } from '../../services/fnbServices'
import { useAuthStore } from '../../store/useAuthStore'

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
      <div className="min-h-screen bg-black flex items-center justify-center">
        <Loader2 size={32} className="animate-spin text-[#C3B665]" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-black text-white px-4 sm:px-6 py-8 max-w-5xl mx-auto">
      <Link to={`/lounge/${loungeId}`} className="inline-flex items-center gap-2 text-gray-400 hover:text-white text-sm mb-6">
        <ArrowLeft size={16} /> Quay lại phòng trà
      </Link>

      <h1 className="text-2xl font-bold mb-1">Đặt đồ uống &amp; món ăn</h1>
      <p className="text-gray-400 text-sm mb-8">{lounge?.name}</p>

      {!user && (
        <div className="bg-yellow-500/5 border border-yellow-500/20 rounded-xl p-4 mb-6">
          <p className="text-yellow-400 text-sm">
            Bạn cần <Link to="/login" className="underline font-medium">đăng nhập</Link> để gửi đơn.
          </p>
        </div>
      )}

      {items.length === 0 ? (
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-8 text-center text-gray-500">
          Phòng trà này chưa có thực đơn.
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* THỰC ĐƠN */}
          <div className="lg:col-span-2 space-y-6">
            {Object.entries(grouped).map(([category, list]) => (
              <div key={category}>
                <h2 className="text-sm font-semibold text-[#C3B665] mb-3 uppercase tracking-wide">{category}</h2>
                <div className="space-y-2">
                  {list.map((item) => (
                    <div key={item.id} className="bg-gray-900 border border-gray-800 rounded-xl p-4 flex items-center justify-between gap-4">
                      <div className="min-w-0">
                        <p className="text-white font-medium">{item.name}</p>
                        {item.description && <p className="text-xs text-gray-500 mt-0.5">{item.description}</p>}
                        <p className="text-[#C3B665] text-sm font-bold mt-1">{fmtMoney(item.price)}</p>
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        {cart[item.id] ? (
                          <>
                            <button onClick={() => changeQty(item.id, -1)} className="w-8 h-8 rounded-lg border border-gray-700 flex items-center justify-center hover:border-[#C3B665] hover:text-[#C3B665]">
                              <Minus size={14} />
                            </button>
                            <span className="w-6 text-center font-bold">{cart[item.id]}</span>
                          </>
                        ) : null}
                        <button onClick={() => changeQty(item.id, 1)} className="w-8 h-8 rounded-lg bg-[#C3B665] text-black flex items-center justify-center hover:bg-[#d4c87f]">
                          <Plus size={14} />
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
            <div className="bg-gray-900 border border-gray-800 rounded-xl p-5 sticky top-24">
              <h2 className="font-bold flex items-center gap-2 mb-4">
                <ShoppingCart size={18} className="text-[#C3B665]" /> Đơn của bạn
              </h2>

              {cartCount === 0 ? (
                <p className="text-gray-500 text-sm">Chưa chọn món nào.</p>
              ) : (
                <>
                  <div className="space-y-2 mb-4">
                    {Object.entries(cart).map(([id, qty]) => {
                      const item = items.find((i) => String(i.id) === String(id))
                      if (!item) return null
                      return (
                        <div key={id} className="flex justify-between text-sm">
                          <span className="text-gray-300">{item.name} × {qty}</span>
                          <span className="text-white">{fmtMoney(item.price * qty)}</span>
                        </div>
                      )
                    })}
                  </div>

                  <input
                    value={tableNote}
                    onChange={(e) => setTableNote(e.target.value)}
                    placeholder="Số bàn / vị trí (không bắt buộc)"
                    className="w-full px-3 py-2 bg-black border border-gray-700 rounded-lg text-sm placeholder:text-gray-600 mb-3"
                  />

                  <div className="flex justify-between font-bold border-t border-gray-800 pt-3 mb-4">
                    <span>Tổng cộng</span>
                    <span className="text-[#C3B665]">{fmtMoney(cartTotal)}</span>
                  </div>

                  <button
                    onClick={handleSubmit}
                    disabled={!user || !!busy}
                    className="w-full py-2.5 rounded-lg bg-[#C3B665] text-black font-bold text-sm hover:bg-[#d4c87f] disabled:opacity-50"
                  >
                    {busy === 'submit' ? 'Đang gửi...' : 'Gửi đơn tới quầy'}
                  </button>
                  <p className="text-[11px] text-gray-600 mt-2 leading-relaxed">
                    Đơn gửi đi mặc định là trả tiền mặt tại quầy. Sau khi gửi, bạn có thể chọn trả online.
                  </p>
                </>
              )}
            </div>

            {/* ĐƠN GẦN ĐÂY */}
            {orders.length > 0 && (
              <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
                <h2 className="font-bold flex items-center gap-2 mb-4">
                  <Receipt size={18} className="text-[#C3B665]" /> Đơn gần đây
                </h2>
                <div className="space-y-3">
                  {orders.map((o) => (
                    <div key={o.id} className="border border-gray-800 rounded-lg p-3">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm font-medium">#{o.id}</span>
                        <span className="text-xs px-2 py-0.5 rounded-full bg-gray-800 text-gray-300">
                          {STATUS_LABELS[o.status] || o.status}
                        </span>
                      </div>
                      <p className="text-xs text-gray-500">{dayjs(o.createdAt).format('HH:mm DD/MM/YYYY')}</p>
                      <p className="text-sm text-[#C3B665] font-bold mt-1">{fmtMoney(o.totalAmount)}</p>
                      <p className="text-xs mt-1">
                        {o.isPaid
                          ? <span className="text-green-400">Đã thanh toán</span>
                          : <span className="text-yellow-400">Chưa thanh toán</span>}
                      </p>

                      {/* Chỉ mời trả online khi đơn thật sự chưa trả và chưa bị huỷ. */}
                      {!o.isPaid && o.status !== 'Cancelled' && (
                        <button
                          onClick={() => handlePayOnline(o.id)}
                          disabled={!!busy}
                          className="mt-2 w-full inline-flex items-center justify-center gap-1.5 py-2 rounded-lg border border-[#C3B665] text-[#C3B665] text-xs font-bold hover:bg-[#C3B665] hover:text-black transition-colors disabled:opacity-50"
                        >
                          <CreditCard size={14} />
                          {busy === `pay-${o.id}` ? 'Đang chuyển...' : 'Trả online'}
                        </button>
                      )}
                      {o.onlinePaymentLiveUntil && !o.isPaid && (
                        <p className="text-[11px] text-gray-500 mt-1.5">
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
