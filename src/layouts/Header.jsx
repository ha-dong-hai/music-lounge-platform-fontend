// src/components/layouts/Header.jsx
import { Search, User, ChevronDown, LogOut, Ticket, Settings, X } from 'lucide-react'
import { useState } from 'react'
import { Link } from 'react-router-dom'

const Header = ({ searchQuery, setSearchQuery }) => {
  const [user, setUser] = useState(() => {
    const savedUser = localStorage.getItem('user');
    return savedUser ? JSON.parse(savedUser) : null;
  });

  const [localSearch, setLocalSearch] = useState(searchQuery || '')

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
    setIsUserMenuOpen(false);
  }

  const handleSearchSubmit = (e) => {
    e.preventDefault()
    setSearchQuery(localSearch) // Chỉ cập nhật state global khi bấm submit
  }

  const handleMockLogin = () => {
    const mockToken = "fake-jwt-token-123456789";
    // ⭐ QUAN TRỌNG: Phải có field role
    const mockUserData = {
      name: "Nguyễn Văn A",
      email: "nguyenvana@email.com",
    }
    localStorage.setItem('token', mockToken);
    localStorage.setItem('user', JSON.stringify(mockUserData));
    setUser(mockUserData);
    ;

  }

  const [isLangOpen, setIsLangOpen] = useState(false)
  const [currentLang, setCurrentLang] = useState('VN')
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false)

  const handleSelectLang = (lang) => {
    setCurrentLang(lang)
    setIsLangOpen(false)
  }

  return (
    <header className="sticky top-0 z-50 w-full bg-black border-b border-[#C3B665]/30 px-6 py-4 shadow">

      {/* ⭐ THAY ĐỔI: Chia làm 2 khối chính: Trái (Logo + Search) và Phải (Actions) */}
      <div className="flex items-center justify-between gap-8">

        {/* === KHỐI TRÁI === */}
        <div className="flex items-center gap-35 flex-1 min-w-0">
          <Link to="/" className="text-3xl font-bold tracking-tight text-[#C3B665] whitespace-nowrap cursor-pointer flex-shrink-0">
            LOGO
          </Link>

          {/* Thanh Search giờ nằm ngay bên phải Logo */}
          <form onSubmit={handleSearchSubmit} className="relative w-full max-w-md hidden md:block">
            <button type="submit" className="absolute left-3 top-1/2 -translate-y-1/2 text-[#C3B665] cursor-pointer" aria-label="Search">
              <Search size={18} strokeWidth={2.5}/>
            </button>
            <input
              type="text"
              value={localSearch}
              onChange={e => setLocalSearch(e.target.value)}
              placeholder= "What would you like to search today"
              className="w-full pl-10 pr-10 py-2.5 bg-gray-800 text-white placeholder:text-gray-400 
              rounded-full text-sm focus:outline-none focus:ring-2 focus:ring-[#C3B665] transition-all"
            />
            {localSearch && (
              <button 
              type="button" 
              onClick={() => {setLocalSearch(''); setSearchQuery('') }} 
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white">
                <X size={18} />
              </button>
            )}
          </form>
        </div>

        {/* === KHỐI PHẢI (Actions) === */}
        <div className="flex items-center gap-4 flex-shrink-0">

          <Link to="/my-shows" className="bg-transparent hover:bg-[#C3B665] hover:text-black text-[#C3B665] border border-[#C3B665] px-5 py-2 rounded-full text-sm font-medium transition-colors hidden sm:block">
            My Shows
          </Link>

          {/* CHƯA ĐĂNG NHẬP */}
          {!user && (
            <div className="flex items-center gap-1">
              <button onClick={handleMockLogin}
                className="text-sm font-medium text-gray-200 hover:text-white px-3 py-2 rounded-xl border border-transparent hover:bg-gray-800 transition-all">
                Login
              </button>
              {/* to="/login" */}
              <div className='text-white'>
                <h1> | </h1>
              </div>

              <Link to="/register" className="bg-black text-white px-3 py-2 rounded-xl text-sm font-medium hover:bg-gray-800 transition-colors">
                Register
              </Link>
            </div>
          )}

          {/* ĐÃ ĐĂNG NHẬP */}
          {user && (
            <div className="relative">
              <button onClick={() => setIsUserMenuOpen(!isUserMenuOpen)} className="flex items-center gap-2 hover:text-white transition-colors focus:outline-none">
                <div className="w-9 h-9 rounded-full bg-black text-white flex items-center justify-center"><User size={20} /></div>
                <span className="font-medium text-white text-sm hidden lg:inline">{user.name}</span>
                <ChevronDown size={14} className={`hidden lg:block transition-transform duration-200 ${isUserMenuOpen ? 'rotate-180' : ''}`} />
              </button>

              {isUserMenuOpen && (
                <div className="absolute right-0 top-full mt-3 w-56 bg-[#1a1a1a] rounded-xl shadow-lg border border-[#C3B665]/20 py-2 z-50 animate-in fade-in slide-in-from-top-2">
                  <div className="px-4 py-2 border-b border-gray-700 mb-1">
                    <p className="text-xs text-gray-400">Hello,</p>
                    <p className="text-sm font-semibold text-white truncate">{user.email}</p>
                  </div>
                  <button className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-gray-300 
                  hover:bg-gray-800 hover:text-white transition-colors text-left">
                    <Settings size={18} className="text-[#C3B665]" />
                    Account info
                  </button>

                  <Link to="/my-shows" className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-gray-500 hover:bg-gray-800 transition-colors text-left"><Ticket size={18} className="text-gray-500" />My Shows</Link>
                  <div className="my-1 border-t border-gray-100"></div>
                  <button onClick={handleLogout} className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-colors text-left font-medium"><LogOut size={18} />Log out</button>
                </div>
              )}
            </div>
          )}

          {/* Ngôn ngữ */}
          <div className="relative">
            <button onClick={() => setIsLangOpen(!isLangOpen)} className="flex items-center gap-1 text-white hover:text-[#C3B665] focus:outline-none">
              <span className="text-xl">{currentLang === "VN" ? "VN" : "ENG"}</span>
              <ChevronDown size={14} className={`transition-transform duration-200 ${isLangOpen ? 'rotate-180' : ''}`} />
            </button>
            {isLangOpen && (
              <div className="absolute right-0 top-full mt-3 w-40 bg-[#1a1a1a] rounded-xl shadow-lg border border-[#C3B665]/20 py-2 z-50">
                <button onClick={() => handleSelectLang('VN')} className={`w-full px-4 py-2 text-sm text-left hover:bg-gray-800 ${currentLang === 'VN' ? 'font-bold text-[#C3B665]' : 'text-gray-300'}`}>Tiếng Việt</button>
                <button onClick={() => handleSelectLang('ENG')} className={`w-full px-4 py-2 text-sm text-left hover:bg-gray-800 ${currentLang === 'ENG' ? 'font-bold text-[#C3B665]' : 'text-gray-300'}`}>English</button>
              </div>
            )}
          </div>
        </div>
      </div>

      {(isLangOpen || isUserMenuOpen) && <div className=" inset-0 z-40" onClick={() => { setIsLangOpen(false); setIsUserMenuOpen(false) }} />}
    </header>
  )
}

export default Header