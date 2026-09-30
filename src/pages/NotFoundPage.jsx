// src/pages/NotFoundPage.jsx
//
// 30/09/2026: bỏ ô la bàn và các nút viền mảnh; trang nói ngắn điều đã xảy ra và đưa ra lối đi tiếp dạng danh sách
// liên kết cao 44px. Chỉ gợi ý những nơi vai trò này CHẮC CHẮN vào được (khớp guard trong AppRouter.jsx).
import { Link } from 'react-router-dom'
import { useAuthStore } from '../store/useAuthStore'

const NotFoundPage = () => {
  const role = useAuthStore((s) => s.user?.role)

  const loiVao = [
    { to: '/', nhan: 'Trang chủ' },
    { to: '/shows', nhan: 'Tất cả buổi diễn' },
  ]
  if (role) loiVao.push({ to: '/my-shows', nhan: 'Vé của tôi' })
  if (role === 'Owner' || role === 'Staff') loiVao.push({ to: '/owner', nhan: 'Khu vực phòng trà' })
  if (role === 'Admin') loiVao.push({ to: '/admin', nhan: 'Trang quản trị' })

  return (
    <main className="min-h-screen bg-stock text-ink px-4 sm:px-8 py-16 sm:py-24">
      <div className="max-w-2xl mx-auto">
        <p className="font-mono text-ink-mute">Lỗi 404</p>
        <h1 className="text-[clamp(2.75rem,6vw,4.5rem)] leading-[1.05] mt-2">Không có trang này.</h1>
        <p className="mt-5 text-lg text-ink-soft max-w-[55ch]">
          Địa chỉ bạn vừa mở không tồn tại, hoặc trang đã được chuyển đi nơi khác. Nếu bạn bấm vào một đường dẫn trong
          MusicLounge mà gặp trang này, đó là một liên kết hỏng — hãy báo lại cho chúng tôi.
        </p>
        <nav aria-label="Đi tiếp" className="mt-10">
          <ul className="border-y-2 border-ink divide-y divide-ink/20">
            {loiVao.map(({ to, nhan }) => (
              <li key={to}>
                <Link to={to} className="flex items-center justify-between min-h-[56px] px-1 text-xl font-display hover:bg-card">
                  {nhan}<span aria-hidden="true">→</span>
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      </div>
    </main>
  )
}

export default NotFoundPage
