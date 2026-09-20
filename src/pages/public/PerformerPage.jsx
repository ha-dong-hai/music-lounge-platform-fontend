// src/pages/public/PerformerPage.jsx
//
// GHI CHÚ CHO ĐỘI FE:
// - MỘT endpoint trả cả hai thứ: GET /lounge-shows/by-performer/{id} trả PerformerDetailDto =
//   thông tin nghệ sĩ (tên, ảnh, giới thiệu, thể loại) + danh sách buổi diễn ĐÃ PHÂN TRANG bên
//   trong (`shows.items`). Không có endpoint "chi tiết nghệ sĩ" riêng — đừng đi tìm.
// - MẶC ĐỊNH CHỈ TRẢ BUỔI SẮP DIỄN. Muốn xem cả buổi đã diễn phải gửi includeEnded=true. Nghệ sĩ
//   nào chưa có buổi nào sắp diễn sẽ trông như "không có gì", nên màn này có nút bật/tắt và nói rõ
//   đang xem loại nào.
// - Không cần đăng nhập. Trang này cũng là nơi dẫn sang sao kê donate công khai của nghệ sĩ.
import { useState, useEffect, useCallback } from 'react'
import { useParams, Link } from 'react-router-dom'
import { Loader2, ArrowLeft, Mic2, CalendarDays, MapPin, Heart, History, CalendarClock } from 'lucide-react'
import dayjs from 'dayjs'
import toast from 'react-hot-toast'
import { getShowsByPerformer } from '../../services/showServices'

const fmtGia = (show) => (
  show.minPrice === 0 && show.maxPrice === 0
    ? 'Miễn phí'
    : `từ ${Number(show.minPrice || 0).toLocaleString('vi-VN')}đ`
)

const PerformerPage = () => {
  const { performerId } = useParams()
  const [data, setData] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [xemDaDien, setXemDaDien] = useState(false)
  const [page, setPage] = useState(1)

  const load = useCallback(async () => {
    setIsLoading(true)
    try {
      const res = await getShowsByPerformer(performerId, {
        includeEnded: xemDaDien,
        page,
        pageSize: 12,
      })
      if (res.success) setData(res.data)
    } catch (err) {
      toast.error(err.response?.data?.message || 'Không tải được thông tin nghệ sĩ.')
    } finally {
      setIsLoading(false)
    }
  }, [performerId, xemDaDien, page])

  useEffect(() => { const chay = async () => { await load() }; chay() }, [load])

  if (isLoading && !data) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <Loader2 size={32} className="animate-spin text-[#C3B665]" />
      </div>
    )
  }

  if (!data) {
    return (
      <div className="min-h-screen bg-black flex flex-col items-center justify-center text-white">
        <h1 className="text-2xl font-bold mb-4">Không tìm thấy nghệ sĩ</h1>
        <Link to="/" className="text-[#C3B665] flex items-center gap-2">
          <ArrowLeft size={18} /> Về trang chủ
        </Link>
      </div>
    )
  }

  const shows = data.shows?.items ?? []
  const totalPages = data.shows?.totalPages ?? 1

  return (
    <div className="min-h-screen bg-black text-white pb-20">
      <div className="max-w-[1200px] mx-auto px-6 py-8">
        <Link to="/" className="inline-flex items-center gap-2 text-sm font-medium text-gray-400 hover:text-[#C3B665] mb-6">
          <ArrowLeft size={18} /> Về trang chủ
        </Link>

        {/* HỒ SƠ NGHỆ SĨ */}
        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 sm:p-8 flex flex-col sm:flex-row gap-6">
          <img
            src={data.avatarUrl || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(data.name)}&backgroundColor=1f2937`}
            alt={data.name}
            className="w-24 h-24 rounded-full object-cover border border-gray-700 flex-shrink-0 mx-auto sm:mx-0"
          />
          <div className="min-w-0 flex-1 text-center sm:text-left">
            <div className="flex items-center gap-2 justify-center sm:justify-start">
              <Mic2 size={18} className="text-[#C3B665]" />
              <h1 className="text-2xl font-bold">{data.name}</h1>
            </div>

            {(data.genres?.length ?? 0) > 0 && (
              <div className="mt-3 flex flex-wrap gap-2 justify-center sm:justify-start">
                {data.genres.map((g) => (
                  <span key={g.id} className="px-2.5 py-1 rounded-md bg-[#C3B665]/10 text-[#C3B665] text-xs font-medium">
                    {g.name}
                  </span>
                ))}
              </div>
            )}

            {data.bio && (
              <p className="mt-4 text-sm text-gray-400 leading-relaxed whitespace-pre-line">{data.bio}</p>
            )}

            <Link
              to={`/performers/${performerId}/donations`}
              className="mt-5 inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-gray-700 text-gray-300 text-sm font-bold hover:bg-gray-800"
            >
              <Heart size={15} className="text-[#C3B665]" /> Xem sao kê donate
            </Link>
          </div>
        </div>

        {/* BUỔI DIỄN */}
        <div className="flex flex-wrap items-center justify-between gap-3 mt-10 mb-4">
          <h2 className="text-lg font-bold">
            {xemDaDien ? 'Tất cả buổi diễn' : 'Buổi diễn sắp tới'}
          </h2>
          {/* Nút này cần thiết vì mặc định của backend là CHỈ buổi sắp diễn — không có nó thì nghệ
              sĩ chưa có lịch mới sẽ trông như chưa từng diễn ở đâu. */}
          <button
            onClick={() => { setXemDaDien((v) => !v); setPage(1) }}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-gray-700 text-gray-300 text-xs font-bold hover:bg-gray-800"
          >
            {xemDaDien ? <><CalendarClock size={14} /> Chỉ xem buổi sắp tới</> : <><History size={14} /> Xem cả buổi đã diễn</>}
          </button>
        </div>

        {isLoading ? (
          <div className="py-16 flex justify-center"><Loader2 size={26} className="animate-spin text-[#C3B665]" /></div>
        ) : shows.length === 0 ? (
          <div className="bg-gray-900 border border-gray-800 rounded-2xl p-10 text-center">
            <p className="text-sm text-gray-500">
              {xemDaDien
                ? 'Nghệ sĩ này chưa có buổi diễn nào trên hệ thống.'
                : 'Nghệ sĩ này chưa có buổi diễn nào sắp tới. Bấm “Xem cả buổi đã diễn” để xem lịch cũ.'}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {shows.map((s) => (
              <Link key={s.id} to={`/shows/${s.id}`}
                className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden hover:border-[#C3B665]/40 transition-colors group">
                <div className="aspect-video bg-gray-800 overflow-hidden">
                  {s.coverImageUrl && (
                    <img src={s.coverImageUrl} alt={s.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                  )}
                </div>
                <div className="p-4">
                  <p className="text-sm font-semibold text-white line-clamp-2">{s.name}</p>
                  <p className="text-xs text-gray-500 mt-2 flex items-center gap-1.5">
                    <CalendarDays size={12} className="flex-shrink-0" />
                    {dayjs(s.scheduledStart).format('HH:mm DD/MM/YYYY')}
                  </p>
                  {s.loungeName && (
                    <p className="text-xs text-gray-500 mt-1 flex items-center gap-1.5 truncate">
                      <MapPin size={12} className="flex-shrink-0" /> {s.loungeName}
                    </p>
                  )}
                  <p className="text-sm text-[#C3B665] font-bold mt-2.5">{fmtGia(s)}</p>
                </div>
              </Link>
            ))}
          </div>
        )}

        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-3 mt-6">
            <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page <= 1}
              className="px-4 py-2 rounded-lg border border-gray-700 text-sm text-gray-300 hover:bg-gray-800 disabled:opacity-40">
              Trước
            </button>
            <span className="text-sm text-gray-500">Trang {page}/{totalPages}</span>
            <button onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page >= totalPages}
              className="px-4 py-2 rounded-lg border border-gray-700 text-sm text-gray-300 hover:bg-gray-800 disabled:opacity-40">
              Sau
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

export default PerformerPage
