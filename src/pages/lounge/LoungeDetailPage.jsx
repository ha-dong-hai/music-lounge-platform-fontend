// src/pages/lounge/LoungeDetailPage.jsx
//
// TRANG PHÒNG TRÀ — làm lại 30/09/2026 trong thế giới "tờ chương trình".
//
// THỨ TỰ NỘI DUNG: tên + địa chỉ + bộ ảnh → LỊCH DIỄN → giới thiệu và chỗ ngồi → tham quan 360°. Lịch diễn đứng
// ngay sau phần đầu vì đó là thứ người ta vào trang địa điểm để tìm (DICE và Ticketmaster đều xếp như vậy — xem
// reports/Trang phòng trà ảnh và lịch diễn.md ở repo backend). Bản cũ đặt lịch diễn ở CUỐI trang, sau cả khối
// "Cộng đồng".
//
// NHỮNG THỨ BẢN CŨ BỊA RA, NAY BỎ:
//  - Ảnh kho Unsplash khi phòng trà chưa có ảnh (cho người mua vé xem không gian của một nơi khác).
//  - Dòng nhạc "Acoustic" và tâm trạng "Chill" gắn cho mọi buổi diễn thiếu dữ liệu.
//  - Câu giữ chỗ cho phần giới thiệu và cho mô tả khu vực.
// Thông báo tiếng Anh ("Following…", "Unfollowed…", "Updating") đã đổi sang tiếng Việt.
//
// MỘT CON SỐ, MỘT NGUỒN: số đêm diễn sắp tới in ở tiêu đề "Lịch diễn" là số dòng THẬT của danh sách bên dưới, không
// lấy `upcomingShowCount` của API chi tiết — hai nguồn đếm theo hai cách thì cùng một trang sẽ in hai con số khác nhau.
import { useState, useEffect, useCallback } from 'react'
import { useParams, Link, useLocation } from 'react-router-dom'
import { MapPin, Share2 } from 'lucide-react'
import toast from 'react-hot-toast'
import BoAnh from '../../components/lounge/BoAnh'
import LichDienPhongTra from '../../components/lounge/LichDienPhongTra'
import LoungeAbout from '../../components/lounge/LoungeAbout'
import { useAuthStore } from '../../store/useAuthStore'
import { getLoungeDetail, getLoungeZones, getLoungeTour } from '../../services/loungeServices'
import { getShowsByLounge } from '../../services/showServices'
import { getFollowedLounges, toggleFollowLounge } from '../../services/interactionServices'
import { chiaLichPhongTra, TRAN_TAI } from '../../utils/lichPhongTra'
import LienKetMuiTen from '../../components/shared/LienKetMuiTen'

// Trình xem 360° kéo theo three.js (~500KB) — chỉ tải khi phòng trà THẬT SỰ có tour, không làm nặng
// bundle chính của mọi trang.
import KhongGianPhongTra from '../../components/lounge/KhongGianPhongTra'
import { tieuDeRieng } from '../../utils/tieuDeTrang'

const NUT_DAC = 'inline-flex items-center justify-center min-h-[52px] px-7 bg-stock text-ink font-display text-2xl hover:bg-lamp transition-colors disabled:opacity-60'
const NUT_VIEN = 'inline-flex items-center justify-center min-h-[52px] px-7 border-2 border-lamp text-lamp font-semibold hover:bg-lamp hover:text-board transition-colors disabled:opacity-60'
const NUT_VIEN_GIAY = 'inline-flex items-center justify-center min-h-[48px] px-6 border-2 border-ink text-ink font-semibold hover:bg-ink hover:text-lamp transition-colors disabled:opacity-60'
const NUT_CHU = 'inline-flex items-center gap-2 min-h-[44px] px-2 font-medium text-lamp-mute hover:text-lamp transition-colors'

const LoungeDetailPage = () => {
  const { id } = useParams()
  const location = useLocation()
  const { user, token } = useAuthStore()

  const [isLoading, setIsLoading] = useState(true)
  const [apiError, setApiError] = useState(null)
  const [lounge, setLounge] = useState(null)
  const [zones, setZones] = useState([])
  const [tourScenes, setTourScenes] = useState([])
  const [anhMatBang, setAnhMatBang] = useState(null)
  // Lịch diễn có vòng đời RIÊNG: null = đang tải, mảng = đã có; lỗi thì hiện nút thử lại tại chỗ chứ không ẩn cả khối.
  const [buoiDien, setBuoiDien] = useState(null)
  const [tongBuoi, setTongBuoi] = useState(0)
  const [loiLich, setLoiLich] = useState(false)

  const [isFollowing, setIsFollowing] = useState(false)
  const [isUpdatingFollow, setIsUpdatingFollow] = useState(false)

  const taiLich = useCallback(async (loungeId) => {
    setLoiLich(false)
    setBuoiDien(null)
    try {
      const res = await getShowsByLounge(loungeId, { page: 1, pageSize: TRAN_TAI })
      if (!res?.success) throw new Error(res?.message || 'lich')
      setBuoiDien(res.data?.items ?? [])
      setTongBuoi(res.data?.totalCount ?? 0)
    } catch {
      setLoiLich(true)
      setBuoiDien([])
    }
  }, [])

  useEffect(() => {
    let huy = false
    const fetchLoungeData = async () => {
      setIsLoading(true)
      setApiError(null)
      setZones([]); setTourScenes([])
      try {
        const resLounge = await getLoungeDetail(id)
        if (huy) return
        if (!resLounge.success) {
          setApiError(resLounge.message || 'Không tìm thấy phòng trà này.')
          return
        }
        const beData = resLounge.data

        // Ảnh: thư viện theo thứ tự chủ phòng trà đã xếp; chưa có thư viện thì dùng ảnh đại diện; không có gì thì
        // mảng RỖNG (BoAnh in ô "Chưa có ảnh") — không bao giờ thay bằng ảnh của nơi khác.
        const thuVien = (beData.galleryImages || [])
          .filter((g) => g.imageUrl)
          .slice()
          .sort((a, b) => (a.orderIndex || 0) - (b.orderIndex || 0))
          .map((g) => ({ url: g.imageUrl, caption: g.caption || null }))
        const images = thuVien.length > 0 ? thuVien : beData.primaryImageUrl ? [{ url: beData.primaryImageUrl, caption: null }] : []

        setLounge({ ...beData, images })

        // ===== FOLLOW: true/false dùng luôn, null mới check API =====
        if (typeof beData.isFollowing === 'boolean') {
          setIsFollowing(beData.isFollowing)
        } else if (user && token) {
          getFollowedLounges({ page: 1, pageSize: 100 })
            .then((followRes) => {
              if (!huy && followRes.success) setIsFollowing(followRes.data.items.some((l) => l.id === beData.id))
            })
            .catch(() => {}) // không đọc được thì nút hiện "Theo dõi" — máy chủ vẫn là nơi quyết định
        }

        // Lịch diễn, khu vực và tour tải SONG SONG, mỗi thứ tự chịu lỗi của mình: tour hay khu vực lỗi thì chỉ khối
        // đó không hiện; lịch diễn lỗi thì có trạng thái lỗi riêng (xem taiLich).
        taiLich(beData.id)
        getLoungeZones(beData.id)
          .then((r) => { if (!huy && r?.success && Array.isArray(r.data)) setZones(r.data) })
          .catch(() => {})
        getLoungeTour(beData.id)
          .then((r) => {
            if (huy || !r?.success) return
            setTourScenes((r.data?.scenes ?? []).filter((sc) => sc.imageUrl))
            setAnhMatBang(r.data?.floorPlanImageUrl ?? null)
          })
          .catch(() => {})
      } catch (err) {
        if (huy) return
        // 404 cũng là câu trả lời của phòng trà bị đình chỉ: với người ngoài, nó không tồn tại.
        setApiError(err.response?.status === 404 ? 'Không tìm thấy phòng trà này.' : 'Trang phòng trà chưa tải được.')
      } finally {
        if (!huy) setIsLoading(false)
      }
    }
    fetchLoungeData()
    return () => { huy = true }
  }, [id, user, token, taiLich])

  const handleToggleFollow = async () => {
    if (isUpdatingFollow || !lounge) return
    const prevStatus = isFollowing
    setIsFollowing(!prevStatus)
    setLounge((prev) => ({ ...prev, followerCount: Math.max(0, (prev.followerCount ?? 0) + (prevStatus ? -1 : 1)) }))
    setIsUpdatingFollow(true)
    try {
      await toggleFollowLounge(lounge.id, prevStatus)
      toast.success(prevStatus ? `Đã bỏ theo dõi ${lounge.name}.` : `Đã theo dõi ${lounge.name} — bạn sẽ được báo khi có đêm diễn mới.`)
    } catch (err) {
      setIsFollowing(prevStatus)
      setLounge((prev) => ({ ...prev, followerCount: Math.max(0, (prev.followerCount ?? 0) + (prevStatus ? 1 : -1)) }))
      toast.error(err.response?.data?.message || 'Không cập nhật được theo dõi.')
    } finally {
      setIsUpdatingFollow(false)
    }
  }

  const handleShare = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href)
      toast.success('Đã sao chép liên kết trang phòng trà.')
    } catch {
      toast.error('Trình duyệt không cho sao chép. Hãy chép địa chỉ trên thanh địa chỉ.')
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-stock pb-20" aria-busy="true" aria-label="Đang tải trang phòng trà">
        <title>{tieuDeRieng('Phòng trà')}</title>
        <div className="bg-board">
          <div className="max-w-[1440px] mx-auto grid lg:grid-cols-[minmax(0,1fr)_minmax(0,1.15fr)]">
            <div className="px-4 sm:px-8 py-12 space-y-5">
              <div className="h-4 w-32 bg-lamp/10 animate-pulse" />
              <div className="h-16 w-4/5 bg-lamp/10 animate-pulse" />
              <div className="h-6 w-2/3 bg-lamp/10 animate-pulse" />
              <div className="h-12 w-44 bg-lamp/10 animate-pulse" />
            </div>
            <div className="aspect-[4/3] bg-board-soft animate-pulse" />
          </div>
        </div>
        <div className="max-w-[1440px] mx-auto px-4 sm:px-8 mt-12">
          <div className="h-64 border-2 border-ink/20 bg-ink/5 animate-pulse" />
        </div>
      </div>
    )
  }

  if (apiError || !lounge) {
    return (
      <div className="min-h-[70vh] bg-stock flex flex-col items-center justify-center text-ink px-4 text-center">
        <title>{tieuDeRieng('Không tìm thấy phòng trà')}</title>
        <h1 className="text-4xl mb-4">{apiError || 'Không tìm thấy phòng trà này.'}</h1>
        <LienKetMuiTen to="/lounges" lui>Xem các phòng trà trên sàn</LienKetMuiTen>
      </div>
    )
  }

  const soSapToi = buoiDien ? chiaLichPhongTra(buoiDien).sapToi.length : 0
  const coLich = soSapToi > 0
  const khuVuc = [lounge.ward, lounge.district, lounge.city].filter(Boolean).join(', ')
  const diaChi = lounge.fullAddress || khuVuc
  // Có toạ độ thì dẫn đúng điểm; không có thì để Google Maps tìm theo địa chỉ chữ. Không nhúng bản đồ: một liên kết
  // mở bản đồ là đủ cho việc chỉ đường và không tải thêm kịch bản bên thứ ba vào mọi lượt xem trang.
  const banDo = lounge.latitude && lounge.longitude
    ? `https://www.google.com/maps/search/?api=1&query=${lounge.latitude},${lounge.longitude}`
    : diaChi ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${lounge.name}, ${diaChi}`)}` : null

  // Nút theo dõi dùng ở hai nơi (đầu trang trên khối tối, và trạng thái "chưa có đêm diễn" trên giấy sáng).
  const nutTheoDoi = (kieu) => (
    user ? (
      <button type="button" onClick={handleToggleFollow} disabled={isUpdatingFollow} aria-pressed={isFollowing} className={kieu}>
        {isFollowing ? 'Đang theo dõi' : 'Theo dõi'}
      </button>
    ) : (
      <Link to="/login" state={{ from: location }} className={kieu}>Đăng nhập để theo dõi</Link>
    )
  )

  return (
    <div className="min-h-screen bg-stock text-ink pb-24">
      {/* MLACP-602: tiêu đề tab theo tên phòng trà. */}
      <title>{tieuDeRieng(lounge.name)}</title>

      {/* ===== ĐẦU TRANG: khối sơn then, chữ bên trái, bộ ảnh bên phải (cùng khuôn với trang buổi diễn) ===== */}
      <section className="bg-board text-lamp" aria-labelledby="ten-phong-tra">
        <div className="max-w-[1440px] mx-auto grid lg:grid-cols-[minmax(0,1fr)_minmax(0,1.15fr)]">
          <div className="order-first lg:order-last sm:px-8 sm:pt-8 lg:pl-0 lg:py-10 pb-2">
            <BoAnh anh={lounge.images} ten={lounge.name} />
          </div>

          <div className="px-4 sm:px-8 py-8 lg:py-14 flex flex-col items-start">
            <LienKetMuiTen to="/lounges" lui nen="muc" nho>Phòng trà trên sàn</LienKetMuiTen>
            <h1 id="ten-phong-tra" className="mt-3 text-[clamp(2.5rem,5vw,4.5rem)] leading-[1.1] text-lamp break-words">{lounge.name}</h1>
            {lounge.atmosphereName && <p className="mt-4 text-lg text-lamp">Không gian {lounge.atmosphereName.toLowerCase()}</p>}

            {diaChi && (
              <p className="mt-4 flex items-start gap-2 text-lamp-mute">
                <MapPin size={18} className="flex-shrink-0 mt-0.5" aria-hidden="true" /><span>{diaChi}</span>
              </p>
            )}
            {banDo && (
              <LienKetMuiTen href={banDo} nen="muc" nho className="ml-[26px]" aria-label="Chỉ đường (mở Google Maps ở thẻ mới)">Chỉ đường</LienKetMuiTen>
            )}

            <div className="mt-6 flex flex-wrap items-center gap-3 w-full">
              {coLich && <a href="#lich-dien" className={`${NUT_DAC} w-full sm:w-auto`}>Xem lịch diễn</a>}
              {nutTheoDoi(`${coLich ? NUT_VIEN : NUT_DAC} w-full sm:w-auto`)}
            </div>
            {/* Chưa ai theo dõi thì không in "0 người theo dõi": con số 0 không giúp ai quyết định điều gì. */}
            {lounge.followerCount > 0 && (
              <p className="mt-3 font-mono text-sm text-lamp-mute">{lounge.followerCount.toLocaleString('vi-VN')} người theo dõi</p>
            )}

            <div className="flex flex-wrap items-center gap-x-4 mt-6 -ml-2">
              <button type="button" onClick={handleShare} className={NUT_CHU}><Share2 size={20} aria-hidden="true" /> Chia sẻ</button>
              <Link to={`/lounge/${lounge.id}/order`} className={NUT_CHU}>Gọi món tại bàn</Link>
            </div>
          </div>
        </div>
      </section>

      <div className="max-w-[1440px] mx-auto px-4 sm:px-8">
        {/* ===== LỊCH DIỄN ===== */}
        <section id="lich-dien" aria-labelledby="tieu-de-lich" className="pt-12 scroll-mt-24">
          <div className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-1 mb-5">
            <h2 id="tieu-de-lich" className="text-5xl">Lịch diễn</h2>
            {coLich && <p className="font-mono text-sm text-ink-mute">{soSapToi} đêm diễn sắp tới</p>}
          </div>
          <LichDienPhongTra ds={buoiDien} tong={tongBuoi} loi={loiLich} onThuLai={() => taiLich(lounge.id)}
            tenPhongTra={lounge.name} theoDoi={nutTheoDoi(NUT_VIEN_GIAY)} anhPhongTra={lounge.primaryImageUrl ?? null} />
        </section>

        {/* ===== GIỚI THIỆU + CHỖ NGỒI ===== */}
        <div className="pt-16"><LoungeAbout lounge={lounge} zones={zones} /></div>

        {/* ===== KHÔNG GIAN VÀ CHỖ NGỒI: khách tự chọn Sơ đồ 3D hoặc Tham quan 360° (03/10/2026) ===== */}
        <KhongGianPhongTra zones={zones} tourScenes={tourScenes} tenPhongTra={lounge.name} anhMatBang={anhMatBang ?? lounge.areaLayoutImageUrl ?? null} />
      </div>
    </div>
  )
}

export default LoungeDetailPage
