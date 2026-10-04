// src/pages/admin/AdminInsightsPage.jsx
//
// GHI CHÚ CHO ĐỘI FE:
// - Nguồn độc lập, gọi bằng Promise.allSettled: một endpoint lỗi chỉ làm trống khối của nó.
// - "Tỷ lệ quay lại" là tỷ lệ khán giả mua vé của TỪ 2 BUỔI DIỄN KHÁC NHAU trở lên trong cùng kỳ —
//   không phải tỷ lệ mua lại vé cùng một buổi. Ghi rõ vì hai cách hiểu cho hai con số rất khác nhau.
// - Hai tỷ lệ của gợi ý tính trên cùng một kỳ: tỷ lệ bấm vào (trong số cặp được gợi ý) và tỷ lệ
//   chuyển thành mua vé. Đặt cạnh nhau nhưng KHÔNG cộng hay chia cho nhau.
// - MLACP-595: dùng chung bộ chọn kỳ với trang Tổng quan (ChonKy + useKyBaoCao, kỳ trên URL).
//
// LÀM LẠI 04/10/2026 — chủ dự án: "trình bày không đầu không đuôi, rối mắt, mờ nhạt, không theo tiêu chuẩn nào".
// Luật Q1–Q10 và nguồn: reports/Trang quản trị - rà soát thị giác và luật trình bày số liệu.md (repo backend).
//  - Q1: mỗi con số có dòng "so với cái gì" — kỳ trước cùng độ dài, hoặc mẫu số ("0 trên 560 cặp").
//  - Q9: BỎ khối "Việc đang chờ xử lý" (buổi chờ duyệt, khiếu nại) — đã có ở khối Việc cần xử lý của trang Tổng quan
//    (GET /admin/work-queue gồm shows + complaint); hai trang in cùng một việc theo hai hình thức là thứ gây rối.
//  - Q2: phòng trà chưa có điểm uy tín in "Chưa có điểm", không in 0 (0 đọc như "kém nhất").
//  - Q4/Q8: bỏ biểu tượng trang trí, bỏ dòng nền xám có viền nằm trong thẻ có viền.
//  - Câu mô tả điểm uy tín cũ ("tính từ vi phạm, khiếu nại và đánh giá") SAI: backend chỉ ghi ReputationScore = trung bình
//    điểm đánh giá còn hiệu lực, cập nhật khi xếp lịch quyết toán (ScheduleSettlementHandler.ResolveTierPreRateAsync).
import { useState, useEffect, useCallback } from 'react'
import { Loader2 } from 'lucide-react'
import {
  getAdminContentOverview, getAudienceEngagement, getAiRecommendationPerformance, getRecommenderEvaluation,
} from '../../services/analyticsServices'
import ChonKy from '../../components/bang/ChonKy'
import KhoiMuc from '../../components/bang/KhoiMuc'
import KhoiDanhGiaGoiY from '../../components/admin/dashboard/KhoiDanhGiaGoiY'
import { useKyBaoCao } from '../../hooks/useKyBaoCao'
import { thamSoApi, nhanKhoang, cauSoVoiKyTruoc } from '../../utils/kyBaoCao'
import { phanTram, soNguyen } from '../../utils/dinhDangSo'
import KhungTai, { TrangLoiTai } from '../../components/bang/KhungTai'
import OChiSo from '../../components/bang/OChiSo'
import BieuDoThanhNgang from '../../components/bang/BieuDoThanhNgang'
import { MAU_SO_LIEU } from '../../components/bang/mauSoLieu'

const DIEM_TOI_DA = 5 // thang điểm đánh giá của khán giả (LoungeShowRating.Score 1–5)

// Dòng "so với cái gì" cho ô theo kỳ: chưa có số kỳ trước thì để trống, không đoán.
const soSanh = (nay, truoc, khoa) => (truoc ? cauSoVoiKyTruoc(nay?.[khoa], truoc[khoa]) : undefined)

// Câu phụ cho tỷ lệ của gợi ý: luôn nói mẫu số. 0 lượt mà có cặp được gợi ý thì nói thẳng điều đó, kẻo "0%" trông như lỗi.
const cauMauSo = (soLuot, soCap) => (soCap > 0 ? `${soNguyen(soLuot)} trên ${soNguyen(soCap)} cặp` : 'Chưa có cặp gợi ý nào')

// Phòng trà có điểm: thanh độ dài trên thang 0–5 (BieuDoThanhNgang, recharts). Chưa có điểm: liệt kê bằng chữ — KHÔNG đặt
// thanh dài 0 cạnh các thanh khác, vì thanh 0 đọc như "kém nhất" (luật Q2).
const KhoiUyTin = ({ ds }) => {
  const coDiem = ds.filter((v) => Number(v.reputationScore) > 0)
  const chuaCo = ds.filter((v) => !(Number(v.reputationScore) > 0))
  return (
    <div className="border-2 border-ink/25 bg-card p-5 sm:p-6 space-y-4">
      {/* Giới hạn bề ngang (max-w-2xl): thanh dài hết màn rộng thì mắt phải quét xa giữa tên và số. */}
      {coDiem.length > 0 ? (
        <div className="max-w-2xl">
          <BieuDoThanhNgang toiDa={DIEM_TOI_DA} mau={MAU_SO_LIEU.uytin.hex}
            data={coDiem.map((v) => ({
              khoa: v.loungeId, nhan: v.loungeName, giaTri: Number(v.reputationScore),
              nhanGiaTri: `${Number(v.reputationScore).toLocaleString('vi-VN', { maximumFractionDigits: 1 })} / ${DIEM_TOI_DA}`,
            }))} />
        </div>
      ) : (
        <p className="text-sm text-ink-soft">Chưa phòng trà nào có điểm.</p>
      )}
      {chuaCo.length > 0 && (
        <p className="text-sm text-ink-soft leading-relaxed">
          <span className="font-semibold text-ink">Chưa có điểm ({chuaCo.length}):</span> {chuaCo.map((v) => v.loungeName).join(', ')}
        </p>
      )}
    </div>
  )
}

const AdminInsightsPage = () => {
  const [so, setSo] = useState({})
  const [isLoading, setIsLoading] = useState(true)
  const { tu, den, truoc, datKy } = useKyBaoCao()
  // Nguồn số liệu nào lỗi (01/10/2026): một nguồn lỗi thì khối đó báo lỗi, không lặng lẽ trống.
  const [nguonLoi, setNguonLoi] = useState([])

  // Chỉ vòng xoay toàn trang ở lần tải đầu; đổi kỳ thì giữ số cũ cho tới khi số mới về.
  const load = useCallback(async () => {
    const ky = thamSoApi(tu, den)
    const kyTruoc = thamSoApi(truoc.tu, truoc.den)
    const ketQua = await Promise.allSettled([
      getAdminContentOverview(),
      getAudienceEngagement(ky),
      getAiRecommendationPerformance(ky),
      getRecommenderEvaluation(),
      getAudienceEngagement(kyTruoc),
      getAiRecommendationPerformance(kyTruoc),
    ])
    const [content, engagement, ai, recommender, engagementTruoc, aiTruoc] =
      ketQua.map((x) => (x.status === 'fulfilled' && x.value?.success ? x.value.data : null))
    setSo({ content, engagement, ai, recommender, engagementTruoc, aiTruoc })
    setNguonLoi([['uy tín phòng trà', content], ['tương tác của khán giả', engagement], ['hiệu quả gợi ý', ai], ['chất lượng mô hình', recommender]]
      .filter(([, d]) => !d).map(([ten]) => ten))
    setIsLoading(false)
  }, [tu, den, truoc.tu, truoc.den])

  useEffect(() => { const chay = async () => { await load() }; chay() }, [load])

  if (isLoading) {
    return <div className="py-20 flex justify-center"><Loader2 size={32} className="animate-spin text-ink" aria-label="Đang tải" /></div>
  }
  if (nguonLoi.length === 4) return <TrangLoiTai tieuDe="Nội dung và tương tác" tenVung="số liệu thống kê" taiLai={load} />

  const { content, engagement: e, ai, recommender, engagementTruoc: eT, aiTruoc: aT } = so
  const ky = nhanKhoang(tu, den)

  return (
    <div className="space-y-10">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-4xl text-ink mb-1">Nội dung và tương tác</h1>
          <p className="text-ink-soft text-sm">So với kỳ trước: {nhanKhoang(truoc.tu, truoc.den)}.</p>
        </div>
        <ChonKy tu={tu} den={den} onChon={datKy} />
      </div>
      {nguonLoi.length > 0 && <KhungTai loi tenVung={`phần ${nguonLoi.join(', ')}`} taiLai={load} />}

      {e && (
        <KhoiMuc id="tuong-tac" mau="khangia" tieuDe="Tương tác của khán giả" phamVi={ky}
          moTa="Quay lại = mua vé của từ 2 buổi diễn khác nhau trong kỳ.">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <OChiSo mau="khangia" nhan="Lượt theo dõi phòng trà mới" so={soNguyen(e.newFollowsInPeriod)} phu={soSanh(e, eT, 'newFollowsInPeriod')} />
            <OChiSo mau="khangia" nhan="Lượt thêm vào danh sách quan tâm" so={soNguyen(e.newWishlistsInPeriod)} phu={soSanh(e, eT, 'newWishlistsInPeriod')} />
            <OChiSo mau="khangia" nhan="Đánh giá mới" so={soNguyen(e.newRatingsInPeriod)} phu={soSanh(e, eT, 'newRatingsInPeriod')} />
            <OChiSo mau="khangia" nhan="Tỷ lệ quay lại" so={phanTram(e.returnRatePercent)}
              phu={eT ? `Kỳ trước: ${phanTram(eT.returnRatePercent)}` : undefined} />
          </div>
        </KhoiMuc>
      )}

      {ai && (
        <KhoiMuc id="hieu-qua-goi-y" mau="goiy" tieuDe="Gợi ý buổi diễn có được dùng không" phamVi={ky}
          moTa="Một cặp = một người được gợi ý một buổi diễn.">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <OChiSo mau="goiy" nhan="Cặp được gợi ý" so={soNguyen(ai.recommendedPairCount)} phu={soSanh(ai, aT, 'recommendedPairCount')} />
            <OChiSo mau="goiy" nhan="Tỷ lệ bấm vào" so={phanTram(ai.clickThroughRatePercent)}
              phu={cauMauSo(ai.clickThroughCount, ai.recommendedPairCount)} />
            <OChiSo mau="goiy" nhan="Tỷ lệ thành mua vé" so={phanTram(ai.conversionRatePercent)}
              phu={cauMauSo(ai.conversionCount, ai.recommendedPairCount)} />
          </div>
        </KhoiMuc>
      )}

      {recommender && (
        <KhoiMuc id="chat-luong-mo-hinh" mau="goiy" tieuDe="Mô hình gợi ý đoán đúng đến đâu" phamVi="không theo kỳ">
          <KhoiDanhGiaGoiY recommender={recommender} />
        </KhoiMuc>
      )}

      {content && (
        <KhoiMuc id="uy-tin" mau="uytin" tieuDe="Uy tín phòng trà" phamVi="lúc này, không theo kỳ"
          moTa={`Trung bình điểm khán giả chấm, thang ${DIEM_TOI_DA}. Vi phạm trong tháng này: ${soNguyen(content.violationsThisMonthCount)}.`}>
          {(content.topVenuesByReputation?.length ?? 0) > 0
            ? <KhoiUyTin ds={content.topVenuesByReputation} />
            : <p className="text-sm text-ink-soft">Chưa có phòng trà nào hoạt động.</p>}
        </KhoiMuc>
      )}
    </div>
  )
}

export default AdminInsightsPage
