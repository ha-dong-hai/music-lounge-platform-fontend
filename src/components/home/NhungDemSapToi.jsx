// src/components/home/NhungDemSapToi.jsx
//
// PHẦN THỨ HAI CỦA TỜ CHƯƠNG TRÌNH — xem docs/design/DAC-TA-TRANG-CHU.md §4.
//
// VÌ SAO KHỐI NÀY THAY CHO CÁC BĂNG CHUYỀN THỂ LOẠI
// Bản trước, ngay dưới "chương trình đêm nay" là hai băng chuyền ngang "Thể loại X", "Thể loại Y".
// Tức là trang đi được hai phần ba đường theo trục THỜI GIAN rồi đột ngột nhảy sang trục THỂ LOẠI,
// và quay lại đúng ngôn ngữ kho thẻ mà đặc tả §4 đã bác. Câu hỏi thật của người vừa đọc xong
// chương trình đêm nay không phải "còn thể loại nào nữa", mà là **"đêm nay tôi bận thì hôm nào
// có gì?"**. Khối này trả lời đúng câu đó, và giữ nguyên một trục duy nhất từ đầu trang tới cuối.
// Thể loại vẫn còn lối vào, nhưng lui về một bảng mục lục gọn ở cuối trang.
//
// CÙNG MỘT DÒNG BUỔI DIỄN, KHÁC MỐC
// Dùng lại đúng <DongBuoiDien> của khối đêm nay — đặc tả §4 chốt "đồng nhất ở tầng primitive, khác
// biệt ở tầng phân cấp": cùng một loại dòng, nhưng mốc bên trái đổi từ GIỜ sang NGÀY, vì ở tầm vài
// ngày thì đơn vị người ta nghĩ là ngày chứ không phải giờ.
//
// GIỚI HẠN CÓ CHỦ ĐÍCH
// Chỉ trải vài ngày đầu. Trang chủ không phải trang lịch đầy đủ; trải hết là biến nó thành một cuộn
// vô tận, và lúc đó chẳng ngày nào còn nổi bật. Hết phần trải là một lối đi rõ ràng sang trang lịch.
import { Link } from 'react-router-dom'
import dayjs from 'dayjs'
import { ArrowRight } from 'lucide-react'
import DongBuoiDien from './DongBuoiDien'
import Skeleton from '../shared/Skeleton'
import { nhanNgay, ngayGon, khoaNgay } from '../../utils/ngayVietNam'

// Số NGÀY được trải đầy đủ, và số buổi diễn tối đa trải trong mỗi ngày.
// Đổi trải nhiều/ít thì sửa đúng hai con số này, không phải sửa JSX.
const SO_NGAY_TRAI = 3
const SO_BUOI_MOI_NGAY = 3

// Gom buổi diễn theo NGÀY LỊCH, bỏ phần của hôm nay (đã nằm ở khối "chương trình đêm nay" — hiện
// lại ở đây là nói cùng một điều hai lần, và người đọc sẽ tưởng là hai buổi khác nhau).
const gomTheoNgay = (ds, moc = dayjs()) => {
  const hetHomNay = dayjs(moc).endOf('day')
  const theoNgay = new Map()
  for (const ev of ds) {
    const t = dayjs(ev.start_date)
    if (!t.isValid() || !t.isAfter(hetHomNay)) continue
    const khoa = khoaNgay(t)
    if (!theoNgay.has(khoa)) theoNgay.set(khoa, [])
    theoNgay.get(khoa).push(ev)
  }
  return [...theoNgay.entries()]
    .sort((a, b) => a[0].localeCompare(b[0]))
    .map(([khoa, dsBuoi]) => ({
      khoa,
      nhan: nhanNgay(khoa, moc),
      ngay: ngayGon(khoa),
      tong: dsBuoi.length,
      buoi: dsBuoi
        .sort((a, b) => dayjs(a.start_date).valueOf() - dayjs(b.start_date).valueOf())
        .slice(0, SO_BUOI_MOI_NGAY),
    }))
}

const NhungDemSapToi = ({ events, dangTai = false, daDangNhap = false }) => {
  // ĐANG TẢI — khung xương đúng hình dạng thật để trang không nhảy khi dữ liệu về.
  if (dangTai) {
    return (
      <div className="space-y-8">
        {[...Array(2)].map((_, i) => (
          <div key={i} className="grid grid-cols-[76px_1fr] sm:grid-cols-[112px_1fr] gap-4 sm:gap-8">
            <div className="space-y-2">
              <Skeleton className="h-5 w-16" />
              <Skeleton className="h-3 w-12" />
            </div>
            <div className="grid grid-cols-[88px_1fr] sm:grid-cols-[132px_1fr] gap-4 sm:gap-6">
              <Skeleton className="aspect-[4/3] rounded-md" />
              <div className="space-y-2 pt-1">
                <Skeleton className="h-3 w-24" />
                <Skeleton className="h-5 w-3/4" />
                <Skeleton className="h-3 w-1/2" />
              </div>
            </div>
          </div>
        ))}
      </div>
    )
  }

  const ngayKe = gomTheoNgay(events ?? [])

  // TRỐNG — không dựng một hộp thông báo thứ hai. Khối "chương trình đêm nay" ngay phía trên đã tự
  // lo trạng thái trống của nó và đã có lối đi; thêm một hộp "chưa có đêm nào sắp tới" nữa chỉ làm
  // trang toàn hộp báo trống.
  if (ngayKe.length === 0) return null

  const trai = ngayKe.slice(0, SO_NGAY_TRAI)

  return (
    <ol className="space-y-9">
      {trai.map(({ khoa, nhan, ngay, tong, buoi }) => (
        <li key={khoa} className="grid grid-cols-[76px_1fr] sm:grid-cols-[112px_1fr] gap-4 sm:gap-8">
          {/* Mốc ngày dính lại khi cuộn, cùng thủ pháp với mốc giờ của khối đêm nay. */}
          <div className="sticky top-24 self-start">
            <p className="font-display text-xl sm:text-2xl font-semibold tracking-tight text-brand-text leading-tight">
              {nhan}
            </p>
            <p className="text-xs text-ink-mute tabular-nums mt-0.5">{ngay}</p>
          </div>
          <div>
            {buoi.map((ev) => (
              <DongBuoiDien key={ev.id} ev={ev} daDangNhap={daDangNhap} daCoVe={Boolean(ev.userHasTicket)} />
            ))}
            {/* Nói thật là ngày này còn buổi diễn chưa trải hết. Đây là con số ĐẾM ĐƯỢC từ chính
                dữ liệu đang có, không phải con số khan hiếm — xem đặc tả §9 để thấy ranh giới:
                cấm là cấm con số hàm ý "nhanh không hết", không phải cấm mọi con số. */}
            {tong > buoi.length && (
              <p className="pt-3 text-sm text-ink-mute">
                <Link to="/shows" className="text-brand-text font-medium hover:underline">
                  Còn {tong - buoi.length} buổi nữa trong ngày này
                </Link>
              </p>
            )}
          </div>
        </li>
      ))}

      {/* Lối đi khi hết phần trải. */}
      <li className="pt-1">
        <Link to="/shows"
          className="inline-flex items-center gap-2 min-h-[44px] text-sm font-semibold text-brand-text hover:underline">
          Xem toàn bộ lịch diễn <ArrowRight size={15} aria-hidden="true" />
        </Link>
      </li>
    </ol>
  )
}

export default NhungDemSapToi
