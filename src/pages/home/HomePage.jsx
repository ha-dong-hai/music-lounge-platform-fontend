// src/pages/home/HomePage.jsx
//
// TRANG CHỦ = MỘT TỜ CHƯƠNG TRÌNH, đọc từ trên xuống theo THỜI GIAN.
// Đặc tả: docs/design/DAC-TA-TRANG-CHU.md. Mọi quyết định dưới đây đều trỏ về một mục của nó.
//
// Nhịp trang: măng sét → đêm nay (theo giờ) → những đêm sắp tới (theo ngày) → khối biên tập →
// gợi ý cho người đã đăng nhập → mục lục duyệt theo không khí/dòng nhạc → cam kết → lối ra.
import { useState, useEffect, useMemo } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { ArrowRight } from 'lucide-react'
import EventCarousel from '../../components/home/ShowCarousel'
import SectionHeader from '../../components/home/SectionHeader'
import FilterModal from '../../components/home/FilterModal'
import MangSet from '../../components/home/MangSet'
import ChuongTrinhDemNay from '../../components/home/ChuongTrinhDemNay'
import NhungDemSapToi from '../../components/home/NhungDemSapToi'
import MoodExplorer from '../../components/home/MoodExplorer'
import EditorialSpotlight from '../../components/home/EditorialSpotlight'
import TrustStrip from '../../components/home/TrustStrip'
import Reveal from '../../components/shared/Reveal'
import SectionTitle from '../../components/shared/SectionTitle'
import { getShows, getRecommendedShows, getFilterOptions } from '../../services/showServices'
import { getLounges } from '../../services/loungeServices'
import { formatMinPrice } from '../../utils/formatPrice'
import { ngayGon, thuVietHoa } from '../../utils/ngayVietNam'
import { timDemGanNhat, locDemNay } from '../../utils/lichDien'
import dayjs from 'dayjs'
import { useAuthStore } from '../../store/useAuthStore'

// Số buổi diễn tải về cho cả trang. Với sortBy='StartingSoon' thì đây là "N buổi diễn gần nhất
// tính từ bây giờ", đủ phủ đêm nay cộng vài ngày tới.
const SO_BUOI_TAI = 50

const initialFilterState = {
  selectedProvince: null, selectedDistricts: [], selectedWards: [],
  selectedGenres: [], selectedSubGenres: [], selectedSpaces: [], selectedMoods: [],
  minPrice: '', maxPrice: '',
}

// Chuyển một dòng của /lounge-shows sang hình dạng mà các khối trên trang dùng.
// Tách ra hàm riêng vì hai lượt gọi (danh sách và gợi ý) phải ra CÙNG một hình dạng — trước đây hai
// chỗ chép tay giống nhau, nên thêm trường mới là phải nhớ sửa hai nơi.
const doiSangDong = (show) => ({
  id: show.id,
  title: show.name,
  thumbnail: show.coverImageUrl,
  start_date: show.scheduledStart,
  province: show.loungeCity,
  // Quận/huyện: ở TP.HCM thì "Quận 1" nói nhiều hơn "TP.HCM" — người ta quyết định đi hay không
  // dựa vào quãng đường, không dựa vào tên thành phố.
  district: show.loungeDistrict,
  loungeName: show.loungeName,
  // AI DIỄN. Backend trả sẵn (LoungeShowListItemDto.PerformerNames), sắp theo OrderIndex — tức
  // đúng thứ tự lên sân khấu. Trang chủ trước đây bỏ trường này đi không dùng.
  performers: show.performerNames ?? [],
  genre: show.genres?.[0]?.name || 'Khác',
  genreId: show.genres?.[0]?.id || null,
  // Show chưa có hạng vé nào thì minPrice/maxPrice là null — gọi thẳng .toLocaleString() trên null
  // sẽ làm vỡ cả khối, nên phải chặn trước khi format.
  price: formatMinPrice(show),
  format: show.format,
  isWishlisted: show.isWishlisted,
})

const HomePage = () => {
  const navigate = useNavigate()
  // §7 — TRẠNG THÁI NGƯỜI DÙNG. Trang chủ phải biết người đang mở nó là ai.
  // Mua vé bắt buộc đăng nhập (ràng buộc backend), nên lời mời "đặt vé" phải nói trước điều đó cho
  // khách chưa đăng nhập, thay vì để họ bấm rồi mới đâm vào bức tường. Xem DongBuoiDien.jsx.
  const daDangNhap = Boolean(useAuthStore((s) => s.user))

  const [isLoading, setIsLoading] = useState(true)
  // Lỗi của lượt tải danh sách buổi diễn. Tách riêng khỏi isLoading để khối chương trình
  // phân biệt được 'đang tải' với 'tải hỏng' — hai trạng thái phải nói hai câu khác nhau.
  const [loiTai, setLoiTai] = useState(false)
  // Tăng khoá này để chạy lại lượt tải khi người dùng bấm 'Thử lại'.
  const [reloadKey, setReloadKey] = useState(0)
  const [allEvents, setAllEvents] = useState([])
  const [recommendEvents, setRecommendEvents] = useState([])

  const [isFilterOpen, setIsFilterOpen] = useState(false)
  const [appliedFilters, setAppliedFilters] = useState(initialFilterState)
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')

  // Phòng trà có ảnh không gian thật, cho khối biên tập.
  const [spotlightLounge, setSpotlightLounge] = useState(null)
  useEffect(() => {
    getLounges({ pageSize: 10 })
      .then(res => { if (res.success) setSpotlightLounge((res.data.items || []).find(l => l.primaryImageUrl) || null) })
      .catch(err => console.error('Lỗi tải phòng trà cho khối biên tập:', err))
  }, [])

  // Danh mục tâm trạng/không gian thật — cùng nguồn dữ liệu FilterModal đang dùng, không gọi API
  // riêng nào mới ở backend.
  const [moods, setMoods] = useState([])
  const [atmospheres, setAtmospheres] = useState([])
  useEffect(() => {
    getFilterOptions()
      .then(res => { if (res.success) { setMoods(res.data.moods || []); setAtmospheres(res.data.atmospheres || []) } })
      .catch(err => console.error('Lỗi tải danh mục không khí:', err))
  }, [])

  // Gợi ý cá nhân hoá. KHÁC /trending (trending xếp theo độ hot chung, ai vào cũng thấy như nhau).
  // Chỉ gọi khi người dùng ĐÃ ĐĂNG NHẬP — xem chỗ hiển thị ở dưới để biết lý do.
  useEffect(() => {
    // Chỉ CHẶN lượt gọi, không xoá trạng thái ở đây: gọi setState thẳng trong thân effect làm
    // React render dây chuyền (react-hooks/set-state-in-effect). Đăng xuất thì dữ liệu gợi ý cũ
    // còn nằm trong state nhưng KHÔNG hiện, vì điều kiện hiển thị dưới kia đã có `daDangNhap`.
    if (!daDangNhap) return
    getRecommendedShows({ limit: 10 })
      .then(res => { if (res.success) setRecommendEvents(res.data.map(doiSangDong)) })
      .catch(err => console.error('Lỗi API Recommend:', err))
  }, [daDangNhap])

  // DANH SÁCH BUỔI DIỄN CHO CẢ TRANG.
  //
  // ĐÃ SỬA MỘT LỖI IM LẶNG: bản trước gọi sortBy='Newest'. Tra ở backend thì 'Newest' là
  // `OrderByDescending(s => s.Id)` (LoungeShowRepository.ApplySort) — tức sắp theo thứ tự ĐƯỢC TẠO,
  // không phải theo lịch diễn. Nên "50 buổi mới nhất" là 50 buổi được TẠO gần đây nhất, và một buổi
  // diễn TỐI NAY do phòng trà đăng từ tháng trước có thể không nằm trong đó. Khi ấy trang chủ bỏ sót
  // nó mà không có dấu hiệu gì: khối đêm nay vẫn hiện, vẫn đẹp, chỉ là thiếu.
  // 'StartingSoon' lọc `ScheduledStart > now` rồi sắp TĂNG DẦN theo giờ diễn — đúng thứ một tờ
  // chương trình cần, và đúng thứ tự trang đang trình bày.
  // ĐÁNH ĐỔI ĐÃ BIẾT: 'StartingSoon' loại luôn buổi đã bắt đầu, nên một đêm diễn khai mạc lúc 21:00
  // sẽ rời khỏi trang từ 21:01, dù khán giả đến muộn vẫn vào được. Đổi lại là danh sách đêm nay
  // KHÔNG BAO GIỜ THIẾU. Thà mất một dòng đã bắt đầu còn hơn im lặng giấu mất cả một đêm diễn.
  useEffect(() => {
    const taiDanhSach = async () => {
      setIsLoading(true)
      setLoiTai(false)
      try {
        const res = await getShows({ page: 1, pageSize: SO_BUOI_TAI, sortBy: 'StartingSoon', includeSoldOut: true })
        if (res.success) setAllEvents(res.data.items.map(doiSangDong))
      } catch (err) {
        console.error('Lỗi tải danh sách buổi diễn:', err)
        setLoiTai(true)
      }
      finally { setIsLoading(false) }
    }
    taiDanhSach()
  }, [reloadKey])

  // CHƯƠNG TRÌNH ĐÊM NAY = phần còn lại của NGÀY HÔM NAY.
  // Mốc dưới do backend lo sẵn ('StartingSoon' đã bỏ buổi đã bắt đầu), nên ở đây chỉ cắt mốc trên.
  const buoiDemNay = useMemo(() => locDemNay(allEvents), [allEvents])

  // ĐÊM DIỄN GẦN NHẤT SAU HÔM NAY.
  //
  // Đây là câu trả lời cho câu hỏi mà một người mở trang lúc đêm nay trống thật sự đang có: "vậy
  // hôm nào mới có?". Trước đây trang không trả lời — nó hiện một hộp lớn nói "chưa có buổi diễn
  // nào mở bán" rồi để người ta tự đi tìm.
  //
  // Không tốn thêm lượt gọi API nào: `allEvents` đã được backend sắp TĂNG DẦN theo giờ diễn
  // ('StartingSoon'), nên buổi đầu tiên sau nửa đêm hôm nay chính là đêm gần nhất. `.find` dừng
  // ngay ở phần tử đầu khớp.
  //
  // `soBuoi` đếm số buổi diễn TRONG CHÍNH đêm đó. Đây là con số DỒI DÀO (còn nhiều thứ để xem),
  // không phải con số khan hiếm — ranh giới này là luật §9 của đặc tả và có cổng máy canh.
  const demGanNhat = useMemo(() => timDemGanNhat(allEvents), [allEvents])

  // Con số cho măng sét. Đếm từ chính mảng trên nên không bao giờ lệch với thứ đang hiển thị —
  // đặc tả §1 cấm số liệu không truy được về dữ liệu thật.
  const demDemNay = useMemo(() => ({
    soBuoi: buoiDemNay.length,
    soPhongTra: new Set(buoiDemNay.map((ev) => ev.loungeName).filter(Boolean)).size,
  }), [buoiDemNay])

  // MỤC LỤC DÒNG NHẠC.
  // Đây là thứ CÒN LẠI của các băng chuyền "Thể loại X" cũ. Lý do hạ xuống thành một hàng chip:
  // trang đã đi suốt theo trục THỜI GIAN từ măng sét tới đây; chen mấy băng chuyền xếp theo THỂ LOẠI
  // vào giữa là đổi trục giữa chừng và quay lại đúng ngôn ngữ kho thẻ mà đặc tả §4 đã bác.
  // Con số bên cạnh đếm trong CHÍNH danh sách đã tải, và nhãn mục nói rõ như vậy — không trình bày
  // nó như tổng số buổi diễn của cả sàn (§1).
  const mucLucDongNhac = useMemo(() => {
    const nhom = {}
    allEvents.forEach((ev) => {
      if (!nhom[ev.genre]) nhom[ev.genre] = []
      nhom[ev.genre].push(ev)
    })
    return Object.keys(nhom)
      .sort((a, b) => nhom[b].length - nhom[a].length)
      .map((ten) => {
        const genreId = nhom[ten][0]?.genreId
        return {
          genreId: genreId ? String(genreId) : ten.toLowerCase(),
          genreName: ten,
          soBuoiDien: nhom[ten].length,
          slug: genreId ? `/shows/search?genreId=${genreId}` : `/shows/search?genre=${ten.toLowerCase()}`,
        }
      })
  }, [allEvents])

  const handleApplyFilters = (filters) => {
    setAppliedFilters(filters)
    setIsFilterOpen(false)
    navigate('/shows/search', { state: { appliedFilters: filters } })
  }

  const handleApplyDates = (start, end) => {
    if (start || end) navigate('/shows/search', { state: { startDate: start, endDate: end } })
  }

  // KHÔNG chặn cả trang bằng một màn skeleton riêng: măng sét, khối biên tập và dải cam kết không
  // phụ thuộc lượt tải đó. Mỗi khối tự lo trạng thái của mình (đặc tả §2).
  return (
    <div className="min-h-[60vh] bg-page text-ink">
      <div className="max-w-[1600px] mx-auto px-4 sm:px-6 pt-4 sm:pt-6">
        <SectionHeader
          onOpenFilter={() => setIsFilterOpen(true)}
          appliedFilters={appliedFilters}
          startDate={startDate} setStartDate={setStartDate}
          endDate={endDate} setEndDate={setEndDate}
          onApplyDates={handleApplyDates}
        />
      </div>

      <div className="max-w-[1600px] mx-auto px-4 sm:px-6 pb-10 sm:pb-16 space-y-8 sm:space-y-12 lg:space-y-16">
        {/* 1. MĂNG SÉT — ngày hôm nay và một câu nói đêm nay thành phố có gì. Con số lấy từ dữ
               liệu thật đã tải; không có dữ liệu thì câu đó tự rút gọn chứ không bịa số. */}
        <MangSet soBuoiDemNay={demDemNay.soBuoi} soPhongTra={demDemNay.soPhongTra} />

        {/* 2. ĐÊM NAY — khối trung tâm, mốc GIỜ chạy dọc bên trái như tờ lịch phát sóng. */}
        <section>
          <SectionTitle
            keDau={false}
            nhan="Chương trình đêm nay"
            tieuDe="Xếp theo giờ lên sân khấu"
            ghiChu="Giờ bên trái là khung giờ, giờ cạnh tên là giờ diễn"
          />
          <ChuongTrinhDemNay
            events={buoiDemNay}
            dangTai={isLoading}
            loi={loiTai}
            onThuLai={() => setReloadKey((k) => k + 1)}
            daDangNhap={daDangNhap}
            demGanNhat={demGanNhat}
            homNay={`${thuVietHoa(dayjs())} ${ngayGon(dayjs())}`}
          />
        </section>

        {/* 3. NHỮNG ĐÊM SẮP TỚI — cùng loại dòng, mốc đổi từ GIỜ sang NGÀY.
               Trả lời câu hỏi thật của người vừa đọc xong đêm nay: "đêm nay tôi bận thì hôm nào có
               gì?" — thay vì đổi sang trục dòng nhạc giữa chừng. */}
        <section id="dem-sap-toi" className="scroll-mt-24">
          <SectionTitle
            nhan="Những đêm sắp tới"
            tieuDe="Lịch diễn vài ngày tới"
            ghiChu="Mốc bên trái là ngày diễn"
          />
          <NhungDemSapToi events={allEvents} dangTai={isLoading} daDangNhap={daDangNhap} />
        </section>

        {/* 4. KHỐI BIÊN TẬP — nền espresso, điểm dừng mắt duy nhất giữa các khối nền sáng (§5). */}
        {spotlightLounge && (
          <Reveal>
            <EditorialSpotlight lounge={spotlightLounge} />
          </Reveal>
        )}

        {/* 5. GỢI Ý CÁ NHÂN — CHỈ cho người đã đăng nhập.
               Bản trước hiện mục "Dành riêng cho bạn" cho cả khách vãng lai. Với người chưa đăng
               nhập thì backend không có gì để cá nhân hoá, nên nội dung thực chất là thứ phổ biến
               chung — và cái nhãn "dành riêng cho bạn" lúc đó là một lời nói sai (§1: mọi chữ phải
               truy được về dữ liệu thật). Không đăng nhập thì mục này không tồn tại, thế là trung
               thực; chứ không phải đổi tên mục cho êm tai. */}
        {daDangNhap && recommendEvents.length > 0 && (
          <Reveal as="section">
            <EventCarousel title="Dành riêng cho bạn" events={recommendEvents} />
          </Reveal>
        )}

        {/* 6. MỤC LỤC DUYỆT — gộp không khí và dòng nhạc vào MỘT mục.
               Trước đây là hai mục rời nằm cách nhau, dù với người dùng cả hai đều trả lời đúng một
               câu: "tôi muốn tự tìm theo gu của mình". */}
        {(moods.length > 0 || atmospheres.length > 0 || mucLucDongNhac.length > 0) && (
          <Reveal as="section">
            <SectionTitle
              nhan="Tự tìm theo gu"
              tieuDe="Duyệt theo không khí hoặc dòng nhạc"
              ghiChu="Số bên cạnh đếm trong các đêm sắp tới"
            />
            {(moods.length > 0 || atmospheres.length > 0) && (
              <div className="mb-6">
                <p className="text-xs font-semibold uppercase tracking-[0.15em] text-ink-mute mb-3">Không khí</p>
                <MoodExplorer moods={moods} atmospheres={atmospheres} hienTieuDe={false} />
              </div>
            )}
            {mucLucDongNhac.length > 0 && (
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.15em] text-ink-mute mb-3">Dòng nhạc</p>
                <ul className="flex flex-wrap gap-2.5">
                  {mucLucDongNhac.map((muc) => (
                    <li key={muc.genreId}>
                      <Link
                        to={muc.slug}
                        className="inline-flex items-center gap-2 min-h-[44px] pl-4 pr-3.5 rounded-full border border-line bg-card text-sm font-medium text-ink-soft hover:border-brand hover:text-ink transition-colors"
                      >
                        {muc.genreName}
                        <span className="text-xs text-ink-mute tabular-nums">{muc.soBuoiDien}</span>
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </Reveal>
        )}

        {/* 7. CAM KẾT — ba câu sự thật, đặt sát chân trang vì người ta đọc cam kết lúc đang cân
               nhắc đặt vé, không phải lúc vừa vào trang. */}
        <Reveal>
          <TrustStrip />
        </Reveal>

        {/* 8. LỐI RA. */}
        <div className="flex justify-center pt-2">
          <Link to="/shows"
            className="inline-flex items-center gap-2 min-h-[44px] px-5 py-2.5 rounded-lg border border-brand/40 text-brand-text text-sm font-bold hover:bg-brand-hover/10 transition-colors">
            Xem tất cả buổi diễn <ArrowRight size={16} />
          </Link>
        </div>
      </div>

      <FilterModal isOpen={isFilterOpen} onClose={() => setIsFilterOpen(false)} initialFilters={appliedFilters} onApply={handleApplyFilters} />
    </div>
  )
}

export default HomePage
