// src/routes/GocUngDung.jsx
//
// Route GỐC không có đường dẫn, bọc mọi route khác (MLACP-602). Việc duy nhất: in <title> của trang đang mở theo bảng
// utils/tieuDeTrang.js. Dùng thẻ <title> của React 19 (React tự đưa lên <head>) — không gán document.title bằng tay.
// Trang có tên riêng theo dữ liệu (buổi diễn, phòng trà, nghệ sĩ) được bảng trả null: ở đây không in gì, trang đó tự in
// <title> khi tải xong dữ liệu — không bao giờ có hai <title> cùng lúc.
//
// index.html vẫn giữ một <title> tĩnh để tab có tên trước khi React chạy; nó được gỡ ngay khi ứng dụng lên, vì trình
// duyệt lấy <title> ĐẦU TIÊN trong <head> — để lại thì mọi tiêu đề React in ra đều bị nó che.
import { Suspense, useEffect } from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import { Loader2 } from 'lucide-react'
import { tieuDeTheoDuong } from '../utils/tieuDeTrang'

const DangTaiTrang = () => (
  <div className="min-h-[60vh] flex items-center justify-center bg-stock" aria-busy="true" aria-label="Đang tải trang">
    <Loader2 size={28} className="animate-spin text-ink" aria-hidden="true" />
  </div>
)

const GocUngDung = () => {
  const { pathname } = useLocation()
  useEffect(() => { document.querySelector('head > title[data-tinh]')?.remove() }, [])
  const tieuDe = tieuDeTheoDuong(pathname)
  return (
    <>
      {tieuDe && <title>{tieuDe}</title>}
      {/* MLACP-611: trang tải theo yêu cầu (React.lazy ở AppRouter) — trong lúc tệp của trang đang về thì hiện khung chờ. */}
      <Suspense fallback={<DangTaiTrang />}>
        <Outlet />
      </Suspense>
    </>
  )
}

export default GocUngDung
