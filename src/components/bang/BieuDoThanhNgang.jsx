// src/components/bang/BieuDoThanhNgang.jsx
//
// BIỂU ĐỒ THANH NGANG DÙNG CHUNG cho trang số liệu (04/10/2026). Dựng bằng recharts (thư viện đã có trong dự án) — chủ dự án:
// "được thì dùng thư viện, đừng tự code"; bản trước tự vẽ thanh bằng div/svg ở bốn chỗ, bốn kiểu.
//
// Cách đọc (luật Q5 — reports/Trang quản trị - rà soát thị giác và luật trình bày số liệu.md, repo backend):
//  - Độ lớn = độ dài thanh, trục bắt đầu từ 0 (NN/g Dashboards; GOV.UK: baseline từ 0).
//  - NHÃN TRỰC TIẾP NẰM TRÊN THANH: tên bên trái, giá trị bên phải, thanh ngay dưới (Datawrapper: direct labels; kiểu nhãn
//    trên thanh cho tên dài). Bản đầu đặt tên/giá trị ở hai trục trái/phải bề rộng cố định: ở 390px hai cột chữ ăn hết chỗ,
//    thanh co về 0 và chữ chồng lên nhau (đo 04/10). Nhãn trên thanh không phụ thuộc bề rộng nên không còn lỗi đó.
//    Nhãn vẽ qua prop `content` của LabelList — điểm mở rộng recharts có tài liệu, không tự dựng biểu đồ.
//  - Màu: mặc định mực; mục `mo` (mốc so sánh, phần phụ) tô nhạt — nhấn một thứ thì phần còn lại xám, không thêm sắc mới.
//  - `hoaVan` trên mục: tô bằng mẫu sọc khai báo trong <defs> (recharts cho phép phần tử SVG tuỳ biến trong biểu đồ).
//
// Props:
//  data: [{ khoa, nhan, giaTri, nhanGiaTri, mo?, mau?, hoaVan? }]
//  toiDa: giá trị ứng với hết chiều dài (vd 100 cho phần trăm, 5 cho thang điểm); bỏ trống = giá trị lớn nhất
//  mau: mã hex màu thanh mặc định của cả biểu đồ (lấy từ mauSoLieu[..].hex); mục `mo` vẫn xám
//  moTa: câu cho trình đọc màn hình (mặc định ghép "tên: giá trị")
import { useId, useState } from 'react'
import { BarChart, Bar, Cell, XAxis, YAxis, LabelList, ResponsiveContainer } from 'recharts'

const MUC = '#231A15'      // = --color-ink
const MUC_NHAT = '#9A8B7C' // = --color-chart-3
const RANH = '#EDE6DB'     // = --color-sunken — nền rãnh sau thanh
const NEN = '#FBF8F3'      // = --color-card
const CHU = '#231A15'      // = --color-ink
const CHU_PHU = '#4A3F37'  // = --color-ink-soft

const CAO_HANG = 46 // 20px dòng chữ + 12px thanh + khoảng cách
const DAY_THANH = 12

const BieuDoThanhNgang = ({ data, toiDa, moTa, mau }) => {
  const id = useId().replace(/:/g, '')
  const [rong, setRong] = useState(0)
  const max = toiDa ?? Math.max(1, ...data.map((d) => d.giaTri))
  const fill = (d) => (d.hoaVan ? `url(#${id}-${d.khoa})` : d.mau ?? (d.mo ? MUC_NHAT : mau ?? MUC))

  // Nhãn trên thanh: `x`, `y` là góc trên-trái của thanh (recharts truyền vào). Giá trị căn phải theo bề rộng vùng vẽ.
  const nhanTen = ({ x, y, index }) => (
    <text x={x} y={y - 6} fill={CHU} fontSize={14}>{data[index]?.nhan}</text>
  )
  const nhanSo = ({ y, index }) => (
    <text x={rong} y={y - 6} fill={CHU_PHU} fontSize={14} fontWeight={600} textAnchor="end">{data[index]?.nhanGiaTri}</text>
  )

  return (
    <div role="img" aria-label={moTa ?? data.map((d) => `${d.nhan}: ${d.nhanGiaTri}`).join('; ')}
      style={{ height: data.length * CAO_HANG + 6 }}>
      <ResponsiveContainer width="100%" height="100%" onResize={(w) => setRong(w)}>
        <BarChart data={data} layout="vertical" margin={{ top: 22, right: 0, bottom: 0, left: 0 }}
          barSize={DAY_THANH} barCategoryGap={CAO_HANG - DAY_THANH}>
          <defs>
            {data.filter((d) => d.hoaVan).map((d) => (
              <pattern key={d.khoa} id={`${id}-${d.khoa}`} width="6" height="6" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
                <rect width="6" height="6" fill={NEN} />
                <rect width="3.5" height="6" fill={d.mau ?? MUC} />
              </pattern>
            ))}
          </defs>
          <XAxis type="number" hide domain={[0, max]} />
          <YAxis type="category" dataKey="nhan" hide />
          <Bar dataKey="giaTri" isAnimationActive={false} background={{ fill: RANH }}>
            {data.map((d) => <Cell key={d.khoa} fill={fill(d)} stroke={d.hoaVan ? d.mau ?? MUC : 'none'} />)}
            <LabelList dataKey="nhan" content={nhanTen} />
            {rong > 0 && <LabelList dataKey="nhanGiaTri" content={nhanSo} />}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}

export default BieuDoThanhNgang
