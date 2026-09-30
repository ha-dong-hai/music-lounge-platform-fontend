// scripts/kiem-the-gioi.mjs
//
// CỔNG CƠ HỌC: file ĐÃ CHUYỂN sang thế giới "tờ chương trình ca nhạc" không được mang dấu vết thiết kế cũ.
//
// VÌ SAO TỒN TẠI
// Chủ dự án 30/09: "Tôi muốn thiết kế mới nên những thiết kế cũ đừng để bị trộn lẫn hay ảnh hưởng".
// Đo cùng ngày: để 130 trang chưa làm lại khỏi vỡ, tên màu cũ (brand/espresso/cream) được giữ và trỏ sang màu
// mới — nên CHÍNH code trang chủ mới cũng viết bằng tên cũ (~65 chỗ), và trang cũ thành màu mới trên hình khối cũ
// (bo viên thuốc, kính mờ, chuyển sắc). Lời dặn không giữ được ranh giới đó; exit code thì giữ được.
//
// CÁCH DÙNG — "ratchet" như kiem-token: DA_CHUYEN chỉ được THÊM. Làm lại xong một trang thì đưa file của nó vào
// đây; từ đó nó không bao giờ được đỏ trở lại. Mọi file còn lại được in thành DANH SÁCH NỢ (không làm đỏ cổng)
// để thấy còn bao xa; nợ về 0 thì xoá khối TỪ VỰNG CŨ trong src/index.css.
//
// CỔNG NÀY CHỈ CHỨNG MINH: file đã chuyển không chứa các MẪU CHỮ dưới đây. Nó KHÔNG chứng minh trang đúng thế
// giới mới (bố cục, nhịp, chất liệu) — cái đó phải chụp màn hình nhìn và qua người duyệt độc lập.
//
// Chạy: npm run kiem:the-gioi          (cổng)
//       npm run kiem:the-gioi -- --tu-kiem   (bộ đột biến: mẫu phải ĐỎ và mẫu phải XANH)
import { readdirSync, statSync } from 'node:fs'
import { join, relative } from 'node:path'
import { docTep } from './lib/docTep.mjs'

// File/thư mục ĐÃ CHUYỂN. Chỉ thêm, không bớt.
const DA_CHUYEN = [
  'src/pages/home/HomePage.jsx',
  'src/components/program',
  'src/components/brand',
  'src/components/shared/CoverFallback.jsx',
  'src/layouts/Header.jsx',
  'src/layouts/Footer.jsx',
]

const TIEN_TO = '(?:bg|text|border|ring|outline|from|to|via|decoration|fill|stroke|divide|shadow|caret|accent|placeholder|ring-offset)(?:-[trblxy])?'
const TEN_CU = '(?:brand-on-dark|brand-hover|brand-text|on-brand|brand|espresso-soft|espresso|cream-mute|cream)'

// Regex viết NGUYÊN BẢN /.../ (L-13: new RegExp(chuỗi) nuốt dấu \ và làm cổng thủng âm thầm). Riêng LUAT[0] ghép
// từ hằng nên dùng RegExp — hằng không chứa \ nào, và bộ tự kiểm có mẫu ĐỎ riêng cho nó.
const LUAT = [
  { ten: 'tên màu cũ (brand/espresso/cream) — dùng stock/ink/board/lamp', mau: new RegExp(`(?<![\\w-])${TIEN_TO}-${TEN_CU}(?![\\w-])`, 'g') },
  { ten: 'nền chuyển sắc', mau: /\bbg-(?:gradient|linear|radial|conic)-|background(?:Image)?['"]?\s*:\s*['"`][^'"`]*gradient/g },
  { ten: 'bo góc tròn (giấy in cắt vuông)', mau: /\brounded(?:-[trblse]{1,2})?-(?:full|lg|xl|2xl|3xl)\b/g },
  { ten: 'kính mờ', mau: /\bbackdrop-blur/g },
  { ten: 'nhãn chữ hoa giãn cách', mau: /\buppercase\b[^"'`\n]*\btracking-(?:wide|wider|widest|\[)|\btracking-(?:wide|wider|widest|\[)[^"'`\n]*\buppercase\b/g },
  { ten: 'font của thế giới cũ', mau: /font-serif|Playfair|Plus Jakarta/g },
  { ten: 'gsap (tầng chuyển động là framer-motion)', mau: /from\s+['"]gsap/g },
  { ten: 'bóng mặc định Tailwind (dùng shadow-soft/lift/glow)', mau: /\bshadow-(?:sm|md|lg|xl|2xl|inner)\b/g },
]

// Bóc chú thích nhưng GIỮ số dòng: chú thích khối thay bằng đúng số xuống dòng của nó.
const bocChuThich = (chu) =>
  chu
    .replace(/\/\*[\s\S]*?\*\//g, (m) => '\n'.repeat((m.match(/\n/g) || []).length))
    .split('\n')
    .map((d) => d.replace(/(^|[^:'"`])\/\/.*$/, '$1'))

const viPhamTrong = (chu) => {
  const ds = []
  bocChuThich(chu).forEach((dong, i) => {
    for (const l of LUAT) for (const m of dong.matchAll(l.mau)) ds.push({ dong: i + 1, tim: m[0].slice(0, 60), loai: l.ten })
  })
  return ds
}

const quet = (p, kq = []) => {
  const st = statSync(p, { throwIfNoEntry: false })
  if (!st) return kq
  if (st.isDirectory()) for (const t of readdirSync(p)) quet(join(p, t), kq)
  else if (/\.(jsx?|css)$/.test(p) && !p.endsWith('index.css')) kq.push(p.replace(/\\/g, '/'))
  return kq
}

if (process.argv.includes('--tu-kiem')) {
  const PHAI_DO = [
    'className="bg-brand text-on-brand"', 'hover:bg-brand-hover', 'text-brand-text', 'bg-espresso/40', 'border-cream/15',
    'text-cream-mute', 'text-brand-on-dark', 'bg-espresso-soft', 'focus:ring-brand', 'border-t-cream',
    'bg-gradient-to-r', "style={{ background: 'linear-gradient(#fff,#000)' }}", 'bg-radial-[at_50%_0%]',
    'rounded-full', 'rounded-2xl', 'rounded-t-xl', 'backdrop-blur-md',
    'text-xs uppercase tracking-[0.12em]', 'tracking-widest font-bold uppercase',
    'font-serif', "import gsap from 'gsap'", 'shadow-2xl',
  ]
  const PHAI_XANH = [
    'className="bg-lamp text-ink"', 'bg-board-soft', 'text-lamp-mute', 'bg-stock', 'border-ink/30', 'hover:bg-board',
    'rounded-sm', 'rounded-none', 'shadow-lift', 'shadow-glow', 'tracking-tight', 'uppercase',
    "WebkitMask: 'radial-gradient(circle 7px at 50% 0, transparent 98%, #000)'",
    '// bg-brand trong chú thích', '/* rounded-full trong chú thích */', "import Wordmark from '../components/brand/Wordmark'",
    'className="brand-new-thing"', 'text-creamy',
  ]
  let loi = 0
  for (const m of PHAI_DO) if (viPhamTrong(m).length === 0) { console.log('  ✖ PHẢI ĐỎ mà xanh:', m); loi++ }
  for (const m of PHAI_XANH) { const v = viPhamTrong(m); if (v.length) { console.log('  ✖ PHẢI XANH mà đỏ:', m, '→', v[0].loai); loi++ } }
  console.log(`Tự kiểm: ${PHAI_DO.length} mẫu phải đỏ, ${PHAI_XANH.length} mẫu phải xanh, ${loi} sai.`)
  process.exit(loi ? 1 : 0)
}

const daChuyen = DA_CHUYEN.flatMap((p) => quet(p))
if (daChuyen.length === 0) {
  console.error('✖ Không quét được file ĐÃ CHUYỂN nào — cổng xanh vì rỗng thì vô nghĩa. Kiểm lại DA_CHUYEN.')
  process.exit(1)
}
const tapChuyen = new Set(daChuyen)

let tongDo = 0
for (const f of daChuyen) {
  const v = viPhamTrong(docTep(f))
  if (!v.length) continue
  tongDo += v.length
  console.log(`\n${f}`)
  for (const x of v) console.log(`  dòng ${x.dong}: ${x.tim}  — ${x.loai}`)
}

// Danh sách nợ: mọi file còn lại trong src. Chỉ in, không làm đỏ.
const no = quet('src').filter((f) => !tapChuyen.has(f)).map((f) => ({ f, n: viPhamTrong(docTep(f)).length })).filter((x) => x.n)
no.sort((a, b) => b.n - a.n)
console.log(`\nNỢ THẾ GIỚI CŨ (chưa chuyển): ${no.length} file, ${no.reduce((s, x) => s + x.n, 0)} chỗ. Nặng nhất:`)
for (const x of no.slice(0, 12)) console.log(`  ${String(x.n).padStart(4)}  ${relative('.', x.f)}`)

console.log(`\nĐÃ CHUYỂN: ${daChuyen.length} file, ${tongDo} chỗ còn dấu vết cũ.`)
if (tongDo) { console.error('✖ File đã chuyển còn dấu vết thiết kế cũ.'); process.exit(1) }
console.log('✔ File đã chuyển sạch dấu vết thiết kế cũ.')
