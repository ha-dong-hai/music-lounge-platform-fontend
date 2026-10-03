// node src/utils/rangBuocNgay.test.mjs
import assert from 'node:assert/strict'
import dayjs from 'dayjs'
import { chuanHoaKhoangLoc, loiLichBuoiDien, loiDoiLich, ngaySinhToiDa, loiNgaySinh, giaTriGioCucBo } from './rangBuocNgay.js'

const BN = dayjs('2026-10-03T15:30:00')

// --- /shows: khoảng ngày từ đường dẫn cũ (đo 03/10: ?tu=2026-09-01&den=2026-09-05 ra 0 buổi, không giải thích)
assert.deepEqual(chuanHoaKhoangLoc({ tu: '2026-09-01', den: '2026-09-05' }, BN), { tu: '', den: '' }, 'khoảng trọn trong quá khứ → bỏ')
assert.deepEqual(chuanHoaKhoangLoc({ tu: '2026-09-25', den: '2026-10-25' }, BN), { tu: '2026-10-03', den: '2026-10-25' }, 'cắt qua hôm nay → từ hôm nay')
assert.deepEqual(chuanHoaKhoangLoc({ tu: '2026-01-01', den: '' }, BN), { tu: '', den: '' }, 'chỉ có "từ" đã qua → bỏ')
assert.deepEqual(chuanHoaKhoangLoc({ tu: '', den: '2026-09-01' }, BN), { tu: '', den: '' }, 'chỉ có "đến" đã qua → bỏ')
assert.deepEqual(chuanHoaKhoangLoc({ tu: '2026-10-03', den: '2026-10-03' }, BN), { tu: '2026-10-03', den: '2026-10-03' }, 'HÔM NAY vẫn hợp lệ')
assert.deepEqual(chuanHoaKhoangLoc({ tu: '2026-10-22', den: '2026-10-25' }, BN), { tu: '2026-10-22', den: '2026-10-25' }, 'tương lai giữ nguyên')
assert.deepEqual(chuanHoaKhoangLoc({ tu: '', den: '' }, BN), { tu: '', den: '' })

// --- tạo / sửa buổi diễn
assert.deepEqual(loiLichBuoiDien({ batDau: '2026-10-22T20:00', ketThuc: '2026-10-22T22:00' }, BN), {}, 'hợp lệ')
assert.equal(loiLichBuoiDien({ batDau: '2026-09-01T20:00' }, BN).batDau, 'Giờ bắt đầu phải sau thời điểm hiện tại.')
assert.ok(loiLichBuoiDien({ batDau: '2026-10-03T15:30' }, BN).batDau, 'đúng bằng hiện tại cũng không được (backend: GreaterThan)')
assert.equal(loiLichBuoiDien({ batDau: '2026-10-22T20:00', ketThuc: '2026-10-22T19:00' }, BN).ketThuc, 'Giờ kết thúc phải sau giờ bắt đầu.')
assert.ok(loiLichBuoiDien({ batDau: '2026-10-22T20:00', ketThuc: '2026-10-22T20:00' }, BN).ketThuc, 'kết thúc = bắt đầu không được')
assert.deepEqual(loiLichBuoiDien({ batDau: '2026-10-22T20:00', ketThuc: '' }, BN), {}, 'kết thúc bỏ trống được (tuỳ chọn)')

// --- dời lịch
assert.equal(loiDoiLich('2026-09-01T20:00', '2026-10-22T13:00:00Z', BN), 'Giờ bắt đầu mới phải sau thời điểm hiện tại.')
assert.equal(loiDoiLich('2026-10-25T20:00', '2026-10-22T13:00:00Z', BN), null)
assert.equal(loiDoiLich(giaTriGioCucBo('2026-10-22T13:00:00Z'), '2026-10-22T13:00:00Z', BN), 'Giờ mới trùng giờ đang có — không cần dời.')
assert.equal(loiDoiLich('', null, BN), null)

// --- ngày sinh
assert.equal(ngaySinhToiDa(BN), '2026-10-02')
assert.equal(loiNgaySinh('2026-10-03', BN), 'Ngày sinh phải trước hôm nay.', 'hôm nay không được (backend: < hôm nay)')
assert.equal(loiNgaySinh('2030-01-01', BN), 'Ngày sinh phải trước hôm nay.')
assert.equal(loiNgaySinh('1998-05-20', BN), null)

console.log('rangBuocNgay: DAT')
