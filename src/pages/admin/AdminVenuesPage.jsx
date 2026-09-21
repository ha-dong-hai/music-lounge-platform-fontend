import { useState, useEffect } from 'react'
import { Building2 } from 'lucide-react'
import toast from 'react-hot-toast'
import { getAdminVenues, reviewVenue } from '../../services/adminServices'
import VenuesStatsCards from '../../components/admin/venues/VenuesStatsCards'
import VenuesFilterBar from '../../components/admin/venues/VenuesFilterBar'
import VenuesTable from '../../components/admin/venues/VenuesTable'
import VenueReviewModal from '../../components/admin/venues/VenueReviewModal'

const ALL_STATUSES = ['Pending', 'Approved', 'Warned', 'Suspended', 'Locked', 'Rejected']

const AdminVenuesPage = () => {
  const [venues, setVenues] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [pagination, setPagination] = useState({ page: 1, totalPages: 1, totalCount: 0 })

  const [statusFilter, setStatusFilter] = useState('all')
  const [counts, setCounts] = useState({ total: 0 })

  // REVIEW states
  const [reviewTarget, setReviewTarget] = useState(null)          // venue đang duyệt
  const [processingDecision, setProcessingDecision] = useState(null) // 'Approved' | 'Rejected' | null
  const [refreshTrigger, setRefreshTrigger] = useState(0)         // refetch list sau review

  // 1. FETCH STATS (tách hàm để gọi lại được sau review)
  const fetchCounts = async () => {
    try {
      const requests = ALL_STATUSES.map(status =>
        getAdminVenues({ status, page: 1, pageSize: 1 }).catch(() => null)
      )
      const results = await Promise.all(requests)
      const nextCounts = { total: 0 }
      results.forEach((res, i) => {
        const count = res?.success ? (res.data.totalCount || 0) : 0
        nextCounts[ALL_STATUSES[i]] = count
        nextCounts.total += count
      })
      setCounts(nextCounts)
    } catch (err) {
      console.error('Lỗi load venue counts:', err)
    }
  }

  useEffect(() => {
    fetchCounts()
  }, [])

  // 2. FETCH DANH SÁCH — thêm refreshTrigger vào deps
  useEffect(() => {
    const fetchVenues = async () => {
      setIsLoading(true)
      try {
        const params = {
          page: pagination.page,
          pageSize: 10,
          status: statusFilter !== 'all' ? statusFilter : undefined,
        }
        Object.keys(params).forEach(k => params[k] === undefined && delete params[k])

        const res = await getAdminVenues(params)
        if (res.success) {
          setVenues(res.data.items)
          setPagination(prev => ({ ...prev, totalPages: res.data.totalPages, totalCount: res.data.totalCount }))
        }
      } catch (err) {
        console.error('Lỗi load venues:', err)
        toast.error('Không thể tải danh sách phòng trà')
      } finally {
        setIsLoading(false)
      }
    }
    fetchVenues()
  }, [pagination.page, statusFilter, refreshTrigger])

  // 3. ĐỔI FILTER → VỀ TRANG 1
  useEffect(() => {
    setPagination(prev => ({ ...prev, page: 1 }))
  }, [statusFilter])

  // XỬ LÝ DUYỆT / TỪ CHỐI VENUE
  const handleVenueDecision = async (decision, note) => {
    if (!reviewTarget || processingDecision) return
    setProcessingDecision(decision)
    try {
      const res = await reviewVenue(reviewTarget.loungeId, decision, note)
      if (res.success) {
        toast.success(decision === 'Approved' ? 'Venue approved!' : 'Venue rejected!')
        setReviewTarget(null)
        setRefreshTrigger(t => t + 1) // refetch danh sách
        fetchCounts()                 // refresh thẻ thống kê
      } else {
        toast.error(res.message || 'Operation failed.')
      }
    } catch (err) {
      const beMessage = err?.response?.data?.message
      toast.error(beMessage || 'Operation failed.')
    } finally {
      setProcessingDecision(null)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Building2 size={28} className="text-[#C3B665]" />
        <div>
          <h1 className="text-2xl font-bold text-white">Quản lý Phòng trà (Venue)</h1>
          <p className="text-gray-400 text-sm">Duyệt, theo dõi và xử lý trạng thái các phòng trà trong hệ thống.</p>
        </div>
      </div>

      <VenuesStatsCards counts={counts} statusFilter={statusFilter} onSelectStatus={setStatusFilter} />

      <VenuesFilterBar statusFilter={statusFilter} setStatusFilter={setStatusFilter} />

      <VenuesTable
        venues={venues}
        isLoading={isLoading}
        pagination={pagination}
        onReview={setReviewTarget}
        onPageChange={(page) => setPagination(prev => ({ ...prev, page }))}
      />

      {/* MODAL DUYỆT */}
      {reviewTarget && (
        <VenueReviewModal
          venue={reviewTarget}
          onClose={() => setReviewTarget(null)}
          onDecision={handleVenueDecision}
          isProcessing={processingDecision}
        />
      )}
    </div>
  )
}

export default AdminVenuesPage