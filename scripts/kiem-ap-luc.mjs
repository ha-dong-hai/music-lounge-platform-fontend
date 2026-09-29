// scripts/kiem-ap-luc.mjs
//
// CỔNG CƠ HỌC cho §9 của đặc tả: KHÔNG có con số gây áp lực giả.
//
// VÌ SAO CẦN MỘT CỔNG, KHÔNG PHẢI MỘT LỜI DẶN
// Khảo sát 11.286 website của Mathur et al. (2019) cho thấy hai loại dark pattern PHỔ BIẾN NHẤT là
// **Low-stock Message (632 lượt)** và **Countdown Timer (393 lượt)** — đúng hai thứ mà một sản phẩm
// bán vé bị cám dỗ nhất. Với một trang tổ chức theo giờ diễn thì cám dỗ này là CẤU TRÚC, không phải
// tai nạn: lúc nào cũng có một cái đồng hồ đang chạy thật để mượn cớ.
// Cơ quan quản lý đã vẽ hộ ranh giới: EU DSA Article 25 cấm false urgency (hiệu lực 17/02/2024);
// CMA phạt Ticketmaster vì giấu hai mức giá khi fan đang xếp hàng (25/09/2025).
//
// RANH GIỚI MÀ CỔNG NÀY ÁP
// Cấm là cấm **con số/câu chữ hàm ý khan hiếm mà không có tồn kho thật chống lưng**. Không cấm nói
// sự thật: "đã hết vé" khi thật sự hết là thông tin, không phải áp lực.
// Dữ liệu tồn kho theo từng hạng vé KHÔNG có trong danh sách buổi diễn, nên ở trang chủ mọi con số
// khan hiếm đều sẽ là ước lượng — tức là bịa.
//
// Chạy: npm run kiem-ap-luc
import { readdirSync, statSync } from 'node:fs'
import { docTep } from './lib/docTep.mjs'
import { join, relative } from 'node:path'

const KHU_CANH = ['src/components/home', 'src/pages/home']
const BO_QUA = ['src/components/reactbits']

// SỐ THẬT HAY BIẾN ĐỀU LÀ SỐ.
// Bản đầu của cổng này chỉ bắt chữ số viết cứng ("còn 3 vé"). Tôi thử lại bằng dạng mà code THẬT
// luôn viết — `Chỉ còn {soVeConLai} vé` — và cổng để lọt. Một cổng chỉ bắt được dạng mà không ai
// viết thì tệ hơn không có cổng: nó phát ra sự yên tâm sai. Nên mẫu dưới nhận cả `{bất kỳ biểu
// thức nào}` lẫn chữ số. Đoạn `(?:\{[^}]*\}|\d+)` trong các mẫu dưới nghĩa đúng là điều đó: "một
// chữ số, HOẶC một biểu thức {...} của JSX".
//
// VÀ MẪU PHẢI VIẾT BẰNG REGEX NGUYÊN BẢN /.../, KHÔNG DỰNG TỪ CHUỖI.
// Bản vá đầu tiên của chính chỗ này dựng mẫu bằng new RegExp(`...`). Trong chuỗi JS thì '\d' chính
// là 'd' và '\s' chính là 's', nên mẫu âm thầm biến thành /chỉs+còn/ — không khớp gì nữa, và cổng
// XANH TRỞ LẠI dù đã thủng. Chỉ có chạy đột biến mới lộ ra. Hai tầng escape lồng nhau không đáng
// mạo hiểm cho một cái cổng mà cả đặc tả dựa vào.

// Mỗi mẫu kèm lý do, để thông báo lỗi dạy được chứ không chỉ chặn.
const MAU_CAM = [
  // RANH GIỚI GIỮA KHAN HIẾM VÀ DỒI DÀO — hai câu chỉ khác nhau ở DANH TỪ:
  //   "còn 2 vé"        -> tồn kho sắp cạn, gây áp lực, và trang chủ KHÔNG có dữ liệu này  -> cấm
  //   "còn 2 buổi nữa"  -> còn nhiều thứ để xem, đếm được từ chính mảng đang hiển thị      -> cho
  // Vì vậy mẫu chỉ nổ khi con số đi kèm danh từ TỒN KHO, hoặc khi có chữ "chỉ" đứng trước — bản
  // thân chữ "chỉ" đã là khung khan hiếm rồi, bất kể danh từ nào theo sau.
  { ten: 'còn N vé / chỉ còn', re: /chỉ\s+còn|còn\s+(?:lại\s+)?(?:\{[^}]*\}|\d+)\s*(?:vé|chỗ|suất|ghế|slot)/gi,
    vi_sao: 'Low-stock message — loại dark pattern phổ biến nhất (632/11.286 site). Trang chủ không có tồn kho thật theo hạng vé.' },
  { ten: 'sắp hết / gần hết', re: /sắp\s+hết|gần\s+hết|sắp\s+cháy|cháy\s+vé/gi,
    vi_sao: 'Khan hiếm định tính cũng là khan hiếm — và cũng không có dữ liệu chống lưng.' },
  { ten: 'nhanh tay / nhanh lên / kẻo lỡ', re: /nhanh\s+tay|nhanh\s+lên|kẻo\s+lỡ|đừng\s+bỏ\s+lỡ|nhanh\s+kẻo/gi,
    vi_sao: 'Câu thúc giục thuần tuý, không mang thông tin.' },
  { ten: 'đồng hồ đếm ngược', re: /countdown|đếm\s+ngược|setInterval[^)]*(?:giây|second|remaining|conLai)/gi,
    vi_sao: 'Countdown timer — loại phổ biến thứ hai (393 lượt). Chỉ được dùng khi trỏ tới deadline CÓ THẬT và không tự đặt lại khi refresh.' },
  { ten: 'N người đang xem', re: /(?:\{[^}]*\}|\d+)\s*(?:người|khách)\s*(?:đang\s*)?(?:xem|quan\s*tâm|giữ\s*chỗ)/gi,
    vi_sao: 'Activity notification — không kiểm chứng được, và trang chủ không có dữ liệu này.' },
]

// Xoá khối chú thích /* ... */ trên TOÀN FILE, thay mọi ký tự bên trong bằng dấu cách và GIỮ
// NGUYÊN các dấu xuống dòng — nhờ vậy số dòng báo lỗi không lệch đi một dòng nào.
//
// VÌ SAO PHẢI LÀM TRÊN TOÀN FILE CHỨ KHÔNG TỪNG DÒNG:
// Bản trước bóc chú thích theo từng dòng. Với một chú thích JSX nhiều dòng — `{/* ... */}` trải
// mươi dòng, đúng kiểu codebase này viết — thì chỉ dòng MỞ và dòng ĐÓNG có dấu chú thích; các dòng
// ở giữa trông y hệt mã nguồn. Cổng đã báo lỗi oan đúng vào một đoạn chú thích giải thích vì sao
// KHÔNG được tạo áp lực giả. Một cái cổng phạt người viết chú thích sẽ dạy người ta viết ít chú
// thích đi — mà chú thích là thứ codebase này coi là tài sản.
const xoaKhoiChuThich = (vanBan) =>
  vanBan.replace(/\/\*[\s\S]*?\*\//g, (khop) => khop.replace(/[^\n]/g, ' '))

const doFile = (duongDan) => {
  const noiDung = xoaKhoiChuThich(docTep(duongDan))
  const viPham = []
  noiDung.split('\n').forEach((chu, i) => {
    // Bỏ nốt chú thích một dòng. Tài liệu ĐƯỢC PHÉP nhắc tên mẫu bị cấm để giải thích vì sao cấm.
    const sach = chu.replace(/\/\/.*$/, '')
    for (const m of MAU_CAM) {
      m.re.lastIndex = 0
      const khop = sach.match(m.re)
      if (khop) viPham.push({ dong: i + 1, ten: m.ten, tim: khop[0].trim(), vi_sao: m.vi_sao })
    }
  })
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
    for (const v of viPham) {
      console.log(`  dòng ${v.dong}: "${v.tim}"  — ${v.ten}`)
      console.log(`    ${v.vi_sao}`)
    }
  }
}

// Chặn "quét trúng số không": cổng xanh vì không tìm thấy file nào thì vô nghĩa.
if (tongFile === 0) {
  console.error('\n✖ Không quét được file nào. Kiểm lại KHU_CANH.')
  process.exit(1)
}

if (tongViPham > 0) {
  console.error(`\n✖ ${tongViPham} chỗ tạo áp lực giả (đã quét ${tongFile} file).`)
  console.error('  Luật: docs/design/DAC-TA-TRANG-CHU.md §9.')
  console.error('  Muốn nói khan hiếm thì phải có tồn kho THẬT của đúng hạng vé tại đúng thời điểm.')
  console.error('  Không có dữ liệu thì không hiện gì — đừng ước lượng.')
  process.exit(1)
}

console.log(`✔ ${tongFile} file, không có con số gây áp lực giả nào.`)
console.log('  Lưu ý: cổng này bắt MẪU CHỮ. Nó không chứng minh được một con số có thật hay không —')
console.log('  "còn 3 vé" lấy từ tồn kho thật vẫn phải do người xác nhận.')
