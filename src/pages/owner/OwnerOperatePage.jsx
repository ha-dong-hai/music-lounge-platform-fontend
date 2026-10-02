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
// - DANH SÁCH GIÁ ĐỂ BÁN TẠI QUẦY lấy từ GET /ticket-tiers (AllowAnonymous), KHÔNG lấy từ ticket-stats.
//   ticket-stats có doanh thu nên chỉ chủ/Admin xem được — bản trước dựng ô chọn giá từ đó, nên nhân
//   viên (người đứng quầy) nhận 403 và thấy "chưa có hạng vé nào để bán": không bán được vé nào (đo
//   30/09). Lọc đúng hai điều kiện backend kiểm ở SellWalkInTicketCommandHandler: hạng vé Physical và
//   đợt giá KHÔNG phải chỉ-Online — không lọc thì đưa ra lựa chọn mà máy chủ sẽ từ chối.
import { useState, useEffect, useCallback, useRef } from 'react'
import {
  Loader2, Play, Square, QrCode, Ticket, Search, CheckCircle2, XCircle, Users, Banknote, RefreshCw,
  ClipboardList, EyeOff,
} from 'lucide-react'
import dayjs from 'dayjs'
import toast from 'react-hot-toast'
import { Link } from 'react-router-dom'
import { getShows, getShowDetail, startShow, endShow, getShowTicketStats, getShowOrders, getTicketTiers } from '../../services/showServices'
import { useAuthStore } from '../../store/useAuthStore'
import { getTicketByQr, checkInTicket, sellWalkInTicket } from '../../services/ticketServices'
import NutXacNhan from '../../components/shared/NutXacNhan'
import { useDanhSachMayChu } from '../../hooks/useDanhSachMayChu'
import PhanTrang from '../../components/bang/PhanTrang'
import OChiSo from '../../components/bang/OChiSo'

const fmtMoney = (v) => `${Number(v || 0).toLocaleString('vi-VN')}đ`

// Trạng thái buổi diễn quyết định nút nào bật — không đoán, lấy đúng tên trạng thái của backend.
const CO_THE_BAT_DAU = ['Published']
// Đúng enum LoungeShowStatus / TicketStatus của backend (đối chiếu swagger 30/09).
const TRANG_THAI_BUOI = {
  Draft: 'Bản nháp', Pending: 'Chờ duyệt', Published: 'Đã mở bán', Ongoing: 'Đang diễn',
  Ended: 'Đã kết thúc', Cancelled: 'Đã huỷ',
}
const tenTrangThai = (s) => TRANG_THAI_BUOI[s] ?? s
// Chỉ vé Confirmed mới soát được. Bản trước so với 'CheckedIn' — giá trị KHÔNG tồn tại trong TicketStatus
// (backend dùng 'Used') — nên vé đã soát, đã huỷ hay đã hoàn tiền đều vẫn hiện nút "Soát vé và cho vào".
const VE_KHONG_SOAT = {
  Used: { cau: 'Vé này đã được soát.', tot: true },
  Cancelled: { cau: 'Vé đã huỷ — không cho vào.' },
  Refunded: { cau: 'Vé đã hoàn tiền — không cho vào.' },
  Pending: { cau: 'Vé chưa thanh toán xong — không cho vào.' },
}
const TEN_TRANG_THAI_VE = { Pending: 'Chờ thanh toán', Confirmed: 'Hợp lệ', Used: 'Đã soát', Cancelled: 'Đã huỷ', Refunded: 'Đã hoàn tiền' }
const CO_THE_KET_THUC = ['Ongoing']

const Card = ({ title, subtitle, children, right }) => (
  <div className="bg-card border border-line p-5">
    <div className="flex items-start justify-between gap-3 mb-4">
      <div>
        <h3 className="text-base font-semibold text-ink">{title}</h3>
        {subtitle && <p className="text-xs text-ink-mute mt-0.5 leading-relaxed">{subtitle}</p>}
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
  const [moDanhSachKhach, setMoDanhSachKhach] = useState(false)
  const [priceId, setPriceId] = useState('')
  const [quantity, setQuantity] = useState(1)
  const clientRequestIdRef = useRef(null)
  const [giaBanQuay, setGiaBanQuay] = useState([])
  // Số liệu vé có doanh thu — backend chỉ mở cho chủ/Admin; nhân viên không gọi để khỏi nhận 403.
  const vai = useAuthStore((st) => st.user?.role)
  const xemDuocSoLieu = vai !== 'Staff'
  // Chi tiết buổi đang chọn: operatorInfo.vcpmcDeclared + livestreamId quyết định nút "Bắt đầu" có
  // dùng được không (StartLoungeShowCommandHandler chặn cả hai trường hợp) — báo TRƯỚC thay vì để
  // người trực bấm rồi mới nhận lỗi.
  const [chiTietBuoi, setChiTietBuoi] = useState(null)

  const showDangChon = shows.find((s) => s.id === showId) ?? null

  const loadShows = useCallback(async () => {
    setIsLoading(true)
    try {
      // GET /lounge-shows?mine=true chứ KHÔNG phải /lounge-shows/mine: route /mine gắn RequireOwner nên
      // nhân viên nhận 403 và màn này hiện "chưa có buổi diễn" dù phòng trà có (đo 30/09 trên backend
      // chạy máy). ?mine=true đi qua OperatedShows (MLACP-466): nhân viên thấy buổi của phòng trà mình
      // vận hành, chủ thấy buổi của mình — đúng cách OwnerLivestreamsPage đang làm.
      // MLACP-498 (01/10/2026): buổi ĐANG DIỄN và ĐÃ MỞ BÁN là thứ người trực cần — lấy riêng bằng status (lọc phía
      // máy chủ) để không bao giờ bị cắt ở trang 100 đầu tiên. Lượt không lọc vẫn giữ để ô chọn còn các buổi khác như cũ
      // (vd. buổi vừa kết thúc, cần đối soát). Backend chưa có MLACP-498 bỏ qua `status` → ba lượt trả cùng một trang,
      // gộp bỏ trùng thì y như bản cũ.
      const [tatCa, loDangDien, loMoBan] = await Promise.all([
        getShows({ mine: true, pageSize: 100 }),
        getShows({ mine: true, status: 'Ongoing', pageSize: 100 }),
        getShows({ mine: true, status: 'Published', pageSize: 100 }),
      ])
      if (tatCa.success) {
        const gop = new Map()
        for (const r of [loDangDien, loMoBan, tatCa]) for (const sh of (r?.success ? r.data.items ?? [] : [])) gop.set(sh.id, sh)
        const items = [...gop.values()]
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
    setMoDanhSachKhach(false)
    dsKhach.datTrang(1)
  }

  // DANH SÁCH KHÁCH (01/10/2026): bản cũ xin pageSize 200 mà GET /lounge-shows/{id}/orders kẹp ở 100
  // (GetShowOrdersQueryHandler) — từ khách thứ 101 trở đi biến mất khỏi bảng mà không báo. Nay phân trang thật qua
  // hooks/useDanhSachMayChu (tham số URL khachTrang/khachCo để không đụng bộ lọc khác). Vẫn chỉ tải khi người trực
  // bấm mở (danh sách có tên + email). GIỚI HẠN: backend chưa có tìm theo tên/SĐT (đề xuất `keyword` — báo cáo
  // "Thư viện bảng lọc phân trang dữ liệu lớn"), nên tìm một khách giữa nhiều trang vẫn phải lật trang.
  const dsKhach = useDanhSachMayChu({
    khoa: ['khach-buoi', showId],
    goi: (q) => getShowOrders(showId, q),
    tien: 'khach',
    coMacDinh: 50,
    batDau: Boolean(showId) && moDanhSachKhach,
  })

  const loadGiaBanQuay = useCallback(async () => {
    if (!showId) { setGiaBanQuay([]); return }
    try {
      const res = await getTicketTiers(showId)
      const tiers = res.success ? res.data ?? [] : []
      setGiaBanQuay(
        tiers
          .filter((t) => t.accessType === 'Physical')
          .flatMap((t) => (t.prices ?? [])
            .filter((p) => p.purchaseChannel !== 'Online')
            .map((p) => ({ priceId: p.id, tierName: t.name, priceName: p.name, unitPrice: p.price, conLai: p.availableSlots }))),
      )
    } catch (err) {
      setGiaBanQuay([])
      toast.error(err.response?.data?.message || 'Không tải được hạng vé để bán.')
    }
  }, [showId])

  useEffect(() => { const chay = async () => { await loadGiaBanQuay() }; chay() }, [loadGiaBanQuay])

  const loadChiTietBuoi = useCallback(async () => {
    if (!showId) { setChiTietBuoi(null); return }
    try {
      const res = await getShowDetail(showId)
      setChiTietBuoi(res.success ? res.data : null)
    } catch {
      setChiTietBuoi(null) // không đọc được thì không chặn nút — để máy chủ quyết
    }
  }, [showId])

  useEffect(() => { const chay = async () => { await loadChiTietBuoi() }; chay() }, [loadChiTietBuoi])

  const coLivestream = !!chiTietBuoi?.livestreamId
  const thieuVcpmc = chiTietBuoi?.operatorInfo != null && !chiTietBuoi.operatorInfo.vcpmcDeclared

  const loadStats = useCallback(async () => {
    if (!showId || !xemDuocSoLieu) { setStats(null); return }
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
  }, [showId, xemDuocSoLieu])

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
        // MLACP-516: id là GUID (chuỗi) — ép Number ra NaN và backend trả 400.
        priceId,
        quantity: Number(quantity),
        clientRequestId: clientRequestIdRef.current,
      })
      if (res.success) {
        toast.success(`Đã bán ${quantity} vé tại quầy.`)
        clientRequestIdRef.current = null // lượt bán kết thúc — lượt sau phải có mã mới
        setQuantity(1)
        await Promise.all([loadStats(), loadGiaBanQuay()])
      }
    } catch (err) {
      // KHÔNG xoá mã ở đây: lần bấm lại phải mang đúng mã cũ thì chốt chống trùng mới có tác dụng.
      toast.error(err.response?.data?.message || 'Không bán được vé.')
    } finally { setBusy(null) }
  }

  if (isLoading) {
    return <div className="py-20 flex justify-center"><Loader2 size={32} className="animate-spin text-ink" /></div>
  }

  if (shows.length === 0) {
    return (
      <div className="max-w-2xl mx-auto">
        <h1 className="text-4xl text-ink mb-1">Vận hành đêm diễn</h1>
        <div className="mt-4 bg-card border border-line p-6">
          <p className="text-sm text-ink-soft">Chưa có buổi diễn nào để vận hành.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-4xl text-ink mb-1">Vận hành đêm diễn</h1>
          <p className="text-ink-soft text-sm">Soát vé tại cửa, bán vé cho khách vãng lai, và theo dõi số vé theo thời gian thực.</p>
        </div>
        <button onClick={loadStats} disabled={isLoadingStats}
          className="flex items-center gap-1.5 disabled:opacity-50 justify-center min-h-[44px] px-4 border-2 border-ink bg-card text-ink text-sm font-semibold hover:bg-ink hover:text-lamp">
          <RefreshCw size={14} className={isLoadingStats ? 'animate-spin' : ''} /> Cập nhật số liệu
        </button>
      </div>

      <div>
        <label className="text-sm font-semibold text-ink">Buổi diễn</label>
        <select aria-label="Buổi diễn" value={showId ?? ''} onChange={(e) => { chonBuoiDien(e.target.value || null); setVeTraCuu(null); setPriceId('') }}
          className="mt-1 w-full max-w-xl min-h-[44px] px-3 py-2 bg-card border-2 border-ink text-ink focus:outline-none focus:ring-2 focus:ring-ink focus:ring-offset-2">
          {shows.map((s) => (
            <option key={s.id} value={s.id}>
              {s.name} — {dayjs(s.scheduledStart).format('HH:mm DD/MM/YYYY')} ({tenTrangThai(s.status)})
            </option>
          ))}
        </select>
      </div>

      {showDangChon && (
        <div className="flex flex-wrap gap-3">
          <button onClick={handleStart} disabled={busy !== null || !CO_THE_BAT_DAU.includes(showDangChon.status) || thieuVcpmc || coLivestream}
            className="flex items-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed justify-center min-h-[44px] px-4 border-2 border-success bg-card text-success text-sm font-semibold hover:bg-success hover:text-lamp">
            {busy === 'start' ? <Loader2 size={16} className="animate-spin" /> : <Play size={16} />} Bắt đầu buổi diễn
          </button>
          <NutXacNhan onXacNhan={handleEnd} tieuDe="Kết thúc buổi diễn?" nhanXacNhan="Kết thúc buổi diễn" nhanGiu="Chưa, còn đang diễn"
            noiDung="Nhân viên sẽ không soát vé được nữa. Buổi diễn được ghi nhận là đã diễn xong (căn cứ để quyết toán tiền vé), và khán giả bắt đầu đánh giá được. Không hoàn tác được." disabled={busy !== null || !CO_THE_KET_THUC.includes(showDangChon.status)}
            className="flex items-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed justify-center min-h-[44px] px-4 border-2 border-danger bg-card text-danger text-sm font-semibold hover:bg-danger hover:text-lamp">
            {busy === 'end' ? <Loader2 size={16} className="animate-spin" /> : <Square size={16} />} Kết thúc
          </NutXacNhan>
          <span className="text-xs text-ink-mute self-center">
            Trạng thái hiện tại: <span className="text-ink-soft">{tenTrangThai(showDangChon.status)}</span>
          </span>
        </div>
      )}

      {showDangChon && CO_THE_BAT_DAU.includes(showDangChon.status) && (thieuVcpmc || coLivestream) && (
        <p className="text-xs text-warning leading-relaxed max-w-3xl">
          {coLivestream ? (
            <>Buổi diễn này có phát trực tuyến — bắt đầu ở trang <Link to="/owner/livestreams" className="underline">Phát trực tuyến</Link>.</>
          ) : vai === 'Staff' ? (
            'Chưa bắt đầu được: buổi diễn chưa khai mã tác quyền VCPMC. Nhờ chủ phòng trà khai trong Cài đặt buổi diễn.'
          ) : (
            <>Chưa bắt đầu được: buổi diễn chưa khai mã tác quyền VCPMC —{' '}
              <Link to={`/owner/shows/${showDangChon.id}/settings`} className="underline">khai trong Cài đặt buổi diễn</Link>.</>
          )}
        </p>
      )}

      {/* === SỐ LIỆU VÉ === */}
      {stats && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <OChiSo nhan="Vé đã bán" so={stats.totalTicketsSold} icon={Ticket} />
          <OChiSo nhan="Đã vào cửa" so={stats.totalCheckedIn} icon={Users}
            phu={`Còn ${Math.max(0, stats.totalTicketsSold - stats.totalCheckedIn).toLocaleString('vi-VN')} vé chưa vào`} />
          <OChiSo nhan="Doanh thu vé" so={fmtMoney(stats.totalRevenue)} icon={Banknote} />
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* === SOÁT VÉ === */}
        <Card title="Soát vé tại cửa" subtitle="Tra cứu trước để đối chiếu, rồi mới soát. Soát vé không hoàn tác được.">
          <form onSubmit={handleLookup} className="flex gap-2">
            <input aria-label="Quét hoặc nhập mã QR trên vé" value={qr} onChange={(e) => { setQr(e.target.value); setVeTraCuu(null) }}
              placeholder="Quét hoặc nhập mã QR trên vé" autoFocus
              className="flex-1 min-h-[44px] px-3 py-2 bg-card border-2 border-ink text-ink focus:outline-none focus:ring-2 focus:ring-ink focus:ring-offset-2" />
            <button type="submit" disabled={busy !== null || !qr.trim()}
              className="flex items-center gap-1.5 disabled:opacity-50 justify-center min-h-[44px] px-4 border-2 border-ink bg-card text-ink text-sm font-semibold hover:bg-ink hover:text-lamp">
              {busy === 'lookup' ? <Loader2 size={16} className="animate-spin" /> : <Search size={16} />} Tra cứu
            </button>
          </form>

          {veTraCuu && (
            <div className="mt-4 bg-sunken/70 border border-line p-4">
              <div className="flex items-start gap-2">
                {veTraCuu.status === 'Used'
                  ? <CheckCircle2 size={18} className="text-success mt-0.5 flex-shrink-0" />
                  : <QrCode size={18} className="text-ink-mute mt-0.5 flex-shrink-0" />}
                <div className="min-w-0">
                  <p className="text-ink font-medium">{veTraCuu.showName ?? veTraCuu.loungeShowName ?? 'Vé'}</p>
                  <p className="text-xs text-ink-mute mt-0.5">
                    {[veTraCuu.tierName, veTraCuu.priceName, veTraCuu.zoneName].filter(Boolean).join(' · ') || '—'}
                  </p>
                  <p className="text-xs text-ink-mute mt-0.5">
                    Trạng thái: <span className="text-ink-soft">{TEN_TRANG_THAI_VE[veTraCuu.status] ?? veTraCuu.status}</span>
                    {veTraCuu.holderName && <> · Người mua: <span className="text-ink-soft">{veTraCuu.holderName}</span></>}
                  </p>
                </div>
              </div>

              {veTraCuu.status !== 'Confirmed' ? (
                <p className={`mt-3 text-xs flex items-center gap-1.5 ${VE_KHONG_SOAT[veTraCuu.status]?.tot ? 'text-success' : 'text-danger'}`}>
                  {VE_KHONG_SOAT[veTraCuu.status]?.tot ? <CheckCircle2 size={13} /> : <XCircle size={13} />}
                  {VE_KHONG_SOAT[veTraCuu.status]?.cau ?? 'Vé này không soát được.'}
                </p>
              ) : (
                <button onClick={handleCheckIn} disabled={busy !== null}
                  className="mt-3 w-full flex items-center justify-center gap-2 disabled:opacity-50 min-h-[44px] px-4 bg-ink text-lamp text-sm font-semibold hover:bg-board">
                  {busy === 'checkin' ? <Loader2 size={16} className="animate-spin" /> : <CheckCircle2 size={16} />}
                  Soát vé và cho vào
                </button>
              )}
            </div>
          )}

          {!veTraCuu && qr && busy === null && (
            <p className="mt-3 text-xs text-ink-mute flex items-center gap-1.5">
              <XCircle size={13} /> Chưa tra cứu. Bấm Tra cứu để xem thông tin vé trước khi soát.
            </p>
          )}
        </Card>

        {/* === BÁN VÉ TẠI QUẦY === */}
        <Card
          title="Bán vé tại quầy"
          subtitle="Dành cho khách tới thẳng cửa. Bấm lại sau khi mất mạng sẽ KHÔNG thu tiền hai lần — hệ thống nhận ra cùng một lượt bán."
        >
          {giaBanQuay.length === 0 ? (
            <p className="py-6 text-center text-sm text-ink-mute">
              Buổi diễn này không có đợt giá nào bán tại quầy — chỉ bán online, hoặc chưa có hạng vé vào cửa.
            </p>
          ) : (
            <form onSubmit={handleSell} className="space-y-3">
              <div>
                <label className="text-sm font-semibold text-ink">Hạng vé</label>
                <select aria-label="Hạng vé" value={priceId} onChange={(e) => setPriceId(e.target.value)}
                  className="mt-1 w-full min-h-[44px] px-3 py-2 bg-card border-2 border-ink text-ink focus:outline-none focus:ring-2 focus:ring-ink focus:ring-offset-2">
                  <option value="">— chọn hạng vé —</option>
                  {giaBanQuay.map((p) => (
                    <option key={p.priceId} value={p.priceId} disabled={p.conLai === 0}>
                      {p.tierName} · {p.priceName} — {fmtMoney(p.unitPrice)}
                      {p.conLai != null ? ` · còn ${p.conLai}` : ''}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-sm font-semibold text-ink">Số lượng</label>
                <input aria-label="Số lượng" type="number" min="1" step="1" value={quantity}
                  onChange={(e) => setQuantity(e.target.value)}
                  className="mt-1 w-full min-h-[44px] px-3 py-2 bg-card border-2 border-ink text-ink focus:outline-none focus:ring-2 focus:ring-ink focus:ring-offset-2" />
              </div>
              <button type="submit" disabled={busy !== null}
                className="w-full flex items-center justify-center gap-2 disabled:opacity-50 min-h-[44px] px-4 bg-ink text-lamp text-sm font-semibold hover:bg-board">
                {busy === 'sell' ? <Loader2 size={16} className="animate-spin" /> : <Ticket size={16} />}
                Bán vé và thu tiền mặt
              </button>
            </form>
          )}

          {stats && stats.byPrice.length > 0 && (
            <div className="mt-4 pt-4 border-t border-line">
              <p className="text-xs text-ink-mute mb-2">Đã bán theo hạng vé</p>
              <ul className="space-y-1.5">
                {stats.byPrice.map((p) => (
                  <li key={p.priceId} className="flex justify-between text-xs">
                    <span className="text-ink-soft truncate pr-3">{p.tierName} · {p.priceName}</span>
                    <span className="text-ink-soft tabular-nums flex-shrink-0">
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
            !moDanhSachKhach ? (
              <button type="button" onClick={() => setMoDanhSachKhach(true)}
                className="flex items-center gap-1.5 min-h-[44px] px-3 border-2 border-ink text-sm font-semibold hover:bg-ink hover:text-lamp flex-shrink-0">
                <ClipboardList size={15} aria-hidden="true" /> Mở danh sách
              </button>
            ) : (
              <div className="flex gap-2 flex-shrink-0">
                <button type="button" onClick={() => setMoDanhSachKhach(false)}
                  className="flex items-center gap-1.5 min-h-[44px] px-3 border-2 border-ink text-sm font-semibold hover:bg-ink hover:text-lamp">
                  <EyeOff size={15} aria-hidden="true" /> Ẩn
                </button>
                <button type="button" onClick={() => dsKhach.taiLai()} disabled={dsKhach.dangTaiLai}
                  className="flex items-center gap-1.5 min-h-[44px] px-3 border-2 border-ink text-sm font-semibold hover:bg-ink hover:text-lamp disabled:opacity-50">
                  <RefreshCw size={15} className={dsKhach.dangTaiLai ? 'animate-spin' : ''} aria-hidden="true" /> Tải lại
                </button>
              </div>
            )
          }
        >
          {!moDanhSachKhach ? (
            <p className="text-sm text-ink-mute">Đang đóng. Bấm &quot;Mở danh sách&quot; khi cần đối soát.</p>
          ) : dsKhach.dangTai ? (
            <div className="h-40 bg-ink/5 animate-pulse" aria-busy="true" aria-label="Đang tải danh sách khách" />
          ) : dsKhach.loi ? (
            <div role="alert" className="flex flex-wrap items-center gap-4">
              <p>Danh sách khách chưa tải được.</p>
              <button type="button" onClick={() => dsKhach.taiLai()} className="min-h-[44px] px-4 border-2 border-ink font-semibold hover:bg-ink hover:text-lamp">Thử lại</button>
            </div>
          ) : dsKhach.tong === 0 ? (
            <p className="text-sm text-ink-mute">Chưa có ai mua vé buổi diễn này.</p>
          ) : (
            <div className="space-y-3">
            <PhanTrang ds={dsKhach} tenDonVi="vé" idDanhSach="ds-khach" />
            <div className="overflow-x-auto">
              <table id="ds-khach" tabIndex={-1} className={`w-full text-sm focus:outline-none ${dsKhach.laDuLieuCu ? 'opacity-60' : ''}`}>
                <caption className="sr-only">Khách đã mua vé buổi diễn đang chọn, trang {dsKhach.trang} trên {dsKhach.soTrang}</caption>
                <thead>
                  <tr className="text-xs text-ink-mute border-b border-line">
                    <th scope="col" className="text-left py-2 pr-3 font-medium">Khách</th>
                    <th scope="col" className="text-left py-2 pr-3 font-medium">Hạng vé</th>
                    <th scope="col" className="text-right py-2 pr-3 font-medium">Đã trả</th>
                    <th scope="col" className="text-left py-2 pr-3 font-medium">Kênh</th>
                    <th scope="col" className="text-left py-2 font-medium">Vào cửa</th>
                  </tr>
                </thead>
                <tbody>
                  {dsKhach.items.map((k) => (
                    <tr key={k.ticketId} className="border-b border-line/60">
                      <td className="py-2.5 pr-3">
                        <p className="text-ink">{k.buyerName || 'Khách tại quầy'}</p>
                        {k.buyerEmail && <p className="text-xs text-ink-mute break-all">{k.buyerEmail}</p>}
                      </td>
                      <td className="py-2.5 pr-3 text-ink-soft">
                        {k.tierName}
                        <span className="text-ink-mute"> · {k.priceName}</span>
                      </td>
                      <td className="py-2.5 pr-3 text-right text-ink-soft tabular-nums">{fmtMoney(k.pricePaid)}</td>
                      <td className="py-2.5 pr-3 text-ink-mute text-xs">
                        {k.purchaseChannel === 'Offline' ? 'tại quầy' : 'trực tuyến'}
                      </td>
                      <td className="py-2.5 text-xs">
                        {k.checkedInAt ? (
                          <span className="text-success inline-flex items-center gap-1">
                            <CheckCircle2 size={12} /> {dayjs(k.checkedInAt).format('HH:mm')}
                          </span>
                        ) : (
                          <span className="text-ink-mute">chưa vào</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {dsKhach.soTrang > 1 && <PhanTrang ds={dsKhach} tenDonVi="vé" idDanhSach="ds-khach" />}
            </div>
          )}
        </Card>
      )}
    </div>
  )
}

export default OwnerOperatePage
