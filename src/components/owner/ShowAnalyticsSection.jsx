// src/components/owner/ShowAnalyticsSection.jsx
//
// GHI CHÚ CHO ĐỘI FE:
// - BA NGUỒN ĐỘC LẬP, gọi bằng Promise.allSettled: một endpoint lỗi chỉ làm trống khối của nó.
// - DỰ BÁO KHÔNG PHẢI SỐ ĐÃ BÁN. Đặt cạnh số thật thì phải ghi nhãn rõ, kẻo chủ phòng trà đọc
//   "dự kiến 120 vé" thành "đã bán 120 vé". Vì vậy dự báo nằm trong khối riêng, có chữ "dự báo"
//   ngay trên con số, và luôn kèm khoảng thấp–cao chứ không chỉ một con số duy nhất.
// - `status` của dự báo: 'Forecast' = có số; 'NotEnoughHistory' / 'TooEarly' = KHÔNG PHẢI LỖI, đó
//   là câu trả lời đúng cho câu hỏi "dự báo được chưa". Hiện `explanation` của backend nguyên văn —
//   nó nói dự báo dựa trên bao nhiêu buổi diễn và vì sao chưa có số.
// - `venueHistoryWeight` là PHÂN SỐ 0–1 (1 = hoàn toàn dựa vào lịch sử của chính phòng trà này).
// - `checkInRate` và `conversionRate` backend trả dạng phần trăm (0–100), KHÔNG phải phân số —
//   khác với venueHistoryWeight. Đừng nhân 100 cho hai cái đầu.
// - Biểu đồ bán vé theo ngày: `date` là DateOnly ("2026-09-20"), dayjs đọc trực tiếp được.
import { useState, useEffect, useCallback } from 'react'
import { Loader2, TrendingUp, Eye, Ticket, QrCode, Percent, LineChart, Sparkles, Info } from 'lucide-react'
import dayjs from 'dayjs'
import {
  getShowPerformance, getTicketSalesTrend, getShowDemandForecast,
} from '../../services/analyticsServices'

const fmtSo = (v) => Number(v || 0).toLocaleString('vi-VN')
const fmtTien = (v) => `${Number(v || 0).toLocaleString('vi-VN')}đ`
// Hai tỉ lệ này backend đã trả sẵn dạng phần trăm.
const fmtPhanTram = (v) => `${Number(v || 0).toLocaleString('vi-VN', { maximumFractionDigits: 1 })}%`

const O = ({ title, value, note, icon: Icon }) => (
  <div className="bg-sunken/70 border border-line rounded-lg p-4">
    <div className="flex items-start justify-between gap-2">
      <p className="text-xs text-ink-mute">{title}</p>
      <Icon size={15} className="text-ink-mute flex-shrink-0" />
    </div>
    <p className="text-lg font-bold text-ink mt-1 tabular-nums">{value}</p>
    {note && <p className="text-[11px] text-ink-mute mt-1 leading-relaxed">{note}</p>}
  </div>
)

const ShowAnalyticsSection = ({ showId }) => {
  const [perf, setPerf] = useState(null)
  const [trend, setTrend] = useState(null)
  const [forecast, setForecast] = useState(null)
  const [isLoading, setIsLoading] = useState(true)

  const load = useCallback(async () => {
    setIsLoading(true)
    const kq = await Promise.allSettled([
      getShowPerformance(showId),
      getTicketSalesTrend(showId),
      getShowDemandForecast(showId),
    ])
    const [p, t, f] = kq.map((x) => (x.status === 'fulfilled' && x.value?.success ? x.value.data : null))
    setPerf(p)
    setTrend(t)
    setForecast(f)
    setIsLoading(false)
  }, [showId])

  useEffect(() => { const chay = async () => { await load() }; chay() }, [load])

  if (isLoading) {
    return (
      <div className="bg-card border border-line rounded-xl py-14 flex justify-center">
        <Loader2 size={24} className="animate-spin text-brand-text" />
      </div>
    )
  }

  if (!perf && !trend && !forecast) {
    return (
      <div className="bg-card border border-line rounded-xl p-6">
        <h2 className="text-lg font-semibold text-ink flex items-center gap-2">
          <TrendingUp size={18} className="text-brand-text" /> Thống kê
        </h2>
        <p className="text-sm text-ink-mute mt-2">Chưa có số liệu cho buổi diễn này.</p>
      </div>
    )
  }

  // Cao nhất trong chuỗi ngày, để vẽ cột theo tỉ lệ. Tránh chia cho 0 khi mọi ngày đều bằng 0.
  const dinh = Math.max(1, ...(trend?.dailySales ?? []).map((d) => d.ticketsSold || 0))

  return (
    <div className="space-y-4">
      {/* LƯỢT XEM & CHUYỂN ĐỔI */}
      {perf && (
        <div className="bg-card border border-line rounded-xl p-6">
          <h2 className="text-lg font-semibold text-ink flex items-center gap-2 mb-4">
            <TrendingUp size={18} className="text-brand-text" /> Lượt xem &amp; chuyển đổi
          </h2>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            <O title="Lượt xem trang" value={fmtSo(perf.totalPageViews)} icon={Eye}
              note={`${fmtSo(perf.uniqueViewers)} người khác nhau`} />
            <O title="Vé đã bán" value={fmtSo(perf.ticketsSold)} icon={Ticket}
              note={`${fmtSo(perf.uniquePurchasers)} người mua`} />
            <O title="Đã vào cửa" value={fmtSo(perf.ticketsCheckedIn)} icon={QrCode}
              note={`${fmtPhanTram(perf.checkInRate)} số vé đã bán`} />
            <O title="Tỉ lệ chuyển đổi" value={fmtPhanTram(perf.conversionRate)} icon={Percent}
              note="người xem trang → người mua vé" />
          </div>
          {perf.liveViewers > 0 && (
            <p className="text-xs text-ink-mute mt-3">
              Đang xem trực tiếp: <span className="text-ink">{fmtSo(perf.liveViewers)}</span>
            </p>
          )}
        </div>
      )}

      {/* BÁN VÉ THEO NGÀY + THEO HẠNG VÉ */}
      {trend && (
        <div className="bg-card border border-line rounded-xl p-6">
          <div className="flex flex-wrap items-start justify-between gap-3 mb-4">
            <h2 className="text-lg font-semibold text-ink flex items-center gap-2">
              <LineChart size={18} className="text-brand-text" /> Tiến độ bán vé
            </h2>
            <div className="text-right">
              <p className="text-lg font-bold text-brand-text tabular-nums">{fmtTien(trend.totalRevenue)}</p>
              <p className="text-xs text-ink-mute">{fmtSo(trend.totalTicketsSold)} vé</p>
            </div>
          </div>

          {(trend.dailySales?.length ?? 0) === 0 ? (
            <p className="text-sm text-ink-mute">Chưa có ngày nào bán được vé.</p>
          ) : (
            <div className="flex items-end gap-1 h-32">
              {trend.dailySales.map((d) => (
                <div key={d.date} className="flex-1 flex flex-col items-center justify-end h-full group relative">
                  <div className="w-full bg-brand/70 hover:bg-brand-hover rounded-t transition-colors"
                    style={{ height: `${((d.ticketsSold || 0) / dinh) * 100}%`, minHeight: d.ticketsSold > 0 ? 3 : 0 }} />
                  {/* Nhãn đặt trong tooltip vì có thể có mấy chục ngày, in hết ra sẽ chồng nhau */}
                  <div className="absolute bottom-full mb-1 hidden group-hover:block bg-page border border-line rounded-md px-2 py-1 whitespace-nowrap z-10">
                    <p className="text-xs text-ink">{dayjs(d.date).format('DD/MM')}</p>
                    <p className="text-xs text-ink-soft">{fmtSo(d.ticketsSold)} vé · {fmtTien(d.revenue)}</p>
                  </div>
                </div>
              ))}
            </div>
          )}

          {(trend.byTier?.length ?? 0) > 0 && (
            <div className="mt-5 pt-4 border-t border-line space-y-2">
              {trend.byTier.map((t) => (
                <div key={t.tierId} className="flex flex-wrap items-center justify-between gap-2 text-sm">
                  <span className="text-ink-soft">{t.tierName}</span>
                  <span className="text-ink-mute text-xs tabular-nums">
                    {fmtSo(t.ticketsSold)}
                    {t.capacity != null && ` / ${fmtSo(t.capacity)}`}
                    {/* sellThroughRate null khi hạng vé không giới hạn sức chứa */}
                    {t.sellThroughRate != null && ` · ${fmtPhanTram(t.sellThroughRate)}`}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* DỰ BÁO — KHỐI RIÊNG, ghi nhãn rõ để không lẫn với số đã bán */}
      {forecast && (
        <div className="bg-card border border-dashed border-line rounded-xl p-6">
          <h2 className="text-lg font-semibold text-ink flex items-center gap-2">
            <Sparkles size={18} className="text-ink-soft" /> Dự báo nhu cầu
          </h2>
          <p className="text-xs text-warning/90 mt-1 flex items-start gap-1.5 leading-relaxed">
            <Info size={12} className="mt-px flex-shrink-0" />
            Đây là SỐ DỰ ĐOÁN dựa trên lịch sử, không phải số vé đã bán. Đã bán thật:{' '}
            <span className="text-ink font-medium">{fmtSo(forecast.ticketsSoldSoFar)} vé</span>.
          </p>

          {forecast.status === 'Forecast' && forecast.projectedFinalSales != null ? (
            <>
              <div className="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="bg-sunken/70 border border-line rounded-lg p-4">
                  <p className="text-xs text-ink-mute">Dự kiến bán được (cả buổi)</p>
                  <p className="text-xl font-bold text-ink mt-1 tabular-nums">
                    {fmtSo(forecast.projectedFinalSales)} vé
                  </p>
                  {(forecast.projectedLow != null || forecast.projectedHigh != null) && (
                    <p className="text-[11px] text-ink-mute mt-1">
                      khoảng {fmtSo(forecast.projectedLow)}–{fmtSo(forecast.projectedHigh)} vé
                    </p>
                  )}
                </div>
                <div className="bg-sunken/70 border border-line rounded-lg p-4">
                  <p className="text-xs text-ink-mute">Còn lại</p>
                  <p className="text-xl font-bold text-ink mt-1 tabular-nums">{forecast.daysUntilShow} ngày</p>
                  {forecast.expectedPaceFraction != null && (
                    <p className="text-[11px] text-ink-mute mt-1">
                      tới mốc này thường đã bán {fmtPhanTram(Number(forecast.expectedPaceFraction) * 100)} tổng vé
                    </p>
                  )}
                </div>
                <div className="bg-sunken/70 border border-line rounded-lg p-4">
                  <p className="text-xs text-ink-mute">Dự kiến bán hết</p>
                  <p className="text-xl font-bold text-ink mt-1 tabular-nums">
                    {forecast.projectedSellThroughRate != null
                      ? fmtPhanTram(Number(forecast.projectedSellThroughRate) * 100)
                      : '—'}
                  </p>
                  <p className="text-[11px] text-ink-mute mt-1">
                    {forecast.capacity != null ? `trên ${fmtSo(forecast.capacity)} chỗ` : 'chưa đặt sức chứa'}
                  </p>
                </div>
              </div>

              {/* Dự báo dựa trên cái gì — không có phần này thì con số không dùng để quyết định gì */}
              <p className="text-xs text-ink-mute mt-4 leading-relaxed">
                {forecast.explanation}
              </p>
              <p className="text-[11px] text-ink-mute mt-2 leading-relaxed">
                Nghiêng về lịch sử của phòng trà bạn{' '}
                {fmtPhanTram(Number(forecast.venueHistoryWeight) * 100)} · dựa trên{' '}
                {fmtSo(forecast.venueReferenceShows)} buổi diễn của bạn và{' '}
                {fmtSo(forecast.platformReferenceShows)} buổi trên toàn hệ thống.
              </p>
            </>
          ) : (
            // NotEnoughHistory / TooEarly — không phải lỗi, chỉ là chưa dự báo được.
            <p className="text-sm text-ink-soft mt-4 leading-relaxed">{forecast.explanation}</p>
          )}
        </div>
      )}
    </div>
  )
}

export default ShowAnalyticsSection
