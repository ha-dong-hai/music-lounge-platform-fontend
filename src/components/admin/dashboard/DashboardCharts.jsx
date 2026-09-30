// src/components/admin/dashboard/DashboardCharts.jsx
// Dựng từ GET /analytics/admin-dashboard. Layout theo dashboard cũ:
// cột chồng 6 tháng + doughnut tỷ trọng tháng này + bảng Top shows + list thể loại trending.
import dayjs from 'dayjs'
import { Link } from 'react-router-dom'
import { Music2, TrendingUp } from 'lucide-react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LabelList, PieChart, Pie, Cell } from 'recharts'
import { SURFACE, GRID, AXIS_TEXT, CURSOR, SOURCES, SINGLE_SERIES, fmtMoney, fmtCompact } from './chartTokens'

const monthLabel = (m) => dayjs(`${m}-01`).format('MM/YYYY')

const Swatch = ({ color, size = 'w-2.5 h-2.5' }) => (
  <span className={`${size} rounded-sm flex-shrink-0`} style={{ backgroundColor: color }} />
)

// ===== TOOLTIP kiểu cũ: nền card + viền line, mỗi nguồn một dòng kèm ô màu =====
const RevenueTooltip = ({ active, payload }) => {
  if (!active || !payload?.length) return null
  const row = payload[0].payload
  return (
    <div className="bg-card border border-line-strong p-3 shadow-soft text-xs">
      <p className="text-ink font-bold mb-2">Tháng {row.label}{row.partial && ' (chưa trọn tháng)'}</p>
      {SOURCES.map((s) => (
        <div key={s.key} className="flex items-center justify-between gap-6 py-0.5">
          <span className="inline-flex items-center gap-2 text-ink-soft"><Swatch color={s.color} size="w-2 h-2" />{s.label}</span>
          <span className="text-ink font-medium tabular-nums">{fmtMoney(row[s.key])}</span>
        </div>
      ))}
      <div className="flex justify-between gap-6 pt-1.5 mt-1.5 border-t border-line">
        <span className="text-ink-soft">Tổng</span>
        <span className="text-ink font-medium tabular-nums">{fmtMoney(row.total)}</span>
      </div>
    </div>
  )
}

const toRows = (months, measure) => months.map((m, i) => {
  const row = { month: m.month, label: monthLabel(m.month), partial: i === months.length - 1 }
  SOURCES.forEach((s) => { row[s.key] = Number(m[s.key]?.[measure] ?? 0) })
  row.total = SOURCES.reduce((sum, s) => sum + row[s.key], 0)
  return row
})

// ===== 1. CỘT CHỒNG 6 THÁNG — MỘT đại lượng mỗi lúc (measure do trang chọn) =====
export const RevenueByMonthChart = ({ months, measure }) => {
  const rows = toRows(months, measure)
  return (
    <div className="space-y-3">
      {/* Chú giải — chữ dùng màu chữ, ô màu mới mang danh tính nguồn */}
      <div className="flex flex-wrap gap-4 text-xs text-ink-soft">
        {SOURCES.map((s) => (
          <span key={s.key} className="inline-flex items-center gap-1.5">
            <Swatch color={s.color} /> {s.label}
          </span>
        ))}
      </div>

      <div className="h-[320px]">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={rows} margin={{ top: 8, right: 10, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke={GRID} vertical={false} />
            <XAxis dataKey="label" axisLine={{ stroke: GRID }} tickLine={false}
              tick={{ fill: AXIS_TEXT, fontSize: 12 }}
              tickFormatter={(v, i) => (rows[i]?.partial ? `${v}*` : v)} />
            <YAxis width={56} axisLine={false} tickLine={false}
              tick={{ fill: AXIS_TEXT, fontSize: 12 }} tickFormatter={fmtCompact} />
            <Tooltip content={<RevenueTooltip />} cursor={{ fill: CURSOR, opacity: 0.6 }} />
            {SOURCES.map((s, i) => (
              // Khe 2px màu nền giữa các đoạn — tách bằng khoảng trống, không vẽ viền màu khác
              <Bar key={s.key} dataKey={s.key} stackId="rev" fill={s.color} maxBarSize={24}
                stroke={SURFACE} strokeWidth={2} isAnimationActive={false}
                radius={i === SOURCES.length - 1 ? [4, 4, 0, 0] : 0} />
            ))}
          </BarChart>
        </ResponsiveContainer>
      </div>
      <p className="text-xs text-ink-mute">* Tháng hiện tại, chưa trọn tháng.</p>

      {/* ⭐ Giữ từ bản mới: bản song song dạng bảng — đọc được mọi giá trị không cần rê chuột */}
      <details className="text-xs">
        <summary className="cursor-pointer text-ink-mute hover:text-ink-soft select-none">Xem dạng bảng</summary>
        <div className="overflow-x-auto mt-2">
          <table className="w-full tabular-nums">
            <thead>
              <tr className="text-ink-mute">
                <th className="text-left py-1.5 pr-3 font-medium">Tháng</th>
                {SOURCES.map((s) => <th key={s.key} className="text-right py-1.5 pr-3 font-medium">{s.label}</th>)}
                <th className="text-right py-1.5 font-medium">Tổng</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.month} className="border-t border-line text-ink-soft">
                  <td className="py-1.5 pr-3">{r.label}{r.partial && '*'}</td>
                  {SOURCES.map((s) => <td key={s.key} className="text-right py-1.5 pr-3">{fmtMoney(r[s.key])}</td>)}
                  <td className="text-right py-1.5 text-ink">{fmtMoney(r.total)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </details>
    </div>
  )
}

// ===== 2. DOUGHNUT TỶ TRỌNG THÁNG NÀY — kiểu cũ (tổng ở tâm + legend % bên dưới) =====
export const RevenueShareDonut = ({ month, measure }) => {
  const all = SOURCES.map((s) => ({ ...s, value: Number(month?.[s.key]?.[measure] ?? 0) }))
  const total = all.reduce((sum, p) => sum + p.value, 0)

  if (total <= 0) {
    return <p className="text-sm text-ink-mute py-12 text-center">Tháng này chưa phát sinh doanh thu.</p>
  }
  const data = all.filter((p) => p.value > 0)

  return (
    <div className="flex flex-col h-full">
      <div className="relative h-[200px] w-full mt-2">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie data={data} dataKey="value" nameKey="label" cx="50%" cy="50%" innerRadius={55} outerRadius={80} paddingAngle={3}>
              {data.map((entry, i) => (
                <Cell key={`cell-${i}`} fill={entry.color} stroke="none" />
              ))}
            </Pie>
            <Tooltip content={<RevenueTooltip />} />
          </PieChart>
        </ResponsiveContainer>
        {/* Tổng ở giữa doughnut — kiểu cũ */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-center pointer-events-none">
          <p className="text-xs text-ink-mute">Tổng</p>
          <p className="text-lg font-bold text-ink">{fmtCompact(total)}đ</p>
        </div>
      </div>

      {/* Legend % — kiểu cũ */}
      <div className="mt-auto pt-4 space-y-2">
        {all.map((p) => (
          <div key={p.key} className="flex items-center justify-between text-sm">
            <span className="flex items-center gap-2">
              <Swatch color={p.color} />
              <span className="text-ink-soft">{p.label}</span>
            </span>
            <span className="text-ink font-medium">
              {fmtMoney(p.value)} <span className="text-ink-mute ml-1">{((p.value / total) * 100).toFixed(1)}%</span>
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}

// ===== 3. BẢNG TOP SHOWS — kiểu cũ (rank + badge vé + doanh thu vàng), dữ liệu thật =====
export const TopShowsTable = ({ shows }) => {
  if (!shows?.length) {
    return <p className="text-sm text-ink-mute py-10 text-center">Chưa có buổi diễn nào bán được vé trong kỳ.</p>
  }
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left whitespace-nowrap">
        <thead className="bg-page/60 border-y border-line">
          <tr>
            <th className="p-4 text-sm font-semibold text-ink-muter w-10">#</th>
            <th className="p-4 text-sm font-semibold text-ink-muter">Buổi diễn</th>
            <th className="p-4 text-sm font-semibold text-ink-muter">Vé bán</th>
            <th className="p-4 text-sm font-semibold text-ink-muter text-right">Doanh thu vé</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-line">
          {shows.map((s, i) => (
            <tr key={s.showId} className="hover:bg-sunken/40 transition-colors">
              <td className="p-4 text-ink-mute tabular-nums text-sm">{i + 1}</td>
              <td className="p-4">
                <Link to={`/shows/${s.showId}`} className="text-sm text-ink font-medium hover:text-ink transition-colors">
                  {s.title}
                </Link>
                <p className="text-xs text-ink-mute mt-0.5">{s.loungeName} · {dayjs(s.startTime).format('DD/MM/YYYY')}</p>
              </td>
              <td className="p-4">
                <span className="text-sm text-ink bg-sunken px-2 py-1 rounded-md tabular-nums">
                  {s.ticketsSold.toLocaleString('vi-VN')}
                </span>
              </td>
              <td className="p-4 text-right text-sm font-bold text-ink tabular-nums">{fmtMoney(s.ticketRevenue)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

// ===== 4. TRENDING GENRES — kiểu cũ (rank + thanh progress), dữ liệu thật theo vé bán =====
export const GenreTrendingList = ({ genres }) => {
  if (!genres?.length) {
    return <p className="text-sm text-ink-mute py-10 text-center">Chưa có vé nào bán ra trong kỳ.</p>
  }
  const rows = [...genres].sort((a, b) => b.ticketsSold - a.ticketsSold)
  const max = rows[0].ticketsSold || 1

  return (
    <div className="space-y-4">
      {rows.map((g, index) => (
        <div key={g.genreName}>
          <div className="flex items-center justify-between mb-1.5">
            <div className="flex items-center gap-2">
              <span className={`text-xs font-bold ${index === 0 ? 'text-ink' : 'text-ink-mute'}`}>#{index + 1}</span>
              <span className="text-sm font-medium text-ink flex items-center gap-1.5">
                <Music2 size={14} className="text-ink-mute" /> {g.genreName}
              </span>
            </div>
            <div className="flex items-center gap-1 text-xs font-medium text-ink-soft tabular-nums">
              <TrendingUp size={12} className="text-success" />
              {g.ticketsSold.toLocaleString('vi-VN')} vé · {g.showCount} show
            </div>
          </div>
          <div className="w-full h-1.5 bg-sunken overflow-hidden">
            <div
              className={`h-full ${index === 0 ? 'bg-ink' : 'bg-ink/60'}`}
              style={{ width: `${(g.ticketsSold / max) * 100}%` }}
            />
          </div>
        </div>
      ))}
      <p className="text-xs text-ink-mute pt-1 leading-relaxed">
        Xếp theo số vé bán trong kỳ. Một buổi diễn nhiều thể loại được tính vé cho từng thể loại.
      </p>
    </div>
  )
}
