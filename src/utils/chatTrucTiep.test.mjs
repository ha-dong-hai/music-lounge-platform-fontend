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
for (let i = 1; i <= TRAN_TIN + 50; i++) ds = themTin(ds, { chatId: `c${i}`, content: `${i}`, type: 'chat' })
assert.equal(ds.length, TRAN_TIN, 'không quá trần')
assert.equal(ds[0].content, '51', 'bỏ tin cũ nhất')
assert.equal(ds.at(-1).content, String(TRAN_TIN + 50), 'giữ tin mới nhất')

// --- dòng ủng hộ không bị bỏ (TopDonorsBar cộng từ chúng)
let ds2 = [{ id: 'd1', type: 'donate', amount: 500000 }]
for (let i = 1; i <= 10; i++) ds2 = themTin(ds2, { chatId: `c${i}`, type: 'chat' }, 5)
assert.equal(ds2.length, 5)
assert.equal(ds2[0].type, 'donate', 'ủng hộ cũ nhất vẫn còn')
assert.deepEqual(ds2.slice(1).map((m) => m.chatId), ['c7', 'c8', 'c9', 'c10'])

// --- khoá ổn định theo mã
assert.equal(khoaTin({ chatId: 'x', type: 'chat' }, 7), 'tin-x')
assert.equal(khoaTin({ id: 'd', type: 'donate' }, 7), 'ung-ho-d')

console.log('chatTrucTiep: DAT')
