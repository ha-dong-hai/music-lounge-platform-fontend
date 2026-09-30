export const RoleBadge = ({ role }) => {
  const styles = {
    admin: 'bg-ink/15 text-ink border-ink/30',
    owner: 'bg-ink/15 text-ink border-ink/30',
    staff: 'bg-warning/15 text-warning border-warning/30',
    audience: 'bg-line-strong/15 text-ink-soft border-line-strong/30',
  }
  const labels = { admin: 'Admin', owner: 'Owner', staff: 'Staff', audience: 'Audience' }
  const key = role ? role.toLowerCase() : 'audience'
  return (
    <span className={`inline-flex items-center px-2.5 py-1 text-xs font-medium border ${styles[key]}`}>
      {labels[key]}
    </span>
  )
}

export const StatusBadge = ({ isActive }) => {
  const styles = isActive
    ? 'bg-success/15 text-success border-success/30'
    : 'bg-danger/15 text-danger border-danger/30'
  return (
    <span className={`inline-flex items-center gap-1 px-2.5 py-1 text-xs font-bold border ${styles}`}>
      <span className={`w-1.5 h-1.5 ${isActive ? 'bg-success' : 'bg-danger'}`}></span>
      {isActive ? 'Active' : 'Banned'}
    </span>
  )
}