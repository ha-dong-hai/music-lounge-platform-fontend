// src/pages/NotFoundPage.jsx
//
// 30/09/2026: bỏ ô la bàn và các nút viền mảnh; trang nói ngắn điều đã xảy ra và đưa ra lối đi tiếp dạng danh sách
// liên kết cao 44px. Chỉ gợi ý những nơi vai trò này CHẮC CHẮN vào được (khớp guard trong AppRouter.jsx).
//
// MLACP-593: cùng trang này dùng cho trường hợp KHÔNG CÓ QUYỀN (`khongQuyen`), do ProtectedRoute hiện thay cho việc lặng lẽ
// đẩy về trang chủ — trước đây người gõ thẳng /admin bằng tài khoản nhân viên rơi về trang chủ mà không một lời báo, dễ
// tưởng hệ thống hỏng. Giữ nguyên URL để người dùng thấy mình vừa mở gì. Khung ngoài là <section> chứ không <main>, vì
// trang này còn hiện LỒNG trong khung khu phòng trà (đã có <main>).
import { Link } from 'react-router-dom'
import { useAuthStore } from '../store/useAuthStore'
import { useTranslation } from 'react-i18next'
import { k } from '../i18n'

const NotFoundPage = ({ khongQuyen = false }) => {
  const { t } = useTranslation()
  const role = useAuthStore((s) => s.user?.role)

  const loiVao = [
    { to: '/', nhan: k('Trang chủ') },
    { to: '/shows', nhan: k('Tất cả buổi diễn') },
  ]
  if (role) loiVao.push({ to: '/my-shows', nhan: k('Vé của tôi') })
  if (role === 'Owner' || role === 'Staff') loiVao.push({ to: '/owner', nhan: k('Khu vực phòng trà') })
  if (role === 'Admin') loiVao.push({ to: '/admin', nhan: k('Trang quản trị') })

  return (
    <section aria-labelledby="tieu-de-loi" className={`${khongQuyen ? 'min-h-[60vh]' : 'min-h-screen'} bg-stock text-ink px-4 sm:px-8 py-16 sm:py-24`}>
      <div className="max-w-2xl mx-auto">
        <p className="font-mono text-ink-mute">{khongQuyen ? t('Lỗi 403') : t('Lỗi 404')}</p>
        <h1 id="tieu-de-loi" className="text-[clamp(2.75rem,6vw,4.5rem)] leading-[1.05] mt-2">
          {khongQuyen ? t('Tài khoản này không mở được trang này.') : t('Không có trang này.')}
        </h1>
        <p className="mt-5 text-lg text-ink-soft max-w-[55ch]">
          {khongQuyen
            ? t('Trang bạn vừa mở dành cho vai trò khác trong hệ thống. Nếu bạn cần dùng trang này, hãy đăng nhập bằng đúng tài khoản hoặc nhờ người quản lý cấp quyền.')
            : t('Địa chỉ bạn vừa mở không tồn tại, hoặc trang đã được chuyển đi nơi khác. Nếu bạn bấm vào một đường dẫn trong MusicLounge mà gặp trang này, đó là một liên kết hỏng — hãy báo lại cho chúng tôi.')}
        </p>
        <nav aria-label={t('Đi tiếp')} className="mt-10">
          <ul className="border-y-2 border-ink divide-y divide-ink/20">
            {loiVao.map(({ to, nhan }) => (
              <li key={to}>
                <Link to={to} className="flex items-center justify-between min-h-[56px] px-1 text-xl font-display hover:bg-card">
                  {t(nhan)}<span aria-hidden="true">→</span>
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      </div>
    </section>
  )
}

export default NotFoundPage
