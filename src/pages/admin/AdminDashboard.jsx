// src/pages/admin/AdminDashboard.jsx
import { useMemo } from 'react'
import { TrendingUp, TrendingDown, DollarSign, Ticket, Users, AlertCircle, Music2, Flame } from 'lucide-react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts'

// --- MOCK DATA ---
const statsData = [
  { title: 'Doanh thu tháng này', value: '125.500.000đ', change: '+12.5%', icon: DollarSign, color: 'text-green-400', bg: 'bg-green-500/10' },
  { title: 'Vé bán ra', value: '1,250', change: '+8.2%', icon: Ticket, color: 'text-blue-400', bg: 'bg-blue-500/10' },
  { title: 'User mới', value: '320', change: '+5.1%', icon: Users, color: 'text-purple-400', bg: 'bg-purple-500/10' },
  { title: 'Chờ duyệt thủ công', value: '4', change: 'Cần xử lý', icon: AlertCircle, color: 'text-yellow-400', bg: 'bg-yellow-500/10' },
]

// Data Stacked Bar Chart (6 tháng)
const revenueData = [
  { month: 'T.5', ve: 40000000, package: 15000000, donate: 5000000 },
  { month: 'T.6', ve: 55000000, package: 20000000, donate: 8000000 },
  { month: 'T.7', ve: 48000000, package: 18000000, donate: 6000000 },
  { month: 'T.8', ve: 70000000, package: 25000000, donate: 10000000 },
  { month: 'T.9', ve: 65000000, package: 22000000, donate: 9000000 },
  { month: 'T.10', ve: 80000000, package: 30000000, donate: 15500000 },
]

// Data Doughnut Chart (Tỷ lệ tháng này)
const revenueRatioData = [
  { name: 'Bán vé', value: 80000000, color: '#C3B665' },
  { name: 'Gói Package', value: 30000000, color: '#3b82f6' },
  { name: 'Donate', value: 15500000, color: '#a855f7' },
]

// Data Top Shows
const topShowsData = [
  { id: 's1', title: 'Đêm Acoustic Mùa Thu', lounge: 'Music Lounge Jazz', ticketsSold: 120, revenue: 24000000, trend: 'up' },
  { id: 's2', title: 'EDM Weekend Blast', lounge: 'Bass Drop Club', ticketsSold: 150, revenue: 52500000, trend: 'up' },
  { id: 's3', title: 'Jazz Trio Live', lounge: 'Music Lounge Jazz', ticketsSold: 85, revenue: 25500000, trend: 'down' },
  { id: 's4', title: 'Saxophone Night', lounge: 'Sax & Wine', ticketsSold: 90, revenue: 45000000, trend: 'up' },
]

// Data Trending Genres
const trendingGenresData = [
  { genre: 'Jazz', score: 95, trend: 'up', change: '+15%' },
  { genre: 'Acoustic', score: 88, trend: 'up', change: '+8%' },
  { genre: 'EDM', score: 75, trend: 'down', change: '-3%' },
  { genre: 'Indie', score: 60, trend: 'up', change: '+5%' },
  { genre: 'Classical', score: 45, trend: 'down', change: '-1%' },
]

// --- HELPER COMPONENTS ---
const formatCurrency = (value) => {
  if (value >= 1000000) return `${value / 1000000}Tr`;
  if (value >= 1000) return `${value / 1000}k`;
  return value;
}

const DashboardChartTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-gray-900 border border-gray-700 p-3 rounded-lg shadow-xl text-xs">
        <p className="text-white font-bold mb-2">{label}</p>
        {payload.map((entry, index) => (
          <div key={`item-${index}`} className="flex items-center gap-2 text-gray-300">
            <span className="w-2 h-2 rounded-full" style={{ backgroundColor: entry.color }}></span>
            <span>{entry.name}:</span>
            <span className="font-medium text-white">{Number(entry.value).toLocaleString('vi-VN')}đ</span>
          </div>
        ))}
      </div>
    )
  }
  return null
}

// --- MAIN COMPONENT ---
const AdminDashboard = () => {
  const totalRevenueThisMonth = useMemo(() => revenueRatioData.reduce((sum, item) => sum + item.value, 0), [])

  return (
    <div className="space-y-6">
      
      <div>
        <h1 className="text-2xl font-bold text-white mb-1">Tổng quan Hệ thống</h1>
        <p className="text-gray-400 text-sm">Chào mừng trở lại, đây là những gì đang diễn ra trên Music Lounge hôm nay.</p>
      </div>

      {/* === 1. STAT CARDS === */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {statsData.map((stat, i) => {
          const Icon = stat.icon
          return (
            <div key={i} className="bg-gray-900 border border-gray-800 rounded-xl p-5 flex items-start justify-between">
              <div>
                <p className="text-sm text-gray-500 mb-1">{stat.title}</p>
                <p className="text-2xl font-bold text-white">{stat.value}</p>
                <p className={`text-xs mt-2 font-medium ${stat.color}`}>{stat.change}</p>
              </div>
              <div className={`p-3 rounded-lg ${stat.bg}`}>
                <Icon size={24} className={stat.color} />
              </div>
            </div>
          )
        })}
      </div>

      {/* === 2. CHARTS (2 CỘT) === */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Stacked Bar Chart (2/3 chiều rộng) */}
        <div className="lg:col-span-2 bg-gray-900 border border-gray-800 rounded-xl p-6">
          <h3 className="text-lg font-semibold text-white mb-1">Doanh thu 6 tháng gần đây</h3>
          <p className="text-gray-500 text-xs mb-6">Tổng doanh thu phân chia theo Vé, Package và Donate</p>
          
          <div className="h-[320px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={revenueData} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#333" vertical={false} />
                <XAxis dataKey="month" tick={{ fill: '#888', fontSize: 12 }} axisLine={{ stroke: '#333' }} tickLine={false} />
                <YAxis tick={{ fill: '#888', fontSize: 12 }} axisLine={{ stroke: '#333' }} tickLine={false} tickFormatter={formatCurrency} />
                <Tooltip content={<DashboardChartTooltip />} cursor={{ fill: 'rgba(255, 255, 255, 0.05)' }} />
                <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }} />
                <Bar dataKey="ve" name="Bán vé" stackId="a" fill="#C3B665" radius={[0, 0, 0, 0]} />
                <Bar dataKey="package" name="Gói Package" stackId="a" fill="#3b82f6" radius={[0, 0, 0, 0]} />
                <Bar dataKey="donate" name="Donate" stackId="a" fill="#a855f7" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Doughnut Chart (1/3 chiều rộng) */}
        <div className="lg:col-span-1 bg-gray-900 border border-gray-800 rounded-xl p-6 flex flex-col">
          <h3 className="text-lg font-semibold text-white mb-1">Tỷ lệ doanh thu tháng này</h3>
          <p className="text-gray-500 text-xs mb-4">Phân bổ nguồn thu</p>
          
          <div className="relative h-[200px] w-full mt-2">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={revenueRatioData} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={55} outerRadius={80} paddingAngle={3}>
                  {revenueRatioData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} stroke="none" />
                  ))}
                </Pie>
                <Tooltip content={<DashboardChartTooltip />} />
              </PieChart>
            </ResponsiveContainer>
            {/* Text ở giữa Doughnut */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-center pointer-events-none">
              <p className="text-xs text-gray-500">Tổng</p>
              <p className="text-lg font-bold text-white">{formatCurrency(totalRevenueThisMonth)}đ</p>
            </div>
          </div>

          {/* Custom Legend ở dưới */}
          <div className="mt-auto pt-4 space-y-2">
            {revenueRatioData.map((item, i) => (
              <div key={i} className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-sm" style={{ backgroundColor: item.color }}></span>
                  <span className="text-gray-400">{item.name}</span>
                </div>
                <span className="text-white font-medium">{Math.round((item.value / totalRevenueThisMonth) * 100)}%</span>
              </div>
            ))}
          </div>
        </div>

      </div>

      {/* === 3. TABLE & TRENDING (2 CỘT) === */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Top Shows Table (2/3 chiều rộng) */}
        <div className="lg:col-span-2 bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
          <div className="p-6 pb-4">
            <h3 className="text-lg font-semibold text-white">Top chương trình xuất sắc</h3>
            <p className="text-gray-500 text-xs">Xếp hạng theo doanh thu tháng này</p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left whitespace-nowrap">
              <thead className="bg-black/40 border-y border-gray-800">
                <tr>
                  <th className="p-4 text-xs font-semibold text-gray-400 uppercase tracking-wider">Chương trình</th>
                  <th className="p-4 text-xs font-semibold text-gray-400 uppercase tracking-wider">Vé bán</th>
                  <th className="p-4 text-xs font-semibold text-gray-400 uppercase tracking-wider text-right">Doanh thu</th>
                  <th className="p-4 text-xs font-semibold text-gray-400 uppercase tracking-wider text-center">Xu hướng</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800">
                {topShowsData.map((show) => (
                  <tr key={show.id} className="hover:bg-gray-800/30 transition-colors">
                    <td className="p-4">
                      <p className="text-sm text-white font-medium">{show.title}</p>
                      <p className="text-xs text-gray-500 mt-0.5">{show.lounge}</p>
                    </td>
                    <td className="p-4">
                      <span className="text-sm text-white bg-gray-800 px-2 py-1 rounded-md">{show.ticketsSold}</span>
                    </td>
                    <td className="p-4 text-right text-sm font-bold text-[#C3B665]">{show.revenue.toLocaleString('vi-VN')}đ</td>
                    <td className="p-4 text-center">
                      {show.trend === 'up' ? (
                        <span className="inline-flex items-center gap-1 text-green-400 text-xs font-medium">
                          <TrendingUp size={14} /> Tăng
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-red-400 text-xs font-medium">
                          <TrendingDown size={14} /> Giảm
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Trending Genres List (1/3 chiều rộng) */}
        <div className="lg:col-span-1 bg-gray-900 border border-gray-800 rounded-xl p-6">
          <div className="flex items-center gap-2 mb-1">
            <Flame size={20} className="text-orange-400" />
            <h3 className="text-lg font-semibold text-white">Thể loại Trending</h3>
          </div>
          <p className="text-gray-500 text-xs mb-6">Dựa trên lượt tương tác & tìm kiếm</p>

          <div className="space-y-4">
            {trendingGenresData.map((item, index) => (
              <div key={index}>
                <div className="flex items-center justify-between mb-1.5">
                  <div className="flex items-center gap-2">
                    <span className={`text-xs font-bold ${index === 0 ? 'text-orange-400' : 'text-gray-500'}`}>#{index + 1}</span>
                    <span className="text-sm font-medium text-white flex items-center gap-1.5">
                      <Music2 size={14} className="text-gray-500" /> {item.genre}
                    </span>
                  </div>
                  <div className={`flex items-center gap-1 text-xs font-medium ${item.trend === 'up' ? 'text-green-400' : 'text-red-400'}`}>
                    {item.trend === 'up' ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
                    {item.change}
                  </div>
                </div>
                {/* Thanh Progress thể hiện mức độ Trend */}
                <div className="w-full h-1.5 bg-gray-800 rounded-full overflow-hidden">
                  <div 
                    className={`h-full rounded-full ${item.trend === 'up' ? 'bg-gradient-to-r from-[#C3B665] to-orange-400' : 'bg-gray-600'}`} 
                    style={{ width: `${item.score}%` }}
                  ></div>
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  )
}

export default AdminDashboard