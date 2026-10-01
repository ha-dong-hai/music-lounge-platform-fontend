// src/components/bang/KhungTai.jsx
//
// BA TRẠNG THÁI CỦA MỘT VÙNG DỮ LIỆU: đang tải / lỗi / rỗng (01/10/2026). Đo 01/10: ~30 trang vận hành báo lỗi tải chỉ
// bằng toast rồi vẽ tiếp "Chưa có … nào" — tức là khi mất mạng, màn NÓI SAI rằng không có dữ liệu (người trực tưởng không
// có đơn, Admin tưởng hàng đợi trống). Thành phần này buộc ba nhánh tách nhau:
//  - đang tải: khung xương đúng chiều cao vùng (Carbon: khung xương thay vòng quay; không nhảy bố cục khi dữ liệu về);
//  - lỗi: role="alert" nói rõ "chưa tải được" + nút Thử lại (không nói "trống");
//  - rỗng: câu nói vì sao rỗng và bước tiếp theo (NN/g Empty States) — truyền qua `rong`.
// Có dữ liệu thì vẽ `children`.
//
// Props: dangTai, loi (truthy = lỗi), rong (bool), taiLai (fn), tenVung ("đơn gọi món"), noiDungRong (node), caoKhung.
const KhungTai = ({ dangTai, loi, rong, taiLai, tenVung = 'dữ liệu', noiDungRong, caoKhung = 'h-48', children }) => {
  if (dangTai) {
    return <div className={`${caoKhung} border-2 border-ink/15 bg-ink/5 animate-pulse`} aria-busy="true" aria-label={`Đang tải ${tenVung}`} />
  }
  if (loi) {
    return (
      <div role="alert" className="flex flex-wrap items-center gap-4 border-2 border-ink bg-card p-5">
        <p>Chưa tải được {tenVung}. Dữ liệu vẫn còn nguyên — kiểm tra kết nối rồi thử lại.</p>
        {taiLai && (
          <button type="button" onClick={() => taiLai()} className="min-h-[44px] px-4 border-2 border-ink font-semibold hover:bg-ink hover:text-lamp">
            Thử lại
          </button>
        )}
      </div>
    )
  }
  if (rong) {
    return <div className="border-2 border-ink/30 bg-card p-6 sm:p-8 text-ink-soft">{noiDungRong ?? `Chưa có ${tenVung}.`}</div>
  }
  return children
}

// CẢ TRANG không tải được (dữ liệu nền như "phòng trà của tôi" lỗi): vẫn giữ tiêu đề trang để người dùng biết mình đang
// ở đâu, và nói rõ là CHƯA TẢI ĐƯỢC. Bản cũ ở ~20 trang vận hành chỉ bật toast rồi vẽ tiếp nhánh "không có dữ liệu" — vd.
// trang Nhân viên khi mất mạng bảo chủ phòng trà "Hãy tạo hồ sơ phòng trà trước" (01/10/2026).
export const TrangLoiTai = ({ tieuDe, tenVung, taiLai }) => (
  <div className="space-y-4 max-w-3xl">
    <h1 className="text-4xl text-ink">{tieuDe}</h1>
    <KhungTai loi tenVung={tenVung} taiLai={taiLai} />
  </div>
)

export default KhungTai
