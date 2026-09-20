// src/pages/admin/AdminComplaintPage.jsx
//
// GHI CHÚ CHO ĐỘI FE:
// - Trang gọi GET /admin/complaints (MLACP-462): MỌI trạng thái, không chỉ hàng đợi đang mở.
//   Trước đây gọi /complaints/pending nên không bao giờ thấy khiếu nại đã xử lý.
// - Lọc TRẠNG THÁI chạy phía server (tham số status) nên đúng trên toàn bộ dữ liệu.
//   Tìm kiếm + lọc danh mục vẫn chỉ lọc TRONG TRANG HIỆN TẠI, vì backend không có tham số cho
//   hai thứ đó — đừng hiểu nhầm là tìm trên mọi khiếu nại.
// - Backend GHI LOG mỗi lần gọi (mã Admin + bộ lọc) vì dữ liệu gồm số điện thoại người khiếu nại.
//   Chỉ tải lại khi đổi trang hoặc đổi trạng thái, không tải nền.
import { useState, useEffect, useMemo } from 'react'
import dayjs from 'dayjs'
import toast from 'react-hot-toast'
import { getComplaintHistory } from '../../services/adminServices'
import { CATEGORY_CONFIG, STATUS_CONFIG, TARGET_TYPE_LABELS } from '../../components/admin/complaints/ComplaintBadges'
import ComplaintsFilterBar from '../../components/admin/complaints/ComplaintsFilterBar'
import ComplaintsTable from '../../components/admin/complaints/ComplaintsTable'
import ComplaintDetailModal from '../../components/admin/complaints/ComplaintDetailModal'
import ResolveComplaintModal from '../../components/admin/complaints/ResolveComplaintModal'


const AdminComplaintPage = () => {
    const [complaints, setComplaints] = useState([])
    const [isLoading, setIsLoading] = useState(true)
    const [pagination, setPagination] = useState({ page: 1, totalPages: 1, totalCount: 0 })

    // status lọc phía server; tìm kiếm + danh mục lọc trong trang hiện tại (BE không có tham số cho chúng)
    const [searchQuery, setSearchQuery] = useState('')
    const [categoryFilter, setCategoryFilter] = useState('all')
    const [statusFilter, setStatusFilter] = useState('all')

    const [selectedComplaint, setSelectedComplaint] = useState(null)
    const [resolvingComplaint, setResolvingComplaint] = useState(null)

    // 1. FETCH (phân trang + lọc trạng thái phía server)
    // statusFilter PHẢI nằm trong deps: đang ở trang 1 mà đổi trạng thái thì page vẫn là 1, nếu chỉ
    // phụ thuộc page thì effect không chạy lại và bộ lọc không có tác dụng.
    // Cờ `cancelled`: đổi trạng thái khi đang ở trang 3 sẽ bắn hai request (trang 3 rồi trang 1);
    // bỏ kết quả của request cũ để nó về trễ cũng không ghi đè danh sách đúng.
    useEffect(() => {
        let cancelled = false
        const fetchComplaints = async () => {
            setIsLoading(true)
            try {
                const res = await getComplaintHistory({
                    page: pagination.page,
                    pageSize: 10,
                    status: statusFilter === 'all' ? undefined : [statusFilter],
                })
                if (!cancelled && res.success) {
                    setComplaints(res.data.items)
                    setPagination(prev => ({ ...prev, totalPages: res.data.totalPages, totalCount: res.data.totalCount }))
                }
            } catch (err) {
                if (cancelled) return
                console.error('Error loading complaints:', err)
                // 422 = tên trạng thái sai; message của backend liệt kê giá trị hợp lệ nên hiện thẳng.
                toast.error(err?.response?.data?.message || 'Unable to load complaint list')
            } finally {
                if (!cancelled) setIsLoading(false)
            }
        }
        fetchComplaints()
        return () => { cancelled = true }
    }, [pagination.page, statusFilter])

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

            return matchSearch && matchCategory
        })
    }, [complaints, searchQuery, categoryFilter])

    // 4. EXPORT CSV các dòng đã lọc
    const handleExportCSV = () => {
        if (filteredComplaints.length === 0) {
            toast.error('No data to export')
            return
        }
        const header = ['ID', 'Category', 'Target', 'Description', 'Contact number', 'Status', 'Create']
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
        toast.success('Exported CSV!')
    }

    return (
        <div className="space-y-6">

            {/* HEADER */}
            <div>
                <h1 className="text-2xl font-bold text-white mb-1">Report Management</h1>
                <p className="text-gray-400 text-sm">User complaints.</p>
            </div>

            {/* FILTERS */}
            <ComplaintsFilterBar
                searchQuery={searchQuery} setSearchQuery={setSearchQuery}
                categoryFilter={categoryFilter} setCategoryFilter={setCategoryFilter}
                statusFilter={statusFilter} setStatusFilter={setStatusFilter}
                onExportCSV={handleExportCSV}
            />

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
                    onResolve={(c) => { setSelectedComplaint(null); setResolvingComplaint(c) }}
                />
            )}

            {resolvingComplaint && (
                <ResolveComplaintModal
                    complaint={resolvingComplaint}
                    onClose={() => setResolvingComplaint(null)}
                    onSaved={() => setPagination((prev) => ({ ...prev, page: 1 }))}
                />
            )}
        </div>
    )
}

export default AdminComplaintPage