// src/components/lounge/LoungeHero.jsx
import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { ArrowLeft, ChevronLeft, ChevronRight, Share2, UserPlus } from 'lucide-react'

const LoungeHero = ({ lounge }) => {
  const [currentSlide, setCurrentSlide] = useState(0)

  useEffect(() => {
    if (!lounge || lounge.images.length <= 1) return
    const timer = setInterval(() => {
      setCurrentSlide(prev => (prev === lounge.images.length - 1 ? 0 : prev + 1))
    }, 5000)
    return () => clearInterval(timer)
  }, [lounge])

  if (!lounge) return null

  const nextSlide = () => setCurrentSlide(prev => (prev === lounge.images.length - 1 ? 0 : prev + 1))
  const prevSlide = () => setCurrentSlide(prev => (prev === 0 ? lounge.images.length - 1 : prev - 1))

  return (
    <div className="relative w-full h-[500px] md:h-[600px] overflow-hidden bg-gray-900 group">
      {lounge.images.map((img, index) => (
        <div key={index} className={`absolute inset-0 transition-opacity duration-1000 ease-in-out ${index === currentSlide ? 'opacity-100' : 'opacity-0'}`}>
          <img src={img} alt={`${lounge.name} - ${index + 1}`} className="w-full h-full object-cover" />
        </div>
      ))}

      <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent"></div>

      <div className="absolute top-0 left-0 right-0 z-20 p-6 flex items-center justify-between">
        <Link to={-1} className="p-2.5 bg-black/40 hover:bg-black/70 text-white rounded-full backdrop-blur-sm transition-all border border-white/10">
          <ArrowLeft size={20} />
        </Link>
        <div className="flex items-center gap-3">
          <button className="flex items-center gap-2 px-4 py-2 bg-black/40 hover:bg-black/70 text-white rounded-full backdrop-blur-sm transition-all border border-white/10 text-sm font-medium">
            <Share2 size={18} /> Chia sẻ
          </button>
          <button className="flex items-center gap-2 px-4 py-2 bg-[#C3B665] hover:bg-[#d4c87f] text-black rounded-full transition-all text-sm font-bold">
            <UserPlus size={18} /> Theo dõi
          </button>
        </div>
      </div>

      {lounge.images.length > 1 && (
        <>
          <button onClick={prevSlide} className="absolute left-0 top-1/2 -translate-y-1/2 z-10 p-2 hover:bg-gradient-to-r hover:from-black/95 via-black/50 to-transparent text-white h-full transition-all opacity-0 group-hover:opacity-100">
            <ChevronLeft size={28} />
          </button>
          <button onClick={nextSlide} className="absolute right-0 top-1/2 -translate-y-1/2 z-10 p-2 hover:bg-gradient-to-l hover:from-black/95 via-black/50 to-transparent text-white h-full transition-all opacity-0 group-hover:opacity-100">
            <ChevronRight size={28} />
          </button>
        </>
      )}

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
      </div>
    </div>
  )
}

export default LoungeHero