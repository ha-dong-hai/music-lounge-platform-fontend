// src/layouts/Footer.jsx
//
// GHI CHÚ CHO ĐỘI FE:
// - "Gửi khiếu nại" phải ở ĐÂY chứ không chỉ trong menu người dùng: trang khiếu nại là trang CÔNG
//   KHAI, khách chưa đăng nhập cũng gửi được (khi đó để lại số điện thoại). Trước đây route
//   /complaints không có bất kỳ đường dẫn nào trỏ tới — dựng xong rồi không ai tìm ra.
// - ĐÃ BỎ (30/09): số điện thoại "1900 1234" và email support@musiclounge.com — không ai xác nhận hai đầu mối
//   này có thật; in ra là bịa một kênh liên hệ (nguyên tắc: mọi chữ truy được về dữ liệu thật). Kênh liên hệ có
//   thật duy nhất của nền tảng là trang khiếu nại công khai.
// - ĐÃ BỎ ba liên kết href="#" Giới thiệu / Điều khoản / Bảo mật: chưa có trang tương ứng. Nội dung Điều khoản và
//   Chính sách bảo mật đang chờ chủ dự án cung cấp (PRODUCT.md) — có trang thì thêm lại bằng <Link>.
// - Khối mực tím than đóng trang, chữ màu ánh đèn — cùng vật liệu với bảng giờ diễn.
import { Link } from 'react-router-dom'
import Wordmark from '../components/brand/Wordmark'

const linkCls =
  'inline-flex items-center min-h-[44px] text-cream-mute hover:text-lamp underline-offset-4 hover:underline transition-colors focus-visible:outline-lamp'

const Footer = () => {
  return (
    <footer className="bg-espresso text-cream-mute">
      <div className="max-w-[1440px] mx-auto px-4 sm:px-8 py-14 grid grid-cols-1 md:grid-cols-[1.4fr_1fr_1fr] gap-10">
        <div>
          <p className="text-4xl mb-3"><Wordmark tone="lamp" /></p>
          <p className="text-sm leading-relaxed max-w-sm">
            Sàn đặt vé phòng trà Sài Gòn. Tiền vé được giữ hộ tới khi buổi diễn diễn ra mới chuyển cho phòng trà.
          </p>
        </div>

        <nav aria-label="Khám phá">
          <h3 className="text-base text-cream mb-2">Khám phá</h3>
          <ul className="text-sm">
            <li><Link to="/shows" className={linkCls}>Buổi diễn</Link></li>
            <li><Link to="/lounges" className={linkCls}>Phòng trà</Link></li>
            {/* Cửa công khai của sao kê tiền ủng hộ — chân trang có mặt trên MỌI trang công khai. */}
            <li><Link to="/minh-bach" className={linkCls}>Minh bạch tiền ủng hộ</Link></li>
          </ul>
        </nav>

        <nav aria-label="Hỗ trợ">
          <h3 className="text-base text-cream mb-2">Hỗ trợ</h3>
          <ul className="text-sm">
            <li><Link to="/complaints" className={linkCls}>Gửi và tra cứu khiếu nại</Link></li>
            <li><Link to="/my-shows" className={linkCls}>Vé của tôi</Link></li>
          </ul>
        </nav>
      </div>

      <div className="border-t border-cream/15">
        <p className="max-w-[1440px] mx-auto px-4 sm:px-8 py-5 text-xs text-cream-mute">
          © {new Date().getFullYear()} MusicLounge
        </p>
      </div>
    </footer>
  )
}

export default Footer
