// src/components/layouts/MainLayout.jsx
import { Outlet } from 'react-router-dom'
import Header from './Header'
import { useState } from 'react'
import Footer from './Footer'
import OwnerLayout from './OwnerLayout'

const MainLayout = () => {

  const [searchQuery, setSearchQuery] = useState('')

  return (
    <div className="min-h-screen bg-black font-sans text-white">
      <Header searchQuery={searchQuery} setSearchQuery={setSearchQuery}/>
      {/* Outlet là nơi HomePage sẽ hiện ra */}
      <main className="max-w-[1600px] mx-auto">
        <Outlet context={{ searchQuery }} />
      </main>
      <Footer />
    </div>
  )
}

export default MainLayout