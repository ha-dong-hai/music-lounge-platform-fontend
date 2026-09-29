// src/components/portal/PortalShell.jsx
//
// Khung dùng chung cho hai khu làm việc: Quản trị hệ thống (AdminLayout) và Chủ phòng trà (OwnerLayout).
//
// VÌ SAO PHẢI CÓ (lỗi thật, đo được): hai layout cũ đều là `flex h-screen overflow-hidden` với `<aside className="w-64">`
// CỐ ĐỊNH, không có xử lý cho màn hẹp. Trên điện thoại 390px, thanh bên chiếm 256px và vùng nội dung chỉ còn 134px —
// trừ padding p-8 thì còn ~70px, tức là mọi bảng/biểu mẫu bị bóp thành một cột chữ dựng đứng, không dùng được. `overflow-hidden`
// ở thẻ ngoài lại CHE mất phần tràn, nên phép đo "tràn ngang" báo sạch — lỗi lọt qua chính vì công cụ đo bị layout lừa.
// Chủ phòng trà rất hay mở khu vận hành trên điện thoại ngay tại quán (soát vé, xem đơn gọi món), nên đây không phải
// trường hợp hiếm.
//
// CÁCH LÀM: dưới lg thanh bên thành ngăn kéo trượt từ trái, mở bằng nút trên thanh tiêu đề; từ lg trở lên giữ nguyên
// thanh bên tĩnh như cũ (không đổi trải nghiệm trên máy tính).
// - Ngăn kéo là <dialog>-như-thật bằng tay: role="dialog" + aria-modal, đóng bằng Esc, bằng bấm ra ngoài, và TỰ đóng khi
//   đổi trang (bấm một mục nav rồi ngăn kéo còn nằm đó là lỗi hay gặp nhất của kiểu này).
// - Khi mở thì chặn cuộn trang nền, và trả tiêu điểm về đúng nút đã mở lúc đóng.
// - Ngăn kéo luôn nằm trong DOM (chỉ trượt ra ngoài màn hình) nhưng dùng `inert` khi đóng, để Tab không rơi vào các mục
//   nav vô hình.
import { useEffect, useRef, useState } from 'react'
import { useLocation } from 'react-router-dom'
import { Menu, X } from 'lucide-react'

const PortalShell = ({ portalName, pageTitle, nav, footer, headerRight, children }) => {
  const location = useLocation()
  const openerRef = useRef(null)
  const drawerRef = useRef(null)

  // Ngăn kéo mở GẮN VỚI MỘT TRANG cụ thể (location.key), không phải một cờ true/false: đổi trang là key đổi, nên ngăn
  // kéo tự đóng ngay trong lượt render — không cần effect gọi setState (effect như vậy gây thêm một lượt render, và
  // eslint react-hooks/set-state-in-effect chặn đúng ở điểm này).
  const [openAt, setOpenAt] = useState(null)
  const isDrawerOpen = openAt !== null && openAt === location.key
  const closeDrawer = () => setOpenAt(null)

  useEffect(() => {
    if (!isDrawerOpen) return
    const opener = openerRef.current // chụp lại: lúc cleanup chạy, ref có thể đã trỏ sang node khác
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

  const sidebar = (
    <>
      <div className="h-16 flex items-center justify-between gap-2 pl-6 pr-3 border-b border-line flex-shrink-0">
        <h1 className="font-display text-lg font-semibold text-brand-text truncate">{portalName}</h1>
        <button
          type="button"
          onClick={closeDrawer}
          aria-label="Đóng menu"
          className="lg:hidden w-11 h-11 -mr-1 inline-flex items-center justify-center rounded-full text-ink-soft hover:text-ink hover:bg-sunken transition-colors flex-shrink-0"
        >
          <X size={20} />
        </button>
      </div>
      {/* onClick ở thẻ bọc: bấm lại chính mục đang mở thì location.key có thể không đổi, nên vẫn phải đóng bằng tay. */}
      <nav onClick={closeDrawer} className="flex-1 overflow-y-auto py-6 space-y-1.5 px-4">{nav}</nav>
      {footer && <div className="p-4 border-t border-line flex-shrink-0">{footer}</div>}
    </>
  )

  return (
    <div className="lg:flex lg:h-screen bg-page lg:overflow-hidden">
      {/* THANH BÊN TĨNH — chỉ từ màn lớn */}
      <aside className="hidden lg:flex w-64 bg-card text-ink flex-col h-full flex-shrink-0 border-r border-line">
        {sidebar}
      </aside>

      {/* NGĂN KÉO — dưới lg */}
      <div
        className={`lg:hidden fixed inset-0 z-50 ${isDrawerOpen ? '' : 'pointer-events-none'}`}
        inert={!isDrawerOpen}
      >
        <div
          onClick={closeDrawer}
          className={`absolute inset-0 bg-espresso/50 backdrop-blur-sm transition-opacity duration-300 ${isDrawerOpen ? 'opacity-100' : 'opacity-0'}`}
        />
        <div
          ref={drawerRef}
          role="dialog"
          aria-modal="true"
          aria-label={`Menu ${portalName}`}
          className={`absolute inset-y-0 left-0 w-[17rem] max-w-[85vw] bg-card text-ink flex flex-col border-r border-line shadow-lift transition-transform duration-300 ease-out ${isDrawerOpen ? 'translate-x-0' : '-translate-x-full'}`}
        >
          {sidebar}
        </div>
      </div>

      <div className="lg:flex-1 lg:flex lg:flex-col lg:h-full lg:overflow-hidden min-w-0">
        <header className="h-16 bg-card border-b border-line flex items-center gap-2 px-3 sm:px-5 lg:px-8 flex-shrink-0 sticky top-0 z-40 lg:static">
          <button
            ref={openerRef}
            type="button"
            onClick={() => setOpenAt(location.key)}
            aria-label={`Mở menu ${portalName}`}
            aria-expanded={isDrawerOpen}
            className="lg:hidden w-11 h-11 inline-flex items-center justify-center rounded-full text-ink-soft hover:text-ink hover:bg-sunken transition-colors flex-shrink-0"
          >
            <Menu size={22} />
          </button>
          <h2 className="text-base sm:text-lg font-semibold text-ink truncate min-w-0">{pageTitle}</h2>
          {headerRight && <div className="ml-auto flex-shrink-0">{headerRight}</div>}
        </header>

        <main className="lg:flex-1 lg:overflow-y-auto p-4 sm:p-6 lg:p-8 bg-page min-w-0">
          {children}
        </main>
      </div>
    </div>
  )
}

export default PortalShell
