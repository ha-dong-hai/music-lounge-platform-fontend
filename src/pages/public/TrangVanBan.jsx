// src/pages/public/TrangVanBan.jsx
//
// MLACP-602: hai trang văn bản — ĐIỀU KHOẢN DỊCH VỤ (/dieu-khoan) và CHÍNH SÁCH BẢO MẬT (/bao-mat).
// Trước đây trang Đăng ký bắt người dùng tick "đồng ý Điều khoản dịch vụ và Chính sách bảo mật" nhưng hai liên kết dẫn
// tới /terms và /privacy — hai đường dẫn không tồn tại (404). Người dùng bị yêu cầu đồng ý với thứ họ không đọc được.
//
// NỘI DUNG: chỉ ghi những điều hệ thống THẬT SỰ đang làm (giữ hộ tiền vé, sao kê tiền ủng hộ, tải/xoá dữ liệu…), không
// ghi con số chính sách cụ thể (tỉ lệ, số ngày) vì chúng nằm ở cấu hình hệ thống và đổi được — văn bản dẫn người đọc tới
// nơi con số đang hiện. ĐÂY LÀ BẢN SOẠN CHO GIAI ĐOẠN THỬ NGHIỆM, chủ dự án duyệt câu chữ trước khi dùng thật.
import { Link } from 'react-router-dom'

const NGAY_CAP_NHAT = '04/10/2026'

const DIEU_KHOAN = {
  tieuDe: 'Điều khoản dịch vụ',
  moDau: 'MusicLounge là nơi khán giả tìm và đặt vé các đêm nhạc ở phòng trà, và là công cụ để phòng trà tổ chức, bán vé và vận hành đêm diễn. Khi tạo tài khoản, bạn đồng ý với các điều dưới đây.',
  muc: [
    ['Tài khoản', [
      'Mỗi tài khoản gắn với một vai: khán giả hoặc chủ phòng trà. Vai được chọn lúc đăng ký và không đổi được về sau; cần cả hai vai thì đăng ký hai tài khoản bằng hai email khác nhau.',
      'Bạn chịu trách nhiệm giữ kín mật khẩu và mọi thao tác thực hiện bằng tài khoản của mình.',
      'Nghệ sĩ biểu diễn không có tài khoản đăng nhập; hồ sơ nghệ sĩ do phòng trà quản lý.',
    ]],
    ['Mua vé và tiền vé', [
      'Tiền vé mua trực tuyến được MusicLounge giữ hộ cho tới khi buổi diễn diễn ra, rồi mới chuyển cho phòng trà sau khi trừ phí dịch vụ và thuế theo quy định.',
      'Vé mua tại quầy bằng tiền mặt do phòng trà thu trực tiếp.',
      'Mỗi vé có một mã QR để vào cửa. Vé đã soát thì không soát lại được.',
    ]],
    ['Huỷ vé và hoàn tiền', [
      'Điều kiện huỷ vé và mức hoàn của từng buổi diễn hiện ngay trên trang buổi diễn đó, trước khi bạn thanh toán.',
      'Buổi diễn bị phòng trà huỷ, hoặc buổi phát trực tuyến không phát được, thì vé được hoàn theo chính sách hiện trên trang buổi diễn.',
      'Tiền hoàn trả về đúng phương thức bạn đã thanh toán; trường hợp không hoàn tự động được, chúng tôi sẽ hỏi bạn tài khoản nhận tiền.',
    ]],
    ['Tiền ủng hộ nghệ sĩ', [
      'Tiền bạn ủng hộ nghệ sĩ được ghi nhận công khai trên trang sao kê của nghệ sĩ đó, gồm số tiền đã nhận và đã chi trả.',
      'Bạn có thể khiếu nại nếu cho rằng tiền ủng hộ chưa tới tay nghệ sĩ.',
    ]],
    ['Dành cho chủ phòng trà', [
      'Phòng trà phải được duyệt hồ sơ, và chủ phòng trà phải xác minh danh tính, trước khi đăng buổi diễn và bán vé.',
      'Chủ phòng trà chịu trách nhiệm về nội dung buổi diễn, giấy phép biểu diễn và nghĩa vụ tác quyền của buổi diễn mình tổ chức.',
      'Buổi diễn được kiểm duyệt trước khi mở bán. Vi phạm có thể dẫn tới cảnh cáo, tạm đình chỉ hoặc khoá phòng trà; chủ phòng trà có quyền khiếu nại án phạt.',
    ]],
    ['Đánh giá và nội dung', [
      'Chỉ người đã vào cửa hoặc đã xem buổi phát trực tuyến mới đánh giá được buổi diễn đó.',
      'Đánh giá, lời nhắn và bình luận vi phạm pháp luật hoặc xúc phạm người khác có thể bị gỡ.',
    ]],
    ['Khiếu nại', [
      'Mọi khiếu nại về vé, buổi diễn, phòng trà hay tiền ủng hộ gửi tại trang Khiếu nại; khách chưa có tài khoản cũng gửi được và tra cứu bằng mã khiếu nại.',
    ]],
  ],
  lienKet: [['/complaints', 'Gửi khiếu nại'], ['/bao-mat', 'Chính sách bảo mật'], ['/minh-bach', 'Minh bạch tiền ủng hộ']],
}

const BAO_MAT = {
  tieuDe: 'Chính sách bảo mật',
  moDau: 'Trang này nói rõ MusicLounge thu những dữ liệu cá nhân nào của bạn, dùng vào việc gì, và bạn có quyền gì với dữ liệu đó.',
  muc: [
    ['Dữ liệu chúng tôi thu', [
      'Thông tin tài khoản: họ tên, email, số điện thoại (nếu bạn khai), ảnh đại diện.',
      'Lịch sử sử dụng: vé đã mua, buổi diễn đã xem, phòng trà đang theo dõi, đánh giá, khiếu nại, tiền ủng hộ.',
      'Sở thích âm nhạc bạn tự chọn, dùng để gợi ý buổi diễn.',
      'Với chủ phòng trà: số và ảnh căn cước công dân, hồ sơ thuế, tài khoản nhận tiền — để xác minh người bán và chi trả.',
    ]],
    ['Dùng vào việc gì', [
      'Bán và soát vé, hoàn tiền, chi trả cho phòng trà, xử lý khiếu nại.',
      'Gửi thông báo về vé và buổi diễn của bạn.',
      'Gợi ý buổi diễn hợp gu. Bạn tắt được phần gợi ý cá nhân hoá trong trang Tài khoản, mục Sở thích gợi ý.',
    ]],
    ['Ai xem được', [
      'Phòng trà thấy tên và email người mua vé của buổi diễn họ tổ chức để đối soát và đón khách; nhân viên soát vé chỉ thấy tên.',
      'Ảnh căn cước công dân được lưu ở vùng riêng tư: chỉ bạn và quản trị viên duyệt hồ sơ xem được.',
      'Thanh toán đi qua cổng VNPay. MusicLounge không lưu số thẻ hay thông tin đăng nhập ngân hàng của bạn.',
      'Chúng tôi không bán dữ liệu cá nhân cho bên thứ ba.',
    ]],
    ['Quyền của bạn', [
      'Xem và sửa thông tin tài khoản bất cứ lúc nào.',
      'Tải về toàn bộ dữ liệu chúng tôi đang lưu về bạn.',
      'Yêu cầu xoá tài khoản. Khi xoá, thông tin định danh của bạn được gỡ khỏi hệ thống; các bản ghi giao dịch bắt buộc phải lưu theo quy định về kế toán và thuế được giữ lại ở dạng không còn gắn với danh tính của bạn.',
      'Hai việc sau làm tại trang Tài khoản, mục Dữ liệu và tài khoản.',
    ]],
    ['Căn cứ', [
      'Chính sách này soạn theo Nghị định 13/2023/NĐ-CP về bảo vệ dữ liệu cá nhân.',
    ]],
  ],
  lienKet: [['/account?tab=privacy', 'Dữ liệu và tài khoản của tôi'], ['/dieu-khoan', 'Điều khoản dịch vụ'], ['/complaints', 'Gửi khiếu nại']],
}

const TrangVanBan = ({ loai }) => {
  const v = loai === 'bao-mat' ? BAO_MAT : DIEU_KHOAN
  return (
    <div className="bg-stock text-ink pb-24">
      <article className="max-w-[72ch] mx-auto px-4 sm:px-6 py-10">
        <p className="font-mono text-sm text-ink-soft">Cập nhật {NGAY_CAP_NHAT} · áp dụng cho giai đoạn thử nghiệm</p>
        <h1 className="text-5xl mt-2">{v.tieuDe}</h1>
        <p className="mt-5 text-lg text-ink-soft leading-relaxed">{v.moDau}</p>

        {v.muc.map(([ten, dong], i) => (
          <section key={ten} aria-labelledby={`muc-${i}`} className="mt-10 border-t-2 border-ink pt-5">
            <h2 id={`muc-${i}`} className="font-sans text-xl font-bold">{i + 1}. {ten}</h2>
            <ul className="mt-3 space-y-3 text-base leading-relaxed list-disc pl-5 marker:text-ink-soft">
              {dong.map((d) => <li key={d}>{d}</li>)}
            </ul>
          </section>
        ))}

        <nav aria-label="Liên quan" className="mt-12">
          <ul className="border-y-2 border-ink divide-y divide-ink/20">
            {v.lienKet.map(([to, nhan]) => (
              <li key={to}>
                <Link to={to} className="flex items-center justify-between min-h-[52px] px-1 font-semibold hover:bg-card">
                  {nhan}<span aria-hidden="true">→</span>
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      </article>
    </div>
  )
}

export default TrangVanBan
