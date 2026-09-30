// src/pages/admin/AdminKycReviewsPage.jsx
import { useState, useEffect, useCallback } from 'react'
import { Loader2, ShieldCheck } from 'lucide-react'
import toast from 'react-hot-toast'
import { getKycReviewQueue, reviewKycDocument, getUserCitizenCardImage } from '../../services/adminServices'
import { KYC_TABS } from '../../components/admin/kyc/KycBadges'
import KycUserCard from '../../components/admin/kyc/KycUserCard'
import KycReviewModal from '../../components/admin/kyc/KycReviewModal'

const AdminKycReviewsPage = () => {
  const [tab, setTab] = useState('Pending')
  const [items, setItems] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [target, setTarget] = useState(null) // { item, document, approve }
  const [isSubmitting, setIsSubmitting] = useState(false)

  // 1. FETCH HÀNG ĐỢI THEO TAB
  const load = useCallback(async () => {
    setIsLoading(true)
    try {
      const res = await getKycReviewQueue({ status: tab, pageSize: 50 })
      if (res.success) setItems(res.data.items ?? [])
    } catch (err) {
      toast.error(err.response?.data?.message || 'Không tải được hàng đợi định danh.')
      setItems([])
    } finally {
      setIsLoading(false)
    }
  }, [tab])

  useEffect(() => { const chay = async () => { await load() }; chay() }, [load])

  // 2. XEM ẢNH CCCD (blob) — Admin xem giấy tờ người khác thì BE GHI LOG, đừng gọi thừa
  const handleViewImage = async (userId, side) => {
    try {
      const blob = await getUserCitizenCardImage(userId, side)
      const url = URL.createObjectURL(blob)
      window.open(url, '_blank', 'noopener')
      setTimeout(() => URL.revokeObjectURL(url), 60_000)
    } catch (err) {
      toast.error(err.response?.data?.message || 'Không mở được ảnh.')
    }
  }

  // 3. SUBMIT DUYỆT/TỪ CHỐI — gọi API, thành công thì refetch + đóng modal
  const handleReviewSubmit = async (note) => {
    if (!target) return
    setIsSubmitting(true)
    try {
      await reviewKycDocument(target.item.userId, target.document, { approve: target.approve, note })
      toast.success(target.approve ? 'Đã duyệt giấy tờ.' : 'Đã từ chối kèm lý do.')
      setTarget(null)
      await load()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Không xử lý được.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-ink mb-1">Duyệt định danh</h1>
        <p className="text-ink-soft text-sm leading-relaxed">
          Mỗi người có tới hai giấy tờ được duyệt riêng: CCCD và hồ sơ thuế. Từ chối thì bắt buộc ghi lý do.
        </p>
      </div>

      {/* TABS */}
      <div className="flex flex-wrap gap-2">
        {KYC_TABS.map((t) => (
          <button key={t.key} onClick={() => setTab(t.key)}
            className={`px-3 py-1.5 text-xs font-medium border transition-colors ${tab === t.key
              ? 'bg-sunken border-ink/40 text-ink'
              : 'bg-page border-line text-ink-soft hover:text-ink'}`}>
            {t.label}
          </button>
        ))}
      </div>

      {isLoading ? (
        <div className="py-20 flex justify-center"><Loader2 size={32} className="animate-spin text-ink" /></div>
      ) : items.length === 0 ? (
        <div className="bg-card border border-line p-10 text-center">
          <ShieldCheck size={28} className="mx-auto mb-3 text-ink-mute" />
          <p className="text-sm text-ink-mute">Không có hồ sơ nào trong mục này.</p>
        </div>
      ) : (
        <ul className="space-y-4">
          {items.map((it) => (
            <KycUserCard
              key={it.userId}
              item={it}
              onViewImage={handleViewImage}
              onReview={(item, document, approve) => setTarget({ item, document, approve })}
            />
          ))}
        </ul>
      )}

      {target && (
        <KycReviewModal
          target={target}
          isProcessing={isSubmitting}
          onClose={() => setTarget(null)}
          onSubmit={handleReviewSubmit}
        />
      )}
    </div>
  )
}

export default AdminKycReviewsPage
