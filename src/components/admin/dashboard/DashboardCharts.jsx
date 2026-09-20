// src/components/admin/dashboard/DashboardCharts.jsx
//
// Các khối của Dashboard Admin dựng từ GET /analytics/admin-dashboard (MLACP-463).
// Hợp đồng cần nhớ khi sửa:
// - months LUÔN đủ 6 phần tử, tăng dần; phần tử cuối là tháng hiện tại CHƯA TRỌN (giờ VN); tháng
//   không có giao dịch vẫn có mặt với số 0.
// - Mỗi nguồn có HAI con số khác nhau, không bao giờ cộng lẫn hay vẽ chung một trục:
//     gmv             = tiền người mua trả, GỒM cả vé bán tại quầy bằng tiền mặt
//     platformRevenue = phần nền tảng thực nhận theo sổ cái (vé/donate: hoa hồng; gói: toàn bộ).
//                       Tiền giữ hộ phòng trà KHÔNG phải doanh thu; đơn gọi món không thuộc nguồn nào.
//   Tổng platformRevenue 3 nguồn của một tháng BẰNG platformRevenueInPeriod của /admin-overview cùng
//   tháng — backend có test chặn hai con số này lệch nhau.
// - topShows / genres theo kỳ from–to; không truyền thì backend lấy 6 tháng gần nhất.
// - Một buổi nhiều thể loại thì vé của nó tính cho TỪNG thể loại → cộng các thanh sẽ lớn hơn tổng vé.
import dayjs from 'dayjs'
import { Link } from 'react-router-dom'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LabelList } from 'recharts'
import { SURFACE, GRID, AXIS_TEXT, CURSOR, SOURCES, SINGLE_SERIES, fmtMoney, fmtCompact } from './chartTokens'

const monthLabel = (m) => dayjs(`${m}-01`).format('MM/YYYY')

const Swatch = ({ color, size = 'w-2.5 h-2.5' }) => (
  <span className={`${size} rounded-sm flex-shrink-0`} style={{ backgroundColor: color }} />
)

// Chú giải luôn có khi từ 2 chuỗi trở lên. Chữ dùng màu chữ; ô màu bên cạnh mới mang danh tính nguồn.
const SourceLegend = () => (
  <div className="flex flex-wrap gap-4 text-xs text-gray-400">
    {SOURCES.map((s) => (
      <span key={s.key} className="inline-flex items-center gap-1.5">
        <Swatch color={s.color} /> {s.label}
      </span>
    ))}
  </div>
)

const toRows = (months, measure) => months.map((m, i) => {
  const row = { month: m.month, label: monthLabel(m.month), partial: i === months.length - 1 }
  SOURCES.forEach((s) => { row[s.key] = Number(m[s.key]?.[measure] ?? 0) })
  row.total = SOURCES.reduce((sum, s) => sum + row[s.key], 0)
  return row
})

const RevenueTooltip = ({ active, payload }) => {
  if (!active || !payload?.length) return null
  const row = payload[0].payload
  return (
    <div className="bg-gray-950 border border-gray-700 rounded-lg px-3 py-2 text-xs shadow-lg">
      <p className="text-gray-300 font-medium mb-1.5">
        Tháng {row.label}{row.partial && ' (chưa trọn tháng)'}
      </p>
      {SOURCES.map((s) => (
        <div key={s.key} className="flex items-center justify-between gap-6 py-0.5">
          <span className="inline-flex items-center gap-1.5 text-gray-400"><Swatch color={s.color} size="w-2 h-2" />{s.label}</span>
          <span className="text-white tabular-nums">{fmtMoney(row[s.key])}</span>
        </div>
      ))}
      <div className="flex justify-between gap-6 pt-1.5 mt-1.5 border-t border-gray-800">
        <span className="text-gray-400">Tổng</span>
        <span className="text-white font-medium tabular-nums">{fmtMoney(row.total)}</span>
      </div>
    </div>
  )
}

// Cột chồng 6 tháng, MỘT đại lượng mỗi lúc (measure do trang chọn) trên MỘT trục —
// không vẽ gmv và platformRevenue chung một biểu đồ hai trục.
export const RevenueByMonthChart = ({ months, measure }) => {
  const rows = toRows(months, measure)
  return (
    <div className="space-y-3">
      <SourceLegend />
      {/* Chiều cao đã gồm dải nhãn trục X, để trục không bị cắt thành thanh cuộn con trong thẻ */}
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={rows} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
            <CartesianGrid vertical={false} stroke={GRID} />
            <XAxis dataKey="label" axisLine={{ stroke: GRID }} tickLine={false}
              tick={{ fill: AXIS_TEXT, fontSize: 12 }}
              tickFormatter={(v, i) => (rows[i]?.partial ? `${v}*` : v)} />
            <YAxis width={56} axisLine={false} tickLine={false}
              tick={{ fill: AXIS_TEXT, fontSize: 12 }} tickFormatter={fmtCompact} />
            <Tooltip content={<RevenueTooltip />} cursor={{ fill: CURSOR, opacity: 0.6 }} />
            {SOURCES.map((s, i) => (
              // Khe 2px màu nền giữa các đoạn: tách đoạn bằng khoảng trống, không vẽ viền màu khác.
              <Bar key={s.key} dataKey={s.key} stackId="rev" fill={s.color} maxBarSize={24}
                stroke={SURFACE} strokeWidth={2} isAnimationActive={false}
                radius={i === SOURCES.length - 1 ? [4, 4, 0, 0] : 0} />
            ))}
          </BarChart>
        </ResponsiveContainer>
      </div>
      <p className="text-xs text-gray-600">* Tháng hiện tại, chưa trọn tháng.</p>
      {/* Bảng là bản song song của biểu đồ: đọc được mọi giá trị không cần rê chuột, không cần phân biệt màu */}
      <details className="text-xs">
        <summary className="cursor-pointer text-gray-500 hover:text-gray-300 select-none">Xem dạng bảng</summary>
        <div className="overflow-x-auto mt-2">
          <table className="w-full tabular-nums">
            <thead>
              <tr className="text-gray-500">
                <th className="text-left py-1.5 pr-3 font-medium">Tháng</th>
                {SOURCES.map((s) => <th key={s.key} className="text-right py-1.5 pr-3 font-medium">{s.label}</th>)}
                <th className="text-right py-1.5 font-medium">Tổng</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.month} className="border-t border-gray-800 text-gray-300">
                  <td className="py-1.5 pr-3">{r.label}{r.partial && '*'}</td>
                  {SOURCES.map((s) => <td key={s.key} className="text-right py-1.5 pr-3">{fmtMoney(r[s.key])}</td>)}
                  <td className="text-right py-1.5 text-white">{fmtMoney(r.total)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </details>
    </div>
  )
}

// Tỷ trọng theo nguồn của MỘT tháng. Thanh chồng ngang thay cho biểu đồ tròn: ba giá trị có thể
// sát nhau, mà mắt so độ dài chính xác hơn so góc. Số liệu và % luôn in ra, không phải rê chuột.
export const RevenueShareBar = ({ month, measure }) => {
  const parts = SOURCES.map((s) => ({ ...s, value: Number(month?.[s.key]?.[measure] ?? 0) }))
  const total = parts.reduce((sum, p) => sum + p.value, 0)
  if (total <= 0) {
    return <p className="text-sm text-gray-500 py-8 text-center">Tháng này chưa phát sinh doanh thu.</p>
  }
  const pct = (v) => `${((v / total) * 100).toLocaleString('vi-VN', { maximumFractionDigits: 1 })}%`
  return (
    <div className="space-y-4">
      {/* gap 2px trên nền thẻ = khe giữa các đoạn, giống cột chồng */}
      <div className="flex h-3 gap-[2px] rounded-sm overflow-hidden">
        {parts.filter((p) => p.value > 0).map((p) => (
          <div key={p.key} style={{ width: `${(p.value / total) * 100}%`, backgroundColor: p.color }} />
        ))}
      </div>
      <ul className="space-y-2">
        {parts.map((p) => (
          <li key={p.key} className="flex items-center justify-between gap-3 text-sm">
            <span className="inline-flex items-center gap-2 text-gray-400"><Swatch color={p.color} />{p.label}</span>
            <span className="text-white tabular-nums">
              {fmtMoney(p.value)} <span className="text-gray-500 ml-1">{pct(p.value)}</span>
            </span>
          </li>
        ))}
      </ul>
      <div className="flex justify-between pt-2 border-t border-gray-800 text-sm">
        <span className="text-gray-400">Tổng</span>
        <span className="text-white font-medium tabular-nums">{fmtMoney(total)}</span>
      </div>
    </div>
  )
}

// Xếp hạng có số cụ thể → bảng, không phải biểu đồ.
export const TopShowsTable = ({ shows }) => {
  if (!shows.length) {
    return <p className="text-sm text-gray-500 py-8 text-center">Chưa có buổi diễn nào bán được vé trong kỳ.</p>
  }
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="text-xs text-gray-500 border-b border-gray-800">
            <th className="text-left py-2 pr-3 font-medium w-8">#</th>
            <th className="text-left py-2 pr-3 font-medium">Buổi diễn</th>
            <th className="text-right py-2 pr-3 font-medium">Vé bán</th>
            <th className="text-right py-2 font-medium">Doanh thu vé</th>
          </tr>
        </thead>
        <tbody>
          {shows.map((s, i) => (
            <tr key={s.showId} className="border-b border-gray-800/60">
              <td className="py-2.5 pr-3 text-gray-500 tabular-nums align-top">{i + 1}</td>
              <td className="py-2.5 pr-3">
                <Link to={`/shows/${s.showId}`} className="text-white hover:text-[#C3B665] transition-colors">{s.title}</Link>
                <p className="text-xs text-gray-500 mt-0.5">{s.loungeName} · {dayjs(s.startTime).format('DD/MM/YYYY')}</p>
              </td>
              <td className="py-2.5 pr-3 text-right text-gray-300 tabular-nums align-top">{s.ticketsSold.toLocaleString('vi-VN')}</td>
              <td className="py-2.5 text-right text-white tabular-nums align-top">{fmtMoney(s.ticketRevenue)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

const GenreTooltip = ({ active, payload }) => {
  if (!active || !payload?.length) return null
  const g = payload[0].payload
  return (
    <div className="bg-gray-950 border border-gray-700 rounded-lg px-3 py-2 text-xs shadow-lg">
      <p className="text-gray-300 font-medium mb-1">{g.genreName}</p>
      <p className="text-gray-400">Vé bán: <span className="text-white tabular-nums">{g.ticketsSold.toLocaleString('vi-VN')}</span></p>
      <p className="text-gray-400">Số buổi diễn: <span className="text-white tabular-nums">{g.showCount.toLocaleString('vi-VN')}</span></p>
    </div>
  )
}

// Một chuỗi → một màu, không có hộp chú giải (tiêu đề khối đã nói đang vẽ gì). Mọi thanh có số ở
// đầu thanh nên ẩn trục giá trị.
export const GenreDemandChart = ({ genres }) => {
  if (!genres.length) {
    return <p className="text-sm text-gray-500 py-8 text-center">Chưa có vé nào bán ra trong kỳ.</p>
  }
  const rows = [...genres].sort((a, b) => b.ticketsSold - a.ticketsSold)
  // Cao theo số thể loại thay vì cố định, để không thanh nào bị ép mỏng hay tràn khung
  const height = rows.length * 36 + 8
  return (
    <div style={{ height }}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={rows} layout="vertical" margin={{ top: 4, right: 48, left: 0, bottom: 4 }}>
          <XAxis type="number" hide />
          <YAxis type="category" dataKey="genreName" width={120} axisLine={false} tickLine={false}
            tick={{ fill: AXIS_TEXT, fontSize: 12 }} />
          <Tooltip content={<GenreTooltip />} cursor={{ fill: CURSOR, opacity: 0.6 }} />
          <Bar dataKey="ticketsSold" fill={SINGLE_SERIES} maxBarSize={16} radius={[0, 4, 4, 0]} isAnimationActive={false}>
            <LabelList dataKey="ticketsSold" position="right" fill="#99a1af" fontSize={12}
              formatter={(v) => Number(v).toLocaleString('vi-VN')} />
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}
