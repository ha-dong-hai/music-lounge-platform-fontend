// src/pages/owner/OwnerOperatePage.jsx
//
// GHI CHÚ CHO ĐỘI FE — MÀN NÀY ĐỘNG VÀO TIỀN VÀ VÉ THẬT, ĐỌC TRƯỚC KHI SỬA:
// - Nhân viên (Staff) DÙNG ĐƯỢC màn này: start/end là RequireVenueOperator (chủ + nhân viên), khác
//   với /owner/shows vốn chỉ dành cho chủ. Vì vậy nó nằm ở route riêng, không nằm trong trang buổi diễn.
// - SOÁT VÉ tách làm hai bước có chủ đích: tra cứu (GET by-qr) chỉ XEM, soát (POST check-in) mới ĐỔI
//   TRẠNG THÁI và KHÔNG hoàn tác được. Không gộp một bước, vì quét nhầm mã là mất vé của khách.
// - BÁN VÉ TẠI QUẦY có chốt chống thu tiền hai lần: mỗi lượt bán sinh một clientRequestId, bấm lại vì
//   mất mạng thì gửi ĐÚNG mã cũ và máy chủ trả lại lượt bán cũ thay vì tạo vé lần nữa. Mã chỉ được
//   làm mới khi bắt đầu một lượt bán MỚI — đừng sinh mã mới trong mỗi lần render.
// - Vé bán tại quầy mặc định KHÔNG tính hoa hồng nền tảng (có công tắc trong cấu hình hệ thống), nên
//   màn này không hiển thị % hoa hồng cho vé quầy — hiện số đó sẽ là nói sai.
// - Nút "Kết thúc": có tác vụ nền tự kết thúc buổi diễn sau 6 giờ quá giờ dự kiến, nên buổi diễn có
//   thể đã Ended trước khi ai bấm. Đó không phải lỗi.
// - DANH SÁCH KHÁCH có TÊN và EMAIL người mua. Vì vậy nó không tự tải khi mở trang: phải bấm mới
//   tải, và chỉ tải cho buổi diễn đang chọn. Đừng đưa danh sách này ra màn nào người ngoài xem được,
//   và đừng in nó ra log.
import { useState, useEffect, useCallback, useRef } from 'react'
import {
  Loader2, Play, Square, QrCode, Ticket, Search, CheckCircle2, XCircle, Users, Banknote, RefreshCw,
  ClipboardList, Eye, EyeOff,
} from 'lucide-react'
import dayjs from 'dayjs'
import toast from 'react-hot-toast'
import { getMyShows, startShow, endShow, getShowTicketStats, getShowOrders } from '../../services/showServices'
import { getTicketByQr, checkInTicket, sellWalkInTicket } from '../../services/ticketServices'

const fmtMoney = (v) => `${Number(v || 0).toLocaleString('vi-VN')}đ`

// Trạng thái buổi diễn quyết định nút nào bật — không đoán, lấy đúng tên trạng thái của backend.
const CO_THE_BAT_DAU = ['Published']
const CO_THE_KET_THUC = ['Ongoing']

const Card = ({ title, subtitle, children, right }) => (
  <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
    <div className="flex items-start justify-between gap-3 mb-4">
      <div>
        <h3 className="text-base font-semibold text-white">{title}</h3>
        {subtitle && <p className="text-xs text-gray-500 mt-0.5 leading-relaxed">{subtitle}</p>}
      </div>
      {right}
    </div>
    {children}
  </div>
)

const OwnerOperatePage = () => {
  const [shows, setShows] = useState([])
  const [showId, setShowId] = useState(null)
  const [stats, setStats] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isLoadingStats, setIsLoadingStats] = useState(false)
  const [busy, setBusy] = useState(null) // 'start' | 'end' | 'lookup' | 'checkin' | 'sell'

  // Soát vé
  const [qr, setQr] = useState('')
  const [veTraCuu, setVeTraCuu] = useState(null)

  // Bán vé tại quầy — mã chống thu tiền hai lần, giữ qua các lần render bằng ref
  // Danh sách khách: chỉ tải khi người dùng chủ động bấm (có dữ liệu cá nhân).
  const [khach, setKhach] = useState(null)
  const [moDanhSachKhach, setMoDanhSachKhach] = useState(false)
  const [priceId, setPriceId] = useState('')
  const [quantity, setQuantity] = useState(1)
  const clientRequestIdRef = useRef(null)

  const showDangChon = shows.find((s) => s.id === showId) ?? null

  const loadShows = useCallback(async () => {
    setIsLoading(true)
    try {
      const res = await getMyShows({ pageSize: 100 })
      if (res.success) {
        const items = res.data.items ?? []
        setShows(items)
        // Ưu tiên buổi đang diễn, rồi tới buổi đã xuất bản gần nhất — đúng thứ người trực cần.
        const dangDien = items.find((s) => s.status === 'Ongoing')
        const sapDien = items
          .filter((s) => s.status === 'Published')
          .sort((a, b) => new Date(a.scheduledStart) - new Date(b.scheduledStart))[0]
        setShowId((cu) => cu ?? (dangDien ?? sapDien)?.id ?? items[0]?.id ?? null)
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Không tải được danh sách buổi diễn.')
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => { const chay = async () => { await loadShows() }; chay() }, [loadShows])

  // Đổi buổi diễn thì ẩn và xoá danh sách khách cũ: hiện tên khách của buổi khác là sai nghiêm trọng.
  const chonBuoiDien = (id) => {
    setShowId(id)
    setKhach(null)
    setMoDanhSachKhach(false)
  }

  const taiDanhSachKhach = async () => {
    if (!showId) return
    setBusy('khach')
    try {
      const res = await getShowOrders(showId, { page: 1, pageSize: 200 })
      if (res.success) {
        setKhach(res.data?.items ?? [])
        setMoDanhSachKhach(true)
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Không tải được danh sách khách.')
    } finally { setBusy(null) }
  }

  const loadStats = useCallback(async () => {
    if (!showId) { setStats(null); return }
    setIsLoadingStats(true)
    try {
      const res = await getShowTicketStats(showId)
      if (res.success) setStats(res.data)
    } catch (err) {
      // Buổi chưa có vé nào hoặc chưa tới lúc — không dựng cảnh báo đỏ cho việc bình thường này.
      setStats(null)
      if (err.response?.status !== 404) {
        toast.error(err.response?.data?.message || 'Không tải được thống kê vé.')
      }
    } finally {
      setIsLoadingStats(false)
    }
  }, [showId])

  useEffect(() => { const chay = async () => { await loadStats() }; chay() }, [loadStats])

  const handleStart = async () => {
    setBusy('start')
    try {
      await startShow(showId)
      toast.success('Đã bắt đầu buổi diễn.')
      await loadShows()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Không bắt đầu được buổi diễn.')
    } finally { setBusy(null) }
  }

  const handleEnd = async () => {
    setBusy('end')
    try {
      await endShow(showId)
      toast.success('Đã kết thúc buổi diễn.')
      await loadShows()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Không kết thúc được buổi diễn.')
    } finally { setBusy(null) }
  }

  const handleLookup = async (e) => {
    e.preventDefault()
    if (!qr.trim()) return
    setBusy('lookup')
    setVeTraCuu(null)
    try {
      const res = await getTicketByQr(qr.trim())
      if (res.success) setVeTraCuu(res.data)
    } catch (err) {
      toast.error(err.response?.data?.message || 'Không tìm thấy vé với mã này.')
    } finally { setBusy(null) }
  }

  const handleCheckIn = async () => {
    setBusy('checkin')
    try {
      const res = await checkInTicket(qr.trim())
      if (res.success) {
        setVeTraCuu(res.data)
        toast.success('Đã soát vé. Mời khách vào.')
        await loadStats()
      }
    } catch (err) {
      // "Vé này đã soát rồi" và "vé không hợp lệ" là hai tình huống khác hẳn nhau với người đứng cửa,
      // nên hiển thị nguyên văn câu của backend thay vì một câu chung.
      toast.error(err.response?.data?.message || 'Không soát được vé này.')
    } finally { setBusy(null) }
  }

  const handleSell = async (e) => {
    e.preventDefault()
    if (!priceId) { toast.error('Chọn hạng vé cần bán.'); return }
    // Sinh mã cho lượt bán này nếu chưa có. Bấm lại sau khi lỗi mạng sẽ dùng LẠI mã này,
    // nên máy chủ nhận ra là cùng một lượt bán và không thu tiền lần hai.
    if (!clientRequestIdRef.current) {
      clientRequestIdRef.current = crypto.randomUUID()
    }
    setBusy('sell')
    try {
      const res = await sellWalkInTicket({
        priceId: Number(priceId),
        quantity: Number(quantity),
        clientRequestId: clientRequestIdRef.current,
      })
      if (res.success) {
        toast.success(`Đã bán ${quantity} vé tại quầy.`)
        clientRequestIdRef.current = null // lượt bán kết thúc — lượt sau phải có mã mới
        setQuantity(1)
        await loadStats()
      }
    } catch (err) {
      // KHÔNG xoá mã ở đây: lần bấm lại phải mang đúng mã cũ thì chốt chống trùng mới có tác dụng.
      toast.error(err.response?.data?.message || 'Không bán được vé.')
    } finally { setBusy(null) }
  }

  if (isLoading) {
    return <div className="py-20 flex justify-center"><Loader2 size={32} className="animate-spin text-[#C3B665]" /></div>
  }

  if (shows.length === 0) {
    return (
      <div className="max-w-2xl">
        <h1 className="text-2xl font-bold text-white mb-1">Vận hành đêm diễn</h1>
        <div className="mt-4 bg-gray-900 border border-gray-800 rounded-xl p-6">
          <p className="text-sm text-gray-400">Chưa có buổi diễn nào để vận hành.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-white mb-1">Vận hành đêm diễn</h1>
          <p className="text-gray-400 text-sm">Soát vé tại cửa, bán vé cho khách vãng lai, và theo dõi số vé theo thời gian thực.</p>
        </div>
        <button onClick={loadStats} disabled={isLoadingStats}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-gray-700 text-gray-300 text-xs font-bold hover:bg-gray-800 disabled:opacity-50">
          <RefreshCw size={14} className={isLoadingStats ? 'animate-spin' : ''} /> Cập nhật số liệu
        </button>
      </div>

      <div>
        <label className="text-xs text-gray-500">Buổi diễn</label>
        <select value={showId ?? ''} onChange={(e) => { chonBuoiDien(Number(e.target.value)); setVeTraCuu(null); setPriceId('') }}
          className="mt-1 w-full max-w-xl px-3 py-2 bg-black border border-gray-700 rounded-lg text-sm text-white focus:outline-none focus:border-[#C3B665]/50">
          {shows.map((s) => (
            <option key={s.id} value={s.id}>
              {s.name} — {dayjs(s.scheduledStart).format('HH:mm DD/MM/YYYY')} ({s.status})
            </option>
          ))}
        </select>
      </div>

      {showDangChon && (
        <div className="flex flex-wrap gap-3">
          <button onClick={handleStart} disabled={busy !== null || !CO_THE_BAT_DAU.includes(showDangChon.status)}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-green-500/10 border border-green-500/40 text-green-400 text-sm font-bold hover:bg-green-500/20 disabled:opacity-40 disabled:cursor-not-allowed">
            {busy === 'start' ? <Loader2 size={16} className="animate-spin" /> : <Play size={16} />} Bắt đầu buổi diễn
          </button>
          <button onClick={handleEnd} disabled={busy !== null || !CO_THE_KET_THUC.includes(showDangChon.status)}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-red-500/10 border border-red-500/40 text-red-400 text-sm font-bold hover:bg-red-500/20 disabled:opacity-40 disabled:cursor-not-allowed">
            {busy === 'end' ? <Loader2 size={16} className="animate-spin" /> : <Square size={16} />} Kết thúc
          </button>
          <span className="text-xs text-gray-600 self-center">
            Trạng thái hiện tại: <span className="text-gray-400">{showDangChon.status}</span>
          </span>
        </div>
      )}

      {/* === SỐ LIỆU VÉ === */}
      {stats && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
            <p className="text-sm text-gray-500 mb-1 flex items-center gap-1.5"><Ticket size={14} /> Vé đã bán</p>
            <p className="text-2xl font-bold text-white">{stats.totalTicketsSold.toLocaleString('vi-VN')}</p>
          </div>
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
            <p className="text-sm text-gray-500 mb-1 flex items-center gap-1.5"><Users size={14} /> Đã vào cửa</p>
            <p className="text-2xl font-bold text-white">{stats.totalCheckedIn.toLocaleString('vi-VN')}</p>
            <p className="text-xs text-gray-600 mt-1">
              Còn {Math.max(0, stats.totalTicketsSold - stats.totalCheckedIn).toLocaleString('vi-VN')} vé chưa vào
            </p>
          </div>
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
            <p className="text-sm text-gray-500 mb-1 flex items-center gap-1.5"><Banknote size={14} /> Doanh thu vé</p>
            <p className="text-2xl font-bold text-white">{fmtMoney(stats.totalRevenue)}</p>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* === SOÁT VÉ === */}
        <Card title="Soát vé tại cửa" subtitle="Tra cứu trước để đối chiếu, rồi mới soát. Soát vé không hoàn tác được.">
          <form onSubmit={handleLookup} className="flex gap-2">
            <input value={qr} onChange={(e) => { setQr(e.target.value); setVeTraCuu(null) }}
              placeholder="Quét hoặc nhập mã QR trên vé" autoFocus
              className="flex-1 px-3 py-2 bg-black border border-gray-700 rounded-lg text-sm text-white focus:outline-none focus:border-[#C3B665]/50" />
            <button type="submit" disabled={busy !== null || !qr.trim()}
              className="flex items-center gap-1.5 px-4 py-2 rounded-lg border border-gray-700 text-gray-300 text-sm font-bold hover:bg-gray-800 disabled:opacity-50">
              {busy === 'lookup' ? <Loader2 size={16} className="animate-spin" /> : <Search size={16} />} Tra cứu
            </button>
          </form>

          {veTraCuu && (
            <div className="mt-4 bg-black/40 border border-gray-800 rounded-lg p-4">
              <div className="flex items-start gap-2">
                {veTraCuu.status === 'CheckedIn'
                  ? <CheckCircle2 size={18} className="text-green-400 mt-0.5 flex-shrink-0" />
                  : <QrCode size={18} className="text-gray-500 mt-0.5 flex-shrink-0" />}
                <div className="min-w-0">
                  <p className="text-white font-medium">{veTraCuu.showName ?? veTraCuu.loungeShowName ?? 'Vé'}</p>
                  <p className="text-xs text-gray-500 mt-0.5">
                    {[veTraCuu.tierName, veTraCuu.priceName, veTraCuu.zoneName].filter(Boolean).join(' · ') || '—'}
                  </p>
                  <p className="text-xs text-gray-500 mt-0.5">
                    Trạng thái: <span className="text-gray-300">{veTraCuu.status}</span>
                    {veTraCuu.holderName && <> · Người mua: <span className="text-gray-300">{veTraCuu.holderName}</span></>}
                  </p>
                </div>
              </div>

              {veTraCuu.status === 'CheckedIn' ? (
                <p className="mt-3 text-xs text-green-400 flex items-center gap-1.5">
                  <CheckCircle2 size={13} /> Vé này đã được soát.
                </p>
              ) : (
                <button onClick={handleCheckIn} disabled={busy !== null}
                  className="mt-3 w-full flex items-center justify-center gap-2 py-2.5 rounded-lg bg-[#C3B665] text-black font-bold text-sm hover:bg-[#d4c87f] disabled:opacity-50">
                  {busy === 'checkin' ? <Loader2 size={16} className="animate-spin" /> : <CheckCircle2 size={16} />}
                  Soát vé và cho vào
                </button>
              )}
            </div>
          )}

          {!veTraCuu && qr && busy === null && (
            <p className="mt-3 text-xs text-gray-600 flex items-center gap-1.5">
              <XCircle size={13} /> Chưa tra cứu. Bấm Tra cứu để xem thông tin vé trước khi soát.
            </p>
          )}
        </Card>

        {/* === BÁN VÉ TẠI QUẦY === */}
        <Card
          title="Bán vé tại quầy"
          subtitle="Dành cho khách tới thẳng cửa. Bấm lại sau khi mất mạng sẽ KHÔNG thu tiền hai lần — hệ thống nhận ra cùng một lượt bán."
        >
          {!stats || stats.byPrice.length === 0 ? (
            <p className="py-6 text-center text-sm text-gray-500">
              Buổi diễn này chưa có hạng vé nào để bán.
            </p>
          ) : (
            <form onSubmit={handleSell} className="space-y-3">
              <div>
                <label className="text-xs text-gray-500">Hạng vé</label>
                <select value={priceId} onChange={(e) => setPriceId(e.target.value)}
                  className="mt-1 w-full px-3 py-2 bg-black border border-gray-700 rounded-lg text-sm text-white focus:outline-none focus:border-[#C3B665]/50">
                  <option value="">— chọn hạng vé —</option>
                  {stats.byPrice.map((p) => (
                    <option key={p.priceId} value={p.priceId}>
                      {p.tierName} · {p.priceName} — {fmtMoney(p.unitPrice)}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-xs text-gray-500">Số lượng</label>
                <input type="number" min="1" step="1" value={quantity}
                  onChange={(e) => setQuantity(e.target.value)}
                  className="mt-1 w-full px-3 py-2 bg-black border border-gray-700 rounded-lg text-sm text-white focus:outline-none focus:border-[#C3B665]/50" />
              </div>
              <button type="submit" disabled={busy !== null}
                className="w-full flex items-center justify-center gap-2 py-2.5 rounded-lg bg-[#C3B665] text-black font-bold text-sm hover:bg-[#d4c87f] disabled:opacity-50">
                {busy === 'sell' ? <Loader2 size={16} className="animate-spin" /> : <Ticket size={16} />}
                Bán vé và thu tiền mặt
              </button>
            </form>
          )}

          {stats && stats.byPrice.length > 0 && (
            <div className="mt-4 pt-4 border-t border-gray-800">
              <p className="text-xs text-gray-500 mb-2">Đã bán theo hạng vé</p>
              <ul className="space-y-1.5">
                {stats.byPrice.map((p) => (
                  <li key={p.priceId} className="flex justify-between text-xs">
                    <span className="text-gray-400 truncate pr-3">{p.tierName} · {p.priceName}</span>
                    <span className="text-gray-300 tabular-nums flex-shrink-0">
                      {p.quantitySold} vé · {p.checkedInCount} đã vào
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </Card>
      </div>

      {/* DANH SÁCH KHÁCH ĐÃ MUA VÉ — có tên và email, nên phải bấm mới tải và ẩn được lại */}
      {showId && (
        <Card
          title="Danh sách khách đã mua vé"
          subtitle="Dùng để đối soát và đón khách. Danh sách có tên và email người mua — chỉ mở khi cần."
          right={
            khach == null ? (
              <button onClick={taiDanhSachKhach} disabled={busy === 'khach'}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-gray-700 text-gray-300 text-xs font-bold hover:bg-gray-800 disabled:opacity-50 flex-shrink-0">
                {busy === 'khach' ? <Loader2 size={14} className="animate-spin" /> : <ClipboardList size={14} />}
                Tải danh sách
              </button>
            ) : (
              <div className="flex gap-2 flex-shrink-0">
                <button onClick={() => setMoDanhSachKhach((v) => !v)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-gray-700 text-gray-300 text-xs font-bold hover:bg-gray-800">
                  {moDanhSachKhach ? <><EyeOff size={14} /> Ẩn</> : <><Eye size={14} /> Hiện</>}
                </button>
                <button onClick={taiDanhSachKhach} disabled={busy === 'khach'}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-gray-700 text-gray-300 text-xs font-bold hover:bg-gray-800 disabled:opacity-50">
                  <RefreshCw size={14} className={busy === 'khach' ? 'animate-spin' : ''} /> Tải lại
                </button>
              </div>
            )
          }
        >
          {khach == null ? (
            <p className="text-sm text-gray-500">Chưa tải. Bấm &quot;Tải danh sách&quot; khi cần đối soát.</p>
          ) : !moDanhSachKhach ? (
            <p className="text-sm text-gray-500">Đã tải {khach.length} khách — đang ẩn.</p>
          ) : khach.length === 0 ? (
            <p className="text-sm text-gray-500">Chưa có ai mua vé buổi diễn này.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-xs text-gray-500 border-b border-gray-800">
                    <th className="text-left py-2 pr-3 font-medium">Khách</th>
                    <th className="text-left py-2 pr-3 font-medium">Hạng vé</th>
                    <th className="text-right py-2 pr-3 font-medium">Đã trả</th>
                    <th className="text-left py-2 pr-3 font-medium">Kênh</th>
                    <th className="text-left py-2 font-medium">Vào cửa</th>
                  </tr>
                </thead>
                <tbody>
                  {khach.map((k) => (
                    <tr key={k.ticketId} className="border-b border-gray-800/60">
                      <td className="py-2.5 pr-3">
                        <p className="text-white">{k.buyerName || 'Khách tại quầy'}</p>
                        {k.buyerEmail && <p className="text-xs text-gray-600 break-all">{k.buyerEmail}</p>}
                      </td>
                      <td className="py-2.5 pr-3 text-gray-300">
                        {k.tierName}
                        <span className="text-gray-600"> · {k.priceName}</span>
                      </td>
                      <td className="py-2.5 pr-3 text-right text-gray-300 tabular-nums">{fmtMoney(k.pricePaid)}</td>
                      <td className="py-2.5 pr-3 text-gray-500 text-xs">
                        {k.purchaseChannel === 'Offline' ? 'tại quầy' : 'trực tuyến'}
                      </td>
                      <td className="py-2.5 text-xs">
                        {k.checkedInAt ? (
                          <span className="text-green-400 inline-flex items-center gap-1">
                            <CheckCircle2 size={12} /> {dayjs(k.checkedInAt).format('HH:mm')}
                          </span>
                        ) : (
                          <span className="text-gray-600">chưa vào</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      )}
    </div>
  )
}

export default OwnerOperatePage
