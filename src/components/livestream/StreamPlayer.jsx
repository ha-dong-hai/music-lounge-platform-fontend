import { useRef, useEffect } from 'react'
import Hls from 'hls.js'
import { Heart, DollarSign } from 'lucide-react'

// Component hiển thị 1 Alert Donate (Animation)
const DonateAlert = ({ alert, onEnd }) => {
  useEffect(() => {
    const timer = setTimeout(() => onEnd(alert.id), 5000) // Tự động tắt sau 5s
    return () => clearTimeout(timer)
  }, [alert.id, onEnd])

  return (
    <div className="animate-slideInLeft fade-in flex items-center gap-3 bg-black/80 backdrop-blur-md border border-[#C3B665]/50 rounded-lg px-4 py-2 shadow-2xl mb-2 max-w-xs">
      <div className="w-8 h-8 rounded-full bg-[#C3B665]/20 flex items-center justify-center flex-shrink-0">
        <Heart size={16} className="text-[#C3B665] fill-[#C3B665]" />
      </div>
      <div className="min-w-0">
        <p className="text-sm font-bold text-white truncate">{alert.user?.name || 'Someone'}</p>
        <p className="text-xs text-[#C3B665] font-semibold">
          donated {alert.amount?.toLocaleString('vi-VN')}đ to {alert.performerName}
        </p>
        {alert.message && <p className="text-[11px] text-gray-300 italic truncate">"{alert.message}"</p>}
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