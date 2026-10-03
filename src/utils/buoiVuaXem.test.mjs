// node src/utils/buoiVuaXem.test.mjs
import assert from 'node:assert/strict'
import { docBuoiVuaXem, nhoBuoiVuaXem, xoaBuoiVuaXem, SO_TOI_DA } from './buoiVuaXem.js'

const kho = () => { const m = new Map(); return { getItem: (k) => (m.has(k) ? m.get(k) : null), setItem: (k, v) => m.set(k, String(v)), removeItem: (k) => m.delete(k) } }
const g = (n) => `00000000-0000-4000-8000-${String(n).padStart(12, '0')}`

const s = kho()
assert.deepEqual(docBuoiVuaXem(s), [], 'chưa xem gì → rỗng')
nhoBuoiVuaXem(g(1), s); nhoBuoiVuaXem(g(2), s); nhoBuoiVuaXem(g(1).toUpperCase(), s)
assert.deepEqual(docBuoiVuaXem(s), [g(1), g(2)], 'mới nhất trước, xem lại thì đưa lên đầu, không trùng (kể cả viết hoa)')
for (let i = 3; i < 20; i++) nhoBuoiVuaXem(g(i), s)
assert.equal(docBuoiVuaXem(s).length, SO_TOI_DA, 'giữ tối đa SO_TOI_DA')
assert.equal(docBuoiVuaXem(s)[0], g(19))
nhoBuoiVuaXem('khong-phai-guid', s); nhoBuoiVuaXem(42, s)
assert.equal(docBuoiVuaXem(s)[0], g(19), 'mã không phải GUID bị bỏ')
xoaBuoiVuaXem(s)
assert.deepEqual(docBuoiVuaXem(s), [], 'xoá lịch sử')
// Dữ liệu hỏng / trình duyệt chặn lưu → không ném lỗi
const hong = kho(); hong.setItem('ml-buoi-vua-xem-v1', '{rác')
assert.deepEqual(docBuoiVuaXem(hong), [])
const chan = { getItem: () => { throw new Error('SecurityError') }, setItem: () => { throw new Error('SecurityError') }, removeItem: () => { throw new Error('x') } }
assert.deepEqual(docBuoiVuaXem(chan), []); nhoBuoiVuaXem(g(1), chan); xoaBuoiVuaXem(chan)
console.log('buoiVuaXem: DAT')
