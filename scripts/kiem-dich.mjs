// scripts/kiem-dich.mjs — CỔNG KIỂM BẢN DỊCH (03/10/2026, xem src/i18n/index.js)
//
// Khoá dịch là chính câu tiếng Việt, nên hai thứ trôi lệch được mà không ai thấy:
//   1. THIẾU: code gọi t('câu') nhưng en.json chưa có câu đó → giao diện tiếng Anh lòi ra tiếng Việt.
//   2. MỒ CÔI: en.json có câu mà không chỗ nào gọi nữa → thường là câu tiếng Việt vừa bị sửa, bản dịch cũ treo lại.
// Cả hai làm cổng ĐỎ (exit 1). Ngoài ra in BẢNG PHỦ: số dòng còn chữ Việt mà chưa bọc t()/k() trong từng tệp thuộc phạm vi
// đã dịch — chỉ để báo, không làm đỏ (một số dòng là dữ liệu, khoá so sánh, chú thích JSX… chủ ý giữ nguyên).
//
// Chỉ nhận câu viết thẳng: t('…'), t("…"), k('…'), t(`…` không có ${}). Câu ghép động không kiểm được → viết thành
// t('Còn {{n}} vé', { n }) thay vì nối chuỗi.
import { readFileSync, readdirSync, statSync } from 'node:fs'
import { join, relative } from 'node:path'

const GOC = new URL('..', import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, '$1')
const en = JSON.parse(readFileSync(join(GOC, 'src/i18n/en.json'), 'utf8'))

// PHẠM VI ĐÃ DỊCH (phần khán giả) — thêm dần theo đợt. Màn chủ phòng trà / admin cố ý KHÔNG nằm đây.
export const PHAM_VI = [
  'src/App.jsx', 'src/layouts/Header.jsx', 'src/layouts/Footer.jsx', 'src/layouts/MainLayout.jsx', 'src/pages/NotFoundPage.jsx',
  'src/pages/home', 'src/components/program', 'src/pages/events', 'src/components/mshow-detail',
  'src/pages/lounge', 'src/components/lounge', 'src/pages/auth', 'src/components/auth', 'src/pages/payment',
  'src/components/shared', 'src/components/bang',
]

const tep = []
const di = (p) => {
  const tuyetDoi = join(GOC, p)
  if (statSync(tuyetDoi).isDirectory()) for (const f of readdirSync(tuyetDoi)) di(join(p, f))
  else if (/\.(jsx|js)$/.test(p) && !/\.test\./.test(p)) tep.push(p)
}
for (const p of PHAM_VI) di(p)
// Câu dịch có thể nằm ngoài phạm vi (tiện ích dùng chung) — quét cả src để tìm lời gọi, nhưng bảng phủ chỉ tính phạm vi.
const tatCa = []
const diHet = (p) => { const a = join(GOC, p); if (statSync(a).isDirectory()) for (const f of readdirSync(a)) diHet(join(p, f)); else if (/\.(jsx|js)$/.test(p) && !/\.test\./.test(p)) tatCa.push(p) }
diHet('src')

// Mọi chữ có dấu tiếng Việt nằm trong U+00C0–U+1EF9. Bản đầu liệt kê tay một tập chữ và BỎ SÓT các chữ ghép hai dấu
// (ổ, ễ, ỗ, ợ, ầ…): "Buổi diễn", "Hỗ trợ" không bị bắt, bảng phủ báo thiếu mà không ai biết (đo 03/10).
const VIET = /[À-ỹ]/
const GOI = /\b(?:t|k|td)\(\s*(?:'((?:[^'\\]|\\.)*)'|"((?:[^"\\]|\\.)*)"|`([^`$]*)`)/g

const dung = new Map() // câu -> tệp đầu tiên dùng
for (const p of tatCa) {
  const s = readFileSync(join(GOC, p), 'utf8')
  for (const m of s.matchAll(GOI)) {
    const cau = (m[1] ?? m[2] ?? m[3]).replace(/\\'/g, "'").replace(/\\"/g, '"')
    if (!dung.has(cau)) dung.set(cau, p)
  }
}

const thieu = [...dung].filter(([c]) => VIET.test(c) && !(c in en))
const moCoi = Object.keys(en).filter((c) => !dung.has(c))

// Bảng phủ: dòng có chữ Việt, không phải chú thích, không chứa t(/k(, không phải import.
const phu = []
for (const p of tep) {
  const dong = readFileSync(join(GOC, p), 'utf8').split('\n')
  let trongChuThich = false
  let con = 0
  for (const d of dong) {
    const tt = d.trim()
    if (trongChuThich) { if (tt.includes('*/')) trongChuThich = false; continue }
    if (tt.startsWith('/*') || tt.startsWith('{/*')) { if (!tt.includes('*/')) trongChuThich = true; continue }
    if (tt.startsWith('//') || tt.startsWith('*')) continue
    const boChuThich = d.replace(/\{\/\*.*?\*\/\}/g, '').replace(/\/\/.*$/, '')
    if (VIET.test(boChuThich) && !/\b(?:t|k|td)\(/.test(boChuThich)) con++
  }
  if (con) phu.push([relative(GOC, join(GOC, p)).replace(/\\/g, '/'), con])
}

console.log(`Câu gọi dịch: ${dung.size} · có trong en.json: ${Object.keys(en).length}`)
if (phu.length) {
  console.log(`\nBẢNG PHỦ — dòng còn chữ Việt chưa bọc t() (${phu.reduce((a, b) => a + b[1], 0)} dòng / ${phu.length} tệp, chỉ báo):`)
  for (const [p, n] of phu.sort((a, b) => b[1] - a[1])) console.log(`  ${String(n).padStart(4)}  ${p}`)
}
if (thieu.length) {
  console.log(`\n✗ THIẾU BẢN DỊCH (${thieu.length}):`)
  for (const [c, p] of thieu) console.log(`  ${p}: ${JSON.stringify(c)}`)
}
if (moCoi.length) {
  console.log(`\n✗ MỒ CÔI trong en.json (${moCoi.length}) — không còn chỗ nào gọi:`)
  for (const c of moCoi) console.log(`  ${JSON.stringify(c)}`)
}
if (thieu.length || moCoi.length) process.exit(1)
console.log('\n✔ Mọi câu gọi dịch đều có bản tiếng Anh; không có mục mồ côi.')
