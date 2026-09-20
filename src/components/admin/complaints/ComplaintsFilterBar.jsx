import { Search, Download } from 'lucide-react'
import { CATEGORY_CONFIG } from './ComplaintBadges'

// Component thuần UI: nhận giá trị + setter + callback export từ cha
const ComplaintsFilterBar = ({
  searchQuery, setSearchQuery,
  categoryFilter, setCategoryFilter,
  statusFilter, setStatusFilter,
  onExportCSV,
}) => {
  return (
    <div className="bg-gray-900 border border-gray-800 rounded-xl p-4 flex flex-col lg:flex-row gap-4 items-center">
      <div className="relative flex-1 w-full">
        <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
        <input
          type="text"
          placeholder="Search Complaint, Number, #ID... (trong trang hiện tại)"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-10 pr-4 py-2.5 bg-black border border-gray-800 rounded-lg text-sm text-white focus:outline-none focus:border-[#C3B665]/50"
        />
      </div>

      <select
        value={categoryFilter}
        onChange={(e) => setCategoryFilter(e.target.value)}
        className="w-full lg:w-auto px-4 py-2.5 bg-black border border-gray-800 rounded-lg text-sm text-white focus:outline-none focus:border-[#C3B665]/50 cursor-pointer"
      >
        <option value="all">All categories</option>
        {Object.keys(CATEGORY_CONFIG).map(key => (
          <option key={key} value={key}>{CATEGORY_CONFIG[key].label}</option>
        ))}
      </select>

      <select
        value={statusFilter}
        onChange={(e) => setStatusFilter(e.target.value)}
        className="w-full lg:w-auto px-4 py-2.5 bg-black border border-gray-800 rounded-lg text-sm text-white focus:outline-none focus:border-[#C3B665]/50 cursor-pointer"
      >
        <option value="all">All statuses</option>
        {/* Trang dùng GET /admin/complaints (mọi trạng thái) và gửi lựa chọn này lên server qua tham số status.
            Đúng 4 giá trị Complaint.Status của backend — sai tên thì backend trả 422. */}
        <option value="Open">Pending</option>
        <option value="Investigating">Investigating</option>
        <option value="Resolved">Resolved</option>
        <option value="Rejected">Rejected</option>
      </select>
    </div>
  )
}

export default ComplaintsFilterBar