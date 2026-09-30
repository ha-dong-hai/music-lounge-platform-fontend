// scripts/kiem-nut-khong-ten.mjs — tìm <button> KHÔNG CÓ TÊN cho trình đọc màn hình (WCAG 2.2 SC 4.1.2).
//
// Nút không có chữ nhìn thấy (chỉ một biểu tượng lucide) mà cũng không có aria-label thì trình đọc màn hình chỉ đọc
// "nút". `title` KHÔNG được tính: nhiều trình đọc màn hình không đọc title ổn định, và trên cảm ứng nó không hiện.
//
// CÁCH LÀM: tách thẻ mở bằng cách đếm ngoặc {} (thuộc tính JSX có "=>", tách bằng regex là hỏng), lấy phần giữa
// <button …> và </button>, bỏ thẻ con và biểu thức {…}. Còn chữ thì coi là có tên. Biểu thức {…} có chuỗi chữ bên trong
// (ví dụ {dang ? 'Lưu' : 'Bỏ'}) cũng coi là có tên.
// GIỚI HẠN: không theo được tên nằm trong component con (<NutBieuTuong nhan="…"/>) — nếu có thì ghi vào NGOAI_LE.
//
// Chạy: node scripts/kiem-nut-khong-ten.mjs
import { readdirSync, readFileSync, statSync } from 'node:fs'
import { join } from 'node:path'

const theMo = (s, i) => {
  let sau = 0, nhay = null
  for (let j = i; j < s.length; j++) {
    const c = s[j]
    if (nhay) { if (c === '\\') { j++; continue } if (c === nhay) nhay = null; continue }
    if (c === '"' || c === "'" || c === '`') nhay = c
    else if (c === '{') sau++
    else if (c === '}') sau--
    else if (c === '>' && sau === 0) return j + 1
  }
  return -1
}

const loi = []
let soNut = 0
const quet = (d) => {
  for (const t of readdirSync(d)) {
    const p = join(d, t)
    if (statSync(p).isDirectory()) { if (!p.includes('reactbits')) quet(p); continue }
    if (!t.endsWith('.jsx')) continue
    const s = readFileSync(p, 'utf8')
    let i = 0
    for (;;) {
      const k = s.indexOf('<button', i); if (k < 0) break
      const e = theMo(s, k); if (e < 0) break
      const mo = s.slice(k, e); i = e
      if (mo.endsWith('/>')) continue
      soNut++
      if (/aria-label(ledby)?=/.test(mo)) continue
      const d = s.indexOf('</button>', e); if (d < 0) continue
      const trong = s.slice(e, d)
      // Có tên nếu: (a) chữ nằm NGOÀI mọi biểu thức {…} sau khi bỏ thẻ; (b) một chuỗi trích dẫn có chữ ở bất kỳ đâu
      // (nhánh của toán tử ba ngôi, kể cả lồng trong <>…</>); (c) một biến in thẳng ra ({nhan}, {t.label}).
      let ngoai = '', sau = 0
      for (const c of trong.replace(/<[^>]*>/g, ' ')) { if (c === '{') sau++; else if (c === '}') sau--; else if (sau === 0) ngoai += c }
      // (d) chữ tiếng Việt CÓ DẤU nằm trong nhánh <>…</> của toán tử ba ngôi — tên biến không bao giờ có dấu.
      const coChu = /[A-Za-zÀ-ỹ]{2,}/.test(ngoai) || /[À-ỹ]/.test(trong.replace(/<[^>]*>/g, ' ')) || /['"`][^'"`\n]*[A-Za-zÀ-ỹ]{2,}/.test(trong) || /\{\s*[a-zA-Z_][\w.?]*\s*\}/.test(trong)
      if (!coChu) {
        const dong = s.slice(0, k).split('\n').length
        loi.push(`${p}:${dong}  ${mo.replace(/\s+/g, ' ').slice(0, 110)}`)
      }
    }
  }
}
quet('src')
if (soNut < 100) { console.error(`✖ Chỉ thấy ${soNut} nút — quét trúng gần số không.`); process.exit(1) }
if (loi.length) { loi.forEach((x) => console.log('  ' + x)); console.error(`✖ ${loi.length} nút không có tên (đã quét ${soNut} nút).`); process.exit(1) }
console.log(`✔ ${soNut} nút, nút nào cũng có tên.`)
