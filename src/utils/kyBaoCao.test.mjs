import assert from 'node:assert/strict'
import dayjs from 'dayjs'
import { tinhKhoang, khoangHopLe, khoaDinhSanKhop, kyTruoc, thamSoApi, nhanKhoang, phanTramDoi, cauSoVoiKyTruoc, soNgayCua } from './kyBaoCao.js'

const H = dayjs('2026-10-04')
let dat = 0
const ca = (fn) => { fn(); dat++ }

ca(() => assert.deepEqual(tinhKhoang('7n', H), { tu: '2026-09-28', den: '2026-10-04' }))
ca(() => assert.deepEqual(tinhKhoang('30n', H), { tu: '2026-09-05', den: '2026-10-04' }))
ca(() => assert.deepEqual(tinhKhoang('thang', H), { tu: '2026-10-01', den: '2026-10-04' }))
ca(() => assert.deepEqual(tinhKhoang('thangTruoc', H), { tu: '2026-09-01', den: '2026-09-30' }))
ca(() => assert.deepEqual(tinhKhoang('quy', H), { tu: '2026-10-01', den: '2026-10-04' }))
ca(() => assert.deepEqual(tinhKhoang('quy', dayjs('2026-08-15')), { tu: '2026-07-01', den: '2026-08-15' }))
ca(() => assert.deepEqual(tinhKhoang('nam', H), { tu: '2026-01-01', den: '2026-10-04' }))
ca(() => assert.deepEqual(tinhKhoang('12t', H), { tu: '2025-11-01', den: '2026-10-04' }))
ca(() => assert.deepEqual(tinhKhoang('la', H), tinhKhoang('30n', H)))           // khoá lạ → mặc định
ca(() => assert.equal(khoangHopLe('2026-10-05', '2026-10-01', H), null))       // ngược
ca(() => assert.equal(khoangHopLe('2026-10-01', '2026-10-09', H), null))       // vượt hôm nay
ca(() => assert.equal(khoangHopLe('abc', '2026-10-01', H), null))
ca(() => assert.equal(khoangHopLe(null, '2026-10-01', H), null))
ca(() => assert.deepEqual(khoangHopLe('2026-09-01', '2026-09-30', H), { tu: '2026-09-01', den: '2026-09-30' }))
ca(() => assert.equal(khoaDinhSanKhop('2026-09-01', '2026-09-30', H), 'thangTruoc'))
ca(() => assert.equal(khoaDinhSanKhop('2026-09-02', '2026-09-30', H), null))
ca(() => assert.equal(soNgayCua('2026-09-01', '2026-09-30'), 30))
ca(() => assert.deepEqual(kyTruoc('2026-09-01', '2026-09-30'), { tu: '2026-08-02', den: '2026-08-31' }))   // cùng 30 ngày
ca(() => assert.deepEqual(kyTruoc('2026-10-04', '2026-10-04'), { tu: '2026-10-03', den: '2026-10-03' }))
ca(() => assert.deepEqual(thamSoApi('2026-09-01', '2026-09-30'), { from: '2026-09-01T00:00:00+07:00', to: '2026-09-30T23:59:59.999+07:00' }))
ca(() => assert.equal(nhanKhoang('2026-09-01', '2026-09-30'), '01/09 – 30/09/2026'))
ca(() => assert.equal(nhanKhoang('2025-11-01', '2026-10-04'), '01/11/2025 – 04/10/2026'))
ca(() => assert.equal(nhanKhoang('2026-10-04', '2026-10-04'), '04/10/2026'))
ca(() => assert.equal(phanTramDoi(150, 100), 50))
ca(() => assert.equal(phanTramDoi(50, 100), -50))
ca(() => assert.equal(phanTramDoi(10, 0), null))
ca(() => assert.equal(cauSoVoiKyTruoc(150, 100), 'Tăng 50% so với kỳ trước'))
ca(() => assert.equal(cauSoVoiKyTruoc(75, 100), 'Giảm 25% so với kỳ trước'))
ca(() => assert.equal(cauSoVoiKyTruoc(10, 0), 'Kỳ trước chưa có'))
ca(() => assert.equal(cauSoVoiKyTruoc(0, 0), 'Kỳ trước cũng chưa có'))
ca(() => assert.equal(cauSoVoiKyTruoc(100, 100), 'Bằng kỳ trước'))
console.log(`kyBaoCao: ${dat}/31 đạt`)
