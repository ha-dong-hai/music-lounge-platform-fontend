import { Search, ChevronDown, LogOut, Ticket, Settings, X, Menu, Languages, Check, Store, LayoutDashboard, Bell, MessageSquareWarning } from 'lucide-react'
import { anhChuCai } from '../utils/anhChuCai'
import { useState, useEffect, useRef } from 'react'
import { Link, NavLink, useNavigate } from 'react-router-dom' 
import { useAuthStore } from '../store/useAuthStore'
import toast from 'react-hot-toast'
import NotificationBell from '../components/notifications/NotificationBell'
import { getMyProfile } from '../services/userServices'
import { getShowSuggestions, getTrendingShows, getRecommendedShows, getPerformerSuggestions } from '../services/showServices'
import { getLounges } from '../services/loungeServices'
import Wordmark from '../components/brand/Wordmark'
import KhungGoiYTimKiem from '../components/shared/KhungGoiYTimKiem'
import { useTranslation } from 'react-i18next'
import { BAT_DOI_NGON_NGU, doiNgonNgu, k } from '../i18n'


// GỢI Ý TÌM KIẾM — GHI CHÚ CHO ĐỘI FE:
// - Gọi /lounge-shows/suggestions, trả về { id, name, coverImageUrl }. Chỉ có tên và ảnh, KHÔNG có
//   ngày diễn hay giá — đừng bày thêm trường không có rồi hiện "undefined".
// - Backend trả mảng rỗng khi q rỗng, nhưng vẫn phải chặn ở FE: gọi API cho chuỗi rỗng là gọi vô ích.
// - CHỐNG DỘI 300ms là bắt buộc: không có nó thì mỗi ký tự gõ vào là một request, và các phản hồi
//   về không theo thứ tự sẽ làm danh sách nhảy. Mỗi lần gõ mới huỷ luôn lượt chờ cũ.
// - Bấm vào một gợi ý là đi THẲNG tới buổi diễn đó (/shows/:id), không phải đi tới trang tìm kiếm.
const DO_TRE_GOI_Y = 300

// ⭐ BỎ PROPS searchQuery, setSearchQuery ĐI
// Menu chính — một nguồn cho cả hàng liên kết (≥1280px) và bảng menu (hẹp hơn).
const MENU_CHINH = [
  { to: '/lounges', nhan: k('Phòng trà') },
  { to: '/shows', nhan: k('Buổi diễn') },
  { to: '/minh-bach', nhan: k('Minh bạch') },
]

const Header = () => {
  const { user, logout } = useAuthStore()
  const { t, i18n } = useTranslation()
  const navigate = useNavigate() //

  // Ảnh đại diện không nằm trong kết quả đăng nhập (AuthResultDto) — chưa biết (undefined) thì hỏi /me/profile MỘT lần
  // rồi ghi vào kho phiên; null nghĩa là đã hỏi và người dùng chưa đặt ảnh, nên không hỏi lại.
  useEffect(() => {
    if (!user?.id || user.avatarUrl !== undefined) return
    let huy = false
    getMyProfile()
      .then((res) => {
        if (huy || !res?.success) return
        useAuthStore.setState((s) => (s.user?.id === user.id ? { user: { ...s.user, avatarUrl: res.data?.avatarUrl ?? null } } : {}))
      })
      .catch(() => {})
    return () => { huy = true }
  }, [user?.id, user?.avatarUrl])
  
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
  // Ngôn ngữ đang dùng lấy từ i18next (src/i18n) — một nguồn, không giữ bản sao trong state.
  const currentLang = i18n.language === 'en' ? 'en' : 'vi'
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false)
  const [moMenu, setMoMenu] = useState(false)
  // Esc đóng bảng menu — người dùng bàn phím không phải tab ngược về nút để đóng.
  useEffect(() => {
    if (!moMenu) return
    const khiBam = (e) => { if (e.key === 'Escape') setMoMenu(false) }
    window.addEventListener('keydown', khiBam)
    return () => window.removeEventListener('keydown', khiBam)
  }, [moMenu])
  // Cùng lý do cho menu ngôn ngữ và menu tài khoản (rà soát 01/10/2026: chỉ đóng được bằng chuột).
  useEffect(() => {
    if (!isLangOpen && !isUserMenuOpen) return
    const khiBam = (e) => { if (e.key === 'Escape') { setIsLangOpen(false); setIsUserMenuOpen(false) } }
    window.addEventListener('keydown', khiBam)
    return () => window.removeEventListener('keydown', khiBam)
  }, [isLangOpen, isUserMenuOpen])

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
      // MLACP-682 (chủ dự án 06/10/2026: "thanh search chỉ đang search được show, không có phòng trà, nghệ sĩ"): gợi ý
      // theo ba nhóm như ô tìm kiếm gộp (Algolia federated autocomplete — xem KhungGoiYTimKiem). Ba lời gọi song song;
      // nhóm nào lỗi thì chỉ nhóm đó rỗng, không kéo cả khung về "không có kết quả". Tổng tối đa 4 + 3 + 3 = 10 dòng,
      // đúng trần 10 gợi ý của Baymard; buổi diễn được nhiều dòng nhất vì vẫn là thứ người ta tìm nhiều nhất.
      const nhom = async (loai, goi, lay) => {
        try { const res = await goi(); return res.success ? lay(res.data).map((x) => ({ ...x, loai })) : [] } catch { return [] }
      }
      const [buoi, phongTra, ngheSi] = await Promise.all([
        nhom('show', () => getShowSuggestions(tuKhoa, 4), (d) => d ?? []),
        nhom('lounge', () => getLounges({ keyword: tuKhoa, page: 1, pageSize: 3 }),
          (d) => (d?.items ?? []).map((l) => ({ id: l.id, name: l.name, coverImageUrl: l.primaryImageUrl, phu: [l.district, l.city].filter(Boolean).join(', ') }))),
        nhom('performer', () => getPerformerSuggestions(tuKhoa, 3), (d) => (d ?? []).map((p) => ({ id: p.id, name: p.name, coverImageUrl: p.avatarUrl }))),
      ])
      // Bỏ kết quả của lượt đã bị thay thế: phản hồi về không theo thứ tự sẽ làm danh sách nhảy.
      if (conHieuLuc) { setGoiY([...buoi, ...phongTra, ...ngheSi]); setDangTaiGoiY(false) }
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
    navigate(item.loai === 'lounge' ? `/lounge/${item.id}` : item.loai === 'performer' ? `/performers/${item.id}` : `/shows/${item.id}`)
  }

  // Điều hướng bằng bàn phím: mũi tên lên/xuống chọn, Enter mở, Esc đóng. Không có phần này thì
  // người dùng bàn phím không với tới được danh sách.
  // Danh sách đang hiện: gợi ý theo chữ gõ (≥ 2 ký tự) hoặc gợi ý mặc định. Bản trước chỉ đi được bằng phím ở danh sách
  // theo chữ gõ; danh sách mặc định không với tới được bằng bàn phím.
  const tuKhoaGoiY = localSearch.trim()
  const dsDangHien = tuKhoaGoiY.length >= 2 ? (dangTaiGoiY ? [] : goiY) : goiYMacDinh.items
  const coKhungGoiY = moGoiY && (tuKhoaGoiY.length >= 2 || goiYMacDinh.items.length > 0)
  const handleKeyDown = (e) => {
    if (e.key === 'Escape') { setMoGoiY(false); return }
    if (!moGoiY || dsDangHien.length === 0) return
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setChiSoChon((i) => (i + 1) % dsDangHien.length)
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setChiSoChon((i) => (i <= 0 ? dsDangHien.length - 1 : i - 1))
    } else if (e.key === 'Enter' && chiSoChon >= 0 && chiSoChon < dsDangHien.length) {
      e.preventDefault()
      chonGoiY(dsDangHien[chiSoChon])
    }
  }

  const handleLogout = () => {
    logout()
    setIsUserMenuOpen(false)
    toast.success(t('Đã đăng xuất'))
  }

  // ÀM SUBMIT TÌM KIẾM SẼ CHUYỂN TRANG
  const handleSearchSubmit = (e) => {
    e.preventDefault()
    if (localSearch.trim()) {
      navigate(`/shows?q=${encodeURIComponent(localSearch.trim())}`)
    }
  }

  // Đổi ngôn ngữ giao diện (i18next) — App.jsx vẽ lại toàn bộ cây và tải lại dữ liệu theo ngôn ngữ mới.
  const handleChangeLang = (lang) => {
    setIsLangOpen(false)
    setMoMenu(false)
    doiNgonNgu(lang).then(() => toast.success(lang === 'vi' ? 'Đã chuyển sang Tiếng Việt' : 'Switched to English'))
  }

  return (
    // Đầu trang in trên giấy tờ bướm, kẻ mực dưới chân — không kính mờ (glass là trang trí, không thuộc thế giới giấy in).
    <header className="sticky top-0 z-50 w-full bg-stock border-b-2 border-ink px-4 sm:px-6 py-3">
      <div className="flex items-center justify-between gap-2 sm:gap-8">
        <div className="flex items-center gap-4 sm:gap-8 flex-1 min-w-0">
          <Link to="/" aria-label={t('MusicLounge — về trang chủ')} className="text-xl sm:text-3xl leading-none whitespace-nowrap flex-shrink-0 inline-flex items-center min-h-[44px]">
            <Wordmark />
          </Link>

          <form onSubmit={handleSearchSubmit} ref={oTimKiemRef} className="relative w-full max-w-md hidden md:block">
            <button type="submit" className="absolute left-0.5 top-1/2 -translate-y-1/2 w-11 h-11 inline-flex items-center justify-center text-ink cursor-pointer" aria-label={t('Tìm kiếm')}>
              <Search size={18} strokeWidth={2.5}/>
            </button>
            <input aria-label={t('Tìm đêm nhạc, phòng trà, nghệ sĩ')}
              type="text"
              role="combobox" aria-autocomplete="list" aria-expanded={coKhungGoiY && dsDangHien.length > 0}
              aria-controls="o-tim-goi-y" aria-activedescendant={coKhungGoiY && chiSoChon >= 0 ? `o-tim-goi-y-${chiSoChon}` : undefined}
              value={localSearch}
              onChange={e => {
                setLocalSearch(e.target.value)
                setMoGoiY(true)
                setChiSoChon(-1)
                setDangTaiGoiY(e.target.value.trim().length >= 2)
              }}
              onFocus={() => { setMoGoiY(true); setChiSoChon(-1) }}
              onKeyDown={handleKeyDown}
              autoComplete="off"
              placeholder={t('Tìm đêm nhạc, phòng trà, nghệ sĩ…')}
              className="w-full pl-12 pr-11 py-2.5 min-h-[44px] bg-card text-ink placeholder:text-ink-mute border-2 border-ink text-sm focus:outline-none focus:ring-2 focus:ring-ink focus:ring-offset-2 focus:ring-offset-stock transition-all"
            />
            {localSearch && (
              <button type="button" onClick={() => { setLocalSearch(''); setMoGoiY(false) }} className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-soft hover:text-ink" aria-label={t('Đóng')}>
                <X size={18} />
              </button>
            )}

            {/* KHUNG GỢI Ý — theo chữ gõ (≥ 2 ký tự) hoặc mặc định khi chưa gõ. Xem chú thích ở KhungGoiYTimKiem. */}
            {coKhungGoiY && (
              <KhungGoiYTimKiem idKhung="o-tim-goi-y" tuKhoa={tuKhoaGoiY} dangTai={dangTaiGoiY} goiY={goiY} macDinh={goiYMacDinh}
                chiSoChon={chiSoChon} setChiSoChon={setChiSoChon} onChon={chonGoiY} onDong={() => setMoGoiY(false)} />
            )}
          </form>

          {/* MENU CHÍNH — hai lời hứa ngang nhau (PRODUCT.md) nên "Minh bạch" đứng cạnh Phòng trà / Buổi diễn, không chỉ
              nằm ở chân trang. Từ xl (1280px) hiện thành hàng; hẹp hơn thì ô tìm kiếm + nút tài khoản đã chiếm hết
              hàng, nên ba liên kết nằm trong bảng mở bằng nút "Menu" (pre-mortem 30/09, T7: dưới 1280px trước đây
              KHÔNG có đường nào tới "Minh bạch" ngoài chân trang). */}
          <nav aria-label={t('Menu chính')} className="hidden xl:flex items-center gap-1 flex-shrink-0">
            {MENU_CHINH.map((m) => (
              <NavLink
                key={m.to}
                to={m.to}
                className={({ isActive }) =>
                  `inline-flex items-center min-h-[44px] px-3 text-sm font-semibold text-ink underline-offset-[6px] decoration-2 hover:underline whitespace-nowrap ${isActive ? 'underline' : ''}`
                }
              >
                {t(m.nhan)}
              </NavLink>
            ))}
          </nav>
        </div>

        <div className="flex items-center gap-2 sm:gap-4 flex-shrink-0">
          <Link to="/shows" aria-label={t('Tìm kiếm')} className="md:hidden w-11 h-11 inline-flex items-center justify-center text-ink hover:bg-ink hover:text-lamp transition-colors">
            <Search size={20} />
          </Link>
          <Link to="/my-shows" className="bg-transparent hover:bg-ink hover:text-lamp text-ink border-2 border-ink px-5 min-h-[44px] text-sm font-semibold transition-colors hidden sm:inline-flex items-center">
            {t('Vé của tôi')}
          </Link>

          {!user ? (
            <div className="flex items-center gap-2">
              <Link to="/login" className="text-sm font-semibold text-ink hover:underline underline-offset-4 px-2 sm:px-3 min-h-[44px] inline-flex items-center whitespace-nowrap">{t('Đăng nhập')}</Link>
              {/* Dưới sm "Đăng ký" nằm trong bảng menu: hàng đầu trang 390px không đủ chỗ cho cả nút Menu lẫn hai nút này. */}
              <Link to="/register" className="bg-ink text-lamp px-3 sm:px-5 min-h-[44px] hidden sm:inline-flex items-center whitespace-nowrap text-sm font-semibold hover:bg-board transition-colors">{t('Đăng ký')}</Link>
            </div>
          ) : (
            <>
            {/* Thông báo chỉ có nghĩa với người đã đăng nhập — API /notifications yêu cầu xác thực. */}
            <NotificationBell />
            <div className="relative">
              <button onClick={() => setIsUserMenuOpen(!isUserMenuOpen)} aria-haspopup="menu" aria-expanded={isUserMenuOpen} aria-label={t('Menu tài khoản')} className="flex items-center justify-center gap-2 min-h-[44px] min-w-[44px] hover:text-ink transition-colors focus:outline-none">
                {/* MLACP-628 (chủ dự án 04/10/2026): ô này luôn là ẢNH ĐẠI DIỆN, không còn biểu tượng hình người chung chung.
                    Người dùng chưa đặt ảnh (hoặc ảnh hỏng) thì hiện ảnh chữ cái tên của chính họ — vẽ tại chỗ, không gọi
                    dịch vụ ngoài (anhChuCai). alt rỗng: tên đã là chữ ngay cạnh / trong aria-label của nút. */}
                <img src={user.avatarUrl || anhChuCai(user.name)} alt="" width="36" height="36"
                  onError={(e) => { const du = anhChuCai(user.name); if (e.currentTarget.src !== du) e.currentTarget.src = du }}
                  className="w-9 h-9 object-cover border-2 border-ink" />
                <span className="font-medium text-ink text-sm hidden lg:inline">{user.name}</span>
                <ChevronDown size={14} className={`hidden lg:block transition-transform duration-200 ${isUserMenuOpen ? 'rotate-180' : ''}`} />
              </button>
              {isUserMenuOpen && (
                <div className="absolute right-0 top-full mt-3 w-56 bg-card border-2 border-ink shadow-lift py-2 z-50">
                  <div className="px-4 py-2 border-b border-line mb-1">
                    <p className="text-xs text-ink-mute">{t('Xin chào,')}</p>
                    <p className="text-sm font-semibold text-ink truncate">{user.email}</p>
                  </div>
                  <Link to="/account" className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-ink-soft hover:bg-sunken hover:text-ink transition-colors text-left">
                    <Settings size={18} className="text-ink" /> {t('Thông tin tài khoản')}
                  </Link>
                  <Link to="/my-shows" className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-ink-soft hover:bg-sunken transition-colors text-left">
                    <Ticket size={18} className="text-ink" /> {t('Vé của tôi')}
                  </Link>
                  <Link to="/notifications" className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-ink-soft hover:bg-sunken transition-colors text-left">
                    <Bell size={18} className="text-ink" /> {t('Thông báo')}
                  </Link>
                  <Link to="/complaints" className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-ink-soft hover:bg-sunken transition-colors text-left">
                    <MessageSquareWarning size={18} className="text-ink" /> {t('Khiếu nại')}
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
                      <Link to="/owner" className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-ink hover:bg-sunken transition-colors text-left font-medium">
                        <Store size={18} /> {t('Khu vực phòng trà')}
                      </Link>
                    </>
                  )}
                  {user.role === 'Admin' && (
                    <>
                      <div className="my-1 border-t border-line"></div>
                      <Link to="/admin" className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-ink hover:bg-sunken transition-colors text-left font-medium">
                        <LayoutDashboard size={18} /> {t('Trang quản trị')}
                      </Link>
                    </>
                  )}

                  <div className="my-1 border-t border-line"></div>
                  <button onClick={handleLogout} className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-danger hover:bg-danger/10 transition-colors text-left font-medium">
                    <LogOut size={18} /> {t('Đăng xuất')}
                  </button>
                </div>
              )}
            </div>
            </>
          )}

          {/* MLACP-604: ẩn nút đổi ngôn ngữ khi BAT_DOI_NGON_NGU tắt (src/i18n) — chuyển ngữ đang tạm dừng giữa chừng. */}
          <div className={BAT_DOI_NGON_NGU ? 'relative hidden sm:block' : 'hidden'}>
            <button type="button" onClick={() => setIsLangOpen(!isLangOpen)} aria-expanded={isLangOpen} aria-label={`${t('Ngôn ngữ')}: ${currentLang === 'vi' ? 'Tiếng Việt' : 'English'}`} className="flex items-center gap-1.5 px-3 min-h-[44px] border-2 border-transparent hover:border-ink text-sm font-medium text-ink transition-colors">
              <Languages size={16} />
              <span>{currentLang === 'vi' ? 'VN' : 'EN'}</span>
              <ChevronDown size={14} className={`transition-transform duration-200 ${isLangOpen ? 'rotate-180' : ''}`} />
            </button>
            {isLangOpen && (
              <div className="absolute right-0 top-full mt-3 w-44 bg-card border-2 border-ink shadow-lift py-2 z-50">
                <button onClick={() => handleChangeLang('vi')} className={`w-full flex items-center justify-between px-4 py-2.5 text-sm transition-colors ${currentLang === 'vi' ? 'text-ink bg-sunken/50' : 'text-ink-soft hover:bg-sunken hover:text-ink'}`}>
                  Tiếng Việt {currentLang === 'vi' && <Check size={14} />}
                </button>
                <button onClick={() => handleChangeLang('en')} className={`w-full flex items-center justify-between px-4 py-2.5 text-sm transition-colors ${currentLang === 'en' ? 'text-ink bg-sunken/50' : 'text-ink-soft hover:bg-sunken hover:text-ink'}`}>
                  English {currentLang === 'en' && <Check size={14} />}
                </button>
              </div>
            )}
          </div>

          <button
            type="button"
            onClick={() => setMoMenu((v) => !v)}
            aria-expanded={moMenu}
            aria-controls="menu-chinh-hep"
            aria-label={moMenu ? t('Đóng menu') : t('Mở menu')}
            className="xl:hidden w-11 h-11 inline-flex items-center justify-center text-ink border-2 border-ink hover:bg-ink hover:text-lamp transition-colors"
          >
            {moMenu ? <X size={20} aria-hidden="true" /> : <Menu size={20} aria-hidden="true" />}
          </button>
        </div>
      </div>

      {/* BẢNG MENU cho màn hình dưới 1280px — nằm trong dòng chảy của đầu trang (đẩy nội dung xuống), không phải lớp phủ:
          không cần bẫy focus, đóng bằng Esc / bấm liên kết / bấm lại nút. */}
      {moMenu && (
        <nav id="menu-chinh-hep" aria-label={t('Menu chính')} className="xl:hidden mt-3 border-t-2 border-ink pt-2">
          <ul>
            {MENU_CHINH.map((m) => (
              <li key={m.to}>
                <NavLink to={m.to} onClick={() => setMoMenu(false)}
                  className={({ isActive }) => `flex items-center min-h-[48px] px-1 text-base font-semibold text-ink border-b border-ink/15 ${isActive ? 'underline decoration-2 underline-offset-[6px]' : ''}`}>
                  {t(m.nhan)}
                </NavLink>
              </li>
            ))}
            <li className="sm:hidden">
              <Link to="/my-shows" onClick={() => setMoMenu(false)} className="flex items-center min-h-[48px] px-1 text-base font-semibold text-ink border-b border-ink/15">{t('Vé của tôi')}</Link>
            </li>
            {!user && (
              <li className="sm:hidden">
                <Link to="/register" onClick={() => setMoMenu(false)} className="flex items-center min-h-[48px] px-1 text-base font-semibold text-ink border-b border-ink/15">{t('Đăng ký')}</Link>
              </li>
            )}
            {/* Nút ngôn ngữ ở hàng đầu trang ẩn dưới sm — bản trước người dùng điện thoại KHÔNG có cách nào đổi ngôn ngữ. */}
            <li className={BAT_DOI_NGON_NGU ? 'sm:hidden flex items-center gap-2 min-h-[48px] px-1' : 'hidden'}>
              <Languages size={16} aria-hidden="true" />
              {[['vi', 'Tiếng Việt'], ['en', 'English']].map(([ma, ten]) => (
                <button key={ma} type="button" onClick={() => handleChangeLang(ma)} aria-pressed={currentLang === ma}
                  className={`min-h-[44px] px-3 text-sm font-semibold border-2 ${currentLang === ma ? 'border-ink bg-ink text-lamp' : 'border-transparent text-ink hover:border-ink'}`}>
                  {ten}
                </button>
              ))}
            </li>

          </ul>
        </nav>
      )}
      {(isLangOpen || isUserMenuOpen) && <div className="fixed inset-0 z-40" onClick={() => { setIsLangOpen(false); setIsUserMenuOpen(false) }} />}
    </header>
  )
}

export default Header