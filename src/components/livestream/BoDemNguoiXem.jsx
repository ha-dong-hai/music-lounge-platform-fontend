// src/components/livestream/BoDemNguoiXem.jsx
//
// BỘ ĐẾM NGƯỜI XEM (D2, chủ dự án chọn 02/10/2026) — số người đang xem buổi phát trực tuyến in bằng ô chữ lật KyTuLat,
// mỗi lần số đổi (tín hiệu SignalR ViewerCountUpdated thật) thì các ô lật một lần như bảng điện.
//
// QUY TẮC:
//  - CHỈ ở trang XEM. Không đặt ở trang bán vé: số người đang xem ở đó là áp lực mua (deceptive.design — fake urgency),
//    kể cả khi số là thật.
//  - Không aria-live: số đổi liên tục, đọc to mỗi lần là làm phiền; trình đọc màn hình vẫn đọc được khi đi tới (sr-only).
//  - key theo con số → mỗi lần đổi dựng lại KyTuLat để lật đúng một lần; giảm chuyển động thì KyTuLat không lật.
import { Eye } from 'lucide-react'
import KyTuLat from '../program/KyTuLat'
import { formatCompactNumber } from '../../utils/format'

const BoDemNguoiXem = ({ so = 0 }) => {
  const chu = formatCompactNumber(so)
  return (
    <span className="inline-flex items-center gap-1.5">
      <Eye size={12} aria-hidden="true" />
      <span aria-hidden="true"><KyTuLat key={chu} chu={chu} tone="ink" className="text-[11px]" /></span>
      <span className="sr-only">{chu} người đang xem</span>
    </span>
  )
}

export default BoDemNguoiXem
