// src/components/mshow-detail/EventIntro.jsx
import { Plus, Link as LinkIcon, Check} from 'lucide-react'
import { useState } from 'react'

import { Link } from 'react-router-dom'

const EventIntro = ({ data }) => {
  
  const [isFollowing, setIsFollowing] = useState(false)
  if (!data) return null

  return (
    <div className="rounded-2xl md:p-10">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
        
        {/* CỘT TRÁI: Mô tả và Tag cảm xúc */}
        <div className="lg:col-span-7 flex flex-col h-full bg-gray-900 border border-gray-800 rounded-2xl p-6 md:p-8">
          <h2 className="text-3xl font-bold text-[#C3B665] mb-6">Details</h2>
          <div className="prose max-w-none text-gray-300 text-lg leading-relaxed whitespace-pre-line flex-1 mb-8">
            {data.description}
          </div>
          <div className="flex items-center gap-3 mt-auto pt-4 border-t border-gray-800">
            <span className="text-sm font-bold text-gray-500">Moods:</span>
            {data.moodTags.map(tag => (
              <span key={tag} className="bg-[#C3B665]/15 text-[#C3B665] px-4 py-1.5 rounded-md text-sm font-medium border border-[#C3B665]/30">
                {tag}
              </span>
            ))}
          </div>
        </div>

        {/* CỘT GIỮA: Danh sách thông tin */}
        <div className="lg:col-span-3 space-y-6">
          <div className="p-5">
            <h3 className="text-sm font-bold text-[#C3B665] mb-1">Lounge</h3>
            <Link 
              to={`/lounge/${data.loungeId}`} 
              className="text-white hover:text-[#C3B665] transition-colors flex items-center gap-1.5 group"
            >
              {data.loungeName}
              <LinkIcon size={14} className="opacity-0 group-hover:opacity-100 transition-opacity" />
            </Link>
          </div>
          <div className="p-5">
            <h3 className="text-sm font-bold text-[#C3B665] mb-1">Rewatch</h3>
            <p className="text-gray-400 leading-snug">{data.replayCondition}</p>
          </div>
          <div className="p-5">
            <h3 className="text-sm font-bold text-[#C3B665] mb-1">Genres</h3>
            <p className="text-white">{data.genre}</p>
          </div>
          <div className="p-5">
            <h3 className="text-sm font-bold text-[#C3B665] mb-1">Dòng nhạc</h3>
            <p className="text-white">{data.subGenre}</p>
          </div>
        </div>

        {/* CỘT PHẢI: Logo & Button Theo dõi */}
        <div className="lg:col-span-2 flex flex-col items-center justify-start pt-2">
          
          <div className="w-24 h-24 rounded-full bg-gray-900 overflow-hidden shadow-md mb-4 border-2 border-[#C3B665]">
            <img src={data.loungeLogo} alt="Lounge Logo" className="w-full h-full object-cover" />
          </div>
          <button 
          onClick={() => setIsFollowing(!isFollowing)}
          className={`flex items-center gap-1.5 px-5 py-2 rounded-lg font-bold text-sm transition-colors w-full justify-center ${
              isFollowing 
                ? "bg-[#C3B665]/10 text-[#C3B665] border border-[#C3B665]/30 hover:bg-red-500/10 hover:text-red-400 hover:border-red-500/30" 
                : "border-2 border-[#C3B665] text-[#C3B665] hover:bg-[#C3B665] hover:text-black"
            }`}
          >
            {isFollowing ? (
              <>
                <Check size={16} strokeWidth={3}/> Đang theo dõi
              </>
            ) : (
              <>
                <Plus size={16} strokeWidth={3}/> Theo dõi
              </>
            )}
          </button>
        </div>

      </div>
    </div>
  )
}

export default EventIntro