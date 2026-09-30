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
      label: 'Tổng phòng trà',
      value: counts.total,
      icon: <Building2 size={24} className="text-ink" />,
      iconBg: 'bg-ink/10',
      active: statusFilter === 'all',
      activeStyle: 'border-ink ring-1 ring-ink',
      onClick: () => onSelectStatus('all'),
    },
    {
      key: 'Pending',
      label: 'Chờ duyệt',
      value: counts.Pending || 0,
      icon: <Clock size={24} className="text-warning" />,
      iconBg: 'bg-warning/10',
      active: statusFilter === 'Pending',
      activeStyle: 'border-warning ring-1 ring-warning',
      onClick: () => onSelectStatus(statusFilter === 'Pending' ? 'all' : 'Pending'),
    },
    {
      key: 'Approved',
      label: 'Đã duyệt',
      value: counts.Approved || 0,
      icon: <CheckCircle2 size={24} className="text-success" />,
      iconBg: 'bg-success/10',
      active: statusFilter === 'Approved',
      activeStyle: 'border-success ring-1 ring-success',
      onClick: () => onSelectStatus(statusFilter === 'Approved' ? 'all' : 'Approved'),
    },
    {
      key: 'problem',
      label: 'Có vấn đề',
      value: problemCount,
      icon: <ShieldAlert size={24} className="text-danger" />,
      iconBg: 'bg-danger/10',
      active: isProblemActive,
      activeStyle: 'border-danger ring-1 ring-danger',
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
          className={`bg-card border p-5 flex items-center gap-4 text-left transition-all ${
            card.active ? card.activeStyle : 'border-line hover:border-line'
          }`}
        >
          <div className={`p-3 ${card.iconBg} flex-shrink-0`}>{card.icon}</div>
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