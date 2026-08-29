// src/layouts/Footer.jsx
const Footer = () => {
  return (
    <footer className="bg-black text-gray-300 py-12 border-t border-gray-800">
      <div className="max-w-[1600px] mx-auto px-6 grid grid-cols-1 md:grid-cols-3 gap-8">
        <div>
          <div className="flex items-center gap-2 mb-4">
            <img src="/logo.jpg" alt="TuneRoom" className="w-8 h-8 rounded-full object-cover" />
            <h2 className="text-2xl font-bold text-[#C3B665]">TuneRoom</h2>
          </div>
          <p className="text-sm text-gray-400">Nền tảng tìm kiếm và đặt vé sự kiện âm nhạc hàng đầu.</p>
        </div>
        <div>
          <h3 className="text-lg font-semibold text-white mb-4">Liên kết</h3>
          <ul className="space-y-2 text-sm">
            <li><a href="#" className="hover:text-white transition-colors">Về chúng tôi</a></li>
            <li><a href="#" className="hover:text-white transition-colors">Điều khoản sử dụng</a></li>
            <li><a href="#" className="hover:text-white transition-colors">Chính sách bảo mật</a></li>
          </ul>
        </div>
        <div>
          <h3 className="text-lg font-semibold text-white mb-4">Liên hệ</h3>
          <p className="text-sm mb-2">Email: support@velvetnote.com</p>
          <p className="text-sm">Hotline: 1900 1234</p>
        </div>
      </div>
      <div className="max-w-[1600px] mx-auto px-6 mt-12 pt-8 border-t border-gray-800 text-sm text-center">
        © {new Date().getFullYear()} TuneRoom. All rights reserved.
      </div>
    </footer>
  )
}

export default Footer