// src/utils/trangThaiVe.js
//
// NĂM TRẠNG THÁI VÉ của backend (TicketStatus) → câu cho người giữ vé. Một nguồn cho danh sách vé và trang chi tiết vé:
// hai nơi tự dịch thì cùng một tấm vé sẽ mang hai tên trạng thái khác nhau.
// `dau` là chữ trên DẤU MỘC — chỉ có ở trạng thái nói về TIỀN (luật của DESIGN.md: dấu mộc chỉ nói về tiền).
export const TRANG_THAI_VE = {
  Pending: { nhan: 'Chờ thanh toán' },
  Confirmed: { nhan: 'Đã thanh toán', dau: 'ĐÃ TRẢ' },
  Used: { nhan: 'Đã soát vé', dau: 'ĐÃ TRẢ' },
  Cancelled: { nhan: 'Đã huỷ' },
  Refunded: { nhan: 'Đã hoàn tiền', dau: 'ĐÃ HOÀN' },
}

// Vé xem trực tuyến: mọi AccessType khác 'Physical' (hôm nay chỉ có 'Livestream'; so bằng "khác Physical" để khớp
// quy ước đã dùng ở danh sách vé).
export const laVeTrucTuyen = (accessType) => !!accessType && accessType !== 'Physical'
