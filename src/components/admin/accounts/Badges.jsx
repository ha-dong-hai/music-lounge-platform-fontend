export const RoleBadge = ({ role }) => {
  const styles = {
    admin: 'bg-purple-500/15 text-purple-400 border-purple-500/30',
    owner: 'bg-blue-500/15 text-blue-400 border-blue-500/30',
    staff: 'bg-orange-500/15 text-orange-400 border-orange-500/30',
    audience: 'bg-gray-500/15 text-gray-400 border-gray-500/30',
  }
  const labels = { admin: 'Admin', owner: 'Chủ phòng trà', staff: 'Nhân viên', audience: 'Người dùng' }
  const key = role ? role.toLowerCase() : 'audience'
  return (
    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium border ${styles[key]}`}>
      {labels[key]}
    </span>
  )
}

export const StatusBadge = ({ isActive }) => {
  const styles = isActive
    ? 'bg-green-500/15 text-green-400 border-green-500/30'
    : 'bg-red-500/15 text-red-400 border-red-500/30'
  return (
    <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold border ${styles}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${isActive ? 'bg-green-400' : 'bg-red-400'}`}></span>
      {isActive ? 'Hoạt động' : 'Bị khóa'}
    </span>
  )
}