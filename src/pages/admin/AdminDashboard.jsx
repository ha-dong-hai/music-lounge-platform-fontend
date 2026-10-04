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
import { Loader2 } from 'lucide-react'
import { getPlatformAnalytics, getAdminOverview, getAdminDashboard } from '../../services/analyticsServices'
import { RevenueSeriesChart, RevenueShareBars, TopShowsTable, GenreTrendingList } from '../../components/admin/dashboard/DashboardCharts'
import { SOURCES } from '../../components/admin/dashboard/chartTokens'
import NhomTab from '../../components/bang/NhomTab'
import KhungTai from '../../components/bang/KhungTai'
import OChiSo from '../../components/bang/OChiSo'
import ChonKy from '../../components/bang/ChonKy'
import KhoiMuc from '../../components/bang/KhoiMuc'
import MucGap from '../../components/bang/MucGap'
import { phanTram } from '../../utils/dinhDangSo'
import ViecCanXuLy from '../../components/admin/dashboard/ViecCanXuLy'
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

// Tiêu đề khối biểu đồ theo đơn vị gộp backend chọn (ngày/tuần/tháng tuỳ độ dài kỳ).
const TEN_DON_VI_KY = { day: 'ngày', week: 'tuần', month: 'tháng' }

const tongTrongKy = (series, measure) =>
  (series ?? []).reduce((sum, b) => sum + SOURCES.reduce((s2, src) => s2 + Number(b[src.key]?.[measure] ?? 0), 0), 0)


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

  // Câu tóm tắt cho từng mục gập — kết luận của khối, đọc được khi chưa mở.
  const tongNguon = SOURCES.map((s) => ({ ...s, v: (d?.series ?? []).reduce((t, b) => t + Number(b[s.key]?.[measure] ?? 0), 0) }))
  const tongTien = tongNguon.reduce((t, s) => t + s.v, 0)
  const tomTatTien = tongTien > 0
    ? tongNguon.filter((s) => s.v > 0).map((s) => `${s.label} ${phanTram((s.v / tongTien) * 100, 0)}`).join(' · ')
    : 'Chưa phát sinh'
  const dau = d?.topShows?.[0]
  const theLoaiDau = d?.genres?.length ? [...d.genres].sort((a, b) => b.ticketsSold - a.ticketsSold)[0] : null

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-4xl text-ink mb-1">Tổng quan</h1>
          <p className="text-ink-soft text-sm">Việc cần làm trước, kết quả kỳ này sau. Chi tiết bấm để mở.</p>
        </div>
        <ChonKy tu={tu} den={den} onChon={datKy} />
      </div>

      {/* 1 — VIỆC CẦN LÀM: thứ duy nhất đòi hành động, nên đứng đầu. */}
      <ViecCanXuLy />

      {nguonLoi.length > 0 && <KhungTai loi tenVung={`phần ${nguonLoi.join(', ')}`} taiLai={taiLai} />}

      <div aria-busy={dangDoiKy} className={`space-y-8 transition-opacity ${dangDoiKy ? 'opacity-60' : ''}`}>
        {/* 2 — KẾT QUẢ KỲ NÀY: bốn con số, mỗi số so với kỳ trước. Đây là hết màn đầu. */}
        <KhoiMuc id="trong-ky" tieuDe="Kết quả kỳ này" phamVi={`${nhanKhoang(tu, den)} · so với ${nhanKhoang(truoc.tu, truoc.den)}`}>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <OChiSo mau="tien" nhan="Doanh thu nền tảng" so={fmtMoney(o?.platformRevenueInPeriod)}
              phu={soSanh(o?.platformRevenueInPeriod, oT?.platformRevenueInPeriod)} />
            <OChiSo mau="tien" nhan="Tổng giá trị giao dịch" so={fmtMoney(gmvNay)}
              phu={soSanh(gmvNay, gmvTruoc)} />
            <OChiSo mau="buoidien" nhan="Buổi diễn trong kỳ" so={o?.eventsInPeriodCount ?? 0}
              phu={soSanh(o?.eventsInPeriodCount, oT?.eventsInPeriodCount)} />
            <OChiSo mau="khangia" nhan="Khán giả đăng ký mới" so={o?.newAudienceSignupsInPeriod ?? 0}
              phu={soSanh(o?.newAudienceSignupsInPeriod, oT?.newAudienceSignupsInPeriod)} />
          </div>
        </KhoiMuc>

        {/* 3 — CHI TIẾT: mỗi khối một dòng có câu tóm tắt; mở khi cần (components/bang/MucGap). */}
        <section aria-labelledby="chi-tiet" className="space-y-3">
          <h2 id="chi-tiet" className="font-sans text-xl font-bold text-ink">Chi tiết <span className="ml-2 text-sm font-normal text-ink-mute">bấm vào dòng để mở</span></h2>

          {d && (
            <MucGap id="tien-theo-nguon" mau="tien" tieuDe="Tiền theo ngày và theo nguồn" tomTat={tomTatTien}>
              <div className="flex flex-wrap items-center justify-between gap-3 py-3">
                <p className="text-sm text-ink-soft">
                  {measure === 'platformRevenue'
                    ? 'Phần nền tảng thực nhận: hoa hồng vé và tiền ủng hộ, cộng phí gói dịch vụ.'
                    : 'Tổng tiền người mua trả, gồm cả vé bán tại quầy. Không phải doanh thu của nền tảng.'}
                </p>
                <NhomTab nhan="Đại lượng doanh thu" dangChon={measure} onChon={setMeasure}
                  cacTab={MEASURES.map((m) => ({ khoa: m.key, nhan: m.label }))} />
              </div>
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2">
                  <h3 className="text-base font-semibold text-ink mb-3">Theo {TEN_DON_VI_KY[d.seriesUnit] ?? 'thời gian'}</h3>
                  {d.series ? (
                    <RevenueSeriesChart series={d.series} unit={d.seriesUnit} measure={measure} seriesTruoc={dT?.series} />
                  ) : (
                    <p className="text-sm text-ink-soft">Máy chủ chưa có bản cập nhật biểu đồ theo kỳ (MLACP-594).</p>
                  )}
                </div>
                <div>
                  <h3 className="text-base font-semibold text-ink mb-3">Tỷ trọng cả kỳ</h3>
                  <RevenueShareBars series={d.series ?? []} measure={measure} />
                </div>
              </div>
            </MucGap>
          )}

          {d && (
            <MucGap id="buoi-ban-tot" mau="buoidien" tieuDe="Buổi diễn bán vé tốt nhất"
              tomTat={dau ? `Dẫn đầu: ${dau.title} — ${fmtMoney(dau.ticketRevenue)}` : 'Chưa có buổi nào bán vé'}>
              <div className="-mx-4 sm:-mx-5"><TopShowsTable shows={d.topShows} /></div>
            </MucGap>
          )}

          {d && (
            <MucGap id="the-loai" mau="buoidien" tieuDe="Thể loại theo số vé bán"
              tomTat={theLoaiDau ? `Nhiều nhất: ${theLoaiDau.genreName} — ${theLoaiDau.ticketsSold.toLocaleString('vi-VN')} vé` : 'Chưa có vé nào'}>
              <div className="max-w-2xl pt-3"><GenreTrendingList genres={d.genres} /></div>
            </MucGap>
          )}

          {/* Không theo kỳ. 04/10/2026: bỏ "Phòng trà đang hoạt động" (lặp dòng phụ của ô Phòng trà đã đăng ký) và "Chờ duyệt
              thủ công" (đã nằm trong khối Việc cần xử lý) — một việc một chỗ. */}
          <MucGap id="luy-ke" tieuDe="Từ khi vận hành"
            tomTat={`${p?.totalVenues ?? 0} phòng trà · ${(p?.totalUsers ?? 0).toLocaleString('vi-VN')} người dùng · ${(p?.totalTicketsSold ?? 0).toLocaleString('vi-VN')} vé đã bán`}>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 pt-4">
              <OChiSo mau="uytin" nhan="Phòng trà đã đăng ký" so={p?.totalVenues ?? 0}
                phu={venueBreakdown(p?.venuesByStatus) || 'Mọi trạng thái, kể cả chờ duyệt'} />
              <OChiSo mau="khangia" nhan="Người dùng" so={(p?.totalUsers ?? 0).toLocaleString('vi-VN')} />
              <OChiSo mau="buoidien" nhan="Buổi diễn đã xuất bản" so={p?.totalPublishedShows ?? 0} />
              <OChiSo mau="buoidien" nhan="Vé đã bán" so={(p?.totalTicketsSold ?? 0).toLocaleString('vi-VN')} />
              <OChiSo mau="tien" nhan="Tổng giá trị giao dịch" so={fmtMoney(p?.totalGrossMerchandiseValue)} />
              <OChiSo mau="tien" nhan="Tiền ủng hộ" so={fmtMoney(p?.totalDonationVolume)} />
            </div>
          </MucGap>
        </section>
      </div>
    </div>
  )
}

export default AdminDashboard
