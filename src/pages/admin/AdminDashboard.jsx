// src/pages/admin/AdminDashboard.jsx
// Data thật từ /analytics/* — layout theo dashboard cũ + giữ các tính năng hay của bản mới:
// nút chuyển đại lượng doanh thu (GMV ↔ Platform Revenue), khối luỹ kế, khối recommender.
import { useState, useEffect } from 'react'
import { DollarSign, Ticket, Users, AlertCircle, Store, Music2, HeartHandshake, Loader2, Brain } from 'lucide-react'
import toast from 'react-hot-toast'
import dayjs from 'dayjs'
import { getPlatformAnalytics, getAdminOverview, getRecommenderEvaluation, getAdminDashboard } from '../../services/analyticsServices'
import { RevenueByMonthChart, RevenueShareDonut, TopShowsTable, GenreTrendingList } from '../../components/admin/dashboard/DashboardCharts'

const fmtMoney = (v) => `${Number(v || 0).toLocaleString('vi-VN')}đ`

// Khoá = LoungeStatus của backend; thứ tự = thứ tự hiển thị (đang hoạt động trước)
const VENUE_STATUS_LABELS = [
  ['Approved', 'hoạt động'],
  ['Warned', 'bị cảnh cáo'],
  ['Pending', 'chờ duyệt'],
  ['Suspended', 'tạm đình chỉ'],
  ['Locked', 'bị khoá'],
  ['Rejected', 'bị từ chối'],
]
const venueBreakdown = (byStatus) => {
  if (!byStatus) return null
  const parts = VENUE_STATUS_LABELS
    .filter(([key]) => byStatus[key] > 0)
    .map(([key, label]) => `${byStatus[key]} ${label}`)
  return parts.length ? parts.join(' · ') : null
}

// ⭐ GIỮ TỪ BẢN MỚI: MỘT nút chuyển cho CẢ HAI khối doanh thu — hai khối luôn cùng đại lượng
const MEASURES = [
  { key: 'platformRevenue', label: 'Doanh thu nền tảng' },
  { key: 'gmv', label: 'Tổng giá trị giao dịch (GMV)' },
]

const StatCard = ({ title, value, note, icon: Icon, color, bg }) => (
  <div className="bg-card border border-line rounded-xl p-5 flex items-start justify-between">
    <div className="min-w-0">
      <p className="text-sm text-ink-mute mb-1">{title}</p>
      <p className="text-2xl font-bold text-ink">{value}</p>
      {note && <p className="text-xs mt-2 font-medium text-ink-mute">{note}</p>}
    </div>
    <div className={`p-3 rounded-lg ${bg} flex-shrink-0`}>
      <Icon size={24} className={color} />
    </div>
  </div>
)

const SectionTitle = ({ children }) => (
  <h2 className="text-sm font-semibold text-ink-soft mb-3">{children}</h2>
)

const AdminDashboard = () => {
  const [platform, setPlatform] = useState(null)
  const [overview, setOverview] = useState(null)
  const [recommender, setRecommender] = useState(null)
  const [dashboard, setDashboard] = useState(null)
  const [measure, setMeasure] = useState('platformRevenue')
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const fetchAll = async () => {
      setIsLoading(true)
      try {
        // allSettled chứ không phải all: một endpoint lỗi (VD backend chưa deploy admin-dashboard)
        // không làm mất các thẻ đang chạy tốt
        const ketQua = await Promise.allSettled([
          getPlatformAnalytics(),
          getAdminOverview(),
          getRecommenderEvaluation(),
          getAdminDashboard(),
        ])
        const [pRes, oRes, rRes, dRes] = ketQua.map(
          (x) => (x.status === 'fulfilled' ? x.value : { success: false })
        )
        if (dRes.success) setDashboard(dRes.data)
        if (pRes.success) setPlatform(pRes.data)
        if (oRes.success) setOverview(oRes.data)
        if (rRes.success) setRecommender(rRes.data)
      } catch {
        toast.error('Không tải được số liệu thống kê.')
      } finally {
        setIsLoading(false)
      }
    }
    fetchAll()
  }, [])

  if (isLoading) {
    return (
      <div className="py-20 flex justify-center">
        <Loader2 size={32} className="animate-spin text-brand-text" />
      </div>
    )
  }

  const periodLabel = overview
    ? `${dayjs(overview.periodFrom).format('DD/MM')} – ${dayjs(overview.periodTo).format('DD/MM/YYYY')}`
    : ''

  return (
    <div className="space-y-6">

      {/* ===== HEADER (kiểu cũ) ===== */}
      <div>
        <h1 className="text-2xl font-bold text-ink mb-1">System Overview</h1>
        <p className="text-ink-soft text-sm">Toàn bộ số liệu lấy trực tiếp từ hệ thống, không phải dữ liệu mẫu.</p>
      </div>

      {/* ===== KỲ HIỆN TẠI (data thật — giữ từ bản mới) ===== */}
      <div>
        <SectionTitle>
          Trong kỳ {periodLabel && <span className="text-ink-mute">({periodLabel})</span>}
        </SectionTitle>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            title="Doanh thu nền tảng"
            value={fmtMoney(overview?.platformRevenueInPeriod)}
            icon={DollarSign} color="text-success" bg="bg-green-500/10"
          />
          <StatCard
            title="Buổi diễn trong kỳ"
            value={overview?.eventsInPeriodCount ?? 0}
            icon={Music2} color="text-sky-400" bg="bg-blue-500/10"
          />
          <StatCard
            title="Khán giả đăng ký mới"
            value={overview?.newAudienceSignupsInPeriod ?? 0}
            icon={Users} color="text-purple-400" bg="bg-purple-500/10"
          />
          <StatCard
            title="Phòng trà đang hoạt động"
            value={platform?.operatingVenues ?? overview?.activeVenuesCount ?? 0}
            note="Tính tại thời điểm hiện tại, không theo kỳ"
            icon={Store} color="text-brand-text" bg="bg-brand/10"
          />
        </div>
      </div>

      {/* ===== LUỸ KẾ TOÀN HỆ THỐNG ===== */}
      <div>
        <SectionTitle>Luỹ kế toàn hệ thống</SectionTitle>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            title="Tổng giá trị giao dịch"
            value={fmtMoney(platform?.totalGrossMerchandiseValue)}
            icon={DollarSign} color="text-success" bg="bg-green-500/10"
          />
          <StatCard
            title="Vé đã bán"
            value={(platform?.totalTicketsSold ?? 0).toLocaleString('vi-VN')}
            icon={Ticket} color="text-sky-400" bg="bg-blue-500/10"
          />
          <StatCard
            title="Tổng donate"
            value={fmtMoney(platform?.totalDonationVolume)}
            icon={HeartHandshake} color="text-pink-400" bg="bg-pink-500/10"
          />
          <StatCard
            title="Chờ duyệt thủ công"
            value={platform?.pendingModerationsCount ?? 0}
            note={platform?.pendingModerationsCount > 0 ? 'Cần xử lý' : 'Đã xử lý hết'}
            icon={AlertCircle} color="text-warning" bg="bg-yellow-500/10"
          />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mt-4">
          <StatCard
            title="Phòng trà đã đăng ký"
            value={platform?.totalVenues ?? 0}
            note={venueBreakdown(platform?.venuesByStatus) || 'Mọi trạng thái, kể cả chờ duyệt'}
            icon={Store} color="text-brand-text" bg="bg-brand/10"
          />
          <StatCard
            title="Buổi diễn đã xuất bản"
            value={platform?.totalPublishedShows ?? 0}
            icon={Music2} color="text-brand-text" bg="bg-brand/10"
          />
          <StatCard
            title="Tổng người dùng"
            value={(platform?.totalUsers ?? 0).toLocaleString('vi-VN')}
            icon={Users} color="text-purple-400" bg="bg-purple-500/10"
          />
        </div>
      </div>

      {/* ===== DOANH THU 6 THÁNG — nút chuyển đại lượng áp cho cả 2 khối ===== */}
      {dashboard ? (
        <div className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h3 className="text-lg font-semibold text-ink">Revenue over the last six months</h3>
            {/* ⭐ SEGMENTED CONTROL từ bản mới */}
            <div className="inline-flex rounded-lg border border-line p-0.5 bg-sunken/70" role="group" aria-label="Đại lượng doanh thu">
              {MEASURES.map((m) => (
                <button key={m.key} onClick={() => setMeasure(m.key)} aria-pressed={measure === m.key}
                  className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                    measure === m.key ? 'bg-card text-brand-text' : 'text-ink-soft hover:text-ink'
                  }`}>
                  {m.label}
                </button>
              ))}
            </div>
          </div>

          {/* Giải thích ý nghĩa 2 đại lượng — quan trọng để Admin không đọc sai số */}
          <p className="text-xs text-ink-mute leading-relaxed">
            {measure === 'platformRevenue'
              ? 'Phần nền tảng thực nhận: hoa hồng trên vé và donate, cộng toàn bộ phí gói dịch vụ. Không gồm tiền giữ hộ phòng trà chờ quyết toán; vé bán tại quầy bằng tiền mặt không đi qua nền tảng nên gần như không có ở đây.'
              : 'Tổng tiền người mua trả, GỒM cả vé bán tại quầy bằng tiền mặt. Đây KHÔNG phải doanh thu của nền tảng — phần lớn thuộc về phòng trà và nghệ sĩ.'}
          </p>

          {/* Layout 2/3 + 1/3 — kiểu cũ */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 bg-card border border-line rounded-xl p-6">
              <h3 className="text-base font-semibold text-ink">Theo tháng, tách theo nguồn</h3>
              <p className="text-xs text-ink-mute mt-0.5 mb-4">Cột chồng theo nguồn doanh thu.</p>
              <RevenueByMonthChart months={dashboard.months} measure={measure} />
            </div>
            <div className="lg:col-span-1 bg-card border border-line rounded-xl p-6 flex flex-col">
              <h3 className="text-base font-semibold text-ink">Doanh thu tháng</h3>
              <p className="text-xs text-ink-mute mt-0.5 mb-2">
                Tháng {dayjs(`${dashboard.months.at(-1)?.month}-01`).format('MM/YYYY')}
              </p>
              <RevenueShareDonut month={dashboard.months.at(-1)} measure={measure} />
            </div>
          </div>

          {/* Top shows + Trending genres — layout kiểu cũ */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 bg-card border border-line rounded-xl overflow-hidden">
              <div className="p-6 pb-4">
                <h3 className="text-lg font-semibold text-ink">Top shows</h3>
                <p className="text-ink-mute text-xs">
                  Theo doanh thu vé · {dayjs(dashboard.periodFrom).format('DD/MM/YYYY')} – {dayjs(dashboard.periodTo).format('DD/MM/YYYY')}
                </p>
              </div>
              <TopShowsTable shows={dashboard.topShows} />
            </div>
            <div className="lg:col-span-1 bg-card border border-line rounded-xl p-6">
              <h3 className="text-lg font-semibold text-ink mb-1">Trending genres</h3>
              <p className="text-ink-mute text-xs mb-6">Xếp theo số vé bán trong kỳ</p>
              <GenreTrendingList genres={dashboard.genres} />
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-card border border-line rounded-xl p-6">
          <p className="text-sm text-ink-soft">Chưa tải được biểu đồ doanh thu và xếp hạng.</p>
          <p className="text-xs text-ink-mute mt-1">Các số liệu tổng quan phía trên không bị ảnh hưởng.</p>
        </div>
      )}

      {/* ===== CHẤT LƯỢNG MÔ HÌNH GỢI Ý (giữ từ bản mới) ===== */}
      {recommender && (
        <div className="bg-card border border-line rounded-xl p-6">
          <div className="flex items-start gap-3 mb-4">
            <div className="p-2.5 rounded-lg bg-brand/10">
              <Brain size={20} className="text-brand-text" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-ink">Chất lượng mô hình gợi ý</h3>
              <p className="text-ink-mute text-xs mt-0.5 leading-relaxed">{recommender.method}</p>
            </div>
          </div>

          {/* BE cố tình KHÔNG trả con số khi chưa đủ dữ liệu — hiển thị đúng như vậy,
              không quy về 0% kẻo người đọc tưởng mô hình đo được và đang sai */}
          {recommender.status === 'NotEnoughHistory' ? (
            <div className="bg-yellow-500/5 border border-yellow-500/20 rounded-lg p-4">
              <p className="text-warning text-sm font-medium mb-1">Chưa đủ dữ liệu để đo</p>
              <p className="text-ink-soft text-xs leading-relaxed">{recommender.caveat}</p>
              <div className="flex flex-wrap gap-6 mt-3 text-xs">
                <span className="text-ink-mute">
                  Người dùng đủ lịch sử: <span className="text-ink font-medium">{recommender.usersWithEnoughHistory}</span>
                </span>
                <span className="text-ink-mute">
                  Kho buổi diễn: <span className="text-ink font-medium">{recommender.catalogueSize}</span>
                </span>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              {(recommender.models || []).map((m, i) => (
                <div key={m.name ?? i} className="flex items-center justify-between bg-sunken/70 border border-line rounded-lg px-4 py-3">
                  <span className="text-sm text-ink font-medium">{m.name}</span>
                  <span className="text-sm text-brand-text font-bold">
                    HR@{recommender.k}: {((m.hitRate ?? 0) * 100).toFixed(1)}%
                  </span>
                </div>
              ))}
              {recommender.caveat && <p className="text-ink-mute text-xs leading-relaxed pt-1">{recommender.caveat}</p>}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default AdminDashboard