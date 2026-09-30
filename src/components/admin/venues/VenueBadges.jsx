// ===== CONFIG: 6 TRẠNG THÁI VENUE (nguồn sự thật duy nhất) =====
export const VENUE_STATUS_CONFIG = {
  Pending:   { label: 'Chờ duyệt',   cls: 'bg-warning/15 text-warning border-warning/30', dot: 'bg-warning' },
  Approved:  { label: 'Đã duyệt',    cls: 'bg-success/15 text-success border-success/30', dot: 'bg-success' },
  Warned:    { label: 'Bị cảnh báo', cls: 'bg-warning/15 text-warning border-warning/30', dot: 'bg-warning' },
  Suspended: { label: 'Tạm ngưng',   cls: 'bg-ink/15 text-ink border-ink/30', dot: 'bg-ink' },
  Locked:    { label: 'Bị khoá',     cls: 'bg-danger/15 text-danger border-danger/30', dot: 'bg-danger' },
  Rejected:  { label: 'Bị từ chối',  cls: 'bg-line-strong/15 text-ink-soft border-line-strong/30', dot: 'bg-line' },
}

export const VenueStatusBadge = ({ status }) => {
  const cfg = VENUE_STATUS_CONFIG[status]
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium border whitespace-nowrap ${cfg ? cfg.cls : 'bg-line-strong/15 text-ink-soft border-line-strong/30'}`}>
      <span className={`w-1.5 h-1.5 ${cfg?.dot || 'bg-line'}`} />
      {cfg ? cfg.label : (status || '—')}
    </span>
  )
}

// Badge giấy phép kinh doanh
export const LicenseBadge = ({ hasLicense }) => (
  <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-bold border whitespace-nowrap ${
    hasLicense
      ? 'bg-success/15 text-success border-success/30'
      : 'bg-danger/15 text-danger border-danger/30'
  }`}>
    {hasLicense ? '✔ Có giấy phép' : '✘ Chưa có giấy phép'}
  </span>
)