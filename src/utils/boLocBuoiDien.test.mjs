// node src/utils/boLocBuoiDien.test.mjs
import assert from 'node:assert/strict'
import dayjs from 'dayjs'
import 'dayjs/locale/vi.js'  // trên web main.jsx nạp sẵn; node chạy test thì phải nạp tay
import { docBoLoc, ghiBoLoc, thamSoApi, boLocDangAp, khoangCuaMoc, loiKhoangGia, loiKhoangNgay, demLuaChon, buocChonNgay, nhanKhoangNgay, BO_LOC_RONG, CO_TRANG } from './boLocBuoiDien.js'

dayjs.locale('vi')
const doc = (s) => docBoLoc(new URLSearchParams(s))
// Mã danh mục là GUID từ MLACP-516 (đúng dạng Azure trả). Bản trước kiểm bằng số nguyên 1, 4… nên XANH trong khi trên
// web thật bộ lọc dòng nhạc/tâm trạng/không gian không chạy: parseInt('00000000-03ed-…') = 0 → bị bỏ (đo 03/10/2026).
const G1 = '00000000-03e9-81b5-8b05-0000000003e9', G3 = '00000000-03eb-81b5-8b05-0000000003eb'
const G4 = '00000000-03ec-81b5-8b05-0000000003ec', G5 = '00000000-03ed-81b5-8b05-0000000003ed'
const M1 = '00000000-0001-8e3f-9a1c-000000000001', M3 = '00000000-0003-8e3f-9a1c-000000000003', K2 = '00000000-0002-8f00-9b2d-000000000002'

// --- mã GUID thật (Acoustic trên Azure 03/10) phải đọc được
assert.deepEqual(doc(`the=${G5}`).the, [G5], 'GUID thật của Azure đọc được')
assert.deepEqual(doc(`the=${G5.toUpperCase()}`).the, [G5], 'GUID viết hoa (sửa tay) vẫn nhận, đưa về chữ thường')

// --- đọc: mặc định, giá trị hỏng bị bỏ, tương thích đường dẫn cũ
assert.deepEqual(doc(''), BO_LOC_RONG, 'địa chỉ trơn = bộ lọc rỗng')
assert.deepEqual(doc(`the=${G1},abc,${G4},-2,7&tam=x&sap=LungTung&trang=0&ht=Khac&ngay=bua&tu=2026-13-99&giaTu=-5&giaDen=1.5`), { ...BO_LOC_RONG, the: [G1, G4] }, 'giá trị hỏng (kể cả số nguyên kiểu cũ) bị bỏ, không ném lỗi')
assert.equal(doc('keyword=trinh').q, 'trinh', '?keyword= cũ vẫn đọc được')
assert.deepEqual(doc(`genreId=${G3}&the=${G3},${G5}`).the, [G3, G5], '?genreId= cũ gộp vào, bỏ trùng')

// --- ghi rồi đọc lại phải ra đúng bộ lọc; bộ lọc rỗng ghi ra chuỗi rỗng
const b = { ...BO_LOC_RONG, q: 'nhạc trịnh', the: [G4], tam: [M1, M3], kg: [K2], tp: 'TP.HCM', ht: 'Hybrid', tu: '2026-10-03', den: '2026-10-05', giaTu: 200000, giaDen: 500000, sap: 'PriceAsc', trang: 3 }
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
  ['nhạc trịnh', [G4], [M1, M3], [K2], 'TP.HCM', 'Hybrid', 200000, 500000, 'PriceAsc', 3])
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
const dm = { genres: [{ id: G4, name: 'Bolero' }], moods: [{ id: M1, name: 'Hoài niệm' }], atmospheres: [] }
const ap = boLocDangAp(b, dm)
assert.deepEqual(ap.map((x) => x.nhan), ['“nhạc trịnh”', '03/10/2026 đến 05/10/2026', 'Bolero', 'Hoài niệm', 'mục đã gỡ', 'mục đã gỡ', 'Tại chỗ và trực tuyến', 'TP.HCM', '200.000đ đến 500.000đ'])
const sauGo = ap.find((x) => x.khoa === `tam-${M3}`).go(b)
assert.deepEqual(sauGo.tam, [M1], 'gỡ một mục chỉ bỏ đúng mục đó')
assert.equal(boLocDangAp(BO_LOC_RONG, dm).length, 0)
assert.equal(boLocDangAp({ ...BO_LOC_RONG, ngay: 'hom-nay' }, dm)[0].nhan, 'Hôm nay')

// --- đếm số buổi từng lựa chọn (thanh lọc ngang, 03/10/2026). Mốc: thứ Tư 30/09/2026.
const ds3 = [
  { id: 'a', scheduledStart: '2026-10-02T13:00:00Z', format: 'Offline', loungeCity: 'TP.HCM', genres: [{ id: G4.toUpperCase() }, { id: G1 }] }, // thứ Sáu
  { id: 'b', scheduledStart: '2026-10-20T13:00:00Z', format: 'Offline', loungeCity: 'TP.HCM', genres: [{ id: G4 }] },
  { id: 'c', scheduledStart: '2026-10-03T13:00:00Z', format: 'Hybrid', loungeCity: 'Hà Nội', genres: [{ id: G5 }] }, // thứ Bảy
]
const d0 = demLuaChon(ds3, BO_LOC_RONG, thuTu)
assert.equal(d0.chinhXac, true)
assert.deepEqual([d0.ngay[''], d0.ngay['cuoi-tuan'], d0.ngay['7-ngay'], d0.ngay['hom-nay']], [3, 2, 2, 0], 'đếm theo mốc ngày')
assert.deepEqual([d0.the[G4], d0.the[G1], d0.the[G5]], [2, 1, 1], 'đếm theo dòng nhạc, GUID viết hoa vẫn khớp')
assert.equal(d0.coTrongSan.has(G3), false, 'dòng nhạc không có buổi nào → không có trong sàn (giao diện làm mờ)')
assert.deepEqual([d0.ht.Offline, d0.ht.Hybrid, d0.ht.Online], [2, 1, 0])
assert.deepEqual(d0.tp, { 'TP.HCM': 2, 'Hà Nội': 1 })
// Số của MỘT nhóm tính cùng bộ lọc của nhóm KHÁC: đang chọn cuối tuần → Bolero (G4) còn 1 (buổi b ngày 20/10 rớt)
const d1 = demLuaChon(ds3, { ...BO_LOC_RONG, ngay: 'cuoi-tuan' }, thuTu)
assert.equal(d1.the[G4], 1, 'đếm dòng nhạc tính cả bộ lọc ngày đang áp')
assert.equal(d1.ngay[''], 3, '"mọi ngày" bỏ qua bộ lọc ngày')
assert.deepEqual([...d1.ngayCoDien].sort(), ['2026-10-02', '2026-10-03', '2026-10-20'], 'chấm lịch bỏ qua chính bộ lọc ngày (để còn thấy ngày khác)')
assert.deepEqual([...demLuaChon(ds3, { ...BO_LOC_RONG, the: [G5] }, thuTu).ngayCoDien], ['2026-10-03'], 'chấm lịch tính bộ lọc nhóm khác')
// ... nhưng KHÔNG tự lọc theo chính nhóm của nó: đang chọn G5, số của G4 vẫn là 2
assert.equal(demLuaChon(ds3, { ...BO_LOC_RONG, the: [G5] }, thuTu).the[G4], 2)
assert.equal(demLuaChon(ds3, { ...BO_LOC_RONG, the: [G5] }, thuTu).ht.Offline, 0, 'nhóm khác thì tính dòng nhạc đang chọn')
// Lọc theo thứ trình duyệt không tự tính được → không chính xác (giao diện ẩn số)
for (const x of [{ q: 'bolero' }, { giaTu: 100000 }, { tam: [M1] }, { kg: [K2] }]) assert.equal(demLuaChon(ds3, { ...BO_LOC_RONG, ...x }, thuTu).chinhXac, false)

console.log('boLocBuoiDien: DAT')

// --- MỘT Ô LỊCH: bấm 1 = một ngày, bấm 2 = khoảng, bấm 3 = bắt đầu lại, bấm lại ngày đang chọn = bỏ
const R0 = { tu: '', den: '' }
const b1 = buocChonNgay(R0, '2026-10-22')
assert.deepEqual(b1, { tu: '2026-10-22', den: '2026-10-22' }, 'bấm một ngày = chọn đúng ngày đó')
assert.deepEqual(buocChonNgay(b1, '2026-10-25'), { tu: '2026-10-22', den: '2026-10-25' }, 'bấm ngày sau = khoảng')
assert.deepEqual(buocChonNgay(b1, '2026-10-20'), { tu: '2026-10-20', den: '2026-10-22' }, 'bấm ngày trước = khoảng, tự xếp ngày sớm trước')
assert.deepEqual(buocChonNgay({ tu: '2026-10-22', den: '2026-10-25' }, '2026-10-28'), { tu: '2026-10-28', den: '2026-10-28' }, 'đã có khoảng thì bấm tiếp = bắt đầu lại, KHÔNG kéo dài')
assert.deepEqual(buocChonNgay(b1, '2026-10-22'), R0, 'bấm lại ngày đang chọn = bỏ')
assert.deepEqual(buocChonNgay({ tu: '2026-10-22', den: '' }, '2026-10-25'), { tu: '2026-10-25', den: '2026-10-25' }, 'địa chỉ cũ chỉ có "từ": bấm = bắt đầu lại')
const BN = dayjs('2026-10-03T10:00:00')
assert.equal(nhanKhoangNgay({ tu: '2026-10-22', den: '2026-10-22' }, BN), 'Thứ năm 22/10', 'một ngày: thứ + ngày')
assert.equal(nhanKhoangNgay({ tu: '2026-10-22', den: '2026-10-25' }, BN), '22/10 – 25/10', 'khoảng gọn')
assert.equal(nhanKhoangNgay({ tu: '2026-12-30', den: '2027-01-02' }, BN), '30/12 – 02/01/2027', 'sang năm khác thì in năm')
assert.equal(nhanKhoangNgay(R0, BN), '', 'chưa chọn = rỗng')
assert.equal(boLocDangAp({ ...BO_LOC_RONG, tu: '2026-10-22', den: '2026-10-22' })[0].nhan, 'Ngày 22/10/2026', 'nhãn gỡ cho một ngày không lặp "X đến X"')

console.log('chonNgay OK')
