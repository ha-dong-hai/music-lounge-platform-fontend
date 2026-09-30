// node src/utils/lichPhongTra.test.mjs
import assert from 'node:assert/strict'
import { chiaLichPhongTra, catLich, SO_BUOI_HIEN, NGUONG_KHONG_CAT } from './lichPhongTra.js'

const b = (id, status, scheduledStart) => ({ id, status, scheduledStart })
const ds = [
  b(1, 'Published', '2026-10-09T13:00:00+00:00'),
  b(2, 'Pending', '2026-10-02T13:00:00+00:00'),
  b(3, 'Published', '2026-10-01T13:00:00+00:00'),
  b(4, 'Ended', '2026-09-20T13:00:00+00:00'),
  b(5, 'Ongoing', '2026-10-05T13:00:00+00:00'),
  b(6, 'Draft', '2026-10-03T13:00:00+00:00'),
  b(7, 'Cancelled', '2026-10-04T13:00:00+00:00'),
  b(8, 'Ended', '2026-09-27T13:00:00+00:00'),
  b(9, 'Published', 'khong-phai-ngay'),
]

const { sapToi, daDien } = chiaLichPhongTra(ds)
assert.deepEqual(sapToi.map((x) => x.id), [5, 3, 1], 'đang diễn đứng đầu, còn lại gần nhất trước; Pending/Draft/Cancelled/ngày hỏng bị loại')
assert.deepEqual(daDien.map((x) => x.id), [8, 4], 'đã diễn: mới nhất trước')
assert.deepEqual(chiaLichPhongTra(null), { sapToi: [], daDien: [] }, 'đầu vào hỏng không làm sập')

const nhieu = Array.from({ length: NGUONG_KHONG_CAT + 1 }, (_, i) => i)
assert.equal(catLich(nhieu).hien.length, SO_BUOI_HIEN)
assert.equal(catLich(nhieu).an.length, NGUONG_KHONG_CAT + 1 - SO_BUOI_HIEN)
const vuaDu = nhieu.slice(0, NGUONG_KHONG_CAT)
assert.equal(catLich(vuaDu).hien.length, NGUONG_KHONG_CAT, 'tới ngưỡng thì in hết')
assert.equal(catLich(vuaDu).an.length, 0)

console.log('lichPhongTra: DAT')
