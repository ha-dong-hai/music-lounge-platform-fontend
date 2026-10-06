// src/pages/user/CheckoutPage.jsx
import { useState, useEffect } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { ArrowLeft, Clock, MapPin, CreditCard, Lock, Loader2 } from 'lucide-react'
import { useAuthStore } from '../../store/useAuthStore'
import { showService } from '../../services/showService'
import { ticketTierService } from '../../services/ticketTierService'
import { ticketService } from '../../services/ticketService'
import toast from 'react-hot-toast'
import dayjs from 'dayjs'

const CheckoutPage = () => {
  const { id: showId } = useParams()
  const navigate = useNavigate()
  const { isAuthenticated, user } = useAuthStore()

  const [show, setShow] = useState(null)
  const [tiers, setTiers] = useState([])
  const [selectedTier, setSelectedTier] = useState(null)
  const [selectedPrice, setSelectedPrice] = useState(null)
  const [quantity, setQuantity] = useState(1)
  const [isLoading, setIsLoading] = useState(true)
  const [holdData, setHoldData] = useState(null)
  const [isHolding, setIsHolding] = useState(false)
  const [isPurchasing, setIsPurchasing] = useState(false)
  const [holdTimeLeft, setHoldTimeLeft] = useState(0)

  // Fetch show + ticket tiers
  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true)
      try {
        const [showRes, tiersRes] = await Promise.all([
          showService.getDetail(showId),
          ticketTierService.getByShow(showId),
        ])
        if (showRes.success) setShow(showRes.data)
        if (tiersRes.success) {
          const tierList = Array.isArray(tiersRes.data) ? tiersRes.data : (tiersRes.data?.items || [])
          setTiers(tierList)
          if (tierList.length > 0) {
            setSelectedTier(tierList[0])
            if (tierList[0].prices?.length > 0) {
              setSelectedPrice(tierList[0].prices[0])
            }
          }
        }
      } catch (err) {
        toast.error('Không thể tải thông tin vé')
      } finally {
        setIsLoading(false)
      }
    }
    fetchData()
  }, [showId])

  // Hold countdown timer
  useEffect(() => {
    if (!holdData || holdTimeLeft <= 0) return
    const timer = setInterval(() => {
      setHoldTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(timer)
          toast.error('Hết thời gian giữ vé! Vui lòng thử lại.')
          setHoldData(null)
          return 0
        }
        return prev - 1
      })
    }, 1000)
    return () => clearInterval(timer)
  }, [holdData])

  // Cancel hold on unmount
  useEffect(() => {
    return () => {
      if (holdData?.holdId) {
        ticketService.cancelHold(holdData.holdId).catch(() => {})
      }
    }
  }, [holdData])

  const handleHoldTicket = async () => {
    if (!selectedPrice) {
      toast.error('Vui lòng chọn loại vé')
      return
    }
    setIsHolding(true)
    try {
      const res = await ticketService.holdTicket({
        priceId: selectedPrice.id,
        quantity,
      })
      if (res.success && res.data) {
        setHoldData(res.data)
        setHoldTimeLeft(res.data.expiresInSeconds || 15 * 60)
        toast.success('Đã giữ vé thành công! Tiến hành thanh toán.')
      } else {
        toast.error(res.message || 'Không thể giữ vé')
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Không thể giữ vé. Vé có thể đã hết.')
    } finally {
      setIsHolding(false)
    }
  }

  const handlePurchase = async () => {
    if (!holdData?.holdId) return
    setIsPurchasing(true)
    try {
      const res = await ticketService.purchaseTicket({ holdId: holdData.holdId })
      if (res.success && res.data) {
        if (res.data.paymentUrl) {
          window.location.href = res.data.paymentUrl
        } else {
          toast.success('Mua vé thành công!')
          navigate('/my-shows')
        }
      } else {
        toast.error(res.message || 'Thanh toán thất bại')
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Thanh toán thất bại')
    } finally {
      setIsPurchasing(false)
    }
  }

  const formatPrice = (price) => new Intl.NumberFormat('vi-VN').format(price) + 'đ'

  // Auth guard
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-black flex flex-col items-center justify-center text-white px-4">
        <Lock size={48} className="text-[#C3B665] mb-6" />
        <h1 className="text-2xl font-bold mb-2">Vui lòng đăng nhập</h1>
        <p className="text-gray-400 mb-8 text-center">Bạn cần đăng nhập để tiếp tục thanh toán.</p>
        <Link to="/login" className="bg-[#C3B665] text-black px-8 py-3 rounded-lg font-bold hover:bg-[#d4c87f] transition-colors">
          Đi tới trang đăng nhập
        </Link>
      </div>
    )
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <Loader2 size={32} className="auth-btn-spinner text-[#C3B665]" />
      </div>
    )
  }

  if (!show) {
    return (
      <div className="min-h-screen bg-black flex flex-col items-center justify-center text-white">
        <p className="text-xl mb-4">Không tìm thấy thông tin show.</p>
        <Link to="/" className="text-[#C3B665] hover:underline">Về trang chủ</Link>
      </div>
    )
  }

  const minutes = Math.floor(holdTimeLeft / 60).toString().padStart(2, '0')
  const seconds = (holdTimeLeft % 60).toString().padStart(2, '0')

  return (
    <div className="min-h-screen bg-black text-white pb-16">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
        <div className="mb-8">
          <Link to={`/shows/${showId}`} className="inline-flex items-center gap-2 text-sm font-medium text-gray-400 hover:text-[#C3B665] transition-colors">
            <ArrowLeft size={18} /> Quay lại
          </Link>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
          {/* Left: Show Info + Tier Selection */}
          <div className="lg:col-span-3 space-y-6">
            <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6">
              <h2 className="text-xl font-bold text-[#C3B665] mb-6">Thông tin chương trình</h2>
              <div className="space-y-4">
                <div>
                  <p className="text-gray-500 text-sm mb-1">Chương trình</p>
                  <h3 className="text-white text-2xl font-bold">{show.name}</h3>
                </div>
                <div>
                  <p className="text-gray-500 text-sm mb-1">Thời gian</p>
                  <p className="text-white flex items-center gap-2">
                    <Clock size={16} className="text-[#C3B665]" />
                    {dayjs(show.scheduledStart).format('HH:mm - dddd, DD/MM/YYYY')}
                  </p>
                </div>
                {show.loungeName && (
                  <div>
                    <p className="text-gray-500 text-sm mb-1">Địa điểm</p>
                    <p className="text-white flex items-center gap-2">
                      <MapPin size={16} className="text-[#C3B665]" />
                      {show.loungeName}
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Ticket Tiers */}
            <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6">
              <h2 className="text-xl font-bold text-[#C3B665] mb-6">Chọn loại vé</h2>
              {tiers.length === 0 ? (
                <p className="text-gray-400">Chưa có vé mở bán cho chương trình này.</p>
              ) : (
                <div className="space-y-3">
                  {tiers.map(tier => (
                    <div
                      key={tier.id}
                      className={`border rounded-xl p-4 cursor-pointer transition-all ${
                        selectedTier?.id === tier.id ? 'border-[#C3B665] bg-[#C3B665]/5' : 'border-gray-800 hover:border-gray-600'
                      }`}
                      onClick={() => { setSelectedTier(tier); if (tier.prices?.length > 0) setSelectedPrice(tier.prices[0]); setHoldData(null) }}
                    >
                      <div className="flex justify-between items-center mb-2">
                        <h4 className="text-white font-bold text-lg">{tier.name}</h4>
                        <span className="text-gray-400 text-sm">Còn {tier.remainingCapacity ?? tier.totalCapacity} chỗ</span>
                      </div>
                      {tier.description && <p className="text-gray-400 text-sm mb-3">{tier.description}</p>}
                      
                      {tier.prices?.length > 0 && selectedTier?.id === tier.id && (
                        <div className="space-y-2 mt-3 pt-3 border-t border-gray-800">
                          {tier.prices.map(price => (
                            <label
                              key={price.id}
                              className={`flex items-center justify-between p-3 rounded-lg cursor-pointer transition-all ${
                                selectedPrice?.id === price.id ? 'bg-[#C3B665]/10 border border-[#C3B665]/50' : 'bg-black/30 border border-gray-800 hover:border-gray-600'
                              }`}
                              onClick={(e) => { e.stopPropagation(); setSelectedPrice(price); setHoldData(null) }}
                            >
                              <div className="flex items-center gap-3">
                                <input type="radio" name="price" checked={selectedPrice?.id === price.id} onChange={() => {}} className="accent-[#C3B665]" />
                                <span className="text-white text-sm">{price.name}</span>
                              </div>
                              <span className="text-[#C3B665] font-bold">{formatPrice(price.price)}</span>
                            </label>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Right: Payment Panel */}
          <div className="lg:col-span-2">
            <div className="sticky top-8 space-y-6">
              {holdData && holdTimeLeft > 0 && (
                <div className="bg-red-500/10 border border-red-500/30 rounded-2xl p-5 text-center">
                  <p className="text-red-400 text-sm font-medium mb-1 flex items-center justify-center gap-1.5">
                    <Clock size={14} /> Thời gian còn lại
                  </p>
                  <p className="text-4xl font-bold text-white tracking-wider font-mono">{minutes}:{seconds}</p>
                  <p className="text-gray-500 text-xs mt-1">Vé sẽ tự động trả lại khi hết giờ</p>
                </div>
              )}

              <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 space-y-5">
                <h3 className="text-white font-bold text-lg">Tóm tắt đơn hàng</h3>
                {selectedPrice ? (
                  <div className="space-y-3">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-400">{selectedTier?.name}</span>
                      <span className="text-white">{selectedPrice.name}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-400 text-sm">Số lượng</span>
                      <div className="flex items-center gap-3">
                        <button className="w-8 h-8 rounded-lg bg-gray-800 text-white font-bold hover:bg-gray-700 disabled:opacity-30" onClick={() => { setQuantity(q => Math.max(1, q - 1)); setHoldData(null) }} disabled={quantity <= 1}>-</button>
                        <span className="text-white font-bold w-8 text-center">{quantity}</span>
                        <button className="w-8 h-8 rounded-lg bg-gray-800 text-white font-bold hover:bg-gray-700 disabled:opacity-30" onClick={() => { setQuantity(q => Math.min(10, q + 1)); setHoldData(null) }} disabled={quantity >= 10}>+</button>
                      </div>
                    </div>
                    <div className="border-t border-gray-800 pt-3 flex justify-between items-center">
                      <span className="text-gray-400">Tổng tiền</span>
                      <span className="text-[#C3B665] text-2xl font-bold">{formatPrice(selectedPrice.price * quantity)}</span>
                    </div>
                  </div>
                ) : (
                  <p className="text-gray-500 text-sm">Vui lòng chọn loại vé.</p>
                )}

                {!holdData ? (
                  <button
                    onClick={handleHoldTicket}
                    disabled={!selectedPrice || isHolding}
                    className="w-full bg-[#C3B665] text-black py-3 rounded-lg font-bold hover:bg-[#d4c87f] transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    {isHolding ? <><Loader2 size={20} className="auth-btn-spinner" /> Đang giữ vé...</> : 'Giữ vé & Thanh toán'}
                  </button>
                ) : (
                  <button
                    onClick={handlePurchase}
                    disabled={isPurchasing}
                    className="w-full bg-[#C3B665] text-black py-3 rounded-lg font-bold hover:bg-[#d4c87f] transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {isPurchasing ? <><Loader2 size={20} className="auth-btn-spinner" /> Đang chuyển tới VNPay...</> : <><CreditCard size={20} /> Thanh toán qua VNPay</>}
                  </button>
                )}

                <p className="text-gray-600 text-xs text-center">Thanh toán an toàn qua cổng VNPay</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default CheckoutPage