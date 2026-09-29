// scripts/kiem-gsap.mjs
//
// CỔNG CƠ HỌC cho §11: sau khi chuyển xong tầng chuyển động, `gsap` không được còn dấu vết nào
// trong `src/`.
//
// CỔNG NÀY CỐ Ý ĐỎ NGAY TỪ ĐẦU — nó là ĐỊNH NGHĨA HOÀN THÀNH của việc chuyển, không phải một luật
// đang được giữ. Khi nó xanh lần đầu, đó chính là lúc được phép gỡ `gsap` và `@gsap/react` khỏi
// package.json. Vì vậy nó KHÔNG nằm trong `npm run kiem-thiet-ke` cho tới khi chuyển xong.
//
// VÌ SAO LÀ MỘT CỔNG CHỨ KHÔNG PHẢI MỘT VIỆC TRONG DANH SÁCH
// [CHỦ DỰ ÁN CHỐT 23/09] framer-motion là tầng chuyển động duy nhất. Nhưng react-bits có hơn 200
// component và phần lớn viết bằng GSAP; lấy về một cái là GSAP lặng lẽ quay lại, và lúc đó dự án
// nuôi hai thư viện chuyển động cho cùng một việc mà không ai để ý. Cổng này chặn đúng đường đó.
//
// TRÌNH TỰ GỠ, LÀM SAI LÀ VỠ TRANG:
//   1. thay ScrollFloat trong SectionTitle.jsx   2. thay/bỏ SplitText trong HeroBanner.jsx
//   3. cổng này xanh                              4. LÚC ĐÓ mới gỡ gói khỏi package.json
//
// Chạy: npm run kiem-gsap
import { readFileSync, readdirSync, statSync } from 'node:fs'
import { join } from 'node:path'

const GOC = 'src'
const MAU = /\bgsap\b|@gsap\/react|ScrollTrigger|useGSAP/

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

const dsFile = quet(GOC)
// Chặn "quét trúng số không": cổng xanh vì không tìm thấy file nào thì vô nghĩa.
if (dsFile.length === 0) {
  console.error('\n✖ Không quét được file nào trong src/. Kiểm lại đường dẫn.')
  process.exit(1)
}

const conLai = []
for (const f of dsFile) {
  const noiDung = readFileSync(f, 'utf8')
    .replace(/\/\*[\s\S]*?\*\//g, (k) => k.replace(/[^\n]/g, ' '))
  noiDung.split('\n').forEach((chu, i) => {
    const sach = chu.replace(/\/\/.*$/, '')
    if (MAU.test(sach)) conLai.push({ file: f.replace(/\\/g, '/'), dong: i + 1, chu: sach.trim().slice(0, 80) })
  })
}

if (conLai.length > 0) {
  console.error(`\n✖ Còn ${conLai.length} dòng tham chiếu gsap trong ${dsFile.length} file đã quét:\n`)
  for (const v of conLai) console.error(`  ${v.file}:${v.dong}  ${v.chu}`)
  console.error('\n  Đây là việc CHƯA XONG của bước 4 trong docs/design/YEU-CAU-THIET-KE-LAI-TRANG-CHU.md §16,')
  console.error('  không phải một lỗi mới phát sinh. Cổng xanh = được phép gỡ gsap khỏi package.json.')
  process.exit(1)
}

console.log(`✔ ${dsFile.length} file, không còn dấu vết gsap nào.`)
console.log('  GIỜ mới được gỡ "gsap" và "@gsap/react" khỏi package.json, rồi chạy lại npm install.')
console.log('  Lưu ý: cổng này quét MÃ NGUỒN. Nó không kiểm package.json — gói vẫn có thể còn nằm đó.')
