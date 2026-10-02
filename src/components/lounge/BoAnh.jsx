// src/components/lounge/BoAnh.jsx
//
// BỘ ẢNH KHÔNG GIAN CỦA PHÒNG TRÀ — nằm trên khối sơn then ở đầu trang phòng trà.
//
// BẢN CŨ (LoungeHero) tự chuyển ảnh mỗi 8 giây không có nút dừng, phủ lớp chuyển sắc lên ảnh, mũi tên chỉ hiện khi rê
// chuột (điện thoại không bao giờ thấy), và in MỖI ẢNH MỘT CHẤM — 30 ảnh là 30 chấm. Khi phòng trà chưa có ảnh thì
// lấy một ảnh kho trên Unsplash: tức là cho người mua vé xem không gian của MỘT NƠI KHÁC.
//
// CÁC QUYẾT ĐỊNH CÓ NGUỒN (research_notes/Trang phòng trà ảnh và lịch diễn/bo_anh_va_doan_van_dai.md, 30/09/2026):
//  - KHÔNG tự chuyển ảnh. NN/g: khung chỉ nên đổi khi người dùng yêu cầu; Baymard: không tự chạy trên điện thoại;
//    web.dev: "It's rare that autoplay is a good choice". Không tự chạy thì WCAG 2.2 SC 2.2.2 (mức A) không kích hoạt,
//    nên cũng không cần nút dừng. (Bằng chứng gốc đo trên băng chuyền quảng bá ở trang chủ; áp sang bộ ảnh là suy luận.)
//  - ẢNH NHỎ thay cho chấm tròn. Baymard: 100% trang máy tính trong bộ đối chuẩn dùng ảnh nhỏ; chỉ có chấm thì 50%
//    người dùng máy tính gặp khó; chấm trên điện thoại hay bị bấm nhầm. Bộ đếm "3 / 12" là phần BỔ SUNG (NN/g: luôn
//    cho biết có bao nhiêu khung và đang ở đâu), không thay ảnh nhỏ.
//  - NGUONG_HIEN_HET = 10: tới 10 ảnh thì in hết ảnh nhỏ (Baymard: tới 10–14 ảnh, in hết là cách an toàn nhất — lấy
//    mức thấp vì cột ảnh ở đây hẹp hơn trang sản phẩm). Nhiều hơn: in 9 ảnh + một ô "+N" mở lớp phủ có ĐỦ mọi ảnh
//    (Baymard gọi là "truncation thumbnail": phải ghi SỐ ảnh đang ẩn).
//  - Điện thoại: ảnh nhỏ không in (dải 30 ô trên màn 390px không dùng được); thay bằng vuốt ngang + bộ đếm + nút
//    "Xem tất cả N ảnh".
//  - Nút trước/sau là <button> thật, LUÔN hiện, 48px, nằm trong thanh dưới ảnh — không đè lên ảnh (tiêu chí duyệt:
//    ảnh là thứ mang màu của trang, giao diện lùi lại). Bấm không di chuyển focus (WAI-ARIA APG, mẫu carousel).
//  - Lớp phủ dùng <dialog>.showModal() của trình duyệt: tự giữ focus bên trong, Esc đóng, trả focus về nút đã mở.
//  - Không có ảnh: ô "Chưa có ảnh" của chính trang, KHÔNG ảnh kho, không điều khiển nào.
//
// GIỚI HẠN ĐÃ BIẾT:
//  - Chữ thay thế: chủ phòng trà thường không nhập chú thích, khi đó alt chỉ ĐỊNH DANH ("ảnh 3 trên 12") chứ không mô
//    tả nội dung — chưa chắc đạt "mục đích tương đương" của SC 1.1.1. Đường nâng cấp: bắt nhập chú thích lúc tải ảnh.
//  - Ảnh phòng trà tải lên có tỉ lệ bất kỳ; khung cố định 4:3 và cắt theo object-cover. Lớp phủ in ảnh không cắt.
import { useRef, useState } from 'react'
import { ChevronLeft, ChevronRight, Images, X } from 'lucide-react'
import CoverFallback from '../shared/CoverFallback'

export const NGUONG_HIEN_HET = 10
const VUOT_TOI_THIEU = 40 // px — ngắn hơn thì coi là chạm, không phải vuốt

const BoAnh = ({ anh = [], ten = '' }) => {
  const [viTri, setViTri] = useState(0)
  const hopRef = useRef(null)
  const chamBatDau = useRef(null)
  const n = anh.length

  if (n === 0) {
    return <div className="aspect-[4/3] w-full bg-board-soft"><CoverFallback /></div>
  }

  const i = Math.min(viTri, n - 1)
  const moTa = (k) => anh[k].caption || `Không gian ${ten}, ảnh ${k + 1} trên ${n}`
  const lui = () => setViTri((v) => (Math.min(v, n - 1) - 1 + n) % n)
  const toi = () => setViTri((v) => (Math.min(v, n - 1) + 1) % n)

  const moTatCa = () => hopRef.current?.showModal()
  const chon = (k) => { setViTri(k); hopRef.current?.close() }

  const anhNho = n <= NGUONG_HIEN_HET ? anh : anh.slice(0, NGUONG_HIEN_HET - 1)
  const soAn = n - anhNho.length

  if (n === 1) {
    return (
      <figure className="w-full">
        <div className="aspect-[4/3] w-full bg-board-soft">
          <img src={anh[0].url} alt={moTa(0)} width="1200" height="900" fetchPriority="high" className="w-full h-full object-cover" />
        </div>
        {anh[0].caption && <figcaption className="px-4 sm:px-0 py-3 text-sm text-lamp-mute">{anh[0].caption}</figcaption>}
      </figure>
    )
  }

  const NUT = 'inline-flex items-center justify-center w-12 h-12 border border-lamp/40 text-lamp hover:bg-lamp hover:text-board transition-colors'

  return (
    <section role="group" aria-roledescription="bộ ảnh" aria-label={`Ảnh không gian ${ten}`} className="w-full">
      <div
        className="aspect-[4/3] w-full bg-board-soft touch-pan-y"
        aria-live="polite"
        onTouchStart={(e) => { chamBatDau.current = e.touches[0].clientX }}
        onTouchEnd={(e) => {
          if (chamBatDau.current == null) return
          const dx = e.changedTouches[0].clientX - chamBatDau.current
          chamBatDau.current = null
          if (Math.abs(dx) >= VUOT_TOI_THIEU) (dx < 0 ? toi : lui)()
        }}
      >
        {/* Ảnh đầu là phần tử lớn nhất của khung nhìn đầu → ưu tiên tải, không lazy (web.dev). key đổi theo ảnh để
            trình duyệt không giữ ảnh cũ trong lúc ảnh mới đang tải. */}
        <img key={anh[i].url} src={anh[i].url} alt={moTa(i)} width="1200" height="900"
          fetchPriority={i === 0 ? 'high' : 'auto'} className="w-full h-full object-cover" />
      </div>

      <div className="flex flex-wrap items-center gap-x-4 gap-y-2 px-4 sm:px-0 pt-3">
        <div className="flex gap-2">
          <button type="button" onClick={lui} aria-label="Ảnh trước" className={NUT}><ChevronLeft size={22} aria-hidden="true" /></button>
          <button type="button" onClick={toi} aria-label="Ảnh sau" className={NUT}><ChevronRight size={22} aria-hidden="true" /></button>
        </div>
        <p className="font-mono text-sm text-lamp" aria-hidden="true">{i + 1} / {n}</p>
        {anh[i].caption && <p className="text-sm text-lamp-mute min-w-0 flex-1 basis-40">{anh[i].caption}</p>}
        <button type="button" onClick={moTatCa}
          className={`ml-auto inline-flex items-center gap-2 min-h-[48px] text-sm font-semibold text-lamp hover:text-stock ${soAn > 0 ? '' : 'sm:hidden'}`}>
          <Images size={18} aria-hidden="true" /> Xem tất cả {n} ảnh
        </button>
      </div>

      {/* ẢNH NHỎ — từ sm trở lên. Nút thường trong một nhóm (biến thể "grouped" của APG), ảnh đang xem có aria-current. */}
      <div role="group" aria-label="Chọn ảnh" className="hidden sm:flex flex-wrap gap-2 pt-3">
        {anhNho.map((a, k) => (
          <button key={a.url + k} type="button" onClick={() => setViTri(k)} aria-current={k === i ? 'true' : undefined}
            aria-label={`Xem ảnh ${k + 1}${a.caption ? `: ${a.caption}` : ''}`}
            className={`w-16 h-12 overflow-hidden border-2 transition-opacity ${k === i ? 'border-lamp' : 'border-transparent opacity-60 hover:opacity-100'}`}>
            <img src={a.url} alt="" loading="lazy" width="64" height="48" className="w-full h-full object-cover" />
          </button>
        ))}
        {soAn > 0 && (
          <button type="button" onClick={moTatCa} aria-label={`Xem thêm ${soAn} ảnh`}
            className="w-16 h-12 border-2 border-lamp/40 text-lamp font-mono text-sm hover:bg-lamp hover:text-board transition-colors">
            +{soAn}
          </button>
        )}
      </div>

      {/* LỚP PHỦ: mọi ảnh, không cắt. Ảnh trong lớp phủ chỉ tải khi hộp mở (loading="lazy" + dialog đóng = không hiển thị). */}
      <dialog ref={hopRef} aria-labelledby="tieu-de-bo-anh"
        className="bg-board text-lamp w-screen h-dvh max-w-none max-h-none m-0 p-0 backdrop:bg-board">
        <div className="sticky top-0 z-10 flex items-center justify-between gap-4 bg-board border-b border-lamp/20 px-4 sm:px-8 py-3">
          <h2 id="tieu-de-bo-anh" className="text-2xl sm:text-3xl text-lamp">{ten} <span className="font-mono text-base text-lamp-mute align-middle">{n} ảnh</span></h2>
          <button type="button" onClick={() => hopRef.current?.close()} autoFocus
            className="inline-flex items-center gap-2 min-h-[48px] px-4 border border-lamp/40 text-lamp font-semibold hover:bg-lamp hover:text-board transition-colors">
            <X size={18} aria-hidden="true" /> Đóng
          </button>
        </div>
        <ul className="grid gap-4 sm:gap-6 sm:grid-cols-2 xl:grid-cols-3 p-4 sm:p-8">
          {anh.map((a, k) => (
            <li key={a.url + k}>
              <figure>
                <button type="button" onClick={() => chon(k)} aria-label={`Chọn ảnh ${k + 1} làm ảnh đang xem`} className="block w-full bg-board-soft">
                  <img src={a.url} alt={moTa(k)} loading="lazy" className="w-full h-auto" />
                </button>
                <figcaption className="flex gap-3 pt-2 text-sm text-lamp-mute">
                  <span className="font-mono text-lamp">{k + 1} / {n}</span>
                  {a.caption && <span>{a.caption}</span>}
                </figcaption>
              </figure>
            </li>
          ))}
        </ul>
      </dialog>
    </section>
  )
}

export default BoAnh
