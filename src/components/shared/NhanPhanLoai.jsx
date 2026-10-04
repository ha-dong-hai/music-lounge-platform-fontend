// src/components/shared/NhanPhanLoai.jsx
//
// NHÃN PHÂN LOẠI (MLACP-623, 04/10/2026) — cho thứ trả lời "đây là LOẠI gì" (vai trò tài khoản, loại khiếu nại, hình thức
// buổi diễn), KHÁC với NhanTrangThai là thứ trả lời "việc này ĐANG Ở ĐÂU". Chủ dự án: các nhãn này "cùng 1 kiểu dáng,
// khó phân biệt" — cả cột Vai trò là một dãy ô viền mực với cùng một vòng tròn rỗng, phải ĐỌC từng chữ mới biết ai là
// chủ phòng trà, ai là nhân viên.
//
// CĂN CỨ:
//  - WCAG 2.2 SC 1.4.1: không dựa vào một kênh duy nhất. Mỗi giá trị có BIỂU TƯỢNG riêng (hình dạng) + chữ; độ đậm chỉ là
//    kênh thứ ba, mất nó vẫn đọc được.
//  - IBM Carbon tách "Tag" (phân loại) khỏi "Status indicator" (trạng thái): hai câu hỏi khác nhau thì hai kiểu khác nhau.
//    Vì vậy nhãn này KHÔNG dùng danger / success / warning — tô đỏ "Cách hành xử của phòng trà" là kết tội trước khi xử.
//  - DESIGN.md: bảng màu không có sắc phân loại; ember chỉ cho đang diễn, son chỉ cho tiền. Nên phân biệt bằng BA ĐỘ ĐẬM
//    CỦA MỰC (cùng nguyên tắc với biểu đồ nhiều nguồn) chứ không thêm màu mới.
//  - Vì sao không dùng nền lõm (sunken): đã đo ở MLACP-619, nền nhạt chỉ chênh ~1,2 lần so với giấy — gần như không thấy.
//
// BỐN KIỂU, đậm dần: nhat (không viền) < vien (viền mực) < vua (nền mực nhạt) < dac (nền mực đặc).
// Tương phản chữ/nền: lamp trên ink 14,6:1; lamp trên ink-mute 5,6:1; ink trên card 16:1; ink-soft trên card 9,6:1
// (đều >= 4.5:1, WCAG 2.2 SC 1.4.3).
// TRẦN: 4 kiểu. Một cột có hơn 4 giá trị (loại khiếu nại có 8) thì xếp giá trị vào NHÓM cùng kiểu, biểu tượng mới là thứ
// phân biệt từng giá trị. Cần hơn thế thì phải mở bảng màu phân loại trong DESIGN.md trước, không tự thêm ở đây.
const KIEU = {
  dac: 'border-ink bg-ink text-lamp',
  vua: 'border-ink-mute bg-ink-mute text-lamp',
  vien: 'border-ink bg-card text-ink',
  nhat: 'border-transparent text-ink-soft',
}

const NhanPhanLoai = ({ kieu = 'vien', icon: Icon, children, className = '' }) => (
  <span className={`inline-flex items-center gap-1.5 px-2 min-h-[26px] border text-xs font-semibold whitespace-nowrap ${KIEU[kieu] ?? KIEU.vien} ${className}`}>
    {Icon && <Icon size={13} aria-hidden="true" className="flex-shrink-0" />}
    <span className="text-current">{children}</span>
  </span>
)

export default NhanPhanLoai
