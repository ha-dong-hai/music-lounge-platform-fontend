// src/components/home/TonightStrip.jsx
//
// GHI CHÚ CHO ĐỘI FE — vì sao khối này tồn tại (docs/design/TRANG-CHU-BRIEF.md):
// - Đây là công năng chính của trang chủ (duyệt xem tối nay/tuần này có gì), nên đặt NGAY dưới
//   hero, không chôn dưới các khối marketing. Người mua vé cần thấy lịch thật trước, không phải
//   đọc thương hiệu trước.
// - Dữ liệu lọc từ `events` đã fetch sẵn ở HomePage (không gọi API riêng) — chỉ lấy show có
//   scheduledStart trong 7 ngày tới, sắp theo thời gian gần nhất. Không có show nào trong khung đó
//   thì ẩn cả khối, không hiện "chưa có gì" cho đẹp đội hình.
// - Thẻ có ảnh thật (không phải chỉ chữ) — trước đây bản đầu bỏ ảnh cho gọn, người dùng phản hồi
//   là "toàn chữ, không trực quan", nên giữ ảnh nhỏ 16:9 ở đầu mỗi thẻ.
import { Link } from 'react-router-dom'
import dayjs from 'dayjs'
import { CalendarDays, MapPin } from 'lucide-react'
import Reveal from '../shared/Reveal'
import CoverFallback from '../shared/CoverFallback'

const TonightStrip = ({ events = [] }) => {
  const byTime = (a, b) => dayjs(a.start_date).valueOf() - dayjs(b.start_date).valueOf()
  const notYetOver = events
    .filter(e => dayjs(e.start_date).isValid() && dayjs(e.start_date).isAfter(dayjs().subtract(1, 'hour')))
    .sort(byTime)

  // Có show trong 7 ngày tới thì gọi đúng là "Tối nay & tuần này". Không có thì KHÔNG ẩn cả khối
  // (người dùng vào trang sẽ thấy thiếu mục, không biết sắp có gì) mà rơi về các đêm diễn gần nhất
  // và đổi tiêu đề thành "Sắp diễn ra" — nhãn phải khớp với dữ liệu đang hiện, không nói quá.
  const trongTuan = notYetOver.filter(e => dayjs(e.start_date).isBefore(dayjs().add(7, 'day')))
  const laTrongTuan = trongTuan.length > 0
  const upcoming = (laTrongTuan ? trongTuan : notYetOver).slice(0, 4)

  if (upcoming.length === 0) return null

  return (
    <section>
      <div className="flex items-end justify-between mb-4 sm:mb-6">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.15em] text-brand-text mb-1">Lịch diễn cập nhật thời gian thực</p>
          <h2 className="font-display text-xl sm:text-2xl font-semibold text-ink">
            {laTrongTuan ? 'Tối nay & tuần này tại các phòng trà' : 'Sắp diễn ra tại các phòng trà'}
          </h2>
        </div>
        <p className="hidden sm:block text-sm text-ink-mute italic">
          {laTrongTuan ? 'Hiển thị các đêm diễn từ hôm nay đến Chủ Nhật' : 'Các đêm diễn gần nhất đang mở bán'}
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {upcoming.map((ev, i) => (
          <Reveal key={ev.id} delay={i * 70} as={Link} to={`/shows/${ev.id}`}
            className="group block rounded-xl border border-line bg-card overflow-hidden hover:border-line-strong transition-colors">
            <div className="relative aspect-video overflow-hidden">
              {ev.thumbnail ? (
                <img src={ev.thumbnail} alt="" className="w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-105" loading="lazy" />
              ) : (
                <CoverFallback className="w-full h-full" />
              )}
            </div>
            <div className="p-3.5">
              <div className="flex items-center gap-1.5 text-xs text-ink-mute mb-1.5">
                <CalendarDays size={12} className="flex-shrink-0" />
                <span>{dayjs(ev.start_date).format('HH:mm · dddd, DD/MM')}</span>
              </div>
              <h3 className="font-semibold text-sm text-ink leading-snug line-clamp-2 mb-1 group-hover:text-brand-text transition-colors">
                {ev.title}
              </h3>
              {ev.loungeName && (
                <p className="flex items-center gap-1 text-xs text-ink-mute mb-2">
                  <MapPin size={11} className="flex-shrink-0" />
                  <span className="truncate">{ev.loungeName}</span>
                </p>
              )}
              <p className="text-sm font-semibold text-brand-text">Từ {ev.price}</p>
            </div>
          </Reveal>
        ))}
      </div>
    </section>
  )
}

export default TonightStrip
