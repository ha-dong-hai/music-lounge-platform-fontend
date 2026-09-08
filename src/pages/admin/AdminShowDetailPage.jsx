import { useState, useEffect } from 'react'
import { useParams, useLocation, Link } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import dayjs from 'dayjs'
import toast from 'react-hot-toast'
import ShowIntro from '../../components/mshow-detail/ShowIntro'
import ShowMap from '../../components/mshow-detail/ShowMap'
import Skeleton from '../../components/shared/Skeleton'
import { getShowDetail } from '../../services/showServices'
import { getPendingModerations, reviewShowModeration } from '../../services/adminServices'
import AdminShowHero from '../../components/admin/show-detail/AdminShowHero'
import ModerationModal from '../../components/admin/show-detail/ModerationModal'
import ShareModal from '../../components/admin/show-detail/ShareModal'

const AdminShowDetailPage = () => {
  const { id } = useParams()
  const location = useLocation()

  const [activeTab, setActiveTab] = useState('intro')
  const [isLoading, setIsLoading] = useState(true)
  const [apiError, setApiError] = useState(null)
  const [data, setData] = useState(null)
  const [moderation, setModeration] = useState(null)

  const [isModerationOpen, setIsModerationOpen] = useState(false)
  const [isShareOpen, setIsShareOpen] = useState(false)
  const [processingDecision, setProcessingDecision] = useState(null) // 'approve' | 'reject' | null

  // 1. FETCH: chi tiết show + check moderation pending (song song)
  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true)
      setApiError(null)
      try {
        const [detailRes, pendingRes] = await Promise.all([
          getShowDetail(id),
          getPendingModerations({ page: 1, pageSize: 100, targetType: 'Show' }).catch(() => null)
        ])

        if (detailRes.success) {
          const beData = detailRes.data
          setData({
            ...beData,
            title: beData.name,
            posterImage: beData.coverImageUrl,
            loungeName: beData.lounge?.name,
            loungeId: beData.lounge?.id,
            address: beData.lounge?.fullAddress,
            dateStr: beData.scheduledStart ? dayjs(beData.scheduledStart).format('HH:mm - dddd, DD/MM/YYYY') : 'Đang cập nhật',
            genre: beData.genres?.[0]?.name || 'Đang cập nhật',
            performers: beData.performers || [],
            moodTags: [beData.format, beData.genres?.[0]?.name].filter(Boolean),
            replayCondition: "Được xem lại trong vòng 48h sau sự kiện đối với vé VIP",
            description: beData.description || "Chưa có mô tả cho sự kiện này.",
            loungeLogo: `https://api.dicebear.com/7.x/initials/svg?seed=${beData.lounge?.name || 'ML'}&backgroundColor=10b981`
          })

          if (pendingRes?.success) {
            const found = pendingRes.data.items.find(m => String(m.targetId) === String(id))
            setModeration(found || null)
          }
        } else {
          setApiError(detailRes.message || 'Không tìm thấy chương trình')
        }
      } catch (err) {
        console.error('Lỗi API Detail:', err)
        setApiError('Không thể tải chi tiết sự kiện.')
      } finally {
        setIsLoading(false)
      }
    }
    fetchData()
  }, [id])

  // MODAL DUYỆT khi điều hướng từ tab "Cảnh báo AI"
  useEffect(() => {
    if (!isLoading && moderation && location.state?.fromModeration) {
      setIsModerationOpen(false)
    }
  }, [isLoading, moderation, location.state])

  // XỬ LÝ DUYỆT / TỪ CHỐI
  const handleDecision = async (decision, reviewNote) => {
    if (!moderation || processingDecision) return
    setProcessingDecision(decision)
    try {
      const res = await reviewShowModeration(
        id,                                                
        decision === 'approve' ? 'Approved' : 'Rejected',  
        reviewNote || ''
      )

      if (res.success) {
        toast.success(decision === 'approve' ? 'Đã phê duyệt nội dung!' : 'Đã từ chối nội dung!')
        setIsModerationOpen(false)
        setModeration(null)
        // Refresh lại show (status có thể đổi sau khi duyệt, VD: Draft → Published)
        const detailRes = await getShowDetail(id)
        if (detailRes.success) {
          setData(prev => ({ ...prev, status: detailRes.data.status }))
        }
      } else {
        toast.error(res.message || 'Thao tác thất bại.')
      }
    } catch (err) {
      console.error('Lỗi duyệt:', err)
      // Hiển thị message BE trả về (VD: moderation đã được xử lý, không tồn tại...)
      const beMessage = err?.response?.data?.message
      toast.error(beMessage || 'Thao tác thất bại. Vui lòng thử lại.')
    } finally {
      setProcessingDecision(null)
    }
  }

  // ===== LOADING =====
  if (isLoading) {
    return (
      <div className="min-h-screen bg-black pb-20">
        <div className="w-full h-[500px] md:h-[600px] bg-gray-900 flex items-end md:items-center">
          <div className="w-full max-w-[1600px] mx-auto px-6 pb-20 md:pb-0">
            <div className="flex flex-col items-start max-w-2xl gap-4">
              <Skeleton className="h-5 w-48" /><Skeleton className="w-20 h-20 rounded-full" /><Skeleton className="h-12 w-3/4" /><Skeleton className="h-6 w-1/2" /><Skeleton className="h-12 w-40" />
            </div>
          </div>
        </div>
        <div className="max-w-[1600px] mx-auto px-6 mt-8 mb-6 border-b border-gray-800 pb-4">
          <div className="flex gap-8"><Skeleton className="h-6 w-24" /><Skeleton className="h-6 w-24" /></div>
        </div>
        <div className="max-w-[1600px] mx-auto px-6">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
            <div className="lg:col-span-7 bg-gray-900 border border-gray-800 rounded-2xl p-8 space-y-4"><Skeleton className="h-8 w-40 mb-6" /><Skeleton className="h-4 w-full" /><Skeleton className="h-4 w-full" /><Skeleton className="h-4 w-2/3" /></div>
            <div className="lg:col-span-3 space-y-6">{[...Array(4)].map((_, i) => (<div key={i} className="bg-gray-900 border border-gray-800 rounded-xl p-5"><Skeleton className="h-3 w-16 mb-2" /><Skeleton className="h-4 w-24" /></div>))}</div>
            <div className="lg:col-span-2 flex flex-col items-center pt-2"><Skeleton className="w-24 h-24 rounded-full mb-4" /><Skeleton className="h-8 w-24 rounded-lg" /></div>
          </div>
        </div>
      </div>
    )
  }

  // ===== ERROR =====
  if (apiError || !data) {
    return (
      <div className="min-h-screen bg-black flex flex-col items-center justify-center text-white">
        <h1 className="text-2xl font-bold text-white mb-4">{apiError || 'Không tìm thấy sự kiện'}</h1>
        <Link to="/admin/shows" className="text-[#C3B665] hover:text-[#d4c87f] flex items-center gap-2 font-medium"><ArrowLeft size={18} /> Quay lại danh sách</Link>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-black pb-20">

      {/* HERO */}
      <AdminShowHero
        data={data}
        moderation={moderation}
        onOpenModeration={() => setIsModerationOpen(true)}
        onOpenShare={() => setIsShareOpen(true)}
      />

      {/* TABS */}
      <div className="max-w-[1600px] mx-auto px-6 mt-8 mb-6 border-b border-gray-800">
        <div className="flex gap-8">
          <button onClick={() => setActiveTab('intro')} className={`pb-4 text-lg font-bold border-b-2 transition-colors ${activeTab === 'intro' ? 'border-[#C3B665] text-[#C3B665]' : 'border-transparent text-gray-500 hover:text-white'}`}>Detail</button>
          <button onClick={() => setActiveTab('map')} className={`pb-4 text-lg font-bold border-b-2 transition-colors ${activeTab === 'map' ? 'border-[#C3B665] text-[#C3B665]' : 'border-transparent text-gray-500 hover:text-white'}`}>Seating area</button>
        </div>
      </div>

      {/* CONTENT */}
      <div className="max-w-[1600px] mx-auto px-6">
        {activeTab === 'intro' && (
          <ShowIntro
            data={data}
            isFollowing={false}
            onToggleFollow={() => toast('Chế độ Admin — không thể theo dõi lounge')}
          />
        )}
        {activeTab === 'map' && <ShowMap loungeId={data.loungeId} showData={data} readOnly />}
      </div>

      {/* ===== MODALS ===== */}
      {isModerationOpen && moderation && (
        <ModerationModal
          moderation={moderation}
          onClose={() => setIsModerationOpen(false)}
          onDecision={handleDecision}
          isProcessing={processingDecision}
        />
      )}

      {isShareOpen && <ShareModal onClose={() => setIsShareOpen(false)} />}
    </div>
  )
}

export default AdminShowDetailPage