// src/components/layouts/MainLayout.jsx
import { Outlet, useLocation } from 'react-router-dom'
import Header from './Header'
import Footer from './Footer'
import { useEffect, useState } from 'react'

const MainLayout = () => {
  const [searchQuery, setSearchQuery] = useState('')
  const location = useLocation()

  useEffect(() => {
    // Cuộn WINDOW (phần tử thực sự đang cuộn) — 'instant' cho cảm giác sang trang mới
    window.scrollTo({ top: 0, behavior: 'instant' })
  }, [location.pathname])

  return (
    <div className="min-h-screen bg-page flex-col font-sans text-ink">
      <Header searchQuery={searchQuery} setSearchQuery={setSearchQuery} />
      <main className="max-w-[1600px] mx-auto">
        <Outlet context={{ searchQuery }} />
      </main>
      <Footer />
    </div>
  )
}

export default MainLayout