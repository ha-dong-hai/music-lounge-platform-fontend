import assert from 'node:assert/strict'
import fs from 'node:fs'
import { tieuDeTheoDuong, tieuDeRieng, TIEU_DE_MAC_DINH } from './tieuDeTrang.js'

let dat = 0
const ca = (fn) => { fn(); dat++ }

ca(() => assert.equal(tieuDeTheoDuong('/'), TIEU_DE_MAC_DINH))
ca(() => assert.equal(tieuDeTheoDuong('/shows'), 'Buổi diễn — MusicLounge'))
ca(() => assert.equal(tieuDeTheoDuong('/shows/'), 'Buổi diễn — MusicLounge'))           // gạch chéo cuối
ca(() => assert.equal(tieuDeTheoDuong('/shows/abc-123'), null))                          // trang tự đặt theo tên buổi
ca(() => assert.equal(tieuDeTheoDuong('/lounge/abc'), null))
ca(() => assert.equal(tieuDeTheoDuong('/lounge/abc/order'), 'Gọi món tại bàn — MusicLounge'))
ca(() => assert.equal(tieuDeTheoDuong('/performers/x/donations'), 'Sao kê tiền ủng hộ — MusicLounge'))
ca(() => assert.equal(tieuDeTheoDuong('/owner/shows/1/settings'), 'Poster và cài đặt buổi diễn — MusicLounge'))
ca(() => assert.equal(tieuDeTheoDuong('/owner/shows/1'), 'Chuẩn bị buổi diễn — MusicLounge'))
ca(() => assert.equal(tieuDeTheoDuong('/owner/operate'), 'Vận hành đêm diễn — MusicLounge'))
ca(() => assert.equal(tieuDeTheoDuong('/admin'), 'Tổng quan quản trị — MusicLounge'))
ca(() => assert.equal(tieuDeTheoDuong('/admin/shows/9'), 'Duyệt buổi diễn — MusicLounge'))
ca(() => assert.equal(tieuDeTheoDuong('/khong-co'), 'Không có trang này — MusicLounge'))
ca(() => assert.equal(tieuDeTheoDuong('/ownership'), 'Không có trang này — MusicLounge'))  // không khớp nhầm /owner
ca(() => assert.equal(tieuDeRieng('Round midnight'), 'Round midnight — MusicLounge'))
ca(() => assert.equal(tieuDeRieng(''), TIEU_DE_MAC_DINH))

// QUÉT: mọi đường dẫn khai trong AppRouter phải có tiêu đề (hoặc được khai là trang tự đặt). Thêm route mà quên tiêu đề → đỏ.
const src = fs.readFileSync(new URL('../routes/AppRouter.jsx', import.meta.url), 'utf8')
const tho = [...src.matchAll(/path: '([^']+)'/g)].map((m) => m[1]).filter((p) => p !== '*' && !p.startsWith('/__dev'))
assert.ok(tho.length >= 55, `quét trúng quá ít route: ${tho.length}`)
// Ghép tiền tố của route cha: route con không bắt đầu bằng '/' thuộc '/', '/owner' hoặc '/admin' theo thứ tự xuất hiện.
let cha = ''
const day = []
for (const p of tho) {
  if (p.startsWith('/')) { cha = ['/', '/owner', '/admin'].includes(p) ? p : cha; day.push(p); continue }
  day.push((cha === '/' ? '' : cha) + '/' + p)
}
const thieu = day.map((p) => p.replace(/:[^/]+/g, 'x')).filter((p) => tieuDeTheoDuong(p) === 'Không có trang này — MusicLounge')
assert.deepEqual(thieu, [], 'route chưa có tiêu đề: ' + thieu.join(', '))
dat++
console.log(`tieuDeTrang: ${dat}/17 đạt (quét ${day.length} route)`)
