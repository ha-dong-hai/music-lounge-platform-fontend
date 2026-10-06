// src/components/owner/ShowAnalyticsSection.jsx
//
// GHI CHÚ CHO ĐỘI FE:
// - ĐÃ BỎ (chủ dự án 05/10/2026): khối "Dự báo nhu cầu" và hai ô "Lượt xem trang" / "Tỉ lệ chuyển đổi". Chủ phòng trà
//   không dùng tới, và hai số đó đọc dễ hiểu nhầm. Backend vẫn còn endpoint (getShowDemandForecast, totalPageViews,
//   conversionRate) — muốn hiện lại thì lấy lại khối cũ từ lịch sử git của tệp này (trước MLACP-654).
// - HAI NGUỒN ĐỘC LẬP, gọi bằng Promise.allSettled: một endpoint lỗi chỉ làm trống khối của nó.
// - (Ghi chú cũ, còn đúng nếu hiện lại dự báo) DỰ BÁO KHÔNG PHẢI SỐ ĐÃ BÁN. Đặt cạnh số thật thì phải ghi nhãn rõ, kẻo chủ phòng trà đọc
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
import { Loader2, TrendingUp, Ticket, QrCode, LineChart } from 'lucide-react'
import dayjs from 'dayjs'
import {
  getShowPerformance, getTicketSalesTrend,
} from '../../services/analyticsServices'

const fmtSo = (v) => Number(v || 0).toLocaleString('vi-VN')
const fmtTien = (v) => `${Number(v || 0).toLocaleString('vi-VN')}đ`
// Hai tỉ lệ này backend đã trả sẵn dạng phần trăm.
const fmtPhanTram = (v) => `${Number(v || 0).toLocaleString('vi-VN', { maximumFractionDigits: 1 })}%`

const O = ({ title, value, note, icon: Icon }) => (
  <div className="bg-sunken border border-line p-4">
    <div className="flex items-start justify-between gap-2">
      <p className="text-xs text-ink-mute">{title}</p>
      <Icon size={15} className="text-ink-mute flex-shrink-0" />
    </div>
    <p className="text-lg font-bold text-ink mt-1 tabular-nums">{value}</p>
    {note && <p className="text-xs text-ink-mute mt-1 leading-relaxed">{note}</p>}
  </div>
)

const ShowAnalyticsSection = ({ showId }) => {
  const [perf, setPerf] = useState(null)
  const [trend, setTrend] = useState(null)
  const [isLoading, setIsLoading] = useState(true)

  const load = useCallback(async () => {
    setIsLoading(true)
    const kq = await Promise.allSettled([
      getShowPerformance(showId),
      getTicketSalesTrend(showId),
    ])
    const [p, t] = kq.map((x) => (x.status === 'fulfilled' && x.value?.success ? x.value.data : null))
    setPerf(p)
    setTrend(t)
    setIsLoading(false)
  }, [showId])

  useEffect(() => { const chay = async () => { await load() }; chay() }, [load])

  if (isLoading) {
    return (
      <div className="bg-card border border-line py-14 flex justify-center">
        <Loader2 size={24} className="animate-spin text-ink" />
      </div>
    )
  }

  if (!perf && !trend) {
    return (
      <div className="bg-card border border-line p-6">
        <h2 className="text-3xl text-ink flex items-center gap-2">
          <TrendingUp size={18} className="text-ink" /> Thống kê
        </h2>
        <p className="text-sm text-ink-mute mt-2">Chưa có số liệu cho buổi diễn này.</p>
      </div>
    )
  }

  // Cao nhất trong chuỗi ngày, để vẽ cột theo tỉ lệ. Tránh chia cho 0 khi mọi ngày đều bằng 0.
  const dinh = Math.max(1, ...(trend?.dailySales ?? []).map((d) => d.ticketsSold || 0))

  return (
    <div className="space-y-4">
      {/* VÉ ĐÃ BÁN & VÀO CỬA */}
      {perf && (
        <div className="bg-card border border-line p-6">
          <h2 className="text-3xl text-ink flex items-center gap-2 mb-4">
            <TrendingUp size={18} className="text-ink" /> Vé và vào cửa
          </h2>
          <div className="grid grid-cols-2 gap-3">
            <O title="Vé đã bán" value={fmtSo(perf.ticketsSold)} icon={Ticket}
              note={`${fmtSo(perf.uniquePurchasers)} người mua`} />
            <O title="Đã vào cửa" value={fmtSo(perf.ticketsCheckedIn)} icon={QrCode}
              note={`${fmtPhanTram(perf.checkInRate)} số vé đã bán`} />
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
        <div className="bg-card border border-line p-6">
          <div className="flex flex-wrap items-start justify-between gap-3 mb-4">
            <h2 className="text-3xl text-ink flex items-center gap-2">
              <LineChart size={18} className="text-ink" /> Tiến độ bán vé
            </h2>
            <div className="text-right">
              <p className="text-lg font-bold text-ink tabular-nums">{fmtTien(trend.totalRevenue)}</p>
              <p className="text-xs text-ink-mute">{fmtSo(trend.totalTicketsSold)} vé</p>
            </div>
          </div>

          {/* MLACP-689: vé đã bán rồi được hoàn / khách huỷ không nằm trong số "đã bán" — nói rõ, kẻo "0 vé" đọc thành
              "không ai mua" (gặp thật 06/10: buổi phát bị cắt ngang, vé được hoàn tự động). Backend cũ không trả hai số
              này → undefined → không in dòng (không in "0 vé hoàn" sai). */}
          {(trend.ticketsRefunded > 0 || trend.ticketsCancelled > 0) && (
            <p className="text-sm text-ink-soft mb-3">
              Không tính vào số đã bán:
              {trend.ticketsRefunded > 0 && <> <span className="font-semibold text-ink">{fmtSo(trend.ticketsRefunded)} vé đã hoàn tiền</span></>}
              {trend.ticketsRefunded > 0 && trend.ticketsCancelled > 0 && ','}
              {trend.ticketsCancelled > 0 && <> <span className="font-semibold text-ink">{fmtSo(trend.ticketsCancelled)} vé khách đã huỷ</span></>}.
            </p>
          )}

          {(trend.dailySales?.length ?? 0) === 0 ? (
            <p className="text-sm text-ink-mute">
              {trend.ticketsRefunded > 0 || trend.ticketsCancelled > 0
                ? 'Hiện không còn vé nào đang có hiệu lực.'
                : 'Chưa có ngày nào bán được vé.'}
            </p>
          ) : (
            <div className="flex items-end gap-1 h-32">
              {trend.dailySales.map((d) => (
                <div key={d.date} className="flex-1 flex flex-col items-center justify-end h-full group relative">
                  <div className="w-full bg-ink/70 hover:bg-board rounded-t transition-colors"
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

    </div>
  )
}

export default ShowAnalyticsSection
