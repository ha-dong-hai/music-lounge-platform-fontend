// Chạy: node src/lib/taiNen.test.mjs
//
// MLACP-699 — BÀI QUÉT: mọi hàm tải được nối vào kênh thời gian thực (useTaiLaiKhiDoi) mà có bật cờ chờ
// (set…Loading…(true)) thì PHẢI hỏi laTaiNen(...). Quên là trang tự "reload" mỗi khi máy chủ báo dữ liệu đổi — chủ dự án
// gặp 06/10/2026 ở trang cài đặt buổi diễn khi poster AI tạo xong.
//
// ĐIỂM MÙ đã biết: bài này chỉ thấy hàm khai bằng `const ten = useCallback(async (...) => {` trong CÙNG tệp với lời gọi
// hook, và chỉ kiểm hàm đó CÓ nhắc laTaiNen — không chứng minh mọi nhánh đều tôn trọng cờ. Hàm khai kiểu khác bị đếm vào
// `khongDocDuoc` và làm bài đỏ, để người viết phải xem tay.
import { readdirSync, readFileSync, statSync } from 'node:fs'
import { join, relative, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const SRC = join(dirname(fileURLToPath(import.meta.url)), '..')
const duyet = (d) => readdirSync(d).flatMap((n) => {
  const p = join(d, n)
  return statSync(p).isDirectory() ? duyet(p) : /\.jsx?$/.test(n) ? [p] : []
})

const CO_CHO = /set\w*Loading\w*\(true\)|setDangTai\w*\(true\)/
let soLoiGoi = 0; let soCoCo = 0
const viPham = []; const khongDocDuoc = []

for (const tep of duyet(SRC)) {
  const ma = readFileSync(tep, 'utf8')
  for (const m of ma.matchAll(/useTaiLaiKhiDoi\((\w+)\s*,/g)) {
    const ten = m[1]
    if (ten === 'taiLai') continue // chính chữ ký của hook trong lib/thoiGianThuc.js
    soLoiGoi++
    const dau = ma.search(new RegExp(`const ${ten} = useCallback\\(async \\(`))
    const cho = `${relative(SRC, tep).replace(/\\/g, '/')} → ${ten}`
    if (dau < 0) { khongDocDuoc.push(cho); continue }
    const cuoi = ma.indexOf('\n  }, [', dau)
    if (cuoi < 0) { khongDocDuoc.push(cho); continue }
    const than = ma.slice(dau, cuoi)
    if (!CO_CHO.test(than)) continue
    soCoCo++
    if (!than.includes('laTaiNen(')) viPham.push(cho)
  }
}

console.log(`Lời gọi useTaiLaiKhiDoi: ${soLoiGoi} · hàm tải có bật cờ chờ: ${soCoCo}`)
let hong = 0
// Chặn "quét trúng số không": lúc viết bài có 17 lời gọi, 10 hàm có cờ chờ.
if (soLoiGoi < 12) { hong++; console.log(`HỎNG  chỉ thấy ${soLoiGoi} lời gọi (muốn ≥ 12) — mẫu quét có còn khớp mã không?`) }
if (soCoCo < 6) { hong++; console.log(`HỎNG  chỉ thấy ${soCoCo} hàm có cờ chờ (muốn ≥ 6) — mẫu quét có còn khớp mã không?`) }
for (const c of khongDocDuoc) { hong++; console.log(`HỎNG  không đọc được thân hàm, phải xem tay: ${c}`) }
for (const c of viPham) { hong++; console.log(`HỎNG  bật cờ chờ mà không hỏi laTaiNen: ${c}`) }
console.log(hong ? `\n${hong} lỗi.` : '\nTất cả đều qua.')
process.exit(hong ? 1 : 0)
