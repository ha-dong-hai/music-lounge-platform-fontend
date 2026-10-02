// src/pages/home/HomePage.jsx
//
// TRANG CHỦ — "Đêm nay ở Sài Gòn", thế giới TỜ CHƯƠNG TRÌNH CA NHẠC (chủ dự án chốt 30/09; hợp đồng hướng thiết kế ở
// .impeccable/surfaces/src-pages-home-homepage-jsx.md; ảnh mẫu Stitch ở .impeccable/mocks/stitch/).
// Kiến trúc venue-first 23/09 (YEU-CAU-THIET-KE-LAI-TRANG-CHU.md §7.1): tiêu đề đêm nay → BẢNG GIỜ DIỄN (mỗi dòng một
// phòng trà) → phòng trà trên sàn (không bao giờ trống) → lịch tuần → tìm theo gu → tiền của bạn đi đâu → lối ra.
// Khối "gợi ý cá nhân" và "khối biên tập" của bản cũ bị bỏ khỏi trang chủ theo §7.1 (đa số lượt vào không thấy gì).
//
// Tầng DỮ LIỆU giữ nguyên từ bản cũ (đã kiểm): sortBy='StartingSoon' — KHÔNG dùng 'Newest' vì ở backend đó là
// OrderByDescending(Id), tức thứ tự ĐƯỢC TẠO, sẽ im lặng bỏ sót buổi diễn tối nay.
// THÊM một lượt gọi cho buổi ĐANG DIỄN: 'StartingSoon' lọc ScheduledStart > now nên buổi đã lên sân khấu biến khỏi
// danh sách — mà "đang diễn" là trạng thái bảng giờ diễn phải in (màu than hồng dành riêng cho nó).
import { useState, useEffect, useMemo, useCallback } from 'react'
import { Link } from 'react-router-dom'
import dayjs from 'dayjs'
import { SlidersHorizontal, Plus, Minus } from 'lucide-react'
import BangGioDien from '../../components/program/BangGioDien'
import { gomTheoPhongTra } from '../../utils/bangGioDien'
import PhongTraTrenSan from '../../components/program/PhongTraTrenSan'
import LichTuanNay from '../../components/program/LichTuanNay'
import NhomGu from '../../components/program/NhomGu'
import DauMoc from '../../components/program/DauMoc'
import CuongVeCamKet from '../../components/program/CuongVeCamKet'
import { getShows, getFilterOptions } from '../../services/showServices'
import { formatMinPrice } from '../../utils/formatPrice'
import { ngayDayDu, thuVietHoa } from '../../utils/ngayVietNam'
import { timDemGanNhat, locDemNay } from '../../utils/lichDien'
import { useAuthStore } from '../../store/useAuthStore'

const SO_BUOI_TAI = 50

// Một dòng của /lounge-shows sang hình dạng các khối dùng — một chỗ duy nhất cho mọi lượt gọi.
const doiSangDong = (show) => ({
  id: show.id,
  title: show.name,
  thumbnail: show.coverImageUrl,
  start_date: show.scheduledStart,
  province: show.loungeCity,
  district: show.loungeDistrict,
  loungeName: show.loungeName,
  // Người hát theo OrderIndex (backend sắp sẵn) — đúng thứ tự lên sân khấu.
  performers: show.performerNames ?? [],
  genre: show.genres?.[0]?.name || 'Khác',
  genreId: show.genres?.[0]?.id || null,
  price: formatMinPrice(show),
  format: show.format,
  status: show.status,
})

const TieuDeKhoi = ({ id, children, phu }) => (
  <div className="flex flex-wrap items-end justify-between gap-3 border-b-2 border-ink pb-3 mb-7">
    <h2 id={id} className="text-4xl sm:text-5xl text-ink">{children}</h2>
    {phu}
  </div>
)

const HomePage = () => {
  const daDangNhap = Boolean(useAuthStore((s) => s.user))

  const [dangTai, setDangTai] = useState(true)
  const [loiTai, setLoiTai] = useState(false)
  const [lanTai, setLanTai] = useState(0)
  const [sapToi, setSapToi] = useState([])
  const [dangDien, setDangDien] = useState([])
  const [anhPhongTra, setAnhPhongTra] = useState({})
  const [gu, setGu] = useState({ moods: [], atmospheres: [] })
  // Khối "Tìm theo gu" mặc định THU GỌN (chủ dự án 02/10/2026): trang chủ ưu tiên lịch diễn và phòng trà; ai muốn
  // duyệt theo gu thì bấm mở. Cùng mẫu disclosure với NhomGu (button aria-expanded + aria-controls, chữ gạch chân
  // kèm dấu +/−, ghi SỐ lựa chọn đang ẩn để không bị tưởng là hết); khi thu gọn nội dung không dựng ra DOM.
  const [moGu, setMoGu] = useState(false)

  useEffect(() => {
    let huy = false
    const tai = async () => {
      setDangTai(true)
      setLoiTai(false)
      try {
        const [a, b] = await Promise.all([
          getShows({ page: 1, pageSize: SO_BUOI_TAI, sortBy: 'StartingSoon', includeSoldOut: true }),
          // Buổi đang diễn: danh sách công khai không lọc giờ, rồi giữ đúng status Ongoing.
          getShows({ page: 1, pageSize: SO_BUOI_TAI, sortBy: 'Newest', includeSoldOut: true }),
        ])
        if (huy) return
        setSapToi(a.success ? a.data.items.map(doiSangDong) : [])
        setDangDien(b.success ? b.data.items.filter((x) => x.status === 'Ongoing').map(doiSangDong) : [])
      } catch {
        if (!huy) setLoiTai(true)
      } finally {
        if (!huy) setDangTai(false)
      }
    }
    tai()
    return () => { huy = true }
  }, [lanTai])

  useEffect(() => {
    getFilterOptions()
      .then((res) => { if (res.success) setGu({ moods: res.data.moods || [], atmospheres: res.data.atmospheres || [] }) })
      .catch(() => {}) // khối "tìm theo gu" tự ẩn khi không có danh mục — không chặn trang
  }, [])

  // Ảnh không gian của phòng trà (DTO buổi diễn không có loungeId nên ghép theo TÊN; không khớp thì dùng ảnh bìa buổi diễn).
  const khiTaiPhongTra = useCallback((items) => {
    setAnhPhongTra(Object.fromEntries(items.filter((l) => l.primaryImageUrl).map((l) => [l.name, l.primaryImageUrl])))
  }, [])

  const buoiDemNay = useMemo(() => {
    const ids = new Set(dangDien.map((x) => x.id))
    return [...dangDien, ...locDemNay(sapToi).filter((x) => !ids.has(x.id))]
  }, [sapToi, dangDien])
  const dongBang = useMemo(() => gomTheoPhongTra(buoiDemNay, anhPhongTra), [buoiDemNay, anhPhongTra])
  const phongTraSangDen = useMemo(() => new Set(dongBang.map((d) => d.tenPhongTra)), [dongBang])
  const demGanNhat = useMemo(() => timDemGanNhat(sapToi), [sapToi])

  const homNay = dayjs()
  const dongPhu = dangTai
    ? 'Đang dò bảng giờ…'
    : dongBang.length > 0
      ? `${thuVietHoa(homNay)} ${ngayDayDu(homNay)}, ${dongBang.length} phòng trà sáng đèn`
      : `${thuVietHoa(homNay)} ${ngayDayDu(homNay)}, chưa phòng trà nào lên đèn`

  const dongNhac = useMemo(() => {
    const dem = new Map()
    sapToi.forEach((b) => { if (b.genreId) dem.set(b.genreId, { ten: b.genre, so: (dem.get(b.genreId)?.so || 0) + 1 }) })
    return [...dem.entries()].sort((a, b) => b[1].so - a[1].so)
  }, [sapToi])

  return (
    <div className="bg-stock text-ink">
      <div className="max-w-[1440px] mx-auto px-4 sm:px-8 pt-10 sm:pt-14 pb-20">
        {/* ĐÊM NAY — tiêu đề tờ chương trình + bảng giờ diễn chiếm trọn chiều ngang */}
        <section aria-labelledby="dem-nay">
          <div className="flex flex-wrap items-end justify-between gap-6 mb-8">
            <div>
              <h1 id="dem-nay" className="text-[clamp(3rem,8vw,6rem)] leading-[0.95] text-ink">Đêm nay ở Sài Gòn</h1>
              <p className="font-mono text-base sm:text-lg mt-3" aria-live="polite">{dongPhu}</p>
            </div>
            <Link to="/shows" className="inline-flex items-center gap-2 min-h-[44px] px-5 border-2 border-ink font-semibold hover:bg-ink hover:text-lamp transition-colors">
              <SlidersHorizontal size={16} aria-hidden="true" /> Tìm và lọc buổi diễn
            </Link>
          </div>

          <div className="relative">
            <BangGioDien
              dong={dongBang}
              dangTai={dangTai}
              loi={loiTai}
              onThuLai={() => setLanTai((n) => n + 1)}
              daDangNhap={daDangNhap}
              demGanNhat={demGanNhat}
            />
            {/* Dấu mộc đóng lấn mép trên-phải của bảng, nửa trên giấy vàng (hợp đồng hướng: "dấu mộc đè mép bảng").
                Đặt TRONG mép phải (right-6) chứ không lấn ra ngoài: bản -right-7 làm trang tràn ngang 6px ở 1440px.
                -top-7 để không chạm nút "Tìm và lọc" ngay phía trên. Đây là dấu mộc DUY NHẤT của khối — trong hộp đèn
                đã bỏ (đỏ mộc trên tím than ~2:1). Chỉ từ md: điện thoại hộp đèn in lời hứa giữ hộ bằng chữ. */}
            <DauMoc
              vongNgoai="MUSICLOUNGE · TIỀN VÉ GIỮ HỘ · "
              giua={'GIỮ HỘ\nTỚI KHI DIỄN'}
              size={104}
              xoay={-12}
              className="hidden md:block absolute -top-7 right-6 pointer-events-none"
            />
          </div>
        </section>

        <section aria-labelledby="phong-tra-tren-san" className="mt-24">
          <TieuDeKhoi id="phong-tra-tren-san" phu={<Link to="/lounges" className="font-semibold underline">Mọi phòng trà</Link>}>
            Phòng trà trên sàn
          </TieuDeKhoi>
          <PhongTraTrenSan daDangNhap={daDangNhap} phongTraSangDen={phongTraSangDen} onTai={khiTaiPhongTra} />
        </section>

        <section aria-labelledby="lich-tuan-td" id="lich-tuan" className="mt-24 scroll-mt-24">
          <TieuDeKhoi id="lich-tuan-td" phu={<Link to="/shows" className="font-semibold underline">Mọi buổi diễn</Link>}>
            Lịch diễn bảy ngày tới
          </TieuDeKhoi>
          <LichTuanNay buoiDien={sapToi} dangTai={dangTai} />
        </section>

        {(gu.moods.length > 0 || gu.atmospheres.length > 0 || dongNhac.length > 0) && (
          <section aria-labelledby="theo-gu" className="mt-24">
            <TieuDeKhoi
              id="theo-gu"
              phu={
                <button
                  type="button"
                  onClick={() => setMoGu((v) => !v)}
                  aria-expanded={moGu}
                  aria-controls="theo-gu-noi-dung"
                  className="inline-flex items-center gap-1.5 min-h-[44px] text-sm font-semibold text-ink underline underline-offset-4 decoration-2 hover:text-board"
                >
                  {moGu
                    ? <><Minus size={16} aria-hidden="true" /> Thu gọn</>
                    : <><Plus size={16} aria-hidden="true" /> Xem các gu ({dongNhac.length + gu.moods.length + gu.atmospheres.length} lựa chọn)</>}
                </button>
              }
            >
              Tìm theo gu
            </TieuDeKhoi>
            {moGu && (
              <div id="theo-gu-noi-dung" className="grid gap-8 md:grid-cols-3">
                {[
                  // Bộ lọc đi qua ĐỊA CHỈ theo ID (src/utils/boLocBuoiDien.js): bấm Quay lại, tải lại hay gửi đường dẫn đều giữ nguyên.
                  ['Dòng nhạc', dongNhac.map(([id, v]) => ({ key: id, ten: v.ten, so: v.so, to: `/shows?the=${id}` }))],
                  ['Tâm trạng', gu.moods.map((m) => ({ key: m.id, ten: m.name, to: `/shows?tam=${m.id}` }))],
                  ['Không gian', gu.atmospheres.map((a) => ({ key: a.id, ten: a.name, to: `/shows?kg=${a.id}` }))],
                ].filter(([, ds]) => ds.length > 0).map(([tieuDe, ds]) => (
                  // Mỗi nhóm tự thu gọn khi dài (NhomGu): chỉ hiện các mục đáng thấy nhất, "Xem thêm N" mở phần còn lại.
                  <NhomGu key={tieuDe} tieuDe={tieuDe} ds={ds} />
                ))}
              </div>
            )}
          </section>
        )}

        <section aria-labelledby="tien-di-dau" className="mt-24">
          <TieuDeKhoi id="tien-di-dau" phu={<Link to="/minh-bach" className="font-semibold underline">Trang minh bạch</Link>}>
            Tiền của bạn đi đâu
          </TieuDeKhoi>
          <CuongVeCamKet />
        </section>
      </div>
    </div>
  )
}

export default HomePage
