// src/pages/dev/Stage360Playground.jsx
//
// CHỈ DÙNG KHI PHÁT TRIỂN (route chỉ được đăng ký khi import.meta.env.DEV — xem AppRouter.jsx).
// Mục đích: kiểm chứng khung "ngồi tại phòng trà" (PanoramaViewer + videoScreen) mà KHÔNG bật livestream
// thật (Mux tính phí theo phút phát). Nguồn hình là một canvas tự vẽ + captureStream() — chạy hoàn toàn trên
// máy, không có request mạng nào tới dịch vụ phát. Ảnh tour chỉ được ĐỌC từ API công khai.
// Dùng: /__dev/stage360?lounge=2&mode=live|waiting
import { useEffect, useRef, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import PanoramaViewer from '../../components/lounge/PanoramaViewer'
import { getLoungeTour } from '../../services/loungeServices'

const Stage360Playground = () => {
  const [params] = useSearchParams()
  const loungeId = params.get('lounge') || '2'
  const live = params.get('mode') !== 'waiting'
  const [scenes, setScenes] = useState([])
  const [video, setVideo] = useState(null)
  const videoRef = useRef(null)

  useEffect(() => {
    getLoungeTour(loungeId).then((r) => setScenes((r.data?.scenes ?? []).filter((s) => s.imageUrl))).catch(() => {})
  }, [loungeId])

  // "Luồng giả": canvas 1280x720 vẽ liên tục (đồng hồ + thanh chạy) -> MediaStream -> <video>.
  useEffect(() => {
    const canvas = document.createElement('canvas')
    canvas.width = 1280
    canvas.height = 720
    const ctx = canvas.getContext('2d')
    let raf
    const t0 = performance.now()
    const draw = () => {
      const t = (performance.now() - t0) / 1000
      const g = ctx.createLinearGradient(0, 0, 1280, 720)
      g.addColorStop(0, '#6B1E2E'); g.addColorStop(1, '#1B2A4A')
      ctx.fillStyle = g
      ctx.fillRect(0, 0, 1280, 720)
      ctx.fillStyle = '#F5EDE0'
      ctx.font = '700 84px sans-serif'
      ctx.textAlign = 'center'
      ctx.fillText('LUỒNG THỬ NGHIỆM', 640, 300)
      ctx.font = '500 48px sans-serif'
      ctx.fillText(`Không phải livestream thật · ${t.toFixed(1)}s`, 640, 400)
      ctx.fillStyle = '#D4A03A'
      ctx.fillRect(140, 520, 1000 * ((t % 6) / 6), 22)
      raf = requestAnimationFrame(draw)
    }
    draw()
    const stream = canvas.captureStream(30)
    const el = videoRef.current
    el.srcObject = stream
    el.muted = true
    const start = () => { if (live) el.play().catch(() => {}) }
    start()
    setVideo(el)
    return () => { cancelAnimationFrame(raf); stream.getTracks().forEach((tr) => tr.stop()); el.srcObject = null }
  }, [live])

  // Quy ước vị trí màn hình: hotspot tên "Sân khấu" nếu có, ngược lại hướng 0°.
  const stageHotspot = scenes[0]?.hotspots?.find((h) => /sân khấu|stage/i.test(h.label || ''))

  return (
    <div className="max-w-5xl mx-auto p-6 space-y-3">
      <p className="text-sm text-ink-soft">Trang thử nghiệm nội bộ — chế độ: <b>{live ? 'có hình' : 'chờ tín hiệu'}</b></p>
      <video ref={videoRef} playsInline muted className="hidden" />
      {scenes.length > 0 && video && (
        <PanoramaViewer
          scenes={scenes}
          autoRotate={false}
          videoScreen={{ video, yaw: stageHotspot?.yaw ?? 0, pitch: stageHotspot?.pitch ?? 0, widthDeg: 40, placeholder: 'Buổi diễn sắp bắt đầu' }}
          className="w-full aspect-video rounded-2xl border border-line"
        />
      )}
    </div>
  )
}

export default Stage360Playground
