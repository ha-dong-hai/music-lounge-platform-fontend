import { Ban, Building2, UserCog, User as UserIcon, Users as UsersIcon } from 'lucide-react'

const StatsCards = ({ stats, roleFilter, statusFilter, onSelectFilter }) => {
  const cards = [
    {
      key: 'total', label: 'Total', value: stats.total,
      icon: <UsersIcon size={24} className="text-brand-text" />, iconBg: 'bg-brand/10',
      active: roleFilter === 'all' && statusFilter === 'all', activeStyle: 'border-brand ring-1 ring-brand',
      onClick: () => onSelectFilter('all', 'all'),
    },
    {
      key: 'users', label: 'Audience', value: stats.users,
      icon: <UserIcon size={24} className="text-ink-soft" />, iconBg: 'bg-line-strong/10',
      active: roleFilter === 'Audience', activeStyle: 'border-line-strong ring-1 ring-line-strong',
      onClick: () => onSelectFilter('Audience', 'all'),
    },
    {
      key: 'owners', label: 'Owner', value: stats.owners,
      icon: <Building2 size={24} className="text-sky-700" />, iconBg: 'bg-blue-500/10',
      active: roleFilter === 'Owner', activeStyle: 'border-blue-500 ring-1 ring-blue-500',
      onClick: () => onSelectFilter('Owner', 'all'),
    },
    {
      key: 'staff', label: 'Staff', value: stats.staff,
      icon: <UserCog size={24} className="text-orange-700" />, iconBg: 'bg-orange-500/10',
      active: roleFilter === 'Staff', activeStyle: 'border-orange-500 ring-1 ring-orange-500',
      onClick: () => onSelectFilter('Staff', 'all'),
    },
    {
      key: 'banned', label: 'Banned', value: stats.banned,
      icon: <Ban size={24} className="text-danger" />, iconBg: 'bg-red-500/10',
      active: statusFilter === 'banned', activeStyle: 'border-red-500 ring-1 ring-red-500',
      onClick: () => onSelectFilter('all', 'banned'),
    },
  ]

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
      {cards.map(card => (
        <button
          key={card.key}
          onClick={card.onClick}
          className={`bg-card border rounded-xl p-5 flex items-center gap-4 text-left transition-all ${
            card.active ? card.activeStyle : 'border-line hover:border-line'
          }`}
        >
          <div className={`p-3 ${card.iconBg} rounded-lg`}>{card.icon}</div>
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