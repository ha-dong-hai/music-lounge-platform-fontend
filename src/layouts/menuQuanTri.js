// src/layouts/menuQuanTri.js
//
// DỮ LIỆU MENU KHU QUẢN TRỊ — tách khỏi AdminLayout (MLACP-618) để khối "Việc cần xử lý" ở trang Tổng quan dùng đúng
// tên và biểu tượng của menu, không chép một bảng tên thứ hai (chép thì sớm muộn hai nơi lệch nhau).
//
// GOM NHÓM (30/09/2026): 16 mục phẳng → 4 nhóm theo loại việc: duyệt nội dung, tiền, khiếu nại, hệ thống.
import { LayoutDashboard, Music, Store, Package, Users, Receipt, MessageSquareWarning, SlidersHorizontal, ShieldAlert, Banknote, Landmark, ShieldCheck, Settings2, Gavel, ExternalLink, UserCog, Building2, CalendarX2 } from 'lucide-react'

export const NHOM = [
  { ten: 'Tổng quan', muc: [
    // MLACP-695: bỏ "Nội dung và tương tác" (/admin/insights) — chủ dự án 06/10: dư thừa. Gợi ý AI nay là tab trên Tổng quan.
    { to: '/admin', end: true, nhan: 'Tổng quan', icon: LayoutDashboard },
  ] },
  { ten: 'Duyệt', muc: [
    { to: '/admin/shows', nhan: 'Buổi diễn', icon: Music },
    { to: '/admin/venues', nhan: 'Phòng trà', icon: Store },
    { to: '/admin/kyc-reviews', nhan: 'Định danh người bán', icon: ShieldCheck },
    { to: '/admin/content-reports', nhan: 'Báo cáo vi phạm', icon: ShieldAlert },
  ] },
  { ten: 'Tiền', muc: [
    { to: '/admin/refunds', nhan: 'Hoàn tiền', icon: Banknote },
    { to: '/admin/settlements', nhan: 'Quyết toán', icon: Landmark },
    { to: '/admin/ledger', nhan: 'Sổ cái', icon: Receipt },
    { to: '/admin/bank-accounts', nhan: 'Tài khoản nhận tiền', icon: Building2 },
    { to: '/admin/packages', nhan: 'Gói dịch vụ', icon: Package },
  ] },
  { ten: 'Khiếu nại', muc: [
    { to: '/admin/complaint', nhan: 'Xử lý khiếu nại', icon: MessageSquareWarning },
    { to: '/admin/penalty-appeals', nhan: 'Khiếu nại án phạt', icon: Gavel },
    // MLACP-676: phòng trà huỷ buổi đã mở bán — xét lý do để miễn hay phạt.
    { to: '/admin/show-cancellations', nhan: 'Lý do huỷ buổi', icon: CalendarX2 },
  ] },
  { ten: 'Hệ thống', muc: [
    { to: '/admin/accounts', nhan: 'Tài khoản người dùng', icon: Users },
    { to: '/admin/filter-options', nhan: 'Danh mục phân loại', icon: SlidersHorizontal },
    { to: '/admin/system-config', nhan: 'Cấu hình hệ thống', icon: Settings2 },
  ] },
]

// LỐI RA — Admin cần xem sản phẩm như khách thấy (kiểm một buổi diễn vừa duyệt chẳng hạn).
export const LOI_RA = [
  { to: '/account', nhan: 'Tài khoản của tôi', icon: UserCog },
  { to: '/', nhan: 'Về trang công khai', icon: ExternalLink },
]

// Tra mục menu theo đường dẫn — cho khối "Việc cần xử lý".
export const mucTheoDuong = Object.fromEntries(NHOM.flatMap((n) => n.muc).map((m) => [m.to, m]))
