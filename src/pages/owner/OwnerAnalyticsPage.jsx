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
import { Link } from 'react-router-dom'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from 'recharts'
import { Loader2, Banknote, Ticket, Music2, Star, Wallet, HandCoins, Download, Radio, Eye } from 'lucide-react'
import dayjs from 'dayjs'
import toast from 'react-hot-toast'
import { getLounges } from '../../services/loungeServices'
import {
  getMyLoungeAnalytics, getRevenueReport, exportRevenueReport,
  getArtistDonationStats, getOwnerLivestreamHistory,
} from '../../services/analyticsServices'
import KhungTai, { TrangLoiTai } from '../../components/bang/KhungTai'
import OChiSo from '../../components/bang/OChiSo'

const fmtMoney = (v) => `${Number(v || 0).toLocaleString('vi-VN')}đ`
const fmtAxis = (v) => {
  if (v >= 1000000) return `${v / 1000000}Tr`
  if (v >= 1000) return `${v / 1000}k`
  return v
}

// Ô số liệu: dùng OChiSo chung (01/10/2026). Bản cũ có ô biểu tượng tô màu (xanh/đỏ/xám) — màu chỉ trang trí, không mang
// nghĩa, và mỗi trang một kiểu ô số liệu. Tham số color/bg của nơi gọi được bỏ qua.
const StatCard = ({ title, value, note, icon }) => <OChiSo nhan={title} so={value} phu={note} icon={icon} />

const ChartTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-card border border-line p-3 shadow-soft text-xs">
      <p className="text-ink font-bold mb-2">{label}</p>
      {payload.map((e, i) => (
        <div key={i} className="flex items-center gap-2 text-ink-soft">
          <span className="w-2 h-2" style={{ backgroundColor: e.color }} />
          <span>{e.name}:</span>
          <span className="font-medium text-ink">{fmtMoney(e.value)}</span>
        </div>
      ))}
    </div>
  )
}

const OwnerAnalyticsPage = () => {
  const [lounge, setLounge] = useState(null)
  const [stats, setStats] = useState(null)
  const [revenue, setRevenue] = useState(null)
  const [artistDonations, setArtistDonations] = useState(null)
  const [livestreamHistory, setLivestreamHistory] = useState([])
  // Tổng số buổi đã phát (totalCount) — bảng chỉ lấy 20 buổi gần nhất, phải nói rõ khi còn nhiều hơn (GĐ4, 01/10/2026).
  const [tongLichSu, setTongLichSu] = useState(0)
  const [isExporting, setIsExporting] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  // Lỗi tải dữ liệu nền: vẽ TrangLoiTai thay vì nhánh 'chưa có' (01/10/2026 — xem components/bang/KhungTai.jsx).
  const [loiTai, setLoiTai] = useState(false)
  // Nguồn số liệu nào lỗi — bản cũ để khối đó trống mà không nói gì.
  const [nguonLoi, setNguonLoi] = useState([])
  const [lanTai, setLanTai] = useState(0)

  useEffect(() => {
    const run = async () => {
      setIsLoading(true)
      setLoiTai(false)
      try {
        const lRes = await getLounges({ mine: true })
        if (!lRes.success) throw new Error('lounges')
        const list = lRes.data?.items || lRes.data || []
        if (!list.length) {
          setIsLoading(false)
          return
        }
        const mine = list[0]
        setLounge(mine)

        // allSettled: bon nguon doc lap, mot cai loi khong lam trong ca trang.
        const kq = await Promise.allSettled([
          getMyLoungeAnalytics(mine.id),
          getRevenueReport(mine.id),
          getArtistDonationStats(mine.id),
          getOwnerLivestreamHistory(mine.id, { pageSize: 20 }),
        ])
        const lay = (x) => (x.status === 'fulfilled' && x.value?.success ? x.value.data : null)
        const [sData, rData, dData, lData] = kq.map(lay)
        if (sData) setStats(sData)
        if (rData) setRevenue(rData)
        if (dData) setArtistDonations(dData)
        if (lData) { setLivestreamHistory(lData.items ?? []); setTongLichSu(lData.totalCount ?? (lData.items ?? []).length) }
        setNguonLoi(['tổng quan', 'doanh thu theo tháng', 'tiền ủng hộ theo nghệ sĩ', 'lịch sử phát trực tiếp'].filter((_, i) => kq[i].status === 'rejected' || !kq[i].value?.success))
      } catch {
        // Lỗi khi hỏi "phòng trà của tôi" KHÔNG phải "chưa sở hữu phòng trà" — bản cũ nói vậy.
        setLoiTai(true)
      } finally {
        setIsLoading(false)
      }
    }
    run()
  }, [lanTai])

  // Xuat bao cao ra FILE: endpoint tra nhi phan nen phai xin blob, khong di qua duong JSON.
  const xuatBaoCao = async () => {
    if (!lounge) return
    setIsExporting(true)
    try {
      const blob = await exportRevenueReport(lounge.id)
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = 'bao-cao-doanh-thu-' + lounge.id + '-' + dayjs().format('YYYYMMDD') + '.xlsx'
      a.click()
      URL.revokeObjectURL(url)
      toast.success('Đã tải báo cáo doanh thu.')
    } catch (err) {
      toast.error(err.response?.data?.message || 'Không xuất được báo cáo.')
    } finally {
      setIsExporting(false)
    }
  }

  if (isLoading) {
    return (
      <div className="py-20 flex justify-center">
        <Loader2 size={32} className="animate-spin text-ink" />
      </div>
    )
  }

  if (loiTai) return <TrangLoiTai tieuDe="Báo cáo doanh thu" tenVung="báo cáo doanh thu" taiLai={() => setLanTai((n) => n + 1)} />

  if (!lounge) {
    return (
      <div className="bg-card border border-line p-8 text-center text-ink-mute">
        Tài khoản này chưa sở hữu phòng trà nào.
      </div>
    )
  }

  const trend = (stats?.revenueTrend || []).map((m) => ({
    month: `T.${m.month}`,
    'Vé tại chỗ': m.offlineTicketRevenue,
    'Vé trực tuyến': m.onlineTicketRevenue,
    'Gọi món': m.fnbRevenue,
  }))

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-4xl text-ink mb-1">Báo cáo doanh thu</h1>
        <p className="text-ink-soft text-sm">{lounge.name}</p>
      </div>
      {nguonLoi.length > 0 && <KhungTai loi tenVung={`phần ${nguonLoi.join(', ')}`} taiLai={() => setLanTai((n) => n + 1)} />}

      {/* === TỔNG QUAN === */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Doanh thu gộp"
          value={fmtMoney(stats?.totalRevenue)}
          note={`Vé ${fmtMoney(stats?.ticketRevenue)} · F&B ${fmtMoney(stats?.fnbRevenue)}`}
          icon={Banknote} color="text-success" bg="bg-success/10"
        />
        <StatCard
          title="Vé đã bán"
          value={stats?.totalTicketsSold ?? 0}
          note={`Tại chỗ ${stats?.offlineTicketsSold ?? 0} · Trực tuyến ${stats?.onlineTicketsSold ?? 0}`}
          icon={Ticket} color="text-ink" bg="bg-ink/10"
        />
        <StatCard
          title="Buổi diễn"
          value={stats?.totalShows ?? 0}
          note={`Sắp diễn ${stats?.upcomingShows ?? 0} · Đã diễn ${stats?.pastShows ?? 0}`}
          icon={Music2} color="text-ink" bg="bg-ink/10"
        />
        <StatCard
          title="Điểm đánh giá"
          value={stats?.averageRating != null ? Number(stats.averageRating).toFixed(1) : 'Chưa có'}
          note={`${stats?.totalRatings ?? 0} lượt đánh giá`}
          icon={Star} color="text-warning" bg="bg-warning/10"
        />
      </div>

      {/* === TIỀN THẬT SỰ ĐÃ VỀ === */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <StatCard
          title="Đã nhận về tài khoản"
          value={fmtMoney(revenue?.totalSettlementReceived)}
          note="Giải ngân theo đợt sau buổi diễn, nên chậm hơn doanh thu gộp"
          icon={Wallet} color="text-success" bg="bg-success/10"
        />
        <StatCard
          title="Phí nền tảng đã trả"
          value={fmtMoney(revenue?.totalPlatformFeePaid)}
          note="Hoa hồng + thuế đã khấu trừ khi giải ngân"
          icon={Banknote} color="text-danger" bg="bg-danger/10"
        />
        <StatCard
          title="Thu hộ nghệ sĩ"
          value={fmtMoney(revenue?.totalDonationCollectedForPerformers)}
          note="Tiền ủng hộ giữ hộ, phải chuyển cho nghệ sĩ — không phải doanh thu"
          icon={HandCoins} color="text-danger" bg="bg-danger/10"
        />
      </div>

      {/* TIỀN ĐANG NỢ NGHỆ SĨ — khác hẳn ô "Thu hộ nghệ sĩ" bên trên, đừng gộp:
            Thu hộ nghệ sĩ  = TỔNG đã thu hộ từ đầu tới nay, là số lịch sử.
            Đang chờ chuyển = phần CÒN NỢ ngay lúc này, có hạn chuyển và quá hạn thì bị cảnh cáo.
          Chỉ hiện số tổng thì chủ phòng trà không biết mình đang nợ bao nhiêu và có sắp quá hạn
          hay không. Hai trường này backend trả sẵn nhưng trước giờ không ai đọc. */}
      {(stats?.pendingArtistPayoutCount ?? 0) > 0 && (
        <div className="bg-card border border-warning/40 p-5 flex flex-wrap items-center justify-between gap-4">
          <div className="min-w-0">
            <p className="text-sm font-semibold text-warning flex items-center gap-2">
              <HandCoins size={16} /> Đang chờ bạn chuyển cho nghệ sĩ
            </p>
            <p className="text-2xl font-bold text-ink mt-1.5 tabular-nums">
              {fmtMoney(stats.pendingArtistPayoutAmount)}
            </p>
            <p className="text-xs text-ink-mute mt-1 leading-relaxed">
              {stats.pendingArtistPayoutCount} khoản. Đây là tiền của nghệ sĩ bạn đang giữ, có hạn
              chuyển — quá hạn là căn cứ để nghệ sĩ khiếu nại và để hệ thống cảnh cáo phòng trà.
            </p>
          </div>
          <Link to="/owner/donations"
            className="inline-flex flex-shrink-0 items-center justify-center gap-2 min-h-[44px] px-4 bg-ink text-lamp text-sm font-semibold hover:bg-board">
            Xử lý ngay
          </Link>
        </div>
      )}

      {/* === XU HƯỚNG DOANH THU === */}
      {trend.length > 0 && (
        <div className="bg-card border border-line p-6">
          <h3 className="text-lg font-semibold text-ink mb-1">Doanh thu theo tháng</h3>
          <p className="text-ink-mute text-xs mb-6">Tách theo vé tại chỗ, vé trực tuyến và gọi món.</p>
          <div className="h-[320px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={trend} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#333" vertical={false} />
                <XAxis dataKey="month" tick={{ fill: '#888', fontSize: 12 }} axisLine={{ stroke: '#333' }} tickLine={false} />
                <YAxis tick={{ fill: '#888', fontSize: 12 }} axisLine={{ stroke: '#333' }} tickLine={false} tickFormatter={fmtAxis} />
                <Tooltip content={<ChartTooltip />} cursor={{ fill: 'rgba(255,255,255,0.05)' }} />
                {/* Chữ chú giải màu mực: mặc định Recharts tô chữ theo màu chuỗi — chuỗi sáng thì chữ không đọc được (đo 01/10: 2.22:1). */}
                <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }} formatter={(v) => <span style={{ color: 'var(--color-ink)' }}>{v}</span>} />
                <Bar dataKey="Vé tại chỗ" stackId="a" fill="var(--color-ink)" />
                <Bar dataKey="Vé trực tuyến" stackId="a" fill="var(--color-chart-2)" />
                <Bar dataKey="Gọi món" stackId="a" fill="var(--color-chart-3)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* === TOP BUỔI DIỄN === */}
      {stats?.topShows?.length > 0 && (
        <div className="bg-card border border-line overflow-hidden">
          <div className="p-6 pb-4">
            <h3 className="text-lg font-semibold text-ink">Buổi diễn theo doanh thu</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left whitespace-nowrap">
              <thead className="bg-sunken border-b-2 border-ink">
                <tr>
                  <th scope="col" className="p-4 text-sm font-semibold text-ink uppercase">Buổi diễn</th>
                  <th scope="col" className="p-4 text-sm font-semibold text-ink uppercase">Vé bán / sức chứa</th>
                  <th scope="col" className="p-4 text-sm font-semibold text-ink uppercase text-right">Doanh thu</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {stats.topShows.map((s) => (
                  <tr key={s.showId} className="hover:bg-sunken/30 transition-colors">
                    <td className="p-4">
                      <p className="text-sm text-ink font-medium">{s.name}</p>
                      <p className="text-xs text-ink-mute mt-0.5">
                        {dayjs(s.scheduledStart).format('DD/MM/YYYY')}
                        {s.mainPerformerName && ` · ${s.mainPerformerName}`}
                      </p>
                    </td>
                    <td className="p-4">
                      <span className="text-sm text-ink bg-sunken px-2 py-1 rounded-md">
                        {s.ticketsSold}{s.totalCapacity != null ? ` / ${s.totalCapacity}` : ''}
                      </span>
                    </td>
                    <td className="p-4 text-right text-sm font-bold text-ink">{fmtMoney(s.revenue)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* XUẤT BÁO CÁO — endpoint trả về FILE, không phải JSON */}
      {lounge && (
        <button onClick={xuatBaoCao} disabled={isExporting}
          className="flex items-center gap-2 disabled:opacity-50 justify-center min-h-[44px] px-4 border-2 border-ink bg-card text-ink text-sm font-semibold hover:bg-ink hover:text-lamp">
          {isExporting ? <Loader2 size={16} className="animate-spin" /> : <Download size={16} />}
          Tải báo cáo doanh thu
        </button>
      )}

      {/* TIỀN DONATE THEO NGHỆ SĨ — tiền THU HỘ, không phải doanh thu của phòng trà */}
      {artistDonations && (artistDonations.byArtist?.length ?? 0) > 0 && (
        <div className="bg-card border border-line p-6">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h2 className="font-sans font-bold text-base text-ink">Tiền ủng hộ theo nghệ sĩ</h2>
              <p className="text-xs text-ink-mute mt-0.5 leading-relaxed">
                Đây là tiền khán giả tặng nghệ sĩ, phòng trà giữ hộ và phải chuyển tiếp — KHÔNG phải doanh thu của bạn.
              </p>
            </div>
            <div className="text-right flex-shrink-0">
              <p className="text-lg font-bold text-ink tabular-nums">{fmtMoney(artistDonations.grandTotalDonated)}</p>
              <p className="text-xs text-ink-mute">tổng thu hộ</p>
            </div>
          </div>

          <div className="overflow-x-auto mt-4">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-xs text-ink-mute border-b border-line">
                  <th scope="col" className="text-left py-2 pr-3 font-medium">Nghệ sĩ</th>
                  <th scope="col" className="text-right py-2 pr-3 font-medium">Lượt ủng hộ</th>
                  <th scope="col" className="text-right py-2 pr-3 font-medium">Số buổi diễn</th>
                  <th scope="col" className="text-right py-2 font-medium">Tổng tiền</th>
                </tr>
              </thead>
              <tbody>
                {artistDonations.byArtist.map((a) => (
                  <tr key={a.performerId} className="border-b border-line/60">
                    <td className="py-2.5 pr-3 text-ink">
                      {a.performerName}
                      {a.performerId === artistDonations.topPerformerId && (
                        <span className="ml-2 px-2 py-0.5 rounded-md bg-ink/10 text-ink text-xs">Cao nhất</span>
                      )}
                    </td>
                    <td className="py-2.5 pr-3 text-right text-ink-soft tabular-nums">{a.donationCount}</td>
                    <td className="py-2.5 pr-3 text-right text-ink-soft tabular-nums">{a.showCount}</td>
                    <td className="py-2.5 text-right text-ink tabular-nums">{fmtMoney(a.totalGross)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* LỊCH SỬ PHÁT TRỰC TIẾP */}
      {livestreamHistory.length > 0 && (
        <div className="bg-card border border-line p-6">
          <h2 className="font-sans font-bold text-base text-ink flex items-center gap-2">
            <Radio size={16} aria-hidden="true" /> Lịch sử phát trực tiếp
          </h2>
          {/* Trần: 20 buổi gần nhất. Nâng cấp khi cần xem hết: chuyển bảng này sang useDanhSachMayChu + BangDuLieu. */}
          <p className="text-sm text-ink-soft mt-1">
            {tongLichSu > livestreamHistory.length
              ? `${livestreamHistory.length} buổi gần nhất trên ${tongLichSu.toLocaleString('vi-VN')} buổi đã phát.`
              : `${livestreamHistory.length} buổi đã phát.`}
          </p>
          <div className="overflow-x-auto mt-4">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-xs text-ink-mute border-b border-line">
                  <th scope="col" className="text-left py-2 pr-3 font-medium">Buổi diễn</th>
                  <th scope="col" className="text-right py-2 pr-3 font-medium">Xem cao nhất</th>
                  <th scope="col" className="text-right py-2 pr-3 font-medium">Tổng lượt xem</th>
                  <th scope="col" className="text-right py-2 pr-3 font-medium">Doanh thu vé xem</th>
                  <th scope="col" className="text-right py-2 font-medium">Tiền ủng hộ</th>
                </tr>
              </thead>
              <tbody>
                {livestreamHistory.map((l) => (
                  <tr key={l.livestreamId} className="border-b border-line/60">
                    <td className="py-2.5 pr-3">
                      <p className="text-ink">{l.showName}</p>
                      <p className="text-xs text-ink-mute mt-0.5">
                        {l.startedAt ? dayjs(l.startedAt).format('HH:mm DD/MM/YYYY') : 'Chưa phát'}
                      </p>
                    </td>
                    <td className="py-2.5 pr-3 text-right text-ink-soft tabular-nums">
                      <span className="inline-flex items-center gap-1"><Eye size={12} />{l.peakViewerCount}</span>
                    </td>
                    <td className="py-2.5 pr-3 text-right text-ink-soft tabular-nums">{l.totalViews}</td>
                    <td className="py-2.5 pr-3 text-right text-ink tabular-nums">{fmtMoney(l.ppvRevenue)}</td>
                    <td className="py-2.5 text-right text-ink-soft tabular-nums">{fmtMoney(l.totalDonations)}</td>
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
