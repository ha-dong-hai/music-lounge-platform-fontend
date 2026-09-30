// src/pages/lounge/LoungeListPage.jsx
//
// DANH SÁCH PHÒNG TRÀ TRÊN SÀN — làm lại 30/09/2026 trong thế giới "tờ chương trình".
//
// BẢN CŨ chỉ xin 50 phòng trà đầu rồi tìm kiếm TRONG 50 đó: phòng trà thứ 51 không bao giờ hiện và tìm cũng không
// ra. Lỗi tải thì hiện đúng khung "Hiện chưa có phòng trà nào" — nói sai sự thật. Thẻ là một kiểu khác với thẻ
// phòng trà ở trang chủ. Chưa đăng nhập mà bấm trái tim thì chỉ nhận một thông báo lỗi.
//
// QUYẾT ĐỊNH VÀ NGUỒN (reports/Trang phòng trà ảnh và lịch diễn.md ở repo backend, 30/09/2026):
//  - TẢI HẾT rồi tìm phía trình duyệt. API /lounges chỉ nhận city, page, pageSize (kẹp 50) — CHƯA có tham số tìm
//    theo tên, nên muốn tìm đúng thì phải có đủ danh sách. TRAN_TRANG = 10 trang (500 phòng trà) là trần: quá số đó
//    trang nói rõ là chưa hiện hết. Đường nâng cấp: thêm tham số `keyword` ở backend rồi tìm phía máy chủ.
//  - IN TỪNG ĐỢT + nút "Xem thêm", KHÔNG cuộn vô hạn, KHÔNG đánh số trang. NN/g: cuộn vô hạn làm mất chân trang,
//    mất vị trí khi bấm Quay lại, và khó dùng bằng bàn phím; GOV.UK: tránh cuộn vô hạn; Baymard (qua Smashing 2016,
//    đo trên thương mại điện tử): "tải thêm" sau mỗi 50–100 mục trên máy tính, 15–30 trên điện thoại. MOI_DOT = 24
//    nằm trong khoảng của điện thoại và chia hết cho lưới 2, 3, 4 cột. Danh sách ngắn hơn một đợt thì không có nút.
//    Vài chục phòng trà (tình trạng thật của sàn) thì in hết, không có điều khiển chia trang nào (GOV.UK: chỉ chia
//    trang khi nó cải thiện hiệu năng hoặc khả năng dùng).
//  - TRẠNG THÁI NẰM TRONG ĐỊA CHỈ (?q=…&theo-doi=1&hien=48): vào một phòng trà rồi bấm Quay lại thì từ khoá, bộ lọc
//    và số thẻ đã mở còn nguyên. Baymard: mất vị trí khi Quay lại là lỗi phổ biến nhất của danh sách "tải thêm" —
//    đây cũng là lý do báo cáo nghiêng về phân trang đánh số; giữ trạng thái trong địa chỉ xử lý đúng điểm đó mà
//    không phải chia trang một danh sách đã có sẵn trong trình duyệt.
//  - Tìm được khi gõ KHÔNG DẤU ("phu nhuan" ra "Phú Nhuận").
//  - KHÔNG lọc theo quận: cấp quận/huyện đã bỏ từ 01/07/2025, phòng trà mới không có quận. Tìm theo chữ vẫn khớp
//    quận cũ, phường, đường, thành phố nếu phòng trà có ghi.
//  - 0 kết quả: nói rõ không có gì khớp, kèm lối đi tiếp BẤM ĐƯỢC (NN/g, Baymard: lời khuyên suông không ai đọc).
//  - Lỗi tải là trạng thái riêng có nút thử lại.
// GIỮ NGUYÊN: theo dõi lạc quan có hoàn lại khi lỗi, chặn bấm đúp, lọc "Đang theo dõi".
import { useState, useEffect, useMemo } from 'react'
import { useLocation, useSearchParams } from 'react-router-dom'
import { Plus, Search, X } from 'lucide-react'
import toast from 'react-hot-toast'
import ThePhongTra from '../../components/program/ThePhongTra'
import { getLounges } from '../../services/loungeServices'
import { getFollowedLounges, toggleFollowLounge } from '../../services/interactionServices'
import { useAuthStore } from '../../store/useAuthStore'
import { boDau, NGUONG_KHONG_CAT } from '../../utils/nhomGu'

const CO_TRANG = 50   // backend kẹp pageSize ở 50
const TRAN_TRANG = 10 // tối đa 500 phòng trà — xem ghi chú đầu file
const MOI_DOT = 24
// Tới 8 phòng trà thì nhìn một lượt là thấy hết — ô tìm kiếm chỉ thêm việc. Cùng ngưỡng "đừng thu gọn thứ đã ngắn"
// của DESIGN.md (utils/nhomGu.js). Lựa chọn thiết kế, không có nguồn riêng cho ô tìm kiếm.
const NGUONG_CO_TIM = NGUONG_KHONG_CAT

const taiTatCa = async () => {
  const dau = await getLounges({ page: 1, pageSize: CO_TRANG })
  if (!dau?.success) throw new Error(dau?.message || 'lounges')
  let ds = dau.data?.items ?? []
  const tong = dau.data?.totalCount ?? ds.length
  const soTrang = Math.min(Math.ceil(tong / CO_TRANG), TRAN_TRANG)
  for (let trang = 2; trang <= soTrang; trang++) {
    const res = await getLounges({ page: trang, pageSize: CO_TRANG })
    if (!res?.success) throw new Error(res?.message || 'lounges')
    ds = ds.concat(res.data?.items ?? [])
  }
  return { ds, tong }
}

const LoungeListPage = () => {
  const { user } = useAuthStore()
  const location = useLocation()

  const [lounges, setLounges] = useState(null) // null = đang tải
  const [tong, setTong] = useState(0)
  const [loi, setLoi] = useState(false)
  const [lanTai, setLanTai] = useState(0)
  const [followedIds, setFollowedIds] = useState(new Set())
  const [updatingId, setUpdatingId] = useState(null)

  // Từ khoá, bộ lọc và số thẻ đã mở sống trong địa chỉ trang (replace: không nhồi lịch sử mỗi ký tự gõ).
  const [thamSo, setThamSo] = useSearchParams()
  const searchQuery = thamSo.get('q') ?? ''
  const onlyFollowed = thamSo.get('theo-doi') === '1'
  const soHien = Math.max(MOI_DOT, Number.parseInt(thamSo.get('hien') ?? '', 10) || MOI_DOT)
  const datThamSo = (doi) => setThamSo((cu) => {
    const moi = new URLSearchParams(cu)
    for (const [k, v] of Object.entries(doi)) (v ? moi.set(k, v) : moi.delete(k))
    return moi
  }, { replace: true })
  // Đổi từ khoá hay bộ lọc thì danh sách là danh sách KHÁC: số thẻ đã mở về lại một đợt.
  const setSearchQuery = (q) => datThamSo({ q, hien: null })
  const batTatTheoDoi = () => datThamSo({ 'theo-doi': onlyFollowed ? null : '1', hien: null })

  useEffect(() => {
    let huy = false
    taiTatCa()
      .then(({ ds, tong: t }) => { if (!huy) { setLounges(ds); setTong(t); setLoi(false) } })
      .catch(() => { if (!huy) { setLoi(true); setLounges([]) } })
    return () => { huy = true }
  }, [lanTai])

  useEffect(() => {
    if (!user) return
    let huy = false
    getFollowedLounges({ page: 1, pageSize: 100 })
      .then((res) => { if (!huy && res?.success) setFollowedIds(new Set((res.data?.items ?? []).map((x) => x.id))) })
      .catch(() => {}) // không đọc được thì nút hiện "Theo dõi" — máy chủ vẫn là nơi quyết định
    return () => { huy = true }
  }, [user])

  const handleToggleFollow = async (lounge) => {
    if (updatingId) return
    setUpdatingId(lounge.id)
    const dang = followedIds.has(lounge.id)
    const doi = (them) => setFollowedIds((prev) => { const next = new Set(prev); them ? next.add(lounge.id) : next.delete(lounge.id); return next })
    doi(!dang)
    try {
      await toggleFollowLounge(lounge.id, dang)
      toast.success(dang ? `Đã bỏ theo dõi ${lounge.name}.` : `Đã theo dõi ${lounge.name} — bạn sẽ được báo khi có đêm diễn mới.`)
    } catch (err) {
      doi(dang)
      toast.error(err.response?.data?.message || 'Không cập nhật được theo dõi.')
    } finally {
      setUpdatingId(null)
    }
  }

  const daLoc = useMemo(() => {
    const q = boDau(searchQuery)
    return (lounges ?? []).filter((l) => {
      if (onlyFollowed && !followedIds.has(l.id)) return false
      if (!q) return true
      return [l.name, l.street, l.ward, l.district, l.city].some((x) => boDau(x).includes(q))
    })
  }, [lounges, searchQuery, onlyFollowed, followedIds])

  const dangIn = daLoc.slice(0, soHien)
  const conLai = daLoc.length - dangIn.length
  const dangLoc = Boolean(searchQuery.trim()) || onlyFollowed
  const xoaLoc = () => datThamSo({ q: null, 'theo-doi': null, hien: null })

  return (
    <div className="min-h-[70vh] bg-stock text-ink pb-24">
      <div className="max-w-[1440px] mx-auto px-4 sm:px-8 pt-10">

        <h1 className="text-[clamp(2.75rem,6vw,5rem)] leading-[0.98]">Phòng trà trên sàn</h1>
        <p className="text-lg text-ink-soft mt-3 max-w-[60ch]">
          Mỗi phòng trà một không gian riêng. Xem ảnh, xem lịch diễn, rồi theo dõi nơi bạn thích để được báo khi có đêm diễn mới.
        </p>

        {/* TÌM + LỌC */}
        <div className="flex flex-wrap items-center gap-3 mt-8 pb-5 border-b-2 border-ink">
          {(lounges?.length ?? 0) > NGUONG_CO_TIM || searchQuery ? (
          <div className="relative flex-1 min-w-[16rem] max-w-xl">
            <Search size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-mute pointer-events-none" aria-hidden="true" />
            <input
              type="search"
              placeholder="Tên phòng trà, đường, phường, thành phố"
              aria-label="Tìm phòng trà"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full min-h-[48px] pl-11 pr-12 bg-card border-2 border-ink text-ink placeholder:text-ink-mute focus:outline-none focus:ring-2 focus:ring-ink focus:ring-offset-2 focus:ring-offset-stock [&::-webkit-search-cancel-button]:hidden"
            />
            {searchQuery && (
              <button type="button" onClick={() => setSearchQuery('')} aria-label="Xoá từ khoá"
                className="absolute right-0.5 top-1/2 -translate-y-1/2 w-11 h-11 inline-flex items-center justify-center text-ink hover:bg-ink hover:text-lamp transition-colors">
                <X size={18} aria-hidden="true" />
              </button>
            )}
          </div>
          ) : null}

          {user && (
            <button type="button" aria-pressed={onlyFollowed} onClick={batTatTheoDoi}
              className={`min-h-[48px] px-5 border-2 border-ink font-semibold transition-colors ${onlyFollowed ? 'bg-ink text-lamp' : 'bg-card text-ink hover:bg-ink hover:text-lamp'}`}>
              Đang theo dõi
            </button>
          )}

          {lounges !== null && !loi && (
            <p className="font-mono text-sm text-ink-mute ml-auto" role="status">
              {dangLoc ? `${daLoc.length} trên ${lounges.length} phòng trà` : `${lounges.length} phòng trà`}
            </p>
          )}
        </div>

        {/* DANH SÁCH */}
        <div className="mt-8">
          {lounges === null ? (
            <ul className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4" aria-busy="true" aria-label="Đang tải danh sách phòng trà">
              {[0, 1, 2, 3, 4, 5, 6, 7].map((i) => <li key={i} className="h-96 border-2 border-ink/20 bg-ink/5 animate-pulse" />)}
            </ul>
          ) : loi ? (
            <div role="alert" className="flex flex-wrap items-center gap-4 border-2 border-ink p-5">
              <p>Danh sách phòng trà chưa tải được.</p>
              <button type="button" onClick={() => { setLounges(null); setLanTai((n) => n + 1) }} className="min-h-[44px] px-5 bg-ink text-lamp font-semibold hover:bg-board transition-colors">Thử lại</button>
            </div>
          ) : daLoc.length === 0 ? (
            <div className="border-2 border-ink p-6 sm:p-8">
              <h2 className="text-3xl">
                {lounges.length === 0 ? 'Sàn chưa có phòng trà nào được duyệt.'
                  : searchQuery.trim() ? <>Không có phòng trà nào khớp “{searchQuery.trim()}”.</>
                    : 'Bạn chưa theo dõi phòng trà nào.'}
              </h2>
              {lounges.length > 0 && (
                <>
                  <p className="text-ink-soft mt-2">
                    {searchQuery.trim()
                      ? (onlyFollowed ? 'Bạn đang chỉ xem các phòng trà đã theo dõi.' : 'Thử tên ngắn hơn, hoặc tên đường, phường.')
                      : 'Bấm “Theo dõi” trên thẻ của phòng trà bạn thích.'}
                  </p>
                  <button type="button" onClick={xoaLoc} className="mt-5 min-h-[48px] px-6 bg-ink text-lamp font-semibold hover:bg-board transition-colors">
                    Xem tất cả {lounges.length} phòng trà
                  </button>
                </>
              )}
            </div>
          ) : (
            <>
              <ul id="ds-phong-tra" className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {dangIn.map((l) => (
                  <ThePhongTra key={l.id} l={l} daDangNhap={Boolean(user)} dangTheoDoi={followedIds.has(l.id)}
                    dangBam={updatingId === l.id} onTheoDoi={handleToggleFollow} tuTrang={location} />
                ))}
              </ul>
              {conLai > 0 && (
                <div className="mt-8 flex flex-wrap items-center gap-x-6 gap-y-2">
                  <button type="button" onClick={() => datThamSo({ hien: String(soHien + MOI_DOT) })} aria-controls="ds-phong-tra"
                    className="inline-flex items-center gap-2 min-h-[52px] px-7 border-2 border-ink font-semibold hover:bg-ink hover:text-lamp transition-colors">
                    <Plus size={18} aria-hidden="true" /> Xem thêm {Math.min(conLai, MOI_DOT)} phòng trà
                  </button>
                  <p className="font-mono text-sm text-ink-mute">Đang hiện {dangIn.length} trên {daLoc.length}</p>
                </div>
              )}
              {tong > lounges.length && conLai === 0 && !dangLoc && (
                <p className="text-sm text-ink-mute mt-6">Đang hiện {lounges.length} trên tổng {tong} phòng trà của sàn.</p>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  )
}

export default LoungeListPage
