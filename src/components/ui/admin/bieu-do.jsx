// Nguồn: https://ui.shadcn.com/charts/bar ("Bar Chart - Stacked + Legend" và "Bar Chart - Horizontal" — shadcn/ui, giấy phép MIT)
// Ngày lấy: 05/10/2026
// Đã sửa: TSX → JSX; dữ liệu và cấu hình chuỗi nhận qua props thay cho dữ liệu mẫu; biểu đồ chồng thêm đường nét đứt "kỳ trước" (ComposedChart + Line) và trục Y có nhãn tiền gọn; chú giải tooltip in số tiền kiểu Việt; biểu đồ ngang để hiện trục tên (bản gốc cắt còn 3 chữ) và in giá trị ở cuối thanh; cỡ chữ trục 14px (sàn đọc của màn vận hành).
//
// HAI BIỂU ĐỒ dựng bằng linh kiện `chart` của shadcn (bọc recharts — thư viện biểu đồ dự án đang dùng):
//   BieuDoCotChong — cột chồng theo thời gian, có chú giải và đường so sánh kỳ trước.
//   BieuDoNgang    — thanh ngang xếp hạng, nhãn giá trị ở cuối thanh.
// Màu chuỗi lấy từ `config[khoa].color` (biến `--color-sl-*` của màn vận hành) nên đổi theo kiểu màu đang chọn.
import { Bar, BarChart, CartesianGrid, ComposedChart, LabelList, Line, XAxis, YAxis } from 'recharts'
import { ChartContainer, ChartLegend, ChartLegendContent, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart'

// Một dòng trong tooltip: ô màu · tên chuỗi · giá trị đã định dạng.
const dongTooltip = (config, dinhDang) => (value, name, item) => (
  <>
    <span className="h-2.5 w-2.5 shrink-0 rounded-[2px]" style={{ backgroundColor: item.color }} />
    <span className="text-muted-foreground">{config[name]?.label ?? name}</span>
    <span className="ms-auto ps-4 font-mono font-medium tabular-nums text-foreground">{dinhDang(value)}</span>
  </>
)

export const BieuDoCotChong = ({ data, config, cacChuoi, khoaDuong, khoaNhan = 'label', dinhDang, dinhDangTruc, className = 'h-[320px] w-full' }) => (
  <ChartContainer config={config} className={className}>
    <ComposedChart accessibilityLayer data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
      <CartesianGrid vertical={false} />
      <XAxis dataKey={khoaNhan} tickLine={false} tickMargin={10} axisLine={false} minTickGap={12} fontSize={14} />
      <YAxis width={64} tickLine={false} axisLine={false} tickFormatter={dinhDangTruc} fontSize={14} />
      <ChartTooltip content={<ChartTooltipContent labelKey="tieuDe" formatter={dongTooltip(config, dinhDang)} />} />
      <ChartLegend content={<ChartLegendContent className="text-sm" />} />
      {cacChuoi.map((k, i) => (
        <Bar key={k} dataKey={k} stackId="a" fill={`var(--color-${k})`} maxBarSize={28} isAnimationActive={false}
          radius={i === cacChuoi.length - 1 ? [4, 4, 0, 0] : [0, 0, 0, 0]} />
      ))}
      {khoaDuong && (
        <Line dataKey={khoaDuong} type="monotone" stroke={`var(--color-${khoaDuong})`} strokeWidth={2} strokeDasharray="4 3"
          dot={false} isAnimationActive={false} connectNulls={false} />
      )}
    </ComposedChart>
  </ChartContainer>
)

// data: [{ nhan, giaTri, nhanGiaTri, fill? }]. Chiều cao theo số dòng để thanh không bị bóp.
export const BieuDoNgang = ({ data, nhanChuoi, mau = 'var(--color-chinh)', toiDa, rongNhan = 110 }) => (
  <ChartContainer config={{ giaTri: { label: nhanChuoi, color: mau } }} className="w-full" style={{ height: data.length * 44 + 8, aspectRatio: 'auto' }}>
    <BarChart accessibilityLayer data={data} layout="vertical" margin={{ left: 0, right: 128, top: 0, bottom: 0 }}>
      <XAxis type="number" dataKey="giaTri" hide domain={[0, toiDa ?? 'dataMax']} />
      <YAxis dataKey="nhan" type="category" tickLine={false} tickMargin={8} axisLine={false} width={rongNhan} fontSize={14} />
      <Bar dataKey="giaTri" fill="var(--color-giaTri)" radius={5} barSize={18} isAnimationActive={false}>
        <LabelList dataKey="nhanGiaTri" position="right" offset={8} className="fill-foreground" fontSize={14} />
      </Bar>
    </BarChart>
  </ChartContainer>
)
