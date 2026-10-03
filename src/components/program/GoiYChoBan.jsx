// src/components/program/GoiYChoBan.jsx
//
// CHƯƠNG TRÌNH IN RIÊNG CHO BẠN / NHỮNG ĐÊM NHIỀU NGƯỜI ĐANG GIỮ CHỖ (trang chủ, 03/10/2026).
// Chủ dự án: trang chủ phải có khối buổi diễn cá nhân hoá theo tài khoản; khách thì thấy buổi đang thịnh hành; khối phải nổi
// bật vì "nền tảng tôi nổi bật nhờ AI".
//
// BẢN 3 (cùng ngày) — bản 2 (nền sơn then + lưới thẻ poster + nhãn "✦ AI gợi ý") bị chê "quá xấu". Nghiên cứu:
// reports/Khối gợi ý AI - làm lại theo tờ chương trình.md (repo backend). Ba lỗi đã đo được:
//  - ngôi sao ✨ làm dấu AI: NN/g "sparkle ambiguity" — người xem không hiểu nó là AI; Kompozy: dấu nhận diện số một của
//    "thẩm mỹ AI" sáo mòn;
//  - nền tối + lưới poster: hợp đồng trang chủ TỪ CHỐI đúng kiểu này; khối mực tối dành riêng cho bảng giờ diễn đêm nay;
//  - thiếu chữ ký riêng của sản phẩm.
// Bản 3 ở TRONG thế giới "tờ chương trình ca nhạc": một tờ chương trình in trên giấy ngà, mỗi đêm là một TIẾT MỤC đánh số có
// dòng chấm dẫn giờ (ngữ pháp bảng giờ diễn); lý do gợi ý là GHI CHÚ BÊN LỀ viết tay (marginalia — lời bình viết lên lề
// bản in, gửi riêng một người đọc); nhãn AI bằng CHỮ ("AI chọn", SAP Fiori: gắn nhãn AI bằng chữ rõ nghĩa), không biểu
// tượng; lời in cuối tờ nói AI làm gì; lời mời bật AI là PHIẾU XÉ có đường đục lỗ (họa tiết cuống vé đã có).
//
// NGUỒN: GET /recommendations; mỗi buổi có `recommendationSource` (MLACP-565): "Ai" (ML.NET tính sẵn, lý do có thể do Gemini
// viết — chỉ người đã bật đồng ý AI) · "Taste" (khớp gu tính ngay) · "Trending" (vé bán + lượt lưu gần đây). Backend chưa có
// trường này thì suy thịnh hành từ câu lý do và coi như không có buổi AI.
//
// LUẬT (giữ từ bản 1–2):
//  - VỊ TRÍ: ngay sau "Sắp lên đèn"; MỖI BUỔI MỘT LẦN trên trang (`loaiTru`); còn 0 buổi → không in khối.
//  - NHÃN NÓI THẬT: "AI chọn" CHỈ trên tiết mục nguồn "Ai"; tiêu đề "Chương trình in riêng" chỉ khi có tiết mục xếp theo gu/AI.
//  - Lời mời AI theo người xem; mời chọn gu chỉ khi máy chủ không có gì cá nhân hoá (xét trước khi loại trùng).
//  - "Vì sao tôi thấy những đêm này?" + Chỉnh gu / Xoá lịch sử xem trên máy này.
import { useEffect, useId, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuthStore } from '../../store/useAuthStore'
import IconMoRong from '../shared/IconMoRong'
import CuongDatVe from './CuongDatVe'
import { getRecommendedShows } from '../../services/showServices'
import { getMyProfile } from '../../services/userServices'
import { docBuoiVuaXem, xoaBuoiVuaXem } from '../../utils/buoiVuaXem'
import { thuVietHoa, ngayGon, gioTrongNgay } from '../../utils/ngayVietNam'
import { formatMinPrice } from '../../utils/formatPrice'

const SO_HIEN = 4
const LY_DO_THINH_HANH = 'Đang thịnh hành'
// Đường đục lỗ ngang của phiếu xé — cùng họa tiết lỗ đục của cuống vé (CuongDatVe), mask là ngoại lệ chuyển sắc DESIGN.md cho phép.
const MASK_LO_NGANG = 'radial-gradient(circle 1.6px, #000 95%, #0000) 0 0/7px 4px repeat-x'
const DUONG_DUC_LO = { backgroundColor: 'currentColor', WebkitMask: MASK_LO_NGANG, mask: MASK_LO_NGANG }

const laTrending = (b) => (b.recommendationSource ? b.recommendationSource === 'Trending' : b.recommendationReason === LY_DO_THINH_HANH)
// Tên gọi tiếng Việt là TỪ CUỐI ("Hà Đông Hải" → "Hải").
const tenGoi = (ten) => String(ten ?? '').trim().split(/\s+/).pop() || ''

const TietMuc = ({ b, so }) => {
  const laAi = b.recommendationSource === 'Ai'
  const gia = formatMinPrice(b)
  return (
    <li className="group/dong relative grid gap-x-8 gap-y-3 py-6 border-t border-ink/25 first:border-t-0 lg:grid-cols-[minmax(0,1fr)_17rem]">
      <div className="grid grid-cols-[3.25rem_minmax(0,1fr)] sm:grid-cols-[4.5rem_minmax(0,1fr)] gap-x-4">
        <span aria-hidden="true" className="font-display text-4xl sm:text-5xl leading-none text-ink-mute">{String(so).padStart(2, '0')}</span>
        <div className="min-w-0">
          {/* Tên đêm — dòng chấm — ngày giờ: đúng ngữ pháp bảng giờ diễn của tờ chương trình. */}
          <div className="flex items-baseline gap-3">
            <h3 className="font-display font-normal text-2xl sm:text-3xl leading-tight min-w-0 break-words">
              <Link to={`/shows/${b.id}`} className="after:absolute after:inset-0 hover:underline decoration-2 underline-offset-4">{b.name}</Link>
            </h3>
            <span aria-hidden="true" className="hidden sm:block flex-1 min-w-[2rem] border-b-2 border-dotted border-ink/40 translate-y-[-0.35rem]" />
            <span className="hidden sm:block font-mono text-sm whitespace-nowrap">{thuVietHoa(b.scheduledStart)} {ngayGon(b.scheduledStart)} · {gioTrongNgay(b.scheduledStart)}</span>
          </div>
          <p className="sm:hidden font-mono text-sm mt-1">{thuVietHoa(b.scheduledStart)} {ngayGon(b.scheduledStart)} · {gioTrongNgay(b.scheduledStart)}</p>
          <p className="text-ink-soft mt-1">{[(b.performerNames ?? []).slice(0, 3).join(', '), b.loungeName].filter(Boolean).join(' · ')}</p>
          <div className="mt-4">
            <CuongDatVe gia={gia || null} />
          </div>
        </div>
      </div>
      {/* GHI CHÚ BÊN LỀ. Lời riêng (gu / AI) viết tay; thịnh hành không ai "ghi" nên in chữ máy chữ nhỏ. */}
      <div className="lg:border-l lg:border-ink/25 lg:pl-6 pl-[4.25rem] sm:pl-[5.5rem] lg:pt-1">
        {b.recommendationReason && !laTrending(b) ? (
          <>
            <p className="font-hand text-[1.35rem] leading-snug text-ink -rotate-1 origin-left">{b.recommendationReason}</p>
            <p className="font-mono text-xs text-ink-mute mt-2">{laAi ? '— AI MusicLounge ghi · AI chọn' : '— theo gu bạn đã chọn'}</p>
          </>
        ) : (
          <p className="font-mono text-xs text-ink-mute">nhiều người đang giữ chỗ</p>
        )}
      </div>
    </li>
  )
}

const GoiYChoBan = ({ daDangNhap = false, loaiTru = [], className = '', idTieuDe = 'goi-y-cho-ban' }) => {
  const id = useId()
  const tenNguoiDung = useAuthStore((s) => s.user?.name || s.user?.fullName || '')
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

  const coAi = hien.some((b) => b.recommendationSource === 'Ai')
  const caNhan = hien.some((b) => !laTrending(b))
  const ten = daDangNhap ? tenGoi(tenNguoiDung) : ''
  const tieuDe = caNhan ? `Chương trình in riêng cho ${ten || 'bạn'}` : 'Những đêm nhiều người đang giữ chỗ'
  // Mời chọn gu theo TOÀN BỘ kết quả máy chủ trả (trước khi loại trùng) — tài khoản có lịch sử quan tâm mà buổi hợp gu đã ở
  // "Sắp lên đèn" thì không được bảo họ "chưa chọn gu" (đo 03/10).
  const chuaCoGu = daDangNhap && ds.every(laTrending)
  const moiAi = coAi ? null
    : !daDangNhap ? { cau: 'Muốn một tờ chương trình in riêng theo gu của bạn?', phu: 'Đăng nhập — AI của MusicLounge sẽ chọn những đêm hợp gu và ghi lý do riêng cho bạn.', nut: 'Đăng nhập', den: '/login' }
      : dongYAi === false ? { cau: 'Bật gợi ý AI để nhận chương trình in riêng.', phu: 'Mô hình học máy học gu từ những đêm bạn đã chọn và từ những người cùng gu; AI ghi lý do riêng cho từng đêm.', nut: 'Bật gợi ý AI', den: '/account?tab=preferences' }
        : dongYAi === true ? { cau: 'AI đang học gu của bạn.', phu: 'Chương trình in riêng sẽ có ở lần ghé sau.', nut: null, den: null }
          : null

  return (
    <section aria-labelledby={idTieuDe} className={className}>
      {/* TỜ CHƯƠNG TRÌNH: giấy ngà, viền mực đôi ở đầu như bìa chương trình in. */}
      <div className="bg-card border-2 border-ink">
        <header className="px-5 pt-6 pb-5 sm:px-8 lg:px-10 border-b-4 border-double border-ink">
          <p className="font-mono text-xs text-ink-mute">
            {coAi ? 'MusicLounge · chương trình do AI chọn từ gu của bạn' : caNhan ? 'MusicLounge · chương trình xếp theo gu của bạn' : 'MusicLounge · chương trình theo lượt giữ chỗ gần đây'}
          </p>
          <div className="flex flex-wrap items-end justify-between gap-x-6 gap-y-2 mt-2">
            <h2 id={idTieuDe} className="text-[clamp(2.25rem,4.5vw,3.5rem)] leading-[1.02] text-ink">{tieuDe}</h2>
            <button type="button" onClick={() => setMoVis((v) => !v)} aria-expanded={moVis} aria-controls={`${id}-vi-sao`}
              className="inline-flex items-center gap-1.5 min-h-[44px] text-sm font-semibold text-ink hover:text-board">
              <IconMoRong mo={moVis} /> Vì sao tôi thấy những đêm này?
            </button>
          </div>
          {moVis && (
            <div id={`${id}-vi-sao`} className="mt-4 max-w-3xl text-ink-soft space-y-2">
              {daDangNhap ? (
                <p>Xếp theo <b className="text-ink">gu bạn đã chọn</b> và <b className="text-ink">phòng trà bạn theo dõi</b>. Nếu bạn bật gợi ý AI, mô hình học máy
                  (ML.NET) còn học từ <b className="text-ink">những người cùng gu</b> để chọn đêm, và AI (Gemini) ghi lý do riêng — những tiết mục đó ký “AI chọn”.</p>
              ) : (
                <p>Bạn chưa đăng nhập: xếp theo <b className="text-ink">những buổi bạn vừa xem trên máy này</b> (chỉ lưu trong trình duyệt của bạn, không lưu ở máy chủ); chưa xem gì thì theo lượt giữ chỗ gần đây. Gợi ý AI chỉ có khi bạn đăng nhập và bật nó.</p>
              )}
              <p><b className="text-ink">Nhiều người đang giữ chỗ</b> = nhiều vé bán và lượt lưu yêu thích gần đây. Không đêm nào được trả tiền để lên đây.</p>
              <div className="flex flex-wrap gap-x-5">
                {daDangNhap
                  ? <Link to="/account?tab=preferences" className="font-semibold text-ink underline underline-offset-4 min-h-[44px] inline-flex items-center">Chỉnh gu và gợi ý AI</Link>
                  : <Link to="/login" className="font-semibold text-ink underline underline-offset-4 min-h-[44px] inline-flex items-center">Đăng nhập để có chương trình theo gu</Link>}
                {coLichSu && (
                  <button type="button" onClick={() => { xoaBuoiVuaXem(); setLanTai((n) => n + 1) }} className="font-semibold text-ink underline underline-offset-4 min-h-[44px]">
                    Xoá lịch sử xem trên máy này
                  </button>
                )}
              </div>
            </div>
          )}
          {chuaCoGu && (
            <p className="text-ink-soft mt-3">
              Chưa có chương trình riêng vì bạn chưa chọn gu. <Link to="/account?tab=preferences" className="font-semibold text-ink underline underline-offset-4">Chọn gu</Link>
            </p>
          )}
        </header>

        <ol className="px-5 sm:px-8 lg:px-10">
          {hien.map((b, i) => <TietMuc key={b.id} b={b} so={i + 1} />)}
        </ol>

        {/* LỜI IN CUỐI TỜ — nói AI làm gì, bằng chữ (không biểu tượng). */}
        {coAi && (
          <p className="px-5 sm:px-8 lg:px-10 py-4 border-t border-ink/25 font-mono text-xs text-ink-mute">
            Những tiết mục ký “AI chọn” do mô hình học máy của MusicLounge chọn từ gu của bạn và của những người cùng gu; lời ghi bên lề do AI viết.
          </p>
        )}

        {/* PHIẾU XÉ — lời mời bật AI, tách khỏi tờ bằng đường đục lỗ như cuống vé. */}
        {moiAi && (
          <div className="relative border-t-0">
            <span aria-hidden="true" className="block h-1 mx-3 text-ink/50" style={DUONG_DUC_LO} />
            <div className="flex flex-wrap items-center justify-between gap-x-8 gap-y-4 px-5 py-6 sm:px-8 lg:px-10 bg-sunken">
              <div className="min-w-0 max-w-2xl">
                <p className="font-display text-2xl sm:text-3xl leading-tight">{moiAi.cau}</p>
                <p className="text-ink-soft mt-1.5">{moiAi.phu}</p>
              </div>
              {moiAi.nut && (
                <Link to={moiAi.den} className="inline-flex items-center min-h-[48px] px-6 bg-ink text-lamp font-semibold hover:bg-board transition-colors">
                  {moiAi.nut}
                </Link>
              )}
            </div>
          </div>
        )}
      </div>
    </section>
  )
}

export default GoiYChoBan
