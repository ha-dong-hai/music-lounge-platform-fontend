// src/i18n/k.js — hai công cụ dịch cho mã NGOÀI component (xem src/i18n/index.js). Tách riêng, KHÔNG import gì, để tiện ích
// chạy unit test bằng node (utils/*.test.mjs) dùng được mà không kéo theo en.json/i18next.
//
// k('câu')        — chỉ ĐÁNH DẤU câu trong hằng số (nhãn menu, danh sách lựa chọn); component dịch lúc vẽ bằng t(bien).
// td('câu', {x})  — dịch NGAY (câu ghép trong hàm tiện ích: nhãn chip lọc, khoảng giá). Mặc định chỉ điền tham số vào câu
//                   tiếng Việt; src/i18n/index.js cắm i18n.t vào khi chạy trong trình duyệt. Đổi ngôn ngữ thì App vẽ lại cả
//                   cây nên các hàm này được gọi lại theo ngôn ngữ mới.
export const k = (s) => s

const dienThamSo = (s, p) => (p ? s.replace(/\{\{(\w+)\}\}/g, (_, ten) => (p[ten] ?? '')) : s)
let boDich = dienThamSo
export const datBoDich = (f) => { boDich = f }
export const td = (s, p) => boDich(s, p)
