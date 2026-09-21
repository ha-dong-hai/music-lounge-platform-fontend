// src/pages/NotFoundPage.jsx
//
// GHI CHÚ CHO ĐỘI FE:
// - Trước đây router KHÔNG có route bắt-tất-cả, nên mọi URL sai đều ra TRANG TRẮNG HOÀN TOÀN —
//   không chữ, không nút, không cách nào đi tiếp ngoài nút Back của trình duyệt. Người dùng gặp
//   trang trắng sẽ nghĩ hệ thống hỏng, chứ không nghĩ mình gõ sai địa chỉ.
// - Trang này cố tình KHÔNG đoán ý người dùng (kiểu "có phải bạn muốn tìm..."): đoán sai thì dẫn
//   người ta đi xa hơn. Thay vào đó đưa vài lối vào chắc chắn đúng cho mọi vai trò.
// - Lối vào bày ra THEO VAI TRÒ đang đăng nhập: đưa một khán giả tới trang quản trị là tạo một
//   đường dẫn mà bấm vào sẽ bị đẩy về trang chủ — tức một trang trắng thứ hai, chỉ khác kiểu.
import { Link } from 'react-router-dom'
import { Compass, Home, Search, Ticket, LayoutDashboard, Store } from 'lucide-react'
import { useAuthStore } from '../store/useAuthStore'

const NotFoundPage = () => {
  const role = useAuthStore((s) => s.user?.role)

  // Chỉ gợi ý những nơi vai trò này CHẮC CHẮN vào được (khớp guard trong AppRouter.jsx).
  const loiVao = [
    { to: '/', nhan: 'Trang chủ', icon: Home },
    { to: '/shows', nhan: 'Tất cả buổi diễn', icon: Search },
  ]
  if (role) loiVao.push({ to: '/my-shows', nhan: 'Vé của tôi', icon: Ticket })
  if (role === 'Owner' || role === 'Staff') loiVao.push({ to: '/owner', nhan: 'Khu vực phòng trà', icon: Store })
  if (role === 'Admin') loiVao.push({ to: '/admin', nhan: 'Trang quản trị', icon: LayoutDashboard })

  return (
    <div className="min-h-screen bg-black text-white flex items-center justify-center px-6 py-16">
      <div className="max-w-lg w-full text-center">
        <div className="w-16 h-16 mx-auto rounded-full bg-gray-900 border border-gray-800 flex items-center justify-center">
          <Compass size={30} className="text-[#C3B665]" />
        </div>

        <p className="text-sm text-gray-600 mt-6 tracking-widest">404</p>
        <h1 className="text-2xl sm:text-3xl font-bold mt-1">Không có trang này</h1>
        <p className="text-sm text-gray-500 mt-3 leading-relaxed">
          Địa chỉ bạn vừa mở không tồn tại, hoặc trang đã được chuyển đi nơi khác. Nếu bạn bấm vào
          một đường dẫn trong hệ thống mà gặp trang này, hãy báo lại — đó là một liên kết hỏng.
        </p>

        <div className="mt-8 flex flex-wrap justify-center gap-3">
          {loiVao.map(({ to, nhan, icon: Icon }) => (
            <Link key={to} to={to}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg border border-gray-700 text-gray-300 text-sm font-bold hover:bg-gray-800 hover:text-white transition-colors">
              <Icon size={16} /> {nhan}
            </Link>
          ))}
        </div>
      </div>
    </div>
  )
}

export default NotFoundPage
