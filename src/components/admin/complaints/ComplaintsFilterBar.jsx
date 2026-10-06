// CỐ Ý CHƯA NỐI (01/10/2026): trang cha đã có handleExportCSV và truyền onExportCSV, nhưng nút xuất CHƯA TỪNG được vẽ
// (kể cả ở commit tạo tệp, 90a8135). Tệp CSV chứa số điện thoại liên hệ của người khiếu nại — dữ liệu cá nhân, nên có mở
// tính năng xuất hay không là quyết định của chủ dự án. Khi được duyệt: vẽ nút Download gọi onExportCSV ở đây.
// eslint-disable-next-line no-unused-vars
import { Search, Download } from 'lucide-react'
import { CATEGORY_CONFIG } from './ComplaintBadges'

// Component thuần UI: nhận giá trị + setter + callback export từ cha
const ComplaintsFilterBar = ({
  searchQuery, setSearchQuery,
  categoryFilter, setCategoryFilter,
  statusFilter, setStatusFilter,
  demTrangThai = {}, // MLACP-685/693: { CanXuLy, all, Open, Investigating, Resolved, Rejected } — số theo bộ lọc từ khoá/ngày đang áp
  // eslint-disable-next-line no-unused-vars -- xem ghi chú đầu tệp
  onExportCSV,
}) => {
  const so = (k) => (demTrangThai[k] != null ? ` (${demTrangThai[k].toLocaleString('vi-VN')})` : '')
  return (
    <div className="bg-card border border-line p-4 flex flex-col lg:flex-row gap-4 items-center">
      <div className="relative flex-1 w-full">
        <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-mute" />
        <input aria-label="Tìm theo nội dung, số điện thoại, #mã (trong trang hiện tại)"
          type="text"
          placeholder="Tìm theo nội dung, số điện thoại, #mã (trong trang hiện tại)"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-10 pr-4 min-h-[44px] px-3 py-2 bg-card border-2 border-ink text-ink focus:outline-none focus:ring-2 focus:ring-ink focus:ring-offset-2"
        />
      </div>

      <select aria-label="Lọc theo loại vấn đề"
        value={categoryFilter}
        onChange={(e) => setCategoryFilter(e.target.value)}
        className="w-full lg:w-auto cursor-pointer min-h-[44px] px-3 py-2 bg-card border-2 border-ink text-ink focus:outline-none focus:ring-2 focus:ring-ink focus:ring-offset-2"
      >
        <option value="all">Mọi phân loại</option>
        {Object.keys(CATEGORY_CONFIG).map(key => (
          <option key={key} value={key}>{CATEGORY_CONFIG[key].label}</option>
        ))}
      </select>

      <select aria-label="Lọc theo trạng thái"
        value={statusFilter}
        onChange={(e) => setStatusFilter(e.target.value)}
        className="w-full lg:w-auto cursor-pointer min-h-[44px] px-3 py-2 bg-card border-2 border-ink text-ink focus:outline-none focus:ring-2 focus:ring-ink focus:ring-offset-2"
      >
        {/* MLACP-693: gộp hai trạng thái còn việc — khớp con số trên huy hiệu menu; mặc định khi mở trang. */}
        <option value="CanXuLy">Cần xử lý (chờ + đang xem xét){so('CanXuLy')}</option>
        <option value="all">Mọi trạng thái{so('all')}</option>
        {/* Trang dùng GET /admin/complaints (mọi trạng thái) và gửi lựa chọn này lên server qua tham số status.
            Đúng 4 giá trị Complaint.Status của backend — sai tên thì backend trả 422. */}
        <option value="Open">Chờ xử lý{so('Open')}</option>
        <option value="Investigating">Đang xem xét{so('Investigating')}</option>
        <option value="Resolved">Đã giải quyết{so('Resolved')}</option>
        <option value="Rejected">Đã từ chối{so('Rejected')}</option>
      </select>
    </div>
  )
}

export default ComplaintsFilterBar