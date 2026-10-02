// src/components/program/DiaThanCanvas.jsx
//
// ĐĨA THAN 3D (three.js) — vẽ đĩa nằm SAU bìa đĩa HTML của BiaDia, ló một phần ra khỏi bìa. Tải lười (React.lazy) từ
// BiaDia nên three.js không vào gói chính của trang. 02/10/2026, chủ dự án: cần thành phần three.js "hiện đại, công nghệ,
// tương tác với khách hàng" (reports/Polaroid và kỹ thuật số.md §4).
//
// DỮ LIỆU THẬT, KHÔNG TRANG TRÍ SUÔNG:
//  - Nhãn giữa đĩa in tên buổi diễn, phòng trà, ngày giờ (như nhãn đĩa than thật) — vẽ bằng canvas 2D ngay trên trình
//    duyệt. KHÔNG dán ảnh bìa lên đĩa: ảnh trên Firebase Storage không trả header CORS (đo 03/10: không có
//    Access-Control-Allow-Origin) nên WebGL không được phép đọc điểm ảnh — ảnh bìa vì vậy là <img> HTML của BiaDia.
//  - Số dải rãnh = số tiết mục trong line-up (mỗi tiết mục một "bài" trên mặt đĩa); chưa có line-up thì một dải liền.
//  - Buổi ĐANG diễn: đĩa tự quay 33⅓ vòng/phút + vạch vàng thếp quanh nhãn (Ember-Is-Live).
//
// TƯƠNG TÁC: kéo ngang trên khung → quay đĩa (có quán tính, ma sát dần); rê chuột vào khung → đĩa trượt ra khỏi bìa và
// nghiêng nhẹ theo con trỏ. Nút "Quay/Dừng đĩa" ở BiaDia là đường tương đương cho bàn phím.
//
// TRỢ NĂNG & HIỆU NĂNG:
//  - prefers-reduced-motion (WCAG 2.3.3): BiaDia không bật tự quay (người dùng tự bấm "Quay đĩa" thì vẫn quay — đó là
//    lựa chọn chủ động); không trượt, không nghiêng theo con trỏ; kéo vẫn quay (thao tác
//    trực tiếp, người dùng tự dừng).
//  - Tự quay > 5 giây là chuyển động tự chạy → WCAG 2.2.2 đòi dừng được: nút ở BiaDia.
//  - Chỉ vẽ khi có chuyển động (vòng lặp tự tắt khi đĩa đứng yên), dừng khi khung khuất (IntersectionObserver) hoặc tab
//    ẩn; pixel ratio ≤ 2 (điện thoại ≤ 1,5); giải phóng geometry/material/texture/renderer khi rời trang.
//  - canvas aria-hidden: thông tin trên nhãn đã có ở tiêu đề trang.
import { useEffect, useRef } from 'react'
import {
  WebGLRenderer, Scene, PerspectiveCamera, Group, Mesh, CylinderGeometry, TorusGeometry, CircleGeometry, MeshStandardMaterial,
  MeshPhysicalMaterial, MeshBasicMaterial, CanvasTexture, AmbientLight, SpotLight, DirectionalLight, SRGBColorSpace,
  ACESFilmicToneMapping, AdditiveBlending,
} from 'three'

// Bảng màu lấy từ token của DESIGN.md (canvas 2D không đọc được biến CSS lúc vẽ texture).
const MAU = { muc: '#231A15', board: '#14110F', lamp: '#F2EAE0', lampMute: '#B3A899', ember: '#C9A45C', nhua: '#0E0C0B' }
const VONG_PHUT = 100 / 3 // 33⅓
const TOC_DO_QUAY = (VONG_PHUT / 60) * Math.PI * 2 // rad/s
// Ma sát và độ bám tính theo THỜI GIAN, không theo khung hình (03/10: bản đầu nhân 0,965 mỗi khung — máy vẽ chậm/trình
// duyệt bóp tốc độ thì đĩa quay lâu gấp nhiều lần; bài kiểm bắt được). Giá trị = phần còn lại sau mỗi 1/60 giây.
const MA_SAT = 0.965
const TOC_DO_TOI_DA = 30 // rad/s — một cú vuốt mạnh không làm đĩa quay quá đà
const bam = (heSo, dt) => 1 - Math.pow(1 - heSo, dt * 60) // nội suy về đích, độc lập tốc độ khung hình
const RONG_KHUNG = 1.7 // khung = bìa vuông + phần đĩa ló ra (tỉ lệ rộng/cao), phải khớp BiaDia
const CAO_THE_GIOI = 2.13 // đơn vị 3D ứng với chiều cao khung (đường kính đĩa = 2)

const catDong = (ctx, chu, rongToiDa, soDongToiDa) => {
  const tu = String(chu || '').split(/\s+/); const dong = []; let hienTai = ''
  for (const t of tu) {
    const thu = hienTai ? `${hienTai} ${t}` : t
    if (ctx.measureText(thu).width <= rongToiDa) hienTai = thu
    else { if (hienTai) dong.push(hienTai); hienTai = t }
  }
  if (hienTai) dong.push(hienTai)
  if (dong.length > soDongToiDa) { dong.length = soDongToiDa; dong[soDongToiDa - 1] = dong[soDongToiDa - 1].replace(/\s*\S*$/, '') + '…' }
  return dong
}

// Mặt đĩa: rãnh nhựa + nhãn giấy in chữ thật. 1024px, tâm (512, 512).
const veMatDia = ({ ten, phongTra, ngay, soTietMuc, dangDien }) => {
  const c = document.createElement('canvas'); c.width = c.height = 1024
  const ctx = c.getContext('2d'); const T = 512
  ctx.fillStyle = MAU.nhua; ctx.beginPath(); ctx.arc(T, T, 512, 0, Math.PI * 2); ctx.fill()
  // Rãnh: vòng tròn mảnh, sáng tối xen kẽ ngẫu nhiên nhẹ (seed cố định theo vị trí để hình không đổi giữa các lần vẽ).
  const trong = 182, ngoai = 498
  const so = Math.max(1, Math.min(soTietMuc || 1, 12))
  const khe = so > 1 ? Array.from({ length: so - 1 }, (_, k) => trong + ((ngoai - trong) * (k + 1)) / so) : []
  for (let r = trong; r <= ngoai; r += 1.6) {
    const gapKhe = khe.some((k) => Math.abs(r - k) < 4.5)
    // Rãnh sáng hơn bản đầu (0,03–0,045 → 0,06–0,11): ảnh chụp 03/10 cho thấy mặt đĩa đọc thành mảng đen phẳng.
    const a = gapKhe ? 0.0 : 0.06 + 0.05 * Math.abs(Math.sin(r * 12.9898))
    ctx.strokeStyle = `rgba(242,234,224,${a})`; ctx.lineWidth = 0.9
    ctx.beginPath(); ctx.arc(T, T, r, 0, Math.PI * 2); ctx.stroke()
  }
  // Nhãn giấy
  const rNhan = 170
  ctx.fillStyle = MAU.lamp; ctx.beginPath(); ctx.arc(T, T, rNhan, 0, Math.PI * 2); ctx.fill()
  if (dangDien) { ctx.strokeStyle = MAU.ember; ctx.lineWidth = 10; ctx.beginPath(); ctx.arc(T, T, rNhan - 9, 0, Math.PI * 2); ctx.stroke() }
  ctx.fillStyle = MAU.muc; ctx.textAlign = 'center'; ctx.textBaseline = 'alphabetic'
  ctx.font = '600 15px "JetBrains Mono", monospace'; ctx.fillText('MUSICLOUNGE · 33⅓', T, T - 112)
  ctx.font = '400 34px Anton, "Be Vietnam Pro", sans-serif'
  const dongTen = catDong(ctx, ten, 250, 2)
  dongTen.forEach((d, k) => ctx.fillText(d, T, T - 58 + k * 38))
  ctx.font = '600 19px "Be Vietnam Pro", sans-serif'
  catDong(ctx, phongTra, 240, 1).forEach((d) => ctx.fillText(d, T, T + 52))
  const [thu, gio] = String(ngay || '').split(',').map((s) => s.trim())
  ctx.font = '400 15px "JetBrains Mono", monospace'; ctx.fillStyle = '#6E5E50'
  if (thu) ctx.fillText(thu, T, T + 82)
  if (gio) ctx.fillText(gio, T, T + 104)
  // Lỗ trục
  ctx.fillStyle = MAU.board; ctx.beginPath(); ctx.arc(T, T, 13, 0, Math.PI * 2); ctx.fill()
  return c
}

// ÁNH ĐÈN QUÉT trên mặt đĩa: hai vệt hình quạt ĐỨNG YÊN (không quay theo đĩa) — đúng như đĩa than thật dưới một ngọn
// đèn: rãnh tròn phản chiếu thành dải sáng cố định, đĩa quay bên dưới. Đây là thứ khiến mắt đọc được "đĩa đang quay"
// dù mặt đĩa đồng đều. Vẽ bằng canvas 2D (mô phỏng ánh sáng trong cảnh 3D, không phải nền chuyển sắc của giao diện).
const veAnhDen = () => {
  const c = document.createElement('canvas'); c.width = c.height = 512
  const ctx = c.getContext('2d'); const T = 256
  const veQuat = (gocGiua, rong, doSang) => {
    for (let k = -rong; k <= rong; k += 0.004) {
      const a = doSang * Math.pow(Math.cos((k / rong) * (Math.PI / 2)), 2)
      ctx.strokeStyle = `rgba(255,236,210,${a})`; ctx.lineWidth = 1.2
      ctx.beginPath(); ctx.moveTo(T + Math.cos(gocGiua + k) * 92, T + Math.sin(gocGiua + k) * 92)
      ctx.lineTo(T + Math.cos(gocGiua + k) * 252, T + Math.sin(gocGiua + k) * 252); ctx.stroke()
    }
  }
  veQuat(-Math.PI * 0.72, 0.32, 0.11) // trên-trái, phía ngọn đèn
  veQuat(Math.PI * 0.28, 0.32, 0.07) // đối xứng qua tâm, yếu hơn
  return c
}

const DiaThanCanvas = ({ ten, phongTra, ngay, soTietMuc = 0, dangDien = false, quay, onKhongHoTro, className = '' }) => {
  const khungRef = useRef(null)
  const trangThai = useRef({ quay })

  useEffect(() => {
    const khung = khungRef.current
    if (!khung) return undefined
    const giam = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
    const dienThoai = window.matchMedia?.('(pointer: coarse)').matches

    let renderer
    try {
      renderer = new WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'low-power', failIfMajorPerformanceCaveat: true })
    } catch { onKhongHoTro?.(); return undefined }
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, dienThoai ? 1.5 : 2))
    renderer.outputColorSpace = SRGBColorSpace
    renderer.toneMapping = ACESFilmicToneMapping
    renderer.toneMappingExposure = 1.15
    renderer.domElement.setAttribute('aria-hidden', 'true')
    renderer.domElement.style.display = 'block'
    khung.appendChild(renderer.domElement)

    const scene = new Scene()
    const fov = 35
    const camera = new PerspectiveCamera(fov, RONG_KHUNG, 0.1, 50)
    camera.position.z = CAO_THE_GIOI / (2 * Math.tan((fov * Math.PI) / 360))

    // Bìa vuông chiếm phần trái khung: tâm bìa ở x = -W/2 + H/2 (đơn vị thế giới).
    const W = CAO_THE_GIOI * RONG_KHUNG
    const tamBia = -W / 2 + CAO_THE_GIOI / 2
    const viTriNghi = tamBia + 1.02 // lúc nghỉ đĩa ló đủ để thấy nửa nhãn có chữ — mời người xem chạm vào
    const viTriRa = W / 2 - 1.02 // rê chuột: ló gần hết, mép phải chạm khung

    const nhom = new Group(); scene.add(nhom)
    const tex = new CanvasTexture(veMatDia({ ten, phongTra, ngay, soTietMuc, dangDien }))
    tex.colorSpace = SRGBColorSpace
    // Mặt tròn của CylinderGeometry ánh xạ ảnh xoay 90° (đo 03/10: chữ trên nhãn nằm dọc) — xoay bù để lúc nghỉ đọc ngang.
    tex.center.set(0.5, 0.5); tex.rotation = Math.PI / 2
    tex.anisotropy = Math.min(8, renderer.capabilities.getMaxAnisotropy())
    // Lớp bóng trong (clearcoat) như nhựa vinyl mới — bắt ánh đèn thành điểm sáng, đọc ra khối 3D.
    const matMat = new MeshPhysicalMaterial({ map: tex, roughness: 0.42, metalness: 0, clearcoat: 1, clearcoatRoughness: 0.18 })
    const matCanh = new MeshStandardMaterial({ color: MAU.nhua, roughness: 0.5, metalness: 0.1 })
    const hinh = new CylinderGeometry(1, 1, 0.03, 160, 1)
    const dia = new Mesh(hinh, [matCanh, matMat, matMat])
    dia.rotation.x = Math.PI / 2 // mặt đĩa hướng về người xem
    nhom.add(dia)
    // Gờ nổi ở mép đĩa — bắt ánh đèn thành viền sáng mảnh như đĩa thật.
    const go = new Mesh(new TorusGeometry(0.995, 0.012, 8, 160), matCanh)
    nhom.add(go)
    nhom.position.x = viTriNghi
    const texDen = new CanvasTexture(veAnhDen()); texDen.colorSpace = SRGBColorSpace
    const matDen = new MeshBasicMaterial({ map: texDen, transparent: true, blending: AdditiveBlending, depthWrite: false })
    const anhDen = new Mesh(new CircleGeometry(0.99, 96), matDen)
    anhDen.position.z = 0.018 // ngay trước mặt đĩa; thuộc nhóm (trượt, nghiêng theo) nhưng KHÔNG quay theo đĩa
    nhom.add(anhDen)
    // Tư thế nghỉ nghiêng nhẹ: đứng yên vẫn thấy phối cảnh (mặt đĩa thành elip, thấy độ dày mép).
    const NGHIENG_NGHI_X = 0.07, NGHIENG_NGHI_Y = -0.2

    scene.add(new AmbientLight(MAU.lamp, 0.35))
    const den = new SpotLight('#FFE2B8', 38, 12, Math.PI / 6, 0.6, 1.4) // đèn sân khấu ấm từ trên-trái
    den.position.set(-2.2, 2.6, 3.4); scene.add(den); scene.add(den.target)
    const vien = new DirectionalLight(MAU.lamp, 0.6); vien.position.set(3, -1.5, 2); scene.add(vien)

    const doiCo = () => {
      const r = khung.getBoundingClientRect()
      if (!r.width || !r.height) return
      renderer.setSize(r.width, r.height, false)
      renderer.domElement.style.width = '100%'; renderer.domElement.style.height = '100%'
      camera.aspect = r.width / r.height; camera.updateProjectionMatrix()
      ve()
    }

    // ---- trạng thái chuyển động ----
    let gocQuay = 0, vanToc = 0 // rad, rad/s
    let keo = null // { x, t }
    let hover = false, nghiengX = 0, nghiengY = 0, dichNghiengX = 0, dichNghiengY = 0
    let thayDuoc = true, anTab = document.hidden
    let lanCuoi = 0

    const ve = () => renderer.render(scene, camera)
    const dangDong = () => {
      const tuQuay = trangThai.current.quay
      const truot = Math.abs(nhom.position.x - (hover && !giam ? viTriRa : viTriNghi)) > 0.002
      const nghieng = Math.abs(nghiengX - dichNghiengX) + Math.abs(nghiengY - dichNghiengY) > 0.0005
      return tuQuay || keo || Math.abs(vanToc) > 0.02 || truot || nghieng
    }
    const khung1 = (t) => {
      const dt = lanCuoi ? Math.min((t - lanCuoi) / 1000, 0.05) : 0.016
      lanCuoi = t
      if (!keo) {
        if (trangThai.current.quay) vanToc += (TOC_DO_QUAY - vanToc) * bam(0.06, dt) // bàn xoay lên tốc độ
        else vanToc *= Math.pow(MA_SAT, dt * 60)
      }
      gocQuay -= vanToc * dt
      dia.rotation.y = gocQuay // trục của Cylinder sau khi xoay x là trục nhìn
      const dich = hover && !giam ? viTriRa : viTriNghi
      nhom.position.x += (dich - nhom.position.x) * bam(0.1, dt)
      nghiengX += (dichNghiengX - nghiengX) * bam(0.1, dt); nghiengY += (dichNghiengY - nghiengY) * bam(0.1, dt)
      nhom.rotation.x = NGHIENG_NGHI_X + nghiengX; nhom.rotation.y = NGHIENG_NGHI_Y + nghiengY
      ve()
      if (!dangDong()) { renderer.setAnimationLoop(null); lanCuoi = 0 }
    }
    const chay = () => { if (thayDuoc && !anTab) renderer.setAnimationLoop(khung1) }

    // ---- sự kiện ----
    const xuong = (e) => { keo = { x: e.clientX, t: performance.now() }; vanToc = 0; khung.setPointerCapture?.(e.pointerId); chay() }
    const di = (e) => {
      const r = khung.getBoundingClientRect()
      if (!giam && e.pointerType === 'mouse') {
        dichNghiengY = ((e.clientX - r.left) / r.width - 0.5) * 0.25
        dichNghiengX = ((e.clientY - r.top) / r.height - 0.5) * 0.18
      }
      if (keo) {
        const now = performance.now(); const dx = e.clientX - keo.x; const dtk = Math.max((now - keo.t) / 1000, 0.001)
        const goc = (dx / r.height) * Math.PI * 1.6
        gocQuay -= goc; vanToc = Math.max(-TOC_DO_TOI_DA, Math.min(TOC_DO_TOI_DA, goc / dtk)); keo = { x: e.clientX, t: now }
      }
      chay()
    }
    const len = () => { keo = null; chay() }
    const vao = () => { hover = true; chay() }
    const ra = () => { hover = false; dichNghiengX = 0; dichNghiengY = 0; keo = null; chay() }
    khung.addEventListener('pointerdown', xuong)
    khung.addEventListener('pointermove', di)
    khung.addEventListener('pointerup', len)
    khung.addEventListener('pointercancel', len)
    khung.addEventListener('pointerenter', vao)
    khung.addEventListener('pointerleave', ra)

    const ro = new ResizeObserver(doiCo); ro.observe(khung)
    const io = new IntersectionObserver(([m]) => { thayDuoc = m.isIntersecting; if (thayDuoc) chay(); else renderer.setAnimationLoop(null) })
    io.observe(khung)
    const tab = () => { anTab = document.hidden; if (anTab) renderer.setAnimationLoop(null); else chay() }
    document.addEventListener('visibilitychange', tab)
    trangThai.current.chay = chay

    // Nhãn dùng font của trang: vẽ lại khi font đã tải xong (lần vẽ đầu có thể còn font dự phòng).
    let huy = false
    Promise.all(['400 34px Anton', '600 19px "Be Vietnam Pro"', '400 15px "JetBrains Mono"'].map((f) => document.fonts?.load(f)))
      .then(() => { if (huy) return; tex.image = veMatDia({ ten, phongTra, ngay, soTietMuc, dangDien }); tex.needsUpdate = true; ve() })
      .catch(() => {})

    doiCo(); chay()

    return () => {
      huy = true
      renderer.setAnimationLoop(null)
      ro.disconnect(); io.disconnect(); document.removeEventListener('visibilitychange', tab)
      khung.removeEventListener('pointerdown', xuong); khung.removeEventListener('pointermove', di)
      khung.removeEventListener('pointerup', len); khung.removeEventListener('pointercancel', len)
      khung.removeEventListener('pointerenter', vao); khung.removeEventListener('pointerleave', ra)
      hinh.dispose(); go.geometry.dispose(); matMat.dispose(); matCanh.dispose(); tex.dispose()
      anhDen.geometry.dispose(); matDen.dispose(); texDen.dispose()
      renderer.dispose(); renderer.domElement.remove()
    }
  }, [ten, phongTra, ngay, soTietMuc, dangDien, onKhongHoTro])

  // Bật/tắt quay từ nút ở BiaDia: ghi vào ref (vòng lặp đọc mỗi khung hình) rồi đánh thức vòng lặp.
  useEffect(() => { trangThai.current.quay = quay; trangThai.current.chay?.() }, [quay])

  return <div ref={khungRef} className={`absolute inset-0 touch-pan-y cursor-grab active:cursor-grabbing ${className}`} />
}

export default DiaThanCanvas
