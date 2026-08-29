import { createBrowserRouter, Navigate, Outlet } from 'react-router-dom';
import { useAuthStore } from '../store/useAuthStore';

// Layouts
import MainLayout from '../layouts/MainLayout';
import AuthLayout from '../layouts/AuthLayout';
import OwnerLayout from '../layouts/OwnerLayout';
import AdminLayout from '../layouts/AdminLayout';

// Auth Pages
import LoginPage from '../pages/LoginPage';
import RegisterPage from '../pages/RegisterPage';
import VerifyEmailPage from '../pages/VerifyEmailPage';

// Main Pages
import DiscoverPage from '../pages/DiscoverPage';
import SearchPage from '../pages/SearchPage';
import EventDetailPage from '../pages/events/EventDetailPage';
import LoungeDetailPage from '../pages/lounge/LoungeDetailPage';
import LivestreamViewerPage from '../pages/LivestreamViewerPage';
import MyShowsPage from '../pages/user/MyShowsPage';
import TicketDetailPage from '../pages/user/TicketDetailPage';
import AccountPage from '../pages/user/AccountPage';
import CheckoutPage from '../pages/user/CheckoutPage';
import PaymentResultPage from '../pages/user/PaymentResultPage';
import WishlistPage from '../pages/WishlistPage';

// Owner Pages
import OwnerDashboardPage from '../pages/owner/OwnerDashboardPage';
import LoungeFormPage from '../pages/owner/LoungeFormPage';
import LoungeManagerPage from '../pages/owner/LoungeManagerPage';
import OwnerLoungesPage from '../pages/owner/OwnerLoungesPage';
import ShowFormPage from '../pages/owner/ShowFormPage';
import ShowManagerPage from '../pages/owner/ShowManagerPage';
import OwnerShowsPage from '../pages/owner/OwnerShowsPage';
import OwnerLivestreamStudio from '../pages/owner/OwnerLivestreamStudio';
import VenueZoneEditorPage from '../pages/owner/VenueZoneEditorPage';
import OwnerSubscriptionPage from '../pages/owner/OwnerSubscriptionPage';
import OwnerRevenuePage from '../pages/owner/OwnerRevenuePage';

// Admin Pages
import AdminDashboard from '../pages/admin/AdminDashboard';
import AdminAccountsPage from '../pages/admin/AdminAccountsPage';
import AdminShowsPage from '../pages/admin/AdminShowsPage';
import AdminPackagesPage from '../pages/admin/AdminPackagesPage';
import AdminLedgerPage from '../pages/admin/AdminLedgerPage';
import AdminShowDetailPage from '../pages/admin/AdminShowDetailPage';
import AdminRefundsPage from '../pages/admin/AdminRefundsPage';

// Route Guards
const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, isTokenExpired } = useAuthStore();
  if (!isAuthenticated || isTokenExpired()) return <Navigate to="/login" replace />;
  return children || <Outlet />;
};

const OwnerRoute = () => {
  const { isAuthenticated, isTokenExpired, user } = useAuthStore();
  if (!isAuthenticated || isTokenExpired()) return <Navigate to="/login" replace />;
  if (user?.role !== 'Owner') return <Navigate to="/" replace />;
  return <Outlet />;
};

const AdminRoute = () => {
  const { isAuthenticated, isTokenExpired, user } = useAuthStore();
  if (!isAuthenticated || isTokenExpired()) return <Navigate to="/login" replace />;
  if (user?.role !== 'Admin') return <Navigate to="/" replace />;
  return <Outlet />;
};

const AuthRoute = () => {
  const { isAuthenticated, isTokenExpired } = useAuthStore();
  if (isAuthenticated && !isTokenExpired()) return <Navigate to="/" replace />;
  return <Outlet />;
};

const AppRouter = createBrowserRouter([
  {
    path: '/',
    element: <MainLayout />,
    children: [
      { index: true, element: <DiscoverPage /> },
      { path: 'search', element: <SearchPage /> },
      { path: 'shows/:id', element: <EventDetailPage /> },
      { path: 'shows/:id/checkout', element: <ProtectedRoute><CheckoutPage /></ProtectedRoute> },
      { path: 'payment-result', element: <ProtectedRoute><PaymentResultPage /></ProtectedRoute> },
      { path: 'shows/:id/live', element: <ProtectedRoute><LivestreamViewerPage /></ProtectedRoute> },
      { path: 'lounge/:id', element: <LoungeDetailPage /> },
      { path: 'my-shows', element: <ProtectedRoute><MyShowsPage /></ProtectedRoute> },
      { path: 'my-shows/ticket/:ticketId', element: <ProtectedRoute><TicketDetailPage /></ProtectedRoute> },
      { path: 'account', element: <ProtectedRoute><AccountPage /></ProtectedRoute> },
      { path: 'wishlist', element: <ProtectedRoute><WishlistPage /></ProtectedRoute> },
    ],
  },
  {
    element: <AuthLayout />,
    children: [
      {
        element: <AuthRoute />,
        children: [
          { path: '/login', element: <LoginPage /> },
          { path: '/register', element: <RegisterPage /> },
          { path: '/verify-email', element: <VerifyEmailPage /> },
        ]
      }
    ]
  },
  {
    path: '/owner',
    element: <OwnerLayout />,
    children: [
      {
        element: <OwnerRoute />,
        children: [
          { path: 'dashboard', element: <Navigate to="/owner/revenue" replace /> },
          { path: 'revenue', element: <OwnerRevenuePage /> },
          { path: 'subscriptions', element: <OwnerSubscriptionPage /> },
          { path: 'lounges', element: <OwnerLoungesPage /> },
          { path: 'lounges/create', element: <LoungeFormPage /> },
          { path: 'lounges/:id/edit', element: <LoungeFormPage /> },
          { path: 'lounges/:id', element: <LoungeManagerPage /> },
          { path: 'lounges/:id/zones', element: <VenueZoneEditorPage /> },
          { path: 'lounges/:loungeId/shows/create', element: <ShowFormPage /> },
          { path: 'shows', element: <OwnerShowsPage /> },
          { path: 'shows/:id', element: <ShowManagerPage /> },
          { path: 'shows/:id/studio', element: <OwnerLivestreamStudio /> },
          { path: 'shows/:id/edit', element: <ShowFormPage /> },
        ]
      }
    ]
  },
  {
    path: '/admin',
    element: <AdminLayout />,
    children: [
      {
        element: <AdminRoute />,
        children: [
          { path: 'dashboard', index: true, element: <AdminDashboard /> },
          { path: 'shows', element: <AdminShowsPage /> },
          { path: 'packages', element: <AdminPackagesPage /> },
          { path: 'shows/:id', element: <AdminShowDetailPage /> },
          { path: 'accounts', element: <AdminAccountsPage /> },
          { path: 'ledger', element: <AdminLedgerPage /> },
          { path: 'refunds', element: <AdminRefundsPage /> },
        ]
      }
    ]
  },
  {
    path: '*',
    element: <Navigate to="/" replace />
  }
]);

export default AppRouter;