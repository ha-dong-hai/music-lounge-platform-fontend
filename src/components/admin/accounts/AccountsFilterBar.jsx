import { Search } from 'lucide-react'

const AccountsFilterBar = ({ 
  searchQuery, setSearchQuery, 
  roleFilter, setRoleFilter, 
  statusFilter, setStatusFilter 
}) => {
  return (
    <div className="bg-gray-900 border border-gray-800 rounded-xl p-4 flex flex-col md:flex-row gap-4 items-center">
      <div className="relative flex-1 w-full">
        <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
        <input
          type="text"
          placeholder="Tìm tên, email, hoặc SĐT..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-10 pr-4 py-2.5 bg-black border border-gray-800 rounded-lg text-sm text-white focus:outline-none focus:border-[#C3B665]/50"
        />
      </div>

      <select
        value={roleFilter}
        onChange={(e) => setRoleFilter(e.target.value)}
        className="w-full md:w-auto px-4 py-2.5 bg-black border border-gray-800 rounded-lg text-sm text-white focus:outline-none focus:border-[#C3B665]/50 cursor-pointer"
      >
        <option value="all">Tất cả vai trò</option>
        <option value="Audience">Người dùng</option>
        <option value="Owner">Chủ phòng trà</option>
        <option value="Staff">Nhân viên</option>
        <option value="Admin">Admin</option>
      </select>

      <select
        value={statusFilter}
        onChange={(e) => setStatusFilter(e.target.value)}
        className="w-full md:w-auto px-4 py-2.5 bg-black border border-gray-800 rounded-lg text-sm text-white focus:outline-none focus:border-[#C3B665]/50 cursor-pointer"
      >
        <option value="all">Tất cả trạng thái</option>
        <option value="active">Hoạt động</option>
        <option value="banned">Bị khóa</option>
      </select>
    </div>
  )
}

export default AccountsFilterBar