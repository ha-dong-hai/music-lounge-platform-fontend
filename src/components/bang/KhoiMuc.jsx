// src/components/bang/KhoiMuc.jsx
//
// MỘT KIỂU MỤC cho trang số liệu vận hành (04/10/2026, luật Q7). Rà soát đo được: cùng vai trò "tiêu đề mục" mà trang
// Tổng quan dùng 18px đen, trang Nội dung dùng 14px xám đậm — người đọc không biết đâu là mục, đâu là nhãn. Polaris
// (Layout): mô tả mục ngắn 1–3 câu, nói mục này dùng để làm gì.
//
// 05/10/2026: `mau` (khoá của mauSoLieu) — ô màu trước tiêu đề, cùng màu với dải trên ô số và thanh biểu đồ của mục đó, để
// mắt nhận ra "khối này nói về tiền / khán giả / gợi ý" trước khi đọc chữ.
//
// Props: id (cho aria-labelledby), tieuDe, phamVi? (kỳ / "lúc này" — chữ nhạt cạnh tiêu đề), moTa?, phai?, mau?
import { MAU_SO_LIEU } from './mauSoLieu'

const KhoiMuc = ({ id, tieuDe, phamVi, moTa, phai, mau, children }) => (
  <section aria-labelledby={id} className="space-y-4">
    <div className="flex flex-wrap items-end justify-between gap-3">
      <div className="min-w-0">
        <h2 id={id} className="font-sans text-xl font-bold text-ink">
          {MAU_SO_LIEU[mau] && <span aria-hidden="true" className={`inline-block w-3 h-3 mr-2.5 ${MAU_SO_LIEU[mau].nen}`} />}
          {tieuDe}
          {phamVi && <span className="ml-2 text-sm font-normal text-ink-mute">{phamVi}</span>}
        </h2>
        {moTa && <p className="mt-1 text-sm text-ink-soft max-w-3xl leading-relaxed">{moTa}</p>}
      </div>
      {phai}
    </div>
    {children}
  </section>
)

export default KhoiMuc
