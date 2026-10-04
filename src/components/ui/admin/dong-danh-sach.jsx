// Nguồn: https://github.com/satnaing/shadcn-admin/blob/e16c87f/src/features/dashboard/components/recent-sales.tsx (giấy phép MIT, © 2024 Sat Naing)
// Ngày lấy: 05/10/2026
// Đã sửa: TSX → JSX; một dòng viết cứng thành linh kiện nhận props; ảnh đại diện thay bằng ô đầu dòng (số thứ tự trong vòng tròn, hoặc biểu tượng trong ô vuông nền nhạt màu chủ đề); cả dòng thành liên kết khi có `to`; thêm chỗ cho nhãn phụ sau tiêu đề.
//
// DÒNG DANH SÁCH: ô đầu dòng · tiêu đề + dòng phụ · giá trị bên phải. Dùng cho "việc cần xử lý" và các bảng xếp hạng ngắn.
import { Link } from 'react-router-dom'
import { ChevronRight } from 'lucide-react'

const DongDanhSach = ({ to, thuTu, icon: Icon, tieuDe, kem, phu, phai, muiTen = false }) => {
  const than = (
    <>
      {Icon
        ? <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary/14 text-primary"><Icon className="size-5" aria-hidden="true" /></span>
        : thuTu != null && <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-muted text-sm font-semibold tabular-nums text-foreground">{thuTu}</span>}
      <span className="flex min-w-0 flex-1 flex-wrap items-center justify-between gap-x-3 gap-y-1">
        <span className="min-w-0 space-y-1">
          <span className="flex flex-wrap items-center gap-x-3 gap-y-1">
            <span className="truncate text-sm leading-none font-medium text-foreground">{tieuDe}</span>
            {kem}
          </span>
          {phu && <span className="block truncate text-sm text-muted-foreground">{phu}</span>}
        </span>
        {phai && <span className="font-medium tabular-nums text-foreground">{phai}</span>}
      </span>
      {muiTen && <ChevronRight className="size-4 shrink-0 text-muted-foreground" aria-hidden="true" />}
    </>
  )
  return to
    ? <Link to={to} className="-mx-2 flex min-h-[56px] items-center gap-4 rounded-md px-2 py-2 hover:bg-muted">{than}</Link>
    : <div className="flex items-center gap-4 py-2">{than}</div>
}

export default DongDanhSach
