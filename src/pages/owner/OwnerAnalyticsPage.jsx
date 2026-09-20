// src/pages/owner/OwnerAnalyticsPage.jsx
//
// GHI CHÚ CHO ĐỘI FE:
// - Mọi endpoint analytics phía Owner đều BẮT BUỘC truyền loungeId; JWT của Owner trả loungeId=null
//   nên trang này phải gọi GET /lounges?mine=true trước để biết mình sở hữu phòng trà nào.
//   Tài khoản có nhiều phòng trà thì hiện đang lấy phòng đầu tiên — cần thêm bộ chọn nếu sau này
//   một chủ sở hữu nhiều phòng (xem staffing_single_venue_rule: hiện 1 tài khoản chỉ 1 venue hoạt động).
// - 3 con số rất dễ hiểu nhầm, đã tách rõ trên giao diện, đừng gộp lại:
//     Doanh thu gộp   = phát sinh trong kỳ
//     Đã nhận về      = tiền thật sự đã giải ngân về ngân hàng (chậm hơn, theo đợt sau buổi diễn)
//     Thu hộ nghệ sĩ  = tiền donate giữ hộ, PHẢI chuyển đi, không phải doanh thu của phòng trà
// - Biểu đồ xu hướng lấy thẳng revenueTrend từ backend (6 tháng gần nhất), không tự tính ở FE.
import { useState, useEffect } from 'react'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from 'recharts'
import { Loader2, DollarSign, Ticket, Music2, Star, Wallet, HandCoins } from 'lucide-react'
import dayjs from 'dayjs'
import toast from 'react-hot-toast'
import { getLounges } from '../../services/loungeServices'
import { getMyLoungeAnalytics, getRevenueReport } from '../../services/analyticsServices'

const fmtMoney = (v) => `${Number(v || 0).toLocaleString('vi-VN')}đ`
const fmtAxis = (v) => {
  if (v >= 1000000) return `${v / 1000000}Tr`
  if (v >= 1000) return `${v / 1000}k`
  return v
}

const StatCard = ({ title, value, note, icon: Icon, color, bg }) => (
  <div className="bg-gray-900 border border-gray-800 rounded-xl p-5 flex items-start justify-between">
    <div>
      <p className="text-sm text-gray-500 mb-1">{title}</p>
      <p className="text-2xl font-bold text-white">{value}</p>
      {note && <p className="text-xs mt-2 text-gray-500">{note}</p>}
    </div>
    <div className={`p-3 rounded-lg ${bg}`}>
      <Icon size={24} className={color} />
    </div>
  </div>
)

const ChartTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-gray-900 border border-gray-700 p-3 rounded-lg shadow-xl text-xs">
      <p className="text-white font-bold mb-2">{label}</p>
      {payload.map((e, i) => (
        <div key={i} className="flex items-center gap-2 text-gray-300">
          <span className="w-2 h-2 rounded-full" style={{ backgroundColor: e.color }} />
          <span>{e.name}:</span>
          <span className="font-medium text-white">{fmtMoney(e.value)}</span>
        </div>
      ))}
    </div>
  )
}

const OwnerAnalyticsPage = () => {
  const [lounge, setLounge] = useState(null)
  const [stats, setStats] = useState(null)
  const [revenue, setRevenue] = useState(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const run = async () => {
      setIsLoading(true)
      try {
        const lRes = await getLounges({ mine: true })
        const list = lRes.data?.items || lRes.data || []
        if (!list.length) {
          setIsLoading(false)
          return
        }
        const mine = list[0]
        setLounge(mine)

        const [sRes, rRes] = await Promise.all([
          getMyLoungeAnalytics(mine.id),
          getRevenueReport(mine.id),
        ])
        if (sRes.success) setStats(sRes.data)
        if (rRes.success) setRevenue(rRes.data)
      } catch {
        toast.error('Không tải được số liệu phòng trà.')
      } finally {
        setIsLoading(false)
      }
    }
    run()
  }, [])

  if (isLoading) {
    return (
      <div className="py-20 flex justify-center">
        <Loader2 size={32} className="animate-spin text-[#C3B665]" />
      </div>
    )
  }

  if (!lounge) {
    return (
      <div className="bg-gray-900 border border-gray-800 rounded-xl p-8 text-center text-gray-500">
        Tài khoản này chưa sở hữu phòng trà nào.
      </div>
    )
  }

  const trend = (stats?.revenueTrend || []).map((m) => ({
    month: `T.${m.month}`,
    'Vé tại chỗ': m.offlineTicketRevenue,
    'Vé online': m.onlineTicketRevenue,
    'F&B': m.fnbRevenue,
  }))

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white mb-1">Báo cáo doanh thu</h1>
        <p className="text-gray-400 text-sm">{lounge.name}</p>
      </div>

      {/* === TỔNG QUAN === */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Doanh thu gộp"
          value={fmtMoney(stats?.totalRevenue)}
          note={`Vé ${fmtMoney(stats?.ticketRevenue)} · F&B ${fmtMoney(stats?.fnbRevenue)}`}
          icon={DollarSign} color="text-green-400" bg="bg-green-500/10"
        />
        <StatCard
          title="Vé đã bán"
          value={stats?.totalTicketsSold ?? 0}
          note={`Tại chỗ ${stats?.offlineTicketsSold ?? 0} · Online ${stats?.onlineTicketsSold ?? 0}`}
          icon={Ticket} color="text-blue-400" bg="bg-blue-500/10"
        />
        <StatCard
          title="Buổi diễn"
          value={stats?.totalShows ?? 0}
          note={`Sắp diễn ${stats?.upcomingShows ?? 0} · Đã diễn ${stats?.pastShows ?? 0}`}
          icon={Music2} color="text-purple-400" bg="bg-purple-500/10"
        />
        <StatCard
          title="Điểm đánh giá"
          value={stats?.averageRating != null ? Number(stats.averageRating).toFixed(1) : 'Chưa có'}
          note={`${stats?.totalRatings ?? 0} lượt đánh giá`}
          icon={Star} color="text-yellow-400" bg="bg-yellow-500/10"
        />
      </div>

      {/* === TIỀN THẬT SỰ ĐÃ VỀ === */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <StatCard
          title="Đã nhận về tài khoản"
          value={fmtMoney(revenue?.totalSettlementReceived)}
          note="Giải ngân theo đợt sau buổi diễn, nên chậm hơn doanh thu gộp"
          icon={Wallet} color="text-green-400" bg="bg-green-500/10"
        />
        <StatCard
          title="Phí nền tảng đã trả"
          value={fmtMoney(revenue?.totalPlatformFeePaid)}
          note="Hoa hồng + thuế đã khấu trừ khi giải ngân"
          icon={DollarSign} color="text-red-400" bg="bg-red-500/10"
        />
        <StatCard
          title="Thu hộ nghệ sĩ"
          value={fmtMoney(revenue?.totalDonationCollectedForPerformers)}
          note="Tiền donate giữ hộ, phải chuyển cho nghệ sĩ — không phải doanh thu"
          icon={HandCoins} color="text-pink-400" bg="bg-pink-500/10"
        />
      </div>

      {/* === XU HƯỚNG DOANH THU === */}
      {trend.length > 0 && (
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
          <h3 className="text-lg font-semibold text-white mb-1">Doanh thu theo tháng</h3>
          <p className="text-gray-500 text-xs mb-6">Tách theo vé tại chỗ, vé online và F&amp;B.</p>
          <div className="h-[320px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={trend} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#333" vertical={false} />
                <XAxis dataKey="month" tick={{ fill: '#888', fontSize: 12 }} axisLine={{ stroke: '#333' }} tickLine={false} />
                <YAxis tick={{ fill: '#888', fontSize: 12 }} axisLine={{ stroke: '#333' }} tickLine={false} tickFormatter={fmtAxis} />
                <Tooltip content={<ChartTooltip />} cursor={{ fill: 'rgba(255,255,255,0.05)' }} />
                <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }} />
                <Bar dataKey="Vé tại chỗ" stackId="a" fill="#C3B665" />
                <Bar dataKey="Vé online" stackId="a" fill="#3b82f6" />
                <Bar dataKey="F&B" stackId="a" fill="#a855f7" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* === TOP BUỔI DIỄN === */}
      {stats?.topShows?.length > 0 && (
        <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
          <div className="p-6 pb-4">
            <h3 className="text-lg font-semibold text-white">Buổi diễn theo doanh thu</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left whitespace-nowrap">
              <thead className="bg-black/40 border-y border-gray-800">
                <tr>
                  <th className="p-4 text-xs font-semibold text-gray-400 uppercase">Buổi diễn</th>
                  <th className="p-4 text-xs font-semibold text-gray-400 uppercase">Vé bán / sức chứa</th>
                  <th className="p-4 text-xs font-semibold text-gray-400 uppercase text-right">Doanh thu</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800">
                {stats.topShows.map((s) => (
                  <tr key={s.showId} className="hover:bg-gray-800/30 transition-colors">
                    <td className="p-4">
                      <p className="text-sm text-white font-medium">{s.name}</p>
                      <p className="text-xs text-gray-500 mt-0.5">
                        {dayjs(s.scheduledStart).format('DD/MM/YYYY')}
                        {s.mainPerformerName && ` · ${s.mainPerformerName}`}
                      </p>
                    </td>
                    <td className="p-4">
                      <span className="text-sm text-white bg-gray-800 px-2 py-1 rounded-md">
                        {s.ticketsSold}{s.totalCapacity != null ? ` / ${s.totalCapacity}` : ''}
                      </span>
                    </td>
                    <td className="p-4 text-right text-sm font-bold text-[#C3B665]">{fmtMoney(s.revenue)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}

export default OwnerAnalyticsPage
