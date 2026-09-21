import { useState } from 'react'
import { Music, ShieldAlert } from 'lucide-react'
import AllShowsTab from '../../components/admin/shows/AllShowsTab'
import PendingModerationTab from '../../components/admin/shows/PendingModerationTab'

const AdminShowsPage = () => {
  const [activeTab, setActiveTab] = useState('all')

  return (
    <div>
      <div className="flex items-center gap-3 mb-6">
        <Music size={28} className="text-brand-text" />
        <div>
          <h1 className="text-2xl font-bold text-ink">Show management</h1>
          <p className="text-ink-soft text-sm">
            System automatically reviews content for safety. Content with a low score is flagged for manual review.
          </p>
        </div>
      </div>

      <div className="mb-6 border-b border-line">
        <div className="flex gap-8">
          <button 
            onClick={() => setActiveTab('all')} 
            className={`pb-4 text-base font-bold border-b-2 transition-colors ${activeTab === 'all' ? 'border-brand text-brand-text' : 'border-transparent text-ink-mute hover:text-ink'}`}
          >
            List of show
          </button>
          <button 
            onClick={() => setActiveTab('pending')} 
            className={`pb-4 text-base font-bold border-b-2 transition-colors flex items-center gap-2 ${activeTab === 'pending' ? 'border-brand text-brand-text' : 'border-transparent text-ink-mute hover:text-ink'}`}
          >
            Flagged by system
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