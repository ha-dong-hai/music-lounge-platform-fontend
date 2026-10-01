import { VENUE_STATUS_CONFIG } from './VenueBadges'

// Bỏ search (tạm ẩn) — chỉ còn dropdown status để đi sâu từng loại
const VenuesFilterBar = ({ statusFilter, setStatusFilter }) => {
  return (
    <div className="bg-card border border-line p-4 flex flex-col md:flex-row gap-4 items-center justify-between">
      <div className="flex items-center gap-3">
        <p className="text-sm text-ink-soft">Lọc theo trạng thái:</p>
        <select aria-label="Lọc theo trạng thái"
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="cursor-pointer min-h-[44px] px-3 py-2 bg-card border-2 border-ink text-ink focus:outline-none focus:ring-2 focus:ring-ink focus:ring-offset-2"
        >
          {Object.keys(VENUE_STATUS_CONFIG).map(key => (
            <option key={key} value={key}>{VENUE_STATUS_CONFIG[key].label}</option>
          ))}
        </select>
      </div>

      {/* Hint nhỏ khi đang ở view tổng — gợi ý admin thẻ "Chờ duyệt" là nơi cần xử lý */}
      {/* {statusFilter === 'all' && (
        <p className="text-xs text-ink-mute">
          💡 Bấm vào các thẻ thống kê phía trên để lọc nhanh theo trạng thái
        </p>
      )} */}
    </div>
  )
}

export default VenuesFilterBar