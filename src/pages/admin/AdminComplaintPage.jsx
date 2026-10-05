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
// - 04/10/2026 (MLACP-599): backend ĐÃ có `keyword` từ MLACP-502 → ô tìm kiếm nay tìm trên MỌI khiếu nại (phía máy chủ,
//   gõ xong 300ms mới gọi), không còn chỉ lọc trong trang. Thêm lọc theo NGÀY GỬI (createdFrom/createdTo, MLACP-598).
//   Lọc LOẠI VẤN ĐỀ vẫn chỉ trong trang hiện tại — backend chưa có tham số cho nó.
import { useState, useMemo } from 'react'
import { parseAsString, parseAsStringLiteral } from 'nuqs'
import dayjs from 'dayjs'
import toast from 'react-hot-toast'
import { getComplaintHistory } from '../../services/adminServices'
import { CATEGORY_CONFIG, STATUS_CONFIG } from '../../components/admin/complaints/ComplaintBadges'
import ComplaintsFilterBar from '../../components/admin/complaints/ComplaintsFilterBar'
import ComplaintsTable from '../../components/admin/complaints/ComplaintsTable'
import ComplaintDetailModal from '../../components/admin/complaints/ComplaintDetailModal'
import ResolveComplaintModal from '../../components/admin/complaints/ResolveComplaintModal'
import { useDanhSachMayChu } from '../../hooks/useDanhSachMayChu'
import { useOTimTre } from '../../hooks/useOTimTre'
import ChonKy from '../../components/bang/ChonKy'
import ChipBoLoc from '../../components/bang/ChipBoLoc'
import { khoangHopLe, nhanKhoang, thamSoApi } from '../../utils/kyBaoCao'
import PhanTrang from '../../components/bang/PhanTrang'
import KhungTai from '../../components/bang/KhungTai'
import { tenDoiTuong } from '../../utils/tenDoiTuong'

const BO_LOC = {
    trangThai: parseAsStringLiteral(Object.keys(STATUS_CONFIG)),
    q: parseAsString.withDefault(''),
    tu: parseAsString,
    den: parseAsString,
}
const goiKhieuNai = ({ trangThai, q, tu, den, ...trang }) => {
    const k = khoangHopLe(tu, den)
    const ngay = k ? thamSoApi(k.tu, k.den) : null
    return getComplaintHistory({
        ...trang,
        status: trangThai ? [trangThai] : undefined,
        keyword: q.trim() || undefined,
        createdFrom: ngay?.from,
        createdTo: ngay?.to,
    })
}

const AdminComplaintPage = () => {
    const ds = useDanhSachMayChu({ khoa: ['admin-khieu-nai'], goi: goiKhieuNai, boLoc: BO_LOC, coMacDinh: 20 })
    const statusFilter = ds.boLoc.trangThai ?? 'all'
    const setStatusFilter = (v) => ds.datBoLoc({ trangThai: v === 'all' ? null : v })

    // Tìm kiếm chạy phía máy chủ (keyword); loại vấn đề vẫn lọc trong trang hiện tại (BE chưa có tham số).
    const [searchQuery, setSearchQuery] = useOTimTre(ds, 'q')
    const [categoryFilter, setCategoryFilter] = useState('all')
    const kyLoc = khoangHopLe(ds.boLoc.tu, ds.boLoc.den)
    const cacChip = [
        ds.boLoc.q && { khoa: 'q', nhan: `Từ khoá: “${ds.boLoc.q}”`, xoa: () => { setSearchQuery(''); ds.datBoLoc({ q: null }) } },
        ds.boLoc.trangThai && { khoa: 'tt', nhan: `Trạng thái: ${STATUS_CONFIG[ds.boLoc.trangThai]?.label ?? ds.boLoc.trangThai}`, xoa: () => ds.datBoLoc({ trangThai: null }) },
        kyLoc && { khoa: 'ngay', nhan: `Ngày gửi: ${nhanKhoang(kyLoc.tu, kyLoc.den)}`, xoa: () => ds.datBoLoc({ tu: null, den: null }) },
    ].filter(Boolean)

    const [selectedComplaint, setSelectedComplaint] = useState(null)
    const [resolvingComplaint, setResolvingComplaint] = useState(null)

    const filteredComplaints = useMemo(
        () => ds.items.filter(c => categoryFilter === 'all' || c.category === categoryFilter),
        [ds.items, categoryFilter])

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
            tenDoiTuong(c),
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

            <ChonKy coTheBoTrong tenLoc="Ngày gửi" tu={kyLoc?.tu} den={kyLoc?.den}
                onChon={(k) => ds.datBoLoc({ tu: k?.tu ?? null, den: k?.den ?? null })} />
            <ChipBoLoc cacChip={cacChip} onXoaTatCa={() => { setSearchQuery(''); ds.xoaBoLoc() }} />

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