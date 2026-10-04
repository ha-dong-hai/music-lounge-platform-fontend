// src/components/bang/DauTrang.jsx
//
// ĐẦU TRANG VẬN HÀNH dùng chung (01/10/2026): tiêu đề, một dòng mô tả, và 0–2 thao tác chính bên phải. Ảnh quét 01/10 cho
// thấy mỗi trang một cỡ nút chính (28px ở Khu vực chỗ ngồi/Thực đơn, 40px ở Buổi diễn) và mô tả lúc có lúc không.
// Nút chính cao 44px như mọi nút khác (DESIGN.md).
//
// Props:
//   tieuDe  — chữ h1 (đúng tên mục trên thanh trái, để đầu trang và thanh trái không lệch).
//   moTa    — câu nói trang này để làm gì / dữ liệu là gì (node).
//   thaoTac — [{ nhan, icon?, onClick, phu? (nút viền thay vì nút đặc), disabled? }] — tối đa 2, nhiều hơn thì đặt trong trang.
//   children — chèn thêm dưới mô tả (vd. dòng nhắc trạng thái phòng trà).
export const NUT_CHINH = 'inline-flex items-center justify-center gap-2 min-h-[44px] px-4 bg-ink text-lamp text-sm font-semibold hover:bg-board disabled:opacity-50'
export const NUT_PHU = 'inline-flex items-center justify-center gap-2 min-h-[44px] px-4 border-2 border-ink bg-card text-ink text-sm font-semibold hover:bg-ink hover:text-lamp disabled:opacity-50'
// Nút chỉ có biểu tượng trên dòng (sửa, xoá…): vùng bấm 44px; BẮT BUỘC truyền aria-label nêu đúng đối tượng.
export const NUT_BIEU_TUONG = 'inline-flex items-center justify-center w-11 h-11 border-2 border-line text-ink hover:border-ink disabled:opacity-50'
export const NUT_BIEU_TUONG_XOA = 'inline-flex items-center justify-center w-11 h-11 border-2 border-danger/40 text-danger hover:border-danger disabled:opacity-50'

const DauTrang = ({ tieuDe, moTa, thaoTac = [], children }) => (
  <div className="flex flex-wrap items-start justify-between gap-4 mb-6">
    <div className="min-w-0 max-w-[70ch]">
      <h1 className="text-4xl text-ink">{tieuDe}</h1>
      {moTa && <p className="text-ink-soft mt-1 leading-relaxed">{moTa}</p>}
      {children}
    </div>
    {thaoTac.length > 0 && (
      <div className="flex flex-wrap gap-2">
        {thaoTac.map(({ nhan, icon: Icon, onClick, phu, disabled }) => (
          <button key={nhan} type="button" onClick={onClick} disabled={disabled} className={phu ? NUT_PHU : NUT_CHINH}>
            {Icon && <Icon size={16} aria-hidden="true" />} {nhan}
          </button>
        ))}
      </div>
    )}
  </div>
)

export default DauTrang
