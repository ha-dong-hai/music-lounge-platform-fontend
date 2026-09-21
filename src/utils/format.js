export const formatCurrency = (value) => {
  const num = Number(value) || 0
  return num.toLocaleString('vi-VN')
}

/**
 * Format gọn số lượng lớn (followers, views...) kiểu YouTube/Instagram
 * 999 → "999" | 1000 → "1K" | 1500 → "1K+"
 * 10000 → "10K" | 10500 → "10K+"
 * 1000000 → "1M" | 1050000 → "1M+" | 1560000 → "1.5M+"
 */
export const formatCompactNumber = (value) => {
  const num = Number(value) || 0

  if (num < 1000) return String(num)

  // Hàng triệu — giữ 1 chữ số thập phân
  if (num >= 1000000) {
    const rounded = Math.floor(num / 100000) / 10   // 1560000 → 1.5
    const hasRemainder = num > rounded * 1000000
    return `${rounded}M${hasRemainder ? '+' : ''}`
  }

  // Hàng nghìn — làm tròn xuống, còn dư thì thêm "+"
  const thousands = Math.floor(num / 1000)
  const hasRemainder = num % 1000 !== 0
  return `${thousands}K${hasRemainder ? '+' : ''}`
}
/**
 * Vá mốc thời gian KHÔNG KÈM MÚI GIỜ trước khi đưa cho dayjs.
 *
 * GHI CHÚ CHO ĐỘI FE — VÌ SAO CẦN HÀM NÀY:
 * Backend trả hai dạng mốc thời gian khác nhau, tuỳ kiểu cột trong cơ sở dữ liệu:
 *   DateTimeOffset → "2026-09-18T17:35:21.63+00:00"  (có offset, dayjs đọc đúng)
 *   DateTime       → "2026-09-20T17:35:21.7140735"   (KHÔNG offset, nhưng giá trị là giờ UTC)
 * Dạng thứ hai đưa thẳng vào dayjs sẽ bị hiểu là GIỜ MÁY NGƯỜI DÙNG. Ở Việt Nam (UTC+7) là lệch
 * đúng 7 tiếng — đủ để một mốc buổi tối nhảy sang ngày hôm sau, và không ai nhận ra vì nó vẫn ra
 * một ngày trông hợp lý.
 *
 * Hàm này thêm 'Z' khi chuỗi chưa có múi giờ, để dayjs hiểu đúng là UTC rồi tự đổi về giờ máy.
 * Chuỗi đã có offset (hoặc đã kết thúc bằng Z) thì giữ nguyên — KHÔNG được thêm lần nữa.
 *
 * Dùng cho mốc nào? Chỉ những trường backend trả về không có offset. Ví dụ đã biết:
 * `createdAt` của tài khoản nhận tiền, và `createdAt` của danh sách người dùng Admin.
 * Gặp thêm chỗ nào thì bọc chỗ đó, đừng bọc tràn lan.
 *
 * TUYỆT ĐỐI KHÔNG DÙNG CHO CHUỖI CHỈ-NGÀY HAY CHỈ-GIỜ. Hệ thống có ba trường như vậy:
 *   ngày trong biểu đồ bán vé ("2026-08-17"), ngày sinh ở hàng đợi định danh ("1998-03-21"),
 *   và giờ diễn của nghệ sĩ ("19:30:00").
 * Chúng KHÔNG có múi giờ và KHÔNG ĐƯỢC có: ngày sinh không thuộc múi giờ nào, giờ diễn là giờ
 * treo trên tường của phòng trà. Gắn 'Z' vào là hỏng theo hai kiểu khác nhau:
 *   "19:30:00Z"   → Invalid Date. Hỏng ồn ào, thấy ngay.
 *   "2026-08-17Z" → KHÔNG Invalid, mà thành nửa đêm UTC. Ở Việt Nam hiện thành 07:00 cùng ngày
 *                   (ngày vẫn đúng), nhưng ở múi giờ âm thì lùi hẳn MỘT NGÀY. Hỏng im lặng, tệ hơn.
 * Vì vậy hàm chỉ động vào chuỗi có đủ ngày VÀ giờ (có chữ 'T' và ít nhất HH:MM); mọi dạng khác
 * trả nguyên văn. Chặn ở đây thay vì trông vào người gọi nhớ — người gọi sau sẽ không nhớ.
 */
const DAY_DU_NGAY_GIO = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/

export const mocUtc = (chuoi) => {
  if (!chuoi || typeof chuoi !== 'string') return chuoi
  // Chỉ-ngày, chỉ-giờ, hay bất cứ dạng nào khác → không phải việc của hàm này.
  if (!DAY_DU_NGAY_GIO.test(chuoi)) return chuoi
  // Đã có 'Z' cuối, hoặc có offset dạng +07:00 / -05:00 ở cuối → để nguyên.
  if (/(Z|[+-]\d{2}:?\d{2})$/.test(chuoi)) return chuoi
  return `${chuoi}Z`
}
