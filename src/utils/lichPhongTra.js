// src/utils/lichPhongTra.js
//
// CHIA LỊCH DIỄN CỦA MỘT PHÒNG TRÀ thành "sắp tới" và "đã diễn" — hàm thuần, tách khỏi component để KIỂM ĐƯỢC.
//
// VÌ SAO CẦN: endpoint /lounge-shows/by-lounge/{id} trả MỌI buổi đã công bố của phòng trà (đang bán, đang diễn, đã
// kết thúc, đã huỷ), xếp MỚI NHẤT TRƯỚC. Trang cũ lấy nguyên 6 dòng đầu rồi in — nên người xem thấy buổi XA NHẤT
// trước, và khi phòng trà có hơn 6 buổi thì những đêm gần nhất (thứ họ đang tìm) không bao giờ hiện ra.
//
// QUY TẮC:
//  - Sắp tới = trạng thái Published hoặc Ongoing. Buổi đang diễn đứng đầu, còn lại xếp GẦN NHẤT TRƯỚC.
//    Buổi Published mà giờ bắt đầu đã qua vẫn để ở đây: chủ phòng trà chưa bấm bắt đầu, khán giả vẫn vào được.
//  - Đã diễn = Ended, xếp MỚI NHẤT TRƯỚC (người ta tìm đêm vừa đi để đánh giá).
//  - Draft và Pending bị loại Ở ĐÂY dù backend đã lọc: bản backend trên Azure tính tới 30/09/2026 còn để lọt buổi
//    đang chờ duyệt ra danh sách công khai (đã sửa ở nhánh backend, chưa triển khai). Bấm vào một buổi như vậy là
//    gặp trang 404 — nên giao diện không in nó ra.
//  - Cancelled không nằm ở danh sách nào: người đã mua vé được báo riêng; in một đêm đã huỷ vào lịch của phòng trà
//    chỉ khiến người mới tưởng là còn đi được.
//
// NGƯỠNG (reports/Thu gọn danh sách lựa chọn dài.md + research_notes/Trang phòng trà ảnh và lịch diễn/):
//  - SO_BUOI_HIEN = 20 buổi sắp tới in sẵn; còn lại mở bằng "Xem thêm N buổi diễn" (Baymard: danh sách cắt phải
//    báo rõ SỐ mục đang ẩn). Lịch diễn là NỘI DUNG CHÍNH của trang địa điểm — DICE và Ticketmaster đều đặt nó ngay
//    sau tên địa điểm, xếp gần nhất trước, không có nút sắp xếp; DICE in 30 dòng rồi mới "Load more", Ticketmaster
//    in 20; địa điểm có 3, 9, 18, 21 buổi thì in hết, không có nút (đọc HTML tĩnh 13 trang địa điểm DICE và 3 trang
//    Ticketmaster, 30/09/2026). Lấy mức thấp của hai trang đó. In ít hơn (5–10) là giấu nội dung chính mà không có
//    nguồn nào ủng hộ. Chưa có số đo của chính trang này.
//  - NGUONG_KHONG_CAT = 24: tới 24 buổi thì in hết — cắt để giấu vài dòng là bắt bấm thêm mà không bớt được gì.
//  - SO_DA_DIEN_HIEN = 5 buổi đã diễn, nằm trong một khối ĐÓNG SẴN (lịch sử là thứ phụ).
//  - TRAN_TAI = 100: backend kẹp pageSize ở 100. Phòng trà có hơn 100 buổi đã công bố thì phần bị cắt là các buổi
//    CŨ NHẤT (backend xếp mới nhất trước) — lịch sắp tới vẫn đủ. Đường nâng cấp: thêm tham số lọc "sắp tới" ở backend.
import dayjs from 'dayjs'

export const SO_BUOI_HIEN = 20
export const NGUONG_KHONG_CAT = 24
export const SO_DA_DIEN_HIEN = 5
export const TRAN_TAI = 100

const moc = (b) => dayjs(b?.scheduledStart).valueOf()

export const chiaLichPhongTra = (ds) => {
  const hopLe = (Array.isArray(ds) ? ds : []).filter((b) => b && dayjs(b.scheduledStart).isValid())
  const sapToi = hopLe
    .filter((b) => b.status === 'Published' || b.status === 'Ongoing')
    .sort((a, b) => (b.status === 'Ongoing') - (a.status === 'Ongoing') || moc(a) - moc(b))
  const daDien = hopLe.filter((b) => b.status === 'Ended').sort((a, b) => moc(b) - moc(a))
  return { sapToi, daDien }
}

// Cắt danh sách sắp tới thành phần in sẵn và phần ẩn.
export const catLich = (ds, { soHien = SO_BUOI_HIEN, nguongKhongCat = NGUONG_KHONG_CAT } = {}) =>
  ds.length <= nguongKhongCat ? { hien: ds, an: [] } : { hien: ds.slice(0, soHien), an: ds.slice(soHien) }
