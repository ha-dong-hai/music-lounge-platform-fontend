// src/hooks/useKyBaoCao.js
//
// MLACP-595: kỳ báo cáo của trang phân tích Admin, nằm trên URL (?tu=YYYY-MM-DD&den=YYYY-MM-DD) bằng nuqs — tải lại
// trang, bấm Quay lại hay gửi link cho người khác đều giữ đúng kỳ. URL thiếu/sai → khoảng mặc định (30 ngày qua), không
// báo lỗi. Trả kèm kỳ trước (cùng số ngày, liền trước) để so sánh.
import { parseAsString, useQueryStates } from 'nuqs'
import { KY_MAC_DINH, khoangHopLe, kyTruoc, tinhKhoang } from '../utils/kyBaoCao'

// `macDinh` (MLACP-659): khoá khoảng định sẵn khi URL không có kỳ — báo cáo doanh thu của chủ phòng trà dùng '12t' vì
// biểu đồ của nó theo tháng; trang Admin giữ 30 ngày.
export const useKyBaoCao = (macDinh = KY_MAC_DINH) => {
  const [q, setQ] = useQueryStates({ tu: parseAsString, den: parseAsString })
  const ky = khoangHopLe(q.tu, q.den) ?? tinhKhoang(macDinh)
  const datKy = ({ tu, den }) => setQ({ tu, den })
  return { ...ky, truoc: kyTruoc(ky.tu, ky.den), datKy }
}
