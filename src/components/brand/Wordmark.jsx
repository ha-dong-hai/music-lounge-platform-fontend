// src/components/brand/Wordmark.jsx
//
// Chữ thương hiệu MusicLounge — MỘT chỗ duy nhất. Chủ dự án chốt 30/09: tên sản phẩm là "MusicLounge" từ trang
// khán giả tới khu quản trị ("Phòng trà Sài Gòn" chỉ là câu mô tả). Trước đây mỗi màn tự viết tên riêng
// ("Phòng Trà Sài Gòn", "Music Lounge"…), nên thương hiệu lệch nhau giữa các khu.
// `tone`: 'ink' trên giấy sáng, 'lamp' trên khối mực (chân trang, thanh bên, màn đăng nhập).
const Wordmark = ({ tone = 'ink', className = '' }) => (
  <span
    className={`font-display leading-none tracking-normal ${tone === 'lamp' ? 'text-lamp' : 'text-ink'} ${className}`}
  >
    MusicLounge
  </span>
)

export default Wordmark
