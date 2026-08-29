// src/components/lounge/LoungeSchedule.jsx
import { Link } from 'react-router-dom'
import { Clock, CalendarDays, ChevronRight } from 'lucide-react'
import dayjs from 'dayjs'

const LoungeSchedule = ({ loungeId, shows }) => {
  return (
    <div>
      {/* HEADER: Tên section bên trái, See more bên phải */}
      <div className="flex items-center justify-between mb-8">
        <h2 className="text-2xl font-bold text-white">Lịch trình Shows</h2>
        <Link 
          to={`/shows?lounge=${loungeId}`} 
          className="text-sm font-medium text-[#C3B665]/85 hover:text-[#C3B665] hover:font-bold flex items-center gap-1 transition-all hover:gap-2"
        >
          See more <ChevronRight size={20} />
        </Link>
      </div>

      <div className="space-y-8">
        {shows.map(ev => {
          const eventDate = dayjs(ev.start_date)
          const dateStr = eventDate.format('dddd, DD/MM/YYYY')
          const timeStr = eventDate.format('HH:mm')

          return (
            <div key={ev.id}>
              <div className="flex items-center gap-4 mb-4">
                <CalendarDays className="text-[#C3B665]" size={20} />
                <h3 className="text-lg font-bold text-[#C3B665] whitespace-nowrap">
                  {dateStr}
                </h3>
                <div className="flex-1 h-px bg-gray-800"></div>
              </div>

              <Link to={`/shows/${ev.id}`} className="flex flex-col sm:flex-row gap-4 bg-gray-900 border border-gray-800 rounded-2xl p-4 hover:border-[#C3B665]/40 transition-colors group">
                <div className="w-full sm:w-48 h-40 sm:h-32 flex-shrink-0 overflow-hidden rounded-xl bg-gray-800">
                  <img src={ev.thumbnail || "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?q=80&w=2670&auto=format&fit=crop"} alt={ev.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                </div>
                <div className="flex-1 flex flex-col justify-center">
                  <div className="flex items-center gap-2 text-gray-500 text-sm mb-2">
                    <Clock size={14} className="text-[#C3B665]" />
                    <span>{timeStr}</span>
                  </div>
                  <h4 className="text-xl font-bold text-white group-hover:text-[#C3B665] transition-colors mb-2">{ev.title}</h4>
                  <p className="text-gray-400 text-sm mb-3">{ev.genre} - {ev.mood}</p>
                  <p className="text-[#C3B665] font-bold text-lg">Từ {ev.price}</p>
                </div>
              </Link>
            </div>
          )
        })}
      </div>
    </div>
  )
}

export default LoungeSchedule