// ADMIN › PHÒNG TRÀ. Chuyển sang khung danh sách chung 01/10/2026 (hooks/useDanhSachMayChu + PhanTrang + KhungTai).
// LỖI ĐÃ SỬA: bộ lọc "Tất cả" gửi lên không có status, mà GET /admin/venues/pending mặc định status=Pending
// (AdminController.GetVenueReviewQueue) — nên "Tất cả" thực ra CHỈ hiện hồ sơ chờ duyệt, phòng trà đã duyệt không bao giờ
// thấy. Backend chưa có cách liệt kê mọi trạng thái, nên bỏ lựa chọn "Tất cả"; mặc định "Chờ duyệt". ĐƯỜNG NÂNG CẤP: khi
// backend cho status tuỳ chọn (đề nghị gộp vào T-BE-12, kèm keyword) thì thêm lại "Tất cả" và ô tìm.
// Ô tìm trong trang đã bị ẩn từ trước (VenuesFilterBar) nên bỏ luôn phần lọc phía trình duyệt đi kèm.
import { useState, useEffect } from 'react'
import { parseAsStringLiteral } from 'nuqs'
import { getAdminVenues } from '../../services/adminServices'
import VenuesStatsCards from '../../components/admin/venues/VenuesStatsCards'
import VenuesFilterBar from '../../components/admin/venues/VenuesFilterBar'
import VenuesTable from '../../components/admin/venues/VenuesTable'
import ReviewVenueModal from '../../components/admin/venues/ReviewVenueModal'
import IssuePenaltyModal from '../../components/admin/venues/IssuePenaltyModal'
import VenueDossierModal from '../../components/admin/venues/VenueDossierModal'
import { useDanhSachMayChu } from '../../hooks/useDanhSachMayChu'
import PhanTrang from '../../components/bang/PhanTrang'
import KhungTai from '../../components/bang/KhungTai'

// 6 status BE hỗ trợ
const ALL_STATUSES = ['Pending', 'Approved', 'Warned', 'Suspended', 'Locked', 'Rejected']
const BO_LOC = { trangThai: parseAsStringLiteral(ALL_STATUSES).withDefault('Pending') }
const goiPhongTra = ({ trangThai, ...q }) => getAdminVenues({ ...q, status: trangThai })

const AdminVenuesPage = () => {
  const ds = useDanhSachMayChu({ khoa: ['admin-phong-tra'], goi: goiPhongTra, boLoc: BO_LOC, coMacDinh: 20 })
  const statusFilter = ds.boLoc.trangThai
  const doiTrangThai = (v) => ds.datBoLoc({ trangThai: v === 'Pending' ? null : v })

  const [penalizeTarget, setPenalizeTarget] = useState(null)
  // Stats cho các thẻ (song song 6 request pageSize=1 — pattern getAdminStats)
  const [counts, setCounts] = useState({ total: 0 })
  const [lanDem, setLanDem] = useState(0)

  // Duyet ho so phong tra: khong duyet thi phong tra treo mai o Pending, khong ban ve duoc.
  const [reviewTarget, setReviewTarget] = useState(null) // { venue, decision }
  const [dossierTarget, setDossierTarget] = useState(null) // ho so dang mo de doc truoc khi duyet

  // 1. ĐẾM theo trạng thái — mỗi status 1 request chỉ lấy totalCount; tải lại sau mỗi lần duyệt/phạt.
  useEffect(() => {
    const fetchCounts = async () => {
      const results = await Promise.all(ALL_STATUSES.map((status) => getAdminVenues({ status, page: 1, pageSize: 1 }).catch(() => null)))
      const nextCounts = { total: 0 }
      results.forEach((res, i) => {
        const count = res?.success ? (res.data.totalCount || 0) : 0
        nextCounts[ALL_STATUSES[i]] = count
        nextCounts.total += count
      })
      setCounts(nextCounts)
    }
    fetchCounts()
  }, [lanDem])

  const daDoi = () => { ds.taiLai(); setLanDem((n) => n + 1) }

  return (
    <div className="space-y-6">
      {/* HEADER */}
      <div className="flex items-center gap-3">
        <div>
          <h1 className="text-4xl text-ink">Phòng trà</h1>
          <p className="text-ink-soft text-sm">Quản lý trạng thái các phòng trà trên hệ thống.</p>
        </div>
      </div>

      {/* STATS CARDS */}
      <VenuesStatsCards
        counts={counts}
        statusFilter={statusFilter}
        onSelectStatus={doiTrangThai}
      />

      {/* FILTERS */}
      <VenuesFilterBar statusFilter={statusFilter} setStatusFilter={doiTrangThai} />

      {/* TABLE */}
      <KhungTai loi={ds.loi} taiLai={ds.taiLai} tenVung="danh sách phòng trà">
        <div className="space-y-3">
          <PhanTrang ds={ds} tenDonVi="phòng trà" idDanhSach="bang-phong-tra" />
          <VenuesTable
            venues={ds.items}
            isLoading={ds.dangTai}
            onViewDossier={(venue) => setDossierTarget(venue)}
            onReview={(venue, decision) => setReviewTarget({ venue, decision })}
            onPenalize={(venue) => setPenalizeTarget(venue)}
          />
          {ds.soTrang > 1 && <PhanTrang ds={ds} tenDonVi="phòng trà" idDanhSach="bang-phong-tra" />}
        </div>
      </KhungTai>

      {/* Hồ sơ đã nộp. Bấm Duyệt/Từ chối ngay trong đó thì ĐÓNG hồ sơ rồi mới mở hộp thoại nhập lý
          do — hai hộp thoại chồng nhau vừa che mất nội dung vừa làm rối thứ tự focus bàn phím. */}
      {dossierTarget && (
        <VenueDossierModal
          venue={dossierTarget}
          onClose={() => setDossierTarget(null)}
          onReview={(venue, decision) => {
            setDossierTarget(null)
            setReviewTarget({ venue, decision })
          }}
        />
      )}

      {penalizeTarget && (
        <IssuePenaltyModal
          venue={penalizeTarget}
          onClose={() => setPenalizeTarget(null)}
          onSaved={daDoi}
        />
      )}

      {reviewTarget && (
        <ReviewVenueModal
          venue={reviewTarget.venue}
          decision={reviewTarget.decision}
          onClose={() => setReviewTarget(null)}
          onSaved={daDoi}
        />
      )}
    </div>
  )
}

export default AdminVenuesPage