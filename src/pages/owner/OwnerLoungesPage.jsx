import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Building2, Loader2, MapPin, Edit, Settings, Plus } from 'lucide-react';
import { loungeService } from '../../services/loungeService';

export default function OwnerLoungesPage() {
  const [lounges, setLounges] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchLounges = async () => {
      try {
        const res = await loungeService.getMine({ page: 1, pageSize: 50 });
        if (res.success && res.data?.items) {
          setLounges(res.data.items);
        }
      } catch (err) {
        console.error('Failed to fetch lounges:', err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchLounges();
  }, []);

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] text-gray-400 gap-3">
        <Loader2 size={32} className="animate-spin text-[#C3B665]" />
        <span>Đang tải danh sách Lounge...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <Building2 className="text-[#C3B665]" size={28} /> Quản lý Lounge
          </h1>
          <p className="text-gray-400 mt-1">Quản lý thông tin và cài đặt cho các phòng trà của bạn</p>
        </div>
        {lounges.length === 0 && (
          <Link 
            to="/owner/lounges/create" 
            className="flex items-center gap-2 bg-[#C3B665] text-black px-4 py-2 rounded-lg font-semibold hover:bg-[#d4c87f] transition-colors"
            style={{ color: 'black' }}
          >
            <Plus size={20} /> Tạo Lounge Mới
          </Link>
        )}
      </div>

      {lounges.length === 0 ? (
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-12 text-center">
          <Building2 size={48} className="mx-auto text-gray-700 mb-4" />
          <h3 className="text-xl font-bold text-white mb-2">Chưa có Lounge nào</h3>
          <p className="text-gray-400 mb-6">Bạn chưa tạo Lounge nào. Hãy bấm nút "Tạo Lounge Mới" ở góc trên để bắt đầu kinh doanh.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {lounges.map((lounge) => (
            <div key={lounge.id} className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden hover:border-[#C3B665]/50 transition-colors group">
              <div className="h-48 overflow-hidden relative">
                {lounge.primaryImageUrl ? (
                  <img src={lounge.primaryImageUrl} alt={lounge.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                ) : (
                  <div className="w-full h-full bg-gray-800 flex items-center justify-center text-gray-500">
                    <Building2 size={48} />
                  </div>
                )}
                <div className="absolute top-4 right-4 bg-black/60 backdrop-blur-md px-3 py-1 rounded-full text-xs font-semibold text-white border border-gray-700">
                  {lounge.status || 'Active'}
                </div>
              </div>
              <div className="p-6">
                <h3 className="text-xl font-bold text-white mb-2">{lounge.name}</h3>
                <p className="text-gray-400 text-sm flex items-start gap-2 mb-4 h-10 overflow-hidden">
                  <MapPin size={16} className="shrink-0 mt-0.5 text-[#C3B665]" />
                  <span className="line-clamp-2">{lounge.address}, {lounge.ward}, {lounge.district}, {lounge.city}</span>
                </p>
                <div className="flex items-center pt-4 border-t border-gray-800">
                  <Link 
                    to={`/owner/lounges/${lounge.id}`} 
                    className="w-full flex items-center justify-center gap-2 bg-[#C3B665] text-black px-4 py-2 rounded-lg font-semibold hover:bg-[#d4c87f] transition-colors"
                    style={{ color: 'black' }}
                  >
                    <Settings size={18} /> Cài đặt & Cập nhật Lounge
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
