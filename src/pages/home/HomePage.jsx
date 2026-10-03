// src/pages/home/HomePage.jsx
//
// TRANG CHỦ — "Đêm nay ở Sài Gòn", thế giới TỜ CHƯƠNG TRÌNH CA NHẠC (chủ dự án chốt 30/09; hợp đồng hướng thiết kế ở
// .impeccable/surfaces/src-pages-home-homepage-jsx.md; ảnh mẫu Stitch ở .impeccable/mocks/stitch/).
// Thứ tự (chủ dự án chốt 03/10/2026, phương án A): đêm nay (BẢNG GIỜ DIỄN) → sắp lên đèn (buổi gần nhất + tiếp theo) →
// tìm theo gu → phòng trà trên sàn → đêm đã qua → tiền của bạn đi đâu. "Khi nào đi" đứng liền nhau ở trên; khối "Lịch diễn
// bảy ngày tới" BỎ khỏi trang chủ: trùng "Tiếp theo" của Sắp lên đèn, và tuần trống thì chỉ còn một hộp trống (đo 03/10).
// Bảng đầy đủ vẫn ở /shows. (Bản 23/09 venue-first: đêm nay → phòng trà → lịch tuần → gu → tiền.)
// Khối "gợi ý cá nhân" và "khối biên tập" của bản cũ bị bỏ khỏi trang chủ theo §7.1 (đa số lượt vào không thấy gì).
//
// Tầng DỮ LIỆU giữ nguyên từ bản cũ (đã kiểm): sortBy='StartingSoon' — KHÔNG dùng 'Newest' vì ở backend đó là
// OrderByDescending(Id), tức thứ tự ĐƯỢC TẠO, sẽ im lặng bỏ sót buổi diễn tối nay.
// THÊM một lượt gọi cho buổi ĐANG DIỄN: 'StartingSoon' lọc ScheduledStart > now nên buổi đã lên sân khấu biến khỏi
// danh sách — mà "đang diễn" là trạng thái bảng giờ diễn phải in (màu than hồng dành riêng cho nó).
import { useState, useEffect, useMemo, useCallback } from 'react'
import { Link } from 'react-router-dom'
import dayjs from 'dayjs'
import { SlidersHorizontal } from 'lucide-react'
import BangGioDien from '../../components/program/BangGioDien'
import { gomTheoPhongTra } from '../../utils/bangGioDien'
import PhongTraTrenSan from '../../components/program/PhongTraTrenSan'
import NhomGu from '../../components/program/NhomGu'
import DauMoc from '../../components/program/DauMoc'
import CuongVeCamKet from '../../components/program/CuongVeCamKet'
import LienKetMuiTen from '../../components/shared/LienKetMuiTen'
import { getShows, getFilterOptions } from '../../services/showServices'
import { formatMinPrice } from '../../utils/formatPrice'
import { ngayDayDu, thuVietHoa } from '../../utils/ngayVietNam'
import { timDemGanNhat, locDemNay } from '../../utils/lichDien'
import { useAuthStore } from '../../store/useAuthStore'
import IconMoRong from '../../components/shared/IconMoRong'
import SapLenDen from '../../components/program/SapLenDen'
import TheGu from '../../components/program/TheGu'
import DemDaQua from '../../components/program/DemDaQua'

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
  genres: show.genres ?? [], // TheGu đếm theo MỌI dòng nhạc của buổi, không chỉ dòng đầu
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
  const [dsPhongTra, setDsPhongTra] = useState([])
  // Danh sách phòng trà (từ PhongTraTrenSan) — Đêm đã qua (DemDaQua) dùng để tìm các đêm đã diễn.
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
    setDsPhongTra(items)
  }, [])

  const buoiDemNay = useMemo(() => {
    const ids = new Set(dangDien.map((x) => x.id))
    return [...dangDien, ...locDemNay(sapToi).filter((x) => !ids.has(x.id))]
  }, [sapToi, dangDien])
  const dongBang = useMemo(() => gomTheoPhongTra(buoiDemNay, anhPhongTra), [buoiDemNay, anhPhongTra])
  const phongTraSangDen = useMemo(() => new Set(dongBang.map((d) => d.tenPhongTra)), [dongBang])
  const demGanNhat = useMemo(() => timDemGanNhat(sapToi), [sapToi])
  // Sắp lên đèn: buổi đã mở bán, KHÔNG phải tối nay (khối Đêm nay đã in) — gần nhất trước (sapToi đã sắp StartingSoon).
  const sapLenDen = useMemo(() => {
    const demNay = new Set(buoiDemNay.map((x) => x.id))
    return sapToi.filter((x) => !demNay.has(x.id))
  }, [sapToi, buoiDemNay])

  const homNay = dayjs()
  const dongPhu = dangTai
    ? 'Đang dò bảng giờ…'
    : dongBang.length > 0
      ? `${thuVietHoa(homNay)} ${ngayDayDu(homNay)}, ${dongBang.length} phòng trà sáng đèn`
      : `${thuVietHoa(homNay)} ${ngayDayDu(homNay)}, chưa phòng trà nào lên đèn`

  // Dòng nhạc chỉ còn MỘT chỗ là thẻ ảnh (TheGu). Bản 03/10 in hai lần — thẻ đếm mọi thể loại (Bolero 2), nhóm chữ
  // "Dòng nhạc" bên dưới chỉ đếm thể loại ĐẦU của mỗi buổi (Bolero 1, thiếu luôn Acoustic) — chủ dự án: "đang hơi bị loạn".
  const coDongNhac = sapToi.some((b) => (b.genres ?? []).length > 0)
  const soLocThem = gu.moods.length + gu.atmospheres.length

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

        {sapLenDen.length > 0 && (
          <section aria-labelledby="sap-len-den" id="sap-len-den-khoi" className="mt-24 scroll-mt-24">
            <TieuDeKhoi id="sap-len-den" phu={<LienKetMuiTen to="/shows">Mọi buổi diễn</LienKetMuiTen>}>
              Sắp lên đèn
            </TieuDeKhoi>
            <SapLenDen buoi={sapLenDen} anhPhongTra={anhPhongTra} />
          </section>
        )}

        {(soLocThem > 0 || coDongNhac) && (
          <section aria-labelledby="theo-gu" className="mt-24">
            <TieuDeKhoi
              id="theo-gu"
              phu={soLocThem > 0 && (
                <button
                  type="button"
                  onClick={() => setMoGu((v) => !v)}
                  aria-expanded={moGu}
                  aria-controls="theo-gu-noi-dung"
                  className="inline-flex items-center gap-1.5 min-h-[44px] text-sm font-semibold text-ink hover:text-board"
                >
                  {moGu
                    ? <><IconMoRong mo /> Thu gọn</>
                    : <><IconMoRong /> Lọc thêm theo tâm trạng, không gian ({soLocThem})</>}
                </button>
              )}
            >
              Tìm theo gu
            </TieuDeKhoi>
            {/* Dòng nhạc = thẻ ảnh, luôn hiện (TheGu). Tâm trạng + không gian là lọc phụ, gập bên dưới. */}
            <TheGu buoi={sapToi} anhPhongTra={anhPhongTra} />
            {moGu && (
              <div id="theo-gu-noi-dung" className="grid gap-8 md:grid-cols-2">
                {[
                  // Bộ lọc đi qua ĐỊA CHỈ theo ID (src/utils/boLocBuoiDien.js): bấm Quay lại, tải lại hay gửi đường dẫn đều giữ nguyên.
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

        <section aria-labelledby="phong-tra-tren-san" className="mt-24">
          <TieuDeKhoi id="phong-tra-tren-san" phu={<LienKetMuiTen to="/lounges">Mọi phòng trà</LienKetMuiTen>}>
            Phòng trà trên sàn
          </TieuDeKhoi>
          <PhongTraTrenSan daDangNhap={daDangNhap} phongTraSangDen={phongTraSangDen} onTai={khiTaiPhongTra} />
        </section>

        <DemDaQua phongTra={dsPhongTra} className="mt-24"
          dau={<TieuDeKhoi id="dem-da-qua" phu={<LienKetMuiTen to="/shows">Mọi buổi diễn</LienKetMuiTen>}>Đêm đã qua</TieuDeKhoi>} />

        <section aria-labelledby="tien-di-dau" className="mt-24">
          <TieuDeKhoi id="tien-di-dau" phu={<LienKetMuiTen to="/minh-bach">Trang minh bạch</LienKetMuiTen>}>
            Tiền của bạn đi đâu
          </TieuDeKhoi>
          <CuongVeCamKet />
        </section>
      </div>
    </div>
  )
}

export default HomePage
