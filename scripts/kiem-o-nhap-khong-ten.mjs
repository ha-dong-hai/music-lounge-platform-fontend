// scripts/kiem-o-nhap-khong-ten.mjs — tìm Ô NHẬP KHÔNG CÓ TÊN cho trình đọc màn hình (WCAG 2.2 SC 1.3.1, 4.1.2, 3.3.2).
//
// Một <input>/<select>/<textarea> có tên khi: có aria-label / aria-labelledby; HOẶC có id mà một <label htmlFor> trỏ
// tới; HOẶC nằm bên trong một <label>. Chữ mẫu (placeholder) KHÔNG phải tên: nó biến mất khi gõ (NN/g, WAI).
// Lỗi hay gặp ở mã này: <label className="…">Họ và tên</label><input …/> — nhãn đứng cạnh nhưng không nối với ô.
//
// Bỏ qua: type="hidden", type="file" nằm ẩn (className có "hidden"/"sr-only" và được mở bằng một nút khác),
// type="submit|button|reset", và ô được truyền qua {...register()} mà component bọc tự gắn nhãn (AuthField — có id).
// GIỚI HẠN: đọc tĩnh từng tệp; id/htmlFor ghép động (`${id}-x`) được coi là khớp nếu CÙNG biểu thức xuất hiện ở cả hai.
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
const giaTri = (the, ten) => { const m = new RegExp(`\\b${ten}=(\\{[^}]*\\}|"[^"]*")`).exec(the); return m ? m[1] : null }

const loi = []
let soO = 0
const quet = (d) => {
  for (const t of readdirSync(d)) {
    const p = join(d, t)
    if (statSync(p).isDirectory()) { if (!p.includes('reactbits')) quet(p); continue }
    if (!t.endsWith('.jsx')) continue
    // Bỏ chú thích (giữ nguyên độ dài để số dòng không lệch): chú thích hay nhắc "<input>" khi giải thích.
    const s = readFileSync(p, 'utf8')
      .replace(/\/\*[\s\S]*?\*\//g, (k) => k.replace(/[^\n]/g, ' '))
      .replace(/(^|[^:'"`])\/\/[^\n]*/g, (k, a) => a + ' '.repeat(k.length - a.length))
    const htmlFor = new Set([...s.matchAll(/htmlFor=(\{[^}]*\}|"[^"]*")/g)].map((m) => m[1]))
    // vùng nằm trong <label>…</label>
    const trongNhan = []
    for (const m of s.matchAll(/<label\b/g)) { const e = s.indexOf('</label>', m.index); if (e > 0) trongNhan.push([m.index, e]) }
    for (const m of s.matchAll(/<(input|select|textarea)\b/g)) {
      const e = theMo(s, m.index); if (e < 0) continue
      const the = s.slice(m.index, e)
      const loai = (giaTri(the, 'type') || '').replace(/["{}]/g, '')
      if (['hidden', 'submit', 'button', 'reset'].includes(loai)) continue
      if (loai === 'file' && /hidden|sr-only/.test(giaTri(the, 'className') || '')) continue
      soO++
      if (/aria-label(ledby)?=/.test(the)) continue
      const id = giaTri(the, 'id')
      if (id && htmlFor.has(id)) continue
      if (trongNhan.some(([a, b]) => m.index > a && m.index < b)) continue
      loi.push(`${p}:${s.slice(0, m.index).split('\n').length}  ${the.replace(/\s+/g, ' ').slice(0, 100)}`)
    }
  }
}
quet('src')
if (soO < 50) { console.error(`✖ Chỉ thấy ${soO} ô nhập — quét trúng gần số không.`); process.exit(1) }
if (loi.length) { loi.forEach((x) => console.log('  ' + x)); console.error(`✖ ${loi.length} ô nhập không có tên (đã quét ${soO} ô).`); process.exit(1) }
console.log(`✔ ${soO} ô nhập, ô nào cũng có tên.`)
