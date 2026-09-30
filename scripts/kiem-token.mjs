// scripts/kiem-token.mjs
//
// CỔNG CƠ HỌC cho luật màu của đặc tả trang chủ (docs/design/DAC-TA-TRANG-CHU.md §5, §6).
//
// VÌ SAO TỒN TẠI
// Nghiên cứu kết luận rằng lớp chữ — tài liệu, quy ước, lời dặn agent — là lớp yếu nhất trong hệ
// thống kiểm soát. Anthropic nói thẳng về file quy ước: "Claude treats them as context, not
// enforced configuration." Cách duy nhất để một luật thật sự có hiệu lực là dịch nó thành một
// exit code. Đây là bản dịch đó cho luật quan trọng nhất và dễ vi phạm nhất: MÀU.
//
// Script này KHÔNG chấm đẹp/xấu. Nó chỉ chứng minh được một điều, và chỉ một:
//   "không có màu nào nằm ngoài hệ token".
// Nó KHÔNG chứng minh trang đẹp, nhịp đúng, hay chữ dễ đọc — ba thứ đó bắt buộc phải mở trình
// duyệt nhìn bằng mắt. Đừng dùng nó để tuyên bố nhiều hơn thế.
//
// Chạy: npm run kiem-token
import { readdirSync, statSync } from 'node:fs'
import { docTep } from './lib/docTep.mjs'
import { join, relative } from 'node:path'

// Khu vực đang được canh. Mở rộng dần chứ không bật cả `src/` ngay: bật cả kho khi còn ~580 chỗ
// dùng màu mặc định sẽ cho ra một cổng đỏ vĩnh viễn, mà một cổng đỏ vĩnh viễn thì không ai đọc nữa.
// Cách dùng đúng là "ratchet": mỗi lần dọn xong một khu thì thêm khu đó vào đây, và nó không bao
// giờ được phép đỏ trở lại.
const KHU_CANH = [
  'src/components/program', // linh kiện trang chủ mới (30/09) — trước đó cổng canh nhầm thư mục trang chủ CŨ
  'src/components/brand',
  'src/pages/home',
  'src/components/shared',
  'src/pages/public',
  'src/pages/lounge',
  'src/components/lounge',
  'src/pages/auth',
  'src/components/auth',
  'src/pages/events',
  'src/components/mshow-detail',
  'src/components/myshows',
  'src/pages/user/MyShowsPage.jsx',
  'src/pages/user/TicketDetailPage.jsx',
  'src/pages/payment',
]

// Mã lấy nguyên từ thư viện bên thứ ba — không phải mã của dự án, không áp luật token lên nó.
const BO_QUA = ['src/components/reactbits']

// Bảng màu mặc định của Tailwind. Dùng chúng nghĩa là bỏ qua hệ token ấm của dự án và rơi về màu
// lạnh mặc định — đúng cơ chế đã đo được: model rơi về giá trị phổ biến nhất trong dữ liệu huấn
// luyện, và `gray-*` / `indigo-*` là phổ biến nhất.
const HO_MAU_MAC_DINH =
  'red|orange|amber|yellow|lime|green|emerald|teal|cyan|sky|blue|indigo|violet|purple|fuchsia|pink|rose|slate|gray|zinc|neutral|stone'
const MAU_MAC_DINH = new RegExp(`\\b(?:bg|text|border|fill|stroke|ring|from|via|to|decoration|outline|shadow|accent|caret|divide|placeholder)-(?:${HO_MAU_MAC_DINH})-\\d{2,3}\\b`, 'g')

// Mã màu hex viết thẳng trong lớp Tailwind tuỳ ý, ví dụ `bg-[#fbf9f4]`. Token tồn tại chính là để
// không ai phải nhớ con số này.
const HEX_TRONG_LOP = /\b(?:bg|text|border|fill|stroke|ring|shadow|outline|decoration)-\[#[0-9a-fA-F]{3,8}\]/g

const doFile = (duongDan) => {
  const noiDung = docTep(duongDan)
  const viPham = []
  for (const dong of noiDung.split('\n').entries()) {
    const [i, chu] = dong
    // Bỏ qua dòng chú thích: chú thích ĐƯỢC PHÉP nhắc tên màu cũ để giải thích vì sao đã bỏ nó.
    // Không có ngoại lệ này thì mọi ghi chú "trước đây dùng gray-300" đều làm đỏ cổng.
    const daCatChuThich = chu.replace(/\/\/.*$/, '').replace(/\/\*[\s\S]*?\*\//g, '')
    for (const m of daCatChuThich.matchAll(MAU_MAC_DINH)) {
      viPham.push({ dong: i + 1, tim: m[0], loai: 'màu mặc định Tailwind' })
    }
    for (const m of daCatChuThich.matchAll(HEX_TRONG_LOP)) {
      viPham.push({ dong: i + 1, tim: m[0], loai: 'mã hex viết thẳng' })
    }
  }
  return viPham
}

const quet = (thuMuc, ketQua = []) => {
  let muc
  try { muc = readdirSync(thuMuc) } catch { return ketQua }
  for (const ten of muc) {
    const p = join(thuMuc, ten)
    if (BO_QUA.some((bq) => p.replace(/\\/g, '/').includes(bq))) continue
    if (statSync(p).isDirectory()) quet(p, ketQua)
    else if (/\.jsx?$/.test(ten)) ketQua.push(p)
  }
  return ketQua
}

let tongViPham = 0
let tongFile = 0
for (const khu of KHU_CANH) {
  for (const f of quet(khu)) {
    tongFile++
    const viPham = doFile(f)
    if (viPham.length === 0) continue
    tongViPham += viPham.length
    console.log(`\n${relative(process.cwd(), f)}`)
    for (const v of viPham) console.log(`  dòng ${v.dong}: ${v.tim}  — ${v.loai}`)
  }
}

// CHẶN "QUÉT TRÚNG SỐ KHÔNG": nếu không có file nào được quét thì cổng này đang xanh vì nó không
// tìm thấy gì, chứ không phải vì mã sạch. Đây là cùng một cái bẫy mà repo backend đã phải chặn
// trong các test quét của nó.
if (tongFile === 0) {
  console.error('\n✖ Không quét được file nào. Kiểm lại KHU_CANH — cổng xanh vì rỗng thì vô nghĩa.')
  process.exit(1)
}

if (tongViPham > 0) {
  console.error(`\n✖ ${tongViPham} chỗ dùng màu ngoài hệ token (đã quét ${tongFile} file).`)
  console.error('  Đổi sang token trong src/index.css: page · card · sunken · line · line-strong ·')
  console.error('  ink · ink-soft · ink-mute · brand · brand-text · on-brand · espresso · cream ·')
  console.error('  danger · success · warning.')
  console.error('  Lý do: docs/design/DAC-TA-TRANG-CHU.md §5.')
  process.exit(1)
}

console.log(`✔ ${tongFile} file, không có màu nào ngoài hệ token.`)
console.log('  Lưu ý: cổng này chỉ chứng minh "không có màu lạ". Nó KHÔNG chứng minh trang đẹp.')
