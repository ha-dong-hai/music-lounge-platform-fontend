// src/components/mshow-detail/ShowIntro.jsx
//
// TỜ CHƯƠNG TRÌNH CỦA MỘT ĐÊM — tab "Chi tiết" của trang buổi diễn (và của trang duyệt buổi diễn phía Admin).
//
// Làm lại 30/09 theo thế giới "tờ chương trình ca nhạc" (DESIGN.md). Khác bản cũ ở ba điểm có lý do:
//  1. LINE-UP CÓ GIỜ: dữ liệu có sẵn setTime + orderIndex + role của từng tiết mục, bản cũ chỉ in tên. Khán giả của
//     phòng trà hỏi "mấy giờ ca sĩ tôi thích lên" — đó là nội dung chính của một tờ chương trình.
//  2. CHÍNH SÁCH HOÀN VÉ in ngay ở đây, dùng NGUYÊN VĂN câu `refundPolicy.summary` của backend — frontend không tự
//     diễn đạt lại lời hứa về tiền (diễn đạt lại là có thể hứa khác đi).
//  3. BỎ ảnh đại diện lấy từ api.dicebear.com: gọi sang dịch vụ ngoài mỗi lần mở trang, và vòng tròn chữ cái nền xanh
//     lục không thuộc thế giới này. 03/10/2026: line-up in thành ảnh Polaroid (ảnh thật hoặc ô "Chưa có ảnh" của trang,
//     CoverFallback) — 02/10 chủ dự án: chỉ in tên thì line-up toàn chữ, kém trực quan.
//
// Dùng chung cho hai trang nên mọi trường mới đều có dự phòng: `data.tags ?? data.moodTags`, nút Theo dõi chỉ hiện khi
// trang truyền `onToggleFollow` (trang Admin không truyền).
import { Link } from 'react-router-dom'
import { Check, Plus } from 'lucide-react'
import DauMoc from '../program/DauMoc'
import CoverFallback from '../shared/CoverFallback'
import BangLenSanKhau from './BangLenSanKhau'

const VAI = { Main: 'Hát chính', Guest: 'Khách mời', Host: 'Dẫn chương trình' }
const XOAY_ANH = ['-rotate-2', 'rotate-[1.5deg]', '-rotate-1', 'rotate-2'] // nghiêng cố định theo vị trí tấm ảnh
const gioTietMuc = (setTime) => (typeof setTime === 'string' && setTime.length >= 5 ? setTime.slice(0, 5) : null)

const Muc = ({ nhan, children }) => (
  <div className="py-4 border-b border-ink/20 last:border-b-0">
    <dt className="text-sm text-ink-mute">{nhan}</dt>
    <dd className="mt-1 text-ink">{children}</dd>
  </div>
)

const ShowIntro = ({ data, isFollowing, onToggleFollow }) => {
  if (!data) return null

  const lineUp = [...(data.performers ?? [])].sort((a, b) => (a.orderIndex ?? 0) - (b.orderIndex ?? 0))
  // 01/10/2026: PerformerSummaryDto có Role (bắt buộc) và SetTime (TimeOnly?, KHÔNG bắt buộc — chủ phòng trà có thể bỏ
  // trống). Bản cũ in "—" ở cột giờ của mọi dòng khi cả buổi chưa ai được xếp giờ, và in "Biểu diễn" khi thiếu vai trò
  // như thể đó là dữ liệu. Giờ: không tiết mục nào có giờ thì bỏ hẳn cột giờ; vai trò lạ thì không in.
  const coGio = lineUp.some((p) => gioTietMuc(p.setTime))
  const tags = data.tags ?? data.moodTags ?? []
  const hoanVe = data.refundPolicy?.summary

  return (
    <div className="grid gap-10 lg:grid-cols-[minmax(0,7fr)_minmax(0,5fr)]">
      <div>
        {/* D1 (03/10/2026): buổi ĐANG diễn thì bảng ô chữ lật báo ai đang hát / kế tiếp, theo giờ tiết mục thật. */}
        {data.isOngoing && <BangLenSanKhau performers={lineUp} batDau={data.scheduledStart} />}
        <h2 className="text-3xl sm:text-4xl text-ink border-b-2 border-ink pb-3">Chương trình</h2>
        {lineUp.length > 0 ? (
          // LINE-UP POLAROID (03/10/2026, chủ dự án chọn P3): mỗi nghệ sĩ một tấm ảnh chụp lấy liền — ảnh vuông, TÊN viết
          // tay trên dải giấy đáy (Hand-Is-On-Photo Rule), giờ lên sân khấu (mono, dữ liệu) + vai trò in dưới tấm ảnh.
          // Xếp theo thứ tự tiết mục, tự xuống dòng khi line-up dài; nghiêng cố định theo vị trí (không ngẫu nhiên). Chưa có
          // ảnh thì ô "Chưa có ảnh" của trang — không ảnh kho. Rê chuột: tấm ảnh thẳng lại (chỉ khi không giảm chuyển động).
          <ol className="flex flex-wrap gap-x-6 gap-y-8 pt-6 pb-2">
            {lineUp.map((p, i) => (
              <li key={p.performanceId ?? p.id} className="w-40 sm:w-44">
                {/* Mỗi nghệ sĩ dẫn sang trang riêng: lịch diễn của họ + sao kê tiền ủng hộ công khai. */}
                <Link to={`/performers/${p.id}`}
                  className={`block bg-card p-2 pb-0 shadow-lift border border-ink/10 ${XOAY_ANH[i % XOAY_ANH.length]} motion-safe:transition-transform motion-safe:duration-300 motion-safe:hover:rotate-0 motion-safe:hover:-translate-y-1`}>
                  <div className="aspect-square w-full overflow-hidden bg-board">
                    {p.avatarUrl
                      ? <img src={p.avatarUrl} alt="" loading="lazy" className="w-full h-full object-cover" />
                      : <CoverFallback />}
                  </div>
                  <p className="px-1 pt-1.5 pb-2.5 font-hand text-xl leading-tight text-ink break-words">{p.name}</p>
                </Link>
                {/* Giờ lên sân khấu — dữ liệu, nên chữ mono. Cả buổi chưa ai có giờ thì không in giờ (không bịa giờ). */}
                {(coGio || VAI[p.role] || p.acceptsDonation) && (
                  <p className="mt-3 text-sm text-ink-soft">
                    {coGio && <span className="font-mono text-ink mr-2">{gioTietMuc(p.setTime) ?? '—'}</span>}
                    {[VAI[p.role], p.acceptsDonation && 'nhận ủng hộ có sao kê'].filter(Boolean).join(', ').replace(/^./, (c) => c.toUpperCase())}
                  </p>
                )}
              </li>
            ))}
          </ol>
        ) : (
          <p className="py-4 text-ink-soft border-b border-ink/20">Phòng trà chưa công bố line-up cho buổi này.</p>
        )}

        <h2 className="text-3xl sm:text-4xl text-ink border-b-2 border-ink pb-3 mt-12">Về buổi diễn</h2>
        <p className="mt-5 text-lg leading-relaxed text-ink-soft whitespace-pre-line max-w-prose">{data.description}</p>
        {tags.length > 0 && (
          <ul className="flex flex-wrap gap-2 mt-6" aria-label="Thể loại và không khí">
            {tags.map((tag) => (
              <li key={tag} className="inline-flex items-center min-h-[36px] px-3 border border-ink text-sm font-medium text-ink">{tag}</li>
            ))}
          </ul>
        )}
      </div>

      <aside className="self-start bg-card border-2 border-ink px-6 pt-2 pb-6" aria-label="Thông tin buổi diễn">
        <dl>
          <Muc nhan="Phòng trà">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <Link to={`/lounge/${data.loungeId}`} className="font-display text-2xl leading-none hover:underline underline-offset-4">{data.loungeName}</Link>
              {onToggleFollow && (
                <button
                  type="button"
                  onClick={onToggleFollow}
                  aria-pressed={Boolean(isFollowing)}
                  className={`inline-flex items-center gap-1.5 min-h-[44px] px-4 border-2 border-ink text-sm font-semibold transition-colors ${isFollowing ? 'bg-ink text-lamp' : 'text-ink hover:bg-ink hover:text-lamp'}`}
                >
                  {isFollowing ? <><Check size={16} aria-hidden="true" /> Đang theo dõi</> : <><Plus size={16} aria-hidden="true" /> Theo dõi</>}
                </button>
              )}
            </div>
          </Muc>
          {data.address && <Muc nhan="Địa chỉ">{data.address}</Muc>}
          {data.genre && <Muc nhan="Thể loại">{data.genre}</Muc>}
          {hoanVe && <Muc nhan="Huỷ vé và hoàn tiền">{hoanVe}</Muc>}
        </dl>
        {/* Dấu mộc chỉ nói về tiền, và chỉ đóng trên giấy sáng (DESIGN.md: Stamp-Is-Money, No-Stamp-On-Navy). */}
        <div className="flex items-center gap-4 pt-5 mt-1 border-t-2 border-ink">
          <DauMoc vongNgoai="MUSICLOUNGE · TIỀN VÉ GIỮ HỘ · " giua={'GIỮ HỘ\nTỚI KHI DIỄN'} size={84} xoay={-10} className="flex-shrink-0" />
          <p className="text-sm text-ink-soft">Tiền vé trả trực tuyến được nền tảng giữ hộ, chỉ chuyển cho phòng trà sau khi buổi diễn diễn ra.</p>
        </div>
      </aside>
    </div>
  )
}

export default ShowIntro
