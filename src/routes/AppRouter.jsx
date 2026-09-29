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
import LoungeDetailPage from '../pages/lounge/LoungeDetailPage'
import TicketDetailPage from '../pages/user/TicketDetailPage'
import LoungeListPage from '../pages/lounge/LoungeListPage'
import LivestreamWatchPage from '../pages/livestream/LivestreamWatchPage'
import RatingModal from '../components/livestream/RatingModal'
import AdminVenuesPage from '../pages/admin/AdminVenuesPage'
import AdminFilterOptionsPage from '../pages/admin/AdminFilterOptionsPage'
import AdminBankAccountsPage from '../pages/admin/AdminBankAccountsPage'
import NotFoundPage from '../pages/NotFoundPage'
import ComplaintPage from '../pages/user/ComplaintPage'
import FnbOrderPage from '../pages/fnb/FnbOrderPage'
import PaymentResultPage from '../pages/payment/PaymentResultPage'
import NotificationsPage from '../pages/user/NotificationsPage'
import LoginPage from '../pages/auth/LoginPage'
import AdminInsightsPage from '../pages/admin/AdminInsightsPage'
import AdminKycReviewsPage from '../pages/admin/AdminKycReviewsPage'

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
      { path: 'notifications', element: <NotificationsPage /> },
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

  { path: '/login', element: <LoginPage /> },

  { path: '/payment/success', element: <PaymentResultPage status="success" /> },
  { path: '/payment/failed', element: <PaymentResultPage status="failed" /> },
  { path: '/payment/processing', element: <PaymentResultPage status="processing" /> },

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
      { path: 'bank-accounts', element: <AdminBankAccountsPage /> },
    ]
  },

  { path: '*', element: <NotFoundPage /> },

])

export default AppRouter