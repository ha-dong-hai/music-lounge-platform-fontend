// src/pages/admin/AdminDashboard.jsx
//
// TRANG TỔNG QUAN ADMIN.
//
// BỐ CỤC LẤY TỪ MẪU (05/10/2026) — chủ dự án: "cả bố cục design cũng nên tham khảo từ các repo template đã được thiết kế của
// React 19, Tailwind 4, Vite… tuyệt đối đừng tự code"; "thiết kế phải đáp ứng… người dùng cần gì, vướng ở đâu".
// Khung trang này theo https://github.com/satnaing/shadcn-admin/blob/e16c87f/src/features/dashboard/index.tsx (MIT):
//   tiêu đề + nút bên phải  →  Tabs  →  hàng 4 thẻ số  →  lưới 7 cột: biểu đồ (4) + danh sách (3).
// Linh kiện: Tabs, Card, Table, chart của shadcn/ui (src/components/ui); thẻ số và nhãn màu chuyển từ TailAdmin
// (src/components/ui/admin). Không còn linh kiện tự dựng nào trên trang này.
//
// Vì sao bố cục này hợp với người dùng (reports/Trang quản trị - người dùng cần gì, vướng ở đâu, lấy bố cục từ mẫu nào.md):
//   - Tab đầu mở ra là VIỆC CẦN XỬ LÝ rồi mới tới số — quản trị viên vào trang trước hết để xử lý hàng đợi có hạn.
//   - Phần đào sâu (tiền theo nguồn, buổi diễn, luỹ kế) nằm ở các tab khác: màn đầu không dài, không bày hết một lúc.
//
// Dữ liệu (không đổi từ MLACP-595): một bộ chọn kỳ (ChonKy, kỳ nằm trên URL); mỗi số trong kỳ so với kỳ trước cùng độ dài;
// số không theo kỳ gom riêng một tab. TanStack Query, đổi kỳ thì giữ số cũ mờ đi trong lúc tải.
import { useState } from 'react'
import { Link } from 'react-router-dom'
import { keepPreviousData, useQuery } from '@tanstack/react-query'
import dayjs from 'dayjs'
import { Loader2, Banknote, Receipt, Music2, Users, Store, Ticket, HeartHandshake, AlertTriangle, CheckCircle2, Sparkles, MousePointerClick } from 'lucide-react'
import { getPlatformAnalytics, getAdminOverview, getAdminDashboard, getAiRecommendationPerformance, getRecommenderEvaluation } from '../../services/analyticsServices'
import KhoiDanhGiaGoiY from '../../components/admin/dashboard/KhoiDanhGiaGoiY'
import { SOURCES, fmtMoney, fmtCompact } from '../../components/admin/dashboard/chartTokens'
import KhungTai from '../../components/bang/KhungTai'
import ChonKy from '../../components/bang/ChonKy'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../components/ui/tabs'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../components/ui/table'
import TheChiSo from '../../components/ui/admin/the-chi-so'
import NhanMau from '../../components/ui/admin/nhan-mau'
import DongDanhSach from '../../components/ui/admin/dong-danh-sach'
import { BieuDoCotChong, BieuDoNgang } from '../../components/ui/admin/bieu-do'
import { useKyBaoCao } from '../../hooks/useKyBaoCao'
import { useHangDoiViec } from '../../hooks/useHangDoiViec'
import { sapXepTheoUuTien, moTaHan, duongDanCua } from '../../utils/viecCho'
import { mucTheoDuong } from '../../layouts/menuQuanTri'
import { nhanKhoang, thamSoApi } from '../../utils/kyBaoCao'
import { phanTram } from '../../utils/dinhDangSo'

// Khoá = LoungeStatus của backend; thứ tự = thứ tự hiển thị (đang hoạt động trước)
const VENUE_STATUS_LABELS = [
  ['Approved', 'hoạt động'], ['Warned', 'bị cảnh cáo'], ['Pending', 'chờ duyệt'],
  ['Suspended', 'tạm đình chỉ'], ['Locked', 'bị khoá'], ['Rejected', 'bị từ chối'],
]
const venueBreakdown = (byStatus) => {
  if (!byStatus) return null
  const parts = VENUE_STATUS_LABELS.filter(([key]) => byStatus[key] > 0).map(([key, label]) => `${byStatus[key]} ${label}`)
  return parts.length ? parts.join(' · ') : null
}

// MỘT nút chuyển cho cả biểu đồ lẫn tỷ trọng — hai khối luôn cùng đại lượng.
const MEASURES = [
  { key: 'platformRevenue', label: 'Doanh thu nền tảng', moTa: 'Phần nền tảng thực nhận: hoa hồng vé và tiền ủng hộ, cộng phí gói dịch vụ.' },
  { key: 'gmv', label: 'Tổng giá trị giao dịch', moTa: 'Tổng tiền người mua trả, gồm cả vé bán tại quầy. Không phải doanh thu của nền tảng.' },
]
const TEN_DON_VI_KY = { day: 'ngày', week: 'tuần', month: 'tháng' }

// Cấu hình chuỗi cho linh kiện chart của shadcn: nhãn + màu. Màu là biến màu số liệu của màn vận hành (đổi theo kiểu màu).
const CAU_HINH_TIEN = {
  ...Object.fromEntries(SOURCES.map((s) => [s.key, { label: s.label, color: s.color }])),
  truoc: { label: 'Tổng kỳ trước', color: 'var(--color-ink-mute)' },
}

const tongTrongKy = (series, measure) =>
  (series ?? []).reduce((sum, b) => sum + SOURCES.reduce((s2, src) => s2 + Number(b[src.key]?.[measure] ?? 0), 0), 0)

// Ghép kỳ này với kỳ trước THEO VỊ TRÍ (nhóm thứ i với nhóm thứ i); nhóm không có cặp thì để trống, không bịa số 0.
const dongTheoKy = (series, unit, measure, seriesTruoc) => (series ?? []).map((b, i) => {
  const d = dayjs(b.start)
  const row = { label: unit === 'month' ? d.format('MM/YYYY') : d.format('DD/MM') }
  row.tieuDe = unit === 'week' ? `Tuần từ ${d.format('DD/MM/YYYY')}` : unit === 'month' ? `Tháng ${row.label}` : d.format('DD/MM/YYYY')
  SOURCES.forEach((s) => { row[s.key] = Number(b[s.key]?.[measure] ?? 0) })
  row.tong = SOURCES.reduce((t, s) => t + row[s.key], 0)
  row.truoc = seriesTruoc?.[i] ? SOURCES.reduce((t, s) => t + Number(seriesTruoc[i][s.key]?.[measure] ?? 0), 0) : null
  return row
})

// Bóc { success, data } của axiosClient; lỗi thì ném để TanStack Query đánh dấu nguồn đó lỗi.
const boc = async (p) => { const r = await p; if (!r?.success) throw new Error(r?.message || 'Không tải được'); return r.data }

// VIỆC CẦN XỬ LÝ — các hàng đợi đang có việc, xếp theo độ ưu tiên (utils/viecCho: quá hạn trước, rồi hạn gần nhất). Cùng
// queryKey với huy hiệu trên thanh bên nên hai nơi luôn cùng con số. Hình thức: danh sách trong Card, mỗi dòng một liên kết
// (kiểu "Recent Sales" của shadcn-admin).
const TheViecCanXuLy = () => {
  const { data, isPending, isError, refetch } = useHangDoiViec()
  const ds = sapXepTheoUuTien(data)
  const tongViec = ds.reduce((t, v) => t + (v.count ?? 0), 0)
  return (
    <Card>
      <CardHeader>
        <CardTitle>Việc cần xử lý</CardTitle>
        <CardDescription>{isPending ? 'Đang tải…' : ds.length ? `${tongViec} việc ở ${ds.length} hàng đợi, lúc này.` : 'Lúc này, không theo kỳ đã chọn.'}</CardDescription>
      </CardHeader>
      <CardContent>
        <KhungTai dangTai={isPending} loi={isError} taiLai={refetch} tenVung="việc cần xử lý" caoKhung="h-20" rong={ds.length === 0}
          noiDungRong={<p className="flex items-center gap-2"><CheckCircle2 size={18} className="text-success shrink-0" aria-hidden="true" />Không có việc nào đang chờ.</p>}>
          <ul className="-my-2 divide-y divide-border">
            {ds.map((v) => {
              const duong = duongDanCua(v.key)
              const muc = mucTheoDuong[duong]
              const Icon = muc?.icon
              const han = moTaHan(v)
              return (
                <li key={v.key}>
                  <DongDanhSach to={duong} icon={Icon} tieuDe={muc?.nhan ?? v.key} muiTen phai={`${v.count} việc`}
                    kem={han?.quaHan
                      ? <NhanMau mau="loi" co="sm"><AlertTriangle className="size-3.5" aria-hidden="true" />{han.chu}</NhanMau>
                      : han && <span className="text-sm text-muted-foreground">{han.chu}</span>} />
                </li>
              )
            })}
          </ul>
        </KhungTai>
      </CardContent>
    </Card>
  )
}

// TAB "GỢI Ý AI" (MLACP-695) — chuyển từ trang "Nội dung và tương tác" (/admin/insights) mà chủ dự án bỏ 06/10 vì dư thừa.
// Chỉ giữ hai khối về tính năng gợi ý (bằng chứng AI có tác dụng, dùng cho báo cáo); phần tương tác khán giả và uy tín
// phòng trà bỏ theo trang. Nằm trong TabsContent (Radix gỡ nội dung tab đang ẩn) nên chỉ gọi API khi Admin mở tab này.
// Hai tỷ lệ tính trên cùng một kỳ, mẫu số là số cặp được gợi ý — đặt cạnh nhau nhưng KHÔNG cộng hay chia cho nhau.
const cauMauSo = (soLuot, soCap) => (soCap > 0 ? `${soLuot.toLocaleString('vi-VN')} trên ${soCap.toLocaleString('vi-VN')} cặp` : 'Chưa có cặp gợi ý nào')

const TabGoiY = ({ tu, den, truoc }) => {
  const goiY = useQuery({ queryKey: ['admin-goi-y', tu, den], queryFn: () => boc(getAiRecommendationPerformance(thamSoApi(tu, den))), placeholderData: keepPreviousData })
  const goiYTruoc = useQuery({ queryKey: ['admin-goi-y', truoc.tu, truoc.den], queryFn: () => boc(getAiRecommendationPerformance(thamSoApi(truoc.tu, truoc.den))) })
  const moHinh = useQuery({ queryKey: ['admin-mo-hinh-goi-y'], queryFn: () => boc(getRecommenderEvaluation()), staleTime: 5 * 60_000 })
  const a = goiY.data; const aT = goiYTruoc.data
  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Gợi ý buổi diễn có được dùng không</CardTitle>
          <CardDescription>{nhanKhoang(tu, den)}. Một cặp = một người được gợi ý một buổi diễn.</CardDescription>
        </CardHeader>
        <CardContent>
          <KhungTai dangTai={goiY.isPending} loi={goiY.isError} taiLai={goiY.refetch} tenVung="hiệu quả gợi ý" caoKhung="h-24">
            {a && (
              <div className="grid gap-4 sm:grid-cols-3">
                <TheChiSo mau="goiy" icon={Sparkles} nhan="Cặp được gợi ý" so={a.recommendedPairCount.toLocaleString('vi-VN')} nay={a.recommendedPairCount} truoc={aT?.recommendedPairCount} />
                <TheChiSo mau="khangia" icon={MousePointerClick} nhan="Tỷ lệ bấm vào" so={phanTram(a.clickThroughRatePercent)} ghiChu={cauMauSo(a.clickThroughCount, a.recommendedPairCount)} />
                <TheChiSo mau="tien" icon={Ticket} nhan="Tỷ lệ thành mua vé" so={phanTram(a.conversionRatePercent)} ghiChu={cauMauSo(a.conversionCount, a.recommendedPairCount)} />
              </div>
            )}
          </KhungTai>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>Mô hình gợi ý đoán đúng đến đâu</CardTitle>
          <CardDescription>Không theo kỳ đã chọn: đo trên toàn bộ lịch sử mua vé.</CardDescription>
        </CardHeader>
        <CardContent>
          <KhungTai dangTai={moHinh.isPending} loi={moHinh.isError} taiLai={moHinh.refetch} tenVung="chất lượng mô hình gợi ý" caoKhung="h-24">
            {moHinh.data && <KhoiDanhGiaGoiY recommender={moHinh.data} khongKhung />}
          </KhungTai>
        </CardContent>
      </Card>
    </div>
  )
}

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
    return <div className="py-20 flex justify-center"><Loader2 size={32} className="animate-spin text-foreground" aria-label="Đang tải" /></div>
  }

  const o = tongQuan.data; const oT = tongQuanTruoc.data
  const d = bang.data; const dT = bangTruoc.data
  const p = luyKe.data
  const dangDoiKy = tongQuan.isPlaceholderData || bang.isPlaceholderData
  const gmvNay = tongTrongKy(d?.series, 'gmv')
  const gmvTruoc = dT ? tongTrongKy(dT.series, 'gmv') : undefined
  const ky = nhanKhoang(tu, den)

  const dongTien = (m) => dongTheoKy(d?.series, d?.seriesUnit, m, dT?.series)
  const coKyTruoc = (rows) => rows.some((r) => r.truoc != null)
  const nguonTrongKy = SOURCES.map((s) => ({ ...s, v: (d?.series ?? []).reduce((t, b) => t + Number(b[s.key]?.[measure] ?? 0), 0) }))
  const tongNguon = nguonTrongKy.reduce((t, s) => t + s.v, 0)
  const theLoai = [...(d?.genres ?? [])].sort((a, b) => b.ticketsSold - a.ticketsSold)
  const bieuDoChinh = dongTien('platformRevenue')
  const dvKy = TEN_DON_VI_KY[d?.seriesUnit] ?? 'thời gian'
  const mucDo = MEASURES.find((m) => m.key === measure)

  return (
    <>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-sans text-2xl font-bold tracking-tight text-foreground">Tổng quan</h1>
          <p className="text-sm text-muted-foreground">So với kỳ trước: {nhanKhoang(truoc.tu, truoc.den)}.</p>
        </div>
        <ChonKy tu={tu} den={den} onChon={datKy} />
      </div>

      {nguonLoi.length > 0 && <div className="mb-4"><KhungTai loi tenVung={`phần ${nguonLoi.join(', ')}`} taiLai={taiLai} /></div>}

      <Tabs defaultValue="tong-quan" className="gap-4">
        <div className="w-full overflow-x-auto pb-1">
          <TabsList>
            <TabsTrigger value="tong-quan">Tổng quan</TabsTrigger>
            <TabsTrigger value="tien">Tiền theo nguồn</TabsTrigger>
            <TabsTrigger value="buoi-dien">Buổi diễn và thể loại</TabsTrigger>
            <TabsTrigger value="luy-ke">Từ khi vận hành</TabsTrigger>
            <TabsTrigger value="goi-y">Gợi ý AI</TabsTrigger>
          </TabsList>
        </div>

        {/* ===== TAB 1: việc cần làm → 4 số của kỳ → biểu đồ + danh sách ===== */}
        <TabsContent value="tong-quan" className="space-y-4">
          <TheViecCanXuLy />

          <div aria-busy={dangDoiKy} className={`space-y-4 transition-opacity ${dangDoiKy ? 'opacity-60' : ''}`}>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <TheChiSo mau="tien" icon={Banknote} nhan="Doanh thu nền tảng" so={fmtMoney(o?.platformRevenueInPeriod)} nay={o?.platformRevenueInPeriod} truoc={oT?.platformRevenueInPeriod} />
              <TheChiSo mau="goiy" icon={Receipt} nhan="Tổng giá trị giao dịch" so={fmtMoney(gmvNay)} nay={gmvNay} truoc={gmvTruoc} />
              <TheChiSo mau="buoidien" icon={Music2} nhan="Buổi diễn trong kỳ" so={(o?.eventsInPeriodCount ?? 0).toLocaleString('vi-VN')} nay={o?.eventsInPeriodCount} truoc={oT?.eventsInPeriodCount} />
              <TheChiSo mau="khangia" icon={Users} nhan="Khán giả đăng ký mới" so={(o?.newAudienceSignupsInPeriod ?? 0).toLocaleString('vi-VN')} nay={o?.newAudienceSignupsInPeriod} truoc={oT?.newAudienceSignupsInPeriod} />
            </div>

            {d && (
              <div className="grid grid-cols-1 gap-4 lg:grid-cols-7">
                <Card className="col-span-1 lg:col-span-4">
                  <CardHeader>
                    <CardTitle>Doanh thu nền tảng theo {dvKy}</CardTitle>
                    <CardDescription>{ky}. Đường nét đứt là kỳ trước.</CardDescription>
                  </CardHeader>
                  <CardContent className="ps-2">
                    <BieuDoCotChong data={bieuDoChinh} config={CAU_HINH_TIEN} cacChuoi={SOURCES.map((s) => s.key)}
                      khoaDuong={coKyTruoc(bieuDoChinh) ? 'truoc' : undefined} dinhDang={fmtMoney} dinhDangTruc={fmtCompact} />
                  </CardContent>
                </Card>
                <Card className="col-span-1 lg:col-span-3">
                  <CardHeader>
                    <CardTitle>Buổi diễn bán vé tốt nhất</CardTitle>
                    <CardDescription>{d.topShows?.length ? `Năm buổi đầu theo doanh thu vé trong kỳ.` : 'Chưa có buổi diễn nào bán được vé trong kỳ.'}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ol className="space-y-2">
                      {(d.topShows ?? []).slice(0, 5).map((s, i) => (
                        <li key={s.showId}>
                          <DongDanhSach to={`/admin/shows/${s.showId}`} thuTu={i + 1} tieuDe={s.title}
                            phu={`${s.loungeName} · ${s.ticketsSold.toLocaleString('vi-VN')} vé`} phai={fmtMoney(s.ticketRevenue)} />
                        </li>
                      ))}
                    </ol>
                  </CardContent>
                </Card>
              </div>
            )}
          </div>
        </TabsContent>

        {/* ===== TAB 2: tiền theo nguồn ===== */}
        <TabsContent value="tien" className="space-y-4">
          {d ? (
            <>
              <div className="flex flex-wrap items-center justify-between gap-3">
                <p className="text-sm text-muted-foreground">{mucDo.moTa}</p>
                <Tabs value={measure} onValueChange={setMeasure}>
                  <TabsList aria-label="Đại lượng doanh thu">
                    {MEASURES.map((m) => <TabsTrigger key={m.key} value={m.key}>{m.label}</TabsTrigger>)}
                  </TabsList>
                </Tabs>
              </div>
              <div className="grid grid-cols-1 gap-4 lg:grid-cols-7">
                <Card className="col-span-1 lg:col-span-4">
                  <CardHeader><CardTitle>{mucDo.label} theo {dvKy}</CardTitle><CardDescription>{ky}</CardDescription></CardHeader>
                  <CardContent className="ps-2">
                    <BieuDoCotChong data={dongTien(measure)} config={CAU_HINH_TIEN} cacChuoi={SOURCES.map((s) => s.key)}
                      khoaDuong={coKyTruoc(dongTien(measure)) ? 'truoc' : undefined} dinhDang={fmtMoney} dinhDangTruc={fmtCompact} />
                  </CardContent>
                </Card>
                <Card className="col-span-1 lg:col-span-3">
                  <CardHeader><CardTitle>Tỷ trọng cả kỳ</CardTitle><CardDescription>Tổng {fmtMoney(tongNguon)}</CardDescription></CardHeader>
                  <CardContent>
                    {tongNguon > 0 ? (
                      <ul className="space-y-5">
                        {nguonTrongKy.map((s) => (
                          <li key={s.key} className="flex items-center gap-4">
                            <span className="size-3 shrink-0" style={{ backgroundColor: s.color }} aria-hidden="true" />
                            <span className="flex-1 text-sm font-medium text-foreground">{s.label}</span>
                            <span className="text-sm tabular-nums text-muted-foreground">{phanTram((s.v / tongNguon) * 100)}</span>
                            <span className="w-28 text-right font-medium tabular-nums text-foreground">{fmtMoney(s.v)}</span>
                          </li>
                        ))}
                      </ul>
                    ) : <p className="text-sm text-muted-foreground">Kỳ này chưa phát sinh.</p>}
                  </CardContent>
                </Card>
              </div>
              <Card>
                <CardHeader><CardTitle>Số liệu theo {dvKy}</CardTitle></CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>{dvKy.replace(/^./, (c) => c.toUpperCase())}</TableHead>
                        {SOURCES.map((s) => <TableHead key={s.key} className="text-right">{s.label}</TableHead>)}
                        <TableHead className="text-right">Tổng</TableHead>
                        <TableHead className="text-right">Kỳ trước</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {dongTien(measure).filter((r) => r.tong > 0 || r.truoc > 0).map((r) => (
                        <TableRow key={r.tieuDe}>
                          <TableCell>{r.tieuDe}</TableCell>
                          {SOURCES.map((s) => <TableCell key={s.key} className="text-right tabular-nums">{fmtMoney(r[s.key])}</TableCell>)}
                          <TableCell className="text-right font-medium tabular-nums">{fmtMoney(r.tong)}</TableCell>
                          <TableCell className="text-right tabular-nums text-muted-foreground">{r.truoc == null ? '—' : fmtMoney(r.truoc)}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                  <p className="mt-3 text-sm text-muted-foreground">Chỉ hiện {dvKy} có phát sinh ở kỳ này hoặc kỳ trước.</p>
                </CardContent>
              </Card>
            </>
          ) : <p className="text-sm text-muted-foreground">Chưa tải được số liệu tiền.</p>}
        </TabsContent>

        {/* ===== TAB 3: buổi diễn và thể loại ===== */}
        <TabsContent value="buoi-dien" className="space-y-4">
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-7">
            <Card className="col-span-1 lg:col-span-4">
              <CardHeader><CardTitle>Buổi diễn bán vé tốt nhất</CardTitle><CardDescription>Theo doanh thu vé trong kỳ {ky}.</CardDescription></CardHeader>
              <CardContent>
                {d?.topShows?.length ? (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-10">#</TableHead><TableHead>Buổi diễn</TableHead>
                        <TableHead className="text-right">Vé bán</TableHead><TableHead className="text-right">Doanh thu vé</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {d.topShows.map((s, i) => (
                        <TableRow key={s.showId}>
                          <TableCell className="tabular-nums text-muted-foreground">{i + 1}</TableCell>
                          <TableCell>
                            <Link to={`/admin/shows/${s.showId}`} className="font-medium text-foreground hover:underline">{s.title}</Link>
                            <p className="text-sm text-muted-foreground">{s.loungeName} · {dayjs(s.startTime).format('DD/MM/YYYY')}</p>
                          </TableCell>
                          <TableCell className="text-right tabular-nums">{s.ticketsSold.toLocaleString('vi-VN')}</TableCell>
                          <TableCell className="text-right font-medium tabular-nums">{fmtMoney(s.ticketRevenue)}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                ) : <p className="text-sm text-muted-foreground">Chưa có buổi diễn nào bán được vé trong kỳ.</p>}
              </CardContent>
            </Card>
            <Card className="col-span-1 lg:col-span-3">
              <CardHeader><CardTitle>Thể loại theo số vé bán</CardTitle><CardDescription>Buổi diễn nhiều thể loại được tính cho từng thể loại.</CardDescription></CardHeader>
              <CardContent>
                {theLoai.length ? (
                  <BieuDoNgang nhanChuoi="Vé bán" mau="var(--color-sl-buoidien)"
                    data={theLoai.map((g) => ({ nhan: g.genreName, giaTri: g.ticketsSold, nhanGiaTri: `${g.ticketsSold.toLocaleString('vi-VN')} vé · ${g.showCount} buổi` }))} />
                ) : <p className="text-sm text-muted-foreground">Chưa có vé nào bán ra trong kỳ.</p>}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* ===== TAB 4: không theo kỳ. Bỏ "Phòng trà đang hoạt động" (lặp dòng phụ của ô Phòng trà đã đăng ký) và "Chờ duyệt thủ
            công" (đã nằm trong Việc cần xử lý) — một việc một chỗ. ===== */}
        <TabsContent value="luy-ke">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <TheChiSo mau="uytin" icon={Store} nhan="Phòng trà đã đăng ký" so={(p?.totalVenues ?? 0).toLocaleString('vi-VN')} ghiChu={venueBreakdown(p?.venuesByStatus) || 'Mọi trạng thái, kể cả chờ duyệt'} />
            <TheChiSo mau="khangia" icon={Users} nhan="Người dùng" so={(p?.totalUsers ?? 0).toLocaleString('vi-VN')} />
            <TheChiSo mau="buoidien" icon={Music2} nhan="Buổi diễn đã xuất bản" so={(p?.totalPublishedShows ?? 0).toLocaleString('vi-VN')} />
            <TheChiSo mau="goiy" icon={Ticket} nhan="Vé đã bán" so={(p?.totalTicketsSold ?? 0).toLocaleString('vi-VN')} />
            <TheChiSo mau="tien" icon={Banknote} nhan="Tổng giá trị giao dịch" so={fmtMoney(p?.totalGrossMerchandiseValue)} />
            <TheChiSo mau="buoidien" icon={HeartHandshake} nhan="Tiền ủng hộ" so={fmtMoney(p?.totalDonationVolume)} />
          </div>
        </TabsContent>

        <TabsContent value="goi-y">
          <TabGoiY tu={tu} den={den} truoc={truoc} />
        </TabsContent>
      </Tabs>
    </>
  )
}

export default AdminDashboard
