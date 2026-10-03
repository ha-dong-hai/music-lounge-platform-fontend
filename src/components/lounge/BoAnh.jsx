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
// XẤP POLAROID (02/10/2026): khung xem in thành xấp ảnh chụp lấy liền (XapPolaroid) — kéo tấm trên cùng để sang ảnh
// khác, chạm để lật xem chú thích viết tay. Thay vuốt tự bắt bằng onTouchStart/End của bản trước (thao tác kéo của
// framer-motion đã gồm vuốt). Chú thích chuyển lên tấm ảnh nên thanh điều khiển không in lại. Mọi thao tác kéo/lật đều
// có nút tương đương ở thanh dưới.
//
// PHÍM VÀ XEM ẢNH LỚN (03/10/2026 — chủ dự án: "kéo ảnh qua lại bằng phím hoặc kéo thả chuột"):
//  - Xấp ảnh nhận tiêu điểm (Tab tới được) và nghe phím: ← → đổi ảnh, Home / End về ảnh đầu / cuối. Bản trước chỉ đổi
//    ảnh được bằng kéo hoặc bấm nút — người dùng bàn phím phải Tab tới đúng nút rồi mới bấm.
//  - Lớp "Xem tất cả" có thêm chế độ XEM LỚN (TrinhXemAnh): bấm một ảnh trong lưới là xem ảnh đó không cắt, sang ảnh khác
//    bằng kéo/vuốt, phím ← →, hoặc nút. Bản trước bấm ảnh trong lưới chỉ đóng lớp phủ. Đóng lớp phủ khi đang xem lớn thì
//    xấp ảnh ngoài trang dừng ở đúng ảnh vừa xem.
//
// GIỚI HẠN ĐÃ BIẾT:
//  - Chữ thay thế: chủ phòng trà thường không nhập chú thích, khi đó alt chỉ ĐỊNH DANH ("ảnh 3 trên 12") chứ không mô
//    tả nội dung — chưa chắc đạt "mục đích tương đương" của SC 1.1.1. Đường nâng cấp: bắt nhập chú thích lúc tải ảnh.
//  - Ảnh phòng trà tải lên có tỉ lệ bất kỳ; khung cố định 4:3 và cắt theo object-cover. Lớp phủ in ảnh không cắt.
import { useRef, useState } from 'react'
import { ChevronLeft, ChevronRight, Images, LayoutGrid, Maximize2, RotateCcw, X } from 'lucide-react'
import CoverFallback from '../shared/CoverFallback'
import TrinhXemAnh from '../shared/TrinhXemAnh'
import XapPolaroid from './XapPolaroid'

export const NGUONG_HIEN_HET = 10

const BoAnh = ({ anh = [], ten = '' }) => {
  const [viTri, setViTri] = useState(0)
  const [lat, setLat] = useState(false) // đang xem mặt sau của tấm trên cùng
  // Lớp phủ: null = lưới mọi ảnh; số = đang xem lớn ảnh thứ mấy. `moHop` để chỉ dựng trình xem khi lớp phủ thật sự mở
  // (trình xem nghe phím ở mức tài liệu — không được nghe khi lớp phủ đang đóng).
  const [xemLon, setXemLon] = useState(null)
  const [moHop, setMoHop] = useState(false)
  const hopRef = useRef(null)
  const n = anh.length

  if (n === 0) {
    return <div className="aspect-[4/3] w-full bg-board-soft"><CoverFallback /></div>
  }

  const i = Math.min(viTri, n - 1)
  const moTa = (k) => anh[k].caption || `Không gian ${ten}, ảnh ${k + 1} trên ${n}`
  // Đổi ảnh thì luôn quay về mặt trước — tấm mới lên xấp không thể đang "lật sẵn".
  const lui = () => { setLat(false); setViTri((v) => (Math.min(v, n - 1) - 1 + n) % n) }
  const toi = () => { setLat(false); setViTri((v) => (Math.min(v, n - 1) + 1) % n) }
  const doiLat = () => setLat((v) => !v)

  const moTatCa = () => { setXemLon(null); setMoHop(true); hopRef.current?.showModal() }
  const moXemLon = (k) => { setXemLon(k); setMoHop(true); if (!hopRef.current?.open) hopRef.current?.showModal() }
  // Đóng lớp phủ (nút Đóng, Esc, …): đang xem lớn ảnh nào thì xấp ảnh ngoài trang dừng ở ảnh đó.
  const khiDong = () => { if (xemLon != null) { setLat(false); setViTri(xemLon) } setXemLon(null); setMoHop(false) }
  // Phím trên xấp ảnh. Chỉ khi tiêu điểm nằm trong bộ ảnh và lớp phủ đang đóng (lớp phủ có bộ nghe phím riêng).
  const phim = (e) => {
    if (moHop) return
    if (e.key === 'ArrowLeft') { e.preventDefault(); lui() }
    else if (e.key === 'ArrowRight') { e.preventDefault(); toi() }
    else if (e.key === 'Home') { e.preventDefault(); setLat(false); setViTri(0) }
    else if (e.key === 'End') { e.preventDefault(); setLat(false); setViTri(n - 1) }
  }

  const anhNho = n <= NGUONG_HIEN_HET ? anh : anh.slice(0, NGUONG_HIEN_HET - 1)
  const soAn = n - anhNho.length

  if (n === 1) {
    return (
      <figure className="w-full">
        <XapPolaroid anh={anh} i={0} ten={ten} moTa={moTa} onToi={() => {}} onLui={() => {}} lat={lat} onLat={doiLat} />
        {anh[0].caption && <figcaption className="sr-only">{anh[0].caption}</figcaption>}
        {anh[0].caption && <div className="px-4 sm:px-0 pt-3"><NutLat lat={lat} onLat={doiLat} /></div>}
      </figure>
    )
  }

  const NUT = 'inline-flex items-center justify-center w-12 h-12 border border-lamp/40 text-lamp hover:bg-lamp hover:text-board transition-colors'

  return (
    <section role="group" aria-roledescription="bộ ảnh" aria-label={`Ảnh không gian ${ten}`} className="w-full" onKeyDown={phim}>
      {/* Ảnh đầu là phần tử lớn nhất của khung nhìn đầu → XapPolaroid ưu tiên tải ảnh 0, không lazy (web.dev). */}
      {/* tabIndex 0: Tab tới được xấp ảnh rồi dùng ← → — không phải tìm đúng nút. Khung viền chỉ hiện khi đi bằng bàn phím. */}
      <div aria-live="polite" tabIndex={0} aria-label={`Xấp ảnh, ảnh ${i + 1} trên ${n}. Dùng phím mũi tên trái phải để đổi ảnh.`}
        className="focus:outline-none focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-lamp">
        <XapPolaroid anh={anh} i={i} ten={ten} moTa={moTa} onToi={toi} onLui={lui} lat={lat} onLat={doiLat} />
      </div>

      <div className="flex flex-wrap items-center gap-x-4 gap-y-2 px-4 sm:px-0 pt-3">
        <div className="flex gap-2">
          <button type="button" onClick={lui} aria-label="Ảnh trước" className={NUT}><ChevronLeft size={22} aria-hidden="true" /></button>
          <button type="button" onClick={toi} aria-label="Ảnh sau" className={NUT}><ChevronRight size={22} aria-hidden="true" /></button>
        </div>
        <p className="font-mono text-sm text-lamp" aria-hidden="true">{i + 1} / {n}</p>
        {anh[i].caption && <NutLat lat={lat} onLat={doiLat} />}
        <button type="button" onClick={() => moXemLon(i)}
          className="inline-flex items-center gap-2 min-h-[48px] text-sm font-semibold text-lamp hover:text-stock">
          <Maximize2 size={18} strokeWidth={1.75} aria-hidden="true" /> Xem ảnh lớn
        </button>
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
      <dialog ref={hopRef} aria-labelledby="tieu-de-bo-anh" onClose={khiDong}
        className="bg-board text-lamp w-screen h-dvh max-w-none max-h-none m-0 p-0 backdrop:bg-board">
        <div className={xemLon != null ? 'flex flex-col h-dvh' : ''}>
        <div className="sticky top-0 z-10 flex flex-wrap items-center justify-between gap-x-4 gap-y-2 bg-board border-b border-lamp/20 px-4 sm:px-8 py-3">
          <h2 id="tieu-de-bo-anh" className="text-2xl sm:text-3xl text-lamp">{ten} <span className="font-mono text-base text-lamp-mute align-middle">{n} ảnh</span></h2>
          <div className="flex gap-2">
            {xemLon != null && (
              <button type="button" onClick={() => setXemLon(null)}
                className="inline-flex items-center gap-2 min-h-[48px] px-4 border border-lamp/40 text-lamp font-semibold hover:bg-lamp hover:text-board transition-colors">
                <LayoutGrid size={18} aria-hidden="true" /> Lưới ảnh
              </button>
            )}
            <button type="button" onClick={() => hopRef.current?.close()} autoFocus
              className="inline-flex items-center gap-2 min-h-[48px] px-4 border border-lamp/40 text-lamp font-semibold hover:bg-lamp hover:text-board transition-colors">
              <X size={18} aria-hidden="true" /> Đóng
            </button>
          </div>
        </div>
        {moHop && xemLon != null && (
          <TrinhXemAnh key={`xem-${xemLon === null ? 'luoi' : 'lon'}`} anh={anh} batDau={xemLon} moTa={moTa} onDoi={setXemLon} nhan={`Ảnh không gian ${ten}, xem lớn`} />
        )}
        {xemLon == null && (
        <ul className="grid gap-4 sm:gap-6 sm:grid-cols-2 xl:grid-cols-3 p-4 sm:p-8">
          {anh.map((a, k) => (
            <li key={a.url + k}>
              <figure>
                <button type="button" onClick={() => moXemLon(k)} aria-label={`Xem lớn ảnh ${k + 1}`} className="block w-full bg-board-soft">
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
        )}
        </div>
      </dialog>
    </section>
  )
}

// Nút lật tương đương thao tác chạm vào ảnh — cho bàn phím và trình đọc màn hình (aria-pressed = đang xem mặt sau).
function NutLat({ lat, onLat }) {
  return (
    <button type="button" onClick={onLat} aria-pressed={lat}
      className="inline-flex items-center gap-2 min-h-[48px] text-sm font-semibold text-lamp hover:text-stock">
      <RotateCcw size={18} strokeWidth={1.75} aria-hidden="true" /> {lat ? 'Xem mặt ảnh' : 'Lật xem chữ sau ảnh'}
    </button>
  )
}

export default BoAnh
