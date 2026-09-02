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
      { path: 'lounge/:id', element: <LoungeDetailPage /> }, 
    ],
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
    ]
  }

])

export default AppRouter