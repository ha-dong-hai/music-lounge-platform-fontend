// src/components/lounge/LoungeSidebar.jsx

import { MapPin, Phone, Mail, Users, Heart } from 'lucide-react'

const LoungeSidebar = () => {
  return (
    <div className="space-y-10">
      <div className="bg-gray-900 border border-gray-800 rounded-xl p-6 space-y-4">
        <div>
          <h3 className="text-sm font-bold text-[#C3B665] mb-1">Địa chỉ</h3>
          <p className="text-gray-400 flex items-center gap-3"><MapPin size={12} />123 Lê Lợi, Quận 1, TP. Hồ Chí Minh</p>
        </div>
        <div className="border-t border-gray-800 pt-4">
          <h3 className="text-sm font-bold text-[#C3B665] mb-1">Giờ mở cửa</h3>
          <p className="text-gray-400">18:00 - 23:30 (T2 - CN)</p>
        </div>
        <div className="border-t border-gray-800 pt-4">
          <h3 className="text-sm font-bold text-[#C3B665] mb-1">Liên hệ</h3>
          <p className="text-gray-400 flex items-center gap-3"><Phone size={12} />0909 123 456</p>
          <p className="text-gray-400 flex items-center gap-3"><Mail size={12} />info@musiclounge.vn</p>
        </div>
      </div>

      <div className="bg-gray-900 border border-gray-800 rounded-xl p-2 flex flex-col gap-2 items-center justify-center text-center">
        <h3 className="text-sm font-bold text-[#C3B665] mb-2 text-xl flex items-center gap-2"> <Users /> Cộng đồng</h3>
        <Heart size={35} className="text-red-500 font-bold transition-colors duration-300" />
        <div className="mb-5">
          <div>
            <p className="text-white font-bold text-lg leading-tight">1,245</p>
            <p className="text-gray-500 text-sm font-bold">Người đang theo dõi phòng trà</p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default LoungeSidebar