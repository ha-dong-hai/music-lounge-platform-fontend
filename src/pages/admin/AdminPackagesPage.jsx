// src/pages/admin/AdminPackagesPage.jsx
import { useState, useEffect } from 'react'
import { Plus, Loader2, Box } from 'lucide-react'
import toast from 'react-hot-toast'
import { getPackages, createPackage, updatePackage } from '../../services/packageServices'
import { PackageCard, HiddenPackageCard } from '../../components/admin/packages/PackageCard'
import PackageFormModal from '../../components/admin/packages/PackageFormModal'

const AdminPackagesPage = () => {
  const [packages, setPackages] = useState([])
  const [isLoading, setIsLoading] = useState(true)

  // Modal state: currentPkg = null → tạo mới, có object → đang sửa
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [currentPkg, setCurrentPkg] = useState(null)
  const [isSaving, setIsSaving] = useState(false)

  // 1. FETCH PACKAGES
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

  // 2. MỞ MODAL
  const openCreateModal = () => {
    setCurrentPkg(null)
    setIsModalOpen(true)
  }

  const openEditModal = (pkg) => {
    setCurrentPkg(pkg)
    setIsModalOpen(true)
  }

  // 3. TOGGLE ẨN/HIỆN GÓI — gửi ĐẦY ĐỦ field để không bị reset hạn mức về 0
  const handleToggleStatus = async (pkg) => {
    try {
      const payload = {
        description: pkg.description,
        price: pkg.price,
        maxTicketsPerEvent: pkg.maxTicketsPerEvent,
        hasAiPoster: pkg.hasAiPoster,
        maxAiPostersPerMonth: pkg.maxAiPostersPerMonth,
        maxTourScenes: pkg.maxTourScenes,
        isActive: !pkg.isActive
      }
      await updatePackage(pkg.id, payload)
      toast.success(`Đã ${!pkg.isActive ? 'hiển thị' : 'ẩn'} gói ${pkg.name}`)
      setPackages(prev => prev.map(p => p.id === pkg.id ? { ...p, isActive: !pkg.isActive } : p))
    } catch (err) {
      toast.error('Thao tác thất bại')
    }
  }

  // 4. SUBMIT FORM (từ modal) — build payload theo contract từng loại rồi gọi API
  const handleFormSubmit = async (formData) => {
    setIsSaving(true)
    try {
      if (currentPkg) {
        // ===== UPDATE (PUT): BE không nhận name + billingCycle =====
        const payload = {
          description: formData.description,
          price: formData.price,
          maxTicketsPerEvent: Number(formData.maxTicketsPerEvent),
          hasAiPoster: formData.hasAiPoster,
          maxAiPostersPerMonth: formData.hasAiPoster ? Number(formData.maxAiPostersPerMonth) : 0,
          maxTourScenes: Number(formData.maxTourScenes),
          isActive: formData.isActive
        }
        const res = await updatePackage(currentPkg.id, payload)
        if (res.success) {
          setPackages(prev => prev.map(p => p.id === currentPkg.id ? { ...p, ...payload } : p))
          toast.success('Cập nhật gói Package thành công!')
          setIsModalOpen(false)
        } else {
          toast.error(res.message || 'Thao tác thất bại.')
        }
      } else {
        // ===== CREATE (POST): không cần isActive (BE tự default true) =====
        const payload = {
          name: formData.name,
          description: formData.description,
          price: formData.price,
          billingCycle: formData.billingCycle,
          maxTicketsPerEvent: Number(formData.maxTicketsPerEvent),
          hasAiPoster: formData.hasAiPoster,
          maxAiPostersPerMonth: formData.hasAiPoster ? Number(formData.maxAiPostersPerMonth) : 0,
          maxTourScenes: Number(formData.maxTourScenes)
        }
        const res = await createPackage(payload)
        if (res.success) {
          setPackages(prev => [...prev, res.data])
          toast.success('Tạo gói Package mới thành công!')
          setIsModalOpen(false)
        } else {
          toast.error(res.message || 'Thao tác thất bại.')
        }
      }
    } catch (err) {
      console.error(err)
      toast.error('Thao tác thất bại. Vui lòng thử lại.')
    } finally {
      setIsSaving(false)
    }
  }

  const activePkgs = packages.filter(p => p.isActive)
  const hiddenPkgs = packages.filter(p => !p.isActive)

  // ===== LOADING =====
  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 size={32} className="animate-spin text-[#C3B665]" />
      </div>
    )
  }

  // ===== EMPTY: chưa có gói nào cả =====
  if (packages.length === 0) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white mb-1">Quản lý Gói Package</h1>
            <p className="text-gray-400 text-sm">Thiết lập các gói đăng ký cho Chủ phòng trà.</p>
          </div>
          <button onClick={openCreateModal} className="flex items-center gap-2 bg-[#C3B665] text-black px-4 py-2.5 rounded-lg font-bold text-sm hover:bg-[#d4c87f] transition-colors">
            <Plus size={18} /> Tạo gói mới
          </button>
        </div>
        <div className="bg-gray-900/50 border border-dashed border-gray-800 rounded-2xl py-20 flex flex-col items-center justify-center text-center">
          <div className="w-16 h-16 rounded-2xl bg-[#C3B665]/10 border border-[#C3B665]/25 flex items-center justify-center mb-4">
            <Box size={28} className="text-[#C3B665]" />
          </div>
          <p className="text-gray-300 font-semibold mb-1">Chưa có gói Package nào</p>
          <p className="text-gray-500 text-sm mb-5">Tạo gói đầu tiên để Chủ phòng trà có thể đăng ký.</p>
          <button onClick={openCreateModal} className="flex items-center gap-2 bg-[#C3B665] text-black px-4 py-2.5 rounded-lg font-bold text-sm hover:bg-[#d4c87f] transition-colors">
            <Plus size={16} /> Tạo gói đầu tiên
          </button>
        </div>
        <PackageFormModal
          isOpen={isModalOpen}
          editingPkg={currentPkg}
          isSaving={isSaving}
          onClose={() => setIsModalOpen(false)}
          onSubmit={handleFormSubmit}
        />
      </div>
    )
  }

  return (
    <div className="space-y-8">

      {/* ===== HEADER ===== */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white mb-1">Quản lý Gói Package</h1>
          <p className="text-gray-400 text-sm">Thiết lập các gói đăng ký cho Chủ phòng trà.</p>
        </div>
        <button
          onClick={openCreateModal}
          className="flex items-center gap-2 bg-[#C3B665] text-black px-4 py-2.5 rounded-lg font-bold text-sm hover:bg-[#d4c87f] transition-all shadow-lg shadow-[#C3B665]/20 hover:shadow-[#C3B665]/30 hover:-translate-y-0.5 flex-shrink-0"
        >
          <Plus size={18} /> Tạo gói mới
        </button>
      </div>

      {/* ===== SECTION 1: ĐANG HIỂN THỊ ===== */}
      <section className="space-y-4">
        <div className="flex items-center gap-2.5">
          <span className="w-2 h-2 rounded-full bg-green-400" />
          <h2 className="text-sm font-bold text-gray-300 uppercase tracking-wide">Đang hiển thị</h2>
          <span className="px-2 py-0.5 rounded-full bg-green-500/10 border border-green-500/25 text-green-400 text-xs font-bold">
            {activePkgs.length}
          </span>
        </div>

        {activePkgs.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {activePkgs.map(pkg => (
              <PackageCard key={pkg.id} pkg={pkg} onEdit={openEditModal} onToggleStatus={handleToggleStatus} />
            ))}
          </div>
        ) : (
          <div className="bg-gray-900/40 border border-dashed border-gray-800 rounded-xl p-8 text-center text-gray-500 text-sm">
            Không có gói nào đang hiển thị. Chủ phòng trà sẽ không thấy gói nào để đăng ký.
          </div>
        )}
      </section>

      {/* ===== SECTION 2: ĐANG ẨN (chỉ hiện khi có) ===== */}
      {hiddenPkgs.length > 0 && (
        <section className="space-y-4">
          <div className="flex items-center gap-2.5">
            <span className="w-2 h-2 rounded-full bg-red-400" />
            <h2 className="text-sm font-bold text-gray-400 uppercase tracking-wide">Đang ẩn</h2>
            <span className="px-2 py-0.5 rounded-full bg-red-500/10 border border-red-500/25 text-red-400 text-xs font-bold">
              {hiddenPkgs.length}
            </span>
            <span className="text-xs text-gray-600 ml-1">— không xuất hiện trên trang đăng ký</span>
          </div>
          <div className="space-y-3">
            {hiddenPkgs.map(pkg => (
              <HiddenPackageCard key={pkg.id} pkg={pkg} onEdit={openEditModal} onRestore={handleToggleStatus} />
            ))}
          </div>
        </section>
      )}

      {/* MODAL */}
      <PackageFormModal
        isOpen={isModalOpen}
        editingPkg={currentPkg}
        isSaving={isSaving}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleFormSubmit}
      />
    </div>
  )
}

export default AdminPackagesPage