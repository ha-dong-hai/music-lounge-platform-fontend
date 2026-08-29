// src/pages/lounge/LoungeDetailPage.jsx
import { useParams, Link } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import { LOUNGES_DATA, HOME_DATA } from '../../constants/mockData'
import LoungeHero from '../../components/lounge/LoungeHero'
import LoungeAbout from '../../components/lounge/LoungeAbout'
import LoungeSchedule from '../../components/lounge/LoungeSchedule'
import LoungeSidebar from '../../components/lounge/LoungeSidebar'
import dayjs from 'dayjs'

const LoungeDetailPage = () => {
  const { id } = useParams()
  const lounge = LOUNGES_DATA.find(e => e.id === id)

  if (!lounge) {
    return (
      <div className="min-h-screen bg-black flex flex-col items-center justify-center text-white">
        <h1 className="text-2xl font-bold mb-4">Không tìm thấy phòng trà</h1>
        <Link to="/" className="text-[#C3B665] flex items-center gap-2">
          <ArrowLeft size={18} /> Quay lại trang chủ
        </Link>
      </div>
    )
  }

  // Lấy shows và sort giảm dần
  const allLoungeShows = [
    ...HOME_DATA.featured,
    ...HOME_DATA.genreSections.flatMap(g => g.events),
    ...HOME_DATA.moodSections.flatMap(m => m.events)
  ].reduce((acc, current) => {
    if (!acc.find(item => item.id === current.id)) acc.push(current)
    return acc
  }, []).sort((a, b) => dayjs(b.start_date).valueOf() - dayjs(a.start_date).valueOf())
    .slice(0, 6)

  return (
    <div className="min-h-screen bg-black text-white pb-20">
      <LoungeHero lounge={lounge} />
      
      <div className="max-w-[1600px] mx-auto px-6 mt-12">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* CỘT TRÁI (2/3) */}
          <div className="lg:col-span-2 space-y-12">
            <LoungeAbout lounge={lounge} />
            <LoungeSchedule loungeId={lounge.id} shows={allLoungeShows} />
          </div>

          {/* CỘT PHẢI (1/3) STICKY */}
          <div className="lg:col-span-1 lg:sticky lg:top-20 lg:self-start">
            <LoungeSidebar />
          </div>

        </div>
      </div>
    </div>
  )
}

export default LoungeDetailPage