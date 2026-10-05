// src/layouts/OwnerLayout.jsx
//
// KHU LÀM VIỆC CỦA CHỦ PHÒNG TRÀ VÀ NHÂN VIÊN. Khung (thanh bên, ngăn kéo cho điện thoại, đầu trang) nằm ở
// components/portal/PortalShell.jsx, dùng chung với AdminLayout. Ở đây chỉ còn DỮ LIỆU MENU và đăng xuất.
//
// GOM NHÓM (30/09/2026): 15 mục phẳng → 4 nhóm theo việc người vận hành đang làm: dựng phòng trà, chạy đêm diễn,
// tiền, tuân thủ. Thứ tự trong nhóm giữ như cũ.
//
// TÁCH QUẦY KHỎI QUẢN LÝ (MLACP-590, 04/10/2026): soát vé, bán vé tại quầy, đơn gọi món là việc của NHÂN VIÊN trong
// đêm diễn; chủ phòng trà là người quản lý. Trước đây các mục đó nằm ngang hàng trong thực đơn của chủ, trông như chủ
// phải tự quét mã từng khách. Nay với CHỦ có hai chế độ, suy ra từ đường dẫn (utils/khuQuay.js):
//  - Khu quản lý: không còn mục đứng quầy; có một lối "Vào quầy đêm diễn".
//  - Quầy đêm diễn: thực đơn rút gọn như nhân viên thấy, kèm lối "Về khu quản lý".
// QUYỀN KHÔNG ĐỔI: chủ vẫn làm được mọi việc của quầy (phòng nhỏ thì chủ hay đứng thay). Tham chiếu: Eventbrite tách
// vai "Check-in attendees" khỏi Owner/Admin nhưng Owner/Admin vẫn toàn quyền (help article 509534).
//
// Nhân viên (Staff) chỉ thấy các mục RequireVenueOperator (vận hành đêm diễn, đơn gọi món, livestream). Mục nào gọi
// endpoint RequireOwner thì ẩn với Staff — phải khớp guard từng route trong AppRouter.jsx.
// Chỉ thêm mục khi trang đã thật sự tồn tại, tránh link chết.
import { Outlet, useLocation, useNavigate } from 'react-router-dom'
import { Radio, LogOut, Package, BarChart3, CalendarDays, Store, Landmark, ScanLine, UtensilsCrossed, BookOpen, Mic2, Users, HeartHandshake, ShieldAlert, LayoutGrid, Box, Wallet, ShieldCheck, ExternalLink, ArrowLeft } from 'lucide-react'
import { useAuthStore } from '../store/useAuthStore'
import PortalShell from '../components/portal/PortalShell'
import NotificationBell from '../components/notifications/NotificationBell'
import { laDuongQuay } from '../utils/khuQuay'

// Nhân viên dùng được: soát vé, bán vé quầy, bắt đầu/kết thúc đều là RequireVenueOperator
const MUC_QUAY = [
  { to: '/owner/operate', nhan: 'Vận hành đêm diễn', icon: ScanLine },
  { to: '/owner/fnb-orders', nhan: 'Đơn gọi món', icon: UtensilsCrossed },
]
const MUC_PHAT = { to: '/owner/livestreams', nhan: 'Phát trực tuyến', icon: Radio }

const NHOM_QUAN_LY = [
  { ten: 'Phòng trà', muc: [
    { to: '/owner/lounge', nhan: 'Hồ sơ phòng trà', icon: Store },
    { to: '/owner/zones', nhan: 'Khu vực chỗ ngồi', icon: LayoutGrid },
    { to: '/owner/tour', nhan: 'Tham quan 360°', icon: Box },
    { to: '/owner/performers', nhan: 'Nghệ sĩ', icon: Mic2 },
    { to: '/owner/staff', nhan: 'Nhân viên', icon: Users },
    { to: '/owner/fnb-menus', nhan: 'Thực đơn', icon: BookOpen },
  ] },
  // Phát trực tuyến ở lại khu quản lý: chủ tạo phiên phát và khai VCPMC ở đó trước khi gửi duyệt buổi diễn.
  { ten: 'Đêm diễn', muc: [{ to: '/owner/shows', nhan: 'Buổi diễn', icon: CalendarDays }, MUC_PHAT] },
  { ten: 'Tiền', muc: [
    { to: '/owner/finance', nhan: 'Tiền và quyết toán', icon: Wallet },
    { to: '/owner/analytics', nhan: 'Báo cáo doanh thu', icon: BarChart3 },
    { to: '/owner/donations', nhan: 'Tiền ủng hộ nghệ sĩ', icon: HeartHandshake },
    { to: '/owner/bank-accounts', nhan: 'Tài khoản nhận tiền', icon: Landmark },
    { to: '/owner/subscription', nhan: 'Gói dịch vụ', icon: Package },
  ] },
  { ten: 'Tuân thủ', muc: [{ to: '/owner/penalties', nhan: 'Án phạt', icon: ShieldAlert }] },
]

// HAI LỐI RA, cho cả nhân viên:
// - Định danh: với chủ phòng trà, XÁC MINH DANH TÍNH là cửa bắt buộc để bán vé (MLACP-397) mà lại nằm ở trang tài
//   khoản chung — không có lối này thì bị chặn lúc bán vé mà không biết đi đâu mở khoá.
// - Trang công khai: để chủ phòng trà xem trang của mình hiện ra sao với khách.
const LOI_RA_CHUNG = [
  { to: '/account?tab=identity', nhan: 'Định danh và tài khoản', icon: ShieldCheck },
  { to: '/', nhan: 'Về trang công khai', icon: ExternalLink },
]

const OwnerLayout = () => {
  const navigate = useNavigate()
  const { pathname } = useLocation()
  const logout = useAuthStore((s) => s.logout)
  const isOwner = useAuthStore((s) => s.user?.role) === 'Owner'

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  let portalName, nhom, loiRa
  if (!isOwner) {
    portalName = 'Nhân viên phòng trà'
    nhom = [{ ten: 'Đêm diễn', muc: [...MUC_QUAY, MUC_PHAT] }]
    // Nhân viên không có mục Định danh và thuế (utils/mucTaiKhoan.js) — lối ra dẫn tới tài khoản chung.
    loiRa = [{ to: '/account', nhan: 'Tài khoản của tôi', icon: ShieldCheck }, LOI_RA_CHUNG[1]]
  } else if (laDuongQuay(pathname)) {
    portalName = 'Quầy đêm diễn'
    nhom = [{ ten: 'Việc tại quầy', muc: MUC_QUAY }]
    loiRa = [{ to: '/owner/shows', nhan: 'Về khu quản lý', icon: ArrowLeft }]
  } else {
    portalName = 'Phòng trà của tôi'
    nhom = NHOM_QUAN_LY
    loiRa = [{ to: '/owner/operate', nhan: 'Vào quầy đêm diễn', icon: ScanLine }, ...LOI_RA_CHUNG]
  }

  const footer = (
    <button type="button" onClick={handleLogout}
      className="flex items-center gap-3 px-3 min-h-[44px] w-full text-sm font-medium text-lamp-mute hover:text-lamp hover:bg-board-soft transition-colors">
      <LogOut size={18} aria-hidden="true" /> Đăng xuất
    </button>
  )

  return (
    // MLACP-669: khu chủ phòng trà/nhân viên trước đây KHÔNG có chuông — thông báo "tài khoản nhận tiền bị từ chối", "buổi
    // diễn được duyệt"… chỉ đọc được nếu tự mở /notifications. Chuông tự cập nhật qua kênh thời gian thực.
    <PortalShell portalName={portalName} nhom={nhom} loiRa={loiRa} footer={footer} headerRight={<NotificationBell />}>
      <Outlet />
    </PortalShell>
  )
}

export default OwnerLayout
