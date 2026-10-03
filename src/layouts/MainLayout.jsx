// src/components/layouts/MainLayout.jsx
import { Outlet } from 'react-router-dom'
import Header from './Header'
import { useState } from 'react'
import Footer from './Footer'
import dayjs from 'dayjs'
import { useTranslation } from 'react-i18next'

const MainLayout = () => {
  // Rời khu chủ phòng trà / admin (luôn tiếng Việt) về trang khách: đặt lại locale ngày theo ngôn ngữ đã chọn NGAY lúc vẽ —
  // cleanup của vùng tiếng Việt chạy SAU khi trang này đã vẽ (xem src/i18n/VungTiengViet.jsx).
  const { i18n } = useTranslation()
  dayjs.locale(i18n.language === 'en' ? 'en' : 'vi')


  const [searchQuery, setSearchQuery] = useState('')

  return (
    <div className="min-h-screen flex flex-col bg-page font-sans text-ink">
      <Header searchQuery={searchQuery} setSearchQuery={setSearchQuery}/>
      {/* Outlet là nơi HomePage sẽ hiện ra */}
      <main className="max-w-[1600px] w-full mx-auto flex-1">
        <Outlet context={{ searchQuery }} />
      </main>
      <Footer />
    </div>
  )
}

export default MainLayout