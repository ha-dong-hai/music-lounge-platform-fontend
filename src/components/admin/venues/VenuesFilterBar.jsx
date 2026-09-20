import { VENUE_STATUS_CONFIG } from './VenueBadges'

// Bỏ search (tạm ẩn) — chỉ còn dropdown status để đi sâu từng loại
const VenuesFilterBar = ({ statusFilter, setStatusFilter }) => {
  return (
    <div className="bg-gray-900 border border-gray-800 rounded-xl p-4 flex flex-col md:flex-row gap-4 items-center justify-between">
      <div className="flex items-center gap-3">
        <p className="text-sm text-gray-400">Filter by status:</p>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-4 py-2.5 bg-black border border-gray-800 rounded-lg text-sm text-white focus:outline-none focus:border-[#C3B665]/50 cursor-pointer"
        >
          <option value="all">All</option>
          {Object.keys(VENUE_STATUS_CONFIG).map(key => (
            <option key={key} value={key}>{VENUE_STATUS_CONFIG[key].label}</option>
          ))}
        </select>
      </div>

      {/* Hint nhỏ khi đang ở view tổng — gợi ý admin thẻ "Chờ duyệt" là nơi cần xử lý */}
      {/* {statusFilter === 'all' && (
        <p className="text-xs text-gray-500">
          💡 Bấm vào các thẻ thống kê phía trên để lọc nhanh theo trạng thái
        </p>
      )} */}
    </div>
  )
}

export default VenuesFilterBar