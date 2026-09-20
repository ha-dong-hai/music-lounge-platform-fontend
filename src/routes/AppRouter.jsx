// src/routes/AppRouter.jsx
import { createBrowserRouter } from 'react-router-dom'
import MainLayout from '../layouts/MainLayout'

// Pages Public & Auth
import HomePage from '../pages/home/HomePage'
import ShowListPage from '../pages/home/ShowListPage'
import ShowSearchPage from '../pages/home/ShowSearchPage'
import AccountPage from '../pages/user/AccountPage'
import EventDetailPage from '../pages/events/EventDetailPage'
import MyShowsPage from '../pages/user/MyShowsPage'
import ProtectedRoute from './ProtectedRoute'

import AdminLayout from '../layouts/AdminLayout'
import AdminDashboard from '../pages/admin/AdminDashboard'
import AdminAccountsPage from '../pages/admin/AdminAccountsPage'
import AdminShowsPage from '../pages/admin/AdminShowsPage'
import AdminShowDetailPage from '../pages/admin/AdminShowDetailPage'
import AdminPackagesPage from '../pages/admin/AdminPackagesPage'
import AdminComplaintPage from '../pages/admin/AdminComplaintPage'
import AdminContentReportsPage from '../pages/admin/AdminContentReportsPage'
import AdminRefundsPage from '../pages/admin/AdminRefundsPage'
import AdminSettlementsPage from '../pages/admin/AdminSettlementsPage'
import LoungeDetailPage from '../pages/lounge/LoungeDetailPage'
import TicketDetailPage from '../pages/user/TicketDetailPage'
import LoungeListPage from '../pages/lounge/LoungeListPage'
import LivestreamWatchPage from '../pages/livestream/LivestreamWatchPage'
import RatingModal from '../components/livestream/RatingModal'
import AdminVenuesPage from '../pages/admin/AdminVenuesPage'
import AdminFilterOptionsPage from '../pages/admin/AdminFilterOptionsPage'
import AdminKycReviewsPage from '../pages/admin/AdminKycReviewsPage'
import AdminInsightsPage from '../pages/admin/AdminInsightsPage'
import AdminSystemConfigPage from '../pages/admin/AdminSystemConfigPage'
import AdminLedgerPage from '../pages/admin/AdminLedgerPage'
import PaymentResultPage from '../pages/payment/PaymentResultPage'
import LoginPage from '../pages/auth/LoginPage'
import RegisterPage from '../pages/auth/RegisterPage'
import VerifyEmailPage from '../pages/auth/VerifyEmailPage'
import OwnerLayout from '../layouts/OwnerLayout'
import OwnerLivestreamsPage from '../pages/owner/OwnerLivestreamsPage'
import OwnerSubscriptionPage from '../pages/owner/OwnerSubscriptionPage'
import OwnerAnalyticsPage from '../pages/owner/OwnerAnalyticsPage'
import OwnerLoungePage from '../pages/owner/OwnerLoungePage'
import OwnerBankAccountsPage from '../pages/owner/OwnerBankAccountsPage'
import OwnerZonesPage from '../pages/owner/OwnerZonesPage'
import OwnerShowSettingsPage from '../pages/owner/OwnerShowSettingsPage'
import OwnerTourPage from '../pages/owner/OwnerTourPage'
import OwnerOperatePage from '../pages/owner/OwnerOperatePage'
import OwnerFnbOrdersPage from '../pages/owner/OwnerFnbOrdersPage'
import OwnerFnbMenusPage from '../pages/owner/OwnerFnbMenusPage'
import OwnerStaffPage from '../pages/owner/OwnerStaffPage'
import OwnerPerformersPage from '../pages/owner/OwnerPerformersPage'
import OwnerDonationsPage from '../pages/owner/OwnerDonationsPage'
import OwnerPenaltiesPage from '../pages/owner/OwnerPenaltiesPage'
import ComplaintPage from '../pages/user/ComplaintPage'
import PerformerConfirmationPage from '../pages/public/PerformerConfirmationPage'
import PerformerDonationsPage from '../pages/public/PerformerDonationsPage'
import OwnerShowsPage from '../pages/owner/OwnerShowsPage'
import OwnerShowDetailPage from '../pages/owner/OwnerShowDetailPage'
import FnbOrderPage from '../pages/fnb/FnbOrderPage'

const AppRouter = createBrowserRouter([
  {
    path: '/',
    element: <MainLayout />,
    children: [
      { index: true, element: <HomePage /> },
      { path: 'shows', element: <ShowListPage /> },
      { path: 'shows/search', element: <ShowSearchPage /> },
      { path: 'shows/:id', element: <EventDetailPage /> },
      { path: 'account', element: <AccountPage /> },
      { path: 'my-shows', element: <MyShowsPage /> },
      { path: 'my-shows/ticket/:ticketId', element: <TicketDetailPage /> },
      { path: 'lounges', element: <LoungeListPage /> },
      { path: 'lounge/:id', element: <LoungeDetailPage /> }, 
      { path: 'lounge/:id/order', element: <FnbOrderPage /> },
      { path: 'rating', element: <RatingModal /> },
    ],
  },

  { path: '/livestream/:showId', element: <LivestreamWatchPage /> },

  // Trang cong khai: khach chua dang nhap cung gui khieu nai duoc
  { path: '/complaints', element: <ComplaintPage /> },
  // Nghe si mo tu lien ket email, KHONG co tai khoan — khong duoc doi dang nhap
  { path: '/performer-confirmation', element: <PerformerConfirmationPage /> },
  // Sao kê donate công khai — cố tình KHÔNG bọc ProtectedRoute: khán giả chưa đăng nhập phải xem được.
  { path: '/performers/:performerId/donations', element: <PerformerDonationsPage /> },
  { path: '/login', element: <LoginPage /> },
  { path: '/register', element: <RegisterPage /> },
  { path: '/verify-email', element: <VerifyEmailPage /> },

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
      { index: true, element: <OwnerLivestreamsPage /> },
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
      { path: 'insights', element: <AdminInsightsPage /> },
      { path: 'system-config', element: <AdminSystemConfigPage /> },
      { path: 'ledger', element: <AdminLedgerPage /> },
      { path: 'content-reports', element: <AdminContentReportsPage /> },
      { path: 'refunds', element: <AdminRefundsPage /> },
      { path: 'settlements', element: <AdminSettlementsPage /> },
    ]
  }

])

export default AppRouter