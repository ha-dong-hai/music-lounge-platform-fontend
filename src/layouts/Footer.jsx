// src/layouts/Footer.jsx
//
// GHI CHÚ CHO ĐỘI FE:
// - "Gửi khiếu nại" phải ở ĐÂY chứ không chỉ trong menu người dùng: trang khiếu nại là trang CÔNG
//   KHAI, khách chưa đăng nhập cũng gửi được (khi đó để lại số điện thoại). Trước đây route
//   /complaints không có bất kỳ đường dẫn nào trỏ tới — dựng xong rồi không ai tìm ra.
// - Ba liên kết Giới thiệu / Điều khoản / Bảo mật vẫn là href="#" vì CHƯA CÓ trang tương ứng. Giữ
//   nguyên thay vì trỏ bừa: một liên kết dẫn tới trang 404 còn tệ hơn một liên kết chưa bấm được.
//   Khi nào có trang thì đổi sang <Link>.
// - Khối này cố ý dùng nền espresso: đóng trang bằng một mảng màu đậm ấm giúp mắt có điểm dừng,
//   và giữ được chất "phòng trà" mà không làm cả trang tối.
import { Link } from 'react-router-dom'
import { Mail, Phone } from 'lucide-react'
import { useTranslation } from 'react-i18next'

const linkCls =
  'inline-flex items-center min-h-[44px] text-cream-mute hover:text-brand-on-dark transition-colors focus-visible:outline-brand-on-dark'

const Footer = () => {
  const { t } = useTranslation()
  return (
    <footer className="bg-espresso text-cream-mute mt-16">
      <div className="max-w-[1600px] mx-auto px-4 sm:px-6 py-12 grid grid-cols-1 md:grid-cols-3 gap-10">
        <div>
          <p className="font-display text-2xl text-cream mb-3">
            Phòng Trà <span className="text-brand-on-dark">Sài Gòn</span>
          </p>
          <p className="text-sm leading-relaxed max-w-sm">
            {t('footer.tagline')}
          </p>
        </div>

        <nav aria-label={t('footer.links')}>
          <h3 className="text-sm font-semibold uppercase tracking-widest text-cream mb-3 font-sans">{t('footer.explore')}</h3>
          <ul className="text-sm">
            <li><Link to="/shows" className={linkCls}>{t('footer.shows')}</Link></li>
            <li><Link to="/lounges" className={linkCls}>{t('footer.lounges')}</Link></li>
            <li><Link to="/complaints" className={linkCls}>{t('footer.complaints')}</Link></li>
            <li><a href="#" className={linkCls}>{t('footer.about')}</a></li>
            <li><a href="#" className={linkCls}>{t('footer.terms')}</a></li>
            <li><a href="#" className={linkCls}>{t('footer.privacy')}</a></li>
          </ul>
        </nav>

        <div>
          <h3 className="text-sm font-semibold uppercase tracking-widest text-cream mb-3 font-sans">{t('footer.contact')}</h3>
          <ul className="text-sm space-y-2">
            <li className="flex items-center gap-2">
              <Mail size={16} className="text-brand-on-dark" aria-hidden="true" />
              <a href="mailto:support@musiclounge.com" className={linkCls}>support@musiclounge.com</a>
            </li>
            <li className="flex items-center gap-2">
              <Phone size={16} className="text-brand-on-dark" aria-hidden="true" />
              <a href="tel:19001234" className={linkCls}>1900 1234</a>
            </li>
          </ul>
        </div>
      </div>

      <div className="border-t border-cream/10">
        <p className="max-w-[1600px] mx-auto px-4 sm:px-6 py-5 text-xs text-cream-mute text-center">
          {t('footer.rights', { year: new Date().getFullYear() })}
        </p>
      </div>
    </footer>
  )
}

export default Footer
