// src/pages/admin/AdminPackagesPage.jsx
import { useState, useEffect } from 'react'
import { Plus, Pencil, Trash2, Check, X, AlertTriangle, Loader2 } from 'lucide-react'
import { adminService } from '../../services/adminService'
import toast from 'react-hot-toast'

const AdminPackagesPage = () => {
  const [packages, setPackages] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [currentPkg, setCurrentPkg] = useState(null)
  const [formData, setFormData] = useState({
    name: '', priceValue: 0, duration: 'Monthly', features: [''], description: '', maxShows: 5,
  })
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState(null)

  // Fetch packages from API
  const fetchPackages = async () => {
    setIsLoading(true)
    try {
      const res = await adminService.getPackages()
      if (res?.success || res?.data) {
        const rawData = res.data
        const items = Array.isArray(rawData) ? rawData : (rawData?.items || [])
        setPackages(items.map(p => ({
          id: p.id,
          name: p.name,
          priceValue: p.price || p.pricePerMonth || 0,
          duration: p.billingCycle || p.duration || 'Monthly',
          features: Array.isArray(p.features) && p.features.length > 0
            ? p.features
            : (p.description ? p.description.split('. ').filter(Boolean) : ['Gói cơ bản']),
          description: p.description || '',
          maxShows: p.maxShows || p.maxShowsPerMonth || 0,
          isActive: p.isActive !== false,
        })))
      }
    } catch (err) {
      console.error('Failed to fetch packages:', err)
      toast.error('Không thể tải danh sách gói')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => { fetchPackages() }, [])

  const handlePriceChange = (e) => {
    const rawValue = e.target.value.replace(/\D/g, '')
    const numberValue = rawValue ? Number(rawValue) : 0
    setFormData(prev => ({ ...prev, priceValue: numberValue }))
  }

  const openCreateModal = () => {
    setIsEditing(false)
    setCurrentPkg(null)
    setFormData({ name: '', priceValue: 0, duration: 'Monthly', features: [''], description: '', maxShows: 5 })
    setIsModalOpen(true)
  }

  const openEditModal = (pkg) => {
    setIsEditing(true)
    setCurrentPkg(pkg)
    setFormData({
      name: pkg.name,
      priceValue: pkg.priceValue,
      duration: pkg.duration,
      features: [...pkg.features],
      description: pkg.description || '',
      maxShows: pkg.maxShows || 5,
    })
    setIsModalOpen(true)
  }

  const handleDeleteClick = (pkg) => {
    setDeleteTarget(pkg)
    setIsDeleteModalOpen(true)
  }

  const confirmDelete = async () => {
    try {
      // No DELETE endpoint exists - use update to deactivate
      await adminService.updatePackage(deleteTarget.id, { isActive: false })
      setPackages(prev => prev.filter(p => p.id !== deleteTarget.id))
      toast.success('Đã vô hiệu hóa gói Package')
    } catch (err) {
      console.error('Deactivate failed:', err.response?.data)
      toast.error(err.response?.data?.error?.message || 'Vô hiệu hóa thất bại')
    }
    setIsDeleteModalOpen(false)
    setDeleteTarget(null)
  }

  const handleSave = async (e) => {
    e?.preventDefault()
    const cleanFeatures = formData.features.filter(f => f.trim() !== '')
    if (cleanFeatures.length === 0) {
      toast.error('Vui lòng thêm ít nhất 1 lợi ích')
      return
    }
    
    const payload = {
      name: formData.name,
      description: formData.description || cleanFeatures.join('. '),
      price: formData.priceValue,
      billingCycle: formData.duration,
      maxTicketsPerEvent: formData.maxShows || 100,
      hasAiPoster: false,
      maxAiPostersPerMonth: 0,
      maxTourScenes: 0,
    }

    try {
      if (isEditing) {
        await adminService.updatePackage(currentPkg.id, payload)
        toast.success('Cập nhật thành công!')
      } else {
        await adminService.createPackage(payload)
        toast.success('Tạo gói mới thành công!')
      }
      setIsModalOpen(false)
      fetchPackages()
    } catch (err) {
      console.error('Save failed:', err.response?.data)
      toast.error(err.response?.data?.error?.message || 'Thao tác thất bại')
    }
  }

  const handleFeatureChange = (index, value) => {
    const newFeatures = [...formData.features]
    newFeatures[index] = value
    setFormData(prev => ({ ...prev, features: newFeatures }))
  }

  const addFeature = () => {
    setFormData(prev => ({ ...prev, features: [...prev.features, ''] }))
  }

  const removeFeature = (index) => {
    setFormData(prev => ({ ...prev, features: prev.features.filter((_, i) => i !== index) }))
  }

  const durationLabels = { Monthly: 'Tháng', Quarterly: 'Quý', Yearly: 'Năm', Free: 'Miễn phí' }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 size={32} className="animate-spin text-[#C3B665]" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* HEADER */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white mb-1">Quản lý Gói Package</h1>
          <p className="text-gray-400 text-sm">Thiết lập các gói đăng ký cho Chủ phòng trà.</p>
        </div>
        <button onClick={openCreateModal}
          className="flex items-center gap-2 bg-[#C3B665] text-black px-4 py-2.5 rounded-lg font-bold text-sm hover:bg-[#d4c87f] transition-colors">
          <Plus size={18} /> Tạo gói mới
        </button>
      </div>

      {/* GRID */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {packages.map(pkg => (
          <div key={pkg.id} className="bg-gray-900 border border-gray-800 rounded-2xl p-6 flex flex-col relative group">
            <div className="absolute top-4 right-4 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
              <button onClick={() => openEditModal(pkg)} className="p-1.5 bg-gray-800 text-gray-400 hover:text-[#C3B665] rounded-md transition-colors">
                <Pencil size={14} />
              </button>
              <button onClick={() => handleDeleteClick(pkg)} className="p-1.5 bg-gray-800 text-gray-400 hover:text-red-400 rounded-md transition-colors">
                <Trash2 size={14} />
              </button>
            </div>

            <h3 className="text-xl font-bold text-white mb-1">{pkg.name}</h3>
            <p className="text-xs text-gray-500 mb-4">Loại hình: {durationLabels[pkg.duration] || pkg.duration}</p>

            <div className="mb-6 flex items-baseline gap-1">
              <span className="text-3xl font-bold text-[#C3B665]">{pkg.priceValue.toLocaleString('vi-VN')}</span>
              <span className="text-xl font-bold text-[#C3B665]">đ</span>
              {pkg.priceValue > 0 && <span className="text-gray-500 text-sm">/{(durationLabels[pkg.duration] || pkg.duration).toLowerCase()}</span>}
            </div>

            <div className="space-y-3 flex-1 border-t border-gray-800 pt-4">
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Lợi ích:</p>
              <ul className="space-y-2.5">
                {pkg.features.map((feat, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-gray-300">
                    <Check size={16} className="text-green-400 mt-0.5 flex-shrink-0" />
                    <span>{feat}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        ))}

        {packages.length === 0 && (
          <div className="col-span-full text-center py-12 text-gray-500">
            Chưa có gói Package nào. Bấm "Tạo gói mới" để bắt đầu.
          </div>
        )}
      </div>

      {/* CREATE/EDIT MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={() => setIsModalOpen(false)}></div>
          <div className="relative bg-gray-900 border border-gray-700 rounded-2xl w-full max-w-lg shadow-2xl flex flex-col max-h-[90vh]">
            <div className="flex justify-between items-center p-6 border-b border-gray-800">
              <h2 className="text-xl font-bold text-white">{isEditing ? 'Chỉnh sửa gói Package' : 'Tạo gói Package mới'}</h2>
              <button onClick={() => setIsModalOpen(false)} className="p-2 hover:bg-gray-800 rounded-full text-gray-400"><X size={20} /></button>
            </div>

            <form onSubmit={handleSave} className="p-6 space-y-5 overflow-y-auto">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-2">Tên gói</label>
                  <input type="text" required value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-4 py-2.5 bg-black border border-gray-800 rounded-lg text-white text-sm focus:outline-none focus:border-[#C3B665]/50" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-2">Giá (VNĐ)</label>
                  <div className="relative">
                    <input type="text" required inputMode="numeric"
                      value={formData.priceValue === 0 ? '' : formData.priceValue.toLocaleString('vi-VN')}
                      onChange={handlePriceChange} placeholder="0"
                      className="w-full pl-4 pr-8 py-2.5 bg-black border border-gray-800 rounded-lg text-white text-sm focus:outline-none focus:border-[#C3B665]/50" />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 text-sm">đ</span>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">Chu kỳ</label>
                <select value={formData.duration} onChange={e => setFormData({ ...formData, duration: e.target.value })}
                  className="w-full px-4 py-2.5 bg-black border border-gray-800 rounded-lg text-white text-sm focus:outline-none focus:border-[#C3B665]/50 cursor-pointer">
                  <option value="Monthly">Theo Tháng</option>
                  <option value="Quarterly">Theo Quý</option>
                  <option value="Yearly">Theo Năm</option>
                  <option value="Free">Miễn phí</option>
                </select>
              </div>

              {/* Features */}
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">Lợi ích</label>
                <div className="space-y-2">
                  {formData.features.map((feat, index) => (
                    <div key={index} className="flex items-center gap-2">
                      <input type="text" required placeholder={`Lợi ích ${index + 1}`} value={feat}
                        onChange={e => handleFeatureChange(index, e.target.value)}
                        className="flex-1 px-4 py-2 bg-black border border-gray-800 rounded-lg text-white text-sm focus:outline-none focus:border-[#C3B665]/50" />
                      {formData.features.length > 1 && (
                        <button type="button" onClick={() => removeFeature(index)}
                          className="p-2 bg-red-500/10 text-red-400 rounded-lg hover:bg-red-500/20 transition-colors"><X size={16} /></button>
                      )}
                    </div>
                  ))}
                </div>
                <button type="button" onClick={addFeature}
                  className="mt-3 flex items-center gap-1.5 text-sm text-[#C3B665] hover:text-[#d4c87f] font-medium transition-colors">
                  <Plus size={16} /> Thêm lợi ích
                </button>
              </div>
            </form>

            <div className="p-6 border-t border-gray-800 flex gap-3">
              <button onClick={() => setIsModalOpen(false)}
                className="flex-1 py-2.5 border border-gray-600 text-gray-300 rounded-lg font-medium hover:bg-gray-800 transition-colors">Hủy</button>
              <button onClick={handleSave}
                className="flex-1 py-2.5 bg-[#C3B665] text-black rounded-lg font-bold hover:bg-[#d4c87f] transition-colors">
                {isEditing ? 'Lưu thay đổi' : 'Tạo gói'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* DELETE MODAL */}
      {isDeleteModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={() => setIsDeleteModalOpen(false)}></div>
          <div className="relative bg-gray-900 border border-gray-700 rounded-2xl w-full max-w-md p-6 shadow-2xl text-center">
            <div className="w-16 h-16 mx-auto bg-red-500/10 rounded-full flex items-center justify-center mb-4 border border-red-500/30">
              <AlertTriangle size="28" className="text-red-500" />
            </div>
            <h2 className="text-xl font-bold text-white mb-2">Xóa gói Package?</h2>
            <p className="text-gray-400 mb-6">
              Bạn có chắc chắn muốn xóa gói <strong className="text-white">{deleteTarget?.name}</strong>?
            </p>
            <div className="flex gap-3">
              <button onClick={() => setIsDeleteModalOpen(false)}
                className="flex-1 py-2.5 border border-gray-600 text-gray-300 rounded-lg font-medium hover:bg-gray-800 transition-colors">Hủy</button>
              <button onClick={confirmDelete}
                className="flex-1 py-2.5 bg-red-500 text-white rounded-lg font-bold hover:bg-red-600 transition-colors">Xóa</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default AdminPackagesPage