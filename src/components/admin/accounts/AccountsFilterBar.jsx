import { Search } from 'lucide-react'

// MLACP-685: lựa chọn kèm số (stats = đúng số của các ô StatsCards phía trên; Admin không có trong stats nên không in số).
const so = (n) => (n != null ? ` (${Number(n).toLocaleString('vi-VN')})` : '')

const AccountsFilterBar = ({
  searchQuery, setSearchQuery,
  roleFilter, setRoleFilter,
  statusFilter, setStatusFilter,
  stats = {},
}) => {
  return (
    <div className="bg-card border border-line p-4 flex flex-col md:flex-row gap-4 items-center">
      <div className="relative flex-1 w-full">
        <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-mute" />
        <input aria-label="Tìm theo tên, email hoặc số điện thoại"
          type="text"
          placeholder="Tìm theo tên, email hoặc số điện thoại…"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-10 pr-4 min-h-[44px] px-3 py-2 bg-card border-2 border-ink text-ink focus:outline-none focus:ring-2 focus:ring-ink focus:ring-offset-2"
        />
      </div>

      <select aria-label="Lọc theo vai trò"
        value={roleFilter}
        onChange={(e) => setRoleFilter(e.target.value)}
        className="w-full md:w-auto cursor-pointer min-h-[44px] px-3 py-2 bg-card border-2 border-ink text-ink focus:outline-none focus:ring-2 focus:ring-ink focus:ring-offset-2"
      >
        <option value="all">Mọi vai trò{so(stats.total)}</option>
        <option value="Audience">Khán giả{so(stats.users)}</option>
        <option value="Owner">Chủ phòng trà{so(stats.owners)}</option>
        <option value="Staff">Nhân viên{so(stats.staff)}</option>
        <option value="Admin">Quản trị viên</option>
      </select>

      <select aria-label="Lọc theo trạng thái"
        value={statusFilter}
        onChange={(e) => setStatusFilter(e.target.value)}
        className="w-full md:w-auto cursor-pointer min-h-[44px] px-3 py-2 bg-card border-2 border-ink text-ink focus:outline-none focus:ring-2 focus:ring-ink focus:ring-offset-2"
      >
        <option value="all">Mọi trạng thái{so(stats.total)}</option>
        <option value="active">Đang hoạt động{so(stats.total != null && stats.banned != null ? stats.total - stats.banned : null)}</option>
        <option value="banned">Đã bị khoá{so(stats.banned)}</option>
      </select>
    </div>
  )
}

export default AccountsFilterBar