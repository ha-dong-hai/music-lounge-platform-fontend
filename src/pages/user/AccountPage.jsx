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

const MUC = [
  { key: 'profile', nhan: 'Thông tin tài khoản', icon: User },
  { key: 'followed', nhan: 'Phòng trà đang theo dõi', icon: Heart },
  { key: 'identity', nhan: 'Định danh và thuế', icon: ShieldCheck },
  { key: 'preferences', nhan: 'Sở thích gợi ý', icon: Sparkles },
  { key: 'privacy', nhan: 'Dữ liệu và tài khoản', icon: Lock },
]
const TABS_HOP_LE = MUC.map((m) => m.key)

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
    <div className="min-h-[60vh] bg-stock text-ink pb-16">
      <div className="max-w-[1200px] mx-auto px-4 sm:px-6 py-8">
        <h1 className="text-5xl text-ink mb-8">Tài khoản của tôi</h1>
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          
          {/* MENU MỤC — nút có aria-current khi đang mở (bản cũ chỉ đổi màu nền). */}
          <nav aria-label="Mục tài khoản" className="lg:col-span-1">
            <ul className="border-y-2 border-ink lg:sticky lg:top-24">
              {MUC.map(({ key, nhan, icon: Icon }) => (
                <li key={key} className="border-t border-ink/20 first:border-t-0">
                  <button type="button" onClick={() => setActiveTab(key)} aria-current={activeTab === key ? 'page' : undefined}
                    className={`w-full flex items-center gap-3 px-3 min-h-[48px] text-left font-semibold border-l-4 transition-colors ${activeTab === key ? 'bg-ink text-lamp border-ink' : 'text-ink border-transparent hover:bg-sunken'}`}>
                    <Icon size={18} aria-hidden="true" /> {nhan}
                  </button>
                </li>
              ))}
            </ul>
          </nav>

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