// src/components/portal/PortalShell.jsx
//
// KHUNG DÙNG CHUNG cho hai khu làm việc: Quản trị hệ thống (AdminLayout) và Chủ phòng trà / Nhân viên (OwnerLayout).
//
// VÌ SAO CÓ NGĂN KÉO (lỗi thật, đo được): hai layout cũ là `flex h-screen overflow-hidden` với thanh bên 256px CỐ ĐỊNH.
// Trên điện thoại 390px vùng nội dung chỉ còn ~70px. Chủ phòng trà rất hay mở khu này trên điện thoại ngay tại quán
// (soát vé, xem đơn gọi món), nên dưới lg thanh bên là ngăn kéo trượt từ trái; từ lg trở lên là thanh bên tĩnh.
//
// LÀM LẠI 30/09/2026 — thế giới "tờ chương trình", nghiên cứu ở reports/Form lọc vé và màn vận hành.md:
//  - Thanh bên là khối SƠN THEN, chữ ánh đèn (DESIGN.md: khối mực cho thanh bên). Mục đang mở: nền ánh đèn, chữ sơn
//    then, VẠCH TRÁI — không chỉ đổi sắc (WCAG 1.4.1), và NavLink tự gắn aria-current="page".
//  - Mục GOM NHÓM có tiêu đề (IBM Carbon UI shell: tối đa hai tầng; NN/g: thanh bên dọc mở rộng tốt khi mục tăng).
//    Trước đây 15–16 mục phẳng một danh sách.
//  - Đầu trang in TÊN MỤC ĐANG MỞ thay cho một dòng cố định ("Quản lý vận hành phòng trà") không đổi theo trang.
//  - Ngăn kéo: role="dialog" + aria-modal, Esc / bấm ra ngoài / đổi trang đều đóng; `inert` khi đóng để Tab không rơi
//    vào mục vô hình; chặn cuộn nền; trả focus về nút đã mở.
//
// DỮ LIỆU MENU: `nhom` = [{ ten, muc: [{ to, nhan, icon, end? }] }], `loiRa` = [{ to, nhan, icon }] (đường ra khỏi khu,
// dùng Link chứ không NavLink vì không bao giờ "đang chọn").
import { useEffect, useRef, useState } from 'react'
import { Link, NavLink, useLocation, matchPath } from 'react-router-dom'
import { Menu, X } from 'lucide-react'
import Wordmark from '../brand/Wordmark'

const lopMuc = ({ isActive }) =>
  `flex items-center gap-3 pl-3 pr-3 min-h-[44px] text-sm font-medium border-l-4 transition-colors ${isActive
    ? 'bg-lamp text-board border-ember'
    : 'text-lamp-mute border-transparent hover:text-lamp hover:bg-board-soft'}`

const PortalShell = ({ portalName, nhom = [], loiRa = [], footer, headerRight, children }) => {
  const location = useLocation()
  const openerRef = useRef(null)
  const drawerRef = useRef(null)

  // Ngăn kéo mở GẮN VỚI MỘT TRANG cụ thể (location.key): đổi trang là key đổi, nên ngăn kéo tự đóng ngay trong lượt
  // render — không cần effect gọi setState.
  const [openAt, setOpenAt] = useState(null)
  const isDrawerOpen = openAt !== null && openAt === location.key
  const closeDrawer = () => setOpenAt(null)

  useEffect(() => {
    if (!isDrawerOpen) return
    const opener = openerRef.current
    const onKeyDown = (e) => { if (e.key === 'Escape') setOpenAt(null) }
    document.addEventListener('keydown', onKeyDown)
    const prevOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    drawerRef.current?.querySelector('a, button')?.focus()
    return () => {
      document.removeEventListener('keydown', onKeyDown)
      document.body.style.overflow = prevOverflow
      opener?.focus()
    }
  }, [isDrawerOpen])

  // Tên mục đang mở: khớp dài nhất thắng (/owner/shows/12 thuộc "Buổi diễn").
  const dangMo = nhom.flatMap((n) => n.muc)
    .filter((m) => matchPath({ path: m.to, end: Boolean(m.end) }, location.pathname))
    .sort((a, b) => b.to.length - a.to.length)[0]

  const sidebar = (
    <>
      <div className="h-16 flex items-center justify-between gap-2 pl-5 pr-3 border-b border-lamp/20 flex-shrink-0">
        <Link to="/" className="min-w-0 inline-flex flex-col justify-center min-h-[44px]" aria-label={`MusicLounge, ${portalName}. Về trang công khai`}>
          <span className="text-xl leading-none"><Wordmark tone="lamp" /></span>
          <span className="text-xs text-lamp-mute mt-1 truncate">{portalName}</span>
        </Link>
        <button type="button" onClick={closeDrawer} aria-label="Đóng menu"
          className="lg:hidden w-11 h-11 -mr-1 inline-flex items-center justify-center text-lamp hover:bg-board-soft transition-colors flex-shrink-0">
          <X size={20} aria-hidden="true" />
        </button>
      </div>
      {/* onClick ở thẻ bọc: bấm lại chính mục đang mở thì location.key có thể không đổi, nên vẫn phải đóng bằng tay. */}
      <nav onClick={closeDrawer} aria-label={portalName} className="flex-1 overflow-y-auto py-4 px-3 space-y-5">
        {nhom.map((n) => (
          <div key={n.ten}>
            <p className="px-3 pb-1.5 text-xs font-semibold text-lamp-mute">{n.ten}</p>
            <ul className="space-y-0.5">
              {n.muc.map(({ to, end, nhan, icon: Icon }) => (
                <li key={to}>
                  <NavLink to={to} end={end} className={lopMuc}>
                    {Icon && <Icon size={18} aria-hidden="true" />} {nhan}
                  </NavLink>
                </li>
              ))}
            </ul>
          </div>
        ))}
        {loiRa.length > 0 && (
          <ul className="pt-4 border-t border-lamp/20 space-y-0.5">
            {loiRa.map(({ to, nhan, icon: Icon }) => (
              <li key={to}>
                <Link to={to} className={lopMuc({ isActive: false })}>
                  {Icon && <Icon size={18} aria-hidden="true" />} {nhan}
                </Link>
              </li>
            ))}
          </ul>
        )}
      </nav>
      {footer && <div className="p-3 border-t border-lamp/20 flex-shrink-0">{footer}</div>}
    </>
  )

  return (
    <div className="lg:flex lg:h-screen bg-page lg:overflow-hidden">
      {/* THANH BÊN TĨNH — chỉ từ màn lớn */}
      <aside className="hidden lg:flex w-64 bg-board text-lamp flex-col h-full flex-shrink-0">{sidebar}</aside>

      {/* NGĂN KÉO — dưới lg */}
      <div className={`lg:hidden fixed inset-0 z-50 ${isDrawerOpen ? '' : 'pointer-events-none'}`} inert={!isDrawerOpen}>
        <div onClick={closeDrawer} className={`absolute inset-0 bg-board/60 transition-opacity duration-300 ${isDrawerOpen ? 'opacity-100' : 'opacity-0'}`} />
        <div ref={drawerRef} role="dialog" aria-modal="true" aria-label={`Menu ${portalName}`}
          className={`absolute inset-y-0 left-0 w-[17rem] max-w-[85vw] bg-board text-lamp flex flex-col shadow-lift transition-transform duration-300 ease-out ${isDrawerOpen ? 'translate-x-0' : '-translate-x-full'}`}>
          {sidebar}
        </div>
      </div>

      <div className="lg:flex-1 lg:flex lg:flex-col lg:h-full lg:overflow-hidden min-w-0">
        <header className="h-16 bg-page border-b-2 border-ink flex items-center gap-2 px-3 sm:px-5 lg:px-8 flex-shrink-0 sticky top-0 z-40 lg:static">
          <button ref={openerRef} type="button" onClick={() => setOpenAt(location.key)} aria-label={`Mở menu ${portalName}`} aria-expanded={isDrawerOpen}
            className="lg:hidden w-11 h-11 inline-flex items-center justify-center text-ink hover:bg-ink hover:text-lamp transition-colors flex-shrink-0">
            <Menu size={22} aria-hidden="true" />
          </button>
          <p className="min-w-0 truncate text-sm text-ink-soft">
            {portalName}{dangMo && <><span aria-hidden="true"> / </span><span className="font-semibold text-ink">{dangMo.nhan}</span></>}
          </p>
          {headerRight && <div className="ml-auto flex-shrink-0">{headerRight}</div>}
        </header>

        <main className="lg:flex-1 lg:overflow-y-auto p-4 sm:p-6 lg:p-8 bg-page min-w-0">
          {/* Khung trang tối đa 1440px căn giữa (DESIGN.md › Bố cục) — trước không giới hạn nên trang biểu mẫu neo trái để trống cả nửa màn rộng. */}
          <div className="max-w-[1440px] mx-auto">{children}</div>
        </main>
      </div>
    </div>
  )
}

export default PortalShell
