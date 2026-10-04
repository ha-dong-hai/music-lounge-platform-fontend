import assert from 'node:assert/strict'
import dayjs from 'dayjs'
import { trangThaiCho } from './thoiGianCho.js'

const B = dayjs('2026-10-04T12:00:00+07:00')
let dat = 0
const ca = (fn) => { fn(); dat++ }

ca(() => assert.deepEqual(trangThaiCho('2026-10-01T12:00:00+07:00', null, B), { quaHan: false, chu: 'Đã chờ 3 ngày' }))
ca(() => assert.deepEqual(trangThaiCho('2026-10-04T07:00:00+07:00', null, B), { quaHan: false, chu: 'Đã chờ 5 giờ' }))
ca(() => assert.deepEqual(trangThaiCho('2026-10-03T12:00:00+07:00', null, B), { quaHan: false, chu: 'Đã chờ một ngày' }))
// còn trong hạn → vẫn ghi tuổi, không báo quá hạn
ca(() => assert.deepEqual(trangThaiCho('2026-10-03T12:00:00+07:00', '2026-10-05T12:00:00+07:00', B), { quaHan: false, chu: 'Đã chờ một ngày' }))
// quá hạn → ghi quá hạn bao lâu (tính từ HẠN, không từ lúc nộp)
ca(() => assert.deepEqual(trangThaiCho('2026-09-30T12:00:00+07:00', '2026-10-02T12:00:00+07:00', B), { quaHan: true, chu: 'Quá hạn 2 ngày' }))
ca(() => assert.equal(trangThaiCho(null, null, B), null))
ca(() => assert.equal(trangThaiCho('khong-phai-ngay', null, B), null))
// hạn không hợp lệ → coi như không có hạn
ca(() => assert.deepEqual(trangThaiCho('2026-10-01T12:00:00+07:00', 'abc', B), { quaHan: false, chu: 'Đã chờ 3 ngày' }))
console.log(`thoiGianCho: ${dat}/8 đạt`)
