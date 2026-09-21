// src/components/lounge/PanoramaViewer.jsx
//
// GHI CHÚ CHO ĐỘI FE — trình xem tour 360° CÔNG KHAI cho trang chi tiết phòng trà.
// - Dữ liệu là đúng cái Owner đã quản lý ở trang Tour 360° (scenes + hotspots, getLoungeTour). Trước đây
//   khán giả không có trình xem nào, dù backend đã có sẵn dữ liệu.
// - Dùng `three` THUẦN, không dùng @react-three/fiber: fiber 9.7 chỉ hỗ trợ React < 19.3 còn dự án đang
//   chạy 19.3 — ép cài sẽ tạo tổ hợp không được hỗ trợ. Nhu cầu ở đây (một khối cầu + một camera) cũng
//   đủ nhỏ để viết trực tiếp, ít phụ thuộc hơn.
// - Toán học (tỉ lệ ảnh -> góc phủ dọc, quy ước yaw/pitch) ở src/utils/panoramaMath.js và ĐÃ CÓ TEST bằng
//   chính three.js. Ảnh thật trên hệ thống là dải 6,4:1 chứ không phải ảnh cầu 2:1 nên không thể giả định.
// - Vòng lặp dựng hình DỪNG khi khung ra khỏi màn hình (IntersectionObserver) và khi tab bị ẩn — không đốt
//   pin/GPU cho thứ không ai thấy. Tự xoay chậm lúc mới vào và DỪNG ngay khi người dùng chạm; tắt hẳn khi
//   prefers-reduced-motion.
// - `videoScreen` (tuỳ chọn): đặt MỘT MÀN HÌNH VIDEO lơ lửng trong không gian, dùng cho livestream "ngồi tại
//   phòng trà". Video là phần tử <video> đã có sẵn (HLS.js gắn ở StreamPlayer) — texture chỉ ĐỌC hình từ đó,
//   âm thanh vẫn phát bình thường từ chính phần tử video. Khi luồng chưa có hình thì màn hình hiện tấm
//   thông báo, không phải khung đen.
// - Chạm hai ngón để phóng to, cuộn chuột để phóng to, phím mũi tên để quay (khung có tabIndex) — không
//   chỉ dựa vào chuột.
import { useEffect, useRef, useState, useCallback } from 'react'
import * as THREE from 'three'
import { Maximize2, Minimize2, Info, ArrowUpRight, Loader2, ImageOff, X, Tv } from 'lucide-react'
import {
  viewLimits, directionFromYawPitch, dragToAngles, clampPitch, blackBorderCrop,
} from '../../utils/panoramaMath'

const SUBLINE = 'Màn hình sẽ sáng lên khi có tín hiệu'
const RADIUS = 500
const HOTSPOT_RADIUS = 400
const prefersReducedMotion = () =>
  typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches

// Đo tỉ lệ điểm ảnh gần đen theo từng hàng trên bản THU NHỎ của ảnh (rẻ, vài chục ms) để cắt viền đen
// của ảnh ghép — xem blackBorderCrop trong panoramaMath.js. Lỗi đọc pixel (ví dụ ảnh khác nguồn bị chặn
// CORS làm canvas "bẩn") thì bỏ qua và dựng nguyên ảnh, không được làm hỏng cả trình xem.
function measureBlackBorder(image) {
  try {
    const w = 512
    const h = Math.max(8, Math.round((image.height / image.width) * w))
    const canvas = document.createElement('canvas')
    canvas.width = w
    canvas.height = h
    const ctx = canvas.getContext('2d', { willReadFrequently: true })
    ctx.drawImage(image, 0, 0, w, h)
    const { data } = ctx.getImageData(0, 0, w, h)
    const ratios = new Array(h).fill(0)
    for (let y = 0; y < h; y++) {
      let dark = 0
      for (let x = 0; x < w; x++) {
        const i = (y * w + x) * 4
        if (Math.max(data[i], data[i + 1], data[i + 2]) < 25) dark++
      }
      ratios[y] = dark / w
    }
    return blackBorderCrop(ratios)
  } catch {
    return 0
  }
}

// Nội suy góc theo đường ngắn nhất (qua mốc ±180°) — kéo sang bên kia mốc không được quay ngược cả vòng.
const lerpAngle = (a, b, t) => {
  let d = ((b - a + 540) % 360) - 180
  return a + d * t
}

const PanoramaViewer = ({ scenes = [], initialSceneId = null, className = '', videoScreen = null, autoRotate = true }) => {
  const containerRef = useRef(null)
  const mountRef = useRef(null)
  const hotspotEls = useRef(new Map())
  const three = useRef({}) // renderer, camera, scene, mesh — đối tượng three, không phải state React
  const view = useRef({
    yaw: 0, pitch: 0, fov: 70, tYaw: 0, tPitch: 0, tFov: 70,
    limits: viewLimits(2, 70), auto: autoRotate && !prefersReducedMotion(), visible: true,
    pointers: new Map(), pinchStart: null,
  })

  const [sceneId, setSceneId] = useState(initialSceneId ?? scenes[0]?.id ?? null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)
  const [fading, setFading] = useState(false)
  const [hintVisible, setHintVisible] = useState(true)
  const [openInfo, setOpenInfo] = useState(null)
  const [isFullscreen, setIsFullscreen] = useState(false)

  const scene = scenes.find((s) => s.id === sceneId) ?? scenes[0]

  // Bản sao mới nhất của videoScreen cho các hàm chạy ngoài vòng render (tải ảnh, nút "Về màn hình").
  const screenRef = useRef(videoScreen)
  useEffect(() => { screenRef.current = videoScreen }, [videoScreen])

  const stopAuto = useCallback(() => {
    view.current.auto = false
    setHintVisible(false)
  }, [])

  // ===== KHỞI TẠO renderer/camera MỘT LẦN =====
  useEffect(() => {
    const host = mountRef.current
    const st = view.current
    const renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' })
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2))
    renderer.outputColorSpace = THREE.SRGBColorSpace
    host.appendChild(renderer.domElement)
    renderer.domElement.style.cssText = 'display:block;width:100%;height:100%;touch-action:none;cursor:grab'

    const threeScene = new THREE.Scene()
    const camera = new THREE.PerspectiveCamera(st.fov, 16 / 9, 0.1, 1100)
    camera.rotation.order = 'YXZ'
    three.current = { renderer, camera, scene: threeScene, mesh: null }

    const resize = () => {
      const w = host.clientWidth || 1
      const h = host.clientHeight || 1
      renderer.setSize(w, h, false)
      camera.aspect = w / h
      camera.updateProjectionMatrix()
    }
    resize()
    const ro = new ResizeObserver(resize)
    ro.observe(host)

    // --- kéo / chạm / pinch ---
    const el = renderer.domElement
    const onDown = (e) => {
      el.setPointerCapture(e.pointerId)
      st.pointers.set(e.pointerId, { x: e.clientX, y: e.clientY })
      el.style.cursor = 'grabbing'
      stopAuto()
      if (st.pointers.size === 2) {
        const [a, b] = [...st.pointers.values()]
        st.pinchStart = { dist: Math.hypot(a.x - b.x, a.y - b.y), fov: st.tFov }
      }
    }
    const setFov = (fov) => {
      const lim = viewLimits(st.aspect ?? 2, fov)
      st.tFov = lim.fov
      st.limits = lim
      st.tPitch = clampPitch(st.tPitch, lim.pitchMax)
    }
    const onMove = (e) => {
      const p = st.pointers.get(e.pointerId)
      if (!p) return
      if (st.pointers.size === 2 && st.pinchStart) {
        st.pointers.set(e.pointerId, { x: e.clientX, y: e.clientY })
        const [a, b] = [...st.pointers.values()]
        const d = Math.hypot(a.x - b.x, a.y - b.y)
        setFov(st.pinchStart.fov * (st.pinchStart.dist / Math.max(1, d)))
        return
      }
      const dx = e.clientX - p.x
      const dy = e.clientY - p.y
      st.pointers.set(e.pointerId, { x: e.clientX, y: e.clientY })
      const a = dragToAngles({ yaw: st.tYaw, pitch: st.tPitch }, dx, dy, st.fov, el.clientHeight)
      st.tYaw = a.yaw
      st.tPitch = clampPitch(a.pitch, st.limits.pitchMax)
    }
    const onUp = (e) => {
      st.pointers.delete(e.pointerId)
      if (st.pointers.size < 2) st.pinchStart = null
      if (st.pointers.size === 0) el.style.cursor = 'grab'
    }
    const onWheel = (e) => {
      e.preventDefault()
      stopAuto()
      setFov(st.tFov + e.deltaY * 0.04)
    }
    el.addEventListener('pointerdown', onDown)
    el.addEventListener('pointermove', onMove)
    el.addEventListener('pointerup', onUp)
    el.addEventListener('pointercancel', onUp)
    el.addEventListener('wheel', onWheel, { passive: false })

    // --- dừng dựng hình khi khung ra khỏi màn hình ---
    const io = new IntersectionObserver(([entry]) => { st.visible = entry.isIntersecting }, { threshold: 0.05 })
    io.observe(host)

    // --- vòng lặp ---
    const fwd = new THREE.Vector3()
    const tmp = new THREE.Vector3()
    renderer.setAnimationLoop(() => {
      if (!st.visible || !three.current.mesh) return
      if (st.auto) st.tYaw = lerpAngle(st.tYaw, st.tYaw - 0.06, 1)
      st.yaw = lerpAngle(st.yaw, st.tYaw, 0.14)
      st.pitch += (st.tPitch - st.pitch) * 0.14
      if (Math.abs(st.tFov - st.fov) > 0.01) {
        st.fov += (st.tFov - st.fov) * 0.14
        camera.fov = st.fov
        camera.updateProjectionMatrix()
      }
      const sc = three.current.screen
      if (sc) {
        const ready = sc.video.readyState >= 2 && !sc.video.paused
        if (ready !== sc.live) {
          sc.live = ready
          sc.mesh.material.map = ready ? sc.videoTex : sc.placeholderTex
          sc.mesh.material.needsUpdate = true
        }
      }
      camera.rotation.set((st.pitch * Math.PI) / 180, ((90 - st.yaw) * Math.PI) / 180, 0)
      camera.updateMatrixWorld(true)
      camera.getWorldDirection(fwd)

      // đặt các nút hotspot (HTML) lên đúng chỗ trên màn hình
      const w = host.clientWidth
      const h = host.clientHeight
      hotspotEls.current.forEach((node, id) => {
        const hs = st.hotspots?.get(id)
        if (!node || !hs) return
        const d = directionFromYawPitch(hs.yaw, hs.pitch)
        tmp.set(d.x, d.y, d.z)
        const inFront = tmp.dot(fwd) > 0.05
        tmp.multiplyScalar(HOTSPOT_RADIUS).project(camera)
        const x = (tmp.x * 0.5 + 0.5) * w
        const y = (-tmp.y * 0.5 + 0.5) * h
        const shown = inFront && x > -40 && x < w + 40 && y > -40 && y < h + 40
        node.style.transform = `translate(${x}px, ${y}px) translate(-50%, -50%)`
        node.style.opacity = shown ? '1' : '0'
        node.style.pointerEvents = shown ? 'auto' : 'none'
      })
      renderer.render(threeScene, camera)
    })

    return () => {
      renderer.setAnimationLoop(null)
      ro.disconnect()
      io.disconnect()
      el.removeEventListener('pointerdown', onDown)
      el.removeEventListener('pointermove', onMove)
      el.removeEventListener('pointerup', onUp)
      el.removeEventListener('pointercancel', onUp)
      el.removeEventListener('wheel', onWheel)
      const { mesh } = three.current
      if (mesh) { mesh.geometry.dispose(); mesh.material.map?.dispose(); mesh.material.dispose() }
      renderer.dispose()
      renderer.forceContextLoss()
      host.removeChild(renderer.domElement)
      three.current = {}
    }
  }, [stopAuto])

  // ===== NẠP ẢNH của scene hiện tại =====
  useEffect(() => {
    if (!scene?.imageUrl || !three.current.renderer) return
    let cancelled = false
    const st = view.current
    // Một cảnh cần hiện trước khi xoay ảnh xong -> đặt cờ ở callback (bất đồng bộ), không đặt đồng bộ trong effect.
    st.hotspots = new Map((scene.hotspots ?? []).map((h) => [h.id, h]))

    new THREE.TextureLoader().load(
      scene.imageUrl,
      (tex) => {
        if (cancelled) { tex.dispose(); return }
        const { renderer, scene: threeScene } = three.current
        if (!renderer) { tex.dispose(); return }
        tex.colorSpace = THREE.SRGBColorSpace
        tex.anisotropy = Math.min(8, renderer.capabilities.getMaxAnisotropy())
        // Cắt viền đen (ảnh ghép): chỉ hiện phần giữa của ảnh, và coi như ảnh CAO HƠN ÍT đi để góc phủ dọc
        // (viewLimits) tính đúng theo phần còn lại — nếu không FOV sẽ lớn hơn ảnh thật và lộ lại mảng trống.
        const crop = measureBlackBorder(tex.image)
        tex.repeat.set(1, 1 - 2 * crop)
        tex.offset.set(0, crop)
        const aspect = tex.image.width / (tex.image.height * (1 - 2 * crop))
        st.aspect = aspect

        const lim = viewLimits(aspect, 70)
        const vSpan = (lim.spanDeg * Math.PI) / 180
        const geo = new THREE.SphereGeometry(RADIUS, 96, 48, 0, Math.PI * 2, (Math.PI - vSpan) / 2, vSpan)
        geo.scale(-1, 1, 1) // nhìn từ bên trong không bị ngược gương
        const mesh = new THREE.Mesh(geo, new THREE.MeshBasicMaterial({ map: tex }))

        const old = three.current.mesh
        if (old) { threeScene.remove(old); old.geometry.dispose(); old.material.map?.dispose(); old.material.dispose() }
        threeScene.add(mesh)
        three.current.mesh = mesh

        st.limits = lim
        st.yaw = st.tYaw = screenRef.current?.yaw ?? 0
        st.pitch = st.tPitch = 0
        st.fov = st.tFov = lim.fov
        three.current.camera.fov = lim.fov
        three.current.camera.updateProjectionMatrix()
        setError(false)
        setLoading(false)
        setFading(false)
      },
      undefined,
      () => { if (!cancelled) { setError(true); setLoading(false); setFading(false) } },
    )
    return () => { cancelled = true }
  }, [scene?.id, scene?.imageUrl]) // eslint-disable-line react-hooks/exhaustive-deps

  // ===== MÀN HÌNH VIDEO trong không gian (livestream) =====
  const screenVideo = videoScreen?.video
  const screenYaw = videoScreen?.yaw ?? 0
  const screenPitch = videoScreen?.pitch ?? 0
  const screenWidthDeg = videoScreen?.widthDeg ?? 40
  const screenPlaceholder = videoScreen?.placeholder ?? 'Buổi diễn sắp bắt đầu'
  useEffect(() => {
    const t = three.current
    if (!t.scene || !screenVideo) return
    const dist = 380
    const w = 2 * dist * Math.tan((screenWidthDeg * Math.PI) / 360)
    const h = (w * 9) / 16

    const videoTex = new THREE.VideoTexture(screenVideo)
    videoTex.colorSpace = THREE.SRGBColorSpace
    videoTex.generateMipmaps = false
    videoTex.minFilter = THREE.LinearFilter

    // Tấm thông báo khi chưa có hình: cùng bảng màu espresso/cream của giao diện.
    // Vẽ vào canvas KHÔNG tự chờ phông web: nếu Playfair Display chưa nạp xong thì canvas rơi về phông dự
    // phòng và dấu tiếng Việt bị lệch ("sắ´p bắ´t"). Nên vẽ ngay một lần cho có hình, rồi chờ phông nạp
    // (kèm đúng đoạn chữ để tải cả bộ ký tự tiếng Việt) và vẽ lại.
    const canvas = document.createElement('canvas')
    canvas.width = 1280
    canvas.height = 720
    const ctx = canvas.getContext('2d')
    const paint = () => {
      ctx.fillStyle = '#2A1F17'
      ctx.fillRect(0, 0, 1280, 720)
      ctx.fillStyle = '#F5EDE0'
      ctx.font = '600 46px "Playfair Display", Georgia, serif'
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      ctx.fillText(screenPlaceholder, 640, 340)
      ctx.fillStyle = '#BFAE99'
      ctx.font = '400 26px "Plus Jakarta Sans", sans-serif'
      ctx.fillText(SUBLINE, 640, 410)
    }
    paint()
    const placeholderTex = new THREE.CanvasTexture(canvas)
    placeholderTex.colorSpace = THREE.SRGBColorSpace
    let disposed = false
    Promise.all([
      document.fonts.load('600 46px "Playfair Display"', screenPlaceholder),
      document.fonts.load('400 26px "Plus Jakarta Sans"', SUBLINE),
    ]).then(() => { if (!disposed) { paint(); placeholderTex.needsUpdate = true } }).catch(() => {})

    const mesh = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshBasicMaterial({ map: placeholderTex, toneMapped: false }))
    const frame = new THREE.Mesh(new THREE.PlaneGeometry(w * 1.035, h * 1.06), new THREE.MeshBasicMaterial({ color: 0x2a1f17 }))
    const d = directionFromYawPitch(screenYaw, screenPitch)
    mesh.position.set(d.x * dist, d.y * dist, d.z * dist)
    frame.position.set(d.x * (dist + 1.5), d.y * (dist + 1.5), d.z * (dist + 1.5))
    mesh.lookAt(0, 0, 0)
    frame.lookAt(0, 0, 0)
    t.scene.add(frame, mesh)
    t.screen = { mesh, video: screenVideo, videoTex, placeholderTex, live: false }

    return () => {
      disposed = true
      t.scene?.remove(frame, mesh)
      mesh.geometry.dispose(); mesh.material.dispose()
      frame.geometry.dispose(); frame.material.dispose()
      videoTex.dispose(); placeholderTex.dispose()
      t.screen = null
    }
  }, [screenVideo, screenYaw, screenPitch, screenWidthDeg, screenPlaceholder])

  // Quay về nhìn thẳng vào màn hình và phóng vào — để xem buổi diễn rõ sau khi đã nhìn quanh phòng.
  const focusScreen = () => {
    const st = view.current
    stopAuto()
    st.tYaw = screenYaw
    const lim = viewLimits(st.aspect ?? 2, 30)
    st.tFov = lim.fov
    st.limits = lim
    st.tPitch = clampPitch(screenPitch, lim.pitchMax)
  }

  // ===== toàn màn hình =====
  useEffect(() => {
    const onChange = () => setIsFullscreen(document.fullscreenElement === containerRef.current)
    document.addEventListener('fullscreenchange', onChange)
    return () => document.removeEventListener('fullscreenchange', onChange)
  }, [])

  const toggleFullscreen = () => {
    if (document.fullscreenElement) document.exitFullscreen?.()
    else containerRef.current?.requestFullscreen?.()
  }

  const goToScene = (id) => {
    if (id === sceneId) return
    stopAuto()
    setOpenInfo(null)
    setFading(true)
    setLoading(true)
    setTimeout(() => setSceneId(id), 220)
  }

  // ===== bàn phím =====
  const onKeyDown = (e) => {
    const st = view.current
    const step = 6
    const k = e.key
    if (!['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', '+', '=', '-', '_'].includes(k)) return
    e.preventDefault()
    stopAuto()
    if (k === 'ArrowLeft') st.tYaw -= step
    if (k === 'ArrowRight') st.tYaw += step
    if (k === 'ArrowUp') st.tPitch = clampPitch(st.tPitch + step, st.limits.pitchMax)
    if (k === 'ArrowDown') st.tPitch = clampPitch(st.tPitch - step, st.limits.pitchMax)
    if (k === '+' || k === '=' || k === '-' || k === '_') {
      const lim = viewLimits(st.aspect ?? 2, st.tFov + (k === '-' || k === '_' ? 6 : -6))
      st.tFov = lim.fov
      st.limits = lim
    }
  }

  if (!scene) return null

  const info = scene.hotspots?.find((h) => h.id === openInfo)

  return (
    <div
      ref={containerRef}
      className={`relative overflow-hidden bg-espresso select-none focus:outline-none focus-visible:ring-2 focus-visible:ring-brand ${className}`}
      tabIndex={0}
      role="group"
      aria-label={`Xem không gian phòng trà 360 độ${scene.name ? `, cảnh ${scene.name}` : ''}. Dùng chuột kéo hoặc phím mũi tên để nhìn quanh, phím cộng trừ để phóng to.`}
      onKeyDown={onKeyDown}
    >
      <div ref={mountRef} className="absolute inset-0" />

      {/* Lớp chuyển cảnh */}
      <div className={`absolute inset-0 bg-espresso pointer-events-none transition-opacity duration-200 ${fading || loading ? 'opacity-100' : 'opacity-0'}`} />

      {loading && !error && (
        <div className="absolute inset-0 flex items-center justify-center text-cream-mute" role="status">
          <Loader2 className="animate-spin" size={28} />
          <span className="sr-only">Đang tải ảnh 360°</span>
        </div>
      )}
      {error && (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 text-cream-mute text-sm" role="alert">
          <ImageOff size={28} strokeWidth={1.5} />
          Không tải được ảnh 360° của cảnh này.
        </div>
      )}

      {/* Hotspot — vị trí do vòng lặp dựng hình cập nhật */}
      {!loading && scene.hotspots?.map((h) => (
        <button
          key={h.id}
          ref={(node) => { if (node) hotspotEls.current.set(h.id, node); else hotspotEls.current.delete(h.id) }}
          type="button"
          onPointerDown={(e) => e.stopPropagation()}
          onClick={() => (h.type === 'Navigate' ? goToScene(h.targetSceneId) : setOpenInfo(h.id === openInfo ? null : h.id))}
          aria-label={h.label || (h.type === 'Navigate' ? 'Sang cảnh khác' : 'Xem chú thích')}
          title={h.label || undefined}
          className="absolute left-0 top-0 z-10 flex items-center gap-2 rounded-full bg-card/95 text-ink border border-line-strong shadow-lift pl-2 pr-3 py-1.5 text-xs font-semibold hover:bg-brand hover:text-on-brand transition-colors opacity-0"
          style={{ willChange: 'transform' }}
        >
          {h.type === 'Navigate' ? <ArrowUpRight size={15} /> : <Info size={15} />}
          {h.label && <span className="max-w-[10rem] truncate">{h.label}</span>}
        </button>
      ))}

      {info && (
        <div className="absolute left-1/2 bottom-16 -translate-x-1/2 z-20 w-[min(92%,26rem)] rounded-xl bg-card border border-line shadow-lift p-4 text-sm text-ink-soft">
          <button type="button" onClick={() => setOpenInfo(null)} aria-label="Đóng chú thích"
            className="absolute right-2 top-2 p-1 rounded-md text-ink-mute hover:bg-sunken"><X size={14} /></button>
          {info.label && <p className="font-semibold text-ink mb-1 pr-6">{info.label}</p>}
          <p className="leading-relaxed">{info.infoText}</p>
        </div>
      )}

      {/* Gợi ý thao tác — biến mất sau lần chạm đầu tiên */}
      <div className={`absolute left-4 top-4 z-10 px-3 py-1.5 rounded-full bg-espresso/70 backdrop-blur-sm text-cream text-xs transition-opacity duration-500 pointer-events-none ${hintVisible && !loading ? 'opacity-100' : 'opacity-0'}`}>
        Kéo để nhìn quanh · Cuộn để phóng to
      </div>

      <button type="button" onClick={toggleFullscreen} aria-label={isFullscreen ? 'Thoát toàn màn hình' : 'Xem toàn màn hình'}
        className="absolute right-4 top-4 z-10 w-10 h-10 rounded-full bg-espresso/70 backdrop-blur-sm text-cream flex items-center justify-center hover:bg-brand hover:text-on-brand transition-colors">
        {isFullscreen ? <Minimize2 size={17} /> : <Maximize2 size={17} />}
      </button>

      {videoScreen?.video && (
        <button type="button" onClick={focusScreen} aria-label="Quay về nhìn màn hình sân khấu"
          className="absolute right-4 top-16 z-10 h-10 px-3.5 rounded-full bg-espresso/70 backdrop-blur-sm text-cream text-xs font-semibold flex items-center gap-2 hover:bg-brand hover:text-on-brand transition-colors">
          <Tv size={15} /> Về màn hình
        </button>
      )}

      {scenes.length > 1 && (
        <div className="absolute left-4 right-4 bottom-4 z-10 flex gap-2 overflow-x-auto hide-scrollbar" role="tablist" aria-label="Các điểm đứng trong phòng trà">
          {scenes.map((s, i) => (
            <button key={s.id} type="button" role="tab" aria-selected={s.id === scene.id} onClick={() => goToScene(s.id)}
              className={`flex-shrink-0 px-3.5 py-1.5 rounded-full text-xs font-semibold backdrop-blur-sm transition-colors ${s.id === scene.id ? 'bg-brand text-on-brand' : 'bg-espresso/70 text-cream hover:bg-espresso'}`}>
              {s.name || `Cảnh ${i + 1}`}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

export default PanoramaViewer
