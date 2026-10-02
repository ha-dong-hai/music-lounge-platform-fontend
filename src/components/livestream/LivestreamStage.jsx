// src/components/livestream/LivestreamStage.jsx
// Vùng video của trang xem livestream — tự quản chế độ "ngồi tại phòng trà" (immersive 360°).
//
// BA TRẠNG THÁI KẾT THÚC KHÁC NHAU:
// - Bị Admin cắt sóng: `terminatedReason` nói vì sao. Không hiện thì người xem chỉ thấy một khung
//   đen và không biết chuyện gì, còn thông báo tức thời thì đã trôi mất.
// - Đã kết thúc và CÓ bản ghi lại: `recordingUrl`. Không đọc trường này thì bản ghi tồn tại mà
//   không ai xem được.
// - Đã kết thúc và KHÔNG có bản ghi: nói thẳng là không có, đừng để người ta chờ.
//
// CHẾ ĐỘ "NGỒI TẠI PHÒNG TRÀ": xung quanh là toàn cảnh 360° thật của phòng trà, màn hình
// livestream lơ lửng ở chỗ sân khấu. Đây là LỰA CHỌN, mặc định vẫn là chế độ rạp — xem live trước
// hết là để xem rõ buổi diễn; video làm texture tốn GPU nên không ép mọi thiết bị. Không có tour,
// hoặc trình duyệt không có WebGL, thì nút không hiện và giao diện y như chế độ thường.
import { useState, useMemo, lazy, Suspense } from 'react'
import { Loader2, ShieldOff, Square, Eye, Sofa, Theater } from 'lucide-react'
import StreamPlayer from './StreamPlayer'

// Chế độ "ngồi tại phòng trà" kéo theo three.js (~500KB) — chỉ tải khi người xem BẬT nó.
const PanoramaViewer = lazy(() => import('../lounge/PanoramaViewer'))

const TerminatedOverlay = ({ reason }) => (
  <div className="absolute inset-0 flex items-center justify-center p-8">
    <div className="max-w-md text-center">
      <ShieldOff size={34} className="mx-auto text-danger mb-4" />
      <p className="text-lg font-bold text-ink">Buổi phát đã bị dừng</p>
      <p className="text-sm text-ink-soft mt-2 leading-relaxed">
        {reason ? `Lý do: ${reason}` : 'Quản trị viên đã dừng buổi phát này. Không có lý do được ghi lại.'}
      </p>
      <p className="text-xs text-ink-mute mt-3">Đây là trạng thái cuối — buổi phát không tiếp tục được nữa.</p>
    </div>
  </div>
)

const EndedOverlay = ({ recordingUrl }) => (
  <div className="absolute inset-0 flex items-center justify-center p-8">
    <div className="max-w-md text-center">
      <Square size={30} className="mx-auto text-ink-mute mb-4" />
      <p className="text-lg font-bold text-ink">Buổi phát đã kết thúc</p>
      {recordingUrl ? (
        <>
          <p className="text-sm text-ink-soft mt-2">Bạn xem lại được bản ghi.</p>
          <a
            href={recordingUrl}
            target="_blank"
            rel="noreferrer"
            className="mt-4 inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-brand text-on-brand text-sm font-bold hover:bg-brand-hover"
          >
            <Eye size={16} /> Xem lại bản ghi
          </a>
        </>
      ) : (
        <p className="text-sm text-ink-mute mt-2 leading-relaxed">Buổi phát này không có bản ghi lại.</p>
      )}
    </div>
  </div>
)

const LivestreamStage = ({ livestream, tourScenes, donationAlerts, onAlertEnd }) => {
  const [immersive, setImmersive] = useState(false)
  const [videoEl, setVideoEl] = useState(null)

  const webglOk = useMemo(() => {
    try {
      const c = document.createElement('canvas')
      return !!(c.getContext('webgl2') || c.getContext('webgl'))
    } catch { return false }
  }, [])

  if (livestream?.status === 'Terminated') {
    return <TerminatedOverlay reason={livestream.terminatedReason} />
  }
  if (livestream?.status === 'Ended') {
    return <EndedOverlay recordingUrl={livestream.recordingUrl} />
  }

  // Vị trí màn hình trong không gian 360°: chú thích tên "Sân khấu" mà chủ phòng trà đặt trong
  // tour, nếu không có thì hướng 0° (giữa ảnh).
  const stageHotspot = tourScenes[0]?.hotspots?.find((h) => /sân khấu|stage/i.test(h.label || ''))

  return (
    <div className="absolute inset-0 bg-espresso">
      <StreamPlayer
        streamUrl={livestream?.hlsUrl}
        donationAlerts={donationAlerts}
        onAlertEnd={onAlertEnd}
        hidden={immersive}
        onVideoReady={setVideoEl}
      />

      {immersive && videoEl && (
        <Suspense
          fallback={
            <div className="absolute inset-0 flex items-center justify-center text-cream-mute">
              <Loader2 className="animate-spin" size={28} />
            </div>
          }
        >
          {/* Bọc ngoài để định vị: gốc PanoramaViewer đã là `relative`, truyền `absolute` vào
              className sẽ xung đột và làm khung co về chiều cao 0 (canvas vô hình). */}
          <div className="absolute inset-0 z-10">
            <PanoramaViewer
              scenes={tourScenes}
              autoRotate={false}
              videoScreen={{
                video: videoEl,
                yaw: stageHotspot?.yaw ?? 0,
                pitch: stageHotspot?.pitch ?? 0,
                widthDeg: 40,
                placeholder: livestream?.hlsUrl ? 'Đang kết nối tới buổi diễn' : 'Buổi diễn sắp bắt đầu',
              }}
              className="w-full h-full"
            />
          </div>
        </Suspense>
      )}

      {tourScenes.length > 0 && webglOk && (
        <button
          type="button"
          onClick={() => setImmersive((v) => !v)}
          aria-pressed={immersive}
          className="absolute left-1/2 -translate-x-1/2 top-4 z-30 inline-flex items-center gap-2 px-4 h-10 rounded-full bg-espresso/75 backdrop-blur-sm border border-cream/20 text-cream text-xs font-semibold hover:bg-brand hover:text-on-brand hover:border-brand transition-colors"
        >
          {immersive
            ? <><Theater size={15} /> Xem chế độ rạp</>
            : <><Sofa size={15} /> Ngồi tại phòng trà</>}
        </button>
      )}
    </div>
  )
}

export default LivestreamStage