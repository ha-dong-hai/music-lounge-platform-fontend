// src/components/mshow-detail/EventMap.jsx
import { useState, useEffect, useRef } from 'react'
import React from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { MapPin, Check, Lock, Loader2, Minus, Plus } from 'lucide-react'
import { Stage, Layer, Rect, Text } from 'react-konva'
import toast from 'react-hot-toast'
import { getLoungeZones } from '../../services/loungeServices'
import Skeleton from '../shared/Skeleton'

const ShowMap = ({ loungeId, showData, readOnly = false }) => {
const [zones, setZones] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [selectedZone, setSelectedZone] = useState(null)
  const [quantity, setQuantity] = useState(1)
  const [isProcessing, setIsProcessing] = useState(false)
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false)

  const user = JSON.parse(localStorage.getItem('user') || 'null')

  useEffect(() => {
    if (!loungeId) return
    const fetchZones = async () => {
      setIsLoading(true)
      try {
        const res = await getLoungeZones(loungeId, true)
        if (res.success) {
          setZones(res.data)
        }
      } catch (err) {
        console.error('Error loading zones:', err)
      } finally {
        setIsLoading(false)
      }
    }
    fetchZones()
  }, [loungeId])

  const handleZoneClick = (zone) => {
    setSelectedZone(zone)
    setQuantity(1) // Reset số lượng khi đổi zone
  }

  const handleCheckout = async () => {
    if (!selectedZone) return

    if (!user) {
      setIsLoginModalOpen(true)
      return
    }

    // ⭐ Lấy priceId từ showData (BE trả về mảng prices trong API show detail)
    // Nếu BE chưa có mảng prices, tạm hardcode hoặc lấy đầu tiên để test
    const priceId = showData?.prices?.[0]?.id || 1; // Thay đổi logic này khi BE hoàn chỉnh
    const amountToPay = (showData?.prices?.[0]?.price || 0) * quantity;

    setIsProcessing(true)
    try {
      // 1. Gọi API Hold
      const holdRes = await holdTicket(priceId, quantity)
      if (!holdRes.success) throw new Error("Hold failed")

      const holdId = holdRes.data.holdId

      // 2. Gọi API Purchase
      const purchaseRes = await purchaseTicket(holdId)
      if (!purchaseRes.success) throw new Error("Purchase failed")

      // 3. Redirect sang VNPay
      const paymentUrl = purchaseRes.data.paymentUrl
      if (paymentUrl) {
        toast.success('Redirect to VNPay...')
        window.location.href = paymentUrl
      } else {
        throw new Error("Payment URL not received")
      }

    } catch (err) {
      console.error('Payment error:', err)
      toast.error(err.message || 'Hold Ticket/payment process failed.')
    } finally {
      setIsProcessing(false)
    }
  }

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-gray-900 border border-gray-800 rounded-2xl p-8 flex items-center justify-center h-[450px]">
          <Loader2 size={32} className="animate-spin text-[#C3B665]" />
        </div>
        <div className="lg:col-span-1"><Skeleton className="h-96 rounded-2xl" /></div>
      </div>
    )
  }

  // Tách zone có toạ độ và không có toạ độ
  const drawableZones = zones.filter(z => z.layout2DX !== null && z.layout2DX !== undefined)
  const listableZones = zones.filter(z => z.layout2DX === null || z.layout2DX === undefined)

  return (
    <>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* KHU VỰC VẼ KONVA & DANH SÁCH ZONE THIẾU TOẠ ĐỘ */}
        <div className="lg:col-span-2 bg-gray-900 border border-gray-800 rounded-2xl p-4 md:p-8 overflow-auto">
          {drawableZones.length > 0 ? (
            <div className="flex items-center justify-center">
              <Stage width={600} height={450} className="bg-black rounded-xl shadow-inner">
                <Layer>
                  {/* Sân Khấu */}
                  <Rect x={200} y={10} width={200} height={30} fill="#EF4444" cornerRadius={4} shadowColor="black" shadowBlur={10} shadowOpacity={0.5} />
                  <Text x={250} y={18} text="SÂN KHẤU" fontSize={14} fill="white" fontStyle="bold" />

                  {drawableZones.map((zone) => {
                    const isSelected = selectedZone?.id === zone.id
                    return (
                      <React.Fragment key={zone.id}>
                        <Rect
                          x={zone.layout2DX}
                          y={zone.layout2DY}
                          width={zone.layout2DWidth}
                          height={zone.layout2DHeight}
                          rotation={zone.layout2DRotationDeg || 0}
                          fill={isSelected ? (zone.layoutColor || '#C3B665') : '#374151'}
                          stroke={isSelected ? '#d4c87f' : '#1f2937'}
                          strokeWidth={2}
                          onMouseEnter={() => document.body.style.cursor = 'pointer'}
                          onMouseLeave={() => document.body.style.cursor = 'default'}
                          onClick={() => handleZoneClick(zone)}
                          onTap={() => handleZoneClick(zone)}
                        />
                        <Text
                          x={zone.layout2DX + zone.layout2DWidth / 2 - 40}
                          y={zone.layout2DY + zone.layout2DHeight / 2 - 10}
                          text={zone.name}
                          fontSize={14}
                          fill={isSelected ? 'black' : 'white'}
                          fontStyle="bold"
                          align="center"
                          width={80}
                          listening={false}
                        />
                      </React.Fragment>
                    )
                  })}
                </Layer>
              </Stage>
            </div>
          ) : (
            <div className="h-[450px] flex items-center justify-center text-gray-500">
              <MapPin size={40} className="mb-3 mr-2" /> There is no 2D floor plan for this Musical Show.
            </div>
          )}

          {/* Render zone không có toạ độ dạng list bên dưới */}
          {listableZones.length > 0 && (
            <div className="mt-6 border-t border-gray-800 pt-6">
              <h4 className="text-sm font-bold text-gray-400 mb-3">Other Zones (No coordinates)</h4>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {listableZones.map(zone => (
                  <button
                    key={zone.id}
                    onClick={() => handleZoneClick(zone)}
                    className={`p-3 rounded-lg border text-left transition-colors ${selectedZone?.id === zone.id ? 'bg-[#C3B665]/10 border-[#C3B665]' : 'bg-black/30 border-gray-800 hover:border-gray-600'}`}
                  >
                    <p className="text-white font-medium text-sm">{zone.name}</p>
                    <p className="text-gray-500 text-xs">Capacity: {zone.capacity}</p>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* KHU VỰC THÔNG TIN VÉ ĐÃ CHỌN */}
        <div className="lg:col-span-1 bg-gray-900 border border-gray-800 rounded-2xl p-6 flex flex-col">
          <h3 className="text-xl font-bold text-[#C3B665] mb-6">Area Info</h3>

          {selectedZone ? (
            <div className="flex-1 flex flex-col">
              <div className="space-y-4 mb-6">
                <div>
                  <p className="text-gray-500 text-sm">Selected area</p>
                  <p className="text-white text-2xl font-bold">{selectedZone.name}</p>
                </div>
                {selectedZone.description && (
                  <p className="text-gray-400 text-sm italic">{selectedZone.description}</p>
                )}
              </div>

              <div className="bg-black/30 border border-gray-800 rounded-lg p-4 mb-6">
                <div className="flex justify-between items-center mb-3">
                  <p className="text-gray-500 text-sm">Capacity</p>
                  <p className="text-white text-base font-medium">{selectedZone.capacity} seats</p>
                </div>
                <div className="flex justify-between items-center">
                  <p className="text-gray-500 text-sm">Quantity</p>
                  <div className="flex items-center gap-3">
                    <button onClick={() => setQuantity(prev => Math.max(1, prev - 1))} className="p-1 rounded-md bg-gray-800 hover:bg-gray-700 text-white">
                      <Minus size={14} />
                    </button>
                    <span className="text-white font-bold w-6 text-center">{quantity}</span>
                    <button onClick={() => setQuantity(prev => Math.min(selectedZone.capacity, prev + 1))} className="p-1 rounded-md bg-gray-800 hover:bg-gray-700 text-white">
                      <Plus size={14} />
                    </button>
                  </div>
                </div>
              </div>

              {readOnly ? (
                <div className="mt-auto w-full bg-black/30 border border-dashed border-gray-700 rounded-lg py-3 text-center text-gray-500 text-sm italic">
                  Preview Mode (Admin)
                </div>
              ) : (
                <button
                  onClick={handleCheckout}
                  disabled={isProcessing}
                  className="mt-auto w-full bg-[#C3B665] text-black py-3 rounded-lg font-bold hover:bg-[#d4c87f] transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isProcessing ? (
                    <><Loader2 size={18} className="animate-spin" /> Pending...</>
                  ) : (
                    'Purchase'
                  )}
                </button>
              )}

            </div>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-center">
              <MapPin size={40} className="text-gray-700 mb-4" />
              <p className="text-gray-500 font-medium">Please choose an Area</p>
              <p className="text-gray-600 text-sm mt-1">Click area to view Detail.</p>
            </div>
          )}
        </div>
      </div>

      {/* MODAL YÊU CẦU ĐĂNG NHẬP */}
      {isLoginModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={() => setIsLoginModalOpen(false)}></div>
          <div className="relative bg-gray-950 border border-gray-800 rounded-2xl w-full max-w-md p-6 shadow-2xl text-center">
            <div className="w-16 h-16 mx-auto bg-[#C3B665]/10 rounded-full flex items-center justify-center mb-4 border border-[#C3B665]/30">
              <Lock size={28} className="text-[#C3B665]" />
            </div>
            <h2 className="text-xl font-bold text-white mb-2">Login required</h2>
            <p className="text-gray-400 mb-6">Please login to Purchase Ticket.</p>
            <div className="flex gap-3">
              <button onClick={() => setIsLoginModalOpen(false)} className="flex-1 py-2.5 border border-gray-700 text-gray-300 rounded-lg font-medium hover:bg-gray-800 transition-colors">
                Cancel
              </button>
              <Link to="/login" className="flex-1 py-2.5 bg-[#C3B665] text-black rounded-lg font-bold hover:bg-[#d4c87f] transition-colors flex items-center justify-center">
                Login
              </Link>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

export default ShowMap