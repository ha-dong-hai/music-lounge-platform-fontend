// src/hooks/useAutoShowRating.js
// Tự mở modal đánh giá sau khi buổi diễn kết thúc — tách khỏi trang xem livestream cho page gọn.
// Giữ nguyên quy tắc của bản gốc: chỉ hỏi MỘT lần mỗi show (localStorage), chỉ user đã đăng nhập;
// "kết thúc" tính theo scheduledEnd (ưu tiên) hoặc status 'Ended'; đang live thì soi lại mỗi 30s
// để bắt đúng lúc kết thúc; hiện modal trễ 3s cho tự nhiên (kiểu YouTube hiện survey sau stream).
import { useState, useEffect } from 'react'

export const useAutoShowRating = ({ showData, showId, user }) => {
  const [showRatingModal, setShowRatingModal] = useState(false)

  useEffect(() => {
    if (!showData) return
    if (!user) return // đánh giá gắn tài khoản → chỉ hỏi user đã login
    if (localStorage.getItem(`rated_show_${showId}`)) return // đã hỏi rồi → thôi

    const hasEnded = () => {
      if (showData.scheduledEnd) return new Date() > new Date(showData.scheduledEnd)
      if (showData.status) return String(showData.status).toLowerCase() === 'ended'
      return false
    }

    let modalTimer = null
    let interval = null

    const triggerIfEnded = () => {
      if (hasEnded()) {
        if (interval) clearInterval(interval)
        modalTimer = setTimeout(() => setShowRatingModal(true), 3000)
        return true
      }
      return false
    }

    if (!triggerIfEnded()) {
      interval = setInterval(triggerIfEnded, 30000)
    }

    return () => {
      if (interval) clearInterval(interval)
      if (modalTimer) clearTimeout(modalTimer)
    }
  }, [showData, showId, user])

  const openRating = () => setShowRatingModal(true)

  // Đóng (skip hoặc gửi xong) → đánh dấu đã hỏi, không hiện lại
  const closeRating = () => {
    setShowRatingModal(false)
    localStorage.setItem(`rated_show_${showId}`, 'true')
  }

  return { showRatingModal, openRating, closeRating }
}