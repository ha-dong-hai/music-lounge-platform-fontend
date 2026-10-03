// src/components/program/GoiYChoBan.jsx
//
// DÀNH CHO BẠN / ĐANG ĐƯỢC QUAN TÂM (trang chủ, 03/10/2026) — chủ dự án: "phải có thành phần hiển thị các buổi biểu diễn được
// cá nhân hoá theo dữ liệu người dùng khi đăng nhập; còn guest thì hiển thị các buổi đang thịnh hành".
// Nghiên cứu + luật: reports/Trang chủ - gợi ý cá nhân và thịnh hành.md (repo backend).
//
// BẢN 2 (cùng ngày) — chủ dự án: "phải được quan tâm chứ sao lại thiết kế mờ nhạt vậy, nền tảng tôi nổi bật vì có các yếu
// tố kết nối sử dụng AI" → khối NỔI BẬT: nền sơn then trải ngang như bảng giờ diễn, thẻ ảnh lớn, lý do in chữ viết tay như
// một lời nhắn riêng; nhãn "✦ AI gợi ý" + ô mời "Bật gợi ý AI" giới thiệu AI làm gì.
//
// NGUỒN: GET /recommendations (máy chủ tự chọn mức theo người hỏi). Mỗi buổi có `recommendationSource` (MLACP-565):
//  "Ai" (ML.NET tính sẵn — chỉ người đã bật đồng ý AI; lý do có thể do Gemini viết) · "Taste" (khớp gu tính ngay) ·
//  "Trending" (vé bán + lượt lưu gần đây). Backend chưa có trường này (chưa deploy MLACP-565) → coi như không có thẻ AI.
//
// LUẬT:
//  - VỊ TRÍ: ngay sau "Sắp lên đèn"; MỖI BUỔI MỘT LẦN trên trang (`loaiTru`); còn 0 buổi → không in khối.
//  - NHÃN NÓI THẬT: "✦ AI gợi ý" CHỈ trên thẻ nguồn "Ai" — gắn nhãn AI cho bảng thịnh hành là nói sai với người dùng. Tiêu
//    đề "Dành cho bạn" chỉ khi có thẻ xếp theo gu/AI; toàn thịnh hành thì "Đang được quan tâm".
//  - Ô MỜI AI đổi theo người xem: khách → đăng nhập; đã đăng nhập chưa bật đồng ý → bật ở Sở thích gợi ý; đã bật mà
//    chưa có thẻ AI (job nền đang tính) → "AI đang học gu của bạn". Có thẻ AI rồi thì không mời nữa.
//  - "Vì sao tôi thấy những buổi này?": tiêu chí (tinh thần DSA Điều 27) + Chỉnh gu / Xoá lịch sử xem trên máy này.
import { useEffect, useId, useState } from 'react'
import { Link } from 'react-router-dom'
import { Sparkles } from 'lucide-react'
import IconMoRong from '../shared/IconMoRong'
import CoverFallback from '../shared/CoverFallback'
import CuongDatVe from './CuongDatVe'
import { getRecommendedShows } from '../../services/showServices'
import { getMyProfile } from '../../services/userServices'
import { docBuoiVuaXem, xoaBuoiVuaXem } from '../../utils/buoiVuaXem'
import { thuVietHoa, ngayGon, gioTrongNgay } from '../../utils/ngayVietNam'
import { formatMinPrice } from '../../utils/formatPrice'

const SO_HIEN = 4

const NhanAi = ({ className = '' }) => (
  <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 bg-lamp text-board text-xs font-bold tracking-wide ${className}`}>
    <Sparkles size={13} strokeWidth={2} aria-hidden="true" /> AI gợi ý
  </span>
)

// `ngang`: 1–2 buổi thì thẻ nằm ngang (ảnh trái, chữ phải) cho đầy cột — bản lưới dọc để trống nửa phải khối (đo 03/10).
const TheGoiY = ({ b, anhDuPhong, ngang = false }) => {
  const anh = b.coverImageUrl || anhDuPhong
  const laAi = b.recommendationSource === 'Ai'
  return (
    <li className={`group/dong relative flex bg-board-soft border border-lamp/15 ${ngang ? 'flex-col sm:flex-row' : 'flex-col'}`}>
      <div className={`relative overflow-hidden ${ngang ? 'aspect-[4/3] sm:aspect-auto sm:w-[45%] sm:min-h-[16rem] flex-shrink-0' : 'aspect-[4/3]'}`}>
        {anh ? <img src={anh} alt="" loading="lazy" width="640" height="480" className="w-full h-full object-cover transition-transform duration-500 motion-safe:group-hover/dong:scale-[1.03]" /> : <CoverFallback />}
        {laAi && <NhanAi className="absolute left-3 top-3" />}
      </div>
      <div className={`flex flex-col flex-1 ${ngang ? 'p-5 sm:p-7' : 'p-4 sm:p-5'}`}>
        <p className="font-mono text-xs text-lamp-mute">{thuVietHoa(b.scheduledStart)} {ngayGon(b.scheduledStart)} · {gioTrongNgay(b.scheduledStart)}</p>
        <h3 className={`font-display font-normal leading-tight mt-1.5 break-words ${ngang ? 'text-3xl' : 'text-2xl'}`}>
          <Link to={`/shows/${b.id}`} className="after:absolute after:inset-0 hover:text-stock">{b.name}</Link>
        </h3>
        <p className="text-sm text-lamp-mute mt-1">{[...(b.performerNames ?? []).slice(0, 2), b.loungeName].filter(Boolean).join(' · ')}</p>
        {b.recommendationReason && (b.recommendationSource === 'Trending' || b.recommendationReason === 'Đang thịnh hành'
          // Thịnh hành là nhãn chung, không phải lời nhắn — in nhỏ như một nhãn (bản đầu in chữ viết tay trong ngoặc kép,
          // trông như ai đó nhắn riêng, đo 03/10).
          ? <p className="mt-3"><span className="inline-block px-2 py-0.5 border border-lamp/40 font-mono text-xs text-lamp-mute">Đang thịnh hành</span></p>
          // Lý do riêng như một lời nhắn viết tay — với thẻ AI đây thường là câu Gemini viết riêng cho người xem.
          : <p className="font-hand text-xl leading-snug text-lamp mt-3">“{b.recommendationReason}”</p>
        )}
        <div className="mt-auto pt-4">
          <CuongDatVe nen="muc" gia={formatMinPrice(b) || null} />
        </div>
      </div>
    </li>
  )
}

const GoiYChoBan = ({ daDangNhap = false, loaiTru = [], anhPhongTra = {}, className = '', idTieuDe = 'goi-y-cho-ban' }) => {
  const id = useId()
  const [ds, setDs] = useState(null) // null = đang tải
  const [dongYAi, setDongYAi] = useState(null) // null = chưa biết / khách
  const [lanTai, setLanTai] = useState(0)
  const [moVis, setMoVis] = useState(false)
  const coLichSu = !daDangNhap && docBuoiVuaXem().length > 0

  useEffect(() => {
    let huy = false
    const vuaXem = daDangNhap ? [] : docBuoiVuaXem()
    getRecommendedShows({ limit: SO_HIEN + 6, ...(vuaXem.length ? { recentShowIds: vuaXem } : {}) })
      .then((res) => { if (!huy) setDs(res?.success ? res.data ?? [] : []) })
      .catch(() => { if (!huy) setDs([]) }) // khối phụ: lỗi thì ẩn, không chặn trang chủ
    if (daDangNhap) getMyProfile().then((r) => { if (!huy && r?.success) setDongYAi(Boolean(r.data?.aiConsent)) }).catch(() => {})
    return () => { huy = true }
  }, [daDangNhap, lanTai])

  if (!ds) return null
  const boQua = new Set(loaiTru)
  const hien = ds.filter((b) => !boQua.has(b.id)).slice(0, SO_HIEN)
  if (hien.length === 0) return null

  const laTrending = (b) => (b.recommendationSource ? b.recommendationSource === 'Trending' : b.recommendationReason === 'Đang thịnh hành')
  const coAi = hien.some((b) => b.recommendationSource === 'Ai')
  const tieuDe = hien.some((b) => !laTrending(b)) ? 'Dành cho bạn' : 'Đang được quan tâm'
  // Lời mời chọn gu theo TOÀN BỘ kết quả máy chủ trả (trước khi loại trùng) — tài khoản có lịch sử quan tâm mà buổi hợp gu
  // đã ở "Sắp lên đèn" thì không được bảo họ "chưa chọn gu" (đo 03/10).
  const chuaCoGu = daDangNhap && ds.every(laTrending)

  // Ô mời AI: mỗi người xem một lời, không mời khi đã có thẻ AI.
  const moiAi = coAi ? null
    : !daDangNhap ? { cau: 'Đăng nhập để AI chọn những đêm hợp gu bạn.', nut: 'Đăng nhập', den: '/login' }
      : dongYAi === false ? { cau: 'Bật gợi ý AI để có những đêm được chọn riêng cho bạn.', nut: 'Bật gợi ý AI', den: '/account?tab=preferences' }
        : dongYAi === true ? { cau: 'AI đang học gu của bạn — gợi ý riêng sẽ có ở lần ghé sau.', nut: null, den: null }
          : null

  const gioiThieu = coAi
    ? 'Mô hình học máy chọn từ gu của bạn và từ những người cùng gu; AI viết lý do riêng cho từng đêm.'
    : tieuDe === 'Dành cho bạn'
      ? 'Xếp theo những gì bạn đã cho MusicLounge biết về gu của mình.'
      : 'Những đêm nhiều người đang mua vé và lưu lại.'

  const oMoiAi = moiAi && (
    <div className="border-2 border-dashed border-lamp/40 p-5">
      <NhanAi />
      <p className="font-display text-2xl leading-tight mt-3">{moiAi.cau}</p>
      <p className="text-sm text-lamp-mute mt-2">Mô hình học máy học gu từ những đêm bạn đã chọn và từ những người cùng gu; AI viết lý do riêng cho từng đêm.</p>
      {moiAi.nut && (
        <Link to={moiAi.den} className="mt-4 inline-flex items-center gap-2 min-h-[48px] px-5 bg-lamp text-board font-semibold hover:bg-stock transition-colors">
          <Sparkles size={16} aria-hidden="true" /> {moiAi.nut}
        </Link>
      )}
    </div>
  )

  return (
    // NỔI BẬT (bản 2): khối sơn then trải ngang; màn lớn chia 2 cột — trái giới thiệu + lời mời AI, phải là thẻ. Ít buổi
    // thì thẻ nằm ngang cho đầy cột, nhiều buổi thì lưới.
    <section aria-labelledby={idTieuDe} className={`bg-board text-lamp px-5 py-8 sm:px-8 sm:py-10 lg:px-10 lg:py-12 ${className}`}>
      <div className="grid gap-8 lg:gap-12 lg:grid-cols-[minmax(0,21rem)_minmax(0,1fr)] items-start">
        <div className="lg:sticky lg:top-24">
          <p className="inline-flex items-center gap-2 font-mono text-xs tracking-[0.2em] text-lamp-mute">
            <Sparkles size={14} strokeWidth={1.75} aria-hidden="true" />{coAi ? 'AI CỦA MUSICLOUNGE CHỌN RIÊNG CHO BẠN' : tieuDe === 'Dành cho bạn' ? 'XẾP THEO GU CỦA BẠN' : 'NHIỀU NGƯỜI ĐANG CHỌN'}
          </p>
          <h2 id={idTieuDe} className="text-[clamp(2.5rem,5vw,4rem)] leading-none mt-3">{tieuDe}</h2>
          <p className="text-lamp-mute mt-4">{gioiThieu}</p>

          {chuaCoGu && (
            <p className="text-lamp-mute mt-4">
              Chưa có gợi ý riêng vì bạn chưa chọn gu. <Link to="/account?tab=preferences" className="font-semibold text-lamp underline underline-offset-4">Chọn gu để có gợi ý riêng</Link>
            </p>
          )}

          {moiAi && (
            // Màn lớn: ở cột trái. Điện thoại: bản ở cột trái ẩn, in lại SAU các thẻ (bản đầu đẩy buổi diễn xuống tận dưới).
            <div className="hidden lg:block mt-6">{oMoiAi}</div>
          )}

          <button type="button" onClick={() => setMoVis((v) => !v)} aria-expanded={moVis} aria-controls={`${id}-vi-sao`}
            className="mt-5 inline-flex items-center gap-1.5 min-h-[44px] text-sm font-semibold text-lamp hover:text-stock">
            <IconMoRong mo={moVis} /> Vì sao tôi thấy những buổi này?
          </button>
          {moVis && (
            <div id={`${id}-vi-sao`} className="border border-lamp/30 p-4 mt-2 text-sm text-lamp-mute space-y-2">
              {daDangNhap ? (
                <p>Xếp theo <b className="text-lamp">gu bạn đã chọn</b> và <b className="text-lamp">phòng trà bạn theo dõi</b>. Nếu bạn bật gợi ý AI, mô hình học máy
                  (ML.NET) còn học từ <b className="text-lamp">những người cùng gu</b> để chọn đêm, và AI (Gemini) viết lý do riêng cho bạn — những thẻ đó có nhãn <span className="whitespace-nowrap">“✦ AI gợi ý”</span>.</p>
              ) : (
                <p>Bạn chưa đăng nhập: xếp theo <b className="text-lamp">những buổi bạn vừa xem trên máy này</b> (chỉ lưu trong trình duyệt của bạn, không lưu ở máy chủ); chưa xem gì thì xếp theo độ quan tâm chung. Gợi ý AI chỉ có khi bạn đăng nhập và bật nó.</p>
              )}
              <p><b className="text-lamp">Đang thịnh hành</b> = nhiều vé bán và lượt lưu yêu thích gần đây. Không có buổi nào được trả tiền để lên đây.</p>
              <div className="flex flex-wrap gap-x-5 gap-y-1">
                {daDangNhap
                  ? <Link to="/account?tab=preferences" className="font-semibold text-lamp underline underline-offset-4 min-h-[44px] inline-flex items-center">Chỉnh gu và gợi ý AI</Link>
                  : <Link to="/login" className="font-semibold text-lamp underline underline-offset-4 min-h-[44px] inline-flex items-center">Đăng nhập để có gợi ý theo gu</Link>}
                {coLichSu && (
                  <button type="button" onClick={() => { xoaBuoiVuaXem(); setLanTai((n) => n + 1) }} className="font-semibold text-lamp underline underline-offset-4 min-h-[44px]">
                    Xoá lịch sử xem trên máy này
                  </button>
                )}
              </div>
            </div>
          )}
        </div>

        <div>
          <ol className={hien.length <= 2 ? 'grid gap-5' : 'grid gap-5 grid-cols-[repeat(auto-fill,minmax(min(100%,15rem),1fr))]'}>
            {hien.map((b) => <TheGoiY key={b.id} b={b} ngang={hien.length <= 2} anhDuPhong={anhPhongTra[b.loungeName] ?? null} />)}
          </ol>
          {moiAi && <div className="lg:hidden mt-6">{oMoiAi}</div>}
        </div>
      </div>
    </section>
  )
}

export default GoiYChoBan
