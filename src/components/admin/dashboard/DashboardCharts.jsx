// src/components/admin/dashboard/DashboardCharts.jsx
// Dựng từ GET /analytics/admin-dashboard.
// MLACP-595 (04/10/2026): biểu đồ tiền theo ĐÚNG kỳ Admin chọn (trường `series`, đơn vị ngày/tuần/tháng do backend chọn
// theo độ dài kỳ) kèm đường KỲ TRƯỚC nét đứt — cách Shopify Analytics vẽ so sánh. Biểu đồ tròn khuyết tỷ trọng thay bằng
// thanh ngang: NN/g (Dashboards: Making Charts and Graphs Easier to Understand) khuyên tránh tròn/tròn khuyết trên
// dashboard vì mắt so độ dài nhanh hơn so góc.
//
// 04/10/2026 (rà soát thị giác trang quản trị — reports/Trang quản trị - rà soát thị giác và luật trình bày số liệu.md):
//  - Nguồn "gói dịch vụ" vẽ sọc chéo (chartTokens `hoaVan`) — phân biệt bằng kết cấu, không chỉ bằng ba sắc nâu gần nhau.
//  - Tỷ trọng: một danh sách thanh có NHÃN TRỰC TIẾP (tên · số tiền · phần trăm ngay trên thanh) thay cho thanh recharts +
//    chú giải + danh sách số (một thông tin in ba lần, chú giải che thanh khi rê chuột). Datawrapper/GOV.UK: nhãn trực tiếp.
//  - Bỏ biểu tượng ♪ và mũi tên "đang tăng" ở mọi dòng thể loại: số đó là số vé, không phải xu hướng — mũi tên nói sai.
//  - Phần trăm định dạng tiếng Việt (utils/dinhDangSo), không còn "73.0%".
import { useId } from 'react'
import dayjs from 'dayjs'
import { Link } from 'react-router-dom'
import { ComposedChart, Bar, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { SURFACE, GRID, AXIS_TEXT, CURSOR, SOURCES, fmtMoney, fmtCompact } from './chartTokens'
import { phanTram } from '../../../utils/dinhDangSo'
import BieuDoThanhNgang from '../../bang/BieuDoThanhNgang'

// Hoa văn sọc chéo cho nguồn có `hoaVan` — dùng chung cho cột biểu đồ, ô chú giải và thanh tỷ trọng.
const HoaVan = ({ id, color }) => (
  <pattern id={id} width="6" height="6" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
    <rect width="6" height="6" fill={SURFACE} />
    <rect width="3.5" height="6" fill={color} />
  </pattern>
)
const fillCua = (s, tienTo) => (s.hoaVan ? `url(#${tienTo}-${s.key})` : s.color)

// Nhãn trục theo đơn vị backend chọn. Tuần ghi ngày thứ Hai đầu tuần.
const nhanNhom = (start, unit) => {
  const d = dayjs(start)
  if (unit === 'month') return d.format('MM/YYYY')
  return d.format('DD/MM')
}
const TEN_DON_VI = { day: 'ngày', week: 'tuần', month: 'tháng' }

// Ô màu chú giải: SVG để vẽ được cả hoa văn (nguồn sọc chéo phải trông giống hệt trên cột).
const Swatch = ({ nguon, kichThuoc = 10 }) => {
  const id = useId().replace(/:/g, '')
  return (
    <svg width={kichThuoc} height={kichThuoc} aria-hidden="true" className="flex-shrink-0">
      {nguon.hoaVan && <defs><HoaVan id={`${id}-${nguon.key}`} color={nguon.color} /></defs>}
      <rect width={kichThuoc} height={kichThuoc} fill={fillCua(nguon, id)} stroke={nguon.color} strokeWidth={nguon.hoaVan ? 1 : 0} />
    </svg>
  )
}

// TOOLTIP: mỗi nguồn một dòng + tổng kỳ này + tổng kỳ trước cùng vị trí.
const RevenueTooltip = ({ active, payload }) => {
  if (!active || !payload?.length) return null
  const row = payload[0].payload
  return (
    <div className="bg-card border-2 border-ink p-3 shadow-soft text-xs">
      <p className="text-ink font-bold mb-2">{row.tieuDe}</p>
      {SOURCES.map((s) => (
        <div key={s.key} className="flex items-center justify-between gap-6 py-0.5">
          <span className="inline-flex items-center gap-2 text-ink-soft"><Swatch nguon={s} kichThuoc={8} />{s.label}</span>
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
          <span key={s.key} className="inline-flex items-center gap-1.5"><Swatch nguon={s} /> {s.label}</span>
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
            <defs>{SOURCES.filter((s) => s.hoaVan).map((s) => <HoaVan key={s.key} id={`hv-cot-${s.key}`} color={s.color} />)}</defs>
            <CartesianGrid strokeDasharray="3 3" stroke={GRID} vertical={false} />
            <XAxis dataKey="label" axisLine={{ stroke: GRID }} tickLine={false} minTickGap={12}
              tick={{ fill: AXIS_TEXT, fontSize: 12 }} />
            <YAxis width={56} axisLine={false} tickLine={false} tick={{ fill: AXIS_TEXT, fontSize: 12 }} tickFormatter={fmtCompact} />
            <Tooltip content={<RevenueTooltip />} cursor={{ fill: CURSOR, opacity: 0.6 }} />
            {SOURCES.map((s) => (
              <Bar key={s.key} dataKey={s.key} name={s.label} stackId="rev" fill={fillCua(s, 'hv-cot')} maxBarSize={28}
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

// ===== 2. TỶ TRỌNG NGUỒN TRONG KỲ — thanh ngang nhãn trực tiếp (BieuDoThanhNgang, dựng bằng recharts) =====
// Mỗi hàng: tên nguồn · thanh độ dài · "số tiền · phần trăm". Không chú giải tách rời, không tooltip che thanh.
export const RevenueShareBars = ({ series, measure }) => {
  const all = SOURCES.map((s) => ({ ...s, value: series.reduce((sum, b) => sum + Number(b[s.key]?.[measure] ?? 0), 0) }))
  const total = all.reduce((sum, p) => sum + p.value, 0)
  if (total <= 0) return <p className="text-sm text-ink-soft py-12 text-center">Kỳ này chưa phát sinh doanh thu.</p>
  return (
    <div className="space-y-4">
      <p className="font-mono text-2xl font-semibold tabular-nums text-ink">{fmtMoney(total)}</p>
      <BieuDoThanhNgang toiDa={total}
        // Nguồn 0đ không vẽ: thanh dài 0 không có gì để so, và recharts không in nhãn cho thanh rỗng (để lại hàng trống).
        data={all.filter((p) => p.value > 0).map((p) => ({ khoa: p.key, nhan: p.label, giaTri: p.value, nhanGiaTri: `${fmtMoney(p.value)} · ${phanTram((p.value / total) * 100)}`, mau: p.color, hoaVan: p.hoaVan }))} />
    </div>
  )
}
// ===== 3. BẢNG BUỔI DIỄN NỔI BẬT =====
// 04/10/2026: bỏ ô số vé bo tròn (`rounded-md` — trái luật góc vuông) — số căn phải như mọi cột số; tên buổi dẫn tới trang
// buổi diễn CỦA ADMIN (/admin/shows/:id), không phải trang khán giả.
export const TopShowsTable = ({ shows }) => {
  if (!shows?.length) {
    return <p className="text-sm text-ink-soft py-10 text-center">Chưa có buổi diễn nào bán được vé trong kỳ.</p>
  }
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left whitespace-nowrap">
        <caption className="sr-only">Buổi diễn xếp theo doanh thu vé trong kỳ</caption>
        <thead className="border-b-2 border-ink">
          <tr className="text-sm text-ink-soft">
            <th scope="col" className="px-5 py-3 font-semibold w-10">#</th>
            <th scope="col" className="px-5 py-3 font-semibold">Buổi diễn</th>
            <th scope="col" className="px-5 py-3 font-semibold text-right">Vé bán</th>
            <th scope="col" className="px-5 py-3 font-semibold text-right">Doanh thu vé</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-line">
          {shows.map((s, i) => (
            <tr key={s.showId} className="hover:bg-sunken/60 transition-colors">
              <td className="px-5 py-3 text-ink-mute tabular-nums text-sm">{i + 1}</td>
              <td className="px-5 py-3">
                <Link to={`/admin/shows/${s.showId}`} className="text-sm text-ink font-semibold hover:underline underline-offset-4">
                  {s.title}
                </Link>
                <p className="text-sm text-ink-soft mt-0.5">{s.loungeName} · {dayjs(s.startTime).format('DD/MM/YYYY')}</p>
              </td>
              <td className="px-5 py-3 text-right text-sm text-ink tabular-nums">{s.ticketsSold.toLocaleString('vi-VN')}</td>
              <td className="px-5 py-3 text-right text-sm font-bold text-ink tabular-nums">{fmtMoney(s.ticketRevenue)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

// ===== 4. THỂ LOẠI THEO SỐ VÉ BÁN =====
// Hiện SO_THE_LOAI_HIEN dòng đầu; phần còn lại nằm trong <details> gốc của trình duyệt (không tự dựng nút bật/tắt), ghi rõ số
// đang ẩn, CÙNG thang đo với phần trên. Mọi thanh một màu: không thể loại nào quan trọng hơn (Datawrapper).
const SO_THE_LOAI_HIEN = 6

export const GenreTrendingList = ({ genres }) => {
  if (!genres?.length) {
    return <p className="text-sm text-ink-soft py-10 text-center">Chưa có vé nào bán ra trong kỳ.</p>
  }
  const rows = [...genres].sort((a, b) => b.ticketsSold - a.ticketsSold)
    .map((g) => ({ khoa: g.genreName, nhan: g.genreName, giaTri: g.ticketsSold, nhanGiaTri: `${g.ticketsSold.toLocaleString('vi-VN')} vé · ${g.showCount} buổi` }))
  const max = rows[0].giaTri || 1
  const an = rows.slice(SO_THE_LOAI_HIEN)

  return (
    <div className="space-y-3">
      <BieuDoThanhNgang data={rows.slice(0, SO_THE_LOAI_HIEN)} toiDa={max} />
      {an.length > 0 && (
        <details>
          <summary className="cursor-pointer min-h-[44px] inline-flex items-center text-sm font-semibold text-ink underline underline-offset-4">
            Xem thêm {an.length} thể loại
          </summary>
          <BieuDoThanhNgang data={an} toiDa={max} />
        </details>
      )}
      <p className="text-sm text-ink-soft leading-relaxed">
        Buổi diễn nhiều thể loại được tính cho từng thể loại.
      </p>
    </div>
  )
}