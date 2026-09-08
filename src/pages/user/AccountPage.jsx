// src/pages/user/AccountPage.jsx
import { useState } from 'react'
import { User, Heart } from 'lucide-react'
import ProfileTab from '../../components/account/ProfileTab'
import FollowedLoungesTab from '../../components/account/FollowedLoungesTab'

const AccountPage = () => {
  const [activeTab, setActiveTab] = useState('profile')

  return (
    <div className="min-h-screen bg-black text-white pb-16">
      <div className="max-w-[1200px] mx-auto px-4 sm:px-6 py-8">
        <h1 className="text-3xl font-bold text-white mb-8">Tài khoản của tôi</h1>
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          
          {/* SIDEBAR TABS */}
          <div className="lg:col-span-1">
            <div className="bg-gray-900 border border-gray-800 rounded-2xl p-4 space-y-2 sticky top-24">
              <button 
                onClick={() => setActiveTab('profile')} 
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${activeTab === 'profile' ? 'bg-gray-800 text-[#C3B665]' : 'text-gray-400 hover:text-white hover:bg-gray-800/50'}`}
              >
                <User size={18} /> Thông tin tài khoản
              </button>
              <button 
                onClick={() => setActiveTab('followed')} 
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${activeTab === 'followed' ? 'bg-gray-800 text-[#C3B665]' : 'text-gray-400 hover:text-white hover:bg-gray-800/50'}`}
              >
                <Heart size={18} /> Phòng trà đang theo dõi
              </button>
            </div>
          </div>

          {/* NỘI DUNG TAB */}
          <div className="lg:col-span-3">
            {activeTab === 'profile' && <ProfileTab />}
            {activeTab === 'followed' && <FollowedLoungesTab />}
          </div>
        </div>
      </div>
    </div>
  )
}

export default AccountPage