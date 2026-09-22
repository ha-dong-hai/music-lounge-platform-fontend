import { Building2, Clock, CheckCircle2, ShieldAlert } from 'lucide-react'

// Nhóm "Vấn đề" = tổng 4 status rủi ro
const PROBLEM_STATUSES = ['Warned', 'Suspended', 'Locked', 'Rejected']

// 4 thẻ chính: Tổng / Chờ duyệt / Đang hoạt động / Vấn đề
const VenuesStatsCards = ({ counts, statusFilter, onSelectStatus }) => {
  const problemCount = PROBLEM_STATUSES.reduce((sum, s) => sum + (counts[s] || 0), 0)

  // Thẻ "Vấn đề" active khi đang chọn 1 trong các status vấn đề
  const isProblemActive = PROBLEM_STATUSES.includes(statusFilter)

  const cards = [
    {
      key: 'all',
      label: 'Total venues',
      value: counts.total,
      icon: <Building2 size={24} className="text-brand-text" />,
      iconBg: 'bg-brand/10',
      active: statusFilter === 'all',
      activeStyle: 'border-brand ring-1 ring-brand',
      onClick: () => onSelectStatus('all'),
    },
    {
      key: 'Pending',
      label: 'Pending',
      value: counts.Pending || 0,
      icon: <Clock size={24} className="text-warning" />,
      iconBg: 'bg-yellow-500/10',
      active: statusFilter === 'Pending',
      activeStyle: 'border-yellow-500 ring-1 ring-yellow-500',
      onClick: () => onSelectStatus(statusFilter === 'Pending' ? 'all' : 'Pending'),
    },
    {
      key: 'Approved',
      label: 'Approved',
      value: counts.Approved || 0,
      icon: <CheckCircle2 size={24} className="text-success" />,
      iconBg: 'bg-green-500/10',
      active: statusFilter === 'Approved',
      activeStyle: 'border-green-500 ring-1 ring-green-500',
      onClick: () => onSelectStatus(statusFilter === 'Approved' ? 'all' : 'Approved'),
    },
    {
      key: 'problem',
      label: 'Problem',
      value: problemCount,
      icon: <ShieldAlert size={24} className="text-danger" />,
      iconBg: 'bg-red-500/10',
      active: isProblemActive,
      activeStyle: 'border-red-500 ring-1 ring-red-500',
      // Bấm → chọn status vấn đề đầu tiên có data (hoặc Warned mặc định)
      onClick: () => onSelectStatus(
        isProblemActive ? 'all'
          : (PROBLEM_STATUSES.find(s => (counts[s] || 0) > 0) || 'Warned')
      ),
    },
  ]

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {cards.map(card => (
        <button
          key={card.key}
          onClick={card.onClick}
          className={`bg-card border rounded-xl p-5 flex items-center gap-4 text-left transition-all ${
            card.active ? card.activeStyle : 'border-line hover:border-line'
          }`}
        >
          <div className={`p-3 ${card.iconBg} rounded-lg flex-shrink-0`}>{card.icon}</div>
          <div className="min-w-0">
            <p className="text-sm text-ink-mute mb-1 truncate">{card.label}</p>
            <p className="text-2xl font-bold text-ink">{card.value}</p>
          </div>
        </button>
      ))}
    </div>
  )
}

export default VenuesStatsCards