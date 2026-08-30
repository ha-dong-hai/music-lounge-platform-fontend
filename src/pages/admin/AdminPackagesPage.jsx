// src/pages/admin/AdminPackagesPage.jsx
import { useState, useEffect } from 'react'
import { Ticket, Sparkles, Loader2, Box } from 'lucide-react'
import toast from 'react-hot-toast'
import { getPackages } from '../../services/packageServices'

const AdminPackagesPage = () => {
  const [packages, setPackages] = useState([])
  const [isLoading, setIsLoading] = useState(true)

  // 1. FETCH PACKAGES TỪ BE
  useEffect(() => {
    const fetchPackages = async () => {
      setIsLoading(true)
      try {
        const res = await getPackages(false) // Lấy tất cả kể cả bị ẩn
        if (res.success) {
          setPackages(res.data)
        }
      } catch (err) {
        toast.error('Không thể tải danh sách gói Package')
      } finally {
        setIsLoading(false)
      }
    }
    fetchPackages()
  }, [])

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 size={32} className="animate-spin text-[#C3B665]" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white mb-1">Quản lý Gói Package</h1>
          <p className="text-gray-400 text-sm">Thiết lập các gói đăng ký cho Chủ phòng trà.</p>
        </div>
       
      </div>

      {/* GRID PACKAGES */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {packages.map(pkg => (
          <div key={pkg.id} className="bg-gray-900 border border-gray-800 rounded-2xl p-6 flex flex-col relative group">

            <div className="flex items-center gap-2 mb-1">
              <h3 className="text-xl font-bold text-white">{pkg.name}</h3>
              {!pkg.isActive && <span className="text-xs px-2 py-0.5 bg-red-500/10 text-red-400 border border-red-500/30 rounded-full">Đang ẩn</span>}
            </div>
            <p className="text-xs text-gray-500 mb-4">Loại hình: Đăng ký theo {pkg.billingCycle === 'Monthly' ? 'Tháng' : pkg.billingCycle}</p>
            
            <div className="mb-6 flex items-baseline gap-1">
                <span className="text-3xl font-bold text-[#C3B665]">{pkg.price?.toLocaleString('vi-VN')}</span>
                <span className="text-xl font-bold text-[#C3B665]">đ</span>
                {pkg.price > 0 && <span className="text-gray-500 text-sm">/tháng</span>}
            </div>

            <div className="space-y-3 flex-1 border-t border-gray-800 pt-4">
              <p className="text-sm text-gray-300 min-h-[40px]">{pkg.description || "Chưa có mô tả"}</p>
              
              <div className="flex items-center gap-2 text-sm text-gray-300">
                <Ticket size={16} className="text-[#C3B665] flex-shrink-0" />
                <span>Tối đa {pkg.maxTicketsPerEvent?.toLocaleString('vi-VN')} vé / sự kiện</span>
              </div>

              {/* HIỂN THỊ HẠN MỨC POSTER AI */}
              {pkg.hasAiPoster && (
                <div className="flex items-center gap-2 text-sm text-gray-300">
                  <Sparkles size={16} className="text-[#C3B665] flex-shrink-0" />
                  <span>Tối đa {pkg.maxAiPostersPerMonth} poster AI / tháng</span>
                </div>
              )}

              {/* HIỂN THỊ HẠN MỨC TOUR ẢO */}
              {pkg.maxTourScenes > 0 && (
                <div className="flex items-center gap-2 text-sm text-gray-300">
                  <Box size={16} className="text-[#C3B665] flex-shrink-0" />
                  <span>Tối đa {pkg.maxTourScenes} tour ảo 360°</span>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

    </div>
  )
}

export default AdminPackagesPage