import { useRef, useEffect, useState } from 'react'
import Hls from 'hls.js'
import { Heart, DollarSign } from 'lucide-react'

// Component hiển thị Alert Donate (Animation)
const DonateAlert = ({ alert, onEnd, duration = 5000 }) => {
  const [progress, setProgress] = useState(100)
  const [isExiting, setIsExiting] = useState(false)

  const onEndRef = useRef(onEnd)
  onEndRef.current = onEnd

  useEffect(() => {
    const TOTAL_STEPS = 100
    const stepTime = duration / TOTAL_STEPS
    const endAt = Date.now() + duration
    let endTimeout = null

    // 1 TIMER DUY NHẤT: vừa chạy progress, vừa tự kết thúc
    // (dùng Date.now() nên tiến độ luôn đúng, không lệch dù interval bị trễ)
    const progressTimer = setInterval(() => {
      const remaining = endAt - Date.now()
      if (remaining <= 0) {
        clearInterval(progressTimer)
        setProgress(0)
        setIsExiting(true) // bật fade-out
        // đợi 300ms cho animation chạy xong rồi mới báo page remove
        endTimeout = setTimeout(() => onEndRef.current(alert.id), 300)
      } else {
        setProgress(Math.round((remaining / duration) * 100))
      }
    }, stepTime)

    return () => {
      clearInterval(progressTimer)
      if (endTimeout) clearTimeout(endTimeout)
    }
  }, [alert.id, duration]) // onEnd KHÔNG nằm trong deps

  return (
    <div className={`
      animate-slideInLeft flex flex-col bg-black/80 backdrop-blur-md
      border border-[#C3B665]/50 rounded-lg shadow-2xl mb-2 w-[260px] overflow-hidden
      transition-all duration-300
      ${isExiting ? 'opacity-0 -translate-x-4' : 'opacity-100'}
    `}>
      
      {/* ===== NỘI DUNG ===== */}
      <div className="flex items-center gap-3 px-4 py-2.5">
        <div className="w-8 h-8 rounded-full bg-[#C3B665]/20 flex items-center justify-center flex-shrink-0">
          <Heart size={16} className="text-[#C3B665] fill-[#C3B665]" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-bold text-white truncate">{alert.user?.name || 'Someone'}</p>
          <p className="text-xs text-[#C3B665] font-semibold truncate">
            donated {alert.amount?.toLocaleString('vi-VN')}đ to {alert.performerName}
          </p>
          {alert.message && (
            <p className="text-[11px] text-gray-300 italic truncate">"{alert.message}"</p>
          )}
        </div>
      </div>

      {/* ===== PROGRESS BAR ===== */}
      <div className="h-1 w-full bg-white/10">
        <div
          className="h-full bg-gradient-to-r from-[#C3B665] to-[#ede2a0]"
          style={{ width: `${progress}%` }}
        />
      </div>
    </div>
  )
}

const StreamPlayer = ({ streamUrl, donationAlerts, onAlertEnd }) => {
  const videoRef = useRef(null)

  useEffect(() => {
    const video = videoRef.current
    if (!video || !streamUrl) return

    if (Hls.isSupported()) {
      const hls = new Hls({ enableWorker: true, lowLatencyMode: true })
      hls.loadSource(streamUrl)
      hls.attachMedia(video)
      hls.on(Hls.Events.MANIFEST_PARSED, () => {
        video.play().catch(e => console.log("Autoplay blocked"))
      })
      return () => hls.destroy()
    } 
    // Fallback cho Safari native HLS
    else if (video.canPlayType('application/vnd.apple.mpegurl')) {
      video.src = streamUrl
      video.addEventListener('loadedmetadata', () => video.play().catch(e => {}))
    }
  }, [streamUrl])

  return (
    <div className="w-full h-full relative bg-black flex items-center justify-center">
      
      <video 
        ref={videoRef} 
        className="w-full h-full object-contain" 
        playsInline 
        controls 
      />

      {/* OVERLAY DONATE ALERTS (Góc dưới trái kiểu Twitch) */}
      <div className="absolute bottom-4 left-4 z-20 flex flex-col-reverse gap-2">
        {donationAlerts.map(alert => (
          <DonateAlert key={alert.id} alert={alert} onEnd={onAlertEnd} />
        ))}
      </div>

      {/* PLACEHOLDER KHI CHƯA CÓ STREAM URL */}
      {!streamUrl && (
        <div className="absolute inset-0 flex flex-col items-center justify-center text-gray-400 z-10">
          <DollarSign size={40} className="mb-3 text-[#C3B665]" />
          <p className="font-bold text-lg">Stream is not available yet</p>
          <p className="text-sm text-gray-500">Waiting for the host to go live...</p>
        </div>
      )}
    </div>
  )
}

export default StreamPlayer