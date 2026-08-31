import { useState, useEffect, useMemo } from 'react'
import dayjs from 'dayjs'
import toast from 'react-hot-toast'
import { getAdminComplaints } from '../../services/adminService'
import { CATEGORY_CONFIG, STATUS_CONFIG, TARGET_TYPE_LABELS } from '../../components/admin/complaints/ComplaintBadges'
import ComplaintsTable from '../../components/admin/complaints/ComplaintsTable'
import ComplaintDetailModal from '../../components/admin/complaints/ComplaintDetailModal'

const AdminComplaintPage = () => {
  const [complaints, setComplaints] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [pagination, setPagination] = useState({ page: 1, totalPages: 1, totalCount: 0 })

  // Filter client-side (BE hiện chỉ hỗ trợ page/pageSize)
  const [searchQuery, setSearchQuery] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('all')
  const [statusFilter, setStatusFilter] = useState('all')

  const [selectedComplaint, setSelectedComplaint] = useState(null)

  // 1. FETCH (server-side pagination)
  useEffect(() => {
    const fetchComplaints = async () => {
      setIsLoading(true)
      try {
        const res = await getAdminComplaints({ page: pagination.page, pageSize: 10 })
        if (res.success) {
          setComplaints(res.data.items)
          setPagination(prev => ({ ...prev, totalPages: res.data.totalPages, totalCount: res.data.totalCount }))
        }
      } catch (err) {
        console.error('Lỗi tải complaints:', err)
        toast.error('Không thể tải danh sách khiếu nại')
      } finally {
        setIsLoading(false)
      }
    }
    fetchComplaints()
  }, [pagination.page])

  // 2. ĐỔI FILTER → VỀ TRANG 1
  useEffect(() => {
    setPagination(prev => ({ ...prev, page: 1 }))
  }, [searchQuery, categoryFilter, statusFilter])

  // 3. FILTER CLIENT-SIDE trong trang hiện tại
  const filteredComplaints = useMemo(() => {
    const q = searchQuery.toLowerCase().trim()
    return complaints.filter(c => {
      const matchSearch = !q ||
        String(c.id).includes(q) ||
        (c.description || '').toLowerCase().includes(q) ||
        (c.contactPhone || '').includes(q)

      const matchCategory = categoryFilter === 'all' || c.category === categoryFilter
      const matchStatus = statusFilter === 'all' || c.status === statusFilter

      return matchSearch && matchCategory && matchStatus
    })
  }, [complaints, searchQuery, categoryFilter, statusFilter])

  // 4. EXPORT CSV các dòng đã lọc
  const handleExportCSV = () => {
    if (filteredComplaints.length === 0) {
      toast.error('Không có dữ liệu để xuất')
      return
    }
    const header = ['ID', 'Danh mục', 'Đối tượng', 'Nội dung', 'SĐT liên hệ', 'Trạng thái', 'Thời gian tạo']
    const rows = filteredComplaints.map(c => [
      c.id,
      CATEGORY_CONFIG[c.category]?.label || c.category,
      `${TARGET_TYPE_LABELS[c.targetType] || c.targetType} #${c.targetId}`,
      (c.description || '').replace(/"/g, '""'),
      c.contactPhone || '',
      STATUS_CONFIG[c.status]?.label || c.status,
      dayjs(c.createdAt).format('HH:mm:ss DD/MM/YYYY'),
    ])
    const csv = [header, ...rows].map(r => r.map(v => `"${v}"`).join(',')).join('\n')

    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `complaints_page${pagination.page}_${dayjs().format('YYYYMMDD_HHmm')}.csv`
    a.click()
    URL.revokeObjectURL(url)
    toast.success('Đã xuất CSV!')
  }

  return (
    <div className="space-y-6">

      {/* HEADER */}
      <div>
        <h1 className="text-2xl font-bold text-white mb-1">Quản lý Khiếu nại</h1>
        <p className="text-gray-400 text-sm">Các khiếu nại từ người dùng về phòng trà, chương trình và nghệ sĩ.</p>
      </div>

      {/* TABLE */}
      <ComplaintsTable
        complaints={filteredComplaints}
        isLoading={isLoading}
        pagination={pagination}
        onViewDetail={setSelectedComplaint}
        onPageChange={(page) => setPagination(prev => ({ ...prev, page }))}
      />

      {/* MODAL */}
      {selectedComplaint && (
        <ComplaintDetailModal
          complaint={selectedComplaint}
          onClose={() => setSelectedComplaint(null)}
        />
      )}
    </div>
  )
}

export default AdminComplaintPage