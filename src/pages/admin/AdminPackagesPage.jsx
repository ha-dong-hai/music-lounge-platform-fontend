// src/pages/admin/AdminPackagesPage.jsx
import { useState, useEffect } from 'react'
import { Plus, Loader2, Box } from 'lucide-react'
import toast from 'react-hot-toast'
import { getPackages, createPackage, updatePackage } from '../../services/packageServices'
import { PackageCard, HiddenPackageCard } from '../../components/admin/packages/PackageCard'
import PackageFormModal from '../../components/admin/packages/PackageFormModal'
import ConfirmModal from '../../components/shared/ConfirmModal'

const AdminPackagesPage = () => {
  const [packages, setPackages] = useState([])
  const [isLoading, setIsLoading] = useState(true)

  const [confirmPkg, setConfirmPkg] = useState(null) // package sắp hide/unhide

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
        toast.error('Không tải được danh sách gói.')
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
    setConfirmPkg(pkg)
  }

  // User đồng ý → thực thi (payload đầy đủ field để không reset hạn mức về 0)
  const executeToggleStatus = async () => {
    if (!confirmPkg) return
    const pkg = confirmPkg
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
      toast.success(`${!pkg.isActive ? 'Đã hiện' : 'Đã ẩn'} gói ${pkg.name}`)
      setPackages(prev => prev.map(p => p.id === pkg.id ? { ...p, isActive: !pkg.isActive } : p))
      setConfirmPkg(null)
    } catch (err) {
      toast.error('Thao tác không thành công.')
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
          toast.success('Đã cập nhật gói.')
          setIsModalOpen(false)
        } else {
          toast.error(res.message || 'Thao tác không thành công.')
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
        if (!res.success) {
          toast.success(res.message || 'Thao tác không thành công.')
          return
        } 
      }

      const listRes = await getPackages(false)
      if (listRes.success) {
        setPackages(listRes.data)
        toast.success(currentPkg ? 'Đã cập nhật gói.' : 'Đã tạo gói mới.')
        setIsModalOpen(false)
      } else {
        toast.error('Đã lưu, nhưng chưa tải lại được danh sách.')
      }

    } catch (err) {
      console.error(err)
      toast.error('Thao tác không thành công. Vui lòng thử lại.')
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
        <Loader2 size={32} className="animate-spin text-ink" />
      </div>
    )
  }

  // ===== EMPTY: chưa có gói nào cả =====
  if (packages.length === 0) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl text-ink mb-1">Quản lý gói dịch vụ</h1>
            <p className="text-ink-soft text-sm">Thiết lập các gói dịch vụ cho chủ phòng trà.</p>
          </div>
          <button onClick={openCreateModal} className="flex items-center gap-2 bg-ink text-lamp px-4 py-2.5 font-bold text-sm hover:bg-board transition-colors">
            <Plus size={18} /> Tạo gói
          </button>
        </div>
        <div className="bg-card/50 border border-dashed border-line py-20 flex flex-col items-center justify-center text-center">
          <div className="w-16 h-16 bg-ink/10 border border-ink/25 flex items-center justify-center mb-4">
            <Box size={28} className="text-ink" />
          </div>
          <p className="text-ink-soft font-semibold mb-1">Chưa có gói dịch vụ nào.</p>
          <p className="text-ink-mute text-sm mb-5">Tạo gói đầu tiên để chủ phòng trà đăng ký.</p>
          <button onClick={openCreateModal} className="flex items-center gap-2 bg-ink text-lamp px-4 py-2.5 font-bold text-sm hover:bg-board transition-colors">
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
          <h1 className="text-4xl text-ink mb-1">Quản lý gói dịch vụ</h1>
          <p className="text-ink-soft text-sm">Thiết lập các gói đăng ký dịch vụ.</p>
        </div>
        <button
          onClick={openCreateModal}
          className="flex items-center gap-2 bg-ink text-lamp px-4 py-2.5 font-bold text-sm hover:bg-board transition-all shadow-soft shadow-ink/20 hover:shadow-ink/30 hover:-translate-y-0.5 flex-shrink-0"
        >
          <Plus size={18} /> Tạo gói
        </button>
      </div>

      {/* ===== SECTION 1: ĐANG HIỂN THỊ ===== */}
      <section className="space-y-4">
        <div className="flex items-center gap-2.5">
          <span className="w-2 h-2 bg-success" />
          <h2 className="font-sans font-bold text-sm text-ink-soft">Đang hiển thị</h2>
          <span className="px-2 py-0.5 bg-success/10 border border-success/25 text-success text-xs font-bold">
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
          <div className="bg-card/40 border border-dashed border-line p-8 text-center text-ink-mute text-sm">
            Chưa có gói nào đang hiển thị. 
          </div>
        )}
      </section>

      {/* ===== SECTION 2: ĐANG ẨN (chỉ hiện khi có) ===== */}
      {hiddenPkgs.length > 0 && (
        <section className="space-y-4">
          <div className="flex items-center gap-2.5">
            <span className="w-2 h-2 bg-danger" />
            <h2 className="font-sans font-bold text-sm text-ink-soft">Đang ẩn</h2>
            <span className="px-2 py-0.5 bg-danger/10 border border-danger/25 text-danger text-xs font-bold">
              {hiddenPkgs.length}
            </span>
            <span className="text-xs text-ink-mute ml-1">— Không hiện ở trang đăng ký</span>
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

      {/* CONFIRM HIDE/UNHIDE MODAL */}
      <ConfirmModal
        isOpen={!!confirmPkg}
        title={confirmPkg?.isActive ? 'Ẩn gói này?' : 'Hiện lại gói này?'}
        message={
          confirmPkg?.isActive ? (
            <>
              <div>
                Gói "<span className="font-bold text-ink">{confirmPkg?.name}</span>" sẽ bị ẩn khỏi danh sách gói.
              </div>
              <div className="text-xs text-ink mt-1.5">
                Owners using this plan keep their current benefits, but can't renew it.
              </div>
            </>
          ) : (
            <>
              <div>
                Gói "<span className="font-bold text-ink">{confirmPkg?.name}</span>" sẽ hiện lại trong danh sách gói.
              </div>
              <div className="text-xs text-ink-mute mt-1.5">
                Owners can select this plan when subscribing.
              </div>
            </>
          )
        }
        confirmText={confirmPkg?.isActive ? 'Hide' : 'Show'}
        danger={confirmPkg?.isActive}
        isProcessing={false}
        onClose={() => setConfirmPkg(null)}
        onConfirm={executeToggleStatus}
      />

    </div>
  )
}

export default AdminPackagesPage