// node src/utils/boLocBuoiDien.test.mjs
import assert from 'node:assert/strict'
import dayjs from 'dayjs'
import { docBoLoc, ghiBoLoc, thamSoApi, boLocDangAp, khoangCuaMoc, loiKhoangGia, loiKhoangNgay, BO_LOC_RONG, CO_TRANG } from './boLocBuoiDien.js'

const doc = (s) => docBoLoc(new URLSearchParams(s))

// --- đọc: mặc định, giá trị hỏng bị bỏ, tương thích đường dẫn cũ
assert.deepEqual(doc(''), BO_LOC_RONG, 'địa chỉ trơn = bộ lọc rỗng')
assert.deepEqual(doc('the=1,abc,4,-2&tam=x&sap=LungTung&trang=0&ht=Khac&ngay=bua&tu=2026-13-99&giaTu=-5&giaDen=1.5'), { ...BO_LOC_RONG, the: [1, 4] }, 'giá trị hỏng bị bỏ, không ném lỗi')
assert.equal(doc('keyword=trinh').q, 'trinh', '?keyword= cũ vẫn đọc được')
assert.deepEqual(doc('genreId=3&the=3,5').the, [3, 5], '?genreId= cũ gộp vào, bỏ trùng')

// --- ghi rồi đọc lại phải ra đúng bộ lọc; bộ lọc rỗng ghi ra chuỗi rỗng
const b = { ...BO_LOC_RONG, q: 'nhạc trịnh', the: [4], tam: [1, 3], kg: [2], tp: 'TP.HCM', ht: 'Hybrid', tu: '2026-10-03', den: '2026-10-05', giaTu: 200000, giaDen: 500000, sap: 'PriceAsc', trang: 3 }
assert.deepEqual(docBoLoc(ghiBoLoc(b)), b, 'ghi → đọc là đồng nhất')
assert.equal(ghiBoLoc(BO_LOC_RONG).toString(), '', 'bộ lọc rỗng → địa chỉ trơn')
assert.equal(ghiBoLoc({ ...BO_LOC_RONG, ngay: 'cuoi-tuan', tu: '2026-10-03' }).has('tu'), false, 'đã chọn mốc nhanh thì không ghi khoảng ngày tay')

// --- mốc ngày: 30/09/2026 là thứ Tư
const thuTu = dayjs('2026-09-30T10:00:00')
const [ct0, ct1] = khoangCuaMoc('cuoi-tuan', thuTu)
assert.equal(ct0.format('YYYY-MM-DD'), '2026-10-02', 'cuối tuần bắt đầu thứ Sáu')
assert.equal(ct1.format('YYYY-MM-DD HH:mm'), '2026-10-04 23:59', 'cuối tuần kết thúc hết Chủ nhật')
const [cn0, cn1] = khoangCuaMoc('cuoi-tuan', dayjs('2026-10-04T15:00:00'))
assert.equal(cn0.format('YYYY-MM-DD'), '2026-10-04', 'đang là Chủ nhật: cuối tuần là hôm nay, không nhảy sang tuần sau')
assert.equal(cn1.format('YYYY-MM-DD'), '2026-10-04')
const [tb0] = khoangCuaMoc('cuoi-tuan', dayjs('2026-10-03T15:00:00'))
assert.equal(tb0.format('YYYY-MM-DD'), '2026-10-03', 'đang là thứ Bảy: không lùi về thứ Sáu đã qua')
assert.equal(khoangCuaMoc('ngay-mai', thuTu)[0].format('YYYY-MM-DD'), '2026-10-01')
assert.equal(khoangCuaMoc('7-ngay', thuTu)[1].format('YYYY-MM-DD'), '2026-10-07')
assert.equal(khoangCuaMoc('', thuTu), null)

// --- tham số API
const p = thamSoApi(b, thuTu)
assert.equal(p.pageSize, CO_TRANG)
assert.deepEqual([p.keyword, p.genreIds, p.moodIds, p.atmosphereIds, p.city, p.format, p.minPrice, p.maxPrice, p.sortBy, p.page],
  ['nhạc trịnh', [4], [1, 3], [2], 'TP.HCM', 'Hybrid', 200000, 500000, 'PriceAsc', 3])
assert.equal(dayjs(p.dateFrom).format('YYYY-MM-DD HH:mm'), '2026-10-03 00:00')
assert.equal(dayjs(p.dateTo).format('YYYY-MM-DD HH:mm'), '2026-10-05 23:59', 'ngày "đến" tính hết ngày')
assert.deepEqual(Object.keys(thamSoApi(BO_LOC_RONG)).sort(), ['includeSoldOut', 'page', 'pageSize', 'sortBy'], 'bộ lọc rỗng không gửi tham số thừa')

// --- khoảng vô lý: báo lỗi và KHÔNG gửi
const giaSai = { ...BO_LOC_RONG, giaTu: 500000, giaDen: 100000 }
assert.ok(loiKhoangGia(giaSai))
assert.equal('minPrice' in thamSoApi(giaSai) || 'maxPrice' in thamSoApi(giaSai), false, 'khoảng giá sai không được gửi lên máy chủ')
assert.equal(loiKhoangGia({ ...BO_LOC_RONG, giaTu: 100000, giaDen: 100000 }), null, 'bằng nhau là hợp lệ')
const ngaySai = { ...BO_LOC_RONG, tu: '2026-10-05', den: '2026-10-01' }
assert.ok(loiKhoangNgay(ngaySai))
assert.equal('dateFrom' in thamSoApi(ngaySai), false)

// --- nút gỡ
const dm = { genres: [{ id: 4, name: 'Bolero' }], moods: [{ id: 1, name: 'Hoài niệm' }], atmospheres: [] }
const ap = boLocDangAp(b, dm)
assert.deepEqual(ap.map((x) => x.nhan), ['“nhạc trịnh”', '03/10/2026 đến 05/10/2026', 'Bolero', 'Hoài niệm', 'mục đã gỡ', 'mục đã gỡ', 'Tại chỗ và trực tuyến', 'TP.HCM', '200.000đ đến 500.000đ'])
const sauGo = ap.find((x) => x.khoa === 'tam-3').go(b)
assert.deepEqual(sauGo.tam, [1], 'gỡ một mục chỉ bỏ đúng mục đó')
assert.equal(boLocDangAp(BO_LOC_RONG, dm).length, 0)
assert.equal(boLocDangAp({ ...BO_LOC_RONG, ngay: 'hom-nay' }, dm)[0].nhan, 'Hôm nay')

console.log('boLocBuoiDien: DAT')
