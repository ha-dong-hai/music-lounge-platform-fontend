// src/pages/admin/AdminDashboard.jsx
//
// TRANG TỔNG QUAN ADMIN — dashboard PHÂN TÍCH (NN/g: phân tích ≠ vận hành; việc cần xử lý gấp nằm ở các hàng chờ).
//
// LÀM LẠI 04/10/2026 (MLACP-595) — chủ dự án: "số liệu lớn theo thời gian dài mà cứ show hết ra, không có bộ lọc thời gian".
// Research: Shopify Analytics (khoảng định sẵn + so với kỳ trước, kỳ trước nét đứt), Stripe Dashboard (đơn vị gộp tự đổi
// theo độ dài khoảng), NN/g Dashboards (tránh biểu đồ tròn khuyết). Thay đổi:
//  - MỘT bộ chọn kỳ đầu trang (components/bang/ChonKy — Radix Popover + react-day-picker), kỳ nằm trên URL (nuqs). Mọi khối
//    "trong kỳ" theo đúng kỳ đó; trước đây ô số cố định tháng này, biểu đồ cố định 6 tháng, hai kỳ khác nhau trên một trang.
//  - Mỗi ô số trong kỳ ghi thay đổi so với KỲ TRƯỚC cùng độ dài (utils/kyBaoCao).
//  - Số liệu KHÔNG theo kỳ (đang hoạt động, đang chờ duyệt, luỹ kế) gom một khối riêng có tiêu đề nói rõ điều đó.
//  - Khối chất lượng mô hình gợi ý chuyển sang trang Nội dung và tương tác.
// Dữ liệu: TanStack Query, mỗi kỳ một khoá — đổi kỳ giữ số cũ mờ đi trong lúc tải (placeholderData) thay vì cả trang quay.
import { useState } from 'react'
import { keepPreviousData, useQuery } from '@tanstack/react-query'
import { Banknote, Ticket, Users, AlertCircle, Store, Music2, HeartHandshake, Loader2, Receipt } from 'lucide-react'
import { getPlatformAnalytics, getAdminOverview, getAdminDashboard } from '../../services/analyticsServices'
import { RevenueSeriesChart, RevenueShareBars, TopShowsTable, GenreTrendingList } from '../../components/admin/dashboard/DashboardCharts'
import { SOURCES } from '../../components/admin/dashboard/chartTokens'
import NhomTab from '../../components/bang/NhomTab'
import KhungTai from '../../components/bang/KhungTai'
import OChiSo from '../../components/bang/OChiSo'
import ChonKy from '../../components/bang/ChonKy'
import { useKyBaoCao } from '../../hooks/useKyBaoCao'
import { cauSoVoiKyTruoc, nhanKhoang, thamSoApi } from '../../utils/kyBaoCao'

const fmtMoney = (v) => `${Number(v || 0).toLocaleString('vi-VN')}đ`

// Khoá = LoungeStatus của backend; thứ tự = thứ tự hiển thị (đang hoạt động trước)
const VENUE_STATUS_LABELS = [
  ['Approved', 'hoạt động'],
  ['Warned', 'bị cảnh cáo'],
  ['Pending', 'chờ duyệt'],
  ['Suspended', 'tạm đình chỉ'],
  ['Locked', 'bị khoá'],
  ['Rejected', 'bị từ chối'],
]
const venueBreakdown = (byStatus) => {
  if (!byStatus) return null
  const parts = VENUE_STATUS_LABELS
    .filter(([key]) => byStatus[key] > 0)
    .map(([key, label]) => `${byStatus[key]} ${label}`)
  return parts.length ? parts.join(' · ') : null
}

// MỘT nút chuyển cho CẢ HAI khối doanh thu — hai khối luôn cùng đại lượng
const MEASURES = [
  { key: 'platformRevenue', label: 'Doanh thu nền tảng' },
  { key: 'gmv', label: 'Tổng giá trị giao dịch (GMV)' },
]

const tongTrongKy = (series, measure) =>
  (series ?? []).reduce((sum, b) => sum + SOURCES.reduce((s2, src) => s2 + Number(b[src.key]?.[measure] ?? 0), 0), 0)

const SectionTitle = ({ children }) => <h2 className="font-sans font-bold text-sm text-ink-soft mb-3">{children}</h2>

// Bóc { success, data } của axiosClient; lỗi thì ném để TanStack Query đánh dấu nguồn đó lỗi.
const boc = async (p) => { const r = await p; if (!r?.success) throw new Error(r?.message || 'Không tải được'); return r.data }

const AdminDashboard = () => {
  const { tu, den, truoc, datKy } = useKyBaoCao()
  const [measure, setMeasure] = useState('platformRevenue')
  const api = thamSoApi(tu, den)
  const apiTruoc = thamSoApi(truoc.tu, truoc.den)

  const chung = { placeholderData: keepPreviousData, staleTime: 60_000 }
  const tongQuan = useQuery({ queryKey: ['admin-tq', tu, den], queryFn: () => boc(getAdminOverview(api)), ...chung })
  const tongQuanTruoc = useQuery({ queryKey: ['admin-tq', truoc.tu, truoc.den], queryFn: () => boc(getAdminOverview(apiTruoc)), ...chung })
  const bang = useQuery({ queryKey: ['admin-db', tu, den], queryFn: () => boc(getAdminDashboard(api)), ...chung })
  const bangTruoc = useQuery({ queryKey: ['admin-db', truoc.tu, truoc.den], queryFn: () => boc(getAdminDashboard(apiTruoc)), ...chung })
  const luyKe = useQuery({ queryKey: ['admin-luy-ke'], queryFn: () => boc(getPlatformAnalytics()), staleTime: 60_000 })

  const nguon = [[tongQuan, 'số liệu trong kỳ'], [bang, 'biểu đồ và xếp hạng'], [luyKe, 'số liệu luỹ kế'], [tongQuanTruoc, 'số liệu kỳ trước'], [bangTruoc, 'biểu đồ kỳ trước']]
  const nguonLoi = nguon.filter(([q]) => q.isError).map(([, ten]) => ten)
  const taiLai = () => nguon.forEach(([q]) => q.isError && q.refetch())

  if (tongQuan.isPending && bang.isPending && luyKe.isPending) {
    return <div className="py-20 flex justify-center"><Loader2 size={32} className="animate-spin text-ink" aria-label="Đang tải" /></div>
  }

  const o = tongQuan.data; const oT = tongQuanTruoc.data
  const d = bang.data; const dT = bangTruoc.data
  const p = luyKe.data
  const dangDoiKy = tongQuan.isPlaceholderData || bang.isPlaceholderData
  // Có số kỳ trước mới ghi so sánh; đang tải kỳ trước thì để trống chứ không ghi "kỳ trước chưa có".
  const soSanh = (nay, cu) => (cu === undefined ? undefined : cauSoVoiKyTruoc(nay, cu))
  const gmvNay = tongTrongKy(d?.series, 'gmv')
  const gmvTruoc = dT ? tongTrongKy(dT.series, 'gmv') : undefined

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-4xl text-ink mb-1">Tổng quan</h1>
          <p className="text-ink-soft text-sm">So với kỳ trước: {nhanKhoang(truoc.tu, truoc.den)} (cùng số ngày, liền trước).</p>
        </div>
        <ChonKy tu={tu} den={den} onChon={datKy} />
      </div>
      {nguonLoi.length > 0 && <KhungTai loi tenVung={`phần ${nguonLoi.join(', ')}`} taiLai={taiLai} />}

      <div aria-busy={dangDoiKy} className={`space-y-8 transition-opacity ${dangDoiKy ? 'opacity-60' : ''}`}>
        {/* ===== TRONG KỲ ===== */}
        <section>
          <SectionTitle>Trong kỳ <span className="text-ink-mute font-normal">({nhanKhoang(tu, den)})</span></SectionTitle>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <OChiSo nhan="Doanh thu nền tảng" so={fmtMoney(o?.platformRevenueInPeriod)} icon={Banknote}
              phu={soSanh(o?.platformRevenueInPeriod, oT?.platformRevenueInPeriod)} />
            <OChiSo nhan="Tổng giá trị giao dịch" so={fmtMoney(gmvNay)} icon={Receipt}
              phu={soSanh(gmvNay, gmvTruoc)} />
            <OChiSo nhan="Buổi diễn trong kỳ" so={o?.eventsInPeriodCount ?? 0} icon={Music2}
              phu={soSanh(o?.eventsInPeriodCount, oT?.eventsInPeriodCount)} />
            <OChiSo nhan="Khán giả đăng ký mới" so={o?.newAudienceSignupsInPeriod ?? 0} icon={Users}
              phu={soSanh(o?.newAudienceSignupsInPeriod, oT?.newAudienceSignupsInPeriod)} />
          </div>
        </section>

        {/* ===== TIỀN THEO KỲ ===== */}
        {d ? (
          <section className="space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h2 className="font-sans text-lg font-bold text-ink">Tiền trong kỳ, tách theo nguồn</h2>
              <NhomTab nhan="Đại lượng doanh thu" dangChon={measure} onChon={setMeasure}
                cacTab={MEASURES.map((m) => ({ khoa: m.key, nhan: m.label }))} />
            </div>
            <p className="text-xs text-ink-mute leading-relaxed">
              {measure === 'platformRevenue'
                ? 'Phần nền tảng thực nhận: hoa hồng trên vé và tiền ủng hộ, cộng toàn bộ phí gói dịch vụ. Không gồm tiền giữ hộ phòng trà chờ quyết toán; vé bán tại quầy bằng tiền mặt không đi qua nền tảng nên gần như không có ở đây.'
                : 'Tổng tiền người mua trả, GỒM cả vé bán tại quầy bằng tiền mặt. Đây KHÔNG phải doanh thu của nền tảng — phần lớn thuộc về phòng trà và nghệ sĩ.'}
            </p>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2 bg-card border border-line p-6">
                {d.series ? (
                  <RevenueSeriesChart series={d.series} unit={d.seriesUnit} measure={measure} seriesTruoc={dT?.series} />
                ) : (
                  <p className="text-sm text-ink-soft">Máy chủ chưa có bản cập nhật biểu đồ theo kỳ (MLACP-594).</p>
                )}
              </div>
              <div className="lg:col-span-1 bg-card border border-line p-6">
                <h3 className="text-base font-semibold text-ink">Tỷ trọng theo nguồn</h3>
                <p className="text-xs text-ink-mute mt-0.5 mb-3">Cả kỳ {nhanKhoang(tu, den)}</p>
                <RevenueShareBars series={d.series ?? []} measure={measure} />
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2 bg-card border border-line overflow-hidden">
                <div className="p-6 pb-4">
                  <h3 className="text-lg font-semibold text-ink">Buổi diễn nổi bật</h3>
                  <p className="text-ink-mute text-xs">Theo doanh thu vé bán trong kỳ · 10 buổi đầu</p>
                </div>
                <TopShowsTable shows={d.topShows} />
              </div>
              <div className="lg:col-span-1 bg-card border border-line p-6">
                <h3 className="text-lg font-semibold text-ink mb-1">Thể loại được mua vé nhiều</h3>
                <p className="text-ink-mute text-xs mb-6">Xếp theo số vé bán trong kỳ</p>
                <GenreTrendingList genres={d.genres} />
              </div>
            </div>
          </section>
        ) : null}
      </div>

      {/* ===== KHÔNG THEO KỲ ===== */}
      <section>
        <SectionTitle>Hiện tại và luỹ kế <span className="text-ink-mute font-normal">(không theo kỳ đã chọn)</span></SectionTitle>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <OChiSo nhan="Phòng trà đang hoạt động" so={p?.operatingVenues ?? o?.activeVenuesCount ?? 0} icon={Store} phu="Tại thời điểm này" />
          <OChiSo nhan="Chờ duyệt thủ công" so={p?.pendingModerationsCount ?? 0} icon={AlertCircle}
            canChuY={p?.pendingModerationsCount > 0} phu={p?.pendingModerationsCount > 0 ? 'Cần xử lý' : 'Đã xử lý hết'} />
          <OChiSo nhan="Phòng trà đã đăng ký" so={p?.totalVenues ?? 0} icon={Store}
            phu={venueBreakdown(p?.venuesByStatus) || 'Mọi trạng thái, kể cả chờ duyệt'} />
          <OChiSo nhan="Tổng người dùng" so={(p?.totalUsers ?? 0).toLocaleString('vi-VN')} icon={Users} />
          <OChiSo nhan="Tổng giá trị giao dịch từ khi vận hành" so={fmtMoney(p?.totalGrossMerchandiseValue)} icon={Banknote} />
          <OChiSo nhan="Vé đã bán từ khi vận hành" so={(p?.totalTicketsSold ?? 0).toLocaleString('vi-VN')} icon={Ticket} />
          <OChiSo nhan="Tiền ủng hộ từ khi vận hành" so={fmtMoney(p?.totalDonationVolume)} icon={HeartHandshake} />
          <OChiSo nhan="Buổi diễn đã xuất bản" so={p?.totalPublishedShows ?? 0} icon={Music2} />
        </div>
      </section>
    </div>
  )
}

export default AdminDashboard
