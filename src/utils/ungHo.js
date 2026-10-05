// src/utils/ungHo.js
//
// Tạo khoản ủng hộ rồi chuyển sang VNPay. Ủng hộ nghệ sĩ CHỈ có trong màn xem trực tuyến, cạnh khung chat — quyết định
// của chủ dự án 05/10/2026: trang chi tiết buổi diễn KHÔNG có nút ủng hộ (MLACP-638 từng thêm, đã gỡ). Backend (MLACP-641)
// cũng chỉ nhận ủng hộ từ người có quyền xem buổi phát. Tách khỏi LivestreamWatchPage để trang đó gọn và lỗi được ném ra rõ.
//
// NÉM lỗi có câu tiếng Việt để DonateModal in ngay trong hộp (01/10/2026): bản cũ tự toast rồi nuốt lỗi, nên hộp vẫn báo
// thành công dù khoản ủng hộ chưa được tạo.
//
// TAB MỚI (05/10/2026): bản cũ chuyển CẢ TRANG sang VNPay — người đang xem rời buổi phát trong lúc trả tiền, và trang
// cảm ơn không có đường quay lại (đo trên 5/5 lần ủng hộ thật). Nay VNPay mở ở tab `tab` do hộp ủng hộ mở SẴN ngay lúc
// bấm (mở sau một lời gọi mạng thì trình duyệt chặn cửa sổ bật lên). Không mở được tab (bị chặn) thì chuyển trang như cũ.
// Ngữ cảnh thanh toán ghi TRƯỚC khi mở tab nên tab mới mang theo bản sao sessionStorage — trang kết quả biết đường quay về.
import { createDonation } from '../services/donationServices'
import { ghiNhoThanhToan, LOAI_THANH_TOAN } from './paymentContext'

/** Mở sẵn một tab trống cho VNPay — gọi ĐỒNG BỘ trong sự kiện bấm. Null khi trình duyệt chặn. */
export const moTabThanhToan = () => {
  try { return window.open('', '_blank') } catch { return null }
}

export async function guiUngHoQuaVnPay(performers, performerId, amount, message, { tab = null, quayVe = null } = {}) {
  const dong = () => { try { tab?.close() } catch { /* tab đã đóng */ } }
  const performance = (performers ?? []).find((p) => p.id === performerId)
  if (!performance?.performanceId) { dong(); throw new Error('Không xác định được phần trình diễn của nghệ sĩ này.') }
  let res
  try {
    res = await createDonation({ performanceId: performance.performanceId, amount, message: message || null, isMessagePublic: true })
  } catch (err) {
    dong()
    throw new Error(err.response?.data?.message || 'Chưa tạo được khoản ủng hộ. Hãy thử lại.', { cause: err })
  }
  if (!res.success || !res.data?.paymentUrl) { dong(); throw new Error(res.message || 'Chưa nhận được đường dẫn thanh toán. Hãy thử lại.') }
  ghiNhoThanhToan(LOAI_THANH_TOAN.UNG_HO, quayVe)
  if (tab && !tab.closed) {
    try { tab.sessionStorage.setItem('musiclounge-payment-context', JSON.stringify({ loai: LOAI_THANH_TOAN.UNG_HO, quayVe })) } catch { /* khác nguồn: bỏ qua */ }
    tab.location.href = res.data.paymentUrl
    return { daMoTabMoi: true }
  }
  window.location.href = res.data.paymentUrl
  return { daMoTabMoi: false }
}
