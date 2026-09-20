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
 * `createdAt` của tài khoản nhận tiền. Gặp thêm chỗ nào thì bọc chỗ đó, đừng bọc tràn lan:
 * bọc nhầm một chuỗi đã có offset thì hàm này trả nguyên xi nên vô hại, nhưng đọc code sẽ khó hiểu.
 */
export const mocUtc = (chuoi) => {
  if (!chuoi || typeof chuoi !== 'string') return chuoi
  // Đã có 'Z' cuối, hoặc có offset dạng +07:00 / -05:00 ở cuối → để nguyên.
  if (/(Z|[+-]\d{2}:?\d{2})$/.test(chuoi)) return chuoi
  return `${chuoi}Z`
}
