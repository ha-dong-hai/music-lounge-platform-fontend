// src/utils/anhChuCai.js
//
// ẢNH CHỮ CÁI khi người dùng / phòng trà / nghệ sĩ chưa có ảnh. Thay cho api.dicebear.com (30/09/2026):
//  - bản cũ gọi sang dịch vụ ngoài mỗi lần hiện một ô ảnh (16 chỗ), nghĩa là gửi TÊN NGƯỜI DÙNG lên máy chủ bên thứ
//    ba — tên người là dữ liệu cá nhân, không có lý do gì phải đi ra ngoài để vẽ hai chữ cái;
//  - và nó vẽ bằng màu mặc định của dịch vụ (xanh lục, xám lạnh), lạc khỏi bảng màu sơn then và lụa ngà.
// Nay vẽ tại chỗ thành một ảnh SVG dạng data-URI: khối sơn then, chữ ánh đèn, góc vuông. Không có mạng vẫn hiện.
// Màu viết bằng mã hex vì ảnh data-URI không đọc được biến CSS; giữ ĐÚNG giá trị token --color-board / --color-lamp.
const NEN = '#14110F'
const CHU = '#F2EAE0'

export const chuCaiDau = (ten) => {
  const tu = String(ten ?? '').trim().split(/\s+/).filter(Boolean)
  if (tu.length === 0) return '?'
  const dau = tu.length === 1 ? tu[0].slice(0, 2) : tu[0][0] + tu[tu.length - 1][0]
  return dau.toLocaleUpperCase('vi')
}

const thoat = (s) => s.replace(/[&<>"']/g, (k) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[k]))

export const anhChuCai = (ten) => {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><rect width="64" height="64" fill="${NEN}"/>`
    + `<text x="32" y="33" dominant-baseline="middle" text-anchor="middle" font-family="Be Vietnam Pro, sans-serif" font-weight="700" font-size="26" fill="${CHU}">${thoat(chuCaiDau(ten))}</text></svg>`
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`
}
