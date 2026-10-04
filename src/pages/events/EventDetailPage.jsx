// src/pages/events/EventDetailPage.jsx
import { useState, useRef, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { MapPin, Heart, Share2, Check, X, Copy, Star } from 'lucide-react'
import toast from 'react-hot-toast'
import BiaDia from '../../components/program/BiaDia'
import { thuVietHoa, ngayDayDu, gioTrongNgay } from '../../utils/ngayVietNam'
import DongBuoiDien from '../../components/program/DongBuoiDien'
import ShowMap from '../../components/mshow-detail/ShowMap'
import ShowIntro from '../../components/mshow-detail/ShowIntro'
import ShowRatings from '../../components/mshow-detail/ShowRatings'
import Skeleton from '../../components/shared/Skeleton'
import RatingModal from '../../components/livestream/RatingModal'
import { getShowDetail, getSimilarShows, rateShow } from '../../services/showServices'
import { nhoBuoiVuaXem } from '../../utils/buoiVuaXem'
import { getFollowedLounges, toggleWishlist, toggleFollowLounge } from '../../services/interactionServices'

import { useAuthStore } from '../../store/useAuthStore'
import { formatMinPrice } from '../../utils/formatPrice'
import HopThoai, { TieuDeHop } from '../../components/shared/HopThoai'
import LienKetMuiTen from '../../components/shared/LienKetMuiTen'
import usePhimTab from '../../hooks/usePhimTab'
import NhanDangDien from '../../components/program/NhanDangDien'
import { tieuDeRieng } from '../../utils/tieuDeTrang'

const KHOA_TAB = ['intro', 'map', 'ratings'] // phải khớp TAB trong trang

const EventDetailPage = () => {
  const { id } = useParams()
  const { user } = useAuthStore()
  const [activeTab, setActiveTab] = useState('intro')
  // Bàn phím cho tablist (APG): gọi TRƯỚC mọi return sớm của trang — luật hook.
  const phimTab = usePhimTab(KHOA_TAB, activeTab, setActiveTab)
  const tabsRef = useRef(null)

  const [isShareModalOpen, setIsShareModalOpen] = useState(false)
  const [showRating, setShowRating] = useState(false)
  const [isCopied, setIsCopied] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [apiError, setApiError] = useState(null)
  const [data, setData] = useState(null)
  const [relatedEvents, setRelatedEvents] = useState([])
  const [isWishlisted, setIsWishlisted] = useState(false)
  const [isFollowing, setIsFollowing] = useState(false)
  const [isUpdating, setIsUpdating] = useState(false)

  useEffect(() => {
    const fetchEventData = async () => {
      setIsLoading(true)
      setApiError(null)
      try {
        const detailRes = await getShowDetail(id)

        if (detailRes.success) {
          const beData = detailRes.data
          // Nhớ buổi vừa xem TRÊN MÁY NÀY cho gợi ý của khách ở trang chủ (utils/buoiVuaXem.js — không gửi đi đâu khác).
          nhoBuoiVuaXem(beData.id)
          const mappedData = {
            ...beData,
            title: beData.name,
            posterImage: beData.coverImageUrl,
            // Ảnh thật của phòng trà — dùng khi buổi diễn chưa có ảnh bìa (vẫn là ảnh thật, không phải ảnh kho).
            loungeImage: beData.lounge?.primaryImageUrl ?? null,
            loungeName: beData.lounge?.name,
            loungeId: beData.lounge?.id,
            address: beData.lounge?.fullAddress,
            // Ngày giờ đi qua utils/ngayVietNam (một nguồn định dạng cho cả web). MLACP-633: LUÔN in giờ kết thúc — dùng
            // effectiveEnd (backend đã áp "không khai thì + 4 tiếng"), không dùng scheduledEnd có thể trống.
            dateStr: beData.scheduledStart
              ? `${thuVietHoa(beData.scheduledStart)} ${ngayDayDu(beData.scheduledStart)}, ${gioTrongNgay(beData.scheduledStart)}${(beData.effectiveEnd ?? beData.scheduledEnd) ? ' đến ' + gioTrongNgay(beData.effectiveEnd ?? beData.scheduledEnd) : ''}`
              : null,
            genre: beData.genres?.map((g) => g.name).join(', ') || null,
            // Giá thấp nhất trong các hạng vé đang có — số thật từ ticketTiers, không ước lượng.
            giaTu: (() => {
              const gia = (beData.ticketTiers ?? []).flatMap((t) => (t.prices ?? []).map((p) => p.price)).filter((x) => typeof x === 'number')
              return gia.length ? formatMinPrice({ minPrice: Math.min(...gia), maxPrice: Math.max(...gia) }) : null
            })(),
            tags: [
              ({ Offline: 'Tại chỗ', Online: 'Trực tuyến', Hybrid: 'Kết hợp' })[beData.format] || beData.format,
              ...(beData.genres ?? []).map((x) => x.name), ...(beData.moods ?? []).map((x) => x.name), ...(beData.atmospheres ?? []).map((x) => x.name),
            ].filter(Boolean),
            performers: beData.performers || [],
            // Ba trường quyết định lối đi của khán giả theo trạng thái show
            status: beData.status,
            isOngoing: beData.isOngoing,
            scheduledStart: beData.scheduledStart, // giờ gốc cho bảng "đang lên sân khấu" (BangLenSanKhau)
            userHasTicket: beData.userHasTicket,
            userHasRated: beData.userHasRated,
            description: beData.description || 'Chưa có mô tả cho buổi diễn này.',
            // ĐÃ BỎ (30/09) loungeLogo lấy từ api.dicebear.com: gọi sang dịch vụ ngoài mỗi lần mở trang và sinh vòng tròn
            // chữ cái nền xanh lục — không thuộc thế giới thiết kế. Tên phòng trà in bằng chữ, dẫn sang trang phòng trà.
          }

          setData(mappedData)
          setIsWishlisted(beData.isWishlisted || false)

          // TRẠNG THÁI FOLLOW: true dùng luôn, null/false mới check API
          if (beData.isFollowing === true) {
            setIsFollowing(true)
          } else if (user && beData.lounge?.id) {
            try {
              const followRes = await getFollowedLounges({ page: 1, pageSize: 100 })
              if (followRes.success) {
                const followedIds = followRes.data.items.map(l => l.id)
                setIsFollowing(followedIds.includes(beData.lounge.id))
              }
            } catch { console.log('Error check follow status') }
          } else {
            setIsFollowing(false)
          }

          // SHOWS TƯƠNG TỰ — endpoint /similar (BE chọn cùng phòng trà / chung thể loại)
          try {
            const simRes = await getSimilarShows(beData.id)
            if (simRes.success) {
              // Giữ nguyên hình dạng dòng của API (DongBuoiDien đọc thẳng) — không đổi tên trường, không bịa trường thiếu.
              const related = simRes.data ?? []
              setRelatedEvents(related)
            }
          } catch { console.log('Không tải được buổi diễn tương tự.') }
        } else {
          setApiError(detailRes.message || 'Không tìm thấy buổi diễn')
        }
      } catch (err) {
        console.error('API Detail Error:', err)
        setApiError('Không thể tải chi tiết buổi diễn.')
      } finally {
        setIsLoading(false)
      }
    }
    fetchEventData()
  }, [id, user])

  const handleToggleWishlist = async () => {
    if (isUpdating) return
    const prevStatus = isWishlisted
    setIsWishlisted(!prevStatus)
    setIsUpdating(true)
    try {
      await toggleWishlist(id, prevStatus)
      toast.success(prevStatus ? 'Đã bỏ khỏi yêu thích' : 'Đã thêm vào yêu thích')
    } catch (err) {
      setIsWishlisted(prevStatus)
      toast.error(err.response?.data?.message || 'Thao tác thất bại.')
    } finally {
      setIsUpdating(false)
    }
  }

  const handleToggleFollow = async () => {
    if (isUpdating || !data?.loungeId) return
    const prevStatus = isFollowing
    setIsFollowing(!prevStatus)
    setIsUpdating(true)
    try {
      await toggleFollowLounge(data.loungeId, prevStatus)
      toast.success(prevStatus ? `Đã bỏ theo dõi ${data.loungeName}` : `Đang theo dõi ${data.loungeName}`)
    } catch (err) {
      setIsFollowing(prevStatus)
      toast.error(err.response?.data?.message || 'Thao tác thất bại.')
    } finally {
      setIsUpdating(false)
    }
  }

  const handleBookTicket = () => {
    setActiveTab('map')
    setTimeout(() => { tabsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }) }, 100)
  }

  const handleCopyLink = () => {
    navigator.clipboard.writeText(window.location.href)
    setIsCopied(true)
    setTimeout(() => setIsCopied(false), 2000)
  }

  // Esc đóng hộp chia sẻ — hộp thoại nào cũng phải thoát được bằng bàn phím.
  useEffect(() => {
    if (!isShareModalOpen) return
    const khiBam = (e) => { if (e.key === 'Escape') setIsShareModalOpen(false) }
    window.addEventListener('keydown', khiBam)
    return () => window.removeEventListener('keydown', khiBam)
  }, [isShareModalOpen])

  if (isLoading) {
    return (
      <div className="min-h-screen bg-stock pb-20" aria-busy="true" aria-label="Đang tải buổi diễn">
        {/* MLACP-602: tiêu đề tab theo tên buổi diễn (utils/tieuDeTrang). Đúng MỘT <title> ở mỗi nhánh return. */}
        <title>{tieuDeRieng('Buổi diễn')}</title>
        <div className="bg-board">
          <div className="max-w-[1440px] mx-auto grid lg:grid-cols-[minmax(0,1fr)_minmax(0,1.15fr)]">
            <div className="px-4 sm:px-8 py-12 space-y-5">
              <div className="h-4 w-56 bg-lamp/10 animate-pulse" />
              <div className="h-16 w-4/5 bg-lamp/10 animate-pulse" />
              <div className="h-6 w-1/2 bg-lamp/10 animate-pulse" />
              <div className="h-12 w-40 bg-lamp/10 animate-pulse" />
            </div>
            <div className="min-h-[240px] lg:min-h-[480px] bg-board-soft animate-pulse" />
          </div>
        </div>
        <div className="max-w-[1440px] mx-auto px-4 sm:px-8 mt-10 space-y-4">
          <Skeleton className="h-8 w-64" /><Skeleton className="h-4 w-full" /><Skeleton className="h-4 w-2/3" />
        </div>
      </div>
    )
  }

  if (apiError || !data) {
    return (
      <div className="min-h-screen bg-stock flex flex-col items-center justify-center text-ink px-4 text-center">
        <title>{tieuDeRieng('Không tìm thấy buổi diễn')}</title>
        <h1 className="text-4xl mb-4">{apiError || 'Không tìm thấy buổi diễn'}</h1>
        <LienKetMuiTen to="/shows" lui>Xem các buổi diễn khác</LienKetMuiTen>
      </div>
    )
  }

  const TAB = [['intro', 'Chi tiết'], ['map', 'Vé và chỗ ngồi'], ['ratings', 'Đánh giá']]
  // Nút chính trên khối sơn then: cùng vật liệu với nút "Đặt chỗ" của bảng giờ diễn.
  const NUT_CHINH = 'inline-flex items-center justify-center gap-2 min-h-[52px] px-8 bg-stock text-ink font-display text-2xl hover:bg-lamp transition-colors'
  const NUT_PHU = 'inline-flex items-center justify-center min-h-[52px] px-7 border-2 border-lamp text-lamp font-semibold hover:bg-lamp hover:text-board transition-colors'

  return (
    <div className="min-h-screen bg-stock text-ink pb-20">
      <title>{tieuDeRieng(data.title)}</title>

      {/* ===== ĐẦU TRANG: khối sơn then, chữ bên trái, ảnh bên phải =====
          Ảnh KHÔNG bị phủ lớp chuyển sắc như bản cũ: ảnh sân khấu là thứ mang màu của trang, giao diện lùi lại. */}
      <section className="bg-board text-lamp" aria-labelledby="ten-buoi-dien">
        <div className="max-w-[1440px] mx-auto grid lg:grid-cols-[minmax(0,1fr)_minmax(0,1.15fr)]">
          <div className="relative order-first lg:order-last min-h-[240px] lg:min-h-[520px] bg-board-soft">
            {/* Chưa có ảnh bìa: dùng ảnh thật của phòng trà thay vì khuông nhạc trống (chủ dự án 02/10/2026: nửa đầu
                trang trống trông như "bị che"). Không có cả hai mới rơi về CoverFallback. */}
            {/* 03/10/2026: ảnh in thành BÌA ĐĨA, đĩa than 3D (three.js, tải lười) ló ra sau bìa — kéo để quay, đang diễn
                thì tự quay. Không có WebGL thì chỉ còn bìa, như ảnh tĩnh trước đây. */}
            <BiaDia
              anh={data.posterImage || data.loungeImage || null}
              alt={data.posterImage ? `Ảnh buổi diễn ${data.title}` : `Ảnh ${data.loungeName}`}
              ten={data.title} phongTra={data.loungeName} ngay={data.dateStr}
              soTietMuc={data.performers?.length ?? 0} dangDien={Boolean(data.isOngoing)} />

          </div>

          <div className="px-4 sm:px-8 py-10 lg:py-14 flex flex-col items-start">
            <div className="flex flex-wrap items-center gap-3">
              {data.dateStr && <p className="font-mono text-sm sm:text-base text-lamp-mute">{data.dateStr}</p>}
              {data.isOngoing && <NhanDangDien co="vua" />}
            </div>
            <h1 id="ten-buoi-dien" className="mt-4 text-[clamp(2.5rem,5vw,4.5rem)] leading-[0.98] text-lamp break-words">{data.title}</h1>
            <p className="mt-5">
              <LienKetMuiTen to={`/lounge/${data.loungeId}`} nen="muc" className="font-display text-2xl leading-none min-h-[44px]">{data.loungeName}</LienKetMuiTen>
            </p>
            {data.address && (
              <p className="mt-2 flex items-start gap-2 text-lamp-mute">
                <MapPin size={18} className="flex-shrink-0 mt-0.5" aria-hidden="true" /><span>{data.address}</span>
              </p>
            )}

            {/* LỐI ĐI TIẾP THEO TRẠNG THÁI BUỔI DIỄN */}
            <div className="mt-8 w-full">
              {data.isOngoing ? (
                <div className="flex flex-wrap gap-3">
                  <Link to={`/livestream/${id}`} className="inline-flex items-center justify-center gap-2 min-h-[52px] px-7 bg-ember text-board font-display text-2xl hover:bg-lamp transition-colors">
                    Xem trực tiếp
                  </Link>
                  <button type="button" onClick={handleBookTicket} className={NUT_PHU}>Mua vé</button>
                </div>
              ) : data.status === 'Ended' ? (
                data.userHasRated ? (
                  <p className="flex items-center gap-2 text-lamp-mute"><Star size={16} className="text-lamp fill-lamp" aria-hidden="true" /> Bạn đã đánh giá buổi diễn này.</p>
                ) : data.operatorInfo && user?.role !== 'Admin' ? (
                  // MLACP-591: backend chỉ trả operatorInfo cho chủ/nhân viên của chính phòng trà này (và Admin) — họ không
                  // được đánh giá buổi của phòng trà mình (backend cũng từ chối), nên báo thay cho nút.
                  <p className="text-lamp-mute">Buổi diễn đã kết thúc. Người của phòng trà không đánh giá buổi diễn của chính phòng trà mình.</p>
                ) : data.userHasTicket ? (
                  <button type="button" onClick={() => setShowRating(true)} className={NUT_CHINH}><Star size={20} aria-hidden="true" /> Đánh giá buổi diễn</button>
                ) : (
                  <p className="text-lamp-mute">Buổi diễn đã kết thúc.</p>
                )
              ) : data.status === 'Cancelled' ? (
                <p className="text-lamp font-semibold border-l-4 border-lamp pl-3">Buổi diễn này đã bị huỷ. Vé đã mua được hoàn theo chính sách bên dưới.</p>
              ) : (
                <div className="flex flex-wrap items-center gap-x-6 gap-y-3">
                  <button type="button" onClick={handleBookTicket} className={`${NUT_CHINH} w-full sm:w-auto`}>Đặt vé</button>
                  {data.giaTu && (
                    <p className="flex items-baseline gap-2 text-lamp-mute">Giá vé từ <span className="font-display text-3xl text-lamp leading-none">{data.giaTu}</span></p>
                  )}
                </div>
              )}
              {!['Ended', 'Cancelled'].includes(data.status) && (
                <p className="mt-3 text-sm text-lamp-mute">Tiền vé được giữ hộ tới khi buổi diễn diễn ra.</p>
              )}
            </div>

            <div className="flex items-center gap-2 mt-8 -ml-2">
              <button type="button" onClick={handleToggleWishlist} disabled={isUpdating} aria-pressed={isWishlisted}
                className={`inline-flex items-center gap-2 min-h-[44px] px-2 font-medium transition-colors ${isWishlisted ? 'text-lamp' : 'text-lamp-mute hover:text-lamp'}`}>
                <Heart size={20} className={isWishlisted ? 'fill-lamp' : ''} aria-hidden="true" />
                {isWishlisted ? 'Đã yêu thích' : 'Yêu thích'}
              </button>
              <button type="button" onClick={() => setIsShareModalOpen(true)} className="inline-flex items-center gap-2 min-h-[44px] px-2 font-medium text-lamp-mute hover:text-lamp transition-colors">
                <Share2 size={20} aria-hidden="true" /> Chia sẻ
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* ===== TAB ===== */}
      <div ref={tabsRef} className="max-w-[1440px] mx-auto px-4 sm:px-8 mt-8 mb-8 border-b-2 border-ink scroll-mt-24">
        <div className="flex gap-6 sm:gap-10 overflow-x-auto hide-scrollbar" role="tablist" aria-label="Nội dung buổi diễn">
          {TAB.map(([khoa, nhan]) => (
            <button key={khoa} type="button" role="tab" id={`tab-${khoa}`} aria-selected={activeTab === khoa} aria-controls="noi-dung-tab"
              {...phimTab(khoa)} onClick={() => setActiveTab(khoa)}
              className={`min-h-[48px] pb-3 text-lg font-semibold whitespace-nowrap border-b-4 -mb-[2px] transition-colors ${activeTab === khoa ? 'border-ink text-ink' : 'border-transparent text-ink-mute hover:text-ink'}`}>
              {nhan}
            </button>
          ))}
        </div>
      </div>

      {/* ===== NỘI DUNG ===== */}
      <div id="noi-dung-tab" role="tabpanel" aria-labelledby={`tab-${activeTab}`} className="max-w-[1440px] mx-auto px-4 sm:px-8">
        {activeTab === 'intro' && <ShowIntro data={data} isFollowing={isFollowing} onToggleFollow={handleToggleFollow} />}
        {activeTab === 'map' && <ShowMap showData={data} />}
        {/* Tab đánh giá tự gọi API riêng, chỉ fetch khi user bấm vào */}
        {activeTab === 'ratings' && <ShowRatings showId={id} />}
      </div>

      {/* ===== BUỔI DIỄN TƯƠNG TỰ ===== */}
      {relatedEvents.length > 0 && (
        <section aria-labelledby="tuong-tu-td" className="max-w-[1440px] mx-auto px-4 sm:px-8 mt-24">
          <h2 id="tuong-tu-td" className="text-4xl mb-5">Buổi diễn tương tự</h2>
          {/* Danh sách dọc thay cho băng chuyền cuộn ngang (DESIGN.md: không cuộn ngang). Backend đã giới hạn số buổi trả về. */}
          <ol className="border-y-2 border-ink">
            {relatedEvents.map((b) => <DongBuoiDien key={b.id} b={b} />)}
          </ol>
        </section>
      )}

      {/* ===== MODAL ĐÁNH GIÁ — reuse RatingModal của livestream ===== */}
      {showRating && (
        <RatingModal
          showName={data.title}
          onClose={() => setShowRating(false)}
          onSubmit={async (rating, comment) => {
            try {
              await rateShow(id, { score: rating, comment })
            } catch (err) {
              // 409 = đã đánh giá rồi → coi như thành công, cập nhật trạng thái
              if (err.response?.status !== 409) throw err
              toast.error('Bạn đã đánh giá buổi diễn này rồi.')
            }
            setData((p) => ({ ...p, userHasRated: true }))
          }}
        />
      )}

      {/* ===== HỘP CHIA SẺ ===== */}
      {isShareModalOpen && (
        // HopThoai (Radix): bản cũ có role=dialog nhưng Tab thoát ra trang sau, Esc không đóng (rà soát 01/10/2026).
        <HopThoai onDong={() => setIsShareModalOpen(false)} className="max-w-md p-6">
          <div>
            <div className="flex justify-between items-center mb-5">
              <TieuDeHop><h2 className="text-3xl text-ink">Chia sẻ buổi diễn</h2></TieuDeHop>
              <button type="button" onClick={() => setIsShareModalOpen(false)} aria-label="Đóng" className="w-11 h-11 inline-flex items-center justify-center text-ink hover:bg-ink hover:text-lamp transition-colors"><X size={20} aria-hidden="true" /></button>
            </div>
            <p className="text-ink-soft text-sm mb-3">Sao chép liên kết bên dưới để gửi bạn bè:</p>
            <div className="flex items-center gap-2 bg-sunken border border-ink p-2 pl-4">
              <span className="text-ink-soft text-sm flex-1 truncate">{window.location.href}</span>
              <button type="button" onClick={handleCopyLink} className="inline-flex items-center gap-1.5 min-h-[44px] px-4 text-sm font-semibold bg-ink text-lamp hover:bg-board transition-colors">
                {isCopied ? <><Check size={14} aria-hidden="true" /> Đã sao chép</> : <><Copy size={14} aria-hidden="true" /> Sao chép</>}
              </button>
            </div>
          </div>
        </HopThoai>
      )}
    </div>
  )
}

export default EventDetailPage
