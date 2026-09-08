// src/pages/events/EventListPage.jsx
import { useSearchParams, Link } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import ShowCard from '../../components/home/ShowCard'

// Dữ liệu map giữa URL Slug và Tên hiển thị (Thực tế sẽ lấy từ DB)
const GENRE_MAP = {
  rock: { title: 'Rock', matchValue: 'Rock' },
  pop: { title: 'Pop', matchValue: 'Pop' },
  jazz: { title: 'Jazz', matchValue: 'Jazz' },
}

const MOOD_MAP = {
  'vui-ve': { title: 'Vui vẻ', matchValue: 'Energetic' }, // Slug 'vui-ve' tương ứng mood 'Energetic' trong data
  'lang-man': { title: 'Lãng mạn', matchValue: 'Romantic' },
}

const ShowListPage= () => {
  const [searchParams] = useSearchParams()
  
  // Lấy tham số từ URL: ?genre=rock hoặc ?mood=vui-ve
  const genreSlug = searchParams.get('genre')
  const moodSlug = searchParams.get('mood')

  // 1. Gộp toàn bộ sự kiện từ Mock Data thành 1 mảng phẳng (không trùng lặp)
  const allEvents = [
    ...HOME_DATA.featured,
    ...HOME_DATA.genreSections.flatMap(g => g.events),
    ...HOME_DATA.moodSections.flatMap(m => m.events)
  ].reduce((acc, current) => {
    if (!acc.find(item => item.id === current.id)) acc.push(current)
    return acc
  }, [])

  // 2. Xác định tiêu đề và điều kiện lọc dựa trên URL
  let pageTitle = "Danh sách sự kiện"
  let filteredEvents = allEvents

  if (genreSlug && GENRE_MAP[genreSlug]) {
    pageTitle = `Thể loại nhạc ${GENRE_MAP[genreSlug].title}`
    filteredEvents = allEvents.filter(ev => ev.genre === GENRE_MAP[genreSlug].matchValue)
  } else if (moodSlug && MOOD_MAP[moodSlug]) {
    pageTitle = `Cảm xúc ${MOOD_MAP[moodSlug].title}`
    filteredEvents = allEvents.filter(ev => ev.mood === MOOD_MAP[moodSlug].matchValue)
  }

  return (
    <div className="min-h-screen bg-black text-white">
      <div className="max-w-[1600px] mx-auto px-6 py-8">
        
        {/* Header với nút quay lại */}
        <div className="flex items-center gap-4 mb-8">
          <Link 
            to="/" 
            className="p-2 hover:bg-[#C3B665]/40 rounded-full transition-colors"
          >
            <ArrowLeft size={24} />
          </Link>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-500">
            {pageTitle}
          </h1>
        </div>

        {/* Hiển thị danh sách dạng Grid (Giống hệt kết quả lọc) */}
        {filteredEvents.length > 0 ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-x-5 md:gap-x-6 gap-y-8">
            {filteredEvents.map((ev) => (
              <ShowCard key={ev.id} {...ev} />
            ))}
          </div>
        ) : (
          <div className="text-center py-20">
            <p className="text-xl font-semibold text-gray-800 mb-2">Không tìm thấy sự kiện nào</p>
            <p className="text-gray-500">Hiện chưa có sự kiện nào thuộc danh mục này.</p>
          </div>
        )}
      </div>
    </div>
  )
}

export default ShowListPage