// src/utils/authRedirect.js
//
// Quyết định đưa người dùng đi đâu sau khi đăng nhập. Tách khỏi hooks/useAuth.js để KIỂM THỬ ĐƯỢC:
// useAuth kéo theo firebase + react-router nên không chạy thẳng bằng node, còn hai hàm dưới đây là
// hàm thuần. Xem src/utils/authRedirect.test.mjs.
//
// Bốn vai đăng nhập của hệ thống: Audience, Staff, Owner, Admin. Performer KHÔNG có tài khoản.

// Đích mặc định của mỗi vai, khớp đúng guard trong routes/AppRouter.jsx:
//   - Admin -> /admin  (requiredRoles={['Admin']}, AppRouter.jsx:151)
//   - Owner -> /owner  (requiredRoles={['Owner','Staff']}, AppRouter.jsx:114)
//   - Staff -> /owner  (cùng cổng trên, và cùng chỗ mà liên kết "Khu vực phòng trà" ở
//                       Header.jsx:294-301 dẫn tới, để hai lối vào không lệch nhau)
// Vai nào không có trong bảng (Audience, hoặc vai lạ backend thêm sau) thì về trang chủ.
export const DICH_THEO_VAI = {
  Admin: '/admin',
  Owner: '/owner',
  Staff: '/owner',
};

export const destinationForRole = (role) => DICH_THEO_VAI[role] ?? '/';

// Chỉ chấp nhận đường dẫn NỘI BỘ. Chặn `//evil.com` (giao thức tương đối) và mọi URL tuyệt đối —
// nếu không, một liên kết dạng /login với state dựng sẵn có thể biến trang đăng nhập thành bàn đạp
// chuyển hướng ra ngoài.
export const duongDanNoiBoHopLe = (p) =>
  typeof p === 'string' && p.startsWith('/') && !p.startsWith('//');

// Khu vực có giới hạn vai, lấy đúng theo guard trong routes/AppRouter.jsx:
//   - `/admin…`  requiredRoles={['Admin']}
//   - `/owner…`  requiredRoles={['Owner','Staff']} ở cổng ngoài, NHƯNG phần lớn trang con tự siết lại chỉ cho Owner.
// Mọi đường dẫn khác: ai đăng nhập cũng vào được.
//
// MLACP-687 (chủ dự án 06/10/2026: "đăng nhập staff thì vào trang quản lý staff của owner" → trang 403): bảng cũ chỉ có hai
// khu thô, coi CẢ khu /owner là Staff vào được. Chủ phòng trà đang ở /owner/staff thì đăng xuất → trang bị chặn đẩy ra
// /login kèm from=/owner/staff → nhân viên đăng nhập → hàm này trả lại /owner/staff → 403. Nay liệt kê đủ các trang con
// chỉ-Owner; khớp theo TIỀN TỐ DÀI NHẤT nên /owner/staff thắng /owner. Bảng này phải khớp router — authRedirect.test.mjs
// đọc thẳng AppRouter.jsx và đỏ ngay khi router thêm một trang chỉ-Owner mà bảng chưa có.
export const TRANG_CHI_CHU_PHONG_TRA = [
  'lounge', 'bank-accounts', 'zones', 'tour', 'shows', 'fnb-menus', 'staff', 'performers',
  'donations', 'penalties', 'subscription', 'analytics', 'finance',
];
const KHU_VUC_THEO_VAI = [
  { tien_to: '/admin', vai: ['Admin'] },
  { tien_to: '/owner', vai: ['Owner', 'Staff'] },
  ...TRANG_CHI_CHU_PHONG_TRA.map((p) => ({ tien_to: `/owner/${p}`, vai: ['Owner'] })),
];

// `path` có vừa với `tien_to` không — so theo RANH GIỚI ĐOẠN đường dẫn, không so tiền tố trần.
// Nếu so tiền tố trần thì `/ownership` cũng bị tính là thuộc khu `/owner`.
const thuocKhu = (path, tien_to) => path === tien_to || path.startsWith(`${tien_to}/`);

export const vaiVaoDuoc = (role, path) => {
  if (!duongDanNoiBoHopLe(path)) return false;
  // Bỏ query string trước khi so khu vực: `/admin?x=1` vẫn là khu admin.
  const chiDuongDan = path.split('?')[0];
  // Tiền tố DÀI NHẤT thắng: /owner/staff (chỉ Owner) phải thắng /owner (Owner + Staff).
  const khu = KHU_VUC_THEO_VAI
    .filter((k) => thuocKhu(chiDuongDan, k.tien_to))
    .sort((a, b) => b.tien_to.length - a.tien_to.length)[0];
  return khu ? khu.vai.includes(role) : true;
};

// Sau khi đăng nhập: ưu tiên quay lại đúng trang người dùng bị chặn giữa chừng (ProtectedRoute gửi
// kèm `state.from`); không có, không hợp lệ, HOẶC vai này không vào được chỗ đó → về đích của vai.
//
// LỖI ĐÃ SỬA: bản đầu của hàm này trả `from` mà không hỏi vai có vào được không. Hậu quả thật:
// người mở `/owner/shows/12/settings` khi chưa đăng nhập bị đẩy ra `/login` kèm `from`, rồi đăng
// nhập bằng tài khoản ADMIN — hàm trả lại `/owner/shows/12/settings`, ProtectedRoute của khu
// `/owner` chỉ nhận Owner/Staff nên chặn Admin và ném về `/`. Admin đăng nhập xong nằm ở trang chủ
// thay vì khu quản trị. Bản vá: `from` chỉ được dùng khi vai đó thật sự vào được.
export const dichSauDangNhap = (role, from) =>
  duongDanNoiBoHopLe(from) && vaiVaoDuoc(role, from) ? from : destinationForRole(role);
