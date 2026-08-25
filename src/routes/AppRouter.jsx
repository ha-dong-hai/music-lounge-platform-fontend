// src/routes/AppRouter.jsx
import { createBrowserRouter } from 'react-router-dom'
import MainLayout from '../layouts/MainLayout'

// Pages Public & Auth
import HomePage from '../pages/home/HomePage'
import ShowListPage from '../pages/home/ShowListPage'
import ShowSearchPage from '../pages/home/ShowSearchPage'
import AccountPage from '../pages/user/AccountPage'

const AppRouter = createBrowserRouter([
  {
    path: '/',
    element: <MainLayout />,
    children: [
      { index: true, element: <HomePage /> },
      { path: 'shows', element: <ShowListPage /> },
      { path: 'shows/search', element: <ShowSearchPage /> },
      { path: 'account', element: <AccountPage /> },
    ],
  },


])

export default AppRouter