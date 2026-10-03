// Chạy: node src/utils/lichDien.test.mjs
//
// Hàm được kiểm ở đây quyết định trang chủ hiện KIỂU trạng thái trống nào khi đêm nay không có
// buổi diễn. Sai ở đây thì trang không vỡ — nó chỉ nói sai ngày, hoặc hiện cái hộp lớn giữa trang
// trong khi lẽ ra chỉ cần một dòng. Đúng loại lỗi không ai thấy cho tới khi người dùng tới nhầm hôm.
import dayjs from 'dayjs'
import 'dayjs/locale/vi.js'  // .js tường minh: node chạy ESM thuần không tự thêm đuôi như Vite
import { timDemGanNhat, locDemNay } from './lichDien.js'

dayjs.locale('vi')

let dat = 0
let hong = 0
const kiem = (ten, thuc, mong) => {
  const a = JSON.stringify(thuc)
  const b = JSON.stringify(mong)
  if (a === b) { dat++; return }
  hong++
  console.error(`  ✖ ${ten}\n      nhận: ${a}\n      mong: ${b}`)
}

// Mốc: 23/09/2026 lúc 10:00, là thứ Tư.
const moc = dayjs('2026-09-23T10:00:00')
const buoi = (iso) => ({ id: iso, start_date: iso })

// --- timDemGanNhat ---

kiem('mảng rỗng -> null', timDemGanNhat([], moc), null)

kiem('chỉ có buổi TỐI NAY -> null (đêm nay không phải "đêm sắp tới")',
  timDemGanNhat([buoi('2026-09-23T21:00:00')], moc), null)

kiem('buổi 23:59 hôm nay vẫn KHÔNG tính là đêm sắp tới',
  timDemGanNhat([buoi('2026-09-23T23:59:00')], moc), null)

kiem('buổi 00:01 ngày mai LÀ đêm gần nhất',
  timDemGanNhat([buoi('2026-09-24T00:01:00')], moc),
  { nhan: 'Ngày mai', ngay: '24/09', soBuoi: 1 })

kiem('bỏ qua buổi tối nay, lấy buổi ngày mai',
  timDemGanNhat([buoi('2026-09-23T21:00:00'), buoi('2026-09-24T20:00:00')], moc),
  { nhan: 'Ngày mai', ngay: '24/09', soBuoi: 1 })

kiem('đếm ĐÚNG số buổi trong chính đêm gần nhất, không đếm đêm sau',
  timDemGanNhat([
    buoi('2026-09-25T19:00:00'),
    buoi('2026-09-25T21:00:00'),
    buoi('2026-09-25T23:00:00'),
    buoi('2026-09-26T20:00:00'),
  ], moc),
  { nhan: 'Thứ sáu', ngay: '25/09', soBuoi: 3 })

kiem('không đếm nhầm buổi TỐI NAY vào đêm gần nhất',
  timDemGanNhat([buoi('2026-09-23T21:00:00'), buoi('2026-09-24T20:00:00')], moc),
  { nhan: 'Ngày mai', ngay: '24/09', soBuoi: 1 })

kiem('qua tháng: 30/09 -> 01/10',
  timDemGanNhat([buoi('2026-10-01T20:00:00')], dayjs('2026-09-30T10:00:00')),
  { nhan: 'Ngày mai', ngay: '01/10', soBuoi: 1 })

// 03/10/2026: hộp đèn in "Đêm gần nhất có diễn: Thứ năm" cho buổi 22/10 (19 ngày nữa) — dễ đọc thành thứ năm tuần này.
// Nay hộp đèn in cả ngày; khác năm thì ngày có năm ("15/01" của năm sau đọc thành tháng Một vừa qua).
kiem('đêm gần nhất ở NĂM SAU: ngày có năm',
  timDemGanNhat([buoi('2027-01-15T20:00:00')], dayjs('2026-12-20T10:00:00')),
  { nhan: 'Thứ sáu', ngay: '15/01/2027', soBuoi: 1 })

// LƯU Ý VỀ CA NÀY: nó chứng minh hàm KHÔNG VỠ khi gặp ngày rác, nhưng KHÔNG chứng minh được
// guard `isValid()` trong `.find` là cần thiết — đã đo: dayjs trả isAfter()=false cho mọi đầu vào
// hỏng ('khong-phai-ngay', null, ''), nên bỏ guard đi bộ kiểm vẫn xanh. Guard giữ lại để phòng
// dayjs đổi hành vi, không phải vì ca kiểm này ép.
kiem('ngày rác không làm vỡ hàm',
  timDemGanNhat([buoi('khong-phai-ngay'), buoi('2026-09-24T20:00:00')], moc),
  { nhan: 'Ngày mai', ngay: '24/09', soBuoi: 1 })

kiem('đầu vào không phải mảng -> null', timDemGanNhat(null, moc), null)
kiem('đầu vào undefined -> null', timDemGanNhat(undefined, moc), null)

// --- locDemNay ---

kiem('lọc đêm nay: lấy buổi tối nay',
  locDemNay([buoi('2026-09-23T21:00:00'), buoi('2026-09-24T20:00:00')], moc).map((e) => e.id),
  ['2026-09-23T21:00:00'])

kiem('lọc đêm nay: 23:59 hôm nay VẪN thuộc đêm nay',
  locDemNay([buoi('2026-09-23T23:59:00')], moc).map((e) => e.id),
  ['2026-09-23T23:59:00'])

kiem('lọc đêm nay: 00:01 ngày mai KHÔNG thuộc đêm nay',
  locDemNay([buoi('2026-09-24T00:01:00')], moc).map((e) => e.id), [])

kiem('lọc đêm nay: mảng rỗng', locDemNay([], moc), [])
kiem('lọc đêm nay: đầu vào không phải mảng', locDemNay(null, moc), [])

// Hai hàm phải KHÔNG BAO GIỜ cùng nhận một buổi diễn — nếu không, trang sẽ hiện nó hai lần
// (một lần ở "đêm nay", một lần ở "đêm gần nhất").
const hon_hop = [
  buoi('2026-09-23T21:00:00'),
  buoi('2026-09-23T23:59:00'),
  buoi('2026-09-24T00:01:00'),
  buoi('2026-09-25T20:00:00'),
]
const demNay = new Set(locDemNay(hon_hop, moc).map((e) => e.id))
const ganNhat = timDemGanNhat(hon_hop, moc)
kiem('đêm nay và đêm gần nhất không chồng lấn',
  ganNhat && demNay.has('2026-09-24T00:01:00'), false)
kiem('đêm gần nhất đúng là 24/09', ganNhat, { nhan: 'Ngày mai', ngay: '24/09', soBuoi: 1 })

console.log(`\n${dat} đạt, ${hong} hỏng`)
process.exit(hong > 0 ? 1 : 0)
