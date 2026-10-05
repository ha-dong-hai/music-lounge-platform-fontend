// src/utils/chatTrucTiep.js
//
// DANH SÁCH TIN của khung trò chuyện buổi phát trực tiếp — hàm thuần, kiểm được (03/10/2026).
//
// HAI LỖI rà ra khi xem "nhiều dữ liệu thì sao":
//  1. THỨ TỰ: GET /livestreams/{id}/chat trả MỚI NHẤT TRƯỚC (LivestreamRepository.GetChatMessagesAsync:
//     OrderByDescending(m => m.Id) — đúng cho phân trang "lấy 50 tin gần nhất"). Web in nguyên thứ tự đó rồi nối tin
//     mới (SignalR) vào CUỐI → vào xem thấy 50 tin cũ chạy ngược (mới trên, cũ dưới), và tin mới đầu tiên nằm ngay
//     dưới tin CŨ NHẤT. Khung chat phải xếp cũ → mới.
//  2. KHÔNG CÓ TRẦN: mỗi tin SignalR nối thêm vào mảng mãi mãi; một đêm diễn vài nghìn tin là vài nghìn nút DOM, mọi
//     tin mới vẽ lại cả danh sách. Giữ TRAN_TIN tin gần nhất (tin cũ hơn vẫn nằm trên máy chủ). Dòng ỦNG HỘ không bị
//     bỏ: thanh "Top ủng hộ" (TopDonorsBar) cộng dồn từ chính các dòng này, bỏ đi là tụt số của người đã ủng hộ.
//     Trần 300: đủ cho người cuộn ngược đọc vài phút gần nhất. Đường nâng cấp: nút "Xem tin cũ hơn" gọi trang 2 của API.

export const TRAN_TIN = 300

// Lịch sử (mới → cũ từ API) thành danh sách hiển thị cũ → mới.
export const tuLichSu = (items = [], userId) => [...items].reverse().map((m) => ({
  chatId: m.messageId, // để ẩn đúng tin khi có ChatMessageHidden
  user: { name: m.displayName, avatarUrl: null },
  content: m.message,
  type: 'chat',
  isMine: m.userId === userId,
  sentAt: m.sentAt ?? null,
}))

// Nối một tin và cắt bớt tin TRÒ CHUYỆN cũ nhất khi quá trần. Dòng ủng hộ luôn giữ.
// 05/10/2026: tin trò chuyện được CHÈN đúng chỗ theo MÃ TIN của máy chủ — nhiều người gửi trong cùng một khoảnh khắc thì
// mỗi màn hình nhận theo một thứ tự khác (máy chủ phát song song tới từng kết nối), nên nối vào cuối làm mỗi người thấy
// một cuộc trò chuyện khác nhau (đo với 3 người: ba thứ tự). Khoá là mã tin chứ không phải giờ gửi: đo được 3 tin lệch
// nhau dưới 1 mili-giây — Date.parse cắt còn mili-giây nên coi như trùng; và lịch sử chat (tải lại trang) xếp theo mã
// tin. Mã là OrderedGuid của backend: 12 ký tự hex đầu là bộ đếm tăng dần, so theo chữ đúng thứ tự (MLACP-515).
// Dòng không có mã tin (ủng hộ) nối vào cuối như cũ.
const sauTin = (a, b) => a.chatId && b.chatId && String(a.chatId).toLowerCase() > String(b.chatId).toLowerCase()
export const themTin = (ds, tin, tran = TRAN_TIN) => {
  const moi = [...ds]
  let viTri = moi.length
  if (tin.chatId) {
    while (viTri > 0 && moi[viTri - 1].chatId && sauTin(moi[viTri - 1], tin)) viTri--
  }
  moi.splice(viTri, 0, tin)
  let du = moi.length - tran
  if (du <= 0) return moi
  return moi.filter((m) => {
    if (du > 0 && m.type !== 'donate') { du--; return false }
    return true
  })
}

// Khoá React ổn định cho một dòng: theo mã tin, không theo vị trí (cắt đầu mảng làm mọi chỉ số dịch đi).
export const khoaTin = (m, i) => (m.type === 'donate' ? `ung-ho-${m.id ?? i}` : `tin-${m.chatId ?? i}`)
