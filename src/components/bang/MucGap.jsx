// src/components/bang/MucGap.jsx
//
// MỤC GẬP cho trang số liệu quản trị (05/10/2026). Chủ dự án: "nhồi nhét quá nhiều thông tin, không biết nên xem cái gì, xem
// từ đâu" — hai trang mẫu bày mọi khối ngang hàng nhau nên không có điểm bắt đầu.
//
// Cách giải (NN/g progressive disclosure; Stephen Few: tổng quan → chỗ cần chú ý → chi tiết): màn đầu chỉ có việc cần làm và
// kết quả kỳ này; MỖI khối chi tiết thu thành MỘT DÒNG gồm tên + câu tóm tắt (kết luận của khối đó). Đọc lướt các dòng là
// nắm được toàn cảnh; cần xem biểu đồ hay bảng thì mở đúng dòng đó.
//
// Dùng <details>/<summary> gốc của trình duyệt — bàn phím, trình đọc màn hình, tìm trong trang (Ctrl+F tự mở) có sẵn; không
// tự dựng cơ chế đóng mở.
//
// Props: id, tieuDe, tomTat (câu kết luận hiện khi gập — bắt buộc nên có), mau? (khoá mauSoLieu), moSan?
import { ChevronDown } from 'lucide-react'
import { MAU_SO_LIEU } from './mauSoLieu'

const MucGap = ({ id, tieuDe, tomTat, mau, moSan = false, children }) => (
  <details open={moSan} className="group border-2 border-ink/25 bg-card">
    <summary className="flex items-center gap-3 px-4 sm:px-5 min-h-[60px] py-2 cursor-pointer list-none [&::-webkit-details-marker]:hidden hover:bg-sunken/60">
      {MAU_SO_LIEU[mau] && <span aria-hidden="true" className={`w-3 h-3 flex-shrink-0 ${MAU_SO_LIEU[mau].nen}`} />}
      <span className="flex-1 min-w-0 flex flex-wrap items-baseline gap-x-4 gap-y-0.5">
        <h2 id={id} className="font-sans text-lg font-bold text-ink">{tieuDe}</h2>
        {tomTat && <span className="text-sm text-ink-soft">{tomTat}</span>}
      </span>
      <ChevronDown size={20} aria-hidden="true" className="flex-shrink-0 text-ink transition-transform group-open:rotate-180" />
    </summary>
    <div className="px-4 sm:px-5 pb-5 pt-1 border-t border-line">{children}</div>
  </details>
)

export default MucGap
