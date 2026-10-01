// src/pages/admin/AdminPenaltyAppealsPage.jsx
// Phía ĐỐI XỨNG của màn Án phạt bên chủ phòng trà (/owner/penalties). Quyết định ở đây
// có hiệu lực NGAY và KHÔNG hoàn tác được.
// PHÂN TRANG (01/10/2026): dùng hooks/useDanhSachMayChu + components/bang/PhanTrang như mọi danh sách khác — bản cũ tự
// giữ {page,totalPages} với hai nút trước/sau, trang và tab không lên URL (tải lại về trang 1) và không có dòng "Hiện x–y".
import { useState } from 'react'
import { parseAsBoolean } from 'nuqs'
import { Loader2, Gavel, RefreshCw, MessageSquareWarning } from 'lucide-react'
import toast from 'react-hot-toast'
import { getPenaltyAppeals, reviewPenaltyAppeal } from '../../services/penaltyServices'
import PenaltyAppealCard from '../../components/admin/penalty-appeals/PenaltyAppealCard'
import PenaltyAppealReviewModal from '../../components/admin/penalty-appeals/PenaltyAppealReviewModal'
import { useDanhSachMayChu } from '../../hooks/useDanhSachMayChu'
import PhanTrang from '../../components/bang/PhanTrang'
import NhomTab from '../../components/bang/NhomTab'

// Tab trên URL (?daXuLy=true) — Quay lại/tải lại giữ đúng tab.
const BO_LOC = { daXuLy: parseAsBoolean.withDefault(false) }

const AdminPenaltyAppealsPage = () => {
  const ds = useDanhSachMayChu({ khoa: ['admin-khieu-nai-an-phat'], goi: ({ daXuLy, ...q }) => getPenaltyAppeals({ ...q, resolved: daXuLy }), boLoc: BO_LOC })
  const daXuLy = ds.boLoc.daXuLy
  const items = ds.items
  const isLoading = ds.dangTai
  const totalCount = ds.tong
  const load = () => ds.taiLai()
  const [target, setTarget] = useState(null) // { item, decision }
  const [isSubmitting, setIsSubmitting] = useState(false)

  const doiTab = (v) => ds.datBoLoc({ daXuLy: v || null })

  // 2. SUBMIT QUYẾT ĐỊNH — page giữ API, modal lo validate note
  const handleReviewSubmit = async (reviewNote) => {
    if (!target) return
    setIsSubmitting(true)
    try {
      await reviewPenaltyAppeal(target.item.id, { decision: target.decision, reviewNote })
      toast.success(target.decision === 'Overturned' ? 'Đã huỷ án phạt.' : 'Đã giữ nguyên án phạt.')
      setTarget(null)
      await load()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Không xử lý được khiếu nại.', { duration: 6000 })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          <Gavel size={28} className="text-ink" />
          <div>
            <h1 className="text-4xl text-ink">Khiếu nại án phạt</h1>
            <p className="text-ink-soft text-sm leading-relaxed">
              Chủ phòng trà gửi khiếu nại khi cho rằng án phạt không đúng. Quyết định ở đây có hiệu
              lực ngay và không hoàn tác được.
            </p>
          </div>
        </div>
        <button onClick={load} disabled={isLoading}
          className="flex items-center gap-2 disabled:opacity-50 justify-center min-h-[44px] px-4 border-2 border-ink bg-card text-ink text-sm font-semibold hover:bg-ink hover:text-lamp">
          <RefreshCw size={16} className={isLoading ? 'animate-spin' : ''} /> Tải lại
        </button>
      </div>

      {/* TABS */}
      <NhomTab nhan="Lọc khiếu nại theo trạng thái" dangChon={daXuLy} onChon={doiTab}
        cacTab={[{ khoa: false, nhan: 'Chờ xử lý', dem: !daXuLy && totalCount > 0 ? totalCount : undefined }, { khoa: true, nhan: 'Đã xử lý' }]} />

      {isLoading ? (
        <div className="py-20 flex justify-center"><Loader2 size={30} className="animate-spin text-ink" /></div>
      ) : ds.loi ? (
        <div role="alert" className="bg-card border border-line p-6 flex flex-wrap items-center gap-4">
          <p className="text-sm">Chưa tải được danh sách khiếu nại án phạt.</p>
          <button type="button" onClick={() => ds.taiLai()} className="min-h-[44px] px-4 border-2 border-ink font-semibold hover:bg-ink hover:text-lamp">Thử lại</button>
        </div>
      ) : items.length === 0 ? (
        <div className="bg-card border border-line p-12 text-center">
          <MessageSquareWarning size={30} className="mx-auto mb-3 text-ink-mute" />
          <p className="text-sm text-ink-mute">
            {daXuLy ? 'Chưa có khiếu nại nào được xử lý.' : 'Không có khiếu nại nào đang chờ.'}
          </p>
        </div>
      ) : (
        <ul className="space-y-3">
          {items.map((p) => (
            <PenaltyAppealCard
              key={p.id}
              p={p}
              choXuLy={!daXuLy && !p.appealResult}
              onDecide={(item, decision) => setTarget({ item, decision })}
            />
          ))}
        </ul>
      )}

      {!isLoading && !ds.loi && <PhanTrang ds={ds} tenDonVi="khiếu nại" />}

      {target && (
        <PenaltyAppealReviewModal
          target={target}
          isProcessing={isSubmitting}
          onClose={() => setTarget(null)}
          onSubmit={handleReviewSubmit}
        />
      )}
    </div>
  )
}

export default AdminPenaltyAppealsPage
