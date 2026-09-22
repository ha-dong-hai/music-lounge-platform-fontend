import { Search, User, ChevronDown, LogOut, Ticket, Settings, X, Languages, Check, Loader2, Store, LayoutDashboard, Bell, MessageSquareWarning } from 'lucide-react'
import { useState, useEffect, useRef } from 'react'
import { Link, useNavigate } from 'react-router-dom' 
import { useAuthStore } from '../store/useAuthStore'
import toast from 'react-hot-toast'
import NotificationBell from '../components/notifications/NotificationBell'
import { getShowSuggestions, getTrendingShows, getRecommendedShows } from '../services/showServices'

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
  // GỢI Ý MẶC ĐỊNH khi bấm vào ô tìm kiếm mà CHƯA gõ gì (người dùng thường chưa biết mình muốn gì):
  //  - Đã đăng nhập  -> /recommendations (backend tự chọn mức cá nhân hoá: ML.NET có lời giải thích
  //                     nếu bật AiConsent, ngược lại theo sở thích + phòng trà đang theo dõi).
  //  - Khách / rỗng  -> /lounge-shows/trending (độ hot chung).
  // `khoa` gắn kết quả với người đang đăng nhập, để đổi tài khoản thì lấy lại chứ không hiện gợi ý
  // của người trước. Không gọi lại mỗi lần mở ô tìm kiếm — chỉ lấy một lần cho mỗi người.
  const [goiYMacDinh, setGoiYMacDinh] = useState({ khoa: null, kieu: 'trending', items: [] })
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

  useEffect(() => {
    if (!moGoiY || localSearch.trim().length > 0) return
    const khoa = user?.id ?? 'khach'
    if (goiYMacDinh.khoa === khoa) return
    let conHieuLuc = true
    ;(async () => {
      let kieu = 'trending'
      let items = []
      try {
        if (user) {
          const res = await getRecommendedShows({ limit: 5 })
          if (res.success && res.data?.length) { kieu = 'ca-nhan'; items = res.data }
        }
        if (items.length === 0) {
          const res = await getTrendingShows({ limit: 5 })
          if (res.success) items = res.data ?? []
        }
      } catch { /* im lặng: không có gợi ý mặc định thì ô tìm kiếm vẫn dùng bình thường */ }
      if (conHieuLuc) setGoiYMacDinh({ khoa, kieu, items })
    })()
    return () => { conHieuLuc = false }
  }, [moGoiY, localSearch, user, goiYMacDinh.khoa])

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
    <header className="sticky top-0 z-50 w-full bg-page/95 backdrop-blur border-b border-line px-4 sm:px-6 py-3 shadow-soft">
      <div className="flex items-center justify-between gap-4 sm:gap-8">
        <div className="flex items-center gap-4 sm:gap-8 flex-1 min-w-0">
          <Link to="/" aria-label="Phòng Trà Sài Gòn — về trang chủ" className="font-display text-xl sm:text-2xl leading-none tracking-tight text-ink whitespace-nowrap flex-shrink-0 inline-flex items-center min-h-[44px]">
            Phòng Trà<span className="hidden min-[400px]:inline text-brand-text"> Sài Gòn</span>
          </Link>

          <form onSubmit={handleSearchSubmit} ref={oTimKiemRef} className="relative w-full max-w-md hidden md:block">
            <button type="submit" className="absolute left-1 top-1/2 -translate-y-1/2 w-10 h-10 inline-flex items-center justify-center text-brand-text cursor-pointer" aria-label="Tìm kiếm">
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
              placeholder="Tìm đêm nhạc, phòng trà, nghệ sĩ…"
              className="w-full pl-11 pr-11 py-2.5 min-h-[44px] bg-sunken text-ink placeholder:text-ink-mute rounded-full text-sm focus:outline-none focus:ring-2 focus:ring-brand transition-all"
            />
            {localSearch && (
              <button type="button" onClick={() => { setLocalSearch(''); setMoGoiY(false) }} className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-soft hover:text-ink">
                <X size={18} />
              </button>
            )}

            {/* DANH SÁCH GỢI Ý */}
            {moGoiY && localSearch.trim().length >= 2 && (
              <div className="absolute top-full left-0 right-0 mt-2 bg-card border border-line rounded-xl shadow-2xl overflow-hidden z-50">
                {dangTaiGoiY ? (
                  <div className="py-6 flex justify-center">
                    <Loader2 size={20} className="animate-spin text-brand-text" />
                  </div>
                ) : goiY.length === 0 ? (
                  <p className="px-4 py-4 text-sm text-ink-mute">
                    Không có buổi diễn nào khớp. Nhấn Enter để tìm rộng hơn.
                  </p>
                ) : (
                  <ul>
                    {goiY.map((item, i) => (
                      <li key={item.id}>
                        <button type="button" onClick={() => chonGoiY(item)}
                          onMouseEnter={() => setChiSoChon(i)}
                          className={`w-full flex items-center gap-3 px-3 py-2.5 text-left transition-colors ${i === chiSoChon ? 'bg-sunken' : 'hover:bg-sunken/60'}`}>
                          {item.coverImageUrl ? (
                            <img src={item.coverImageUrl} alt="" className="w-10 h-10 rounded-md object-cover flex-shrink-0" />
                          ) : (
                            <div className="w-10 h-10 rounded-md bg-sunken flex-shrink-0" />
                          )}
                          <span className="text-sm text-ink truncate">{item.name}</span>
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            )}
            {/* GỢI Ý MẶC ĐỊNH — hiện khi bấm vào ô mà chưa gõ đủ 2 ký tự */}
            {moGoiY && localSearch.trim().length < 2 && goiYMacDinh.items.length > 0 && (
              <div className="absolute top-full left-0 right-0 mt-2 bg-card border border-line rounded-xl shadow-lift overflow-hidden z-50">
                <p className="px-4 pt-3 pb-1 text-xs font-semibold uppercase tracking-[0.12em] text-ink-mute">
                  {goiYMacDinh.kieu === 'ca-nhan' ? 'Gợi ý riêng cho bạn' : 'Đang được quan tâm'}
                </p>
                <ul>
                  {goiYMacDinh.items.map((item) => (
                    <li key={item.id}>
                      <button type="button" onClick={() => chonGoiY(item)}
                        className="w-full flex items-center gap-3 px-3 py-2.5 text-left hover:bg-sunken/60 transition-colors">
                        {item.coverImageUrl ? (
                          <img src={item.coverImageUrl} alt="" className="w-10 h-10 rounded-md object-cover flex-shrink-0" />
                        ) : (
                          <div className="w-10 h-10 rounded-md bg-sunken flex-shrink-0" />
                        )}
                        <span className="min-w-0">
                          <span className="block text-sm text-ink truncate">{item.name}</span>
                          {(item.recommendationReason || item.loungeName) && (
                            <span className="block text-xs text-ink-mute truncate">
                              {item.recommendationReason || item.loungeName}
                            </span>
                          )}
                        </span>
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </form>
        </div>

        <div className="flex items-center gap-2 sm:gap-4 flex-shrink-0">
          <Link to="/shows/search" aria-label="Tìm kiếm" className="md:hidden w-11 h-11 inline-flex items-center justify-center rounded-full text-ink-soft hover:bg-sunken hover:text-ink transition-colors">
            <Search size={20} />
          </Link>
          <Link to="/my-shows" className="bg-transparent hover:bg-brand-hover hover:text-on-brand text-brand-text border border-brand px-5 min-h-[44px] rounded-full text-sm font-medium transition-colors hidden sm:inline-flex items-center">
            Vé của tôi
          </Link>

          {!user ? (
            <div className="flex items-center gap-2">
              <Link to="/login" className="text-sm font-medium text-ink-soft hover:text-ink px-3 min-h-[44px] inline-flex items-center rounded-xl border border-transparent hover:bg-sunken transition-all">Đăng nhập</Link>
              <Link to="/register" className="bg-brand text-on-brand px-4 min-h-[44px] inline-flex items-center rounded-full text-sm font-semibold hover:bg-brand-hover transition-colors shadow-soft">Đăng ký</Link>
            </div>
          ) : (
            <>
            {/* Thông báo chỉ có nghĩa với người đã đăng nhập — API /notifications yêu cầu xác thực. */}
            <NotificationBell />
            <div className="relative">
              <button onClick={() => setIsUserMenuOpen(!isUserMenuOpen)} aria-haspopup="menu" aria-expanded={isUserMenuOpen} aria-label="Menu tài khoản" className="flex items-center gap-2 min-h-[44px] hover:text-ink transition-colors focus:outline-none">
                {user.avatarUrl ? (
                  <img src={user.avatarUrl} alt="avatar" className="w-9 h-9 rounded-full object-cover border border-brand" />
                ) : (
                  <div className="w-9 h-9 rounded-full bg-page text-ink flex items-center justify-center border border-brand/30">
                    <User size={20} />
                  </div>
                )}
                <span className="font-medium text-ink text-sm hidden lg:inline">{user.name}</span>
                <ChevronDown size={14} className={`hidden lg:block transition-transform duration-200 ${isUserMenuOpen ? 'rotate-180' : ''}`} />
              </button>
              {isUserMenuOpen && (
                <div className="absolute right-0 top-full mt-3 w-56 bg-card rounded-xl shadow-lift border border-line py-2 z-50 animate-in fade-in slide-in-from-top-2">
                  <div className="px-4 py-2 border-b border-line mb-1">
                    <p className="text-xs text-ink-mute">Xin chào,</p>
                    <p className="text-sm font-semibold text-ink truncate">{user.email}</p>
                  </div>
                  <Link to="/account" className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-ink-soft hover:bg-sunken hover:text-ink transition-colors text-left">
                    <Settings size={18} className="text-brand-text" /> Thông tin tài khoản
                  </Link>
                  <Link to="/my-shows" className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-ink-soft hover:bg-sunken transition-colors text-left">
                    <Ticket size={18} className="text-brand-text" /> Vé của tôi
                  </Link>
                  <Link to="/notifications" className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-ink-soft hover:bg-sunken transition-colors text-left">
                    <Bell size={18} className="text-brand-text" /> Thông báo
                  </Link>
                  <Link to="/complaints" className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-ink-soft hover:bg-sunken transition-colors text-left">
                    <MessageSquareWarning size={18} className="text-brand-text" /> Khiếu nại
                  </Link>

                  {/* LỐI VÀO KHU LÀM VIỆC THEO VAI TRÒ.
                      Trước đây menu này chỉ có Tài khoản / Vé của tôi / Đăng xuất, nên chủ phòng trà
                      và Admin đăng nhập ở trang công khai KHÔNG có đường nào vào khu vực của mình —
                      phải tự gõ URL. Đó là chặn hẳn luồng làm việc của họ, không phải chuyện tiện tay.
                      Chỉ hiện đúng cửa mà vai trò đó vào được (khớp guard trong AppRouter.jsx):
                      /owner mở cho Owner và Staff, /admin chỉ cho Admin. */}
                  {(user.role === 'Owner' || user.role === 'Staff') && (
                    <>
                      <div className="my-1 border-t border-line"></div>
                      <Link to="/owner" className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-brand-text hover:bg-sunken transition-colors text-left font-medium">
                        <Store size={18} /> Khu vực phòng trà
                      </Link>
                    </>
                  )}
                  {user.role === 'Admin' && (
                    <>
                      <div className="my-1 border-t border-line"></div>
                      <Link to="/admin" className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-brand-text hover:bg-sunken transition-colors text-left font-medium">
                        <LayoutDashboard size={18} /> Trang quản trị
                      </Link>
                    </>
                  )}

                  <div className="my-1 border-t border-line"></div>
                  <button onClick={handleLogout} className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-danger hover:bg-danger/10 transition-colors text-left font-medium">
                    <LogOut size={18} /> Đăng xuất
                  </button>
                </div>
              )}
            </div>
            </>
          )}

          <div className="relative hidden sm:block">
            <button onClick={() => setIsLangOpen(!isLangOpen)} className="flex items-center gap-1.5 px-3 min-h-[44px] rounded-full border border-line hover:border-brand text-sm font-medium text-ink-soft hover:text-brand-text transition-colors">
              <Languages size={16} />
              <span>{currentLang === 'vi' ? 'VN' : 'EN'}</span>
              <ChevronDown size={14} className={`transition-transform duration-200 ${isLangOpen ? 'rotate-180' : ''}`} />
            </button>
            {isLangOpen && (
              <div className="absolute right-0 top-full mt-3 w-44 bg-card rounded-xl shadow-lift border border-line py-2 z-50 animate-in fade-in slide-in-from-top-2">
                <button onClick={() => handleChangeLang('vi')} className={`w-full flex items-center justify-between px-4 py-2.5 text-sm transition-colors ${currentLang === 'vi' ? 'text-brand-text bg-sunken/50' : 'text-ink-soft hover:bg-sunken hover:text-ink'}`}>
                  Tiếng Việt {currentLang === 'vi' && <Check size={14} />}
                </button>
                <button onClick={() => handleChangeLang('en')} className={`w-full flex items-center justify-between px-4 py-2.5 text-sm transition-colors ${currentLang === 'en' ? 'text-brand-text bg-sunken/50' : 'text-ink-soft hover:bg-sunken hover:text-ink'}`}>
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