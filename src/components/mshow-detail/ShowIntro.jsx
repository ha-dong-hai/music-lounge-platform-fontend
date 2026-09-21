// src/components/mshow-detail/EventIntro.jsx
import { Plus, Link as LinkIcon, Check, Star } from 'lucide-react'
import { Link } from 'react-router-dom'

const ShowIntro  = ({ data, isFollowing, onToggleFollow }) => {
  if (!data) return null

  return (
    <div className="rounded-2xl md:p-10">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
        
        {/* CỘT TRÁI: Mô tả và Tag cảm xúc */}
        <div className="lg:col-span-7 flex flex-col h-full bg-card border border-line rounded-2xl p-6 md:p-8">
          <h2 className="text-3xl font-bold text-brand-text mb-6">Thông tin chi tiết</h2>
          <div className="prose max-w-none text-ink-soft text-lg leading-relaxed whitespace-pre-line flex-1 mb-8">
            {data.description}
          </div>
          <div className="flex items-center gap-3 mt-auto pt-4 border-t border-line">
            <span className="text-sm font-bold text-ink-mute">Không khí:</span>
            {data.moodTags.map(tag => (
              <span key={tag} className="bg-brand/15 text-brand-text px-4 py-1.5 rounded-md text-sm font-medium border border-brand/30">
                {tag}
              </span>
            ))}
          </div>
        </div>

        {/* CỘT GIỮA: Danh sách thông tin */}
        <div className="lg:col-span-3 space-y-6">
          <div className="p-5">
            <h3 className="text-sm font-bold text-brand-text mb-1">Phòng trà</h3>
            <Link to={`/lounge/${data.loungeId}`} className="text-ink hover:text-brand-text transition-colors flex items-center gap-1.5 group">
              {data.loungeName}
              <LinkIcon size={14} className="opacity-0 group-hover:opacity-100 transition-opacity" />
            </Link>
          </div>
          <div className="p-5">
            <h3 className="text-sm font-bold text-brand-text mb-1">Thể loại</h3>
            <p className="text-ink">{data.genre}</p>
          </div>
          <div className="p-5">
            <h3 className="text-sm font-bold text-brand-text mb-3">Nghệ sĩ</h3>
            {data.performers && data.performers.length > 0 ? (
              <div className="space-y-3">
                {/* Mỗi nghệ sĩ dẫn sang trang riêng: lịch diễn của họ + sao kê donate công khai. */}
                {data.performers.map(p => (
                  <Link key={p.id} to={`/performers/${p.id}`} className="flex items-center gap-3 group">
                    <img 
                      src={p.avatarUrl || `https://api.dicebear.com/7.x/initials/svg?seed=${p.name}&backgroundColor=1f2937`} 
                      alt={p.name} 
                      className="w-10 h-10 rounded-full object-cover border border-line flex-shrink-0"
                    />
                    <div className="min-w-0">
                      <p className="text-ink text-sm font-medium truncate group-hover:text-brand-text transition-colors">{p.name}</p>
                      {p.acceptsDonation && (
                        <span className="inline-flex items-center gap-1 text-xs text-brand-text mt-0.5">
                          <Star size={10} className="fill-brand-text" /> Nhận donate
                        </span>
                      )}
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <p className="text-ink text-sm">Updating</p>
            )}
          </div>
        </div>

        {/* CỘT PHẢI: Logo & Button Theo dõi */}
        <div className="lg:col-span-2 flex flex-col items-center justify-start pt-2">
          <div className="w-24 h-24 rounded-full bg-card overflow-hidden shadow-md mb-4 border-2 border-brand">
            <img src={data.loungeLogo} alt="Lounge Logo" className="w-full h-full object-cover" />
          </div>
          
          {/* ⭐ DÙNG PROPS TỪ CHA */}
          <button 
            onClick={onToggleFollow}
            className={`flex items-center gap-1.5 px-5 py-2 rounded-lg font-bold text-sm transition-colors w-full justify-center ${
              isFollowing 
                ? "bg-brand/10 text-brand-text border border-brand/30 hover:bg-red-500/10 hover:text-danger hover:border-red-500/30" 
                : "border-2 border-brand text-brand-text hover:bg-brand-hover hover:text-on-brand"
            }`}
          >
            {isFollowing ? (
              <><Check size={16} strokeWidth={3}/> Đang theo dõi</>
            ) : (
              <><Plus size={16} strokeWidth={3}/> Theo dõi</>
            )}
          </button>
        </div>

      </div>
    </div>
  )
}

export default ShowIntro