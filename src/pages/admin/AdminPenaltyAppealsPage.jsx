// src/pages/admin/AdminPenaltyAppealsPage.jsx
// Phía ĐỐI XỨNG của màn Án phạt bên chủ phòng trà (/owner/penalties). Quyết định ở đây
// có hiệu lực NGAY và KHÔNG hoàn tác được.
import { useState, useEffect, useCallback } from 'react'
import { Loader2, Gavel, RefreshCw, MessageSquareWarning } from 'lucide-react'
import toast from 'react-hot-toast'
import { getPenaltyAppeals, reviewPenaltyAppeal } from '../../services/penaltyServices'
import PenaltyAppealCard from '../../components/admin/penalty-appeals/PenaltyAppealCard'
import PenaltyAppealReviewModal from '../../components/admin/penalty-appeals/PenaltyAppealReviewModal'

const AdminPenaltyAppealsPage = () => {
  const [items, setItems] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [daXuLy, setDaXuLy] = useState(false)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [totalCount, setTotalCount] = useState(0)
  const [target, setTarget] = useState(null) // { item, decision }
  const [isSubmitting, setIsSubmitting] = useState(false)

  // 1. FETCH THEO TAB + TRANG
  const load = useCallback(async () => {
    setIsLoading(true)
    try {
      const res = await getPenaltyAppeals({ resolved: daXuLy, page, pageSize: 20 })
      if (res.success) {
        setItems(res.data?.items ?? [])
        setTotalPages(res.data?.totalPages ?? 1)
        setTotalCount(res.data?.totalCount ?? 0)
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Không tải được danh sách khiếu nại.')
      setItems([])
    } finally {
      setIsLoading(false)
    }
  }, [daXuLy, page])

  useEffect(() => { const chay = async () => { await load() }; chay() }, [load])

  const doiTab = (v) => { setDaXuLy(v); setPage(1) }

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

  const tabBtn = (active) => `px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
    active ? 'bg-sunken border-brand/40 text-brand-text' : 'bg-page border-line text-ink-soft hover:text-ink'
  }`

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          <Gavel size={28} className="text-brand-text" />
          <div>
            <h1 className="text-2xl font-bold text-ink">Khiếu nại án phạt</h1>
            <p className="text-ink-soft text-sm leading-relaxed">
              Chủ phòng trà gửi khiếu nại khi cho rằng án phạt không đúng. Quyết định ở đây có hiệu
              lực ngay và không hoàn tác được.
            </p>
          </div>
        </div>
        <button onClick={load} disabled={isLoading}
          className="flex items-center gap-2 px-4 py-2 rounded-lg border border-line text-ink-soft text-sm font-bold hover:bg-sunken disabled:opacity-50">
          <RefreshCw size={16} className={isLoading ? 'animate-spin' : ''} /> Tải lại
        </button>
      </div>

      {/* TABS */}
      <div className="flex flex-wrap gap-2">
        <button onClick={() => doiTab(false)} className={tabBtn(!daXuLy)}>
          Chờ xử lý{!daXuLy && totalCount > 0 ? ` (${totalCount})` : ''}
        </button>
        <button onClick={() => doiTab(true)} className={tabBtn(daXuLy)}>
          Đã xử lý
        </button>
      </div>

      {isLoading ? (
        <div className="py-20 flex justify-center"><Loader2 size={30} className="animate-spin text-brand-text" /></div>
      ) : items.length === 0 ? (
        <div className="bg-card border border-line rounded-xl p-12 text-center">
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

      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-3">
          <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page <= 1}
            className="px-4 py-2 rounded-lg border border-line text-sm text-ink-soft hover:bg-sunken disabled:opacity-40">
            Trước
          </button>
          <span className="text-sm text-ink-mute">Trang {page}/{totalPages}</span>
          <button onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page >= totalPages}
            className="px-4 py-2 rounded-lg border border-line text-sm text-ink-soft hover:bg-sunken disabled:opacity-40">
            Sau
          </button>
        </div>
      )}

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