// src/components/admin/kyc/KycBadges.jsx
// Config dùng chung — page (tabs) và DocBlock (chip) cùng đọc từ đây

export const KYC_TABS = [
  { key: 'Pending', label: 'Chờ duyệt' },
  { key: 'Approved', label: 'Đã duyệt' },
  { key: 'Rejected', label: 'Đã từ chối' },
]

export const KYC_STATUS_CHIP = {
  Pending: 'bg-warning/10 text-warning border-warning/30',
  Approved: 'bg-success/10 text-success border-success/30',
  Rejected: 'bg-danger/10 text-danger border-danger/30',
}

export const KycStatusChip = ({ status }) => (
  <span className={`px-2 py-0.5 rounded-md border text-xs font-medium whitespace-nowrap ${
    KYC_STATUS_CHIP[status] ?? 'bg-line-strong/10 text-ink-soft border-line-strong/30'
  }`}>
    {status}
  </span>
)