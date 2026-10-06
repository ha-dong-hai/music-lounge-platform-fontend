// src/utils/loiTaiTep.js
//
// MLACP-697: LỖI "KHÔNG TẢI ĐƯỢC TỆP CỦA TRANG" — nhận diện và lịch tự thử lại.
//
// Web tách mã theo trang (MLACP-611): mỗi trang là một tệp có mã băm trong tên, tải khi người dùng mở tới. Mỗi lần deploy
// tên tệp đổi; tab đang mở bản cũ (hoặc mở đúng lúc đang deploy dở) đòi một tệp không còn → trình duyệt ném lỗi tải mô-đun.
// Đo 06/10/2026 trên web thật: người dùng thấy nguyên trang "Unexpected Application Error! Failed to fetch dynamically
// imported module…" của React Router và KẸT ở đó kể cả khi tệp đã có lại — lớp tự tải lại ở main.jsx chỉ thử đúng một lần.
//
// Ở đây chỉ có hàm thuần (kiểm bằng loiTaiTep.test.mjs); trang hiển thị là pages/TrangLoiUngDung.jsx.

// Câu lỗi của từng trình duyệt cho cùng một việc (import() hỏng) + lỗi nạp CSS/tệp phụ của Vite:
//   Chrome/Edge: "Failed to fetch dynamically imported module: <url>"
//   Firefox:     "error loading dynamically imported module: <url>"
//   Safari:      "Importing a module script failed."
//   Vite:        "Unable to preload CSS for <url>"
//   Máy chủ trả HTML cho tệp .js: "Expected a JavaScript-or-Wasm module script but the server responded with a MIME type of…"
const MAU_LOI_TAI_TEP = /dynamically imported module|Importing a module script failed|Unable to preload CSS|Expected a JavaScript(-or-Wasm)? module script/i

export const laLoiTaiTep = (loi) => MAU_LOI_TAI_TEP.test(String(loi?.message ?? loi ?? ''))

// LỊCH TỰ THỬ LẠI: 3 lần — lần đầu tải lại NGAY (trường hợp thường gặp: deploy đã xong, tải lại là có bản mới, người dùng
// gần như không thấy gì), rồi 4 giây, 10 giây (đang deploy dở / máy chủ biên chưa đồng bộ), rồi dừng và để người dùng tự
// bấm — tệp hỏng thật thì không tải lại vô hạn. Sau QUEN_SAU ms không lỗi nữa thì đếm lại từ đầu (lần deploy sau là một
// sự cố mới). Đây là cơ chế DUY NHẤT: lớp nghe vite:preloadError ở main.jsx (05/10) đã bỏ — nó chỉ thử một lần trong 10
// giây, và vì chặn lỗi gốc nên trong lúc chờ tải lại React.lazy nhận về undefined rồi ném một lỗi khác, khó hiểu hơn.
export const CHO_THU_LAI_GIAY = [0, 4, 10]
export const QUEN_SAU = 60_000
export const KHOA_THU_LAI = 'thu-lai-tai-tep'

// trangThai = { lan, luc } đã lưu (hoặc null) → số giây chờ trước lần tự tải lại kế tiếp; null = đã hết lượt tự thử.
export const lanThuKeTiep = (trangThai, bayGio) => {
  const conHan = trangThai && Number.isFinite(trangThai.luc) && bayGio - trangThai.luc < QUEN_SAU
  const lan = conHan ? Number(trangThai.lan) || 0 : 0
  return lan < CHO_THU_LAI_GIAY.length ? { lan: lan + 1, choGiay: CHO_THU_LAI_GIAY[lan] } : null
}
