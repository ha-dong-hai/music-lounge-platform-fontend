// src/components/mshow-detail/EventMap.jsx
import { useState, useEffect, useRef, useMemo } from 'react'
import { Link } from 'react-router-dom'
import { MapPin, Check, Lock, Loader2, Minus, Plus, Ticket, Timer, Info } from 'lucide-react'
import { gioTrongNgay, ngayDayDu } from '../../utils/ngayVietNam'
import toast from 'react-hot-toast'
import { getTicketTiers } from '../../services/showServices'
import { holdTicket, cancelHold, purchaseTicket } from '../../services/ticketServices'
import { useAuthStore } from '../../store/useAuthStore'
import Skeleton from '../shared/Skeleton'
import SeatingMapView from './SeatingMapView'
import { ghiNhoThanhToan, LOAI_THANH_TOAN } from '../../utils/paymentContext'
import HopThoai, { TieuDeHop } from '../shared/HopThoai'
import { GhiChuGiaVe } from '../shared/DieuKhoanTien'

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
  // KHU ĐANG CHỌN TRÊN SƠ ĐỒ. MLACP-589 (chủ dự án 04/10/2026): mỗi khu gắn đúng MỘT hạng vé, nên chạm khu = chọn luôn
  // hạng vé của khu đó (không còn "lọc danh sách rồi chọn tiếp"). Ngược lại, chọn một mức giá trong danh sách thì khu của
  // hạng vé đó sáng lên trên sơ đồ — hai chỗ luôn nói cùng một lựa chọn. null = chưa chọn khu.
  const [zoneDangChon, setZoneDangChon] = useState(null)
  const [tenKhu, setTenKhu] = useState({}) // { [zoneId]: tên khu } — SeatingMapView báo lên, để ghi khu vào đơn
  const countdownRef = useRef(null)

  const showId = showData?.id
  // Chính sách huỷ vé lấy từ chi tiết buổi diễn. Có thể vắng (dữ liệu cũ, hoặc bản API chưa trả) —
  // lúc đó KHÔNG hiện khối, chứ không bịa ra điều khoản.
  const chinhSach = showData?.refundPolicy ?? null

  // Tải hạng vé LỖI khác hẳn "chưa mở bán": bản trước nuốt lỗi và rơi về câu "Buổi diễn này chưa mở bán
  // vé." — khách tưởng buổi diễn không bán, trong khi chỉ là mạng/máy chủ trục trặc (gặp 30/09 khi máy
  // chủ trả 429). Giữ riêng cờ lỗi để nói đúng và cho thử lại.
  const [loiTaiVe, setLoiTaiVe] = useState(false)
  const [lanTai, setLanTai] = useState(0)

  useEffect(() => {
    if (!showId) return
    const fetchTiers = async () => {
      setIsLoading(true)
      setLoiTaiVe(false)
      try {
        const res = await getTicketTiers(showId)
        if (res.success) {
          setTiers(res.data)
        }
      } catch (err) {
        console.error('Error loading ticket tiers:', err)
        setLoiTaiVe(true)
      } finally {
        setIsLoading(false)
      }
    }
    fetchTiers()
  }, [showId, lanTai])

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

  // Danh sách LUÔN in đủ mọi hạng vé bán trực tuyến (không lọc theo khu nữa): chọn ở sơ đồ hay ở danh sách đều ra cùng
  // một lựa chọn. Hạng vé không có khu (xem trực tuyến, hoặc hạng vé cũ chưa gắn khu) chỉ chọn được ở danh sách.
  const allPrices = tiers.flatMap((tier) =>
    (tier.prices || [])
      .filter((p) => p.purchaseChannel !== 'Offline')
      .map((p) => ({ ...p, tierName: tier.name, tierId: tier.id, zoneId: tier.zoneId ?? null }))
  )
  const selectedPrice = allPrices.find((p) => p.id === selectedPriceId) || null
  const conVe = (p) => p.availableSlots == null || p.availableSlots > 0
  // Tên hạng vé + giá của từng khu — in ngay trên sơ đồ để khán giả thấy "khu này là vé gì, bao nhiêu" trước khi chạm.
  // useMemo: object mới mỗi lần vẽ sẽ làm sơ đồ 3D dựng lại từ đầu — mà màn này vẽ lại MỖI GIÂY khi đang đếm ngược giữ chỗ.
  const hangVeTheoKhu = useMemo(() => Object.fromEntries(tiers.filter((t) => t.zoneId).map((t) => [t.zoneId, t.name])), [tiers])

  const handleSelectPrice = (price) => {
    if (hold) return // đang giữ chỗ dở dang thì không đổi lựa chọn
    setSelectedPriceId(price.id)
    setZoneDangChon(price.zoneId)
    setQuantity(1)
  }

  // Chạm một khu = chọn hạng vé của khu đó: lấy mức giá còn vé đầu tiên (hạng vé nhiều mức giá thì đổi mức ở danh sách).
  const chonKhu = (id) => {
    // Đang giữ chỗ dở dang thì không cho đổi: đổi là lựa chọn hiện tại biến mất trong khi vé vẫn đang bị giữ.
    if (hold) { toast.error('Đang giữ chỗ — hãy hoàn tất hoặc huỷ trước khi đổi khu vực.'); return }
    setZoneDangChon(id)
    if (id == null) { setSelectedPriceId(null); return }
    const gia = allPrices.filter((p) => p.zoneId === id)
    const chon = gia.find(conVe) ?? null
    setSelectedPriceId(chon?.id ?? null)
    setQuantity(1)
    if (!chon) toast.error(gia.length ? 'Khu này đã hết vé.' : 'Khu này không bán vé trực tuyến.')
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
        ghiNhoThanhToan(LOAI_THANH_TOAN.VE)
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
        <div className="lg:col-span-2 bg-card border border-line p-8 flex items-center justify-center h-[450px]">
          <Loader2 size={32} className="animate-spin text-ink" />
        </div>
        <div className="lg:col-span-1"><Skeleton className="h-96" /></div>
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
          loungeId={showData?.lounge?.id}
          tenPhongTra={showData?.lounge?.name ?? ''}
          selectedZoneId={zoneDangChon}
          hangVeTheoKhu={hangVeTheoKhu}
          onTaiKhu={setTenKhu}
          onSelectZone={chonKhu}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* DANH SÁCH HẠNG VÉ */}
        <div className="lg:col-span-2 bg-card border border-line p-4 md:p-8">
          <h3 className="text-xl font-bold text-ink mb-6 flex items-center gap-2">
            <Ticket size={20} /> Hạng vé
          </h3>

          {loiTaiVe ? (
            <div className="flex flex-col items-center justify-center text-center py-16">
              <MapPin size={40} className="text-ink-mute mb-4" />
              <p className="text-ink-mute font-medium">Chưa tải được danh sách hạng vé.</p>
              <button onClick={() => setLanTai((n) => n + 1)}
                className="mt-3 px-4 py-2 border border-line text-ink-soft text-sm font-bold hover:bg-sunken">
                Thử lại
              </button>
            </div>
          ) : allPrices.length === 0 ? (
            <div className="flex flex-col items-center justify-center text-center py-16">
              <MapPin size={40} className="text-ink-mute mb-4" />
              <p className="text-ink-mute font-medium">Buổi diễn này chưa mở bán vé.</p>
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
                    className={`w-full text-left flex items-center justify-between gap-4 p-4 border transition-colors ${
                      isSelected
                        ? 'border-ink bg-ink/10'
                        : 'border-line hover:border-line-strong'
                    } ${isSoldOut ? 'opacity-40 cursor-not-allowed' : 'cursor-pointer'} ${hold && !isSelected ? 'opacity-40' : ''}`}
                  >
                    <div className="min-w-0">
                      {/* Hạng vé chỉ có một mức giá thì tên hạng và tên mức giá thường trùng nhau ("Vé thường — Vé thường") — in một lần. */}
                      <p className="text-ink font-semibold truncate">{price.tierName === price.name ? price.name : `${price.tierName} — ${price.name}`}</p>
                      <p className="text-ink-mute text-xs mt-1">
                        {isSoldOut ? 'Hết vé' : price.availableSlots != null ? `Còn ${price.availableSlots}` : 'Còn vé'}
                        {price.zoneId && tenKhu[price.zoneId] && ` · ${tenKhu[price.zoneId]}`}
                      </p>
                    </div>
                    <div className="flex items-center gap-3 flex-shrink-0">
                      <span className="text-ink font-bold">{formatVnd(price.price)}</span>
                      {isSelected && <Check size={18} className="text-ink" />}
                    </div>
                  </button>
                )
              })}
            </div>
          )}
        </div>

        {/* THÔNG TIN VÉ ĐÃ CHỌN + THANH TOÁN */}
        <div className="lg:col-span-1 bg-card border border-line p-6 flex flex-col">
          <h3 className="text-xl font-bold text-ink mb-6">Đơn của bạn</h3>

          {!selectedPrice ? (
            <div className="flex-1 flex flex-col items-center justify-center text-center">
              <MapPin size={40} className="text-ink-mute mb-4" />
              <p className="text-ink-mute font-medium">Chưa chọn vé</p>
              <p className="text-ink-mute text-sm mt-1">Chạm một khu trên sơ đồ, hoặc chọn một hạng vé ở bên trái.</p>
            </div>
          ) : (
            <div className="flex-1 flex flex-col gap-5">
              <div>
                <p className="text-ink font-semibold">{selectedPrice.tierName}</p>
                {selectedPrice.name !== selectedPrice.tierName && <p className="text-ink-mute text-sm">{selectedPrice.name}</p>}
                {selectedPrice.zoneId && tenKhu[selectedPrice.zoneId] && (
                  <p className="text-ink-soft text-sm mt-1 flex items-center gap-1.5"><MapPin size={14} aria-hidden="true" /> {tenKhu[selectedPrice.zoneId]}</p>
                )}
              </div>

              <div className="flex items-center justify-between">
                <span className="text-ink-soft text-sm">Số lượng</span>
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    disabled={!!hold || quantity <= 1}
                    onClick={() => adjustQuantity(-1)}
                    aria-label="Bớt một vé"
                    className="w-11 h-11 flex items-center justify-center border border-ink text-ink hover:bg-ink hover:text-lamp disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:text-ink transition-colors"
                  >
                    <Minus size={16} aria-hidden="true" />
                  </button>
                  <span className="text-ink font-bold w-6 text-center">{quantity}</span>
                  <button
                    type="button"
                    disabled={!!hold || quantity >= maxQuantity}
                    onClick={() => adjustQuantity(1)}
                    aria-label="Thêm một vé"
                    className="w-11 h-11 flex items-center justify-center border border-ink text-ink hover:bg-ink hover:text-lamp disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:text-ink transition-colors"
                  >
                    <Plus size={16} aria-hidden="true" />
                  </button>
                </div>
              </div>

              <div className="border-t border-line pt-4 flex items-center justify-between">
                <span className="text-ink-soft text-sm">Tổng cộng</span>
                <span className="text-ink font-bold text-lg">
                  {formatVnd(selectedPrice.price * quantity)}
                </span>
              </div>
              {/* MLACP-626: điều khoản tiền nói TRƯỚC nút trả tiền — giá là giá cuối, không cộng thêm phí. */}
              <GhiChuGiaVe />

              {/* CHÍNH SÁCH HOÀN TIỀN — PHẢI HIỆN TRƯỚC KHI TRẢ TIỀN, KHÔNG ĐƯỢC BỎ.
                  Backend thêm khối `refundPolicy` đúng vì mục này: trước đó các cột điều kiện huỷ
                  vé đã tồn tại và ĐÃ ĐƯỢC ÁP DỤNG khi khách bấm huỷ, nhưng không nằm trong DTO nào
                  — nên khán giả quyết định mua mà không biết vé có hoàn được không, hoàn bao nhiêu,
                  tới khi nào. Chú thích của backend viện dẫn NĐ 85/2021.
                  `summary` là CÂU TIẾNG VIỆT DỰNG SẴN Ở MÁY CHỦ, cố ý vậy để mọi client nói cùng
                  một điều khoản và để câu chữ không lệch khỏi thứ lệnh huỷ vé thực sự áp dụng.
                  HIỆN NGUYÊN VĂN `summary`, đừng tự diễn đạt lại từ mấy con số bên dưới. */}
              {chinhSach && (
                <div className={` p-3 border ${
                  chinhSach.cancellationAllowed
                    ? 'bg-sunken/40 border-line'
                    : 'bg-sunken border-warning'
                }`}>
                  <p className="text-xs font-bold text-ink-soft flex items-center gap-1.5">
                    <Info size={12} /> Điều kiện huỷ vé
                  </p>
                  <p className="text-xs text-ink-soft mt-1.5 leading-relaxed">{chinhSach.summary}</p>
                  {chinhSach.cancellationAllowed && chinhSach.cancelBefore && (
                    <p className="text-xs text-ink-mute mt-1.5">
                      Huỷ được tới {gioTrongNgay(chinhSach.cancelBefore)} ngày {ngayDayDu(chinhSach.cancelBefore)}.
                    </p>
                  )}
                  {/* Câu `summary` của máy chủ thường đã nói điều này; chỉ in thêm khi summary CHƯA nhắc tới việc phòng trà
                      huỷ — nếu không khán giả đọc cùng một lời hứa hai lần liền nhau (thấy 30/09). */}
                  {chinhSach.alwaysFullRefundIfVenueCancels && !/phòng trà h[uủ][ỷy]/i.test(chinhSach.summary ?? '') && (
                    <p className="text-xs text-ink-mute mt-1">
                      Nếu phòng trà huỷ buổi diễn thì bạn được hoàn 100%, bất kể điều kiện trên.
                    </p>
                  )}
                </div>
              )}

              {hold ? (
                <>
                  <div className="flex items-center justify-center gap-2 bg-sunken/70 border border-ink/40 py-2.5">
                    <Timer size={16} className="text-ink" />
                    <span className="text-ink font-mono font-bold">{formatCountdown(secondsLeft)}</span>
                    <span className="text-ink-mute text-xs">còn lại để thanh toán</span>
                  </div>
                  <button
                    onClick={handlePurchase}
                    disabled={isProcessing}
                    className="w-full py-3 bg-ink text-lamp font-bold hover:bg-board transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {isProcessing ? <Loader2 size={18} className="animate-spin" /> : 'Thanh toán'}
                  </button>
                  <button
                    onClick={handleCancelHold}
                    disabled={isProcessing}
                    className="w-full py-2.5 border border-line text-ink-soft font-medium hover:bg-sunken transition-colors"
                  >
                    Huỷ giữ chỗ
                  </button>
                </>
              ) : (
                <button
                  onClick={handleHold}
                  disabled={isProcessing}
                  className="w-full py-3 bg-ink text-lamp font-bold hover:bg-board transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {isProcessing ? <Loader2 size={18} className="animate-spin" /> : 'Giữ chỗ để mua'}
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* MODAL YÊU CẦU ĐĂNG NHẬP */}
      {isLoginModalOpen && (
        // HopThoai (Radix): role=dialog có tên, Esc đóng, giữ tiêu điểm — bản tự dựng cũ không có (rà soát 01/10/2026).
        <HopThoai onDong={() => setIsLoginModalOpen(false)} className="max-w-md p-6 text-center">
          <div className="w-16 h-16 mx-auto bg-ink/10 flex items-center justify-center mb-4 border border-ink/30">
            <Lock size={28} className="text-ink" aria-hidden="true" />
          </div>
          <TieuDeHop><h2 className="text-xl text-ink mb-2">Cần đăng nhập</h2></TieuDeHop>
          <p className="text-ink-soft mb-6">Vui lòng đăng nhập để mua vé.</p>
          <div className="flex flex-wrap gap-3">
            <button type="button" onClick={() => setIsLoginModalOpen(false)} className="flex-1 inline-flex items-center justify-center min-h-[44px] px-4 border-2 border-ink bg-card text-ink text-sm font-semibold hover:bg-ink hover:text-lamp">
              Huỷ
            </button>
            <Link to="/login" className="flex-1 inline-flex items-center justify-center min-h-[44px] px-4 bg-ink text-lamp text-sm font-semibold hover:bg-board">
              Đăng nhập
            </Link>
          </div>
        </HopThoai>
      )}
    </>
  )
}

export default ShowMap
