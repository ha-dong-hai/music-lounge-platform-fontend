// src/components/admin/dashboard/DashboardCharts.jsx
// Dựng từ GET /analytics/admin-dashboard.
// MLACP-595 (04/10/2026): biểu đồ tiền theo ĐÚNG kỳ Admin chọn (trường `series`, đơn vị ngày/tuần/tháng do backend chọn
// theo độ dài kỳ) kèm đường KỲ TRƯỚC nét đứt — cách Shopify Analytics vẽ so sánh. Biểu đồ tròn khuyết tỷ trọng thay bằng
// thanh ngang: NN/g (Dashboards: Making Charts and Graphs Easier to Understand) khuyên tránh tròn/tròn khuyết trên
// dashboard vì mắt so độ dài nhanh hơn so góc.
import dayjs from 'dayjs'
import { Link } from 'react-router-dom'
import { Music2, TrendingUp } from 'lucide-react'
import { ComposedChart, BarChart, Bar, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { SURFACE, GRID, AXIS_TEXT, CURSOR, SOURCES, fmtMoney, fmtCompact } from './chartTokens'

// Nhãn trục theo đơn vị backend chọn. Tuần ghi ngày thứ Hai đầu tuần.
const nhanNhom = (start, unit) => {
  const d = dayjs(start)
  if (unit === 'month') return d.format('MM/YYYY')
  return d.format('DD/MM')
}
const TEN_DON_VI = { day: 'ngày', week: 'tuần', month: 'tháng' }

const Swatch = ({ color, size = 'w-2.5 h-2.5' }) => (
  <span className={`${size} flex-shrink-0`} style={{ backgroundColor: color }} />
)

// TOOLTIP: mỗi nguồn một dòng + tổng kỳ này + tổng kỳ trước cùng vị trí.
const RevenueTooltip = ({ active, payload }) => {
  if (!active || !payload?.length) return null
  const row = payload[0].payload
  return (
    <div className="bg-card border-2 border-ink p-3 shadow-soft text-xs">
      <p className="text-ink font-bold mb-2">{row.tieuDe}</p>
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
      {row.truoc != null && (
        <div className="flex justify-between gap-6 pt-0.5">
          <span className="text-ink-mute">Cùng vị trí kỳ trước</span>
          <span className="text-ink-soft tabular-nums">{fmtMoney(row.truoc)}</span>
        </div>
      )}
    </div>
  )
}

const tongNhom = (b, measure) => SOURCES.reduce((sum, s) => sum + Number(b?.[s.key]?.[measure] ?? 0), 0)

// Ghép kỳ này với kỳ trước THEO VỊ TRÍ (nhóm thứ i với nhóm thứ i) — hai kỳ cùng số ngày nên cùng số nhóm, trừ khi mốc
// rơi lệch tuần/tháng; nhóm không có cặp thì để trống đường kỳ trước chứ không bịa số 0.
const toSeriesRows = (series, unit, measure, seriesTruoc = null) => series.map((b, i) => {
  const row = { start: b.start, label: nhanNhom(b.start, unit) }
  row.tieuDe = unit === 'week' ? `Tuần từ ${dayjs(b.start).format('DD/MM/YYYY')}` : unit === 'month' ? `Tháng ${row.label}` : dayjs(b.start).format('DD/MM/YYYY')
  SOURCES.forEach((s) => { row[s.key] = Number(b[s.key]?.[measure] ?? 0) })
  row.total = SOURCES.reduce((sum, s) => sum + row[s.key], 0)
  row.truoc = seriesTruoc && seriesTruoc[i] ? tongNhom(seriesTruoc[i], measure) : null
  return row
})

// ===== 1. CỘT CHỒNG THEO KỲ + ĐƯỜNG KỲ TRƯỚC — MỘT đại lượng mỗi lúc (measure do trang chọn) =====
export const RevenueSeriesChart = ({ series, unit, measure, seriesTruoc }) => {
  const rows = toSeriesRows(series, unit, measure, seriesTruoc)
  const coKyTruoc = rows.some((r) => r.truoc != null)
  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-4 text-xs text-ink-soft">
        {SOURCES.map((s) => (
          <span key={s.key} className="inline-flex items-center gap-1.5"><Swatch color={s.color} /> {s.label}</span>
        ))}
        {coKyTruoc && (
          <span className="inline-flex items-center gap-1.5">
            <svg width="22" height="8" aria-hidden="true"><line x1="0" y1="4" x2="22" y2="4" stroke={AXIS_TEXT} strokeWidth="2" strokeDasharray="4 3" /></svg>
            Tổng kỳ trước
          </span>
        )}
      </div>

      <div className="h-[320px]">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={rows} margin={{ top: 8, right: 10, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke={GRID} vertical={false} />
            <XAxis dataKey="label" axisLine={{ stroke: GRID }} tickLine={false} minTickGap={12}
              tick={{ fill: AXIS_TEXT, fontSize: 12 }} />
            <YAxis width={56} axisLine={false} tickLine={false} tick={{ fill: AXIS_TEXT, fontSize: 12 }} tickFormatter={fmtCompact} />
            <Tooltip content={<RevenueTooltip />} cursor={{ fill: CURSOR, opacity: 0.6 }} />
            {SOURCES.map((s) => (
              <Bar key={s.key} dataKey={s.key} stackId="rev" fill={s.color} maxBarSize={28}
                stroke={SURFACE} strokeWidth={2} isAnimationActive={false} />
            ))}
            {coKyTruoc && (
              <Line type="monotone" dataKey="truoc" stroke={AXIS_TEXT} strokeWidth={2} strokeDasharray="4 3"
                dot={false} isAnimationActive={false} connectNulls={false} />
            )}
          </ComposedChart>
        </ResponsiveContainer>
      </div>
      <p className="text-xs text-ink-mute">Mỗi cột là một {TEN_DON_VI[unit] ?? 'nhóm'}. Cột đầu và cột cuối có thể chưa trọn {TEN_DON_VI[unit] ?? 'nhóm'}.</p>

      {/* Bản song song dạng bảng — đọc được mọi giá trị không cần rê chuột */}
      <details className="text-xs">
        <summary className="cursor-pointer text-ink-mute hover:text-ink-soft select-none min-h-[44px] inline-flex items-center">Xem dạng bảng</summary>
        <div className="overflow-x-auto mt-2">
          <table className="w-full tabular-nums">
            <thead>
              <tr className="text-ink-mute">
                <th scope="col" className="text-left py-1.5 pr-3 font-medium">{(TEN_DON_VI[unit] ?? 'nhóm').replace(/^./, (c) => c.toUpperCase())}</th>
                {SOURCES.map((s) => <th scope="col" key={s.key} className="text-right py-1.5 pr-3 font-medium">{s.label}</th>)}
                <th scope="col" className="text-right py-1.5 pr-3 font-medium">Tổng</th>
                {coKyTruoc && <th scope="col" className="text-right py-1.5 font-medium">Kỳ trước</th>}
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.start} className="border-t border-line text-ink-soft">
                  <td className="py-1.5 pr-3">{r.tieuDe}</td>
                  {SOURCES.map((s) => <td key={s.key} className="text-right py-1.5 pr-3">{fmtMoney(r[s.key])}</td>)}
                  <td className="text-right py-1.5 pr-3 text-ink">{fmtMoney(r.total)}</td>
                  {coKyTruoc && <td className="text-right py-1.5">{r.truoc == null ? '—' : fmtMoney(r.truoc)}</td>}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </details>
    </div>
  )
}

// ===== 2. TỶ TRỌNG NGUỒN TRONG KỲ — thanh ngang (thay biểu đồ tròn khuyết) =====
export const RevenueShareBars = ({ series, measure }) => {
  const all = SOURCES.map((s) => ({ ...s, value: series.reduce((sum, b) => sum + Number(b[s.key]?.[measure] ?? 0), 0) }))
  const total = all.reduce((sum, p) => sum + p.value, 0)
  if (total <= 0) return <p className="text-sm text-ink-mute py-12 text-center">Kỳ này chưa phát sinh doanh thu.</p>
  return (
    <div className="space-y-4">
      <p className="font-mono text-2xl font-semibold tabular-nums text-ink">{fmtMoney(total)}</p>
      <div className="h-[140px]">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={all} layout="vertical" margin={{ top: 0, right: 8, left: 0, bottom: 0 }}>
            <XAxis type="number" hide domain={[0, total]} />
            <YAxis type="category" dataKey="label" width={92} axisLine={false} tickLine={false} tick={{ fill: AXIS_TEXT, fontSize: 12 }} />
            <Tooltip formatter={(v) => fmtMoney(v)} cursor={{ fill: CURSOR, opacity: 0.6 }} />
            <Bar dataKey="value" name="Số tiền" isAnimationActive={false} maxBarSize={22}
              shape={(props) => <rect x={props.x} y={props.y} width={props.width} height={props.height} fill={props.payload.color} />} />
          </BarChart>
        </ResponsiveContainer>
      </div>
      <dl className="space-y-1.5 text-sm">
        {all.map((p) => (
          <div key={p.key} className="flex items-center justify-between gap-3">
            <dt className="flex items-center gap-2 text-ink-soft"><Swatch color={p.color} />{p.label}</dt>
            <dd className="text-ink font-medium tabular-nums">{fmtMoney(p.value)} <span className="text-ink-mute ml-1">{((p.value / total) * 100).toFixed(1)}%</span></dd>
          </div>
        ))}
      </dl>
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
        <thead className="bg-sunken border-b-2 border-ink">
          <tr>
            <th scope="col" className="p-4 text-sm font-semibold text-ink w-10">#</th>
            <th scope="col" className="p-4 text-sm font-semibold text-ink">Buổi diễn</th>
            <th scope="col" className="p-4 text-sm font-semibold text-ink">Vé bán</th>
            <th scope="col" className="p-4 text-sm font-semibold text-ink text-right">Doanh thu vé</th>
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
              {g.ticketsSold.toLocaleString('vi-VN')} vé · {g.showCount} buổi diễn
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
