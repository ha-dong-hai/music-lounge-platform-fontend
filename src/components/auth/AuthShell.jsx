// src/components/auth/AuthShell.jsx
//
// Khung chung cho các trang tài khoản (đăng nhập, đăng ký, quên/đặt lại mật khẩu).
// Vì sao tách ra (docs/design/TRANG-CHU-BRIEF.md):
// - Trước đây mỗi trang tự dựng header/footer riêng, mỗi nơi một kiểu (logo có biểu tượng, chữ "Phòng Trà Sài Gòn •
//   MusicLounge", bóng đổ nặng shadow-2xl...). Khách đi qua 3-4 trang liên tiếp thấy như đổi sang app khác.
// - Tấm ảnh/tấm bảng bên trái CHỈ hiện từ màn lớn (lg). Trên điện thoại, người ta vào trang này để làm MỘT việc — đăng
//   nhập hay đăng ký — nên biểu mẫu phải lên ngay đầu màn hình, không bắt cuộn qua một tấm poster.
// - Ba ý ở tấm bảng bên trái là chức năng CÓ THẬT của nền tảng (chọn ghế trên sơ đồ, ảnh 360° phòng trà, theo dõi phòng
//   trà). Bản Stitch cũ ghi "Khởi lập 1972", "nhạc tờ nguyên bản", "Cà phê & Trà mạn ấm" — những điều nền tảng không có.
import { Link } from 'react-router-dom'
import { Armchair, Rotate3d, Heart } from 'lucide-react'

const POINTS = [
  { icon: Armchair, text: 'Chọn chỗ ngồi ngay trên sơ đồ phòng trà' },
  { icon: Rotate3d, text: 'Dạo quanh phòng trà bằng ảnh 360° trước khi đặt vé' },
  { icon: Heart, text: 'Theo dõi phòng trà và nghệ sĩ bạn yêu thích' },
]

const Aside = () => (
  <aside className="hidden lg:flex flex-col justify-between relative overflow-hidden rounded-2xl bg-espresso text-cream p-10 xl:p-12">
    {/* Ánh đèn sân khấu: hai vệt sáng ấm, không phải ảnh giả. */}
    <div
      aria-hidden="true"
      className="absolute inset-0 bg-[radial-gradient(ellipse_at_20%_10%,rgb(212_160_58/0.35),transparent_55%),radial-gradient(ellipse_at_90%_95%,rgb(138_90_18/0.45),transparent_50%)]"
    />
    <div className="relative">
      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-brand-on-dark mb-5">Phòng Trà Sài Gòn</p>
      <p className="font-display text-3xl xl:text-4xl leading-snug text-cream">
        Những đêm nhạc mộc, ngồi đúng chỗ mình chọn.
      </p>
    </div>
    <ul className="relative mt-12 space-y-4">
      {POINTS.map(({ icon: Icon, text }) => (
        <li key={text} className="flex items-center gap-3.5 text-cream-mute text-sm leading-relaxed">
          <span className="w-10 h-10 rounded-full bg-espresso-soft border border-cream/15 flex items-center justify-center flex-shrink-0">
            <Icon size={18} className="text-brand-on-dark" />
          </span>
          {text}
        </li>
      ))}
    </ul>
  </aside>
)

const AuthShell = ({ children, withAside = false }) => (
  <div className="min-h-screen flex flex-col bg-page text-ink">
    <header className="w-full border-b border-line bg-card/90 backdrop-blur-md sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-12 h-16 flex items-center">
        <Link
          to="/"
          aria-label="Phòng Trà Sài Gòn — về trang chủ"
          className="font-display text-xl sm:text-2xl leading-none tracking-tight text-ink inline-flex items-center min-h-[44px]"
        >
          Phòng Trà <span className="text-brand-text ml-1.5">Sài Gòn</span>
        </Link>
      </div>
    </header>

    <main className="flex-1 flex items-center justify-center px-4 sm:px-6 py-8 lg:py-14">
      {withAside ? (
        <div className="w-full max-w-6xl grid grid-cols-1 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] gap-8 lg:gap-12 items-stretch">
          <Aside />
          <div className="min-w-0 w-full max-w-xl mx-auto lg:max-w-none">
            <div className="bg-card border border-line rounded-2xl shadow-soft p-6 sm:p-10">{children}</div>
          </div>
        </div>
      ) : (
        <div className="w-full max-w-md">
          <div className="bg-card border border-line rounded-2xl shadow-soft p-6 sm:p-10">{children}</div>
        </div>
      )}
    </main>

    <footer className="border-t border-line bg-card/60 px-4 py-5 text-center text-xs text-ink-mute">
      © 2026 Phòng Trà Sài Gòn
    </footer>
  </div>
)

export default AuthShell
