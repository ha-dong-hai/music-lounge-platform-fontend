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
// - 01/10/2026: chuyển sang khung danh sách chung (hooks/useDanhSachMayChu + PhanTrang + KhungTai): trạng thái + trang lên
//   URL; tải lỗi thì báo "chưa tải được" (bản cũ toast rồi bảng trống); xử lý xong khiếu nại thì TẢI LẠI THẬT (bản cũ
//   chỉ đặt page=1 — đang ở trang 1 thì không đổi gì, khiếu nại vừa xử lý vẫn hiện trạng thái cũ); đổi bộ lọc gọi API
//   MỘT lần (bản cũ hai lần vì một effect đặt lại trang). Tìm kiếm + loại vấn đề vẫn lọc trong trang cho tới khi backend
//   có keyword (T-BE-12).
import { useState, useMemo } from 'react'
import { parseAsStringLiteral } from 'nuqs'
import dayjs from 'dayjs'
import toast from 'react-hot-toast'
import { getComplaintHistory } from '../../services/adminServices'
import { CATEGORY_CONFIG, STATUS_CONFIG, TARGET_TYPE_LABELS } from '../../components/admin/complaints/ComplaintBadges'
import ComplaintsFilterBar from '../../components/admin/complaints/ComplaintsFilterBar'
import ComplaintsTable from '../../components/admin/complaints/ComplaintsTable'
import ComplaintDetailModal from '../../components/admin/complaints/ComplaintDetailModal'
import ResolveComplaintModal from '../../components/admin/complaints/ResolveComplaintModal'
import { useDanhSachMayChu } from '../../hooks/useDanhSachMayChu'
import PhanTrang from '../../components/bang/PhanTrang'
import KhungTai from '../../components/bang/KhungTai'
import { maNgan } from '../../utils/format'

const BO_LOC = { trangThai: parseAsStringLiteral(Object.keys(STATUS_CONFIG)) }
const goiKhieuNai = ({ trangThai, ...q }) => getComplaintHistory({ ...q, status: trangThai ? [trangThai] : undefined })

const AdminComplaintPage = () => {
    const ds = useDanhSachMayChu({ khoa: ['admin-khieu-nai'], goi: goiKhieuNai, boLoc: BO_LOC, coMacDinh: 20 })
    const statusFilter = ds.boLoc.trangThai ?? 'all'
    const setStatusFilter = (v) => ds.datBoLoc({ trangThai: v === 'all' ? null : v })

    // tìm kiếm + danh mục lọc trong trang hiện tại (BE không có tham số cho chúng)
    const [searchQuery, setSearchQuery] = useState('')
    const [categoryFilter, setCategoryFilter] = useState('all')

    const [selectedComplaint, setSelectedComplaint] = useState(null)
    const [resolvingComplaint, setResolvingComplaint] = useState(null)

    const filteredComplaints = useMemo(() => {
        const q = searchQuery.toLowerCase().trim()
        return ds.items.filter(c => {
            const matchSearch = !q ||
                String(c.id).includes(q) ||
                (c.description || '').toLowerCase().includes(q) ||
                (c.contactPhone || '').includes(q)
            const matchCategory = categoryFilter === 'all' || c.category === categoryFilter
            return matchSearch && matchCategory
        })
    }, [ds.items, searchQuery, categoryFilter])

    // 4. EXPORT CSV các dòng đã lọc
    const handleExportCSV = () => {
        if (filteredComplaints.length === 0) {
            toast.error('Không có dữ liệu để xuất.')
            return
        }
        const header = ['Mã', 'Loại vấn đề', 'Đối tượng', 'Mô tả', 'Số liên hệ', 'Trạng thái', 'Ngày gửi']
        const rows = filteredComplaints.map(c => [
            c.id,
            CATEGORY_CONFIG[c.category]?.label || c.category,
            `${TARGET_TYPE_LABELS[c.targetType] || c.targetType} #${maNgan(c.targetId)}`,
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
        a.download = `khieu-nai_trang${ds.trang}_${dayjs().format('YYYYMMDD_HHmm')}.csv`
        a.click()
        URL.revokeObjectURL(url)
        toast.success('Đã xuất tệp CSV.')
    }

    return (
        <div className="space-y-6">

            {/* HEADER */}
            <div>
                <h1 className="text-4xl text-ink mb-1">Xử lý khiếu nại</h1>
                <p className="text-ink-soft text-sm">Khiếu nại do người dùng gửi.</p>
            </div>

            {/* FILTERS */}
            <ComplaintsFilterBar
                searchQuery={searchQuery} setSearchQuery={setSearchQuery}
                categoryFilter={categoryFilter} setCategoryFilter={setCategoryFilter}
                statusFilter={statusFilter} setStatusFilter={setStatusFilter}
                onExportCSV={handleExportCSV}
            />

            {/* TABLE */}
            <KhungTai loi={ds.loi} taiLai={ds.taiLai} tenVung="danh sách khiếu nại">
                <div className="space-y-3">
                    <PhanTrang ds={ds} tenDonVi="khiếu nại" idDanhSach="bang-khieu-nai" />
                    <ComplaintsTable
                        complaints={filteredComplaints}
                        isLoading={ds.dangTai}
                        onViewDetail={setSelectedComplaint}
                    />
                    {ds.soTrang > 1 && <PhanTrang ds={ds} tenDonVi="khiếu nại" idDanhSach="bang-khieu-nai" />}
                </div>
            </KhungTai>

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
                    onSaved={() => ds.taiLai()}
                />
            )}
        </div>
    )
}

export default AdminComplaintPage