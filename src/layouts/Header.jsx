import { Search, User, ChevronDown, LogOut, Ticket, Settings, X, Languages, Check, Loader2, Store, LayoutDashboard, Bell, MessageSquareWarning } from 'lucide-react'
import { useState, useEffect, useRef } from 'react'
import { Link, useNavigate } from 'react-router-dom' 
import { useAuthStore } from '../store/useAuthStore'
import toast from 'react-hot-toast'
import NotificationBell from '../components/notifications/NotificationBell'
import { getShowSuggestions } from '../services/showServices'

// GỢI Ý TÌM KIẾM — GHI CHÚ CHO ĐỘI FE:
// - Gọi /lounge-shows/suggestions, trả về { id, name, coverImageUrl }. Chỉ có tên và ảnh, KHÔNG có
//   ngày diễn hay giá — đừng bày thêm trường không có rồi hiện "undefined".
// - Backend trả mảng rỗng khi q rỗng, nhưng vẫn phải chặn ở FE: gọi API cho chuỗi rỗng là gọi vô ích.
// - CHỐNG DỘI 300ms là bắt buộc: không có nó thì mỗi ký tự gõ vào là một request, và các phản hồi
//   về không theo thứ tự sẽ làm danh sách nhảy. Mỗi lần gõ mới huỷ luôn lượt chờ cũ.
// - Bấm vào một gợi ý là đi THẲNG tới buổi diễn đó (/shows/:id), không phải đi tới trang tìm kiếm.
const DO_TRE_GOI_Y = 300

// ⭐ BỎ PROPS searchQuery, setSearchQuery ĐI
const Header = () => {
  const { user, logout } = useAuthStore()
  const navigate = useNavigate() //
  
  const [localSearch, setLocalSearch] = useState('')
  const [goiY, setGoiY] = useState([])
  const [moGoiY, setMoGoiY] = useState(false)
  const [dangTaiGoiY, setDangTaiGoiY] = useState(false)
  const [chiSoChon, setChiSoChon] = useState(-1)
  const oTimKiemRef = useRef(null)
  const [isLangOpen, setIsLangOpen] = useState(false)
  const [currentLang, setCurrentLang] = useState(localStorage.getItem('lang') || 'vi')
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false)

  // Gõ tới đâu gợi ý tới đó, nhưng chỉ gọi API sau khi người dùng ngừng gõ 300ms.
  // Cờ "đang tải" được bật trong handler onChange (hành động của người dùng) chứ không trong effect:
  // đặt state ngay trong thân effect gây render lặp và bị eslint chặn.
  useEffect(() => {
    const tuKhoa = localSearch.trim()
    let conHieuLuc = true
    const hen = setTimeout(async () => {
      if (tuKhoa.length < 2) {
        setGoiY([])
        setDangTaiGoiY(false)
        return
      }
      try {
        const res = await getShowSuggestions(tuKhoa, 8)
        // Bỏ kết quả của lượt đã bị thay thế: phản hồi về không theo thứ tự sẽ làm danh sách nhảy.
        if (conHieuLuc && res.success) setGoiY(res.data ?? [])
      } catch {
        if (conHieuLuc) setGoiY([])
      } finally {
        if (conHieuLuc) setDangTaiGoiY(false)
      }
    }, DO_TRE_GOI_Y)
    return () => { conHieuLuc = false; clearTimeout(hen) }
  }, [localSearch])

  // Bấm ra ngoài thì đóng danh sách gợi ý.
  useEffect(() => {
    const dong = (e) => {
      if (oTimKiemRef.current && !oTimKiemRef.current.contains(e.target)) setMoGoiY(false)
    }
    document.addEventListener('mousedown', dong)
    return () => document.removeEventListener('mousedown', dong)
  }, [])

  const chonGoiY = (item) => {
    setMoGoiY(false)
    setLocalSearch('')
    navigate(`/shows/${item.id}`)
  }

  // Điều hướng bằng bàn phím: mũi tên lên/xuống chọn, Enter mở, Esc đóng. Không có phần này thì
  // người dùng bàn phím không với tới được danh sách.
  const handleKeyDown = (e) => {
    if (!moGoiY || goiY.length === 0) return
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setChiSoChon((i) => (i + 1) % goiY.length)
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setChiSoChon((i) => (i <= 0 ? goiY.length - 1 : i - 1))
    } else if (e.key === 'Enter' && chiSoChon >= 0) {
      e.preventDefault()
      chonGoiY(goiY[chiSoChon])
    } else if (e.key === 'Escape') {
      setMoGoiY(false)
    }
  }

  const handleLogout = () => {
    logout()
    setIsUserMenuOpen(false)
    toast.success('Logout account')
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

          <form onSubmit={handleSearchSubmit} ref={oTimKiemRef} className="relative w-full max-w-md hidden md:block">
            <button type="submit" className="absolute left-3 top-1/2 -translate-y-1/2 text-[#C3B665] cursor-pointer" aria-label="Search">
              <Search size={18} strokeWidth={2.5}/>
            </button>
            <input
              type="text"
              value={localSearch}
              onChange={e => {
                setLocalSearch(e.target.value)
                setMoGoiY(true)
                setChiSoChon(-1)
                setDangTaiGoiY(e.target.value.trim().length >= 2)
              }}
              onFocus={() => setMoGoiY(true)}
              onKeyDown={handleKeyDown}
              autoComplete="off"
              placeholder="What would you like to search today"
              className="w-full pl-10 pr-10 py-2.5 bg-gray-800 text-white placeholder:text-gray-400 rounded-full text-sm focus:outline-none focus:ring-2 focus:ring-[#C3B665] transition-all"
            />
            {localSearch && (
              <button type="button" onClick={() => { setLocalSearch(''); setMoGoiY(false) }} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white">
                <X size={18} />
              </button>
            )}

            {/* DANH SÁCH GỢI Ý */}
            {moGoiY && localSearch.trim().length >= 2 && (
              <div className="absolute top-full left-0 right-0 mt-2 bg-gray-900 border border-gray-800 rounded-xl shadow-2xl overflow-hidden z-50">
                {dangTaiGoiY ? (
                  <div className="py-6 flex justify-center">
                    <Loader2 size={20} className="animate-spin text-[#C3B665]" />
                  </div>
                ) : goiY.length === 0 ? (
                  <p className="px-4 py-4 text-sm text-gray-500">
                    Không có buổi diễn nào khớp. Nhấn Enter để tìm rộng hơn.
                  </p>
                ) : (
                  <ul>
                    {goiY.map((item, i) => (
                      <li key={item.id}>
                        <button type="button" onClick={() => chonGoiY(item)}
                          onMouseEnter={() => setChiSoChon(i)}
                          className={`w-full flex items-center gap-3 px-3 py-2.5 text-left transition-colors ${i === chiSoChon ? 'bg-gray-800' : 'hover:bg-gray-800/60'}`}>
                          {item.coverImageUrl ? (
                            <img src={item.coverImageUrl} alt="" className="w-10 h-10 rounded-md object-cover flex-shrink-0" />
                          ) : (
                            <div className="w-10 h-10 rounded-md bg-gray-800 flex-shrink-0" />
                          )}
                          <span className="text-sm text-white truncate">{item.name}</span>
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
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
            <>
            {/* Thông báo chỉ có nghĩa với người đã đăng nhập — API /notifications yêu cầu xác thực. */}
            <NotificationBell />
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
                  <Link to="/notifications" className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-gray-300 hover:bg-gray-800 transition-colors text-left">
                    <Bell size={18} className="text-[#C3B665]" /> Thông báo
                  </Link>
                  <Link to="/complaints" className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-gray-300 hover:bg-gray-800 transition-colors text-left">
                    <MessageSquareWarning size={18} className="text-[#C3B665]" /> Khiếu nại
                  </Link>

                  {/* LỐI VÀO KHU LÀM VIỆC THEO VAI TRÒ.
                      Trước đây menu này chỉ có Tài khoản / Vé của tôi / Đăng xuất, nên chủ phòng trà
                      và Admin đăng nhập ở trang công khai KHÔNG có đường nào vào khu vực của mình —
                      phải tự gõ URL. Đó là chặn hẳn luồng làm việc của họ, không phải chuyện tiện tay.
                      Chỉ hiện đúng cửa mà vai trò đó vào được (khớp guard trong AppRouter.jsx):
                      /owner mở cho Owner và Staff, /admin chỉ cho Admin. */}
                  {(user.role === 'Owner' || user.role === 'Staff') && (
                    <>
                      <div className="my-1 border-t border-gray-700"></div>
                      <Link to="/owner" className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-[#C3B665] hover:bg-gray-800 transition-colors text-left font-medium">
                        <Store size={18} /> Khu vực phòng trà
                      </Link>
                    </>
                  )}
                  {user.role === 'Admin' && (
                    <>
                      <div className="my-1 border-t border-gray-700"></div>
                      <Link to="/admin" className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-[#C3B665] hover:bg-gray-800 transition-colors text-left font-medium">
                        <LayoutDashboard size={18} /> Trang quản trị
                      </Link>
                    </>
                  )}

                  <div className="my-1 border-t border-gray-700"></div>
                  <button onClick={handleLogout} className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-red-500 hover:bg-red-500/10 transition-colors text-left font-medium">
                    <LogOut size={18} /> Log out
                  </button>
                </div>
              )}
            </div>
            </>
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