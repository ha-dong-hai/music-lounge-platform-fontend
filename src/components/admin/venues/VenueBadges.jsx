// ===== CONFIG: 6 TRẠNG THÁI VENUE (nguồn sự thật duy nhất) =====
export const VENUE_STATUS_CONFIG = {
  Pending:   { label: 'Pending',    cls: 'bg-yellow-500/15 text-warning border-yellow-500/30', dot: 'bg-yellow-400' },
  Approved:  { label: 'Approved',     cls: 'bg-green-500/15 text-success border-green-500/30', dot: 'bg-green-400' },
  Warned:    { label: 'Warned',  cls: 'bg-orange-500/15 text-orange-700 border-orange-500/30', dot: 'bg-orange-400' },
  Suspended: { label: 'Suspended',    cls: 'bg-purple-500/15 text-purple-700 border-purple-500/30', dot: 'bg-purple-400' },
  Locked:    { label: 'Locked',      cls: 'bg-red-500/15 text-danger border-red-500/30', dot: 'bg-red-400' },
  Rejected:  { label: 'Rejected',   cls: 'bg-line-strong/15 text-ink-soft border-line-strong/30', dot: 'bg-gray-400' },
}

export const VenueStatusBadge = ({ status }) => {
  const cfg = VENUE_STATUS_CONFIG[status]
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border whitespace-nowrap ${cfg ? cfg.cls : 'bg-line-strong/15 text-ink-soft border-line-strong/30'}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${cfg?.dot || 'bg-gray-400'}`} />
      {cfg ? cfg.label : (status || '—')}
    </span>
  )
}

// Badge giấy phép kinh doanh
export const LicenseBadge = ({ hasLicense }) => (
  <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold border whitespace-nowrap ${
    hasLicense
      ? 'bg-green-500/15 text-success border-green-500/30'
      : 'bg-red-500/15 text-danger border-red-500/30'
  }`}>
    {hasLicense ? '✔ Has License' : '✘ No License'}
  </span>
)