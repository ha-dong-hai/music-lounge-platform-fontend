import { Ban, Building2, User as UserIcon, Users as UsersIcon } from 'lucide-react'

const StatsCards = ({ stats, roleFilter, statusFilter, onSelectFilter }) => {
  const cards = [
    {
      key: 'total', label: 'Tổng tài khoản', value: stats.total,
      icon: <UsersIcon size={24} className="text-[#C3B665]" />, iconBg: 'bg-[#C3B665]/10',
      active: roleFilter === 'all' && statusFilter === 'all', activeStyle: 'border-[#C3B665] ring-1 ring-[#C3B665]',
      onClick: () => onSelectFilter('all', 'all'),
    },
    {
      key: 'users', label: 'Người dùng', value: stats.users,
      icon: <UserIcon size={24} className="text-gray-400" />, iconBg: 'bg-gray-500/10',
      active: roleFilter === 'Audience', activeStyle: 'border-gray-400 ring-1 ring-gray-400',
      onClick: () => onSelectFilter('Audience', 'all'),
    },
    {
      key: 'owners', label: 'Chủ phòng trà', value: stats.owners,
      icon: <Building2 size={24} className="text-blue-400" />, iconBg: 'bg-blue-500/10',
      active: roleFilter === 'Owner', activeStyle: 'border-blue-500 ring-1 ring-blue-500',
      onClick: () => onSelectFilter('Owner', 'all'),
    },
    {
      key: 'banned', label: 'Bị khóa', value: stats.banned,
      icon: <Ban size={24} className="text-red-400" />, iconBg: 'bg-red-500/10',
      active: statusFilter === 'banned', activeStyle: 'border-red-500 ring-1 ring-red-500',
      onClick: () => onSelectFilter('all', 'banned'),
    },
  ]

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {cards.map(card => (
        <button
          key={card.key}
          onClick={card.onClick}
          className={`bg-gray-900 border rounded-xl p-5 flex items-center gap-4 text-left transition-all ${
            card.active ? card.activeStyle : 'border-gray-800 hover:border-gray-700'
          }`}
        >
          <div className={`p-3 ${card.iconBg} rounded-lg`}>{card.icon}</div>
          <div>
            <p className="text-sm text-gray-500 mb-1">{card.label}</p>
            <p className="text-2xl font-bold text-white">{card.value}</p>
          </div>
        </button>
      ))}
    </div>
  )
}

export default StatsCards