// node src/utils/demDaQua.test.mjs
import assert from 'node:assert/strict'
import { chonLoiDemDaQua, SO_LUOT } from './demDaQua.js'

const dg = (id, score, comment, phut, imageUrl) => ({ id, score, comment, createdAt: new Date(Date.UTC(2026, 9, 1, 0, phut)).toISOString(), imageUrl })
const A = { id: 'A', name: 'Đêm A' }, B = { id: 'B', name: 'Đêm B' }, C = { id: 'C', name: 'Đêm C' }

// --- một đêm đông lời không chiếm hết băng: mỗi đêm một lời
const kq = chonLoiDemDaQua([
  { buoi: A, danhGia: [dg('a1', 5, 'Hay', 50), dg('a2', 5, 'Rất hay', 40), dg('a3', 4, 'Ổn', 30)] },
  { buoi: B, danhGia: [dg('b1', 5, 'Tuyệt', 10)] },
])
assert.deepEqual(kq.map((x) => x.id), ['a1', 'b1'], 'mỗi đêm tối đa một lời, mới nhất trước')
assert.equal(kq[0].buoi.name, 'Đêm A', 'lời mang theo buổi của nó')

// --- lời chê không lên trang chủ; đêm chỉ có lời chê thì không góp lượt nào
assert.deepEqual(chonLoiDemDaQua([{ buoi: A, danhGia: [dg('x', 1, 'Thất vọng', 9), dg('y', 3, 'Tạm', 8)] }]), [])
assert.deepEqual(chonLoiDemDaQua([{ buoi: A, danhGia: [dg('x', 1, 'Thất vọng', 9), dg('y', 4, 'Ổn áp', 1)] }]).map((x) => x.id), ['y'], 'bỏ lời chê mới hơn, lấy lời đạt ngưỡng')

// --- không có chữ (chỉ sao, hoặc đang bị ẩn tạm → backend trả null) và lời chỉ là đường dẫn
assert.deepEqual(chonLoiDemDaQua([{ buoi: A, danhGia: [dg('n', 5, null, 9), dg('s', 5, '   ', 8), dg('l', 5, 'https://facebook.com/photo.php?fbid=1', 7), dg('w', 5, 'www.spam.vn/abc', 6)] }]), [])
assert.equal(chonLoiDemDaQua([{ buoi: A, danhGia: [dg('ok', 5, 'Xem thêm ở https://vd.vn nhé, đêm hay', 1)] }]).length, 1, 'có câu kèm đường dẫn thì vẫn là lời bình')

// --- trong một đêm: lời có ảnh thắng lời mới hơn không ảnh
assert.equal(chonLoiDemDaQua([{ buoi: A, danhGia: [dg('moi', 5, 'Mới', 50), dg('anh', 4, 'Có ảnh', 10, 'https://x/a.jpg')] }])[0].id, 'anh')

// --- trần số lượt
const nhieu = Array.from({ length: 9 }, (_, i) => ({ buoi: { id: 'd' + i }, danhGia: [dg('r' + i, 5, 'Hay ' + i, i)] }))
const k9 = chonLoiDemDaQua(nhieu)
assert.equal(k9.length, SO_LUOT)
assert.equal(k9[0].id, 'r8', 'mới nhất trước')

// --- cắt khoảng trắng thừa; đầu vào rỗng
assert.equal(chonLoiDemDaQua([{ buoi: C, danhGia: [dg('t', 5, '  Hay lắm \n', 1)] }])[0].comment, 'Hay lắm')
assert.deepEqual(chonLoiDemDaQua(), [])

console.log('demDaQua: DAT')
