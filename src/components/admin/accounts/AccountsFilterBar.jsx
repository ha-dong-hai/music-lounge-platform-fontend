import { Search } from 'lucide-react'

const AccountsFilterBar = ({ 
  searchQuery, setSearchQuery, 
  roleFilter, setRoleFilter, 
  statusFilter, setStatusFilter 
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
          className="w-full pl-10 pr-4 py-2.5 bg-page border border-line text-sm text-ink focus:outline-none focus:border-ink/50"
        />
      </div>

      <select aria-label="Lọc theo vai trò"
        value={roleFilter}
        onChange={(e) => setRoleFilter(e.target.value)}
        className="w-full md:w-auto px-4 py-2.5 bg-page border border-line text-sm text-ink focus:outline-none focus:border-ink/50 cursor-pointer"
      >
        <option value="all">Mọi vai trò</option>
        <option value="Audience">Khán giả</option>
        <option value="Owner">Chủ phòng trà</option>
        <option value="Staff">Nhân viên</option>
        <option value="Admin">Quản trị viên</option>
      </select>

      <select aria-label="Lọc theo trạng thái"
        value={statusFilter}
        onChange={(e) => setStatusFilter(e.target.value)}
        className="w-full md:w-auto px-4 py-2.5 bg-page border border-line text-sm text-ink focus:outline-none focus:border-ink/50 cursor-pointer"
      >
        <option value="all">Mọi trạng thái</option>
        <option value="active">Đang hoạt động</option>
        <option value="banned">Đã bị khoá</option>
      </select>
    </div>
  )
}

export default AccountsFilterBar