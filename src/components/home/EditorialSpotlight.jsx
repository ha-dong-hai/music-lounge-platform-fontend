// src/components/home/EditorialSpotlight.jsx
//
// GHI CHÚ CHO ĐỘI FE — thay cho khối "trích dẫn to đùng cô lập" ở bản nháp đầu:
// - Đây là NỀN TẢNG nhiều phòng trà độc lập, không phải một phòng trà duy nhất — nên câu chuyện ở
//   đây nói về VĂN HOÁ phòng trà Sài Gòn nói chung (bolero, nhạc Trịnh, acoustic), không bịa lịch sử
//   riêng của một quán ("thành lập năm...", địa chỉ, hotline). Xem docs/design/TRANG-CHU-BRIEF.md §2.
// - Ảnh là ẢNH KHÔNG GIAN của một phòng trà thật (prop `lounge`), KHÔNG phải poster show: poster mang
//   sẵn chữ riêng (có poster AI còn bị méo chữ) nên khi phóng to làm ảnh lớn vừa xấu vừa tranh với
//   tiêu đề. Ảnh không gian mang đúng bầu không khí mà khối "văn hoá phòng trà" này muốn kể.
// - Bố cục lệch (ảnh ~45%, cột chữ nền espresso) theo đúng hướng đã duyệt ở Stitch — không đối xứng
//   kiểu khối trích dẫn giữa trang mặc định của mọi trang AI dựng.
import { Link } from 'react-router-dom'
import { ArrowRight } from 'lucide-react'
import Reveal from '../shared/Reveal'
import CoverFallback from '../shared/CoverFallback'

const EditorialSpotlight = ({ lounge }) => {
  return (
    <section className="rounded-2xl overflow-hidden bg-espresso">
      <div className="grid grid-cols-1 md:grid-cols-12">
        <Reveal className="md:col-span-5 relative min-h-[280px] md:min-h-[420px]">
          {lounge?.primaryImageUrl ? (
            <img src={lounge.primaryImageUrl} alt={lounge.name ? `Không gian ${lounge.name}` : ''} className="absolute inset-0 w-full h-full object-cover" loading="lazy" />
          ) : (
            <CoverFallback className="absolute inset-0 w-full h-full" />
          )}
        </Reveal>

        <Reveal delay={120} className="md:col-span-7 p-8 sm:p-10 md:p-14 flex flex-col justify-center">
          <p className="text-xs font-semibold uppercase tracking-[0.15em] text-brand-on-dark mb-4">Triết lý âm học mộc</p>
          {/* Trích dẫn nổi: siết tracking cho khối chữ đặc lại, `text-balance` để câu không rơi một
              chữ lẻ xuống dòng cuối. */}
          <blockquote className="font-display italic text-2xl sm:text-3xl md:text-4xl tracking-tight leading-[1.15] text-balance text-cream mb-6">
            &ldquo;Người đến phòng trà để lắng lại bên tách cà phê ấm và tiếng đàn mộc.&rdquo;
          </blockquote>
          {/* `drop-cap` — chữ hoa đầu đoạn kiểu tạp chí in (định nghĩa ở index.css). Chỉ đặt ở ĐÚNG
              MỘT đoạn trên cả trang chủ: đây là đoạn kể chuyện duy nhất. Rải ra nhiều chỗ thì thủ
              pháp mất giá trị và thành trang trí. */}
          <p className="drop-cap text-cream-mute text-sm sm:text-base leading-relaxed mb-8 max-w-lg">
            Từ những đêm Bolero rưng rưng đến khúc Trịnh ca một thời — mỗi tối tại các phòng trà độc
            lập khắp Sài Gòn là một trang hồi ức được mở lại, không khuếch đại điện tử, không vội vã.
            Chúng tôi tuyển chọn và kết nối bạn với những không gian ấy, không sở hữu riêng một quán nào.
          </p>
          {/* ĐÃ SỬA MỘT LỜI NÓI SAI NGẦM: nút này từng là "Ghé thăm {lounge.name}" — nghe như
              đây là một phòng trà được BIÊN TẬP CHỌN. Thực tế `lounge` chỉ là phòng trà ĐẦU TIÊN
              CÓ ẢNH trong 10 phòng trà tải về (xem HomePage), tức là tình cờ. Ảnh thì có thật và
              được chú thích đúng, nên giữ; còn lời mời thì trả về đúng điều nó thật sự làm được:
              dẫn sang danh sách phòng trà để người đọc TỰ chọn (đặc tả §1). */}
          <Link to="/lounges"
            className="inline-flex items-center gap-2 self-start min-h-[44px] text-sm font-semibold text-brand-on-dark hover:text-cream transition-colors">
            Duyệt các phòng trà <ArrowRight size={16} />
          </Link>
        </Reveal>
      </div>
    </section>
  )
}

export default EditorialSpotlight
