// scripts/kiem-lop-chet.mjs — tìm LỚP TAILWIND KHÔNG SINH RA CSS trong src/.
//
// VÌ SAO (30/09/2026): một script dọn dẹp khớp `tracking-wide` trước `tracking-wider` và để lại 43 lớp rác
// (`text-ink-softr`, `text-ink-muter`). Tailwind im lặng bỏ qua lớp lạ, build vẫn xanh, trang chỉ lặng lẽ mất màu chữ.
// Không cổng nào khác bắt được loại lỗi này: chúng chỉ tìm mẫu CẤM, không kiểm lớp có THẬT không.
//
// CÁCH LÀM: đọc CSS đã build (dist/assets/*.css), gom tên lớp từ các chuỗi className="..." và className={`...`}, lớp
// nào trông như lớp Tailwind (có tiền tố quen thuộc) mà không có trong CSS thì báo. Chỉ báo lớp CÓ tiền tố quen thuộc
// để tránh báo nhầm tên lớp tự đặt (.reveal, .hide-scrollbar…) hay phần biểu thức JS trong template.
// GIỚI HẠN: lớp ghép động (`bg-${mau}`) không kiểm được; lớp nằm trong biến chuỗi ngoài className cũng không.
//
// Chạy: npm run build && node scripts/kiem-lop-chet.mjs
import { readdirSync, readFileSync, statSync } from 'node:fs'
import { join } from 'node:path'

const css = readdirSync('dist/assets').filter((f) => f.endsWith('.css')).map((f) => readFileSync(join('dist/assets', f), 'utf8')).join('\n')
if (!css) { console.error('✖ Không đọc được CSS đã build — chạy npm run build trước.'); process.exit(1) }

// Chuyển tên lớp sang dạng thoát như trong CSS: hover:bg-ink/10 -> hover\:bg-ink\/10
const thoat = (lop) => lop.replace(/([:/.[\]()%#,!&>+~='"*@])/g, '\\$1')

const TIEN_TO = /^(?:!?-?)(?:[a-z0-9-]+:)*-?(?:bg|text|border|ring|outline|fill|stroke|from|via|to|shadow|decoration|divide|placeholder|caret|accent|p[trblxy]?|m[trblxy]?|gap|space|w|h|min|max|size|inset|top|right|bottom|left|z|flex|grid|col|row|items|justify|self|place|content|font|leading|tracking|rounded|opacity|overflow|whitespace|break|line-clamp|aspect|object|translate|rotate|scale|transition|duration|ease|delay|animate|cursor|select|pointer|underline|list|order|basis|grow|shrink|sr|not-sr|hidden|block|inline|table|contents|sticky|fixed|absolute|relative|static|visible|invisible|truncate|uppercase|lowercase|capitalize|italic|tabular|scroll|snap|touch|resize|appearance|backdrop|blur|mix|isolate)(?:-|$)/

const tapLop = new Map()
const quet = (d) => {
  for (const t of readdirSync(d)) {
    const p = join(d, t)
    if (statSync(p).isDirectory()) { if (!p.includes('reactbits')) quet(p); continue }
    if (!/\.jsx?$/.test(t)) continue
    const s = readFileSync(p, 'utf8')
    for (const m of s.matchAll(/className=(?:"([^"]*)"|\{`([^`]*)`\})/g)) {
      const chuoi = (m[1] ?? m[2]).replace(/\$\{[^}]*\}/g, ' ')
      for (const lop of chuoi.split(/\s+/)) {
        if (!lop || /[{}$'"`]/.test(lop) || !TIEN_TO.test(lop)) continue
        if (!tapLop.has(lop)) tapLop.set(lop, new Set())
        tapLop.get(lop).add(p)
      }
    }
  }
}
quet('src')
if (tapLop.size < 200) { console.error(`✖ Chỉ gom được ${tapLop.size} lớp — quét trúng gần số không, kiểm lại mẫu tìm.`); process.exit(1) }

const chet = [...tapLop].filter(([lop]) => !css.includes('.' + thoat(lop)))
if (chet.length) {
  for (const [lop, tep] of chet) console.log(`  ${lop}  — ${[...tep].slice(0, 3).join(', ')}${tep.size > 3 ? ` (+${tep.size - 3})` : ''}`)
  console.error(`✖ ${chet.length} lớp không sinh ra CSS (đã kiểm ${tapLop.size} lớp).`)
  process.exit(1)
}
console.log(`✔ ${tapLop.size} lớp, lớp nào cũng sinh ra CSS.`)
