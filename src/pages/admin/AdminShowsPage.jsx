import { useState, useEffect } from 'react'
import { Music, ShieldAlert } from 'lucide-react'
import AllShowsTab from '../../components/admin/shows/AllShowsTab'
import PendingModerationTab from '../../components/admin/shows/PendingModerationTab'
import { getPendingModerations } from '../../services/adminServices'

// Tab thứ hai là HÀNG ĐỢI DUYỆT mọi thứ chủ phòng trà gửi lên (buổi diễn, hạng vé, livestream —
// GET /moderations/pending). Trước đây tab mang nhãn "Hệ thống gắn cờ", nên Admin tìm buổi diễn chủ vừa
// gửi duyệt ở tab "Danh sách buổi diễn" (danh sách CÔNG KHAI, chỉ có buổi đã mở bán) và không thấy đâu
// (đo 30/09: buổi #15 ở trạng thái Pending không hiện ở tab mặc định). Nay gọi đúng tên và hiện số đang chờ.
const AdminShowsPage = () => {
  const [activeTab, setActiveTab] = useState('all')
  const [soChoDuyet, setSoChoDuyet] = useState(null)

  useEffect(() => {
    let huy = false
    getPendingModerations({ page: 1, pageSize: 1 })
      .then((res) => { if (!huy && res.success) setSoChoDuyet(res.data?.totalCount ?? null) })
      .catch(() => {}) // không đếm được thì chỉ không hiện số, không chặn gì
    return () => { huy = true }
  }, [activeTab])

  return (
    <div>
      <div className="flex items-center gap-3 mb-6">
        <Music size={28} className="text-ink" />
        <div>
          <h1 className="text-2xl font-bold text-ink">Quản lý buổi diễn</h1>
          <p className="text-ink-soft text-sm">
            Buổi diễn, hạng vé và livestream chủ phòng trà gửi lên nằm ở tab Chờ duyệt. Điểm an toàn do hệ thống chấm giúp ưu tiên xem trước.
          </p>
        </div>
      </div>

      <div className="mb-6 border-b border-line">
        <div className="flex gap-8">
          <button
            onClick={() => setActiveTab('all')}
            className={`pb-4 text-base font-bold border-b-2 transition-colors ${activeTab === 'all' ? 'border-ink text-ink' : 'border-transparent text-ink-mute hover:text-ink'}`}
          >
            Buổi diễn đang mở bán
          </button>
          <button
            onClick={() => setActiveTab('pending')}
            className={`pb-4 text-base font-bold border-b-2 transition-colors flex items-center gap-2 ${activeTab === 'pending' ? 'border-ink text-ink' : 'border-transparent text-ink-mute hover:text-ink'}`}
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
