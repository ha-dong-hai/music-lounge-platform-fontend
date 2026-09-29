// src/components/shared/SectionTitle.jsx
//
// Tiêu đề một mục trên trang, dùng chung để cả trang có CÙNG một nhịp thị giác.
//
// VÌ SAO GOM LẠI: TonightStrip và MoodExplorer trước đây chép lặp y hệt nhau khối "nhãn nhỏ viết
// hoa + tiêu đề serif". Chép lặp thì mỗi lần chỉnh một chỗ là lệch chỗ kia, và trang mất nhịp —
// người xem cảm nhận được sự lệch đó ngay cả khi không chỉ ra được vì sao.
//
// BA THỦ PHÁP LẤY TỪ MẪU BỐ CỤC BIÊN TẬP ĐÃ TRA:
//   1. "uppercase tracking-widest cho nhãn/ngày" — nhãn nhỏ giãn ký tự làm lớp thông tin thứ hai,
//      không tranh chỗ với tiêu đề.
//   2. "section dividers" — một đường chỉ mảnh kéo hết chiều ngang, tách mục này với mục trước.
//      Đây là thứ tạo cảm giác "từng trang báo" thay vì một dòng cuộn liên tục.
//   3. Tiêu đề serif siết tracking, nén leading — cùng cách xử lý với chữ hero.
//
// Nhãn phụ bên phải (`ghiChu`) ẩn trên màn hẹp: ở đó nó sẽ xuống dòng và phá mất hàng tiêu đề.
import ScrollFloat from '../reactbits/ScrollFloat'
import MotionGuard from './MotionGuard'

// Một chuỗi lớp DUY NHẤT cho tiêu đề mục — dùng chung cho bản có hiệu ứng và bản tĩnh, để hai
// nhánh không lệch cỡ chữ.
const TIEU_DE_MUC =
  'font-display text-2xl sm:text-3xl font-semibold tracking-tight leading-[1.1] text-balance text-ink'

const SectionTitle = ({ nhan, tieuDe, ghiChu, keDau = true, children }) => (
  <div className={keDau ? 'pt-8 border-t border-line' : ''}>
    <div className="flex items-end justify-between gap-6 mb-4 sm:mb-6">
      <div className="min-w-0">
        {nhan && (
          <p className="text-[11px] sm:text-xs font-semibold uppercase tracking-[0.2em] text-brand-text mb-1.5">
            {nhan}
          </p>
        )}
        {/* Tiêu đề mục dùng ScrollFloat của React Bits (GSAP ScrollTrigger): từng ký tự nổi lên
            theo nhịp cuộn tới. Đây đúng tinh thần "chuyển động là biên đạo, không phải một bữa
            tiệc nhảy" mà brief §6b lấy làm luật — hiệu ứng kích hoạt bằng cuộn, không tự chạy.
            MotionGuard bọc ngoài vì thư viện không tự xử lý prefers-reduced-motion; tắt thì hiện
            thẳng tiêu đề tĩnh, cùng cỡ chữ nên bố cục không nhảy.
            ScrollFloat chỉ nhận chuỗi (nó tự tách ký tự), nên chỉ bật khi `tieuDe` là chuỗi. */}
        {typeof tieuDe === 'string' ? (
          <MotionGuard khiTat={<h2 className={TIEU_DE_MUC}>{tieuDe}</h2>}>
            <ScrollFloat containerClassName="!m-0" textClassName={TIEU_DE_MUC}>
              {tieuDe}
            </ScrollFloat>
          </MotionGuard>
        ) : (
          <h2 className={TIEU_DE_MUC}>{tieuDe}</h2>
        )}
      </div>
      {ghiChu && <p className="hidden md:block text-sm text-ink-mute italic flex-shrink-0">{ghiChu}</p>}
      {children}
    </div>
  </div>
)

export default SectionTitle
