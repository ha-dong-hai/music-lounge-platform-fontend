// node src/utils/chatTrucTiep.test.mjs
import assert from 'node:assert/strict'
import { tuLichSu, themTin, khoaTin, TRAN_TIN } from './chatTrucTiep.js'

// --- thứ tự: API trả mới → cũ (OrderByDescending Id); khung chat phải cũ → mới
const api = [3, 2, 1].map((n) => ({ messageId: `m${n}`, displayName: `Người ${n}`, message: `tin ${n}`, userId: n === 2 ? 'toi' : 'khac' }))
const ls = tuLichSu(api, 'toi')
assert.deepEqual(ls.map((m) => m.content), ['tin 1', 'tin 2', 'tin 3'], 'lịch sử xếp cũ → mới')
assert.equal(ls[1].isMine, true)
assert.deepEqual(api.map((m) => m.message), ['tin 3', 'tin 2', 'tin 1'], 'không đảo ngược mảng gốc của API')
assert.deepEqual(themTin(ls, { chatId: 'm4', content: 'tin 4', type: 'chat' }).map((m) => m.content), ['tin 1', 'tin 2', 'tin 3', 'tin 4'], 'tin mới nối sau tin mới nhất')

// --- trần
let ds = []
// Mã tin giả có ĐỘ DÀI CỐ ĐỊNH như OrderedGuid thật (themTin xếp theo mã — "c10" < "c2" nếu không đệm).
const ma = (i) => `c${String(i).padStart(4, '0')}`
for (let i = 1; i <= TRAN_TIN + 50; i++) ds = themTin(ds, { chatId: ma(i), content: `${i}`, type: 'chat' })
assert.equal(ds.length, TRAN_TIN, 'không quá trần')
assert.equal(ds[0].content, '51', 'bỏ tin cũ nhất')
assert.equal(ds.at(-1).content, String(TRAN_TIN + 50), 'giữ tin mới nhất')

// --- dòng ủng hộ không bị bỏ (TopDonorsBar cộng từ chúng)
let ds2 = [{ id: 'd1', type: 'donate', amount: 500000 }]
for (let i = 1; i <= 10; i++) ds2 = themTin(ds2, { chatId: ma(i), type: 'chat' }, 5)
assert.equal(ds2.length, 5)
assert.equal(ds2[0].type, 'donate', 'ủng hộ cũ nhất vẫn còn')
assert.deepEqual(ds2.slice(1).map((m) => m.chatId), [ma(7), ma(8), ma(9), ma(10)])

// --- 05/10/2026: tin đến lệch thứ tự vẫn xếp theo MÃ TIN của máy chủ (OrderedGuid). Mã thật đo được: 3 tin lệch nhau
// dưới 1 mili-giây (sentAt .8809484 / .8809662 / .8809759) — giờ gửi không phân định được, mã tin thì có.
const MA = { quang: '01a10ae2-46ed-86f4-8203-01a10ae246ed', lan: '01a10ae2-46ee-8d0c-8eb0-01a10ae246ee', han: '01a10ae2-46ef-8580-8245-01a10ae246ef' }
const thuTu = (den) => den.map((k) => ({ chatId: MA[k], content: k, type: 'chat' })).reduce((d, m) => themTin(d, m), []).map((m) => m.content)
assert.deepEqual(thuTu(['han', 'lan', 'quang']), ['quang', 'lan', 'han'], 'đến ngược vẫn xếp theo mã tin')
assert.deepEqual(thuTu(['quang', 'lan', 'han']), thuTu(['lan', 'han', 'quang']), 'mọi màn hình cùng một thứ tự')
const lech = thuTu(['lan', 'quang', 'han']).map((k) => ({ content: k }))
assert.deepEqual(themTin(lech, { id: 'u', type: 'donate' }).at(-1).type, 'donate', 'dòng không có giờ nối vào cuối')
assert.equal(tuLichSu([{ messageId: 'x', message: 'x', sentAt: '2026-10-05T04:30:00Z' }])[0].sentAt, '2026-10-05T04:30:00Z')

// --- khoá ổn định theo mã
assert.equal(khoaTin({ chatId: 'x', type: 'chat' }, 7), 'tin-x')
assert.equal(khoaTin({ id: 'd', type: 'donate' }, 7), 'ung-ho-d')

console.log('chatTrucTiep: DAT')
