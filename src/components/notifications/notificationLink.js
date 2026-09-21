// src/components/notifications/notificationLink.js
//
// LUẬT DẪN ĐƯỜNG CỦA THÔNG BÁO — MỘT BẢN DUY NHẤT, DÙNG CHUNG cho chuông và trang Thông báo.
// Tách ra đây vì có HAI nơi hiển thị thông báo; để mỗi nơi một bản là bảo đảm sẽ lệch, rồi cùng
// một thông báo bấm ở hai chỗ lại ra hai trang khác nhau.
//
// - Từ vựng đầy đủ ~20 giá trị referenceType nằm ở backend: NotificationReferenceTypes.cs — mỗi loại
//   ghi rõ referenceId là mã của cái gì. Loại nào chưa có trang phía FE thì cố tình KHÔNG gắn link
//   (payout_owner, kyc_review, security_ip, fnb_order, venue_penalty, ...) để không tạo link chết.
// - Mỗi link phải KHỚP quyền của route nó trỏ tới trong AppRouter.jsx: route không cho vai trò đó vào
//   thì ProtectedRoute đẩy về "/", người dùng bấm thông báo mà ra trang chủ. Đổi quyền route thì sửa ở đây.
// - 'livestream': referenceId là MÃ BUỔI DIỄN từ MLACP-460 (#329); thông báo cũ được migration 464
//   (#334) đổi lại. Trước đó nó là mã LIVESTREAM — nếu thấy link ra sai buổi thì kiểm migration 464 đã chạy chưa.

// Những loại thông báo dành cho NGƯỜI VẬN HÀNH buổi diễn, không phải cho khán giả.
// Cả hai đều mang referenceType 'show' và referenceId = mã buổi diễn, giống hệt một thông báo
// show thông thường — nên CHỈ có trường `type` phân biệt được, không thể dựa vào referenceType.
// Backend serialize enum ra chuỗi (JsonStringEnumConverter toàn cục), nên so sánh bằng tên là đúng;
// nếu `type` thiếu hoặc lạ thì rơi về đường của khán giả, không vỡ gì.
//
// Hai giá trị dưới đây KHÁC nhau về độ tin cậy, đừng coi là ngang hàng:
//   - 'ModerationResult'       ĐÃ có trên API đang chạy, đã thấy trong dữ liệu thật.
//   - 'PosterGenerationResult' theo PR #326: ĐÃ vào master (đã kiểm code nằm trên master thật,
//     không chỉ nhãn "merged" — vụ #324 từng hiện merged mà code không vào), nhưng chưa thấy trên
//     API thật. Giữ sẵn vì không gây hại: chỉ khớp khi backend thực sự gửi loại đó.
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
    case 'show':
      // Chủ nhận kết quả duyệt cần màn vận hành (lý do từ chối, nút sửa, gửi duyệt lại), không phải
      // trang bán vé. Staff không vào được /owner/shows nên rơi về trang công khai.
      return OPERATOR_SHOW_TYPES.has(type) && isOwner
        ? `/owner/shows/${referenceId}`
        : `/shows/${referenceId}`
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
