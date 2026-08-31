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
          placeholder="Tìm nội dung, SĐT, #ID... (trong trang hiện tại)"
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
        <option value="all">Tất cả danh mục</option>
        {Object.keys(CATEGORY_CONFIG).map(key => (
          <option key={key} value={key}>{CATEGORY_CONFIG[key].label}</option>
        ))}
      </select>

      <select
        value={statusFilter}
        onChange={(e) => setStatusFilter(e.target.value)}
        className="w-full lg:w-auto px-4 py-2.5 bg-black border border-gray-800 rounded-lg text-sm text-white focus:outline-none focus:border-[#C3B665]/50 cursor-pointer"
      >
        <option value="all">Tất cả trạng thái</option>
        {/* Tạm chỉ 2 option chắc chắn có ở BE */}
        <option value="Open">Chờ xử lý</option>
        <option value="Resolved">Đã giải quyết</option>
      </select>
    </div>
  )
}

export default ComplaintsFilterBar