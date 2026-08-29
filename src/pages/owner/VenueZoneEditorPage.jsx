import { useState } from 'react';
import { Stage, Layer, Line, Circle } from 'react-konva';
import { ArrowLeft, PenTool, X, Plus } from 'lucide-react';
import { Link, useParams } from 'react-router-dom';

const VenueZoneEditor = () => {
  const { id } = useParams(); // loungeId
  
  // --- CORE STATES ---
  const [zones, setZones] = useState([]); // Khởi tạo rỗng, không có dữ liệu mẫu

  // --- ADMIN STATES ---
  const [isDrawing, setIsDrawing] = useState(false);
  const [currentPoints, setCurrentPoints] = useState([]);
  const [showAdminForm, setShowAdminForm] = useState(false);
  const [newZoneData, setNewZoneData] = useState({ name: '', capacity: '' });
  const [selectedZone, setSelectedZone] = useState(null);

  // --- LOGIC: Vẽ đa giác ---
  const handleStageClick = (e) => {
    if (!isDrawing) {
      // Nếu không vẽ, thử click xem có chọn zone nào không
      return;
    }
    const stage = e.target.getStage();
    const pos = stage.getPointerPosition();
    setCurrentPoints([...currentPoints, pos.x, pos.y]);
  };

  const handleStartDrawing = () => {
    setIsDrawing(true);
    setCurrentPoints([]);
    setSelectedZone(null);
  };

  const handleFinishDrawing = () => {
    if (currentPoints.length < 6) return; // Cần ít nhất 3 điểm (6 tọa độ x,y)
    setIsDrawing(false);
    setShowAdminForm(true); // Mở form nhập thông tin sau khi vẽ xong
  };

  const handleCancelDrawing = () => {
    setIsDrawing(false);
    setCurrentPoints([]);
  };

  const handleSaveNewZone = () => {
    const newZone = {
      id: `z_${Date.now()}`,
      name: newZoneData.name || 'Khu vực chưa đặt tên',
      points: currentPoints,
      capacity: Number(newZoneData.capacity) || 50,
      color: '#C3B665'
    };
    setZones([...zones, newZone]);
    setCurrentPoints([]);
    setShowAdminForm(false);
    setNewZoneData({ name: '', capacity: '' });
  };

  const handleDeleteZone = (zoneId) => {
    if(window.confirm('Bạn có chắc muốn xóa khu vực này?')) {
      setZones(zones.filter(z => z.id !== zoneId));
      if (selectedZone?.id === zoneId) setSelectedZone(null);
    }
  };

  return (
    <div className="min-h-screen bg-black text-white p-6 flex flex-col">
      
      {/* --- HEADER --- */}
      <div className="flex justify-between items-center mb-6 border-b border-[#C3B665]/30 pb-4">
        <div className="flex items-center gap-4">
          <Link to={`/owner/lounges/${id}`} className="text-gray-400 hover:text-white flex items-center gap-1">
            <ArrowLeft size={18} /> Quay lại
          </Link>
          <h1 className="text-2xl font-bold text-[#C3B665]">
            🛠 THIẾT LẬP SƠ ĐỒ KHU VỰC
          </h1>
        </div>
      </div>

      <div className="flex gap-6 flex-1">
        
        {/* --- BÊN TRÁI: BẢN ĐỒ KONVA --- */}
        <div className="flex-1 bg-[#111111] rounded-xl border border-gray-800 p-4 relative overflow-hidden">
          
          <div className="absolute top-4 left-4 z-10 flex gap-2">
            {!isDrawing ? (
              <button onClick={handleStartDrawing} className="bg-[#C3B665] text-black px-4 py-2 rounded text-sm font-bold flex items-center gap-2">
                <Plus size={16}/> Vẽ Khu Vực Mới
              </button>
            ) : (
              <>
                <button onClick={handleFinishDrawing} className="bg-green-600 text-white px-4 py-2 rounded text-sm font-bold">Hoàn thành vẽ</button>
                <button onClick={handleCancelDrawing} className="bg-red-600 text-white px-4 py-2 rounded text-sm font-bold flex items-center gap-2"><X size={16}/> Hủy</button>
              </>
            )}
          </div>

          <Stage width={700} height={500} onClick={handleStageClick} style={{ backgroundColor: '#0a0a0a', borderRadius: '8px' }}>
            <Layer>
              {/* Render các Zone đã có */}
              {zones.map((zone) => {
                const isSelected = selectedZone?.id === zone.id;

                // Logic màu sắc
                let fillOpacity = isSelected ? 0.6 : 0.2;
                let strokeColor = isSelected ? '#FFFFFF' : zone.color;

                return (
                  <Line
                    key={zone.id}
                    points={zone.points}
                    closed
                    fill={zone.color}
                    stroke={strokeColor}
                    strokeWidth={isSelected ? 3 : 1}
                    opacity={fillOpacity}
                    onClick={() => {
                       if(!isDrawing) setSelectedZone(isSelected ? null : zone);
                    }}
                  />
                );
              })}

              {/* Render đường đang vẽ dở */}
              {isDrawing && currentPoints.length > 0 && (
                <>
                  <Line points={currentPoints} stroke="#FFFFFF" dash={[8, 4]} strokeWidth={2} />
                  {currentPoints.map((_, i) => {
                    if (i % 2 !== 0) return null;
                    return <Circle key={i} x={currentPoints[i]} y={currentPoints[i+1]} radius={5} fill="#C3B665" />;
                  })}
                </>
              )}
            </Layer>
          </Stage>
          
          <p className="text-gray-600 text-xs mt-2 text-center">
            {isDrawing ? 'Click liên tục trên bản đồ để tạo các điểm nối bao quanh khu vực, sau đó nhấn Hoàn thành' : 'Click vào một khu vực để chọn hoặc bấm Vẽ Khu Vực Mới'}
          </p>
        </div>

        {/* --- BÊN PHẢI: BẢNG ĐIỀU KHIỂN --- */}
        <div className="w-80 bg-[#1a1a1a] rounded-xl border border-gray-800 p-5 flex flex-col">
          
          {/* FORM NHẬP THÔNG TIN KHU VỰC MỚI */}
          {showAdminForm ? (
            <div className="bg-black p-4 rounded-lg border border-[#C3B665] mb-6">
              <h3 className="text-[#C3B665] font-bold mb-4">Thông tin khu vực vừa vẽ</h3>
              <div className="space-y-3">
                <div>
                  <label className="text-xs text-gray-400">Tên khu vực</label>
                  <input 
                    type="text" value={newZoneData.name} onChange={e => setNewZoneData({...newZoneData, name: e.target.value})}
                    className="w-full bg-gray-900 text-white px-3 py-2 rounded border border-gray-700 focus:border-[#C3B665] outline-none text-sm"
                    placeholder="VD: Khu VIP, Khu Bàn Đứng..."
                  />
                </div>
                <div>
                  <label className="text-xs text-gray-400">Sức chứa tối đa (người)</label>
                  <input 
                    type="number" value={newZoneData.capacity} onChange={e => setNewZoneData({...newZoneData, capacity: e.target.value})}
                    className="w-full bg-gray-900 text-white px-3 py-2 rounded border border-gray-700 focus:border-[#C3B665] outline-none text-sm"
                    placeholder="VD: 50"
                  />
                </div>
                <button onClick={handleSaveNewZone} className="w-full bg-[#C3B665] text-black py-2 rounded font-bold text-sm mt-4">
                  Lưu Khu Vực
                </button>
              </div>
            </div>
          ) : (
             <div className="flex flex-col h-full">
                <h3 className="text-lg font-bold text-white mb-4">Danh sách Khu vực</h3>
                {zones.length === 0 ? (
                  <p className="text-sm text-gray-500 text-center mt-10">Chưa có khu vực nào. Hãy vẽ trên bản đồ.</p>
                ) : (
                  <div className="w-full space-y-3 flex-1 overflow-y-auto">
                    {zones.map(z => (
                      <div 
                        key={z.id} 
                        className={`bg-black p-3 rounded flex flex-col gap-2 border cursor-pointer transition-colors ${selectedZone?.id === z.id ? 'border-[#C3B665]' : 'border-gray-800'}`}
                        onClick={() => setSelectedZone(z)}
                      >
                        <div className="flex justify-between items-center text-sm">
                          <span className="text-white font-bold">{z.name}</span>
                          <span className="text-gray-400">{z.capacity} người</span>
                        </div>
                        {selectedZone?.id === z.id && (
                          <div className="flex justify-end mt-2 pt-2 border-t border-gray-800">
                            <button onClick={(e) => { e.stopPropagation(); handleDeleteZone(z.id); }} className="text-red-500 text-xs font-bold hover:underline">
                              Xóa khu vực này
                            </button>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
             </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default VenueZoneEditor;