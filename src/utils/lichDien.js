// src/utils/lichDien.js
//
// PHÉP TÍNH VỀ LỊCH DIỄN — tách khỏi component để KIỂM ĐƯỢC.
//
// VÌ SAO TÁCH: hàm dưới đây quyết định trang chủ hiện kiểu trạng thái trống nào. Nó sống ở ranh
// giới nửa đêm và ở phép "cùng một ngày" — đúng hai chỗ mà lỗi không làm vỡ gì cả, chỉ khiến trang
// nói sai ngày. Nằm trong component thì không có cách nào chứng minh nó đúng ngoài việc ngồi canh
// trình duyệt qua nửa đêm.
import dayjs from 'dayjs'
// Đuôi .js tường minh: file này được bộ kiểm chạy bằng node ESM thuần, mà node không tự thêm đuôi
// như Vite. Vite hiểu cả hai cách, nên viết rõ đuôi là cách duy nhất chạy được ở CẢ HAI nơi.
import { nhanNgay, ngayGon, ngayDayDu } from './ngayVietNam.js'

// Tìm đêm diễn gần nhất SAU ngày hôm nay, và đếm số buổi diễn trong chính đêm đó.
//
// `danhSach` phải là mảng đã sắp TĂNG DẦN theo `start_date` (backend trả sẵn như vậy với
// sortBy='StartingSoon'). Hàm vẫn chạy đúng nếu mảng chưa sắp, vì nó duyệt hết để đếm; nhưng phần
// `.find` thì dựa vào thứ tự, nên nếu nguồn đổi cách sắp thì phải xem lại chỗ này.
//
// Trả về null khi không còn đêm nào sau hôm nay — đó là tín hiệu để trang chủ chuyển sang kiểu
// trạng thái trống LỚN (trang trống hẳn) thay vì dòng thông báo gọn.
export const timDemGanNhat = (danhSach, moc = dayjs()) => {
  const hetHomNay = dayjs(moc).endOf('day')
  const ds = Array.isArray(danhSach) ? danhSach : []

  // `isValid()` ở đây là phòng xa, KHÔNG phải điều kiện gánh việc: đã đo bằng dayjs hiện tại thì
  // isAfter() trả false cho mọi đầu vào hỏng ('khong-phai-ngay', null, ''), nên bỏ nó đi bộ kiểm
  // vẫn xanh. Giữ lại phòng khi dayjs đổi hành vi so sánh với Invalid Date.
  const ev = ds.find((e) => {
    const t = dayjs(e?.start_date)
    return t.isValid() && t.isAfter(hetHomNay)
  })
  if (!ev) return null

  const ngayDo = dayjs(ev.start_date)
  return {
    nhan: nhanNgay(ngayDo, moc),
    // Khác năm với mốc thì in đủ năm (như ngayTrongLich): "15/01" của năm sau dễ đọc thành tháng Một vừa qua.
    ngay: ngayDo.isSame(dayjs(moc), 'year') ? ngayGon(ngayDo) : ngayDayDu(ngayDo),
    // Đếm trong CHÍNH đêm đó. Con số này là DỒI DÀO (còn nhiều thứ để xem), không phải khan hiếm —
    // ranh giới đó là luật §9 của đặc tả trang chủ và có cổng máy canh (scripts/kiem-ap-luc.mjs).
    soBuoi: ds.filter((e) => {
      const t = dayjs(e?.start_date)
      return t.isValid() && t.isSame(ngayDo, 'day')
    }).length,
  }
}

// Các buổi diễn còn lại của CHÍNH ngày hôm nay.
//
// Mốc dưới không cần kiểm ở đây: backend đã lọc `ScheduledStart > now` khi dùng 'StartingSoon'.
// Nếu nguồn dữ liệu đổi sang cách sắp khác thì hàm này phải thêm mốc dưới, nếu không trang chủ sẽ
// hiện lại cả những buổi đã diễn xong sáng nay.
export const locDemNay = (danhSach, moc = dayjs()) => {
  const hetHomNay = dayjs(moc).endOf('day')
  const ds = Array.isArray(danhSach) ? danhSach : []
  return ds.filter((e) => {
    const t = dayjs(e?.start_date)
    return t.isValid() && t.isBefore(hetHomNay)
  })
}
