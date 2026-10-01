// src/components/bang/BangDuLieu.jsx
//
// BẢNG DỮ LIỆU DÙNG CHUNG cho bảng vận hành (Admin, chủ phòng trà) — 01/10/2026. Dựng trên TanStack Table 9.2.4 ở chế độ
// manual: máy chủ phân trang và lọc (hooks/useDanhSachMayChu), bảng chỉ lo cột, ô và trợ năng. Không tự viết lại logic
// bảng (chủ dự án yêu cầu dùng thư viện — reports/Thư viện bảng lọc phân trang dữ liệu lớn.md).
//
// Cách dùng theo ví dụ chính thức examples/react/with-tanstack-query: useTable(options, (state) => state), features chỉ
// rowPaginationFeature, manualPagination + rowCount. Lỗi mở #6601 (bảng ở component con không vẽ lại khi data đổi) đã
// thử trên trang /__dev/bang theo đúng mẫu này: KHÔNG tái hiện. Trạng thái trang lấy từ URL (ds), không giữ bản thứ hai.
//
// Props:
//   ds        — kết quả useDanhSachMayChu.
//   cot       — mảng cột tạo bằng createColumnHelper().columns([...]). Thêm meta.canPhai cho cột số/thao tác.
//   tenDonVi  — "tài khoản", "đơn"… dùng cho dòng đếm và nhãn phân trang.
//   chuThich  — <caption> (ẩn với mắt, đọc được bằng trình đọc màn hình).
//   idDanhSach — id của <table>, để PhanTrang đưa tiêu điểm về đầu bảng khi đổi trang.
//   khiRong   — nội dung khi không có dòng nào (nên nói vì sao: đang lọc hay chưa có dữ liệu).
//   layId     — (dòng) => id ổn định; mặc định dòng.id.
//
// MÀN HẸP (dưới md, 768px): mỗi dòng xếp thành một khối, mỗi ô có nhãn cột đứng trước (data-nhan + ::before). Bản đầu
// cuộn ngang trong khung: ở 390px bảng Tài khoản bị cắt ngay sau cột "Vai trò", cột Trạng thái và nút Khoá nằm khuất mà
// không có dấu hiệu gì. Đổi display của phần tử bảng làm VoiceOver/Safari bỏ ngữ nghĩa bảng, nên gắn lại role tường minh
// (table/rowgroup/row/columnheader/cell). Cột không cần nhãn trên màn hẹp (vd. cột tên có ảnh) đặt meta.khongNhanHep.
import { rowPaginationFeature, tableFeatures, useTable } from '@tanstack/react-table'
import PhanTrang from './PhanTrang'
import { HEP } from './lopBangHep'

const features = tableFeatures({ rowPaginationFeature })
const RONG = []
const layIdMacDinh = (d) => String(d.id)

const BangDuLieu = ({ ds, cot, tenDonVi = 'mục', chuThich, idDanhSach, khiRong, layId = layIdMacDinh }) => {
  const pagination = { pageIndex: ds.trang - 1, pageSize: ds.coThuc }
  const table = useTable({
    key: idDanhSach,
    features,
    columns: cot,
    data: ds.items ?? RONG,
    rowCount: ds.tong,
    getRowId: layId,
    state: { pagination },
    // Mọi thay đổi trang đi qua URL (ds) — bảng không giữ trạng thái trang riêng.
    onPaginationChange: (capNhat) => {
      const moi = typeof capNhat === 'function' ? capNhat(pagination) : capNhat
      if (moi.pageSize !== pagination.pageSize) ds.datCo(moi.pageSize)
      else if (moi.pageIndex !== pagination.pageIndex) ds.datTrang(moi.pageIndex + 1)
    },
    manualPagination: true,
  }, (state) => state)

  const soCot = cot.length
  const canPhai = (meta) => (meta?.canPhai ? 'md:text-right' : 'text-left')
  const nhanCot = (col) => (typeof col.columnDef.header === 'string' && !col.columnDef.meta?.khongNhanHep ? col.columnDef.header : undefined)

  return (
    <div className="space-y-3">
      <PhanTrang ds={ds} tenDonVi={tenDonVi} idDanhSach={idDanhSach} />
      <div className="overflow-x-auto border-2 border-ink bg-card">
        <table id={idDanhSach} tabIndex={-1} role="table" aria-busy={ds.dangTai || ds.dangTaiLai}
          className={`w-full text-sm focus:outline-none max-md:block ${ds.laDuLieuCu ? 'opacity-60' : ''}`}>
          {chuThich && <caption className="sr-only">{chuThich}, trang {ds.trang} trên {ds.soTrang}</caption>}
          <thead role="rowgroup" className="bg-sunken border-b-2 border-ink max-md:sr-only">
            {table.getHeaderGroups().map((hg) => (
              <tr key={hg.id} role="row">
                {hg.headers.map((h) => (
                  <th key={h.id} scope="col" role="columnheader" className={`px-4 py-3 font-semibold text-ink whitespace-nowrap ${canPhai(h.column.columnDef.meta)}`}>
                    {h.isPlaceholder ? null : <table.FlexRender header={h} />}
                  </th>
                ))}
              </tr>
            ))}
          </thead>
          <tbody role="rowgroup" className="divide-y divide-line max-md:block">
            {ds.dangTai ? (
              <tr><td colSpan={soCot} className="p-0"><div className="h-48 bg-ink/5 animate-pulse" aria-label={`Đang tải ${tenDonVi}`} /></td></tr>
            ) : ds.loi ? (
              <tr>
                <td colSpan={soCot} className="p-6">
                  <div role="alert" className="flex flex-wrap items-center gap-4">
                    <p>Chưa tải được danh sách {tenDonVi}.</p>
                    <button type="button" onClick={() => ds.taiLai()} className="min-h-[44px] px-4 border-2 border-ink font-semibold hover:bg-ink hover:text-lamp">Thử lại</button>
                  </div>
                </td>
              </tr>
            ) : table.getRowModel().rows.length === 0 ? (
              <tr><td colSpan={soCot} className="p-8 text-center text-ink-soft">{khiRong ?? `Không có ${tenDonVi} nào.`}</td></tr>
            ) : (
              table.getRowModel().rows.map((r) => (
                <tr key={r.id} role="row" className="hover:bg-sunken/40 max-md:block max-md:py-2">
                  {r.getAllCells().map((c) => (
                    <td key={c.id} role="cell" data-nhan={nhanCot(c.column)}
                      className={`px-4 py-3 align-middle ${canPhai(c.column.columnDef.meta)} ${nhanCot(c.column) ? HEP.o : HEP.oTron}`}>
                      <table.FlexRender cell={c} />
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      {ds.soTrang > 1 && <PhanTrang ds={ds} tenDonVi={tenDonVi} idDanhSach={idDanhSach} />}
    </div>
  )
}

export default BangDuLieu
