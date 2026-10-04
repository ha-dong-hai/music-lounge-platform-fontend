// src/components/admin/dashboard/KhoiDanhGiaGoiY.jsx
//
// Chất lượng mô hình gợi ý (GET /analytics/recommender-evaluation). MLACP-595: chuyển từ trang Tổng quan sang trang Nội
// dung và tương tác — đây là số liệu kỹ thuật, không theo kỳ, không phải việc Admin xem hằng ngày.
//
// SỬA 04/10/2026 — LỖI DỮ LIỆU: bản trước đọc `m.name` và `m.hitRate` (tỷ lệ 0–1), nhưng backend (ModelEvaluationDto) trả
// `model`, `cases`, `hits`, `hitRateAtKPercent` (ĐÃ là phần trăm) và `catalogueCoveragePercent`. Kết quả: hai dòng không tên
// và con số luôn "0.0%" — trong khi số thật đo trên dữ liệu cục bộ là 67,57% (cá nhân hoá) so với 5,41% (mốc). Cùng khuôn
// bài học L-31: tên trường đọc từ API phải đối chiếu với DTO, không tin vào việc màn hình "hiện ra một con số".
//
// Trình bày (reports/Trang quản trị - rà soát thị giác…, luật Q1/Q5/Q8): một câu kết luận trước, so với mốc (Few: "Compared
// to what?"); độ lớn bằng ĐỘ DÀI thanh từ 0 tới 100% (NN/g) — vẽ bằng BieuDoThanhNgang (recharts); không khung lồng khung.
// Chủ dự án 04/10: "đúng đủ, không nhồi nhét nội dung gây rối mắt" — khối chỉ còn MỘT câu kết luận, biểu đồ, và MỘT dòng
// nhắc giới hạn luôn hiện (backend ghi rõ giới hạn phải đọc kèm con số, nên không giấu hẳn); lời giới hạn đầy đủ, độ phủ
// kho và cách đo nằm trong <details> "Chi tiết phép đo" — ai cần mới mở.
import { phanTram } from '../../../utils/dinhDangSo'
import BieuDoThanhNgang from '../../bang/BieuDoThanhNgang'
import { MAU_SO_LIEU } from '../../bang/mauSoLieu'

// Tên kỹ thuật backend → tên người đọc hiểu. Khoá lạ thì in nguyên, không giấu.
const TEN_MO_HINH = {
  content_based: 'Theo gu từng người',
  popularity_baseline: 'Mốc: buổi đông người chọn',
}
const MOC = 'popularity_baseline'
const ten = (m) => TEN_MO_HINH[m.model] ?? m.model

// `khongKhung`: bỏ viền + đệm khi khối nằm trong một mục gập đã có khung (không khung lồng khung).
const KhoiDanhGiaGoiY = ({ recommender, khongKhung = false }) => {
  if (!recommender) return null

  // BE cố tình KHÔNG trả con số khi chưa đủ dữ liệu — hiển thị đúng như vậy, không quy về 0%.
  if (recommender.status === 'NotEnoughHistory') {
    return (
      <div className={khongKhung ? 'space-y-2 pt-4' : 'border-2 border-line bg-card p-5 space-y-2'}>
        <p className="font-semibold text-ink">Chưa đủ dữ liệu để đo</p>
        <p className="text-sm text-ink-soft leading-relaxed">{recommender.caveat}</p>
        <p className="text-sm text-ink-soft">
          Người dùng đủ lịch sử: <span className="text-ink font-semibold tabular-nums">{recommender.usersWithEnoughHistory}</span>
          {' · '}Kho buổi diễn: <span className="text-ink font-semibold tabular-nums">{recommender.catalogueSize}</span>
        </p>
      </div>
    )
  }

  const ds = recommender.models ?? []
  const moc = ds.find((m) => m.model === MOC)
  const chinh = ds.find((m) => m.model !== MOC)
  const gapLan = moc && chinh && moc.hitRateAtKPercent > 0 ? chinh.hitRateAtKPercent / moc.hitRateAtKPercent : null
  const k = recommender.k

  return (
    <div className={khongKhung ? 'space-y-4 pt-4' : 'border-2 border-line bg-card p-5 sm:p-6 space-y-4'}>
      {chinh && moc && (
        <p className="text-lg text-ink leading-snug">
          Gợi ý theo gu đoán đúng <span className="font-bold tabular-nums">{phanTram(chinh.hitRateAtKPercent)}</span> số lần
          {gapLan && gapLan >= 1.1
            ? <>, <span className="font-bold">gấp {gapLan.toLocaleString('vi-VN', { maximumFractionDigits: 1 })} lần</span> mốc so sánh.</>
            : <>; mốc so sánh là {phanTram(moc.hitRateAtKPercent)}.</>}
        </p>
      )}

      {/* max-w-2xl: thanh dài hết màn rộng thì mắt phải quét xa giữa tên và số. */}
      <div className="max-w-2xl">
        <BieuDoThanhNgang toiDa={100} mau={MAU_SO_LIEU.goiy.hex}
          moTa={`Tỷ lệ trúng trong ${k} vị trí đầu: ${ds.map((m) => `${ten(m)} ${phanTram(m.hitRateAtKPercent)}, ${m.hits} trên ${m.cases} lần`).join('; ')}`}
          data={ds.map((m) => ({
            khoa: m.model, nhan: ten(m), giaTri: m.hitRateAtKPercent, mo: m.model === MOC,
            nhanGiaTri: `${phanTram(m.hitRateAtKPercent)} · ${m.hits}/${m.cases} lần`,
          }))} />
      </div>

      <p className="text-sm text-ink-soft">Đo trên dữ liệu đã có, chưa thay được số đo trên người dùng thật.</p>
      <details className="text-sm text-ink-soft">
        <summary className="cursor-pointer min-h-[44px] inline-flex items-center font-semibold text-ink underline underline-offset-4">Chi tiết phép đo</summary>
        <div className="space-y-2 leading-relaxed pb-1 max-w-3xl">
          <p>{recommender.method}</p>
          <p>
            Độ phủ kho (phần trong {recommender.catalogueSize} buổi diễn từng được đưa lên):{' '}
            {ds.map((m) => `${ten(m)} ${phanTram(m.catalogueCoveragePercent)}`).join(' · ')}.
          </p>
          {recommender.caveat && <p>{recommender.caveat}</p>}
        </div>
      </details>
    </div>
  )
}

export default KhoiDanhGiaGoiY
