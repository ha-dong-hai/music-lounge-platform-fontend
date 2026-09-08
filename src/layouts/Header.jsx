import { Search, User, ChevronDown, LogOut, Ticket, Settings, X, Languages, Check } from 'lucide-react'
import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom' 
import { useAuthStore } from '../store/useAuthStore'
import toast from 'react-hot-toast'

// ⭐ BỎ PROPS searchQuery, setSearchQuery ĐI
const Header = () => {
  const { user, logout } = useAuthStore()
  const navigate = useNavigate() //
  
  const [localSearch, setLocalSearch] = useState('')
  const [isLangOpen, setIsLangOpen] = useState(false)
  const [currentLang, setCurrentLang] = useState(localStorage.getItem('lang') || 'vi')
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false)

  const handleLogout = () => {
    logout()
    setIsUserMenuOpen(false)
    toast.success('Đã đăng xuất')
  }

  // ÀM SUBMIT TÌM KIẾM SẼ CHUYỂN TRANG
  const handleSearchSubmit = (e) => {
    e.preventDefault()
    if (localSearch.trim()) {
      navigate(`/shows/search?keyword=${encodeURIComponent(localSearch.trim())}`)
    }
  }

  const handleChangeLang = (lang) => {
    setCurrentLang(lang)
    localStorage.setItem('lang', lang)
    setIsLangOpen(false)
    toast.success(lang === 'vi' ? 'Đã chuyển sang Tiếng Việt' : 'Switched to English')
  }

  return (
    <header className="sticky top-0 z-50 w-full bg-black border-b border-[#C3B665]/30 px-6 py-4 shadow">
      <div className="flex items-center justify-between gap-8">
        <div className="flex items-center gap-8 flex-1 min-w-0">
          <Link to="/" className="text-3xl font-bold tracking-tight text-[#C3B665] whitespace-nowrap cursor-pointer flex-shrink-0">
            LOGO
          </Link>

          <form onSubmit={handleSearchSubmit} className="relative w-full max-w-md hidden md:block">
            <button type="submit" className="absolute left-3 top-1/2 -translate-y-1/2 text-[#C3B665] cursor-pointer" aria-label="Search">
              <Search size={18} strokeWidth={2.5}/>
            </button>
            <input
              type="text"
              value={localSearch}
              onChange={e => setLocalSearch(e.target.value)}
              placeholder="What would you like to search today"
              className="w-full pl-10 pr-10 py-2.5 bg-gray-800 text-white placeholder:text-gray-400 rounded-full text-sm focus:outline-none focus:ring-2 focus:ring-[#C3B665] transition-all"
            />
            {localSearch && (
              <button type="button" onClick={() => setLocalSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white">
                <X size={18} />
              </button>
            )}
          </form>
        </div>

        <div className="flex items-center gap-4 flex-shrink-0">
          <Link to="/my-shows" className="bg-transparent hover:bg-[#C3B665] hover:text-black text-[#C3B665] border border-[#C3B665] px-5 py-2 rounded-full text-sm font-medium transition-colors hidden sm:block">
            My Shows
          </Link>

          {!user ? (
            <div className="flex items-center gap-2">
              <Link to="/login" className="text-sm font-medium text-gray-200 hover:text-white px-3 py-2 rounded-xl border border-transparent hover:bg-gray-800 transition-all">Login</Link>
              <Link to="/register" className="bg-black text-white px-3 py-2 rounded-xl text-sm font-medium hover:bg-gray-800 transition-colors">Register</Link>
            </div>
          ) : (
            <div className="relative">
              <button onClick={() => setIsUserMenuOpen(!isUserMenuOpen)} className="flex items-center gap-2 hover:text-white transition-colors focus:outline-none">
                {user.avatarUrl ? (
                  <img src={user.avatarUrl} alt="avatar" className="w-9 h-9 rounded-full object-cover border border-[#C3B665]" />
                ) : (
                  <div className="w-9 h-9 rounded-full bg-black text-white flex items-center justify-center border border-[#C3B665]/30">
                    <User size={20} />
                  </div>
                )}
                <span className="font-medium text-white text-sm hidden lg:inline">{user.name}</span>
                <ChevronDown size={14} className={`hidden lg:block transition-transform duration-200 ${isUserMenuOpen ? 'rotate-180' : ''}`} />
              </button>
              {isUserMenuOpen && (
                <div className="absolute right-0 top-full mt-3 w-56 bg-[#1a1a1a] rounded-xl shadow-lg border border-[#C3B665]/20 py-2 z-50 animate-in fade-in slide-in-from-top-2">
                  <div className="px-4 py-2 border-b border-gray-700 mb-1">
                    <p className="text-xs text-gray-400">Hello,</p>
                    <p className="text-sm font-semibold text-white truncate">{user.email}</p>
                  </div>
                  <Link to="/account" className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-gray-300 hover:bg-gray-800 hover:text-white transition-colors text-left">
                    <Settings size={18} className="text-[#C3B665]" /> Account info
                  </Link>
                  <Link to="/my-shows" className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-gray-300 hover:bg-gray-800 transition-colors text-left">
                    <Ticket size={18} className="text-[#C3B665]" /> My Shows
                  </Link>
                  <div className="my-1 border-t border-gray-700"></div>
                  <button onClick={handleLogout} className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-red-500 hover:bg-red-500/10 transition-colors text-left font-medium">
                    <LogOut size={18} /> Log out
                  </button>
                </div>
              )}
            </div>
          )}

          <div className="relative">
            <button onClick={() => setIsLangOpen(!isLangOpen)} className="flex items-center gap-1.5 px-3 py-2 rounded-full border border-gray-700 hover:border-[#C3B665] text-sm font-medium text-gray-300 hover:text-[#C3B665] transition-colors">
              <Languages size={16} />
              <span>{currentLang === 'vi' ? 'VN' : 'EN'}</span>
              <ChevronDown size={14} className={`transition-transform duration-200 ${isLangOpen ? 'rotate-180' : ''}`} />
            </button>
            {isLangOpen && (
              <div className="absolute right-0 top-full mt-3 w-44 bg-[#1a1a1a] rounded-xl shadow-lg border border-[#C3B665]/20 py-2 z-50 animate-in fade-in slide-in-from-top-2">
                <button onClick={() => handleChangeLang('vi')} className={`w-full flex items-center justify-between px-4 py-2.5 text-sm transition-colors ${currentLang === 'vi' ? 'text-[#C3B665] bg-gray-800/50' : 'text-gray-300 hover:bg-gray-800 hover:text-white'}`}>
                  Tiếng Việt {currentLang === 'vi' && <Check size={14} />}
                </button>
                <button onClick={() => handleChangeLang('en')} className={`w-full flex items-center justify-between px-4 py-2.5 text-sm transition-colors ${currentLang === 'en' ? 'text-[#C3B665] bg-gray-800/50' : 'text-gray-300 hover:bg-gray-800 hover:text-white'}`}>
                  English {currentLang === 'en' && <Check size={14} />}
                </button>
              </div>
            )}
          </div>

        </div>
      </div>
      {(isLangOpen || isUserMenuOpen) && <div className="fixed inset-0 z-40" onClick={() => { setIsLangOpen(false); setIsUserMenuOpen(false) }} />}
    </header>
  )
}

export default Header