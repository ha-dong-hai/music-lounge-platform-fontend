// src/routes/GocUngDung.jsx
//
// Route GỐC không có đường dẫn, bọc mọi route khác (MLACP-602). Việc duy nhất: in <title> của trang đang mở theo bảng
// utils/tieuDeTrang.js. Dùng thẻ <title> của React 19 (React tự đưa lên <head>) — không gán document.title bằng tay.
// Trang có tên riêng theo dữ liệu (buổi diễn, phòng trà, nghệ sĩ) được bảng trả null: ở đây không in gì, trang đó tự in
// <title> khi tải xong dữ liệu — không bao giờ có hai <title> cùng lúc.
//
// index.html vẫn giữ một <title> tĩnh để tab có tên trước khi React chạy; nó được gỡ ngay khi ứng dụng lên, vì trình
// duyệt lấy <title> ĐẦU TIÊN trong <head> — để lại thì mọi tiêu đề React in ra đều bị nó che.
import { useEffect } from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import { tieuDeTheoDuong } from '../utils/tieuDeTrang'

const GocUngDung = () => {
  const { pathname } = useLocation()
  useEffect(() => { document.querySelector('head > title[data-tinh]')?.remove() }, [])
  const tieuDe = tieuDeTheoDuong(pathname)
  return (
    <>
      {tieuDe && <title>{tieuDe}</title>}
      <Outlet />
    </>
  )
}

export default GocUngDung
