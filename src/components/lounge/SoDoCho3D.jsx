// src/components/lounge/SoDoCho3D.jsx
//
// SƠ ĐỒ CHỖ NGỒI 3D (three.js, tải lười) — dựng NỔI từ sơ đồ 2D chủ phòng trà đã xếp ở trang Khu vực chỗ ngồi
// (layout2DX/Y/Width/Height theo % mặt sàn 16:9 như OwnerZonesPage:450, xoay layout2DRotationDeg, màu layoutColor).
// 03/10/2026 — chủ dự án: khách được tự chọn xem sơ đồ 3D hoặc tour 360° (KhongGianPhongTra).
//
// VÌ SAO DỰNG TỪ 2D, KHÔNG TỪ layout3DX/Y/Z: toạ độ 3D của backend là MỘT ĐIỂM đánh dấu trên mô hình 3D phòng trà
// (model3DUrl — OwnerZonesPage:14 "dùng cho mô hình 3D phòng trà"), không có kích thước khu. Azure 03/10: 0 khu có toạ độ 3D,
// 0 phòng trà có mô hình 3D; còn sơ đồ 2D thì Ánh Dương có đủ 5 khu. Đường nâng cấp: khi có model3DUrl thì nạp mô hình
// và đặt nhãn khu tại layout3D.
//
// DỮ LIỆU THẬT: mỗi khu một bục màu của chủ phòng trà; số ghế trên bục = sức chứa (tối đa SO_GHE_TOI_DA để nhẹ máy —
// vượt thì ghi rõ ở danh sách khu); nhãn tên khu bám theo bục khi xoay.
//
// TƯƠNG TÁC: kéo xoay, cuộn/chụm phóng to (OrbitControls, khoá không cho lật xuống dưới sàn); chạm một bục = chọn khu.
// Danh sách khu dạng nút ở KhongGianPhongTra là đường tương đương cho bàn phím/trình đọc màn hình — canvas aria-hidden.
// HIỆU NĂNG: chỉ vẽ khi camera đổi / chọn khu; ghế vẽ bằng InstancedMesh (một lệnh vẽ mỗi khu); pixel ratio ≤ 2
// (điện thoại 1,5); dispose đủ khi rời. Giảm chuyển động: tắt quán tính (damping) của camera.
import { useEffect, useRef, useState } from 'react'
import {
  WebGLRenderer, Scene, PerspectiveCamera, Mesh, Group, BoxGeometry, CylinderGeometry, PlaneGeometry, MeshStandardMaterial,
  InstancedMesh, Object3D, AmbientLight, DirectionalLight, HemisphereLight, Raycaster, Vector2, Vector3, Color,
  SRGBColorSpace, ACESFilmicToneMapping,
} from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'

const SAN_RONG = 16, SAN_SAU = 9 // mặt sàn 16:9, khớp khung soạn sơ đồ của chủ phòng trà
const CAO_BUC = 0.14
const SO_GHE_TOI_DA = 80
const MAU_MAC_DINH = ['#C9A45C', '#8C7A6B', '#B3A899', '#6E5E50'] // khu chưa chọn màu: các nấc mực/lamp của DESIGN.md
const VI_TRI_DAU = new Vector3(0, 9.5, 11.5)

const SoDoCho3D = ({ zones, chon, onChon, lanDatLai = 0, onKhongHoTro }) => {
  const khungRef = useRef(null)
  const ref = useRef({})
  const [nhan, setNhan] = useState([]) // [{ id, ten, x, y }] — vị trí màn hình của nhãn khu
  useEffect(() => { ref.current.onChon = onChon }, [onChon])

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
    renderer.domElement.setAttribute('aria-hidden', 'true')
    renderer.domElement.style.display = 'block'
    khung.prepend(renderer.domElement) // canvas TRƯỚC lớp nhãn HTML để nhãn nằm trên

    const scene = new Scene()
    const camera = new PerspectiveCamera(38, 16 / 9, 0.1, 100)
    camera.position.copy(VI_TRI_DAU)
    const controls = new OrbitControls(camera, renderer.domElement)
    controls.enableDamping = !giam
    controls.dampingFactor = 0.08
    controls.enablePan = false
    controls.minDistance = 6; controls.maxDistance = 22
    controls.minPolarAngle = 0.15; controls.maxPolarAngle = 1.32 // không lật xuống dưới sàn
    controls.target.set(0, 0, 0); controls.update()

    scene.add(new HemisphereLight('#F2EAE0', '#14110F', 0.55))
    scene.add(new AmbientLight('#F2EAE0', 0.25))
    const den = new DirectionalLight('#FFE2B8', 2.2); den.position.set(-6, 12, 7); scene.add(den)

    // Mặt sàn + viền mực
    const sanMat = new MeshStandardMaterial({ color: '#1F1A16', roughness: 0.95 })
    const san = new Mesh(new PlaneGeometry(SAN_RONG, SAN_SAU), sanMat)
    san.rotation.x = -Math.PI / 2; scene.add(san)
    const vienMat = new MeshStandardMaterial({ color: '#B3A899', roughness: 0.6 })
    const vienHinh = []
    for (const [w, d, x, z] of [[SAN_RONG + 0.2, 0.1, 0, -SAN_SAU / 2 - 0.05], [SAN_RONG + 0.2, 0.1, 0, SAN_SAU / 2 + 0.05], [0.1, SAN_SAU, -SAN_RONG / 2 - 0.05, 0], [0.1, SAN_SAU, SAN_RONG / 2 + 0.05, 0]]) {
      const g = new BoxGeometry(w, 0.06, d); vienHinh.push(g)
      const m = new Mesh(g, vienMat); m.position.set(x, 0.03, z); scene.add(m)
    }

    // Bục + ghế cho từng khu
    const bucs = [] // { id, mesh, mat, tam: Vector3, mau: Color }
    const tam = new Object3D()
    const gheHinh = new CylinderGeometry(0.085, 0.1, 0.16, 12)
    const bucHinh = new BoxGeometry(1, CAO_BUC, 1)
    const taiNguyen = [gheHinh, bucHinh]
    zones.forEach((z, i) => {
      const w = ((z.layout2DWidth ?? 12) / 100) * SAN_RONG
      const d = ((z.layout2DHeight ?? 12) / 100) * SAN_SAU
      const cx = ((z.layout2DX + (z.layout2DWidth ?? 12) / 2) / 100) * SAN_RONG - SAN_RONG / 2
      const cz = ((z.layout2DY + (z.layout2DHeight ?? 12) / 2) / 100) * SAN_SAU - SAN_SAU / 2
      const mau = new Color(z.layoutColor || MAU_MAC_DINH[i % MAU_MAC_DINH.length])
      const nhom = new Group(); nhom.position.set(cx, 0, cz); nhom.rotation.y = -((z.layout2DRotationDeg ?? 0) * Math.PI) / 180
      scene.add(nhom)
      const mat = new MeshStandardMaterial({ color: mau, roughness: 0.55, metalness: 0.05, emissive: mau, emissiveIntensity: 0.08 })
      const buc = new Mesh(bucHinh, mat); buc.scale.set(w, 1, d); buc.position.y = CAO_BUC / 2; buc.userData.id = z.id
      nhom.add(buc)
      // Ghế: lưới vừa khít bục, chừa lề 8%.
      const n = Math.max(1, Math.min(z.capacity || 1, SO_GHE_TOI_DA))
      const cot = Math.max(1, Math.round(Math.sqrt((n * w) / d)))
      const hang = Math.ceil(n / cot)
      const gheMat = new MeshStandardMaterial({ color: mau.clone().lerp(new Color('#F2EAE0'), 0.55), roughness: 0.5 })
      const ghe = new InstancedMesh(gheHinh, gheMat, n)
      for (let k = 0; k < n; k++) {
        const c = k % cot, h = Math.floor(k / cot)
        tam.position.set(((c + 0.5) / cot - 0.5) * w * 0.84, CAO_BUC + 0.08, ((h + 0.5) / hang - 0.5) * d * 0.84)
        tam.updateMatrix(); ghe.setMatrixAt(k, tam.matrix)
      }
      ghe.userData.id = z.id
      nhom.add(ghe)
      taiNguyen.push(mat, gheMat, ghe)
      bucs.push({ id: z.id, ten: z.name, buc, ghe, mat, nhom, tam: new Vector3(cx, CAO_BUC + 0.6, cz), mau })
    })

    const veNhan = () => {
      const r = khung.getBoundingClientRect()
      setNhan(bucs.map((b) => {
        const p = b.tam.clone().project(camera)
        return { id: b.id, ten: b.ten, x: (p.x * 0.5 + 0.5) * r.width, y: (-p.y * 0.5 + 0.5) * r.height, an: p.z > 1 }
      }))
    }
    const ve = () => { renderer.render(scene, camera); veNhan() }

    const toChon = (id) => {
      for (const b of bucs) {
        const dang = b.id === id
        b.mat.emissiveIntensity = dang ? 0.55 : id ? 0.02 : 0.08
        b.nhom.position.y = dang ? 0.12 : 0
      }
      ve()
    }

    // Vòng vẽ: chỉ chạy khi camera đang đổi (kéo hoặc quán tính còn trôi).
    let dangKeo = false, dangChay = false
    const vong = () => { const doi = controls.update(); ve(); if (!dangKeo && !doi) { renderer.setAnimationLoop(null); dangChay = false } }
    controls.addEventListener('start', () => { dangKeo = true; dangChay = true; renderer.setAnimationLoop(vong) })
    controls.addEventListener('end', () => { dangKeo = false })
    controls.addEventListener('change', () => { if (!dangChay) ve() })

    // Chạm chọn khu: nhấn-thả không di chuyển (> 5px là kéo xoay).
    const ray = new Raycaster(); const p2 = new Vector2(); let xuong = null
    const nhan1 = (e) => { xuong = { x: e.clientX, y: e.clientY } }
    const tha = (e) => {
      if (!xuong || Math.hypot(e.clientX - xuong.x, e.clientY - xuong.y) > 5) { xuong = null; return }
      xuong = null
      const r = renderer.domElement.getBoundingClientRect()
      p2.set(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1)
      ray.setFromCamera(p2, camera)
      const trung = ray.intersectObjects(bucs.flatMap((b) => [b.buc, b.ghe]), false)[0]
      ref.current.onChon?.(trung ? trung.object.userData.id : null)
    }
    const di = (e) => {
      const r = renderer.domElement.getBoundingClientRect()
      p2.set(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1)
      ray.setFromCamera(p2, camera)
      renderer.domElement.style.cursor = ray.intersectObjects(bucs.map((b) => b.buc), false).length ? 'pointer' : 'grab'
    }
    renderer.domElement.addEventListener('pointerdown', nhan1)
    renderer.domElement.addEventListener('pointerup', tha)
    renderer.domElement.addEventListener('pointermove', di)

    const doiCo = () => {
      const r = khung.getBoundingClientRect(); if (!r.width || !r.height) return
      renderer.setSize(r.width, r.height, false)
      renderer.domElement.style.width = '100%'; renderer.domElement.style.height = '100%'
      camera.aspect = r.width / r.height
      // Màn dọc (điện thoại): lùi camera để cả mặt sàn 16 đơn vị vẫn lọt khung.
      camera.position.setLength(VI_TRI_DAU.length() * Math.max(1, 1.3 / camera.aspect))
      camera.updateProjectionMatrix(); controls.update(); ve()
    }
    const ro = new ResizeObserver(doiCo); ro.observe(khung)

    ref.current.toChon = toChon
    ref.current.datLai = () => { camera.position.copy(VI_TRI_DAU); controls.target.set(0, 0, 0); doiCo() }
    doiCo()

    return () => {
      renderer.setAnimationLoop(null); ro.disconnect(); controls.dispose()
      renderer.domElement.removeEventListener('pointerdown', nhan1)
      renderer.domElement.removeEventListener('pointerup', tha)
      renderer.domElement.removeEventListener('pointermove', di)
      for (const t of taiNguyen) t.dispose?.()
      san.geometry.dispose(); sanMat.dispose(); vienMat.dispose(); vienHinh.forEach((g) => g.dispose())
      renderer.dispose(); renderer.domElement.remove()
    }
  }, [zones, onKhongHoTro])

  useEffect(() => { ref.current.toChon?.(chon) }, [chon])
  useEffect(() => { if (lanDatLai) ref.current.datLai?.() }, [lanDatLai])

  return (
    <div ref={khungRef} className="absolute inset-0 touch-none">
      {/* Nhãn khu: HTML bám theo bục (chữ sắc nét, đúng font trang). aria-hidden — danh sách khu bên cạnh đã có tên. */}
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 overflow-hidden">
        {nhan.filter((n) => !n.an).map((n) => (
          <span key={n.id} style={{ left: n.x, top: n.y }}
            className={`absolute -translate-x-1/2 -translate-y-full max-w-[9rem] truncate px-2 py-0.5 text-xs font-semibold ${n.id === chon ? 'bg-lamp text-board' : 'bg-board/80 text-lamp'}`}>
            {n.ten}
          </span>
        ))}
      </div>
    </div>
  )
}

export default SoDoCho3D
