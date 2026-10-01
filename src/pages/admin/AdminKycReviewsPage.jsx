// src/pages/admin/AdminKycReviewsPage.jsx
//
// PHÂN TRANG (01/10/2026): bản cũ xin cố định pageSize 50 và không có trang tiếp — hồ sơ thứ 51 trở đi trong hàng đợi
// "Chờ duyệt" không bao giờ hiện, tức là có người bán chờ định danh mãi mà Admin không thấy. Nay dùng
// hooks/useDanhSachMayChu; tab lên URL (?tab=Approved). Backend (GetKycReviewQueueQueryHandler) phân trang đúng nhưng nạp
// cả hàng đợi vào bộ nhớ rồi mới cắt trang — chuyện hiệu năng phía backend, không làm sai dữ liệu ở đây.
import { useState } from 'react'
import { parseAsStringLiteral } from 'nuqs'
import { Loader2, ShieldCheck } from 'lucide-react'
import toast from 'react-hot-toast'
import { getKycReviewQueue, reviewKycDocument, getUserCitizenCardImage } from '../../services/adminServices'
import { KYC_TABS } from '../../components/admin/kyc/KycBadges'
import KycUserCard from '../../components/admin/kyc/KycUserCard'
import KycReviewModal from '../../components/admin/kyc/KycReviewModal'
import { useDanhSachMayChu } from '../../hooks/useDanhSachMayChu'
import PhanTrang from '../../components/bang/PhanTrang'
import NhomTab from '../../components/bang/NhomTab'

const BO_LOC = { tab: parseAsStringLiteral(KYC_TABS.map((t) => t.key)).withDefault('Pending') }
const goiHangDoi = ({ tab, ...q }) => getKycReviewQueue({ ...q, status: tab })

const AdminKycReviewsPage = () => {
  const ds = useDanhSachMayChu({ khoa: ['admin-kyc'], goi: goiHangDoi, boLoc: BO_LOC })
  const { tab } = ds.boLoc
  const items = ds.items
  const isLoading = ds.dangTai
  const load = () => ds.taiLai()
  const [target, setTarget] = useState(null) // { item, document, approve }
  const [isSubmitting, setIsSubmitting] = useState(false)

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
        <h1 className="text-4xl text-ink mb-1">Định danh người bán</h1>
        <p className="text-ink-soft text-sm leading-relaxed">
          Mỗi người có tới hai giấy tờ được duyệt riêng: CCCD và hồ sơ thuế. Từ chối thì bắt buộc ghi lý do.
        </p>
      </div>

      {/* TABS */}
      <NhomTab nhan="Lọc hồ sơ theo trạng thái" dangChon={tab} cacTab={KYC_TABS.map((t) => ({ khoa: t.key, nhan: t.label }))}
        onChon={(k) => ds.datBoLoc({ tab: k })} />

      {isLoading ? (
        <div className="py-20 flex justify-center"><Loader2 size={32} className="animate-spin text-ink" /></div>
      ) : ds.loi ? (
        <div role="alert" className="bg-card border border-line p-6 flex flex-wrap items-center gap-4">
          <p className="text-sm">Chưa tải được hàng đợi định danh.</p>
          <button type="button" onClick={load} className="min-h-[44px] px-4 border-2 border-ink font-semibold hover:bg-ink hover:text-lamp">Thử lại</button>
        </div>
      ) : items.length === 0 ? (
        <div className="bg-card border border-line p-10 text-center">
          <ShieldCheck size={28} className="mx-auto mb-3 text-ink-mute" />
          <p className="text-sm text-ink-mute">Không có hồ sơ nào trong mục này.</p>
        </div>
      ) : (
        <>
        <PhanTrang ds={ds} tenDonVi="hồ sơ" idDanhSach="ds-kyc" />
        <ul id="ds-kyc" tabIndex={-1} className={`space-y-4 focus:outline-none ${ds.laDuLieuCu ? 'opacity-60' : ''}`}>
          {items.map((it) => (
            <KycUserCard
              key={it.userId}
              item={it}
              onViewImage={handleViewImage}
              onReview={(item, document, approve) => setTarget({ item, document, approve })}
            />
          ))}
        </ul>
        <PhanTrang ds={ds} tenDonVi="hồ sơ" idDanhSach="ds-kyc" />
        </>
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
