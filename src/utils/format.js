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

const DAY_DU_NGAY_GIO = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/

export const mocUtc = (chuoi) => {
  if (!chuoi || typeof chuoi !== 'string') return chuoi
  // Chỉ-ngày, chỉ-giờ, hay bất cứ dạng nào khác → không phải việc của hàm này.
  if (!DAY_DU_NGAY_GIO.test(chuoi)) return chuoi
  // Đã có 'Z' cuối, hoặc có offset dạng +07:00 / -05:00 ở cuối → để nguyên.
  if (/(Z|[+-]\d{2}:?\d{2})$/.test(chuoi)) return chuoi
  return `${chuoi}Z`
}
/**
 * MLACP-516: backend đổi mọi id sang GUID (MLACP-515). GUID dài 36 ký tự nên chỉ HIỂN THỊ 8 ký tự hex cuối, in hoa
 * ("#00000047"); mã đầy đủ để ở tooltip (title) cho ai cần đối chiếu.
 * Vì sao 8 ký tự CUỐI: backend đặt bộ đếm thời gian (id cũ, hoặc mili-giây khi tạo) ở nhóm cuối nên nó khác nhau
 * giữa các bản ghi; nhóm giữa của mọi bản ghi cũ trong cùng một bảng lại GIỐNG HỆT nhau — lấy nhóm đó thì mọi mã trùng.
 * Đây chỉ là mã để NHÌN, không dùng để tra cứu hay gửi lên API (gửi lên luôn dùng id đầy đủ).
 */
export const maNgan = (id) => {
  if (id === null || id === undefined || id === '') return ''
  const s = String(id)
  return s.length > 8 ? s.slice(-8).toUpperCase() : s.toUpperCase()
}

const DANG_GUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

/** MLACP-516: kiểm mã người dùng tự dán (vd ô "Mã buổi diễn" của form khiếu nại) có đúng dạng GUID không. */
export const laGuid = (chuoi) => typeof chuoi === 'string' && DANG_GUID.test(chuoi.trim())
