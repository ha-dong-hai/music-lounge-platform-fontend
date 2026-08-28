import { useState } from 'react'
import { Music, ShieldAlert } from 'lucide-react'
import AllShowsTab from '../../components/admin/shows/AllShowsTab'
import PendingModerationTab from '../../components/admin/shows/PendingModerationTab'

const AdminShowsPage = () => {
  const [activeTab, setActiveTab] = useState('all')

  return (
    <div>
      <div className="flex items-center gap-3 mb-6">
        <Music size={28} className="text-[#C3B665]" />
        <div>
          <h1 className="text-2xl font-bold text-white">Quản lý Chương trình Âm nhạc</h1>
          <p className="text-gray-400 text-sm">
            Hệ thống AI tự động duyệt nội dung an toàn. Các nội dung điểm thấp sẽ được chuyển sang duyệt thủ công.
          </p>
        </div>
      </div>

      <div className="mb-6 border-b border-gray-800">
        <div className="flex gap-8">
          <button 
            onClick={() => setActiveTab('all')} 
            className={`pb-4 text-base font-bold border-b-2 transition-colors ${activeTab === 'all' ? 'border-[#C3B665] text-[#C3B665]' : 'border-transparent text-gray-500 hover:text-white'}`}
          >
            Danh sách chương trình
          </button>
          <button 
            onClick={() => setActiveTab('pending')} 
            className={`pb-4 text-base font-bold border-b-2 transition-colors flex items-center gap-2 ${activeTab === 'pending' ? 'border-[#C3B665] text-[#C3B665]' : 'border-transparent text-gray-500 hover:text-white'}`}
          >
            Cảnh báo AI
            <ShieldAlert size={16} />
          </button>
        </div>
      </div>

      {activeTab === 'all' && <AllShowsTab />}
      {activeTab === 'pending' && <PendingModerationTab />}
    </div>
  )
}

export default AdminShowsPage