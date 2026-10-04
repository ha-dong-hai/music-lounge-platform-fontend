// Nguồn: https://github.com/TailAdmin/free-react-tailwind-admin-dashboard/blob/e888dd1/src/components/ui/badge/Badge.tsx (giấy phép MIT, © 2023 TailAdmin)
// Ngày lấy: 05/10/2026
// Đã sửa: TSX → JSX; màu của TailAdmin (brand-50/500, success-50/600, error-…, warning-…, blue-light-…) đổi sang biến màu màn vận hành (chinh, success, danger, warning, sl-khangia) — nền nhạt = 14% của chính màu đó; bỏ nhánh dark:; cỡ sm 12px → text-xs (ở màn vận hành là 14px); chữ đậm 600 vì chữ màu cỡ nhỏ cần đậm mới đủ tương phản (reports/PreMortem-giao-dien-quan-tri-2026-10-05.md).
//
// NHÃN MÀU: viên bo tròn, hai kiểu (nền nhạt / tô đặc), bảy màu. Dùng cho trạng thái và mức tăng giảm.
const KIEU = {
  nhat: {
    chinh: 'bg-primary/14 text-primary',
    dat: 'bg-success/14 text-success',
    loi: 'bg-danger/14 text-danger',
    canhBao: 'bg-warning/14 text-warning',
    tin: 'bg-sl-khangia/14 text-sl-khangia',
    xam: 'bg-muted text-foreground',
    toi: 'bg-ink-mute text-white',
  },
  dac: {
    chinh: 'bg-primary text-white',
    dat: 'bg-success text-white',
    loi: 'bg-danger text-white',
    canhBao: 'bg-warning text-white',
    tin: 'bg-sl-khangia text-white',
    xam: 'bg-ink-mute text-white',
    toi: 'bg-ink text-white',
  },
}

const NhanMau = ({ kieu = 'nhat', mau = 'chinh', co = 'md', truoc, sau, children }) => (
  <span className={`inline-flex items-center justify-center gap-1 rounded-full px-2.5 py-0.5 font-semibold ${co === 'sm' ? 'text-xs' : 'text-sm'} ${KIEU[kieu][mau]}`}>
    {truoc && <span className="me-1">{truoc}</span>}
    {children}
    {sau && <span className="ms-1">{sau}</span>}
  </span>
)

export default NhanMau
