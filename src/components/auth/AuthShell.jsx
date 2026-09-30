// src/components/auth/AuthShell.jsx
//
// KHUNG CHUNG của năm trang tài khoản (đăng nhập, đăng ký, xác minh email, quên và đặt lại mật khẩu) — thế giới "tờ
// chương trình": một tờ giấy viền mực đặt trên nền lụa ngà; ở màn lớn có thêm tấm bảng sơn then bên trái.
//
// Bản cũ: thẻ bo tròn, đầu trang kính mờ, tấm bảng có hai vệt chuyển sắc và ba vòng tròn biểu tượng. Nay góc vuông,
// không chuyển sắc, ba lời hứa in như ba dòng chương trình có đường kẻ.
// Ba dòng ở tấm bảng đều là chức năng CÓ THẬT của sàn (sơ đồ chỗ ngồi, ảnh 360°, theo dõi phòng trà) — không thêm
// dòng nào mà sản phẩm chưa làm được.
import { Link } from 'react-router-dom'
import Wordmark from '../brand/Wordmark'

const LOI_HUA = [
  'Chọn chỗ ngồi ngay trên sơ đồ phòng trà',
  'Xem phòng trà bằng ảnh 360° trước khi đặt vé',
  'Theo dõi phòng trà để biết khi có đêm diễn mới',
]

const TamBang = () => (
  <aside className="hidden lg:flex flex-col justify-between bg-board text-lamp p-10 xl:p-12">
    <div>
      <p className="font-display text-5xl xl:text-6xl leading-[1.08] text-lamp">Những đêm nhạc mộc, ngồi đúng chỗ mình chọn.</p>
    </div>
    <ul className="mt-12 border-t border-lamp/25">
      {LOI_HUA.map((t) => (
        <li key={t} className="py-3.5 border-b border-lamp/25 text-lamp-mute">{t}</li>
      ))}
    </ul>
  </aside>
)

const AuthShell = ({ children, withAside = false }) => (
  <div className="min-h-screen flex flex-col bg-stock text-ink">
    <header className="w-full border-b-2 border-ink bg-stock">
      <div className="max-w-[1440px] mx-auto px-4 sm:px-8 h-16 flex items-center">
        <Link to="/" aria-label="MusicLounge, về trang chủ" className="font-display text-2xl leading-none text-ink inline-flex items-center min-h-[44px]">
          <Wordmark />
        </Link>
      </div>
    </header>

    <main className="flex-1 flex items-start lg:items-center justify-center px-4 sm:px-8 py-8 lg:py-14">
      {withAside ? (
        <div className="w-full max-w-6xl grid grid-cols-1 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] border-2 border-ink shadow-lift">
          <TamBang />
          <div className="min-w-0 bg-card p-6 sm:p-10">{children}</div>
        </div>
      ) : (
        <div className="w-full max-w-md bg-card border-2 border-ink shadow-lift p-6 sm:p-10">{children}</div>
      )}
    </main>

    <footer className="border-t border-ink/20 px-4 py-5 text-center text-sm text-ink-mute">© 2026 MusicLounge</footer>
  </div>
)

export default AuthShell
