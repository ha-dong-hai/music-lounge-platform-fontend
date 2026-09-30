// src/utils/ngayVietNam.js
//
// NGÀY THÁNG VIẾT KIỂU VIỆT — một nguồn duy nhất.
//
// VÌ SAO TÁCH RA: măng sét và khối "những đêm sắp tới" đều phải in tên thứ viết hoa. Viết lần hai
// nghĩa là có hai chỗ để lệch nhau. Đặc tả §10 (chữ và định dạng tiếng Việt) chỉ đúng được nếu nó
// có đúng một chỗ để thi hành.
//
// dayjs đã nạp locale 'vi' toàn cục ở src/main.jsx, nên `format('dddd')` trả "thứ ba", "chủ nhật".
import dayjs from 'dayjs'

// "thứ ba" -> "Thứ ba". CSS `capitalize` KHÔNG làm được việc này cho đúng: nó viết hoa chữ cái đầu
// của MỌI TỪ, ra "Thứ Ba" — sai chính tả tiếng Việt, vì tên thứ không phải danh từ riêng.
export const thuVietHoa = (d) => {
  const thu = dayjs(d).format('dddd')
  return thu.charAt(0).toUpperCase() + thu.slice(1)
}

// Nhãn cho một ngày trong danh sách đêm sắp tới.
//
// "Hôm nay"/"Ngày mai" là cách người ta thật sự nói, và quan trọng hơn: nó trả lời thẳng câu hỏi
// người dùng đang có ("tôi có kịp đi không"), trong khi "Thứ Tư" bắt họ tự tính. Xa hơn hai ngày
// thì tên thứ lại có ích hơn, vì lúc đó người ta nghĩ theo lịch tuần ("cuối tuần này").
//
// `moc` tách ra thành tham số để kiểm được — hàm phụ thuộc đồng hồ hệ thống thì không viết test
// cho mốc chuyển ngày/chuyển tháng được.
export const nhanNgay = (d, moc = dayjs()) => {
  const ngay = dayjs(d)
  const goc = dayjs(moc)
  if (ngay.isSame(goc, 'day')) return 'Hôm nay'
  if (ngay.isSame(goc.add(1, 'day'), 'day')) return 'Ngày mai'
  return thuVietHoa(ngay)
}

// Giờ trong ngày, 24h kiểu Việt. Không dùng AM/PM: một đêm nhạc bắt đầu "21:00", không ai nói
// "9 giờ tối PM". Tách ra hàm riêng để cổng `kiem-ngay` chặn được việc gọi thẳng dayjs().format()
// rải rác trong component — hai chỗ định dạng khác nhau thì trang tự mâu thuẫn với chính nó.
export const gioTrongNgay = (d) => dayjs(d).format('HH:mm')

// Ngày đầy đủ: NGÀY/THÁNG/NĂM.
export const ngayDayDu = (d) => dayjs(d).format('DD/MM/YYYY')

// Khoá ngày dùng để GOM NHÓM, không phải để hiển thị. Định dạng ISO vì nó sắp được bằng so sánh
// chuỗi — đó là lý do duy nhất dùng thứ tự năm-tháng-ngày ở một sản phẩm tiếng Việt.
export const khoaNgay = (d) => dayjs(d).format('YYYY-MM-DD')

// Ngày viết gọn kiểu Việt: NGÀY/THÁNG. Không dùng MM/DD của Mỹ — 03/09 mà đọc nhầm thành 9 tháng 3
// thì người ta lỡ đêm diễn.
export const ngayGon = (d) => dayjs(d).format('DD/MM')

// Ngày của một dòng trong lịch diễn: "Ngày mai 01/10", "Thứ sáu 09/10". Khác năm với mốc thì in đủ NGÀY/THÁNG/NĂM —
// "09/01" của năm sau mà không ghi năm sẽ bị đọc thành tháng Một vừa qua.
export const ngayTrongLich = (d, moc = dayjs()) =>
  dayjs(d).isSame(dayjs(moc), 'year') ? `${nhanNgay(d, moc)} ${ngayGon(d)}` : ngayDayDu(d)
