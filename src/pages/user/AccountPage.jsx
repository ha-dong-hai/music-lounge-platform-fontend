// src/pages/user/AccountPage.jsx
//
// GHI CHÚ CHO ĐỘI FE:
// - Tab mở sẵn đọc từ ?tab= trên URL, và đổi tab thì ghi ngược lại vào URL. Cần thế vì có chỗ phải
//   DẪN THẲNG tới một tab: khu vực chủ phòng trà trỏ sang ?tab=identity, do xác minh danh tính là
//   cửa bắt buộc để bán vé mà lại nằm ở trang tài khoản chung.
// - Đọc/ghi qua useSearchParams chứ KHÔNG đồng bộ bằng useEffect: đặt state trong thân effect gây
//   render lặp, và ở đây còn làm nút Back của trình duyệt chạy sai.
import { useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { User, Heart, ShieldCheck, Sparkles, Lock } from 'lucide-react'
import ProfileTab from '../../components/account/ProfileTab'
import FollowedLoungesTab from '../../components/account/FollowedLoungesTab'
import IdentityTab from '../../components/account/IdentityTab'
import PreferencesTab from '../../components/account/PreferencesTab'
import PrivacyTab from '../../components/account/PrivacyTab'

const TABS_HOP_LE = ['profile', 'followed', 'identity', 'preferences', 'privacy']

const AccountPage = () => {
  const [searchParams, setSearchParams] = useSearchParams()
  // Tên tab lạ trên URL thì rơi về 'profile' thay vì hiện trang trống.
  const tabTuUrl = searchParams.get('tab')
  const [activeTab, setActiveTabState] = useState(
    TABS_HOP_LE.includes(tabTuUrl) ? tabTuUrl : 'profile',
  )

  const setActiveTab = (tab) => {
    setActiveTabState(tab)
    // replace: đổi tab không nên tạo thêm một mục lịch sử, nếu không bấm Back phải bấm nhiều lần
    // mới rời khỏi trang.
    setSearchParams({ tab }, { replace: true })
  }

  return (
    <div className="min-h-[60vh] bg-page text-ink pb-16">
      <div className="max-w-[1200px] mx-auto px-4 sm:px-6 py-8">
        <h1 className="text-3xl font-bold text-ink mb-8">Tài khoản của tôi</h1>
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          
          {/* SIDEBAR TABS */}
          <div className="lg:col-span-1">
            <div className="bg-card border border-line rounded-2xl p-4 space-y-2 sticky top-24">
              <button 
                onClick={() => setActiveTab('profile')} 
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${activeTab === 'profile' ? 'bg-sunken text-brand-text' : 'text-ink-soft hover:text-ink hover:bg-sunken/50'}`}
              >
                <User size={18} /> Account information
              </button>
              <button 
                onClick={() => setActiveTab('followed')} 
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${activeTab === 'followed' ? 'bg-sunken text-brand-text' : 'text-ink-soft hover:text-ink hover:bg-sunken/50'}`}
              >
                <Heart size={18} /> Followed lounge
              </button>
              <button
                onClick={() => setActiveTab('identity')}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${activeTab === 'identity' ? 'bg-sunken text-brand-text' : 'text-ink-soft hover:text-ink hover:bg-sunken/50'}`}
              >
                <ShieldCheck size={18} /> Định danh &amp; thuế
              </button>
              <button
                onClick={() => setActiveTab('preferences')}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${activeTab === 'preferences' ? 'bg-sunken text-brand-text' : 'text-ink-soft hover:text-ink hover:bg-sunken/50'}`}
              >
                <Sparkles size={18} /> Sở thích gợi ý
              </button>
              <button
                onClick={() => setActiveTab('privacy')}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${activeTab === 'privacy' ? 'bg-sunken text-brand-text' : 'text-ink-soft hover:text-ink hover:bg-sunken/50'}`}
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