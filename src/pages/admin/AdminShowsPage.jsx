import { useState } from 'react'
import { ShieldAlert } from 'lucide-react'
import AllShowsTab from '../../components/admin/shows/AllShowsTab'
import PendingModerationTab from '../../components/admin/shows/PendingModerationTab'
import { getPendingModerations } from '../../services/adminServices'
import { getShows } from '../../services/showServices'
import { useDemTab } from '../../hooks/useDemTab'

// MLACP-685: số trên cả hai tab, cùng API + tham số của danh sách bên dưới (AllShowsTab gửi includeSoldOut: true). Trước
// đây số "Chờ duyệt" chỉ được đếm lại khi đổi tab — Admin duyệt xong hay chủ phòng trà gửi thêm thì số đứng yên.
const DEM = {
  all: () => getShows({ page: 1, pageSize: 1, includeSoldOut: true }),
  pending: () => getPendingModerations({ page: 1, pageSize: 1 }),
}

// Tab thứ hai là HÀNG ĐỢI DUYỆT mọi thứ chủ phòng trà gửi lên (buổi diễn, hạng vé, livestream —
// GET /moderations/pending). Trước đây tab mang nhãn "Hệ thống gắn cờ", nên Admin tìm buổi diễn chủ vừa
// gửi duyệt ở tab "Danh sách buổi diễn" (danh sách CÔNG KHAI, chỉ có buổi đã mở bán) và không thấy đâu
// (đo 30/09: buổi #15 ở trạng thái Pending không hiện ở tab mặc định). Nay gọi đúng tên và hiện số đang chờ.
const AdminShowsPage = () => {
  const [activeTab, setActiveTab] = useState('all')
  const dem = useDemTab('admin-buoi-dien', DEM)
  const soChoDuyet = dem.pending

  return (
    <div>
      <div className="flex items-center gap-3 mb-6">
        <div>
          <h1 className="text-4xl text-ink">Buổi diễn</h1>
          <p className="text-ink-soft text-sm">
            Buổi diễn, hạng vé và phiên phát trực tuyến chủ phòng trà gửi lên nằm ở tab Chờ duyệt. Điểm an toàn do hệ thống chấm giúp ưu tiên xem trước.
          </p>
        </div>
      </div>

      <div className="mb-6 border-b border-line">
        <div className="flex gap-8">
          <button
            onClick={() => setActiveTab('all')} aria-pressed={activeTab === 'all'}
            className={`min-h-[44px] pb-3 text-base font-bold border-b-2 transition-colors ${activeTab === 'all' ? 'border-ink text-ink' : 'border-transparent text-ink-mute hover:text-ink'}`}
          >
            Buổi diễn đang mở bán
            {dem.all != null && <span className="ml-2 font-mono text-sm tabular-nums">{dem.all.toLocaleString('vi-VN')}</span>}
          </button>
          <button
            onClick={() => setActiveTab('pending')} aria-pressed={activeTab === 'pending'}
            className={`min-h-[44px] pb-3 text-base font-bold border-b-2 transition-colors flex items-center gap-2 ${activeTab === 'pending' ? 'border-ink text-ink' : 'border-transparent text-ink-mute hover:text-ink'}`}
          >
            <ShieldAlert size={16} />
            Chờ duyệt
            {soChoDuyet > 0 && (
              <span className="min-w-[1.25rem] px-1.5 py-0.5 bg-danger text-lamp text-xs leading-none tabular-nums">
                {soChoDuyet}
              </span>
            )}
          </button>
        </div>
      </div>

      {activeTab === 'all' && <AllShowsTab />}
      {activeTab === 'pending' && <PendingModerationTab />}
    </div>
  )
}

export default AdminShowsPage
