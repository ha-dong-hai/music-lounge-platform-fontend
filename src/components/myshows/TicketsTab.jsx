// src/components/myshows/TicketsTab.jsx
//
// VÉ CỦA TÔI — mỗi vé in thành một TẤM VÉ CÓ CUỐNG (thủ pháp của thế giới "tờ chương trình", DESIGN.md): cuống tối bên
// trái ghi ngày và giờ, thân vé bên phải ghi buổi diễn, phòng trà, hạng vé, số tiền đã trả và lối đi tiếp.
//
// Làm lại 30/09 (pre-mortem T1: đường đi của khán giả). Khác bản cũ:
//  - ĐỦ 5 TRẠNG THÁI VÉ của backend (Pending, Confirmed, Used, Cancelled, Refunded). Bản cũ chỉ dịch "Confirmed", bốn
//    trạng thái còn lại in nguyên chữ tiếng Anh.
//  - DẤU MỘC cho hai trạng thái TIỀN: đã trả và đã hoàn (luật của thế giới: dấu mộc chỉ nói về tiền).
//  - Ngày giờ đi qua utils/ngayVietNam; bỏ màu tím/xanh/lục/vàng mặc định của Tailwind.
import { useState, useEffect, useMemo } from 'react'
import { Link } from 'react-router-dom'
import { ChevronLeft, ChevronRight, Search, MapPin, Video, QrCode, X } from 'lucide-react'
import dayjs from 'dayjs'
import DauMoc from '../program/DauMoc'
import { getMyTickets } from '../../services/ticketServices'
import KyNiemDemDaDen from './KyNiemDemDaDen'
import { thuVietHoa, ngayGon, gioTrongNgay, ngayDayDu } from '../../utils/ngayVietNam'
import { TRANG_THAI_VE, laVeTrucTuyen } from '../../utils/trangThaiVe'
import LienKetMuiTen from '../shared/LienKetMuiTen'

const ITEMS_PER_PAGE = 10

// Nhãn trạng thái và phép phân biệt vé trực tuyến dùng chung với trang chi tiết vé (src/utils/trangThaiVe.js).
const isOnlineTicket = laVeTrucTuyen

const nhanThoiGian = (batDau) => {
  if (!batDau) return null
  const d = dayjs(batDau)
  if (d.isSame(dayjs(), 'day')) return 'Hôm nay'
  return d.isAfter(dayjs()) ? 'Sắp diễn ra' : 'Đã diễn ra'
}

const NhanNho = ({ children, dam = false }) => (
  <span className={`inline-flex items-center gap-1 px-2 min-h-[26px] border text-xs font-semibold ${dam ? 'bg-ink text-lamp border-ink' : 'border-ink/40 text-ink-soft'}`}>{children}</span>
)

const TicketsTab = () => {
  const [activeSubTab, setActiveSubTab] = useState('all')        // all | upcoming | ended
  const [typeFilter, setTypeFilter] = useState('all')            // all | offline | online
  const [searchQuery, setSearchQuery] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [loi, setLoi] = useState(false)
  const [lanTai, setLanTai] = useState(0)
  const [tickets, setTickets] = useState([])
  const [pagination, setPagination] = useState({ page: 1, totalPages: 1, totalCount: 0 })

  // GỌI API VÉ
  useEffect(() => {
    const fetchTickets = async () => {
      setIsLoading(true)
      setLoi(false)
      try {
        const res = await getMyTickets({ page: pagination.page, pageSize: ITEMS_PER_PAGE })
        if (res.success) {
          const mapped = res.data.items.map(t => ({
            id: t.id,
            showId: t.showId,
            title: t.showName,
            loungeName: t.loungeName,
            start_date: t.showScheduledStart,
            pricePaid: t.pricePaid,
            tierName: t.tierName,
            status: t.status,
            accessType: t.accessType // phân biệt vé Offline / Livestream
          }))
          setTickets(mapped)
          setPagination(prev => ({ ...prev, totalPages: res.data.totalPages, totalCount: res.data.totalCount }))
        } else {
          setLoi(true)
        }
      } catch (err) {
        // Trước đây lỗi tải chỉ ghi console rồi hiện "Chưa có vé nào" — người vừa trả tiền tưởng mất vé.
        console.error('Lỗi load tickets:', err)
        setLoi(true)
      } finally {
        setIsLoading(false)
      }
    }
    fetchTickets()
  }, [pagination.page, lanTai])

  // LỌC KẾT HỢP: thời gian + loại vé + search (client-side trong trang hiện tại)
  const filteredTickets = useMemo(() => {
    const q = searchQuery.toLowerCase().trim()
    return tickets.filter(t => {
      // 1. Thời gian
      if (activeSubTab === 'upcoming' && !dayjs(t.start_date).isAfter(dayjs())) return false
      if (activeSubTab === 'ended' && !dayjs(t.start_date).isBefore(dayjs())) return false

      // 2. Loại vé
      const online = isOnlineTicket(t.accessType)
      if (typeFilter === 'offline' && online) return false
      if (typeFilter === 'online' && !online) return false

      // 3. Tìm kiếm: tên show, phòng trà, loại vé, mã vé
      if (q) {
        const haystack = `${t.title || ''} ${t.loungeName || ''} ${t.tierName || ''} ${t.id}`.toLowerCase()
        if (!haystack.includes(q)) return false
      }
      return true
    })
  }, [tickets, activeSubTab, typeFilter, searchQuery])

  const subTabs = [
    { key: 'all', label: 'Tất cả' },
    { key: 'upcoming', label: 'Sắp diễn ra' },
    { key: 'ended', label: 'Đã diễn ra' }
  ]
  const typeTabs = [
    { key: 'all', label: 'Mọi loại vé' },
    { key: 'offline', label: 'Tại chỗ' },
    { key: 'online', label: 'Trực tuyến' }
  ]

  const nutLoc = (active) => `px-4 min-h-[44px] inline-flex items-center text-sm font-semibold border-2 border-ink transition-colors ${
    active ? 'bg-ink text-lamp' : 'text-ink hover:bg-ink hover:text-lamp'
  }`

  const resetFilters = () => {
    setSearchQuery('')
    setTypeFilter('all')
    setActiveSubTab('all')
  }

  const renderPagination = () => {
    if (pagination.totalPages <= 1) return null
    const nut = 'w-11 h-11 inline-flex items-center justify-center border-2 border-ink text-sm font-semibold transition-colors'
    return (
      <nav className="flex justify-center items-center gap-2 mt-10" aria-label="Phân trang vé">
        <button type="button" aria-label="Trang trước" onClick={() => setPagination(prev => ({ ...prev, page: prev.page - 1 }))} disabled={pagination.page === 1} className={`${nut} text-ink hover:bg-ink hover:text-lamp disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:text-ink`}>
          <ChevronLeft size={18} aria-hidden="true" />
        </button>
        {Array.from({ length: pagination.totalPages }, (_, i) => i + 1).map(num => (
          <button type="button" key={num} aria-current={pagination.page === num ? 'page' : undefined} onClick={() => setPagination(prev => ({ ...prev, page: num }))} className={`${nut} font-mono ${pagination.page === num ? 'bg-ink text-lamp' : 'text-ink hover:bg-ink hover:text-lamp'}`}>
            {num}
          </button>
        ))}
        <button type="button" aria-label="Trang sau" onClick={() => setPagination(prev => ({ ...prev, page: prev.page + 1 }))} disabled={pagination.page === pagination.totalPages} className={`${nut} text-ink hover:bg-ink hover:text-lamp disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:text-ink`}>
          <ChevronRight size={18} aria-hidden="true" />
        </button>
      </nav>
    )
  }

  return (
    <div>
      {/* ===== KỶ NIỆM ĐÊM ĐÃ ĐẾN (MLACP-546): ảnh Polaroid cho mỗi buổi khách đã thật sự có mặt ===== */}
      <KyNiemDemDaDen />

      {/* ===== TÌM VÉ ===== */}
      <div className="relative mb-4 max-w-xl">
        <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-mute" aria-hidden="true" />
        <input
          type="search"
          aria-label="Tìm vé trong trang hiện tại"
          placeholder="Tìm theo tên buổi diễn, phòng trà hoặc mã vé"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-10 pr-11 min-h-[44px] bg-card border-2 border-ink text-sm text-ink placeholder:text-ink-mute focus:outline-none focus:ring-2 focus:ring-ink focus:ring-offset-2 focus:ring-offset-stock"
        />
        {searchQuery && (
          <button type="button" onClick={() => setSearchQuery('')} aria-label="Xoá từ khoá" className="absolute right-0 top-0 w-11 h-11 inline-flex items-center justify-center text-ink-soft hover:text-ink">
            <X size={16} aria-hidden="true" />
          </button>
        )}
      </div>

      {/* ===== LỌC: thời gian + loại vé ===== */}
      <div className="flex flex-wrap items-center gap-x-6 gap-y-3 mb-8">
        <div className="flex flex-wrap gap-2" role="group" aria-label="Lọc theo thời gian">
          {subTabs.map(tab => (
            <button type="button" key={tab.key} aria-pressed={activeSubTab === tab.key} onClick={() => setActiveSubTab(tab.key)} className={nutLoc(activeSubTab === tab.key)}>
              {tab.label}
            </button>
          ))}
        </div>
        <div className="flex flex-wrap gap-2" role="group" aria-label="Lọc theo loại vé">
          {typeTabs.map(tab => (
            <button type="button" key={tab.key} aria-pressed={typeFilter === tab.key} onClick={() => setTypeFilter(tab.key)} className={nutLoc(typeFilter === tab.key)}>
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* ===== NỘI DUNG ===== */}
      {isLoading ? (
        <ul className="flex flex-col gap-5" aria-busy="true" aria-label="Đang tải vé">
          {[0, 1, 2].map((i) => (
            <li key={i} className="flex bg-card border-2 border-ink/20">
              <div className="w-24 sm:w-32 bg-ink/10 animate-pulse min-h-[150px]" />
              <div className="flex-1 p-5 space-y-3">
                <div className="h-4 w-40 bg-ink/10 animate-pulse" /><div className="h-7 w-3/4 bg-ink/10 animate-pulse" /><div className="h-4 w-1/2 bg-ink/10 animate-pulse" />
              </div>
            </li>
          ))}
        </ul>
      ) : loi ? (
        <div role="alert" className="flex flex-wrap items-center justify-between gap-4 bg-card border-2 border-ink p-6">
          <p>Chưa tải được danh sách vé. Vé của bạn vẫn còn nguyên, hãy kiểm tra kết nối rồi thử lại.</p>
          <button type="button" onClick={() => setLanTai((n) => n + 1)} className="min-h-[44px] px-5 bg-ink text-lamp font-semibold hover:bg-board transition-colors">Thử lại</button>
        </div>
      ) : tickets.length === 0 ? (
        /* CHƯA CÓ VÉ GÌ CẢ */
        <div className="bg-card border-2 border-ink p-8 sm:p-12">
          <p className="font-display text-3xl text-ink leading-none">Bạn chưa có vé nào.</p>
          <p className="text-ink-soft mt-3 max-w-prose">Vé mua xong sẽ nằm ở đây, kèm mã QR để vào cửa. Tiền vé được giữ hộ tới khi buổi diễn diễn ra.</p>
          <Link to="/shows" className="inline-flex items-center min-h-[44px] mt-5 px-5 bg-ink text-lamp font-semibold hover:bg-board transition-colors">Xem các buổi diễn đang mở bán</Link>
        </div>
      ) : filteredTickets.length > 0 ? (
        <>
          <ul className="flex flex-col gap-5">
            {filteredTickets.map(ev => {
              const online = isOnlineTicket(ev.accessType)
              const tt = TRANG_THAI_VE[ev.status] ?? { nhan: ev.status || 'Chưa rõ trạng thái' }
              const hetHieuLuc = ev.status === 'Cancelled' || ev.status === 'Refunded'
              const thoiGian = nhanThoiGian(ev.start_date)
              return (
                <li key={ev.id} className="relative flex bg-card border-2 border-ink shadow-soft group">
                  {/* CUỐNG VÉ: ngày và giờ trên khối sơn then, ngăn với thân vé bằng đường đục lỗ */}
                  <div className="w-24 sm:w-32 flex-shrink-0 bg-board text-lamp p-3 sm:p-4 flex flex-col items-center justify-center text-center border-r-2 border-dashed border-lamp/50">
                    {ev.start_date ? (
                      <>
                        <p className="text-xs sm:text-sm text-lamp-mute">{thuVietHoa(ev.start_date)}</p>
                        <p className="font-display text-3xl sm:text-4xl leading-none mt-1">{ngayGon(ev.start_date)}</p>
                        <p className="font-mono text-sm sm:text-base mt-2">{gioTrongNgay(ev.start_date)}</p>
                      </>
                    ) : <p className="text-sm text-lamp-mute">Chưa có giờ diễn</p>}
                  </div>

                  {/* THÂN VÉ */}
                  <div className="flex-1 min-w-0 p-4 sm:p-6 flex flex-col gap-3">
                    <div className="flex flex-wrap items-center gap-2">
                      <NhanNho dam={!hetHieuLuc}>{tt.nhan}</NhanNho>
                      <NhanNho>{online ? <><Video size={12} aria-hidden="true" /> Vé xem trực tuyến</> : <><MapPin size={12} aria-hidden="true" /> Vé tại chỗ</>}</NhanNho>
                      {thoiGian && <NhanNho>{thoiGian}</NhanNho>}
                    </div>

                    {/* "Stretched link": thẻ <a> này phủ toàn bộ tấm vé bằng after:inset-0, nên bấm chỗ nào cũng vào chi
                        tiết vé — mà KHÔNG phải lồng <a> trong <a>, nhờ vậy các liên kết bên dưới trỏ đi chỗ khác được. */}
                    <h3 className={`font-display text-2xl sm:text-3xl leading-[1.15] font-normal break-words ${hetHieuLuc ? 'text-ink-mute line-through decoration-1' : 'text-ink'}`}>
                      <Link to={`/my-shows/ticket/${ev.id}`} className="after:absolute after:inset-0 after:content-[''] group-hover:underline underline-offset-4">
                        {ev.title}
                      </Link>
                    </h3>

                    <p className="flex items-center gap-2 text-sm text-ink-soft">
                      <MapPin size={15} className="flex-shrink-0" aria-hidden="true" />
                      <span className="truncate">{ev.loungeName || 'Chưa rõ phòng trà'}</span>
                      {/* Ngày đủ năm chỉ in từ sm: trên điện thoại cuống vé đã có ngày, in thêm ở đây làm tên phòng trà bị cắt. */}
                      {ev.start_date && <span className="hidden sm:inline font-mono text-ink-mute flex-shrink-0">{ngayDayDu(ev.start_date)}</span>}
                    </p>

                    <div className="flex flex-wrap items-end justify-between gap-3 pt-3 mt-auto border-t border-ink/20">
                      <div className="flex items-center gap-3 min-w-0">
                        {/* Dấu mộc CHỈ cho trạng thái tiền (đã trả, đã hoàn) — DESIGN.md: Stamp-Is-Money. */}
                        {tt.dau && <DauMoc vongNgoai="MUSICLOUNGE · TIỀN VÉ · " giua={tt.dau} size={76} xoay={-10} className="flex-shrink-0 hidden sm:block" />}
                        <div className="min-w-0">
                          <p className="text-sm text-ink-soft truncate">{ev.tierName}</p>
                          <p className="font-mono text-lg font-semibold text-ink">{typeof ev.pricePaid === 'number' ? `${ev.pricePaid.toLocaleString('vi-VN')}đ` : 'Chưa rõ số tiền'}</p>
                        </div>
                      </div>

                      {/* KHÁC NHAU THEO LOẠI VÉ.
                          Nút của vé trực tuyến TRƯỚC ĐÂY LÀ LỜI HỨA SAI: nó ghi "View Livestream" nhưng cả thẻ chỉ dẫn tới
                          trang mã QR. Nay nó dẫn thẳng tới trang phát. Chưa tới giờ phát thì trang đó nói rõ là buổi diễn
                          chưa có phiên livestream, chứ không vỡ. `z-10` để nằm trên lớp phủ của stretched link.
                          Vé đã huỷ / đã hoàn không còn lối vào nên không in nút. */}
                      {!hetHieuLuc && (online ? (
                        <Link to={`/livestream/${ev.showId}`} className="relative z-10 inline-flex items-center gap-2 min-h-[44px] px-4 bg-ink text-lamp text-sm font-semibold hover:bg-board transition-colors">
                          <Video size={16} aria-hidden="true" /> Vào xem trực tuyến
                        </Link>
                      ) : (
                        <span className="inline-flex items-center gap-2 min-h-[44px] px-4 bg-ink text-lamp text-sm font-semibold group-hover:bg-board transition-colors">
                          <QrCode size={16} aria-hidden="true" /> Xem mã QR vào cửa
                        </span>
                      ))}
                    </div>

                    {/* Lối sang trang buổi diễn: từ đây mới xem được chương trình, đánh giá sau khi kết thúc, và các buổi
                        tương tự. Chi tiết VÉ không có đường nào sang đó vì TicketDetailDto không trả showId. */}
                    <LienKetMuiTen to={`/shows/${ev.showId}`} nho className="relative z-10 self-start -my-2">Xem trang buổi diễn</LienKetMuiTen>
                  </div>
                </li>
              )
            })}
          </ul>
          {renderPagination()}
        </>
      ) : (
        /* CÓ VÉ NHƯNG BỘ LỌC KHÔNG KHỚP */
        <div className="bg-card border-2 border-dashed border-ink p-8">
          <p className="text-ink">Không có vé nào khớp bộ lọc trong trang này.</p>
          <p className="text-ink-soft text-sm mt-1">Thử đổi từ khoá hoặc bỏ bộ lọc.</p>
          <button type="button" onClick={resetFilters} className="inline-flex items-center gap-1.5 min-h-[44px] mt-3 font-semibold hover:text-ink-soft">
            <X size={16} strokeWidth={1.75} aria-hidden="true" /> Xoá mọi bộ lọc
          </button>
        </div>
      )}
    </div>
  )
}

export default TicketsTab
