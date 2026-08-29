import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Music, Loader2, Calendar, MapPin, Edit, Eye, Tag } from 'lucide-react';
import { loungeService } from '../../services/loungeService';
import { showService } from '../../services/showService';
import dayjs from 'dayjs';

export default function OwnerShowsPage() {
  const [shows, setShows] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [firstLoungeId, setFirstLoungeId] = useState(null);

  useEffect(() => {
    const fetchAllShows = async () => {
      try {
        const loungeRes = await loungeService.getMine({ page: 1, pageSize: 50 });
        if (!loungeRes.success || !loungeRes.data?.items) {
          setShows([]);
          return;
        }

        const lounges = loungeRes.data.items;
        if (lounges.length > 0) {
          setFirstLoungeId(lounges[0].id);
        }
        const allShows = [];

        await Promise.all(
          lounges.map(async (lounge) => {
            try {
              const showRes = await showService.getByLounge(lounge.id, { page: 1, pageSize: 100 });
              if (showRes.success && showRes.data?.items) {
                const loungeShows = showRes.data.items.map(s => ({
                  ...s,
                  loungeName: lounge.name
                }));
                allShows.push(...loungeShows);
              }
            } catch (err) {
              console.error(`Failed to fetch shows for lounge ${lounge.id}`, err);
            }
          })
        );

        // Sort by scheduledStart descending
        allShows.sort((a, b) => new Date(b.scheduledStart) - new Date(a.scheduledStart));
        setShows(allShows);
      } catch (err) {
        console.error('Failed to fetch shows:', err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchAllShows();
  }, []);

  const getStatusClass = (status) => {
    const s = (status || '').toLowerCase();
    if (s === 'published' || s === 'approved') return 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30';
    if (s === 'draft' || s === 'pending') return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
    if (s === 'ended' || s === 'completed') return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
    if (s === 'cancelled') return 'bg-red-500/20 text-red-400 border-red-500/30';
    if (s === 'live' || s === 'ongoing') return 'bg-amber-500/20 text-amber-400 border-amber-500/30 animate-pulse';
    return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] text-gray-400 gap-3">
        <Loader2 size={32} className="animate-spin text-[#C3B665]" />
        <span>Đang tải danh sách Sự kiện...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <Music className="text-[#C3B665]" size={28} /> Quản lý Sự kiện
          </h1>
          <p className="text-gray-400 mt-1">Quản lý tất cả các show diễn từ các phòng trà của bạn</p>
        </div>
        {firstLoungeId && (
          <Link 
            to={`/owner/lounges/${firstLoungeId}/shows/create`} 
            className="flex items-center gap-2 bg-[#C3B665] text-black px-4 py-2 rounded-lg font-semibold hover:bg-[#d4c87f] transition-colors"
            style={{ color: 'black' }}
          >
            <Music size={20} /> Tạo Sự Kiện Mới
          </Link>
        )}
      </div>

      {shows.length === 0 ? (
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-12 text-center">
          <Music size={48} className="mx-auto text-gray-700 mb-4" />
          <h3 className="text-xl font-bold text-white mb-2">Chưa có Sự kiện nào</h3>
          <p className="text-gray-400 mb-6">Bạn chưa tạo show diễn nào trong các Lounge của mình.</p>
        </div>
      ) : (
        <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-gray-300">
              <thead className="bg-gray-950 text-gray-400 uppercase text-xs font-semibold">
                <tr>
                  <th className="px-6 py-4">Tên Show</th>
                  <th className="px-6 py-4">Lounge</th>
                  <th className="px-6 py-4">Thời gian</th>
                  <th className="px-6 py-4">Trạng thái</th>
                  <th className="px-6 py-4 text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800">
                {shows.map((show) => (
                  <tr key={show.id} className="hover:bg-gray-800/50 transition-colors">
                    <td className="px-6 py-4 font-medium text-white flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg overflow-hidden shrink-0 bg-gray-800 border border-gray-700">
                        {show.coverImageUrl ? (
                          <img src={show.coverImageUrl} alt="" className="w-full h-full object-cover" />
                        ) : (
                          <Music className="w-full h-full p-2 text-gray-600" />
                        )}
                      </div>
                      <Link to={`/owner/shows/${show.id}`} className="hover:text-[#C3B665] transition-colors line-clamp-1">
                        {show.name}
                      </Link>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2 text-gray-400">
                        <MapPin size={14} className="shrink-0" />
                        <span className="line-clamp-1">{show.loungeName}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <Calendar size={14} className="text-gray-500" />
                        <span>{dayjs(show.scheduledStart).format('DD/MM/YYYY HH:mm')}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-medium border ${getStatusClass(show.status)}`}>
                        {show.status || 'Draft'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Link 
                          to={`/shows/${show.id}`} 
                          target="_blank"
                          title="Xem trên trang người dùng"
                          className="p-2 bg-gray-800 text-gray-400 hover:text-white rounded-lg hover:bg-gray-700 transition-colors"
                        >
                          <Eye size={16} />
                        </Link>
                        <Link 
                          to={`/owner/shows/${show.id}`} 
                          title="Quản lý chi tiết"
                          className="p-2 bg-gray-800 text-[#C3B665] rounded-lg hover:bg-gray-700 transition-colors"
                        >
                          <Edit size={16} />
                        </Link>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
