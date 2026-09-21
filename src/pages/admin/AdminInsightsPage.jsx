// src/pages/admin/AdminInsightsPage.jsx
//
// GHI CHÚ CHO ĐỘI FE:
// - Ba nguồn độc lập, gọi bằng Promise.allSettled: một endpoint lỗi chỉ làm trống khối của nó.
// - "Tỷ lệ quay lại" là tỷ lệ khán giả mua vé của TỪ 2 BUỔI DIỄN KHÁC NHAU trở lên trong cùng kỳ —
//   không phải tỷ lệ mua lại vé cùng một buổi. Ghi rõ vì hai cách hiểu cho hai con số rất khác nhau.
// - Điểm uy tín phòng trà (ReputationScore) do backend tính; FE chỉ hiển thị, không tự suy diễn.
// - Hai tỷ lệ của gợi ý AI tính trên cùng một kỳ: tỷ lệ bấm vào (trong số cặp được gợi ý) và tỷ lệ
//   chuyển thành mua vé. Đặt cạnh nhau nhưng KHÔNG cộng hay chia cho nhau.
import { useState, useEffect, useCallback } from 'react'
import { Loader2, ShieldAlert, MessageSquareWarning, Music2, Award, Users, Heart, Star, Repeat, MousePointerClick, Ticket } from 'lucide-react'
import dayjs from 'dayjs'
import toast from 'react-hot-toast'
import {
  getAdminContentOverview, getAudienceEngagement, getAiRecommendationPerformance,
} from '../../services/analyticsServices'

const fmtSo = (v) => Number(v || 0).toLocaleString('vi-VN')
const fmtPhanTram = (v) => `${Number(v || 0).toLocaleString('vi-VN', { maximumFractionDigits: 1 })}%`

const StatCard = ({ title, value, note, icon: Icon, color, bg }) => (
  <div className="bg-card border border-line rounded-xl p-5 flex items-start justify-between gap-3">
    <div className="min-w-0">
      <p className="text-sm text-ink-mute mb-1">{title}</p>
      <p className="text-2xl font-bold text-ink">{value}</p>
      {note && <p className="text-xs mt-2 text-ink-mute leading-relaxed">{note}</p>}
    </div>
    <div className={`p-3 rounded-lg flex-shrink-0 ${bg}`}>
      <Icon size={22} className={color} />
    </div>
  </div>
)

const Section = ({ title, subtitle, children }) => (
  <div>
    <h2 className="text-sm font-semibold text-ink-soft">{title}</h2>
    {subtitle && <p className="text-xs text-ink-mute mt-0.5 mb-3 leading-relaxed">{subtitle}</p>}
    <div className={subtitle ? '' : 'mt-3'}>{children}</div>
  </div>
)

const AdminInsightsPage = () => {
  const [content, setContent] = useState(null)
  const [engagement, setEngagement] = useState(null)
  const [ai, setAi] = useState(null)
  const [isLoading, setIsLoading] = useState(true)

  const load = useCallback(async () => {
    setIsLoading(true)
    const ketQua = await Promise.allSettled([
      getAdminContentOverview(),
      getAudienceEngagement(),
      getAiRecommendationPerformance(),
    ])
    const [c, e, a] = ketQua.map((x) => (x.status === 'fulfilled' && x.value?.success ? x.value.data : null))
    setContent(c)
    setEngagement(e)
    setAi(a)
    if (!c && !e && !a) toast.error('Không tải được số liệu thống kê.')
    setIsLoading(false)
  }, [])

  useEffect(() => { const chay = async () => { await load() }; chay() }, [load])

  if (isLoading) {
    return <div className="py-20 flex justify-center"><Loader2 size={32} className="animate-spin text-brand-text" /></div>
  }

  const kyLabel = (d) => (d
    ? `${dayjs(d.periodFrom).format('DD/MM')} – ${dayjs(d.periodTo).format('DD/MM/YYYY')}`
    : '')

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-ink mb-1">Nội dung &amp; tương tác</h1>
        <p className="text-ink-soft text-sm">Việc cần xử lý, mức tương tác của khán giả, và chất lượng gợi ý.</p>
      </div>

      {/* === NỘI DUNG & GIÁM SÁT === */}
      {content ? (
        <Section title="Việc đang chờ xử lý">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <StatCard title="Buổi diễn chờ duyệt" value={fmtSo(content.pendingEventsCount)}
              icon={Music2} color="text-warning" bg="bg-yellow-500/10" />
            <StatCard title="Khiếu nại chưa xử lý" value={fmtSo(content.unresolvedComplaintsCount)}
              icon={MessageSquareWarning} color="text-orange-700" bg="bg-orange-500/10" />
            <StatCard title="Vi phạm trong tháng" value={fmtSo(content.violationsThisMonthCount)}
              icon={ShieldAlert} color="text-danger" bg="bg-red-500/10" />
          </div>

          {(content.topVenuesByReputation?.length ?? 0) > 0 && (
            <div className="mt-4 bg-card border border-line rounded-xl p-6">
              <h3 className="text-base font-semibold text-ink flex items-center gap-2">
                <Award size={16} className="text-brand-text" /> Phòng trà theo điểm uy tín
              </h3>
              <p className="text-xs text-ink-mute mt-0.5">Điểm do hệ thống tính từ vi phạm, khiếu nại và đánh giá.</p>
              <ul className="mt-4 space-y-2">
                {content.topVenuesByReputation.map((v, i) => (
                  <li key={v.loungeId} className="flex items-center justify-between gap-3 bg-espresso/40 border border-line rounded-lg px-4 py-2.5">
                    <span className="flex items-center gap-3 min-w-0">
                      <span className="text-ink-mute tabular-nums text-sm w-5 flex-shrink-0">{i + 1}</span>
                      <span className="text-ink text-sm truncate">{v.loungeName}</span>
                    </span>
                    <span className="text-brand-text font-bold tabular-nums text-sm flex-shrink-0">
                      {Number(v.reputationScore).toLocaleString('vi-VN', { maximumFractionDigits: 1 })}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </Section>
      ) : (
        <div className="bg-card border border-line rounded-xl p-5">
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
              icon={Users} color="text-sky-700" bg="bg-blue-500/10" />
            <StatCard title="Thêm vào danh sách quan tâm" value={fmtSo(engagement.newWishlistsInPeriod)}
              icon={Heart} color="text-pink-700" bg="bg-pink-500/10" />
            <StatCard title="Đánh giá mới" value={fmtSo(engagement.newRatingsInPeriod)}
              icon={Star} color="text-brand-text" bg="bg-brand/10" />
            <StatCard title="Tỷ lệ quay lại" value={fmtPhanTram(engagement.returnRatePercent)}
              note="Khán giả mua vé của từ 2 buổi diễn KHÁC NHAU trở lên trong kỳ — không phải mua lại cùng một buổi."
              icon={Repeat} color="text-success" bg="bg-green-500/10" />
          </div>
        </Section>
      ) : (
        <div className="bg-card border border-line rounded-xl p-5">
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
              icon={MousePointerClick} color="text-sky-700" bg="bg-blue-500/10" />
            <StatCard title="Tỷ lệ thành mua vé" value={fmtPhanTram(ai.conversionRatePercent)}
              note={`${fmtSo(ai.conversionCount)} lượt mua`}
              icon={Ticket} color="text-success" bg="bg-green-500/10" />
          </div>
        </Section>
      ) : (
        <div className="bg-card border border-line rounded-xl p-5">
          <p className="text-sm text-ink-soft">Chưa tải được số liệu hiệu quả gợi ý.</p>
        </div>
      )}
    </div>
  )
}

export default AdminInsightsPage
