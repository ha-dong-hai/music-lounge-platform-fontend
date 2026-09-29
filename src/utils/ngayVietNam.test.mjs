// Chạy: node src/utils/ngayVietNam.test.mjs
//
// Kiểm hàm nhãn ngày. Mốc chuyển ngày và chuyển tháng là chỗ loại hàm này hỏng âm thầm: nó vẫn trả
// về một chuỗi trông hợp lý, chỉ là sai ngày — và người dùng phát hiện bằng cách tới nhầm hôm.
import dayjs from 'dayjs'
import 'dayjs/locale/vi.js'  // .js tường minh: node chạy ESM thuần không tự thêm đuôi như Vite
import { thuVietHoa, nhanNgay, ngayGon, gioTrongNgay, ngayDayDu, khoaNgay } from './ngayVietNam.js'

dayjs.locale('vi')

let dat = 0
let hong = 0
const kiem = (ten, thuc, mong) => {
  if (thuc === mong) { dat++; return }
  hong++
  console.error(`  ✖ ${ten}\n      nhận: ${JSON.stringify(thuc)}\n      mong: ${JSON.stringify(mong)}`)
}

// 2026-09-23 là thứ Tư.
const moc = dayjs('2026-09-23T10:00:00')

kiem('cùng ngày -> Hôm nay', nhanNgay('2026-09-23T21:00:00', moc), 'Hôm nay')
kiem('cùng ngày, sát nửa đêm', nhanNgay('2026-09-23T23:59:00', moc), 'Hôm nay')
kiem('hôm sau -> Ngày mai', nhanNgay('2026-09-24T09:00:00', moc), 'Ngày mai')
kiem('hôm sau, sát 00:01', nhanNgay('2026-09-24T00:01:00', moc), 'Ngày mai')
kiem('hai hôm sau -> tên thứ', nhanNgay('2026-09-25T20:00:00', moc), 'Thứ sáu')
kiem('chủ nhật', nhanNgay('2026-09-27T20:00:00', moc), 'Chủ nhật')

// Chuyển tháng: 30/09 -> 01/10. Đây là chỗ phép so sánh theo số ngày trong tháng sẽ sai.
const cuoiThang = dayjs('2026-09-30T10:00:00')
kiem('qua tháng vẫn là Ngày mai', nhanNgay('2026-10-01T20:00:00', cuoiThang), 'Ngày mai')
kiem('qua tháng, cùng ngày', nhanNgay('2026-09-30T23:00:00', cuoiThang), 'Hôm nay')

// Chuyển năm.
const cuoiNam = dayjs('2026-12-31T10:00:00')
kiem('qua năm vẫn là Ngày mai', nhanNgay('2027-01-01T20:00:00', cuoiNam), 'Ngày mai')

// Ngày HÔM QUA không được gọi là Hôm nay/Ngày mai.
kiem('hôm qua -> tên thứ', nhanNgay('2026-09-22T20:00:00', moc), 'Thứ ba')

kiem('thuVietHoa viết hoa đúng một chữ', thuVietHoa('2026-09-23'), 'Thứ tư')
kiem('ngayGon là NGÀY/THÁNG', ngayGon('2026-09-03'), '03/09')
kiem('ngayGon không đảo thành MM/DD', ngayGon('2026-12-01'), '01/12')

kiem('gioTrongNgay là 24h', gioTrongNgay('2026-09-23T21:05:00'), '21:05')
kiem('gioTrongNgay không dùng AM/PM cho giờ chiều', gioTrongNgay('2026-09-23T13:00:00'), '13:00')
kiem('gioTrongNgay nửa đêm là 00:00', gioTrongNgay('2026-09-23T00:00:00'), '00:00')
kiem('ngayDayDu là NGÀY/THÁNG/NĂM', ngayDayDu('2026-09-03'), '03/09/2026')
kiem('ngayDayDu không đảo thành MM/DD', ngayDayDu('2026-12-01'), '01/12/2026')
kiem('khoaNgay là ISO để sắp được bằng chuỗi', khoaNgay('2026-09-03T21:00:00'), '2026-09-03')
// `kiem` ở file này so sánh bằng ===, nên hai MẢNG khác tham chiếu không bao giờ bằng nhau dù nội
// dung giống hệt. Nối thành chuỗi để so sánh đúng thứ nó đo được.
kiem('khoaNgay sắp đúng thứ tự bằng so sánh chuỗi',
  [khoaNgay('2026-10-01'), khoaNgay('2026-09-30')].sort().join('|'),
  '2026-09-30|2026-10-01')

console.log(`\n${dat} đạt, ${hong} hỏng`)
process.exit(hong > 0 ? 1 : 0)
