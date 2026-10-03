// src/components/bang/PhanTrang.jsx
//
// THANH PHÂN TRANG DÙNG CHUNG (01/10/2026) — cho mọi danh sách dùng hooks/useDanhSachMayChu.js. Thay ít nhất bốn kiểu
// nút phân trang tự viết khác nhau trước đây (mỗi trang một kiểu, nhãn tiếng Anh "Next page", không số trang).
//
// Theo quy ước đã nghiên cứu (reports/Thư viện bảng lọc phân trang dữ liệu lớn.md):
//  - Dòng khoảng "Hiện 21–40 trên 137 đơn" (Carbon) nằm trong role="status" → trình đọc màn hình đọc khi đổi trang hay
//    đổi bộ lọc mà không chuyển tiêu điểm (WCAG 2.2 SC 4.1.3 lấy đúng ví dụ "18 results returned").
//  - Dải số trang kiểu GOV.UK: trang đầu, trang cuối, trang hiện tại ±1, chỗ bỏ là "…" (hàm dayTrang). Trang hiện tại
//    có aria-current="page". Ô chọn cỡ trang 10/20/50 — nhiều endpoint kẹp ở 50 nên không cho 100.
//  - Nút cao 44px (WCAG 2.5.8 / thói quen đã chốt trong DESIGN.md).
// Chỉ một trang và không có gì để đổi cỡ thì vẫn hiện dòng đếm (người dùng cần biết có bao nhiêu), ẩn phần điều hướng.
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { dayTrang } from '../../hooks/useDanhSachMayChu'

const NUT = 'inline-flex items-center justify-center min-w-[44px] min-h-[44px] px-2 border-2 font-semibold transition-colors disabled:opacity-40 disabled:cursor-not-allowed'

const PhanTrang = ({ ds, tenDonVi = 'mục', idDanhSach, className = '' }) => {
  const { tong, trang, soTrang, co, coThuc, cacCo, datTrang, datCo, dangTaiLai, dangTai } = ds
  const tu = tong === 0 ? 0 : (trang - 1) * coThuc + 1
  const den = Math.min(tong, trang * coThuc)
  const sangTrang = (n) => {
    datTrang(n)
    // Đưa tiêu điểm về đầu danh sách: người dùng bàn phím không phải Tab ngược cả trang, và trình đọc màn hình biết
    // nội dung đã đổi (GOV.UK). Danh sách phải có id={idDanhSach} và tabIndex={-1}.
    // focus() KHÔNG cuộn khi danh sách còn lộ một phần (người dùng vừa bấm số trang ở ĐÁY danh sách): đo 03/10 ở khối
    // đánh giá, sang trang 2 mà đầu danh sách vẫn khuất 435px. Nên tự đưa đầu danh sách lên khi nó nằm trên mép màn hình.
    if (idDanhSach) {
      requestAnimationFrame(() => {
        const el = document.getElementById(idDanhSach)
        if (!el) return
        el.focus({ preventScroll: true })
        if (el.getBoundingClientRect().top < 0) el.scrollIntoView({ block: 'start' })
      })
    }
  }
  return (
    <div className={`flex flex-wrap items-center justify-between gap-x-6 gap-y-3 ${className}`}>
      <p role="status" className="font-mono text-sm text-ink-soft">
        {dangTai ? 'Đang tải…' : tong === 0 ? `Không có ${tenDonVi} nào` : `Hiện ${tu.toLocaleString('vi-VN')}–${den.toLocaleString('vi-VN')} trên ${tong.toLocaleString('vi-VN')} ${tenDonVi}`}
        {dangTaiLai && !dangTai && <span className="sr-only"> — đang cập nhật</span>}
      </p>

      <div className="flex flex-wrap items-center gap-3">
        {cacCo.length > 1 && tong > Math.min(...cacCo) && (
          <label className="inline-flex items-center gap-2 text-sm">
            <span>Mỗi trang</span>
            <select value={co} onChange={(e) => datCo(Number(e.target.value))}
              className="min-h-[44px] px-2 bg-card border-2 border-ink text-ink focus:outline-none focus:ring-2 focus:ring-ink">
              {cacCo.map((n) => <option key={n} value={n}>{n}</option>)}
            </select>
          </label>
        )}
        {soTrang > 1 && (
          <nav aria-label={`Phân trang ${tenDonVi}`}>
            <ul className="flex flex-wrap items-center gap-1">
              <li>
                <button type="button" onClick={() => sangTrang(trang - 1)} disabled={trang <= 1} aria-label="Trang trước"
                  className={`${NUT} border-ink hover:bg-ink hover:text-lamp`}>
                  <ChevronLeft size={18} aria-hidden="true" />
                </button>
              </li>
              {dayTrang(trang, soTrang).map((n, i) => (
                <li key={n === '…' ? `cach-${i}` : n}>
                  {n === '…' ? (
                    <span className="inline-flex items-center justify-center min-w-[32px] min-h-[44px] text-ink-mute" aria-hidden="true">…</span>
                  ) : (
                    <button type="button" onClick={() => sangTrang(n)} aria-label={`Trang ${n}`} aria-current={n === trang ? 'page' : undefined}
                      className={`${NUT} font-mono ${n === trang ? 'border-ink bg-ink text-lamp' : 'border-transparent hover:border-ink'}`}>
                      {n}
                    </button>
                  )}
                </li>
              ))}
              <li>
                <button type="button" onClick={() => sangTrang(trang + 1)} disabled={trang >= soTrang} aria-label="Trang sau"
                  className={`${NUT} border-ink hover:bg-ink hover:text-lamp`}>
                  <ChevronRight size={18} aria-hidden="true" />
                </button>
              </li>
            </ul>
          </nav>
        )}
      </div>
    </div>
  )
}

export default PhanTrang
