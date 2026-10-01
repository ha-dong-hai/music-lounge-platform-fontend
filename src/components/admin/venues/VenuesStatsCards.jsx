import { Building2, Clock, CheckCircle2, ShieldAlert } from 'lucide-react'
import OChiSo from '../../bang/OChiSo'

// Nhóm "Vấn đề" = tổng 4 status rủi ro
const PROBLEM_STATUSES = ['Warned', 'Suspended', 'Locked', 'Rejected']

// 4 ô: Tổng / Chờ duyệt / Đã duyệt / Vấn đề — dùng OChiSo chung (01/10/2026).
const VenuesStatsCards = ({ counts, statusFilter, onSelectStatus }) => {
  const problemCount = PROBLEM_STATUSES.reduce((sum, s) => sum + (counts[s] || 0), 0)

  // Ô "Vấn đề" đang chọn khi đang lọc 1 trong các status vấn đề
  const isProblemActive = PROBLEM_STATUSES.includes(statusFilter)

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {/* Chỉ để đọc (OChiSo không onClick → <div>): backend chưa liệt kê được mọi trạng thái cùng lúc (xem AdminVenuesPage). */}
      <OChiSo nhan="Tổng phòng trà" so={counts.total} icon={Building2} />
      <OChiSo nhan="Chờ duyệt" so={counts.Pending || 0} icon={Clock}
        dangChon={statusFilter === 'Pending'} onClick={() => onSelectStatus('Pending')} />
      <OChiSo nhan="Đã duyệt" so={counts.Approved || 0} icon={CheckCircle2}
        dangChon={statusFilter === 'Approved'} onClick={() => onSelectStatus('Approved')} />
      {/* Bấm → chọn status vấn đề đầu tiên có dữ liệu (hoặc Warned mặc định). Có phòng trà vấn đề thì ô cần chú ý (viền + chữ son). */}
      <OChiSo nhan="Có vấn đề" so={problemCount} icon={ShieldAlert} canChuY={problemCount > 0}
        dangChon={isProblemActive}
        onClick={() => onSelectStatus(PROBLEM_STATUSES.find(s => (counts[s] || 0) > 0) || 'Warned')} />
    </div>
  )
}

export default VenuesStatsCards
