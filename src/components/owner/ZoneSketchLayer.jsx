// src/components/owner/ZoneSketchLayer.jsx
//
// GHI CHÚ CHO ĐỘI FE — lớp "vẽ phác" phủ lên khung sơ đồ 2D ở trang Khu vực chỗ ngồi:
// - Chủ phòng trà VẼ TAY một nét (chuột / cảm ứng / bút), thả ra thì `recognizeShape`
//   (src/utils/shapeRecognizer.js, có bộ test riêng) nhận diện và trả về hình chuẩn — vẽ ô vuông
//   xấu ra ô vuông thật. Thả xong lớp này chỉ BÁO KẾT QUẢ lên trang; việc áp vào khu vực nào,
//   snap lưới, hoàn tác do trang quyết định.
// - Dùng Pointer Events + setPointerCapture: một API cho chuột, cảm ứng và bút, và không bị mất nét
//   khi tay trượt ra ngoài khung giữa chừng. `touch-action: none` để kéo trên điện thoại không làm
//   cuộn trang.
// - Chỉ chặn chuột khi `enabled`; lúc tắt, lớp này không nhận sự kiện nào nên kéo-thả khối cũ vẫn chạy.
import { useRef, useState } from 'react'
import { recognizeShape } from '../../utils/shapeRecognizer'

const ZoneSketchLayer = ({ enabled, frameRef, onRecognized, onRejected }) => {
  const [points, setPoints] = useState([])
  const drawing = useRef(false)

  if (!enabled) return null

  const toLocal = (e) => {
    const r = frameRef.current.getBoundingClientRect()
    return { x: e.clientX - r.left, y: e.clientY - r.top }
  }

  const down = (e) => {
    if (e.button !== undefined && e.button !== 0) return
    e.currentTarget.setPointerCapture(e.pointerId)
    drawing.current = true
    setPoints([toLocal(e)])
  }
  const move = (e) => {
    if (!drawing.current) return
    setPoints((p) => [...p, toLocal(e)])
  }
  const up = () => {
    if (!drawing.current) return
    drawing.current = false
    const r = frameRef.current.getBoundingClientRect()
    const shape = recognizeShape(points)
    setPoints([])
    if (shape) onRecognized(shape, { width: r.width, height: r.height })
    else onRejected?.()
  }

  return (
    <svg
      className="absolute inset-0 w-full h-full z-20 cursor-crosshair"
      style={{ touchAction: 'none' }}
      onPointerDown={down}
      onPointerMove={move}
      onPointerUp={up}
      onPointerCancel={up}
      aria-label="Vùng vẽ phác khu vực"
    >
      {points.length > 1 && (
        <polyline
          points={points.map((p) => `${p.x},${p.y}`).join(' ')}
          fill="none"
          stroke="var(--color-brand-text)"
          strokeWidth="3"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeDasharray="1 6"
        />
      )}
    </svg>
  )
}

export default ZoneSketchLayer
