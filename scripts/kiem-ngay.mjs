// scripts/kiem-ngay.mjs
//
// CỔNG CƠ HỌC cho §9 của yêu cầu thiết kế: mọi chuỗi ngày/giờ hiển thị phải đi qua
// `src/utils/ngayVietNam.js`, không gọi thẳng `dayjs(...).format(...)` trong component.
//
// VÌ SAO CẦN CỔNG
// [ĐO] Trước khi có cổng này, riêng khu trang chủ đã có 13 chỗ gọi `.format(` rải trên 8 file, với
// ít nhất ba cách viết ngày khác nhau: 'DD/MM', 'DD/MM/YYYY', 'HH:mm, DD/MM/YYYY'. Mỗi chỗ tự định
// dạng là mỗi chỗ có thể lệch, và lệch ngày tháng thì người dùng tới nhầm hôm — loại lỗi không làm
// vỡ gì cả nên không ai thấy.
// Nguy hiểm nhất là 'MM/DD' kiểu Mỹ: "03/09" đọc thành 9 tháng 3 thì khách lỡ đêm diễn.
//
// KIỂU BÁNH CÓC, KHÔNG PHẢI QUÉT TẤT
// Ép cả 8 file ngay một lúc là một đợt sửa lớn chạm vào cả những khối cũ sắp bị bỏ. Nên cổng này
// chỉ canh những vùng ĐÃ DỌN — giống `kiem-token` đang làm. Vùng nào đã xanh thì không bao giờ
// được đỏ lại. Dọn thêm file nào thì thêm tên file đó vào KHU_CANH, không sửa phần còn lại.
//
// Chạy: npm run kiem-ngay
import { statSync } from 'node:fs'
import { docTep } from './lib/docTep.mjs'

// Vùng đã dọn. CHỈ THÊM, không bao giờ bớt — bớt một dòng ở đây là cho phép một vùng đã sạch bẩn lại.
const KHU_CANH = [
  'src/pages/home/HomePage.jsx',
  // 30/09: bốn file trang chủ cũ (MangSet, ChuongTrinhDemNay, DongBuoiDien, NhungDemSapToi) đã XOÁ cùng thế giới
  // cũ; phần canh CHUYỂN sang các linh kiện thay chỗ chúng — không phải bớt khu canh.
  'src/components/program/BangGioDien.jsx',
  'src/components/program/LichTuanNay.jsx',
  'src/components/program/PhongTraTrenSan.jsx',
  'src/components/program/CuongVeCamKet.jsx',
  'src/components/program/KyTuLat.jsx',
  'src/components/program/DauMoc.jsx',
]

// `.format(` của dayjs. Bắt cả `dayjs(x).format(`, `t.format(`, `homNay.format(`.
// Cố ý KHÔNG cố phân biệt dayjs với thứ khác: trong khu vực này không có API nào khác tên `.format(`,
// và một cổng bắt hơi rộng thì sửa mất một phút, còn một cổng bắt hụt thì không ai biết là đã hụt.
const MAU = /\.format\s*\(/g

const doFile = (duongDan) => {
  const noiDung = docTep(duongDan)
    // Bỏ khối chú thích trên TOÀN FILE, thay bằng dấu cách và giữ nguyên xuống dòng để số dòng báo
    // lỗi không lệch. Làm từng dòng thì chú thích JSX nhiều dòng sẽ lọt — bài học đã trả giá ở
    // scripts/kiem-ap-luc.mjs.
    .replace(/\/\*[\s\S]*?\*\//g, (khop) => khop.replace(/[^\n]/g, ' '))
  const viPham = []
  noiDung.split('\n').forEach((chu, i) => {
    const sach = chu.replace(/\/\/.*$/, '')
    MAU.lastIndex = 0
    if (MAU.test(sach)) viPham.push({ dong: i + 1, chu: sach.trim().slice(0, 90) })
  })
  return viPham
}

let tongViPham = 0
let tongFile = 0
for (const f of KHU_CANH) {
  try { statSync(f) } catch {
    // File trong danh sách mà không còn trên đĩa: hoặc đã đổi tên, hoặc đã xoá. Im lặng bỏ qua thì
    // vùng canh teo dần mà không ai biết — nên báo lỗi để người sửa phải quyết định.
    console.error(`\n✖ KHU_CANH trỏ tới file không tồn tại: ${f}`)
    console.error('  Đổi tên thì sửa danh sách; xoá hẳn thì bỏ dòng đó VÀ ghi lý do trong commit.')
    process.exit(1)
  }
  tongFile++
  const viPham = doFile(f)
  if (viPham.length === 0) continue
  tongViPham += viPham.length
  console.log(`\n${f}`)
  for (const v of viPham) console.log(`  dòng ${v.dong}: ${v.chu}`)
}

// Chặn "quét trúng số không".
if (tongFile === 0) {
  console.error('\n✖ Không quét được file nào. Kiểm lại KHU_CANH.')
  process.exit(1)
}

if (tongViPham > 0) {
  console.error(`\n✖ ${tongViPham} chỗ gọi thẳng .format() (đã quét ${tongFile} file).`)
  console.error('  Luật: docs/design/YEU-CAU-THIET-KE-LAI-TRANG-CHU.md §9.')
  console.error('  Dùng hàm trong src/utils/ngayVietNam.js: thuVietHoa · nhanNgay · ngayGon ·')
  console.error('  gioTrongNgay · ngayDayDu · khoaNgay. Thiếu kiểu nào thì THÊM HÀM ở đó, đừng')
  console.error('  định dạng tại chỗ — mỗi chỗ tự định dạng là một chỗ có thể lệch.')
  process.exit(1)
}

console.log(`✔ ${tongFile} file, không có chỗ nào tự định dạng ngày giờ.`)
console.log('  Lưu ý: cổng này canh theo DANH SÁCH, không quét cả dự án. Ngoài KHU_CANH vẫn còn')
console.log('  chỗ gọi thẳng .format() — dọn tới đâu thì thêm vào danh sách tới đó.')
