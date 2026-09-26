// src/components/notifications/notificationLink.js

const OPERATOR_SHOW_TYPES = new Set(['ModerationResult', 'PosterGenerationResult'])

export const buildLink = (notification, role) => {
  const { type, referenceType, referenceId } = notification
  if (!referenceType || !referenceId) return null

  // Khớp đúng guard trong AppRouter.jsx: cổng /owner cho Owner + Staff, nhưng /owner/shows,
  // /owner/subscription chỉ cho Owner (endpoint của chúng là RequireOwner); chỉ /owner/livestreams
  // cho cả Staff (RequireVenueOperator).
  const isAdmin = role === 'Admin'
  const isOwner = role === 'Owner'
  const canOperateLivestream = role === 'Owner' || role === 'Staff'

  switch (referenceType) {
    case 'show': {
      // Chủ nhận kết quả duyệt cần màn vận hành (lý do từ chối, nút sửa, gửi duyệt lại), không phải
      // trang bán vé. Staff không vào được /owner/shows nên rơi về trang công khai.
      if (!OPERATOR_SHOW_TYPES.has(type) || !isOwner) return `/shows/${referenceId}`
      // Hai loại trên cùng mang referenceType 'show' và cùng mã buổi diễn, nhưng NGƯỜI NHẬN CẦN HAI
      // BẢNG KHÁC NHAU: kết quả duyệt ở màn vận hành /owner/shows/:id, còn poster ở màn cài đặt
      // /owner/shows/:id/settings — bảng "Poster" với lịch sử ảnh và nút "Dùng ảnh này" chỉ có ở đó.
      // Trỏ cả hai về cùng một trang thì người nhận tin "poster đã xong" mở ra một trang không có
      // tấm poster nào và không có gì để bấm.
      return type === 'PosterGenerationResult'
        ? `/owner/shows/${referenceId}/settings`
        : `/owner/shows/${referenceId}`
    }
    case 'livestream':
      // Kết quả duyệt buổi phát, gửi cho người vận hành → về màn vận hành livestream (Staff vào được).
      // Vai trò khác: trang xem, nhận mã buổi diễn — đúng kiểu referenceId từ #329.
      return canOperateLivestream ? '/owner/livestreams' : `/livestream/${referenceId}`
    case 'ticket':
      return `/my-shows/ticket/${referenceId}`
    case 'lounge':
      return `/lounge/${referenceId}`
    // Các màn dưới đây là DANH SÁCH, không có route chi tiết theo id — link về danh sách là đủ để người
    // nhận tìm thấy việc cần làm. Vai trò không có quyền vào thì không gắn link.
    case 'content_report_target':
      return isAdmin ? '/admin/content-reports' : null
    case 'refund_request':
      return isAdmin ? '/admin/refunds' : null
    case 'settlement':
      return isAdmin ? '/admin/settlements' : null
    case 'complaint':
      return isAdmin ? '/admin/complaint' : null
    case 'subscription':
      return isOwner ? '/owner/subscription' : null
    default:
      return null
  }
}