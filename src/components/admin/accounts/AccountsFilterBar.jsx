import { Search } from 'lucide-react'

const AccountsFilterBar = ({ 
  searchQuery, setSearchQuery, 
  roleFilter, setRoleFilter, 
  statusFilter, setStatusFilter 
}) => {
  return (
    <div className="bg-card border border-line rounded-xl p-4 flex flex-col md:flex-row gap-4 items-center">
      <div className="relative flex-1 w-full">
        <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-mute" />
        <input
          type="text"
          placeholder="Search name, email, or phone number..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-10 pr-4 py-2.5 bg-page border border-line rounded-lg text-sm text-ink focus:outline-none focus:border-brand/50"
        />
      </div>

      <select
        value={roleFilter}
        onChange={(e) => setRoleFilter(e.target.value)}
        className="w-full md:w-auto px-4 py-2.5 bg-page border border-line rounded-lg text-sm text-ink focus:outline-none focus:border-brand/50 cursor-pointer"
      >
        <option value="all">All roles</option>
        <option value="Audience">Customer</option>
        <option value="Owner">Owner</option>
        <option value="Staff">Staff</option>
        <option value="Admin">Admin</option>
      </select>

      <select
        value={statusFilter}
        onChange={(e) => setStatusFilter(e.target.value)}
        className="w-full md:w-auto px-4 py-2.5 bg-page border border-line rounded-lg text-sm text-ink focus:outline-none focus:border-brand/50 cursor-pointer"
      >
        <option value="all">All status</option>
        <option value="active">Active</option>
        <option value="banned">Banned</option>
      </select>
    </div>
  )
}

export default AccountsFilterBar