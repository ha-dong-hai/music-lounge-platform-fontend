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
  <div className="bg-gray-900 border border-gray-800 rounded-xl p-5 flex items-start justify-between gap-3">
    <div className="min-w-0">
      <p className="text-sm text-gray-500 mb-1">{title}</p>
      <p className="text-2xl font-bold text-white">{value}</p>
      {note && <p className="text-xs mt-2 text-gray-500 leading-relaxed">{note}</p>}
    </div>
    <div className={`p-3 rounded-lg flex-shrink-0 ${bg}`}>
      <Icon size={22} className={color} />
    </div>
  </div>
)

const Section = ({ title, subtitle, children }) => (
  <div>
    <h2 className="text-sm font-semibold text-gray-400">{title}</h2>
    {subtitle && <p className="text-xs text-gray-600 mt-0.5 mb-3 leading-relaxed">{subtitle}</p>}
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
    return <div className="py-20 flex justify-center"><Loader2 size={32} className="animate-spin text-[#C3B665]" /></div>
  }

  const kyLabel = (d) => (d
    ? `${dayjs(d.periodFrom).format('DD/MM')} – ${dayjs(d.periodTo).format('DD/MM/YYYY')}`
    : '')

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-white mb-1">Nội dung &amp; tương tác</h1>
        <p className="text-gray-400 text-sm">Việc cần xử lý, mức tương tác của khán giả, và chất lượng gợi ý.</p>
      </div>

      {/* === NỘI DUNG & GIÁM SÁT === */}
      {content ? (
        <Section title="Việc đang chờ xử lý">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <StatCard title="Buổi diễn chờ duyệt" value={fmtSo(content.pendingEventsCount)}
              icon={Music2} color="text-yellow-400" bg="bg-yellow-500/10" />
            <StatCard title="Khiếu nại chưa xử lý" value={fmtSo(content.unresolvedComplaintsCount)}
              icon={MessageSquareWarning} color="text-orange-400" bg="bg-orange-500/10" />
            <StatCard title="Vi phạm trong tháng" value={fmtSo(content.violationsThisMonthCount)}
              icon={ShieldAlert} color="text-red-400" bg="bg-red-500/10" />
          </div>

          {(content.topVenuesByReputation?.length ?? 0) > 0 && (
            <div className="mt-4 bg-gray-900 border border-gray-800 rounded-xl p-6">
              <h3 className="text-base font-semibold text-white flex items-center gap-2">
                <Award size={16} className="text-[#C3B665]" /> Phòng trà theo điểm uy tín
              </h3>
              <p className="text-xs text-gray-500 mt-0.5">Điểm do hệ thống tính từ vi phạm, khiếu nại và đánh giá.</p>
              <ul className="mt-4 space-y-2">
                {content.topVenuesByReputation.map((v, i) => (
                  <li key={v.loungeId} className="flex items-center justify-between gap-3 bg-black/40 border border-gray-800 rounded-lg px-4 py-2.5">
                    <span className="flex items-center gap-3 min-w-0">
                      <span className="text-gray-500 tabular-nums text-sm w-5 flex-shrink-0">{i + 1}</span>
                      <span className="text-white text-sm truncate">{v.loungeName}</span>
                    </span>
                    <span className="text-[#C3B665] font-bold tabular-nums text-sm flex-shrink-0">
                      {Number(v.reputationScore).toLocaleString('vi-VN', { maximumFractionDigits: 1 })}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </Section>
      ) : (
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
          <p className="text-sm text-gray-400">Chưa tải được số liệu nội dung &amp; giám sát.</p>
        </div>
      )}

      {/* === TƯƠNG TÁC KHÁN GIẢ === */}
      {engagement ? (
        <Section
          title={`Tương tác khán giả ${kyLabel(engagement) && `(${kyLabel(engagement)})`}`}
        >
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard title="Theo dõi mới" value={fmtSo(engagement.newFollowsInPeriod)}
              icon={Users} color="text-blue-400" bg="bg-blue-500/10" />
            <StatCard title="Thêm vào danh sách quan tâm" value={fmtSo(engagement.newWishlistsInPeriod)}
              icon={Heart} color="text-pink-400" bg="bg-pink-500/10" />
            <StatCard title="Đánh giá mới" value={fmtSo(engagement.newRatingsInPeriod)}
              icon={Star} color="text-[#C3B665]" bg="bg-[#C3B665]/10" />
            <StatCard title="Tỷ lệ quay lại" value={fmtPhanTram(engagement.returnRatePercent)}
              note="Khán giả mua vé của từ 2 buổi diễn KHÁC NHAU trở lên trong kỳ — không phải mua lại cùng một buổi."
              icon={Repeat} color="text-green-400" bg="bg-green-500/10" />
          </div>
        </Section>
      ) : (
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
          <p className="text-sm text-gray-400">Chưa tải được số liệu tương tác khán giả.</p>
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
              icon={Music2} color="text-gray-400" bg="bg-gray-500/10" />
            <StatCard title="Tỷ lệ bấm vào" value={fmtPhanTram(ai.clickThroughRatePercent)}
              note={`${fmtSo(ai.clickThroughCount)} lượt bấm`}
              icon={MousePointerClick} color="text-blue-400" bg="bg-blue-500/10" />
            <StatCard title="Tỷ lệ thành mua vé" value={fmtPhanTram(ai.conversionRatePercent)}
              note={`${fmtSo(ai.conversionCount)} lượt mua`}
              icon={Ticket} color="text-green-400" bg="bg-green-500/10" />
          </div>
        </Section>
      ) : (
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
          <p className="text-sm text-gray-400">Chưa tải được số liệu hiệu quả gợi ý.</p>
        </div>
      )}
    </div>
  )
}

export default AdminInsightsPage
