import { Ban, Building2, UserCog, User as UserIcon, Users as UsersIcon } from 'lucide-react'

const StatsCards = ({ stats, roleFilter, statusFilter, onSelectFilter }) => {
  const cards = [
    {
      key: 'total', label: 'Tổng', value: stats.total,
      icon: <UsersIcon size={24} className="text-ink" />, iconBg: 'bg-ink/10',
      active: roleFilter === 'all' && statusFilter === 'all', activeStyle: 'border-ink ring-1 ring-ink',
      onClick: () => onSelectFilter('all', 'all'),
    },
    {
      key: 'users', label: 'Khán giả', value: stats.users,
      icon: <UserIcon size={24} className="text-ink-soft" />, iconBg: 'bg-line-strong/10',
      active: roleFilter === 'Audience', activeStyle: 'border-line-strong ring-1 ring-line-strong',
      onClick: () => onSelectFilter('Audience', 'all'),
    },
    {
      key: 'owners', label: 'Chủ phòng trà', value: stats.owners,
      icon: <Building2 size={24} className="text-ink" />, iconBg: 'bg-ink/10',
      active: roleFilter === 'Owner', activeStyle: 'border-ink ring-1 ring-ink',
      onClick: () => onSelectFilter('Owner', 'all'),
    },
    {
      key: 'staff', label: 'Nhân viên', value: stats.staff,
      icon: <UserCog size={24} className="text-warning" />, iconBg: 'bg-warning/10',
      active: roleFilter === 'Staff', activeStyle: 'border-warning ring-1 ring-warning',
      onClick: () => onSelectFilter('Staff', 'all'),
    },
    {
      key: 'banned', label: 'Đã bị khoá', value: stats.banned,
      icon: <Ban size={24} className="text-danger" />, iconBg: 'bg-danger/10',
      active: statusFilter === 'banned', activeStyle: 'border-danger ring-1 ring-danger',
      onClick: () => onSelectFilter('all', 'banned'),
    },
  ]

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
      {cards.map(card => (
        <button
          key={card.key}
          onClick={card.onClick}
          className={`bg-card border p-5 flex items-center gap-4 text-left transition-all ${
            card.active ? card.activeStyle : 'border-line hover:border-line'
          }`}
        >
          <div className={`p-3 ${card.iconBg}`}>{card.icon}</div>
          <div>
            <p className="text-sm text-ink-mute mb-1">{card.label}</p>
            <p className="text-2xl font-bold text-ink">{card.value}</p>
          </div>
        </button>
      ))}
    </div>
  )
}

export default StatsCards