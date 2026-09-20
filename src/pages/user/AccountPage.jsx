// src/pages/user/AccountPage.jsx
import { useState } from 'react'
import { User, Heart, ShieldCheck, Sparkles, Lock } from 'lucide-react'
import ProfileTab from '../../components/account/ProfileTab'
import FollowedLoungesTab from '../../components/account/FollowedLoungesTab'
import IdentityTab from '../../components/account/IdentityTab'
import PreferencesTab from '../../components/account/PreferencesTab'
import PrivacyTab from '../../components/account/PrivacyTab'

const AccountPage = () => {
  const [activeTab, setActiveTab] = useState('profile')

  return (
    <div className="min-h-screen bg-black text-white pb-16">
      <div className="max-w-[1200px] mx-auto px-4 sm:px-6 py-8">
        <h1 className="text-3xl font-bold text-white mb-8">My account</h1>
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          
          {/* SIDEBAR TABS */}
          <div className="lg:col-span-1">
            <div className="bg-gray-900 border border-gray-800 rounded-2xl p-4 space-y-2 sticky top-24">
              <button 
                onClick={() => setActiveTab('profile')} 
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${activeTab === 'profile' ? 'bg-gray-800 text-[#C3B665]' : 'text-gray-400 hover:text-white hover:bg-gray-800/50'}`}
              >
                <User size={18} /> Account information
              </button>
              <button 
                onClick={() => setActiveTab('followed')} 
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${activeTab === 'followed' ? 'bg-gray-800 text-[#C3B665]' : 'text-gray-400 hover:text-white hover:bg-gray-800/50'}`}
              >
                <Heart size={18} /> Followed lounge
              </button>
              <button
                onClick={() => setActiveTab('identity')}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${activeTab === 'identity' ? 'bg-gray-800 text-[#C3B665]' : 'text-gray-400 hover:text-white hover:bg-gray-800/50'}`}
              >
                <ShieldCheck size={18} /> Định danh &amp; thuế
              </button>
              <button
                onClick={() => setActiveTab('preferences')}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${activeTab === 'preferences' ? 'bg-gray-800 text-[#C3B665]' : 'text-gray-400 hover:text-white hover:bg-gray-800/50'}`}
              >
                <Sparkles size={18} /> Sở thích gợi ý
              </button>
              <button
                onClick={() => setActiveTab('privacy')}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${activeTab === 'privacy' ? 'bg-gray-800 text-[#C3B665]' : 'text-gray-400 hover:text-white hover:bg-gray-800/50'}`}
              >
                <Lock size={18} /> Dữ liệu &amp; tài khoản
              </button>
            </div>
          </div>

          {/* NỘI DUNG TAB */}
          <div className="lg:col-span-3">
            {activeTab === 'profile' && <ProfileTab />}
            {activeTab === 'followed' && <FollowedLoungesTab />}
            {activeTab === 'identity' && <IdentityTab />}
            {activeTab === 'preferences' && <PreferencesTab />}
            {activeTab === 'privacy' && <PrivacyTab />}
          </div>
        </div>
      </div>
    </div>
  )
}

export default AccountPage