// src/utils/buoiVuaXem.js
//
// BUỔI VỪA XEM TRÊN MÁY NÀY — cho gợi ý của KHÁCH chưa đăng nhập (03/10/2026).
// Backend GET /recommendations nhận `recentShowIds` từ khách để xếp "Giống những buổi diễn bạn vừa xem", và cố ý KHÔNG lưu
// gì phía máy chủ (RecommendationsController: "không lưu, không đặt cookie, không gắn với định danh nào"). Trước hôm nay
// web không gửi gì → mức gợi ý cho khách chưa bao giờ nhận được dữ liệu, khách luôn thấy bảng thịnh hành chung.
// - Chỉ ở localStorage của CHÍNH máy đó; tối đa SO_TOI_DA buổi, mới nhất trước (backend cũng chặn trần riêng).
// - Đã đăng nhập thì backend bỏ qua tham số này (dùng sở thích tự khai) — vẫn ghi để lỡ đăng xuất vẫn có ngữ cảnh.
// - Có nút xoá ("Xoá lịch sử xem trên máy này") ở khối gợi ý trang chủ.
// - Trình duyệt chặn lưu (chế độ riêng tư, chặn dữ liệu trang) → mọi hàm im lặng trả rỗng, trang vẫn chạy.
const KHOA = 'ml-buoi-vua-xem-v1'
export const SO_TOI_DA = 10
const GUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/

const kho = (s) => s ?? (typeof localStorage !== 'undefined' ? localStorage : null)

export const docBuoiVuaXem = (s) => {
  try {
    const v = JSON.parse(kho(s)?.getItem(KHOA) ?? '[]')
    return Array.isArray(v) ? v.filter((x) => typeof x === 'string' && GUID.test(x)).slice(0, SO_TOI_DA) : []
  } catch { return [] }
}

export const nhoBuoiVuaXem = (id, s) => {
  const ma = String(id ?? '').toLowerCase()
  if (!GUID.test(ma)) return
  try { kho(s)?.setItem(KHOA, JSON.stringify([ma, ...docBuoiVuaXem(s).filter((x) => x !== ma)].slice(0, SO_TOI_DA))) } catch { /* bị chặn lưu — bỏ qua */ }
}

export const xoaBuoiVuaXem = (s) => { try { kho(s)?.removeItem(KHOA) } catch { /* bỏ qua */ } }
