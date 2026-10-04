// src/pages/admin/AdminInsightsPage.jsx
//
// GHI CHÚ CHO ĐỘI FE:
// - Ba nguồn độc lập, gọi bằng Promise.allSettled: một endpoint lỗi chỉ làm trống khối của nó.
// - "Tỷ lệ quay lại" là tỷ lệ khán giả mua vé của TỪ 2 BUỔI DIỄN KHÁC NHAU trở lên trong cùng kỳ —
//   không phải tỷ lệ mua lại vé cùng một buổi. Ghi rõ vì hai cách hiểu cho hai con số rất khác nhau.
// - Điểm uy tín phòng trà (ReputationScore) do backend tính; FE chỉ hiển thị, không tự suy diễn.
// - Hai tỷ lệ của gợi ý AI tính trên cùng một kỳ: tỷ lệ bấm vào (trong số cặp được gợi ý) và tỷ lệ
//   chuyển thành mua vé. Đặt cạnh nhau nhưng KHÔNG cộng hay chia cho nhau.
// - MLACP-595: dùng chung bộ chọn kỳ với trang Tổng quan (ChonKy + useKyBaoCao, kỳ trên URL) cho hai khối theo kỳ (tương
//   tác khán giả, hiệu quả gợi ý); trước đây hai khối này luôn là kỳ mặc định của backend, không đổi được. Khối "việc đang
//   chờ xử lý" là số HIỆN TẠI nên ghi rõ không theo kỳ. Nhận thêm khối chất lượng mô hình gợi ý từ trang Tổng quan.
import { useState, useEffect, useCallback } from 'react'
import { Loader2, ShieldAlert, MessageSquareWarning, Music2, Award, Users, Heart, Star, Repeat, MousePointerClick, Ticket } from 'lucide-react'
import dayjs from 'dayjs'
import {
  getAdminContentOverview, getAudienceEngagement, getAiRecommendationPerformance, getRecommenderEvaluation,
} from '../../services/analyticsServices'
import ChonKy from '../../components/bang/ChonKy'
import KhoiDanhGiaGoiY from '../../components/admin/dashboard/KhoiDanhGiaGoiY'
import { useKyBaoCao } from '../../hooks/useKyBaoCao'
import { thamSoApi } from '../../utils/kyBaoCao'
import KhungTai, { TrangLoiTai } from '../../components/bang/KhungTai'
import OChiSo from '../../components/bang/OChiSo'

const fmtSo = (v) => Number(v || 0).toLocaleString('vi-VN')
const fmtPhanTram = (v) => `${Number(v || 0).toLocaleString('vi-VN', { maximumFractionDigits: 1 })}%`

// Ô số liệu: dùng OChiSo chung (01/10/2026). Bản cũ có ô biểu tượng tô màu (xanh/đỏ/xám) — màu chỉ trang trí, không mang
// nghĩa, và mỗi trang một kiểu ô số liệu. Tham số color/bg của nơi gọi được bỏ qua.
const StatCard = ({ title, value, note, icon }) => <OChiSo nhan={title} so={value} phu={note} icon={icon} />

const Section = ({ title, subtitle, children }) => (
  <div>
    <h2 className="font-sans font-bold text-sm text-ink-soft">{title}</h2>
    {subtitle && <p className="text-xs text-ink-mute mt-0.5 mb-3 leading-relaxed">{subtitle}</p>}
    <div className={subtitle ? '' : 'mt-3'}>{children}</div>
  </div>
)

const AdminInsightsPage = () => {
  const [content, setContent] = useState(null)
  const [engagement, setEngagement] = useState(null)
  const [ai, setAi] = useState(null)
  const [recommender, setRecommender] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const { tu, den, datKy } = useKyBaoCao()
  // Nguồn số liệu nào lỗi (01/10/2026): bản cũ chỉ bật toast khi CẢ BA lỗi; một nguồn lỗi thì khối đó lặng lẽ trống.
  const [nguonLoi, setNguonLoi] = useState([])

  // Chỉ vòng xoay toàn trang ở lần tải đầu; đổi kỳ thì giữ số cũ cho tới khi số mới về.
  const load = useCallback(async () => {
    const ky = thamSoApi(tu, den)
    const ketQua = await Promise.allSettled([
      getAdminContentOverview(),
      getAudienceEngagement(ky),
      getAiRecommendationPerformance(ky),
      getRecommenderEvaluation(),
    ])
    const [c, e, a, r] = ketQua.map((x) => (x.status === 'fulfilled' && x.value?.success ? x.value.data : null))
    setContent(c)
    setEngagement(e)
    setAi(a)
    setRecommender(r)
    setNguonLoi(['việc cần xử lý', 'tương tác của khán giả', 'hiệu quả gợi ý'].filter((_, i) => ![c, e, a][i]))
    setIsLoading(false)
  }, [tu, den])

  useEffect(() => { const chay = async () => { await load() }; chay() }, [load])

  if (isLoading) {
    return <div className="py-20 flex justify-center"><Loader2 size={32} className="animate-spin text-ink" /></div>
  }
  if (nguonLoi.length === 3) return <TrangLoiTai tieuDe="Nội dung và tương tác" tenVung="số liệu thống kê" taiLai={load} />

  const kyLabel = (d) => (d
    ? `${dayjs(d.periodFrom).format('DD/MM')} – ${dayjs(d.periodTo).format('DD/MM/YYYY')}`
    : '')

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-4xl text-ink mb-1">Nội dung và tương tác</h1>
          <p className="text-ink-soft text-sm">Việc cần xử lý, mức tương tác của khán giả, và chất lượng gợi ý.</p>
        </div>
        <ChonKy tu={tu} den={den} onChon={datKy} />
      </div>
      {nguonLoi.length > 0 && <KhungTai loi tenVung={`phần ${nguonLoi.join(', ')}`} taiLai={load} />}

      {/* === NỘI DUNG & GIÁM SÁT === */}
      {content ? (
        <Section title="Việc đang chờ xử lý (hiện tại, không theo kỳ đã chọn)">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <StatCard title="Buổi diễn chờ duyệt" value={fmtSo(content.pendingEventsCount)}
              icon={Music2} color="text-warning" bg="bg-warning/10" />
            <StatCard title="Khiếu nại chưa xử lý" value={fmtSo(content.unresolvedComplaintsCount)}
              icon={MessageSquareWarning} color="text-warning" bg="bg-warning/10" />
            <StatCard title="Vi phạm trong tháng" value={fmtSo(content.violationsThisMonthCount)}
              icon={ShieldAlert} color="text-danger" bg="bg-danger/10" />
          </div>

          {(content.topVenuesByReputation?.length ?? 0) > 0 && (
            <div className="mt-4 bg-card border border-line p-6">
              <h3 className="text-base font-semibold text-ink flex items-center gap-2">
                <Award size={16} className="text-ink" /> Phòng trà theo điểm uy tín
              </h3>
              <p className="text-xs text-ink-mute mt-0.5">Điểm do hệ thống tính từ vi phạm, khiếu nại và đánh giá.</p>
              <ul className="mt-4 space-y-2">
                {content.topVenuesByReputation.map((v, i) => (
                  <li key={v.loungeId} className="flex items-center justify-between gap-3 bg-sunken/70 border border-line px-4 py-2.5">
                    <span className="flex items-center gap-3 min-w-0">
                      <span className="text-ink-mute tabular-nums text-sm w-5 flex-shrink-0">{i + 1}</span>
                      <span className="text-ink text-sm truncate">{v.loungeName}</span>
                    </span>
                    <span className="text-ink font-bold tabular-nums text-sm flex-shrink-0">
                      {Number(v.reputationScore).toLocaleString('vi-VN', { maximumFractionDigits: 1 })}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </Section>
      ) : (
        <div className="bg-card border border-line p-5">
          <p className="text-sm text-ink-soft">Chưa tải được số liệu nội dung &amp; giám sát.</p>
        </div>
      )}

      {/* === TƯƠNG TÁC KHÁN GIẢ === */}
      {engagement ? (
        <Section
          title={`Tương tác khán giả ${kyLabel(engagement) && `(${kyLabel(engagement)})`}`}
        >
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard title="Theo dõi mới" value={fmtSo(engagement.newFollowsInPeriod)}
              icon={Users} color="text-ink" bg="bg-ink/10" />
            <StatCard title="Thêm vào danh sách quan tâm" value={fmtSo(engagement.newWishlistsInPeriod)}
              icon={Heart} color="text-danger" bg="bg-danger/10" />
            <StatCard title="Đánh giá mới" value={fmtSo(engagement.newRatingsInPeriod)}
              icon={Star} color="text-ink" bg="bg-ink/10" />
            <StatCard title="Tỷ lệ quay lại" value={fmtPhanTram(engagement.returnRatePercent)}
              note="Khán giả mua vé của từ 2 buổi diễn KHÁC NHAU trở lên trong kỳ — không phải mua lại cùng một buổi."
              icon={Repeat} color="text-success" bg="bg-success/10" />
          </div>
        </Section>
      ) : (
        <div className="bg-card border border-line p-5">
          <p className="text-sm text-ink-soft">Chưa tải được số liệu tương tác khán giả.</p>
        </div>
      )}

      {/* === HIỆU QUẢ GỢI Ý === */}
      {ai ? (
        <Section
          title={`Hiệu quả gợi ý ${kyLabel(ai) && `(${kyLabel(ai)})`}`}
          subtitle="Hai tỷ lệ dưới đây tính trên cùng một kỳ nhưng là hai thứ khác nhau — đừng cộng hay chia cho nhau."
        >
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <StatCard title="Số lượt gợi ý" value={fmtSo(ai.recommendedPairCount)}
              icon={Music2} color="text-ink-soft" bg="bg-line-strong/10" />
            <StatCard title="Tỷ lệ bấm vào" value={fmtPhanTram(ai.clickThroughRatePercent)}
              note={`${fmtSo(ai.clickThroughCount)} lượt bấm`}
              icon={MousePointerClick} color="text-ink" bg="bg-ink/10" />
            <StatCard title="Tỷ lệ thành mua vé" value={fmtPhanTram(ai.conversionRatePercent)}
              note={`${fmtSo(ai.conversionCount)} lượt mua`}
              icon={Ticket} color="text-success" bg="bg-success/10" />
          </div>
        </Section>
      ) : (
        <div className="bg-card border border-line p-5">
          <p className="text-sm text-ink-soft">Chưa tải được số liệu hiệu quả gợi ý.</p>
        </div>
      )}

      {/* === CHẤT LƯỢNG MÔ HÌNH GỢI Ý (không theo kỳ) — chuyển từ trang Tổng quan, MLACP-595 === */}
      <KhoiDanhGiaGoiY recommender={recommender} />
    </div>
  )
}

export default AdminInsightsPage
