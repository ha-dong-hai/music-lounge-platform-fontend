// src/utils/rangBuocNgay.js
//
// RÀNG BUỘC NGÀY GIỜ PHÍA WEB — một nguồn duy nhất (03/10/2026).
//
// VÌ SAO: rà soát 03/10 (chủ dự án: "rà soát kĩ các ràng buộc trên fe — sao cái filter lại cho ngày quá khứ") đo trên
// trình duyệt, mọi yêu cầu ghi bị chặn tại trình duyệt:
//   - /shows nhận đường dẫn cũ ?tu=2026-09-01&den=2026-09-05 → nút ghi "01/09 – 05/09", 0 buổi, không một lời giải thích.
//   - Tạo buổi diễn: bắt đầu 01/09 (đã qua), kết thúc TRƯỚC bắt đầu → web vẫn gửi POST /lounge-shows.
//   - Dời lịch sang giờ đã qua → web vẫn gửi POST /reschedule.
//   - Tài chính: "Từ 20/10" > "Đến 01/10" → không báo gì.
//   - Ngày sinh CCCD chọn được ngày tương lai.
// Backend có chặn (CreateLoungeShowCommandValidator: ScheduledStart > UtcNow, ScheduledEnd > ScheduledStart;
// RescheduleLoungeShowCommandValidator: NewScheduledStart > UtcNow; SubmitCitizenCardCommandValidator: DateOfBirth <
// hôm nay), nhưng người dùng chỉ biết SAU khi bấm gửi. Web kiểm TRƯỚC, cùng luật với backend — không thêm luật mới.
//
// `bayGio` là tham số để test được mốc chuyển ngày (hàm đọc đồng hồ hệ thống thì không test được).
import dayjs from 'dayjs'

// Định dạng giá trị cho <input type="datetime-local"> (giờ máy người dùng, không múi giờ). Không phải chuỗi hiển thị.
export const giaTriGioCucBo = (d) => dayjs(d).format('YYYY-MM-DDTHH:mm')
const khoa = (d) => dayjs(d).format('YYYY-MM-DD')

// /shows: khoảng ngày đọc từ địa chỉ. Danh sách chỉ có buổi SẮP diễn, nên phần đã qua của khoảng là vô nghĩa:
// khoảng nằm trọn trong quá khứ → bỏ; khoảng cắt qua hôm nay → bắt đầu từ hôm nay; chỉ có "từ" đã qua → bỏ.
export const chuanHoaKhoangLoc = ({ tu, den }, bayGio = dayjs()) => {
  const homNay = khoa(bayGio)
  if (den && den < homNay) return { tu: '', den: '' }
  if (tu && tu < homNay) return { tu: den ? homNay : '', den }
  return { tu, den }
}

// Tạo / sửa buổi diễn. Trả { batDau?, ketThuc? } — rỗng là hợp lệ. Câu lỗi tiếng Việt, cùng luật với backend.
export const loiLichBuoiDien = ({ batDau, ketThuc }, bayGio = dayjs()) => {
  const loi = {}
  if (batDau && !dayjs(batDau).isAfter(bayGio)) loi.batDau = 'Giờ bắt đầu phải sau thời điểm hiện tại.'
  if (batDau && ketThuc && !dayjs(ketThuc).isAfter(dayjs(batDau))) loi.ketThuc = 'Giờ kết thúc phải sau giờ bắt đầu.'
  return loi
}

// Dời lịch: giờ mới phải sau hiện tại, và phải khác giờ đang có (dời sang đúng giờ cũ là báo động giả cho người đã mua vé).
export const loiDoiLich = (gioMoi, gioHienTai, bayGio = dayjs()) => {
  if (!gioMoi) return null
  if (!dayjs(gioMoi).isAfter(bayGio)) return 'Giờ bắt đầu mới phải sau thời điểm hiện tại.'
  if (gioHienTai && dayjs(gioMoi).isSame(dayjs(gioHienTai), 'minute')) return 'Giờ mới trùng giờ đang có — không cần dời.'
  return null
}

// Ngày sinh: phải TRƯỚC hôm nay (SubmitCitizenCardCommandValidator). `max` cho ô ngày = hôm qua.
export const ngaySinhToiDa = (bayGio = dayjs()) => khoa(dayjs(bayGio).subtract(1, 'day'))
export const loiNgaySinh = (ngay, bayGio = dayjs()) => (ngay && ngay > ngaySinhToiDa(bayGio) ? 'Ngày sinh phải trước hôm nay.' : null)
