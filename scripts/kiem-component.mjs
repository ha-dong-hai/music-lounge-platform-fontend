// scripts/kiem-component.mjs
//
// CỔNG CƠ HỌC: mọi file trong thư mục component đi lấy về phải ghi rõ NÓ ĐẾN TỪ ĐÂU.
//
// VÌ SAO CẦN CỔNG
// [ĐO] Thư mục `src/components/reactbits/` có 3 file, và một trong ba — `MotionGuard.jsx` — không
// phải của react-bits mà là đồ tự viết. Không ai nhìn tên thư mục mà biết được điều đó. Hệ quả
// thật: khi chủ dự án hỏi "component lấy từ thư viện có sẵn chưa", câu trả lời đúng là "một phần",
// nhưng nhìn cây thư mục thì tưởng là "rồi".
//
// Ghi nguồn gốc còn giải quyết ba việc khác:
//   · biết component đã cũ bao lâu so với bản thượng nguồn;
//   · biết đã sửa gì so với bản gốc — vì ta BẮT BUỘC phải sửa màu cho khớp token;
//   · biết được phép sửa tiếp hay nên lấy bản mới về.
//
// Chạy: npm run kiem-component
import { readdirSync, statSync } from 'node:fs'
import { docTep } from './lib/docTep.mjs'
import { join } from 'node:path'

// Thư mục chứa hàng ĐI LẤY VỀ. Đồ tự viết để ở `src/components/shared/`, không để lẫn vào đây.
const KHU_CANH = ['src/components/reactbits', 'src/components/ui']

// Ba dòng bắt buộc trong khối chú thích đầu file.
const BAT_BUOC = [
  { ten: 'Nguồn (URL)', re: /Nguồn:\s*https?:\/\/\S+/ },
  { ten: 'Ngày lấy (DD/MM/YYYY)', re: /Ngày lấy:\s*\d{2}\/\d{2}\/\d{4}/ },
  { ten: 'Đã sửa gì so với bản gốc', re: /Đã sửa:\s*\S/ },
]

// Chỉ đọc phần đầu file: khối nguồn gốc phải nằm trên cùng thì người mở file mới thấy ngay.
const SO_DONG_DAU = 40

const quet = (thuMuc, ketQua = []) => {
  let muc
  try { muc = readdirSync(thuMuc) } catch { return ketQua }
  for (const ten of muc) {
    const p = join(thuMuc, ten)
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
    const dau = docTep(f).split('\n').slice(0, SO_DONG_DAU).join('\n')
    const thieu = BAT_BUOC.filter((b) => !b.re.test(dau)).map((b) => b.ten)
    if (thieu.length === 0) continue
    tongViPham++
    console.log(`\n${f.replace(/\\/g, '/')}`)
    for (const t of thieu) console.log(`  thiếu: ${t}`)
  }
}

// Chặn "quét trúng số không": cổng xanh vì thư mục rỗng thì vô nghĩa. Ở đây thư mục RỖNG là hợp lệ
// (chưa lấy component nào về), nên chỉ báo chứ không thoát 1 — nhưng phải nói ra để không ai tưởng
// là đã kiểm được gì.
if (tongFile === 0) {
  console.log('✔ Chưa có component đi lấy về nào để kiểm.')
  console.log('  Cổng này CHƯA chứng minh được gì cả — nó chỉ chứng minh thư mục đang rỗng.')
  process.exit(0)
}

if (tongViPham > 0) {
  console.error(`\n✖ ${tongViPham}/${tongFile} file thiếu khối nguồn gốc.`)
  console.error('  Mỗi file đi lấy về phải mở đầu bằng chú thích có đủ ba dòng, ví dụ:')
  console.error('    // Nguồn: https://reactbits.dev/text-animations/count-up (biến thể JS-TW)')
  console.error('    // Ngày lấy: 23/09/2026')
  console.error('    // Đã sửa: đổi màu sang token --color-brand-text; bọc useReducedMotion')
  console.error('  Đồ TỰ VIẾT không được để trong thư mục này — chuyển sang src/components/shared/.')
  process.exit(1)
}

console.log(`✔ ${tongFile} component đi lấy về, file nào cũng ghi rõ nguồn gốc.`)
console.log('  Lưu ý: cổng này kiểm SỰ CÓ MẶT của dòng ghi nguồn, không kiểm dòng đó có đúng không.')
console.log('  URL sai hay ngày bịa thì cổng vẫn xanh — chỗ đó vẫn phải do người kiểm.')
