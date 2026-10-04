// src/hooks/useKyBaoCao.js
//
// MLACP-595: kỳ báo cáo của trang phân tích Admin, nằm trên URL (?tu=YYYY-MM-DD&den=YYYY-MM-DD) bằng nuqs — tải lại
// trang, bấm Quay lại hay gửi link cho người khác đều giữ đúng kỳ. URL thiếu/sai → khoảng mặc định (30 ngày qua), không
// báo lỗi. Trả kèm kỳ trước (cùng số ngày, liền trước) để so sánh.
import { parseAsString, useQueryStates } from 'nuqs'
import { KY_MAC_DINH, khoangHopLe, kyTruoc, tinhKhoang } from '../utils/kyBaoCao'

export const useKyBaoCao = () => {
  const [q, setQ] = useQueryStates({ tu: parseAsString, den: parseAsString })
  const ky = khoangHopLe(q.tu, q.den) ?? tinhKhoang(KY_MAC_DINH)
  const datKy = ({ tu, den }) => setQ({ tu, den })
  return { ...ky, truoc: kyTruoc(ky.tu, ky.den), datKy }
}
