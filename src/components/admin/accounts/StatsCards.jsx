import { Ban, Building2, UserCog, User as UserIcon, Users as UsersIcon } from 'lucide-react'
import OChiSo from '../../bang/OChiSo'

// Ô số liệu bấm để lọc danh sách tài khoản — dùng OChiSo chung (01/10/2026). Bản cũ là <button> không aria-pressed (trình
// đọc màn hình không biết ô nào đang lọc) và tô viền theo màu vai trò — màu không mang nghĩa nên đã bỏ.
const StatsCards = ({ stats, roleFilter, statusFilter, onSelectFilter }) => {
  const cards = [
    { key: 'total', label: 'Tổng', value: stats.total, icon: UsersIcon,
      active: roleFilter === 'all' && statusFilter === 'all', onClick: () => onSelectFilter('all', 'all') },
    { key: 'users', label: 'Khán giả', value: stats.users, icon: UserIcon,
      active: roleFilter === 'Audience', onClick: () => onSelectFilter('Audience', 'all') },
    { key: 'owners', label: 'Chủ phòng trà', value: stats.owners, icon: Building2,
      active: roleFilter === 'Owner', onClick: () => onSelectFilter('Owner', 'all') },
    { key: 'staff', label: 'Nhân viên', value: stats.staff, icon: UserCog,
      active: roleFilter === 'Staff', onClick: () => onSelectFilter('Staff', 'all') },
    { key: 'banned', label: 'Đã bị khoá', value: stats.banned, icon: Ban,
      active: statusFilter === 'banned', onClick: () => onSelectFilter('all', 'banned') },
  ]

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
      {cards.map(card => (
        <OChiSo key={card.key} nhan={card.label} so={card.value} icon={card.icon} dangChon={card.active} onClick={card.onClick} />
      ))}
    </div>
  )
}

export default StatsCards
