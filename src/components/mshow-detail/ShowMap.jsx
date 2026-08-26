// src/components/mshow-detail/EventMap.jsx
import { useState, useEffect, useRef } from 'react'
import React from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { MapPin, Check, Lock, Loader2, Minus, Plus } from 'lucide-react'
//import { Stage, Layer, Rect, Text } from 'react-konva'
import toast from 'react-hot-toast'
import { getLoungeZones } from '../../services/loungeServices'
import Skeleton from '../shared/Skeleton'

const EventMap = ({ loungeId, showData }) => {

    const [isLoading, setIsLoading] = useState(true)
    const user = JSON.parse(localStorage.getItem('user') || 'null')
    const [isLoginModalOpen, setIsLoginModalOpen] = useState(false)

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
                console.error('Lỗi tải zones:', err)
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

    return (
        <>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                {/* KHU VỰC VẼ KONVA & DANH SÁCH ZONE THIẾU TOẠ ĐỘ */}
                <div className="lg:col-span-2 bg-gray-900 border border-gray-800 rounded-2xl p-4 md:p-8 overflow-auto">

                </div>

                {/* KHU VỰC THÔNG TIN VÉ ĐÃ CHỌN */}
                <div className="lg:col-span-1 bg-gray-900 border border-gray-800 rounded-2xl p-6 flex flex-col">
                    <h3 className="text-xl font-bold text-[#C3B665] mb-6">Area Info</h3>

                    <div className="flex-1 flex flex-col items-center justify-center text-center">
                        <MapPin size={40} className="text-gray-700 mb-4" />
                        <p className="text-gray-500 font-medium">Chưa chọn khu vực</p>
                        <p className="text-gray-600 text-sm mt-1">Click vào một khu vực trên sơ đồ để xem chi tiết và chọn vé.</p>
                    </div>

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
                        <p className="text-gray-400 mb-6">Vui lòng đăng nhập để tiến hành mua vé.</p>
                        <div className="flex gap-3">
                            <button onClick={() => setIsLoginModalOpen(false)} className="flex-1 py-2.5 border border-gray-700 text-gray-300 rounded-lg font-medium hover:bg-gray-800 transition-colors">
                                Hủy
                            </button>
                            <Link to="/login" className="flex-1 py-2.5 bg-[#C3B665] text-black rounded-lg font-bold hover:bg-[#d4c87f] transition-colors flex items-center justify-center">
                                Đăng nhập
                            </Link>
                        </div>
                    </div>
                </div>
            )}
        </>
    )
}

export default EventMap