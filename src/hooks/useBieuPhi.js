// src/hooks/useBieuPhi.js
//
// MLACP-626: biểu phí và điều khoản tiền ĐANG ÁP DỤNG (GET /catalog/money-terms, công khai). Một queryKey cho mọi nơi in
// điều khoản tiền (bước mua vé, hộp ủng hộ, trang vé, trang tài chính của chủ phòng trà, trang Điều khoản) — các nơi luôn
// nói cùng một con số và chỉ tốn một yêu cầu.
//
// Biểu phí hiếm khi đổi (mỗi lần Admin phải ghi lý do), nên giữ 5 phút là đủ tươi; đổi xong thì tối đa 5 phút sau mọi
// trang đang mở tự đúng lại. Lỗi tải: trả undefined — nơi dùng KHÔNG in số thay thế (không bịa dữ liệu), chỉ dẫn sang
// trang Điều khoản.
import { useQuery } from '@tanstack/react-query'
import { getMoneyTerms } from '../services/catalogServices'

export const KHOA_BIEU_PHI = ['catalog', 'money-terms']

export const useBieuPhi = () => useQuery({
  queryKey: KHOA_BIEU_PHI,
  queryFn: async () => {
    const r = await getMoneyTerms()
    if (!r?.success || !r.data) throw new Error('khong-tai-duoc')
    return r.data
  },
  staleTime: 5 * 60_000,
  refetchOnWindowFocus: false,
  retry: 1,
})
