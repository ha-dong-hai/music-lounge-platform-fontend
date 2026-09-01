// src/components/lounge/LoungeHero.jsx
import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, ChevronLeft, ChevronRight, Share2, UserPlus, Check } from 'lucide-react'
import toast from 'react-hot-toast'

const LoungeHero = ({ lounge, isFollowing, onToggleFollow }) => {
  const navigate = useNavigate()
  const [currentIndex, setCurrentIndex] = useState(0)

  const images = lounge?.images || []

  // AUTO-SLIDE mỗi 8s (reset khi bấm manual)
  useEffect(() => {
    if (images.length <= 1) return
    const timer = setInterval(() => {
      setCurrentIndex(prev => (prev + 1) % images.length)
    }, 8000)
    return () => clearInterval(timer)
  }, [images.length, currentIndex])

  if (!lounge) return null

  const goToPrev = () => setCurrentIndex(prev => (prev - 1 + images.length) % images.length)
  const goToNext = () => setCurrentIndex(prev => (prev + 1) % images.length)

  const handleShare = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href)
      toast.success('Đã sao chép link phòng trà!')
    } catch {
      toast.error('Không thể sao chép link.')
    }
  }

  const currentImage = images[currentIndex]

  return (
    <div className="relative w-full h-[500px] md:h-[600px] overflow-hidden bg-gray-900 group">

      {/* ===== SLIDES ===== */}
      {images.map((img, index) => (
        <div key={index} className={`absolute inset-0 transition-opacity duration-1000 ease-in-out ${index === currentIndex ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
          <img src={img.url} alt={`${lounge.name} - ${index + 1}`} className="w-full h-full object-cover" />
        </div>
      ))}

      <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent"></div>

      {/* ===== TOP BAR: back + share + follow ===== */}
      <div className="absolute top-0 left-0 right-0 z-20 p-6 flex items-center justify-between">
        <button
          onClick={() => navigate(-1)}
          className="p-2.5 bg-black/40 hover:bg-black/70 text-white rounded-full backdrop-blur-sm transition-all border border-white/10"
        >
          <ArrowLeft size={20} />
        </button>
        <div className="flex items-center gap-3">
          <button
            onClick={handleShare}
            className="flex items-center gap-2 px-4 py-2 bg-black/40 hover:bg-black/70 text-white rounded-full backdrop-blur-sm transition-all border border-white/10 text-sm font-medium"
          >
            <Share2 size={18} /> Chia sẻ
          </button>

          {/* NÚT FOLLOW — props từ cha */}
          <button
            onClick={onToggleFollow}
            className={`flex items-center gap-2 px-4 py-2 rounded-full transition-all text-sm font-bold ${
              isFollowing
                ? 'bg-white/10 text-white border border-white/30 hover:bg-red-500/20 hover:text-red-400 hover:border-red-500/30'
                : 'bg-[#C3B665] hover:bg-[#d4c87f] text-black'
            }`}
          >
            {isFollowing ? <><Check size={18} /> Đang theo dõi</> : <><UserPlus size={18} /> Theo dõi</>}
          </button>
        </div>
      </div>

      {/* ===== MŨI TÊN (hiện khi hover, chỉ khi có nhiều ảnh) ===== */}
      {images.length > 1 && (
        <>
          <button
            onClick={goToPrev}
            className="absolute left-4 top-1/2 -translate-y-1/2 z-20 p-3 bg-black/40 hover:bg-[#C3B665] hover:text-black text-white rounded-full backdrop-blur-sm border border-white/10 transition-all opacity-0 group-hover:opacity-100"
          >
            <ChevronLeft size={24} />
          </button>
          <button
            onClick={goToNext}
            className="absolute right-4 top-1/2 -translate-y-1/2 z-20 p-3 bg-black/40 hover:bg-[#C3B665] hover:text-black text-white rounded-full backdrop-blur-sm border border-white/10 transition-all opacity-0 group-hover:opacity-100"
          >
            <ChevronRight size={24} />
          </button>
        </>
      )}

      {/* ===== BOTTOM: tên + tags + caption ===== */}
      <div className="absolute bottom-0 left-0 z-10 max-w-[1600px] mx-auto p-6 md:p-12 w-full">
        <div className="flex flex-col items-start max-w-3xl">
          <h1 className="text-4xl md:text-6xl font-bold leading-tight text-white drop-shadow-lg mb-4">
            {lounge.name}
          </h1>
          <div className="flex flex-wrap gap-2">
            {lounge.tags.map(tag => (
              <span key={tag} className="bg-[#C3B665]/20 text-[#C3B665] border border-[#C3B665]/40 px-4 py-1.5 rounded-full text-sm font-medium backdrop-blur-sm">
                {tag}
              </span>
            ))}
          </div>
        </div>

        {/* Caption ảnh hiện tại */}
        {currentImage?.caption && (
          <p className="absolute bottom-6 right-6 md:bottom-12 md:right-12 text-xs text-gray-300 bg-black/50 backdrop-blur-sm px-3 py-1.5 rounded-full border border-white/10">
            {currentImage.caption}
          </p>
        )}
      </div>

      {/* ===== DOTS ===== */}
      {images.length > 1 && (
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-2 z-20">
          {images.map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrentIndex(index)}
              className={`h-2 rounded-full transition-all ${index === currentIndex ? 'w-8 bg-[#C3B665]' : 'w-2 bg-white/50'}`}
            />
          ))}
        </div>
      )}
    </div>
  )
}

export default LoungeHero