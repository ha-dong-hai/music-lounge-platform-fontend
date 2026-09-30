// src/pages/dev/ThuBangTanstack.jsx
//
// TRANG THỬ NỘI BỘ (chỉ có khi chạy vite dev — xem AppRouter). Kiểm lỗi TanStack Table #6601 trước khi dùng thư viện cho
// bảng thật: https://github.com/TanStack/table/issues/6601 (mở 24/09/2026 trên 9.2.4 / React 19.3) — component con giữ
// đối tượng `table` có thể KHÔNG vẽ lại khi `data` đổi từ nguồn ngoài (TanStack Query). Đây đúng là cách dùng đã khuyến
// nghị (reports/Thư viện bảng lọc phân trang dữ liệu lớn.md), nên phải đo trước.
//
// Dựng theo ví dụ chính thức examples/react/with-tanstack-query (nhánh main, đọc nguyên văn 01/10/2026): features chỉ
// khai báo rowPaginationFeature, manualPagination + rowCount, useTable(options, (state) => state), bảng vẽ ở component con.
// Dữ liệu giả lập độ trễ mạng; mỗi trang có dòng đầu mang số trang để phép thử đọc được.
import { useState } from 'react'
import { QueryClient, QueryClientProvider, keepPreviousData, useQuery } from '@tanstack/react-query'
import { createColumnHelper, rowPaginationFeature, tableFeatures, useTable } from '@tanstack/react-table'

const TONG = 137
const layTrang = async ({ pageIndex, pageSize }) => {
  await new Promise((r) => setTimeout(r, 250))
  const dau = pageIndex * pageSize
  const rows = Array.from({ length: Math.max(0, Math.min(pageSize, TONG - dau)) }, (_, i) => ({ id: dau + i + 1, ten: `Buổi diễn số ${dau + i + 1}`, trang: pageIndex + 1 }))
  return { rows, rowCount: TONG }
}

const features = tableFeatures({ rowPaginationFeature })
const cot = createColumnHelper()
const columns = cot.columns([
  cot.accessor('id', { header: 'Mã' }),
  cot.accessor('ten', { header: 'Tên' }),
  cot.accessor('trang', { header: 'Trang' }),
])

// Component CON giữ đối tượng table — đúng chỗ #6601 nói có thể không vẽ lại.
const BangCon = ({ table }) => (
  <table data-testid="bang">
    <thead>
      {table.getHeaderGroups().map((hg) => (
        <tr key={hg.id}>{hg.headers.map((h) => <th key={h.id}><table.FlexRender header={h} /></th>)}</tr>
      ))}
    </thead>
    <tbody>
      {table.getRowModel().rows.map((r) => (
        <tr key={r.id}>{r.getAllCells().map((c) => <td key={c.id}><table.FlexRender cell={c} /></td>)}</tr>
      ))}
    </tbody>
  </table>
)

const RONG = []
const Bang = () => {
  const [pagination, setPagination] = useState({ pageIndex: 0, pageSize: 20 })
  const q = useQuery({ queryKey: ['thu-bang', pagination.pageIndex, pagination.pageSize], queryFn: () => layTrang(pagination), placeholderData: keepPreviousData })
  const table = useTable({
    key: 'thu-bang',
    features,
    columns,
    data: q.data?.rows ?? RONG,
    rowCount: q.data?.rowCount,
    getRowId: (r) => String(r.id),
    state: { pagination },
    onPaginationChange: setPagination,
    manualPagination: true,
  }, (state) => state)
  return (
    <div className="p-6 space-y-3">
      <h1 className="text-3xl">Thử TanStack Table 9 + Query</h1>
      <BangCon table={table} />
      <div className="flex gap-2 items-center">
        <button type="button" onClick={() => table.previousPage()} disabled={!table.getCanPreviousPage()} className="border px-3 min-h-[44px]">Trang trước</button>
        <button type="button" onClick={() => table.nextPage()} disabled={!table.getCanNextPage()} className="border px-3 min-h-[44px]">Trang sau</button>
        <select aria-label="Số dòng mỗi trang" value={pagination.pageSize} onChange={(e) => table.setPageSize(Number(e.target.value))}>
          {[10, 20, 50].map((n) => <option key={n} value={n}>{n}</option>)}
        </select>
        <span data-testid="trang">Trang {pagination.pageIndex + 1} trên {table.getPageCount()}</span>
        {q.isFetching && <span data-testid="dang-tai">đang tải</span>}
      </div>
    </div>
  )
}

const qc = new QueryClient()
const ThuBangTanstack = () => <QueryClientProvider client={qc}><Bang /></QueryClientProvider>
export default ThuBangTanstack
