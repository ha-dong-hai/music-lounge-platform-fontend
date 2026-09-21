// src/components/mshow-detail/EventMap.jsx
import { useState, useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import { MapPin, Check, Lock, Loader2, Minus, Plus, Ticket, Timer, Info } from 'lucide-react'
import dayjs from 'dayjs'
import toast from 'react-hot-toast'
import { getTicketTiers } from '../../services/showServices'
import { holdTicket, cancelHold, purchaseTicket } from '../../services/ticketServices'
import { useAuthStore } from '../../store/useAuthStore'
import Skeleton from '../shared/Skeleton'
import SeatingMapView from './SeatingMapView'

const formatVnd = (amount) => `${Number(amount || 0).toLocaleString('vi-VN')}đ`

const formatCountdown = (secondsLeft) => {
  const m = Math.max(0, Math.floor(secondsLeft / 60))
  const s = Math.max(0, secondsLeft % 60)
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
}

const ShowMap = ({ showData }) => {
  const { user } = useAuthStore()

  const [isLoading, setIsLoading] = useState(true)
  const [tiers, setTiers] = useState([])
  const [selectedPriceId, setSelectedPriceId] = useState(null)
  const [quantity, setQuantity] = useState(1)
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)
  const [hold, setHold] = useState(null) // { holdId, expiresAt, priceId, quantity }
  const [secondsLeft, setSecondsLeft] = useState(0)
  // Khu vực đang chọn trên sơ đồ — chỉ để LỌC danh sách hạng vé bên dưới, không tham gia vào việc
  // giữ chỗ hay thanh toán. null = xem tất cả khu vực.
  const [zoneDangChon, setZoneDangChon] = useState(null)
  const countdownRef = useRef(null)

  const showId = showData?.id
  // Chính sách huỷ vé lấy từ chi tiết buổi diễn. Có thể vắng (dữ liệu cũ, hoặc bản API chưa trả) —
  // lúc đó KHÔNG hiện khối, chứ không bịa ra điều khoản.
  const chinhSach = showData?.refundPolicy ?? null

  useEffect(() => {
    if (!showId) return
    const fetchTiers = async () => {
      setIsLoading(true)
      try {
        const res = await getTicketTiers(showId)
        if (res.success) {
          setTiers(res.data)
        }
      } catch (err) {
        console.error('Error loading ticket tiers:', err)
      } finally {
        setIsLoading(false)
      }
    }
    fetchTiers()
  }, [showId])

  // Đếm ngược thời hạn giữ chỗ theo mốc thật server trả về (expiresAt), không phải hardcode
  useEffect(() => {
    clearInterval(countdownRef.current)
    if (!hold) return

    const tick = () => {
      const left = Math.round((new Date(hold.expiresAt).getTime() - Date.now()) / 1000)
      setSecondsLeft(left)
      if (left <= 0) {
        clearInterval(countdownRef.current)
        setHold(null)
        toast.error('Đã hết thời gian giữ chỗ, vui lòng chọn lại.')
      }
    }
    tick()
    countdownRef.current = setInterval(tick, 1000)
    return () => clearInterval(countdownRef.current)
  }, [hold])

  // Lọc theo khu vực chọn trên sơ đồ. TicketTierSummaryDto có zoneId, nên lọc được ngay ở FE
  // không cần gọi lại API. Hạng vé không gắn khu vực nào (zoneId null) chỉ hiện khi xem tất cả —
  // hiện nó trong lúc đang lọc một khu vực là nói sai rằng nó thuộc khu đó.
  const allPrices = tiers
    .filter((tier) => zoneDangChon == null || tier.zoneId === zoneDangChon)
    .flatMap((tier) =>
      (tier.prices || [])
        .filter((p) => p.purchaseChannel !== 'Offline')
        .map((p) => ({ ...p, tierName: tier.name, tierId: tier.id }))
    )
  const selectedPrice = allPrices.find((p) => p.id === selectedPriceId) || null

  const handleSelectPrice = (price) => {
    if (hold) return // đang giữ chỗ dở dang thì không đổi lựa chọn
    setSelectedPriceId(price.id)
    setQuantity(1)
  }

  const maxQuantity = selectedPrice?.availableSlots ?? 10
  const adjustQuantity = (delta) => {
    setQuantity((q) => Math.min(Math.max(1, q + delta), Math.max(1, maxQuantity)))
  }

  const handleHold = async () => {
    if (!user) {
      setIsLoginModalOpen(true)
      return
    }
    if (!selectedPrice) return
    setIsProcessing(true)
    try {
      const res = await holdTicket(selectedPrice.id, quantity)
      if (res.success) {
        setHold({ holdId: res.data.holdId, expiresAt: res.data.expiresAt })
        toast.success('Đã giữ chỗ! Vui lòng thanh toán trước khi hết hạn.')
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Không thể giữ chỗ, vé có thể đã hết.')
    } finally {
      setIsProcessing(false)
    }
  }

  const handleCancelHold = async () => {
    if (!hold) return
    setIsProcessing(true)
    try {
      await cancelHold(hold.holdId)
    } catch (err) {
      console.error('Cancel hold error:', err)
    } finally {
      setHold(null)
      setIsProcessing(false)
    }
  }

  const handlePurchase = async () => {
    if (!hold) return
    setIsProcessing(true)
    try {
      const res = await purchaseTicket(hold.holdId)
      if (res.success) {
        window.location.href = res.data.paymentUrl
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Không thể khởi tạo thanh toán.')
      setIsProcessing(false)
    }
  }

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-card border border-line rounded-2xl p-8 flex items-center justify-center h-[450px]">
          <Loader2 size={32} className="animate-spin text-brand-text" />
        </div>
        <div className="lg:col-span-1"><Skeleton className="h-96 rounded-2xl" /></div>
      </div>
    )
  }

  return (
    <>
      {/* SƠ ĐỒ KHU VỰC — lớp xem đặt TRÊN luồng mua vé, không thay thế nó. Chọn một khu vực ở đây
          chỉ lọc danh sách hạng vé bên dưới; mọi bước giữ chỗ và thanh toán vẫn đi đường cũ. */}
      <div className="mb-6">
        <SeatingMapView
          showId={showId}
          selectedZoneId={zoneDangChon}
          onSelectZone={(id) => {
            // Đang giữ chỗ dở dang thì không cho đổi khu vực: đổi là lựa chọn hiện tại biến khỏi
            // danh sách trong khi vé vẫn đang bị giữ.
            if (hold) { toast.error('Đang giữ chỗ — hãy hoàn tất hoặc huỷ trước khi đổi khu vực.'); return }
            setZoneDangChon(id)
            setSelectedPriceId(null)
          }}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* DANH SÁCH HẠNG VÉ */}
        <div className="lg:col-span-2 bg-card border border-line rounded-2xl p-4 md:p-8">
          <h3 className="text-xl font-bold text-brand-text mb-6 flex items-center gap-2">
            <Ticket size={20} /> Ticket tiers
          </h3>

          {allPrices.length === 0 ? (
            <div className="flex flex-col items-center justify-center text-center py-16">
              <MapPin size={40} className="text-ink-mute mb-4" />
              <p className="text-ink-mute font-medium">
                {zoneDangChon != null
                  ? 'Khu vực này không còn hạng vé nào bán trực tuyến.'
                  : 'No tickets available for this show yet.'}
              </p>
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              {allPrices.map((price) => {
                const isSoldOut = price.availableSlots !== null && price.availableSlots <= 0
                const isSelected = selectedPriceId === price.id
                return (
                  <button
                    key={price.id}
                    type="button"
                    disabled={isSoldOut || !!hold}
                    onClick={() => handleSelectPrice(price)}
                    className={`w-full text-left flex items-center justify-between gap-4 p-4 rounded-lg border transition-colors ${
                      isSelected
                        ? 'border-brand bg-brand/10'
                        : 'border-line hover:border-line-strong'
                    } ${isSoldOut ? 'opacity-40 cursor-not-allowed' : 'cursor-pointer'} ${hold && !isSelected ? 'opacity-40' : ''}`}
                  >
                    <div className="min-w-0">
                      <p className="text-ink font-semibold truncate">{price.tierName} — {price.name}</p>
                      <p className="text-ink-mute text-xs mt-1">
                        {isSoldOut ? 'Sold out' : price.availableSlots != null ? `${price.availableSlots} left` : 'Available'}
                      </p>
                    </div>
                    <div className="flex items-center gap-3 flex-shrink-0">
                      <span className="text-brand-text font-bold">{formatVnd(price.price)}</span>
                      {isSelected && <Check size={18} className="text-brand-text" />}
                    </div>
                  </button>
                )
              })}
            </div>
          )}
        </div>

        {/* THÔNG TIN VÉ ĐÃ CHỌN + THANH TOÁN */}
        <div className="lg:col-span-1 bg-card border border-line rounded-2xl p-6 flex flex-col">
          <h3 className="text-xl font-bold text-brand-text mb-6">Đơn của bạn</h3>

          {!selectedPrice ? (
            <div className="flex-1 flex flex-col items-center justify-center text-center">
              <MapPin size={40} className="text-ink-mute mb-4" />
              <p className="text-ink-mute font-medium">Chưa chọn vé</p>
              <p className="text-ink-mute text-sm mt-1">Chọn một hạng vé ở bên trái.</p>
            </div>
          ) : (
            <div className="flex-1 flex flex-col gap-5">
              <div>
                <p className="text-ink font-semibold">{selectedPrice.tierName}</p>
                <p className="text-ink-mute text-sm">{selectedPrice.name}</p>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-ink-soft text-sm">Số lượng</span>
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    disabled={!!hold || quantity <= 1}
                    onClick={() => adjustQuantity(-1)}
                    className="w-8 h-8 flex items-center justify-center rounded-full border border-line text-ink-soft disabled:opacity-30"
                  >
                    <Minus size={14} />
                  </button>
                  <span className="text-ink font-bold w-6 text-center">{quantity}</span>
                  <button
                    type="button"
                    disabled={!!hold || quantity >= maxQuantity}
                    onClick={() => adjustQuantity(1)}
                    className="w-8 h-8 flex items-center justify-center rounded-full border border-line text-ink-soft disabled:opacity-30"
                  >
                    <Plus size={14} />
                  </button>
                </div>
              </div>

              <div className="border-t border-line pt-4 flex items-center justify-between">
                <span className="text-ink-soft text-sm">Tổng cộng</span>
                <span className="text-brand-text font-bold text-lg">
                  {formatVnd(selectedPrice.price * quantity)}
                </span>
              </div>

              {/* CHÍNH SÁCH HOÀN TIỀN — PHẢI HIỆN TRƯỚC KHI TRẢ TIỀN, KHÔNG ĐƯỢC BỎ.
                  Backend thêm khối `refundPolicy` đúng vì mục này: trước đó các cột điều kiện huỷ
                  vé đã tồn tại và ĐÃ ĐƯỢC ÁP DỤNG khi khách bấm huỷ, nhưng không nằm trong DTO nào
                  — nên khán giả quyết định mua mà không biết vé có hoàn được không, hoàn bao nhiêu,
                  tới khi nào. Chú thích của backend viện dẫn NĐ 85/2021.
                  `summary` là CÂU TIẾNG VIỆT DỰNG SẴN Ở MÁY CHỦ, cố ý vậy để mọi client nói cùng
                  một điều khoản và để câu chữ không lệch khỏi thứ lệnh huỷ vé thực sự áp dụng.
                  HIỆN NGUYÊN VĂN `summary`, đừng tự diễn đạt lại từ mấy con số bên dưới. */}
              {chinhSach && (
                <div className={`rounded-lg p-3 border ${
                  chinhSach.cancellationAllowed
                    ? 'bg-sunken/40 border-line'
                    : 'bg-yellow-500/5 border-yellow-500/30'
                }`}>
                  <p className="text-xs font-bold text-ink-soft flex items-center gap-1.5">
                    <Info size={12} /> Điều kiện huỷ vé
                  </p>
                  <p className="text-xs text-ink-soft mt-1.5 leading-relaxed">{chinhSach.summary}</p>
                  {chinhSach.cancellationAllowed && chinhSach.cancelBefore && (
                    <p className="text-xs text-ink-mute mt-1.5">
                      Huỷ được tới {dayjs(chinhSach.cancelBefore).format('HH:mm DD/MM/YYYY')}.
                    </p>
                  )}
                  {chinhSach.alwaysFullRefundIfVenueCancels && (
                    <p className="text-xs text-ink-mute mt-1">
                      Nếu phòng trà huỷ buổi diễn thì bạn được hoàn 100%, bất kể điều kiện trên.
                    </p>
                  )}
                </div>
              )}

              {hold ? (
                <>
                  <div className="flex items-center justify-center gap-2 bg-sunken/70 border border-brand/40 rounded-lg py-2.5">
                    <Timer size={16} className="text-brand-text" />
                    <span className="text-brand-text font-mono font-bold">{formatCountdown(secondsLeft)}</span>
                    <span className="text-ink-mute text-xs">còn lại để thanh toán</span>
                  </div>
                  <button
                    onClick={handlePurchase}
                    disabled={isProcessing}
                    className="w-full py-3 bg-brand text-on-brand rounded-lg font-bold hover:bg-brand-hover transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {isProcessing ? <Loader2 size={18} className="animate-spin" /> : 'Pay now'}
                  </button>
                  <button
                    onClick={handleCancelHold}
                    disabled={isProcessing}
                    className="w-full py-2.5 border border-line text-ink-soft rounded-lg font-medium hover:bg-sunken transition-colors"
                  >
                    Huỷ giữ chỗ
                  </button>
                </>
              ) : (
                <button
                  onClick={handleHold}
                  disabled={isProcessing}
                  className="w-full py-3 bg-brand text-on-brand rounded-lg font-bold hover:bg-brand-hover transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {isProcessing ? <Loader2 size={18} className="animate-spin" /> : 'Buy ticket'}
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* MODAL YÊU CẦU ĐĂNG NHẬP */}
      {isLoginModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-espresso/80 backdrop-blur-sm" onClick={() => setIsLoginModalOpen(false)}></div>
          <div className="relative bg-card border border-line rounded-2xl w-full max-w-md p-6 shadow-2xl text-center">
            <div className="w-16 h-16 mx-auto bg-brand/10 rounded-full flex items-center justify-center mb-4 border border-brand/30">
              <Lock size={28} className="text-brand-text" />
            </div>
            <h2 className="text-xl font-bold text-ink mb-2">Cần đăng nhập</h2>
            <p className="text-ink-soft mb-6">Vui lòng đăng nhập để mua vé.</p>
            <div className="flex gap-3">
              <button onClick={() => setIsLoginModalOpen(false)} className="flex-1 py-2.5 border border-line text-ink-soft rounded-lg font-medium hover:bg-sunken transition-colors">
                Cancel
              </button>
              <Link to="/login" className="flex-1 py-2.5 bg-brand text-on-brand rounded-lg font-bold hover:bg-brand-hover transition-colors flex items-center justify-center">
                Login
              </Link>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

export default ShowMap
