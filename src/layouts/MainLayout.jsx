// src/components/layouts/MainLayout.jsx
import { Outlet } from 'react-router-dom'
import Header from './Header'
import { useState } from 'react'
import Footer from './Footer'

const MainLayout = () => {

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