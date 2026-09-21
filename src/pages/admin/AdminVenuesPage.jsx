import { useState, useEffect, useMemo } from 'react'
import { Building2 } from 'lucide-react'
import toast from 'react-hot-toast'
import { getAdminVenues } from '../../services/adminServices'
import VenuesStatsCards from '../../components/admin/venues/VenuesStatsCards'
import VenuesFilterBar from '../../components/admin/venues/VenuesFilterBar'
import VenuesTable from '../../components/admin/venues/VenuesTable'
import ReviewVenueModal from '../../components/admin/venues/ReviewVenueModal'
import IssuePenaltyModal from '../../components/admin/venues/IssuePenaltyModal'

// 6 status BE hỗ trợ
const ALL_STATUSES = ['Pending', 'Approved', 'Warned', 'Suspended', 'Locked', 'Rejected']

const AdminVenuesPage = () => {
  const [venues, setVenues] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [pagination, setPagination] = useState({ page: 1, totalPages: 1, totalCount: 0 })

  // Filters (status = server-side, search = client-side)
  const [statusFilter, setStatusFilter] = useState('all')
  const [penalizeTarget, setPenalizeTarget] = useState(null)
  const [searchQuery, setSearchQuery] = useState('')

  // Stats cho 6 thẻ (fetch song song 7 request pageSize=1 — pattern getAdminStats)
  const [counts, setCounts] = useState({ total: 0 })

  // Duyet ho so phong tra: khong duyet thi phong tra treo mai o Pending, khong ban ve duoc.
  const [reviewTarget, setReviewTarget] = useState(null) // { venue, decision }
  // Khoa tai lai: effect lay danh sach chi phu thuoc [page, statusFilter], nen dat lai cung mot
  // trang se KHONG chay lai. Tang khoa nay moi buoc effect chay.
  const [reloadKey, setReloadKey] = useState(0)

  // 1. FETCH STATS (chạy 1 lần) — mỗi status 1 request chỉ lấy totalCount
  useEffect(() => {
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
    fetchCounts()
  }, [])

  // 2. FETCH DANH SÁCH (status filter server-side)
  useEffect(() => {
    const fetchVenues = async () => {
      setIsLoading(true)
      try {
        const params = {
          page: pagination.page,
          pageSize: 10,
          status: statusFilter !== 'all' ? statusFilter : undefined, // bỏ param khi all
        }
        Object.keys(params).forEach(k => params[k] === undefined && delete params[k])

        const res = await getAdminVenues(params)
        if (res.success) {
          setVenues(res.data.items)
          setPagination(prev => ({ ...prev, totalPages: res.data.totalPages, totalCount: res.data.totalCount }))
        }
      } catch (err) {
        console.error('Error loading venues:', err)
        toast.error('Unable to load Musical Venue')
      } finally {
        setIsLoading(false)
      }
    }
    fetchVenues()
  }, [pagination.page, statusFilter, reloadKey])

  // 3. ĐỔI FILTER → VỀ TRANG 1
  // Đặt lại ngay trong handler chứ không trong useEffect: đặt state trong thân effect gây render
  // lặp, và ở đây còn làm effect tải danh sách chạy hai lượt cho mỗi lần đổi bộ lọc.
  const veTrangDau = () => setPagination(prev => ({ ...prev, page: 1 }))
  const doiTrangThai = (v) => { setStatusFilter(v); veTrangDau() }
  const doiTuKhoa = (v) => { setSearchQuery(v); veTrangDau() }

  // 4. SEARCH CLIENT-SIDE trong trang hiện tại
  const filteredVenues = useMemo(() => {
    const q = searchQuery.toLowerCase().trim()
    if (!q) return venues
    return venues.filter(v =>
      (v.name || '').toLowerCase().includes(q) ||
      (v.ownerName || '').toLowerCase().includes(q) ||
      (v.ownerEmail || '').toLowerCase().includes(q) ||
      (v.ownerPhone || '').includes(q) ||
      (v.fullAddress || '').toLowerCase().includes(q)
    )
  }, [venues, searchQuery])

  return (
    <div className="space-y-6">
      {/* HEADER */}
      <div className="flex items-center gap-3">
        <Building2 size={28} className="text-brand-text" />
        <div>
          <h1 className="text-2xl font-bold text-ink">Manage Venue</h1>
          <p className="text-ink-soft text-sm">Manage the status of tea rooms within the system.</p>
        </div>
      </div>

      {/* STATS CARDS */}
      <VenuesStatsCards
        counts={counts}
        statusFilter={statusFilter}
        onSelectStatus={doiTrangThai}
      />

      {/* FILTERS */}
      <VenuesFilterBar
        searchQuery={searchQuery} setSearchQuery={doiTuKhoa}
        statusFilter={statusFilter} setStatusFilter={doiTrangThai}
      />

      {/* TABLE */}
      <VenuesTable
        venues={filteredVenues}
        isLoading={isLoading}
        pagination={pagination}
        onPageChange={(page) => setPagination(prev => ({ ...prev, page }))}
        onReview={(venue, decision) => setReviewTarget({ venue, decision })}
        onPenalize={(venue) => setPenalizeTarget(venue)}
      />

      {penalizeTarget && (
        <IssuePenaltyModal
          venue={penalizeTarget}
          onClose={() => setPenalizeTarget(null)}
          onSaved={() => setReloadKey(k => k + 1)}
        />
      )}

      {reviewTarget && (
        <ReviewVenueModal
          venue={reviewTarget.venue}
          decision={reviewTarget.decision}
          onClose={() => setReviewTarget(null)}
          onSaved={() => setReloadKey((k) => k + 1)}
        />
      )}
    </div>
  )
}

export default AdminVenuesPage