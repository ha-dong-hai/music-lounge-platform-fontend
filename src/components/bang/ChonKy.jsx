// src/components/bang/ChonKy.jsx
//
// BỘ CHỌN KỲ BÁO CÁO cho các trang phân tích Admin (MLACP-595). Một nút ghi rõ kỳ đang xem; bấm mở khung có danh sách
// khoảng định sẵn bên trái và lịch hai tháng bên phải — cách Shopify Analytics và Stripe Dashboard làm.
//
// THƯ VIỆN, không tự viết:
//  - Khung bật: Radix Popover (cùng họ với Radix Dialog đang dùng ở HopThoai) — tự lo focus vào trong, Esc/bấm ra ngoài
//    đóng, trả focus về nút, gắn aria-expanded/aria-controls, tự lật khi sát mép màn.
//  - Lịch: react-day-picker chế độ range (lưới ngày ARIA, phím mũi tên, nhãn tiếng Việt), hình thức dùng chung lopLich.js.
// Chọn khoảng định sẵn là áp dụng ngay; chọn trên lịch thì phải bấm "Áp dụng" (chọn hai đầu mới thành khoảng — áp ngay sau
// cú bấm đầu sẽ tải số liệu của một ngày lẻ mà người dùng không định xem). Không cho chọn ngày sau hôm nay.
import { useState } from 'react'
import * as Popover from '@radix-ui/react-popover'
import { DayPicker } from 'react-day-picker'
import { vi } from 'react-day-picker/locale'
import dayjs from 'dayjs'
import { CalendarDays, ChevronDown } from 'lucide-react'
import { LOP } from '../program/lopLich'
import { KHOANG_DINH_SAN, khoaDinhSanKhop, nhanKhoang, tinhKhoang } from '../../utils/kyBaoCao'

const LOP_HAI_THANG = { ...LOP, months: 'relative flex flex-col sm:flex-row gap-6' }

const ChonKy = ({ tu, den, onChon }) => {
  const [mo, setMo] = useState(false)
  const [nhap, setNhap] = useState(undefined) // khoảng đang chọn dở trên lịch: { from, to }
  // Màn hẹp chỉ hiện MỘT tháng: hai tháng xếp dọc dài hơn màn điện thoại, nút Áp dụng rơi xuống dưới mép (đo 390x844).
  // Đo lúc mở khung là đủ — không cần nghe thay đổi cỡ màn khi khung đang mở.
  const [soThang, setSoThang] = useState(2)
  const khoaKhop = khoaDinhSanKhop(tu, den)
  const tenKhoang = KHOANG_DINH_SAN.find((k) => k.khoa === khoaKhop)?.nhan
  const homNay = dayjs().endOf('day').toDate()

  const doiMo = (m) => {
    setMo(m)
    if (m) {
      setNhap({ from: dayjs(tu).toDate(), to: dayjs(den).toDate() })
      setSoThang(window.matchMedia('(min-width: 640px)').matches ? 2 : 1)
    }
  }
  const chonDinhSan = (khoa) => { onChon(tinhKhoang(khoa)); setMo(false) }
  const apDung = () => {
    if (!nhap?.from) return
    const to = nhap.to ?? nhap.from
    onChon({ tu: dayjs(nhap.from).format('YYYY-MM-DD'), den: dayjs(to).format('YYYY-MM-DD') })
    setMo(false)
  }

  return (
    <Popover.Root open={mo} onOpenChange={doiMo}>
      <Popover.Trigger asChild>
        <button type="button" aria-label={`Kỳ báo cáo: ${tenKhoang ? `${tenKhoang}, ` : ''}${nhanKhoang(tu, den)}. Bấm để đổi`}
          className="inline-flex items-center gap-2 min-h-[44px] px-4 border-2 border-ink bg-card text-sm font-semibold hover:bg-sunken">
          <CalendarDays size={16} aria-hidden="true" />
          {tenKhoang && <span>{tenKhoang}</span>}
          <span className={`font-mono tabular-nums ${tenKhoang ? 'text-ink-soft font-normal' : ''}`}>{nhanKhoang(tu, den)}</span>
          <ChevronDown size={14} aria-hidden="true" />
        </button>
      </Popover.Trigger>
      <Popover.Portal>
        <Popover.Content align="start" sideOffset={6} collisionPadding={16}
          className="z-[90] bg-card border-2 border-ink shadow-lift p-4 w-[min(calc(100vw-2rem),53rem)] max-h-[var(--radix-popover-content-available-height)] overflow-y-auto focus:outline-none">
          <div className="flex flex-col md:flex-row gap-5">
            <div className="md:w-40 flex-shrink-0">
              <p id="ky-dinh-san" className="text-xs font-semibold text-ink-soft mb-2">Khoảng có sẵn</p>
              <ul aria-labelledby="ky-dinh-san" className="grid grid-cols-2 md:grid-cols-1 gap-1">
                {KHOANG_DINH_SAN.map((k) => (
                  <li key={k.khoa}>
                    <button type="button" onClick={() => chonDinhSan(k.khoa)} aria-pressed={k.khoa === khoaKhop}
                      className={`w-full text-left min-h-[44px] px-3 text-sm border-l-4 ${k.khoa === khoaKhop ? 'bg-ink text-lamp border-ember font-semibold' : 'border-transparent hover:bg-sunken'}`}>
                      {k.nhan}
                    </button>
                  </li>
                ))}
              </ul>
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-semibold text-ink-soft mb-2">Hoặc chọn trên lịch</p>
              <DayPicker mode="range" locale={vi} weekStartsOn={1} numberOfMonths={soThang}
                selected={nhap}
                // Khoảng đang đủ hai đầu mà bấm thêm một ngày → BẮT ĐẦU khoảng mới từ ngày đó (cách Shopify/Stripe làm).
                // Mặc định của thư viện là kéo dài/thu ngắn khoảng cũ, người dùng khó đoán đầu nào sẽ đổi. Mới có một đầu
                // thì ngày bấm tiếp theo là đầu còn lại, tự xếp trước–sau.
                onSelect={(_, ngayBam) => setNhap((cu) => {
                  if (!cu?.from || cu.to) return { from: ngayBam, to: undefined }
                  return ngayBam < cu.from ? { from: ngayBam, to: cu.from } : { from: cu.from, to: ngayBam }
                })}
                defaultMonth={dayjs(den).subtract(soThang - 1, 'month').toDate()}
                endMonth={homNay} disabled={{ after: homNay }}
                // Nhãn tiếng Việt mặc định của nút điều hướng là "Tháng trước" — trùng tên khoảng định sẵn bên trái, trình
                // đọc màn hình nghe hai nút cùng tên làm hai việc khác nhau. Đặt lại cho rõ là lật lịch.
                labels={{ labelPrevious: () => 'Lật lịch về tháng trước', labelNext: () => 'Lật lịch sang tháng sau' }}
                classNames={LOP_HAI_THANG} />
              {/* Dính đáy khung: lịch dài hơn khoảng trống thì cuộn bên trong, hàng nút vẫn luôn thấy. */}
              <div className="sticky bottom-0 -mb-4 pb-4 bg-card mt-3 flex flex-wrap items-center justify-between gap-3 border-t border-line pt-3">
                <p className="text-sm text-ink-soft" aria-live="polite">
                  {nhap?.from ? nhanKhoang(dayjs(nhap.from).format('YYYY-MM-DD'), dayjs(nhap.to ?? nhap.from).format('YYYY-MM-DD')) : 'Chưa chọn ngày'}
                </p>
                <div className="flex gap-2">
                  <Popover.Close asChild>
                    <button type="button" className="min-h-[44px] px-4 border-2 border-ink text-sm font-semibold hover:bg-sunken">Huỷ</button>
                  </Popover.Close>
                  <button type="button" onClick={apDung} disabled={!nhap?.from}
                    className="min-h-[44px] px-4 bg-ink text-lamp text-sm font-semibold hover:bg-board disabled:opacity-40">Áp dụng</button>
                </div>
              </div>
            </div>
          </div>
        </Popover.Content>
      </Popover.Portal>
    </Popover.Root>
  )
}

export default ChonKy
