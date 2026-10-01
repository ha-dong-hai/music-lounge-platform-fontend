// src/components/livestream/LivestreamHeader.jsx
// Thanh đầu trang xem livestream: tên show, LIVE, số người xem, trạng thái kết nối SignalR,
// và hai nút can thiệp.
import { Link } from 'react-router-dom'
import { ArrowLeft, Eye, WifiOff, Square, ShieldOff } from 'lucide-react'
import { formatCompactNumber } from '../../utils/format'

const CONNECTION_LABELS = {
  connecting: 'Đang kết nối…',
  reconnecting: 'Đang kết nối lại…',
  disconnected: 'Mất kết nối',
}

const LivestreamHeader = ({
  showId,
  showName,
  viewerCount,
  connectionState,
  onEndClick,
  canTerminate,
  onTerminateClick,
}) => (
  <div className="flex-none flex items-center gap-4 px-4 py-2.5 bg-card border-b border-line z-50">
    <Link
      to={`/shows/${showId}`}
      className="p-1.5 hover:bg-sunken rounded-full transition-colors flex-shrink-0"
    >
      <ArrowLeft size={20} />
    </Link>

    <div className="flex-1 min-w-0">
      <h1 className="text-base font-bold truncate">{showName}</h1>
      <p className="text-xs text-ink-soft flex items-center gap-2 flex-wrap">
        <span className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse inline-block"></span> LIVE
        </span>
        <span className="flex items-center gap-1">
          <Eye size={12} /> {formatCompactNumber(viewerCount)}
        </span>
        {connectionState !== 'connected' && (
          <span className="flex items-center gap-1 text-warning">
            <WifiOff size={11} /> {CONNECTION_LABELS[connectionState] ?? 'Đang kết nối…'}
          </span>
        )}
      </p>
    </div>

    <button
      onClick={onEndClick}
      className="flex-shrink-0 flex items-center gap-1.5 px-3 py-2 rounded-lg bg-red-500/10 border border-red-500/40 text-danger text-xs font-bold hover:bg-red-500/20 transition-colors"
      title="Kết thúc stream (test modal đánh giá)"
    >
      <Square size={12} className="fill-red-400" /> Kết thúc
    </button>

    {/* CẮT SÓNG — chỉ Admin. Khác hẳn "Kết thúc" của người vận hành: đây là can thiệp từ ngoài
        vào buổi đang phát vì vi phạm nội dung, và là trạng thái cuối. */}
    {canTerminate && (
      <button
        onClick={onTerminateClick}
        className="flex-shrink-0 flex items-center gap-1.5 px-3 py-2 rounded-lg bg-red-600/20 border border-red-600 text-danger text-xs font-bold hover:bg-red-600/30 transition-colors"
        title="Admin dừng buổi phát vì vi phạm nội dung"
      >
        <ShieldOff size={12} /> Cắt sóng
      </button>
    )}
  </div>
)

export default LivestreamHeader