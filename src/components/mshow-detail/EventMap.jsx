import { useState, useRef } from 'react'
import { useNavigate, useParams, Link } from 'react-router-dom'
import { MapPin, Check, Lock } from 'lucide-react'
import { Stage, Layer, Line, Text, Rect } from 'react-konva'
import { useAuthStore } from '../../store/useAuthStore'

// ⭐ MOCK DATA SƠ ĐỒ ZONE
const MOCK_ZONES = [
  { 
    id: 'A', name: 'VIP A', price: '800.000đ', points: [200, 50, 400, 50, 450, 150, 150, 150],
    seatsTotal: 50, seatsAvailable: 12,
    amenities: ['Ghế sofa êm ái, không gian riêng tư', 'View trực diện sân khấu tốt nhất', 'Bàn phục vụ nước uống riêng', 'Âm thanh định hướng rõ nét']
  },
  { 
    id: 'B', name: 'Standard B', price: '500.000đ', points: [150, 160, 450, 160, 500, 260, 100, 260],
    seatsTotal: 80, seatsAvailable: 45,
    amenities: ['Ghế đệm tựa lưng thoải mái', 'View nhìn nghiêng sân khấu', 'Không gian mở, dễ di chuyển']
  },
  { 
    id: 'C', name: 'Economy C', price: '300.000đ', points: [100, 270, 500, 270, 550, 370, 50, 370],
    seatsTotal: 120, seatsAvailable: 80,
    amenities: ['Ghế xếp gỗ tiêu chuẩn', 'View xa sân khấu', 'Khu vực đứng tự do phía sau']
  },
]

const EventMap = () => {
  const [hoveredZone, setHoveredZone] = useState(null)
  const [selectedZone, setSelectedZone] = useState(null)
  const stageRef = useRef(null)
  
  const navigate = useNavigate()
  const { id: showId } = useParams()
  const { isAuthenticated } = useAuthStore()

  // ⭐ STATE CHO MODAL ĐĂNG NHẬP
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false)

  const handleZoneClick = (zone) => setSelectedZone(zone)

  // ⭐ HÀM XỬ LÝ KHI BẤM "TIẾP TỤC CHỌN GHẾ"
  const handleCheckout = () => {
    if (!selectedZone) return

    if (!isAuthenticated) {
      setIsLoginModalOpen(true) // Mở Modal thay vì alert
      return
    }

    // Nếu đã đăng nhập -> Điều hướng sang trang checkout
    navigate(`/shows/${showId}/checkout`)
  }

  return (
    <>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* KHU VỰC VẼ KONVA */}
        <div className="lg:col-span-2 bg-gray-900 border border-gray-800 rounded-2xl p-4 md:p-8 flex items-center justify-center overflow-auto">
          <Stage width={600} height={450} ref={stageRef} className="bg-black rounded-xl shadow-inner">
            <Layer>
              {/* Sân Khấu */}
              <Rect x={200} y={10} width={200} height={30} fill="#EF4444" cornerRadius={4} shadowColor="black" shadowBlur={10} shadowOpacity={0.5} />
              <Text x={250} y={18} text="SÂN KHẤU" fontSize={14} fill="white" fontStyle="bold" />

              {/* Các Zone Khán Giả */}
              {MOCK_ZONES.map((zone) => {
                const isHovered = hoveredZone?.id === zone.id
                const isSelected = selectedZone?.id === zone.id
                return (
                  <Line
                    key={zone.id}
                    points={zone.points}
                    closed
                    fill={isSelected ? '#C3B665' : isHovered ? '#4B5563' : '#374151'}
                    stroke={isSelected ? '#d4c87f' : '#1f2937'}
                    strokeWidth={2}
                    onMouseEnter={() => setHoveredZone(zone)}
                    onMouseLeave={() => setHoveredZone(null)}
                    onClick={() => handleZoneClick(zone)}
                    onTap={() => handleZoneClick(zone)}
                    style={{ cursor: 'pointer' }}
                  />
                )
              })}

              {/* Text Tên Zone */}
              {MOCK_ZONES.map((zone) => {
                const centerX = zone.points.reduce((acc, cur, i) => i % 2 === 0 ? acc + cur : acc, 0) / (zone.points.length / 2)
                const centerY = zone.points.reduce((acc, cur, i) => i % 2 !== 0 ? acc + cur : acc, 0) / (zone.points.length / 2)
                return (
                  <Text
                    key={`text-${zone.id}`}
                    x={centerX - 40}
                    y={centerY - 10}
                    text={zone.name}
                    fontSize={16}
                    fill={selectedZone?.id === zone.id ? 'black' : 'white'}
                    fontStyle="bold"
                    listening={false}
                  />
                )
              })}
            </Layer>
          </Stage>
        </div>

        {/* KHU VỰC THÔNG TIN VÉ ĐÃ CHỌN */}
        <div className="lg:col-span-1 bg-gray-900 border border-gray-800 rounded-2xl p-6 flex flex-col">
          <h3 className="text-xl font-bold text-[#C3B665] mb-6">Area Info</h3>
          
          {selectedZone ? (
            <div className="flex-1 flex flex-col">
              {/* Tên & Giá */}
              <div className="space-y-4 mb-6">
                <div>
                  <p className="text-gray-500 text-sm">Selected area</p>
                  <p className="text-white text-2xl font-bold">{selectedZone.name}</p>
                </div>
                <div>
                  <p className="text-gray-500 text-sm">Price</p>
                  <p className="text-white text-lg font-medium">{selectedZone.price}</p>
                </div>
              </div>

              {/* Số ghế */}
              <div className="bg-black/30 border border-gray-800 rounded-lg p-4 mb-6">
                <div className="flex justify-between items-end mb-2">
                  <p className="text-gray-500 text-sm">Available seats</p>
                  <p className="text-white text-xl font-bold">
                    {selectedZone.seatsAvailable} 
                    <span className="text-gray-500 text-base font-normal"> / {selectedZone.seatsTotal} seats</span>
                  </p>
                </div>
                <div className="w-full h-1.5 bg-gray-800 rounded-full mt-2 overflow-hidden">
                  <div 
                    className="h-1.5 bg-[#C3B665] rounded-full transition-all duration-500" 
                    style={{ width: `${(selectedZone.seatsAvailable / selectedZone.seatsTotal) * 100}%` }}
                  ></div>
                </div>
              </div>

              {/* Tiện nghi */}
              <div className="mb-6 flex-1">
                <p className="text-gray-500 text-sm mb-3">Tiện nghi & Quyền lợi</p>
                <ul className="space-y-2.5">
                  {selectedZone.amenities.map((item, i) => (
                    <li key={i} className="flex items-start gap-2 text-gray-300 text-sm">
                      <Check size={16} className="text-[#C3B665] mt-0.5 flex-shrink-0" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
              
              <button 
                onClick={handleCheckout} 
                className="mt-auto w-full bg-[#C3B665] text-black py-3 rounded-lg font-bold hover:bg-[#d4c87f] transition-colors"
              >
                Select ticket
              </button>
            </div>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-center">
              <MapPin size={40} className="text-gray-700 mb-4" />
              <p className="text-gray-500 font-medium">Chưa chọn khu vực</p>
              <p className="text-gray-600 text-sm mt-1">Click vào một khu vực (A, B, C) trên sơ đồ để xem chi tiết và chọn vé.</p>
            </div>
          )}
        </div>
      </div>

      {/* ⭐ MODAL YÊU CẦU ĐĂNG NHẬP */}
      {isLoginModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={() => setIsLoginModalOpen(false)}></div>
          <div className="relative bg-gray-950 border border-gray-800 rounded-2xl w-full max-w-md p-6 shadow-2xl text-center">
            <div className="w-16 h-16 mx-auto bg-[#C3B665]/10 rounded-full flex items-center justify-center mb-4 border border-[#C3B665]/30">
              <Lock size={28} className="text-[#C3B665]" />
            </div>
            <h2 className="text-xl font-bold text-white mb-2">Login require</h2>
            <p className="text-gray-400 mb-6">Login require to buy ticket.</p>
            <div className="flex gap-3">
              <button 
                onClick={() => setIsLoginModalOpen(false)} 
                className="flex-1 py-2.5 border border-gray-700 text-gray-300 rounded-lg font-medium hover:bg-gray-800 transition-colors"
              >
                Cancel
              </button>
              <Link 
                to="/login" 
                className="flex-1 py-2.5 bg-[#C3B665] text-black rounded-lg font-bold hover:bg-[#d4c87f] transition-colors flex items-center justify-center"
              >
                Login
              </Link>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

export default EventMap