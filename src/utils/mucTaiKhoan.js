// src/utils/mucTaiKhoan.js
//
// MLACP-593: trang Tài khoản chỉ hiện các mục có nghĩa với vai đang đăng nhập (trước đây mọi vai thấy đủ 5 mục).
//  - "Định danh và thuế" (số điện thoại, CCCD, hồ sơ thuế): chỉ CHỦ PHÒNG TRÀ — đó là điều kiện để bán vé và nhận tiền
//    (MLACP-397). Khán giả, nhân viên, admin không nhận tiền qua nền tảng nên mục này chỉ gây hiểu nhầm là bắt buộc.
//  - "Phòng trà đang theo dõi", "Sở thích gợi ý": ẩn với ADMIN — người vận hành nền tảng, không phải khách. Chủ và nhân
//    viên vẫn giữ vì họ cũng đi xem nhạc ở phòng trà khác.
//  - "Thông tin tài khoản", "Dữ liệu và tài khoản" (xuất dữ liệu, xoá tài khoản theo NĐ 13/2023): mọi vai.
// Đây là ẨN GIAO DIỆN, không phải kiểm quyền: API /me/* vẫn do backend quyết định.
export const MUC_TAI_KHOAN = [
  { key: 'profile', nhan: 'Thông tin tài khoản' },
  { key: 'followed', nhan: 'Phòng trà đang theo dõi', anVoi: ['Admin'] },
  { key: 'identity', nhan: 'Định danh và thuế', chiCho: ['Owner'] },
  { key: 'preferences', nhan: 'Sở thích gợi ý', anVoi: ['Admin'] },
  { key: 'privacy', nhan: 'Dữ liệu và tài khoản' },
]

export const mucTheoVai = (vai) =>
  MUC_TAI_KHOAN.filter((m) => (!m.chiCho || m.chiCho.includes(vai)) && !(m.anVoi ?? []).includes(vai))

// Tab trên URL (?tab=) mà vai này không có → về 'profile', như tab lạ.
export const tabHopLe = (vai, tab) => (mucTheoVai(vai).some((m) => m.key === tab) ? tab : 'profile')
