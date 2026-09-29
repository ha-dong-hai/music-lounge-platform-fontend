// src/utils/paymentContext.js
//
// VÌ SAO CẦN FILE NÀY
// Backend redirect khách về một URL CỐ ĐỊNH sau khi VNPay trả kết quả — `Business:PaymentSuccessUrl`
// (appsettings: `http://localhost:5173/payment/success`), qua `VnPayIpnProtocol.BuyerLandingUrl`.
// Không có query param nào kèm theo, nên trang /payment/success KHÔNG thể biết khách vừa trả tiền
// cho vé, cho gói dịch vụ, cho đồ ăn hay cho tiền ủng hộ. Hệ quả thật: chủ phòng trà gia hạn gói
// xong lại đọc được "Nếu bạn vừa mua vé, vé sẽ có trong mục Vé của tôi" và một nút "Xem vé của tôi"
// — sai luồng, và dẫn đi sai chỗ.
//
// CÁCH SỬA Ở PHÍA FE, KHÔNG CẦN ĐỢI BACKEND
// Ngay trước khi chuyển sang VNPay, chính trang khởi tạo BIẾT nó đang bán cái gì. Ghi điều đó vào
// `sessionStorage`, rồi trang kết quả đọc lại. sessionStorage sống xuyên suốt vòng đi-về VNPay vì
// vẫn là cùng một tab và cùng một origin khi quay lại.
//
// GIỚI HẠN ĐÃ BIẾT (nên luôn phải có phương án dự phòng):
// - Khách quay lại ở TAB KHÁC, hoặc mở /payment/success trực tiếp sau này → không còn ngữ cảnh.
// - Trình duyệt chặn lưu trữ (chế độ riêng tư khắt khe) → đọc/ghi ném lỗi.
// Cả hai trường hợp đều rơi về bản chữ chung chung — vẫn đúng, chỉ là không cụ thể bằng.
//
// Đây là bản vá ở tầng client. Cách sửa tận gốc vẫn là backend gắn `?type=...` vào ba URL
// Business:Payment*Url (đề nghị đã ghi ở docs/design/DE-NGHI-CHO-BACKEND.md); khi nào backend làm,
// trang kết quả nên ưu tiên đọc query param rồi mới tới sessionStorage.

const KHOA = 'musiclounge-payment-context'

export const LOAI_THANH_TOAN = {
  VE: 'ticket',
  GOI: 'subscription',
  UNG_HO: 'donation',
  GOI_MON: 'fnb',
}

const LOAI_HOP_LE = Object.values(LOAI_THANH_TOAN)

// Gọi ngay TRƯỚC khi chuyển trình duyệt sang VNPay.
// `quayVe` là đường dẫn nội bộ để đưa khách về đúng nơi họ xuất phát (ví dụ trang gói dịch vụ của
// phòng trà, hay trang gọi món của đúng quán đó).
export const ghiNhoThanhToan = (loai, quayVe) => {
  if (!LOAI_HOP_LE.includes(loai)) return
  try {
    sessionStorage.setItem(KHOA, JSON.stringify({ loai, quayVe: quayVe ?? null }))
  } catch {
    // Trình duyệt chặn lưu trữ — không sao, trang kết quả sẽ dùng bản chữ chung.
  }
}

// ĐỌC — hàm THUẦN, không đổi gì. Tách khỏi việc xoá để trang kết quả gọi được trong
// `useState(layThanhToan)`: React có thể chạy lại hàm khởi tạo (StrictMode), nên nó phải vô hại khi
// gọi nhiều lần. Việc xoá nằm ở `xoaThanhToan`, gọi trong effect.
export const layThanhToan = () => {
  try {
    const raw = sessionStorage.getItem(KHOA)
    if (!raw) return null
    const parsed = JSON.parse(raw)
    if (!LOAI_HOP_LE.includes(parsed?.loai)) return null
    // Chỉ nhận đường dẫn nội bộ — cùng lý do như chỗ chuyển hướng sau đăng nhập.
    const quayVe =
      typeof parsed.quayVe === 'string' && parsed.quayVe.startsWith('/') && !parsed.quayVe.startsWith('//')
        ? parsed.quayVe
        : null
    return { loai: parsed.loai, quayVe }
  } catch {
    return null
  }
}

// XOÁ — gọi sau khi trang kết quả đã đọc xong. Ngữ cảnh chỉ dùng cho đúng một lần quay về; giữ lại
// thì lần sau khách mở /payment/success sẽ đọc được thông báo của giao dịch cũ.
export const xoaThanhToan = () => {
  try {
    sessionStorage.removeItem(KHOA)
  } catch {
    // Trình duyệt chặn lưu trữ — không có gì để xoá.
  }
}
