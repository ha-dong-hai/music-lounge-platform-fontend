// src/routes/AppRouter.jsx
// MLACP-611: TÁCH MÃ THEO TRANG. Trước đây 60 trang được import tĩnh nên cả web nằm trong MỘT tệp JavaScript 3,27 MB
// (đo bằng bản build 04/10/2026): khán giả mở trang chủ, hay nhân viên mở trang soát vé bằng 4G, đều phải tải cả khu
// quản trị, biểu đồ và trình vẽ sơ đồ. Nay chỉ năm trang vào nhiều nhất của khán giả tải ngay; các trang còn lại dùng
// React.lazy — trình duyệt tải khi người dùng mở tới. Ranh giới chờ (Suspense) nằm ở GocUngDung (cả trang) và
// PortalShell (giữ thanh bên, chỉ vùng nội dung chờ).
import { lazy } from 'react'
import { createBrowserRouter, Navigate } from 'react-router-dom'
import MainLayout from '../layouts/MainLayout'

// Pages Public & Auth
import HomePage from '../pages/home/HomePage'
import ShowSearchPage from '../pages/home/ShowSearchPage'
import EventDetailPage from '../pages/events/EventDetailPage'
import ProtectedRoute from './ProtectedRoute'

import AdminLayout from '../layouts/AdminLayout'
import LoginPage from '../pages/auth/LoginPage'
import OwnerLayout from '../layouts/OwnerLayout'
import NotFoundPage from '../pages/NotFoundPage'
import TrangDauKhuPhongTra from './TrangDauKhuPhongTra'
import GocUngDung from './GocUngDung'

const AccountPage = lazy(() => import('../pages/user/AccountPage'))
const MyShowsPage = lazy(() => import('../pages/user/MyShowsPage'))
const AdminDashboard = lazy(() => import('../pages/admin/AdminDashboard'))
const AdminAccountsPage = lazy(() => import('../pages/admin/AdminAccountsPage'))
const AdminShowsPage = lazy(() => import('../pages/admin/AdminShowsPage'))
const AdminShowDetailPage = lazy(() => import('../pages/admin/AdminShowDetailPage'))
const AdminPackagesPage = lazy(() => import('../pages/admin/AdminPackagesPage'))
const AdminComplaintPage = lazy(() => import('../pages/admin/AdminComplaintPage'))
const AdminContentReportsPage = lazy(() => import('../pages/admin/AdminContentReportsPage'))
const AdminRefundsPage = lazy(() => import('../pages/admin/AdminRefundsPage'))
const AdminSettlementsPage = lazy(() => import('../pages/admin/AdminSettlementsPage'))
const LoungeDetailPage = lazy(() => import('../pages/lounge/LoungeDetailPage'))
const TicketDetailPage = lazy(() => import('../pages/user/TicketDetailPage'))
const LoungeListPage = lazy(() => import('../pages/lounge/LoungeListPage'))
const LivestreamWatchPage = lazy(() => import('../pages/livestream/LivestreamWatchPage'))
const AdminVenuesPage = lazy(() => import('../pages/admin/AdminVenuesPage'))
const AdminFilterOptionsPage = lazy(() => import('../pages/admin/AdminFilterOptionsPage'))
const AdminKycReviewsPage = lazy(() => import('../pages/admin/AdminKycReviewsPage'))
const AdminSystemConfigPage = lazy(() => import('../pages/admin/AdminSystemConfigPage'))
const AdminLedgerPage = lazy(() => import('../pages/admin/AdminLedgerPage'))
const AdminBankAccountsPage = lazy(() => import('../pages/admin/AdminBankAccountsPage'))
const AdminPenaltyAppealsPage = lazy(() => import('../pages/admin/AdminPenaltyAppealsPage'))
const AdminShowCancellationsPage = lazy(() => import('../pages/admin/AdminShowCancellationsPage'))
const PaymentResultPage = lazy(() => import('../pages/payment/PaymentResultPage'))
const RegisterPage = lazy(() => import('../pages/auth/RegisterPage'))
const VerifyEmailPage = lazy(() => import('../pages/auth/VerifyEmailPage'))
const ForgotPasswordPage = lazy(() => import('../pages/auth/ForgotPasswordPage'))
const ResetPasswordPage = lazy(() => import('../pages/auth/ResetPasswordPage'))
const OwnerLivestreamsPage = lazy(() => import('../pages/owner/OwnerLivestreamsPage'))
const OwnerSubscriptionPage = lazy(() => import('../pages/owner/OwnerSubscriptionPage'))
const OwnerAnalyticsPage = lazy(() => import('../pages/owner/OwnerAnalyticsPage'))
const OwnerFinancePage = lazy(() => import('../pages/owner/OwnerFinancePage'))
const OwnerLoungePage = lazy(() => import('../pages/owner/OwnerLoungePage'))
const OwnerBankAccountsPage = lazy(() => import('../pages/owner/OwnerBankAccountsPage'))
const OwnerZonesPage = lazy(() => import('../pages/owner/OwnerZonesPage'))
const OwnerShowSettingsPage = lazy(() => import('../pages/owner/OwnerShowSettingsPage'))
const OwnerTourPage = lazy(() => import('../pages/owner/OwnerTourPage'))
const OwnerOperatePage = lazy(() => import('../pages/owner/OwnerOperatePage'))
const OwnerFnbOrdersPage = lazy(() => import('../pages/owner/OwnerFnbOrdersPage'))
const OwnerFnbMenusPage = lazy(() => import('../pages/owner/OwnerFnbMenusPage'))
const OwnerStaffPage = lazy(() => import('../pages/owner/OwnerStaffPage'))
const OwnerPerformersPage = lazy(() => import('../pages/owner/OwnerPerformersPage'))
const OwnerDonationsPage = lazy(() => import('../pages/owner/OwnerDonationsPage'))
const OwnerPenaltiesPage = lazy(() => import('../pages/owner/OwnerPenaltiesPage'))
const ComplaintPage = lazy(() => import('../pages/user/ComplaintPage'))
const PerformerConfirmationPage = lazy(() => import('../pages/public/PerformerConfirmationPage'))
const PerformerDonationsPage = lazy(() => import('../pages/public/PerformerDonationsPage'))
const PerformerPage = lazy(() => import('../pages/public/PerformerPage'))
const TransparencyHubPage = lazy(() => import('../pages/public/TransparencyHubPage'))
const NotificationsPage = lazy(() => import('../pages/user/NotificationsPage'))
const OwnerShowsPage = lazy(() => import('../pages/owner/OwnerShowsPage'))
const OwnerShowDetailPage = lazy(() => import('../pages/owner/OwnerShowDetailPage'))
const FnbOrderPage = lazy(() => import('../pages/fnb/FnbOrderPage'))
const TrangVanBan = lazy(() => import('../pages/public/TrangVanBan'))

// MLACP-602: MỌI route nằm trong một route gốc không đường dẫn (GocUngDung) — nơi in <title> theo trang.
const AppRouter = createBrowserRouter([{ element: <GocUngDung />, children: [
  {
    path: '/',
    element: <MainLayout />,
    children: [
      { index: true, element: <HomePage /> },
      { path: 'shows', element: <ShowSearchPage /> },
      { path: 'shows/search', element: <ShowSearchPage /> },
      { path: 'shows/:id', element: <EventDetailPage /> },
      // Ba trang dưới chỉ có nghĩa khi đã đăng nhập: trước đây không bọc gì, khách mở vào thấy form
      // rỗng + toast "Không tải được…" vì API trả 401 (đo 30/09). Bọc ở router để khách sang /login kèm
      // state.from và đăng nhập xong quay lại đúng trang. /my-shows cố ý KHÔNG bọc: trang đó tự hiện
      // khung "Bạn cần đăng nhập" ngay trong trang, không gọi API khi chưa đăng nhập.
      { path: 'account', element: <ProtectedRoute><AccountPage /></ProtectedRoute> },
      { path: 'my-shows', element: <MyShowsPage /> },
      { path: 'notifications', element: <ProtectedRoute><NotificationsPage /></ProtectedRoute> },
      { path: 'my-shows/ticket/:ticketId', element: <ProtectedRoute><TicketDetailPage /></ProtectedRoute> },
      { path: 'lounges', element: <LoungeListPage /> },
      { path: 'lounge/:id', element: <LoungeDetailPage /> }, 
      { path: 'lounge/:id/order', element: <FnbOrderPage /> },
      // Cua cong khai cua cam ket minh bach tien ung ho. Dat TRONG MainLayout (co Header +
      // Footer) chu khong dung rieng nhu /performers/:id/donations, vi day la trang nguoi la
      // ghe vao tu chan trang — ho can dieu huong day du de di tiep.
      { path: 'minh-bach', element: <TransparencyHubPage /> },
      // MLACP-602: hai văn bản mà ô "Tôi đồng ý" ở trang Đăng ký dẫn tới (trước là /terms, /privacy — không có route).
      { path: 'dieu-khoan', element: <TrangVanBan loai="dieu-khoan" /> },
      { path: 'bao-mat', element: <TrangVanBan loai="bao-mat" /> },
      // 30/09/2026: ba trang công khai dưới đây trước đứng RIÊNG ngoài MainLayout — không có đầu trang, người vào từ
      // trang vé hay trang buổi diễn chỉ còn một đường ra là "Về trang chủ". Nay có Header + Footer như mọi trang khán giả.
      // Khách chưa đăng nhập vẫn gửi khiếu nại và xem sao kê ủng hộ được (không bọc ProtectedRoute).
      { path: 'complaints', element: <ComplaintPage /> },
      { path: 'performers/:performerId', element: <PerformerPage /> },
      { path: 'performers/:performerId/donations', element: <PerformerDonationsPage /> },
    ],
  },

  { path: '/livestream/:showId', element: <LivestreamWatchPage /> },

  // Nghe si mo tu lien ket email, KHONG co tai khoan — khong duoc doi dang nhap
  { path: '/performer-confirmation', element: <PerformerConfirmationPage /> },
  { path: '/login', element: <LoginPage /> },
  { path: '/register', element: <RegisterPage /> },
  { path: '/verify-email', element: <VerifyEmailPage /> },
  // LoginPage da link san toi /forgot-password; duong dan trong email tro toi
  // /reset-password?token=... (token o query string, khong phai path param).
  { path: '/forgot-password', element: <ForgotPasswordPage /> },
  { path: '/reset-password', element: <ResetPasswordPage /> },

  { path: '/payment/success', element: <PaymentResultPage status="success" /> },
  { path: '/payment/failed', element: <PaymentResultPage status="failed" /> },
  { path: '/payment/processing', element: <PaymentResultPage status="processing" /> },

  {
    path: '/owner',
    element: (
      // Chỉ livestream mới là RequireVenueOperator (Owner + Staff) ở backend, nên cổng ngoài
      // cho cả hai vào, còn từng trang bên trong tự siết theo đúng policy của API nó gọi.
      <ProtectedRoute requiredRoles={['Owner', 'Staff']}>
        <OwnerLayout />
      </ProtectedRoute>
    ),
    // CẢNH BÁO CHO NGƯỜI SỬA SAU: đừng gộp hết về một mức quyền ở cổng ngoài.
    // Trước đây cả khối này chỉ có một guard ['Owner','Staff'], trong khi 3/4 trang gọi
    // endpoint RequireOwner: /lounge-shows/mine, /ticket-tiers (POST/PUT/DELETE),
    // /analytics/my-lounge, /analytics/revenue-report, /subscriptions/my. Hậu quả là tài khoản
    // Staff đi qua được route rồi ăn 403 từ API — trang tải ra một lỗi chung, không ai hiểu
    // vì sao. Giữ mức quyền ở đây khớp với policy của backend.
    children: [
      { index: true, element: <TrangDauKhuPhongTra /> },
      { path: 'lounge', element: <ProtectedRoute requiredRoles={['Owner']}><OwnerLoungePage /></ProtectedRoute> },
      { path: 'bank-accounts', element: <ProtectedRoute requiredRoles={['Owner']}><OwnerBankAccountsPage /></ProtectedRoute> },
      { path: 'zones', element: <ProtectedRoute requiredRoles={['Owner']}><OwnerZonesPage /></ProtectedRoute> },
      { path: 'tour', element: <ProtectedRoute requiredRoles={['Owner']}><OwnerTourPage /></ProtectedRoute> },
      { path: 'shows', element: <ProtectedRoute requiredRoles={['Owner']}><OwnerShowsPage /></ProtectedRoute> },
      { path: 'shows/:id', element: <ProtectedRoute requiredRoles={['Owner']}><OwnerShowDetailPage /></ProtectedRoute> },
      { path: 'shows/:id/settings', element: <ProtectedRoute requiredRoles={['Owner']}><OwnerShowSettingsPage /></ProtectedRoute> },
      { path: 'livestreams', element: <OwnerLivestreamsPage /> },
      { path: 'operate', element: <OwnerOperatePage /> },
      { path: 'fnb-orders', element: <OwnerFnbOrdersPage /> },
      { path: 'fnb-menus', element: <ProtectedRoute requiredRoles={['Owner']}><OwnerFnbMenusPage /></ProtectedRoute> },
      { path: 'staff', element: <ProtectedRoute requiredRoles={['Owner']}><OwnerStaffPage /></ProtectedRoute> },
      { path: 'performers', element: <ProtectedRoute requiredRoles={['Owner']}><OwnerPerformersPage /></ProtectedRoute> },
      { path: 'donations', element: <ProtectedRoute requiredRoles={['Owner']}><OwnerDonationsPage /></ProtectedRoute> },
      { path: 'penalties', element: <ProtectedRoute requiredRoles={['Owner']}><OwnerPenaltiesPage /></ProtectedRoute> },
      { path: 'subscription', element: <ProtectedRoute requiredRoles={['Owner']}><OwnerSubscriptionPage /></ProtectedRoute> },
      { path: 'analytics', element: <ProtectedRoute requiredRoles={['Owner']}><OwnerAnalyticsPage /></ProtectedRoute> },
      { path: 'finance', element: <ProtectedRoute requiredRoles={['Owner']}><OwnerFinancePage /></ProtectedRoute> },
    ]
  },
  {
    path: '/admin',
    element: (
      // CHỈ CHO PHÉP ROLE 'Admin'
      <ProtectedRoute requiredRoles={['Admin']}>
        <AdminLayout />
      </ProtectedRoute>
    ),
    children: [
      { index: true, element: <AdminDashboard /> },
      { path: 'shows', element: <AdminShowsPage /> },
      { path: 'packages', element: <AdminPackagesPage /> },
      { path: 'shows/:id', element: <AdminShowDetailPage /> },
      { path: 'accounts', element: <AdminAccountsPage /> },
      { path: 'complaint', element: <AdminComplaintPage /> },
      { path: 'venues', element: <AdminVenuesPage /> },
      { path: 'filter-options', element: <AdminFilterOptionsPage /> },
      { path: 'kyc-reviews', element: <AdminKycReviewsPage /> },
      // MLACP-695: trang "Nội dung và tương tác" đã bỏ (chủ dự án 06/10: dư thừa); phần gợi ý AI chuyển thành tab trên
      // Tổng quan. Giữ đường cũ chuyển về Tổng quan để dấu trang/đường dẫn đã gửi không rơi vào trang 404.
      { path: 'insights', element: <Navigate to="/admin" replace /> },
      { path: 'system-config', element: <AdminSystemConfigPage /> },
      { path: 'ledger', element: <AdminLedgerPage /> },
      { path: 'bank-accounts', element: <AdminBankAccountsPage /> },
      { path: 'penalty-appeals', element: <AdminPenaltyAppealsPage /> },
      { path: 'show-cancellations', element: <AdminShowCancellationsPage /> },
      { path: 'content-reports', element: <AdminContentReportsPage /> },
      { path: 'refunds', element: <AdminRefundsPage /> },
      { path: 'settlements', element: <AdminSettlementsPage /> },
    ]
  },

  // Trang thử nghiệm nội bộ, CHỈ tồn tại khi chạy `vite` (dev) — bản build production loại bỏ hẳn dòng này
  // và cả trang, nên không lộ ra cho người dùng cuối. Xem pages/dev/Stage360Playground.jsx.
  ...(import.meta.env.DEV
    ? [
        { path: '/__dev/stage360', lazy: async () => ({ Component: (await import('../pages/dev/Stage360Playground')).default }) },
        // Thử TanStack Table 9 + Query trước khi dùng cho bảng thật (lỗi #6601) — xem pages/dev/ThuBangTanstack.jsx.
        { path: '/__dev/bang', lazy: async () => ({ Component: (await import('../pages/dev/ThuBangTanstack')).default }) },
      ]
    : []),

  // BẮT TẤT CẢ — phải nằm CUỐI CÙNG. Không có nó thì mọi URL sai ra trang trắng hoàn toàn:
  // không chữ, không nút, không cách đi tiếp ngoài nút Back. Người dùng sẽ nghĩ hệ thống hỏng
  // chứ không nghĩ mình gõ sai địa chỉ.
  { path: '*', element: <NotFoundPage /> },

] }])

export default AppRouter