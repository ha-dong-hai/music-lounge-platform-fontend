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