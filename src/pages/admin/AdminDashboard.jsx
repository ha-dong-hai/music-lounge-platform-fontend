// src/pages/admin/AdminDashboard.jsx
//
// GHI CHÚ CHO ĐỘI FE — vì sao trang này ít biểu đồ hơn bản thiết kế ban đầu:
// Bản cũ có 4 khối dữ liệu hardcode (doanh thu 6 tháng tách theo vé/gói/donate, tỷ trọng doanh thu
// tháng, bảng Top shows, bảng thể loại thịnh hành). Đã rà toàn bộ AnalyticsController: backend
// KHÔNG có endpoint nào cấp được 4 thứ đó ở phạm vi toàn nền tảng — chỉ có số luỹ kế
// (/analytics/platform) và số theo kỳ (/analytics/admin-overview). Giữ biểu đồ với số bịa sẽ khiến
// Admin ra quyết định dựa trên dữ liệu không tồn tại, nên đã bỏ hẳn thay vì để nguyên.
// Muốn khôi phục 4 khối đó thì backend cần bổ sung trước:
//   - doanh thu theo tháng, tách theo nguồn (vé / gói dịch vụ / donate) ở phạm vi nền tảng
//   - xếp hạng buổi diễn theo doanh thu toàn nền tảng
//   - thống kê thể loại theo lượt quan tâm / bán vé
// (Owner đã có sẵn /analytics/revenue-report tách theo tháng, nhưng chỉ trong phạm vi 1 phòng trà.)
import { useState, useEffect } from 'react'
import { DollarSign, Ticket, Users, AlertCircle, Store, Music2, HeartHandshake, Loader2, Brain } from 'lucide-react'
import toast from 'react-hot-toast'
import dayjs from 'dayjs'
import { getPlatformAnalytics, getAdminOverview, getRecommenderEvaluation } from '../../services/analyticsServices'

const fmtMoney = (v) => `${Number(v || 0).toLocaleString('vi-VN')}đ`

const StatCard = ({ title, value, note, icon: Icon, color, bg }) => (
  <div className="bg-gray-900 border border-gray-800 rounded-xl p-5 flex items-start justify-between">
    <div>
      <p className="text-sm text-gray-500 mb-1">{title}</p>
      <p className="text-2xl font-bold text-white">{value}</p>
      {note && <p className="text-xs mt-2 font-medium text-gray-500">{note}</p>}
    </div>
    <div className={`p-3 rounded-lg ${bg}`}>
      <Icon size={24} className={color} />
    </div>
  </div>
)

const AdminDashboard = () => {
  const [platform, setPlatform] = useState(null)
  const [overview, setOverview] = useState(null)
  const [recommender, setRecommender] = useState(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const fetchAll = async () => {
      setIsLoading(true)
      try {
        // Gọi song song: 3 endpoint độc lập, không cái nào cần kết quả của cái nào.
        const [pRes, oRes, rRes] = await Promise.all([
          getPlatformAnalytics(),
          getAdminOverview(),
          getRecommenderEvaluation(),
        ])
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
        <Loader2 size={32} className="animate-spin text-[#C3B665]" />
      </div>
    )
  }

  const periodLabel = overview
    ? `${dayjs(overview.periodFrom).format('DD/MM')} – ${dayjs(overview.periodTo).format('DD/MM/YYYY')}`
    : ''

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white mb-1">Tổng quan hệ thống</h1>
        <p className="text-gray-400 text-sm">Toàn bộ số liệu dưới đây lấy trực tiếp từ hệ thống, không phải dữ liệu mẫu.</p>
      </div>

      {/* === KỲ HIỆN TẠI === */}
      <div>
        <h2 className="text-sm font-semibold text-gray-400 mb-3">
          Trong kỳ {periodLabel && <span className="text-gray-600">({periodLabel})</span>}
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            title="Doanh thu nền tảng"
            value={fmtMoney(overview?.platformRevenueInPeriod)}
            icon={DollarSign} color="text-green-400" bg="bg-green-500/10"
          />
          <StatCard
            title="Buổi diễn trong kỳ"
            value={overview?.eventsInPeriodCount ?? 0}
            icon={Music2} color="text-blue-400" bg="bg-blue-500/10"
          />
          <StatCard
            title="Khán giả đăng ký mới"
            value={overview?.newAudienceSignupsInPeriod ?? 0}
            icon={Users} color="text-purple-400" bg="bg-purple-500/10"
          />
          <StatCard
            title="Phòng trà đang hoạt động"
            value={overview?.activeVenuesCount ?? 0}
            note="Tính tại thời điểm hiện tại, không theo kỳ"
            icon={Store} color="text-[#C3B665]" bg="bg-[#C3B665]/10"
          />
        </div>
      </div>

      {/* === LUỸ KẾ === */}
      <div>
        <h2 className="text-sm font-semibold text-gray-400 mb-3">Luỹ kế toàn hệ thống</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            title="Tổng giá trị giao dịch"
            value={fmtMoney(platform?.totalGrossMerchandiseValue)}
            icon={DollarSign} color="text-green-400" bg="bg-green-500/10"
          />
          <StatCard
            title="Vé đã bán"
            value={platform?.totalTicketsSold ?? 0}
            icon={Ticket} color="text-blue-400" bg="bg-blue-500/10"
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
            icon={AlertCircle} color="text-yellow-400" bg="bg-yellow-500/10"
          />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mt-4">
          <StatCard
            title="Tổng phòng trà"
            value={platform?.totalVenues ?? 0}
            icon={Store} color="text-[#C3B665]" bg="bg-[#C3B665]/10"
          />
          <StatCard
            title="Buổi diễn đã xuất bản"
            value={platform?.totalPublishedShows ?? 0}
            icon={Music2} color="text-[#C3B665]" bg="bg-[#C3B665]/10"
          />
          <StatCard
            title="Tổng người dùng"
            value={platform?.totalUsers ?? 0}
            icon={Users} color="text-purple-400" bg="bg-purple-500/10"
          />
        </div>
      </div>

      {/* === CHẤT LƯỢNG MÔ HÌNH GỢI Ý === */}
      {recommender && (
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
          <div className="flex items-start gap-3 mb-4">
            <div className="p-2.5 rounded-lg bg-[#C3B665]/10">
              <Brain size={20} className="text-[#C3B665]" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-white">Chất lượng mô hình gợi ý</h3>
              <p className="text-gray-500 text-xs mt-0.5 leading-relaxed">{recommender.method}</p>
            </div>
          </div>

          {/* Backend cố tình KHÔNG trả con số khi chưa đủ dữ liệu — phải hiển thị đúng như vậy,
              không quy về 0% vì như thế người đọc sẽ tưởng mô hình đo được và đang sai. */}
          {recommender.status === 'NotEnoughHistory' ? (
            <div className="bg-yellow-500/5 border border-yellow-500/20 rounded-lg p-4">
              <p className="text-yellow-400 text-sm font-medium mb-1">Chưa đủ dữ liệu để đo</p>
              <p className="text-gray-400 text-xs leading-relaxed">{recommender.caveat}</p>
              <div className="flex flex-wrap gap-6 mt-3 text-xs">
                <span className="text-gray-500">
                  Người dùng đủ lịch sử: <span className="text-white font-medium">{recommender.usersWithEnoughHistory}</span>
                </span>
                <span className="text-gray-500">
                  Kho buổi diễn: <span className="text-white font-medium">{recommender.catalogueSize}</span>
                </span>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              {(recommender.models || []).map((m, i) => (
                <div key={m.name ?? i} className="flex items-center justify-between bg-black/40 border border-gray-800 rounded-lg px-4 py-3">
                  <span className="text-sm text-white font-medium">{m.name}</span>
                  <span className="text-sm text-[#C3B665] font-bold">
                    HR@{recommender.k}: {((m.hitRate ?? 0) * 100).toFixed(1)}%
                  </span>
                </div>
              ))}
              {recommender.caveat && <p className="text-gray-500 text-xs leading-relaxed pt-1">{recommender.caveat}</p>}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default AdminDashboard
