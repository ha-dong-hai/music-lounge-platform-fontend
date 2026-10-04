// Nguồn: https://github.com/TailAdmin/free-react-tailwind-admin-dashboard/blob/e888dd1/src/components/ecommerce/EcommerceMetrics.tsx (giấy phép MIT, © 2023 TailAdmin); ô biểu tượng nền nhạt + biểu tượng màu theo https://github.com/adminmart/matdash-react-tailwind-free/blob/c48d0ed/package/src/components/dashboard/NewCustomers.tsx (MIT, © 2025 AdminMart)
// Ngày lấy: 05/10/2026
// Đã sửa: TSX → JSX; tách một ô thành linh kiện nhận props (bản gốc viết cứng hai ô); màu xám của ô biểu tượng (bg-gray-100) đổi thành nền nhạt 16% của MÀU NHÓM và biểu tượng mang màu nhóm (cách của MatDash) — chủ dự án muốn nhiều màu; màu chữ/viền đổi sang biến màu màn vận hành; bỏ nhánh dark:; mức tăng giảm tính từ hai con số thay vì viết cứng; thêm dòng chú thích dưới (mẫu số / "kỳ trước chưa có"); viên tăng/giảm chuyển xuống dòng chú thích vì số tiền đồng dài đè lên nó.
//
// THẺ CHỈ SỐ: ô biểu tượng ở trên; nhãn + con số ở dưới bên trái; viên tăng/giảm ở dòng dưới cùng (bản gốc TailAdmin đặt bên phải con số).
// `mau`: khoá nhóm trong components/bang/mauSoLieu (tien, khangia, goiy, uytin, buoidien).
// `nay`, `truoc`: hai con số để tính mức thay đổi; thiếu `truoc` thì không hiện viên. `ghiChu`: dòng phụ tuỳ chọn.
import { ArrowDown, ArrowUp } from 'lucide-react'
import NhanMau from './nhan-mau'
import { MAU_SO_LIEU } from '@/components/bang/mauSoLieu'
import { phanTramDoi } from '@/utils/kyBaoCao'

const TheChiSo = ({ nhan, so, icon: Icon, mau = 'goiy', nay, truoc, ghiChu }) => {
  const sac = MAU_SO_LIEU[mau]?.hex ?? 'var(--color-chinh)'
  const doi = truoc === undefined ? undefined : phanTramDoi(nay, truoc)
  const chuDoi = doi === null || doi === undefined ? null : `${Math.abs(doi).toLocaleString('vi-VN', { maximumFractionDigits: 1 })}%`
  return (
    <div className="rounded-2xl border border-border bg-card p-5 md:p-6">
      {Icon && (
        <div className="flex h-12 w-12 items-center justify-center rounded-xl" style={{ backgroundColor: `color-mix(in srgb, ${sac} 16%, var(--color-card))`, color: sac }}>
          <Icon className="size-6" aria-hidden="true" />
        </div>
      )}
      {/* Bản gốc đặt viên tăng/giảm NGANG HÀNG con số (items-end justify-between). Số tiền đồng dài ("55.200.000đ") đè lên
          viên ở thẻ hẹp (đo trên ảnh chụp 05/10), nên viên xuống dòng dưới, cạnh câu "so với kỳ trước". */}
      <div className="mt-5 min-w-0">
        <span className="text-sm text-muted-foreground">{nhan}</span>
        <p className="mt-2 text-2xl font-bold tabular-nums text-foreground xl:text-3xl">{so}</p>
      </div>
      {(ghiChu || truoc !== undefined) && (
        <p className="mt-3 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
          {chuDoi && Math.abs(doi) >= 0.05 && (
            <NhanMau mau={doi > 0 ? 'dat' : 'loi'} co="sm">
              {doi > 0 ? <ArrowUp className="size-3.5" aria-hidden="true" /> : <ArrowDown className="size-3.5" aria-hidden="true" />}
              <span className="sr-only">{doi > 0 ? 'Tăng' : 'Giảm'}</span>{chuDoi}
            </NhanMau>
          )}
          {ghiChu ?? (doi === null ? 'Kỳ trước chưa có' : Math.abs(doi) < 0.05 ? 'Bằng kỳ trước' : 'so với kỳ trước')}
        </p>
      )}
    </div>
  )
}

export default TheChiSo
