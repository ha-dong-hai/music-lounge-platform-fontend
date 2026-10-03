// src/components/lounge/SoDoCho3D.jsx
//
// SƠ ĐỒ CHỖ NGỒI 3D (three.js, tải lười) — dựng từ sơ đồ 2D chủ phòng trà đã xếp ở trang Khu vực chỗ ngồi
// (layout2DX/Y/Width/Height theo % mặt sàn 16:9 như OwnerZonesPage:450, xoay layout2DRotationDeg, màu layoutColor).
//
// BẢN 2 (03/10/2026) — chủ dự án: "mấy cái khu xấu quá… 3D vậy không được". Bản 1 là khối màu bão hoà + cột trụ làm ghế
// (trông như đồ chơi xếp hình). Nay in như MỘT PHÒNG TRÀ THẬT nhìn từ trên xuống (tham khảo sơ đồ nhà hàng isometric —
// icograms.com/templates/1188): mỗi khu là một TẤM THẢM mang màu khu (đã làm dịu), trên đó bàn ghế thật:
//  - khu tên có "bar"  → quầy bar + ghế cao, mỗi ghế 1 chỗ;
//  - khu tên có "sofa" → bàn trà + 2 sofa đối diện, mỗi bộ 6 chỗ;
//  - còn lại           → bàn tròn + 4 ghế nệm, mỗi bộ 4 chỗ.
//  Số bộ = sức chứa ÷ chỗ mỗi bộ, giới hạn bởi số bộ VỪA tấm thảm (không chồng lên nhau). Sức chứa thật luôn in ở danh
//  sách khu bên cạnh — hình là minh hoạ bố cục, không phải đếm từng ghế.
// Nội thất: Kenney Furniture Kit 2.0, CC0 (public/models/noi-that/LICENSE-Kenney-CC0.txt), ~100 KB, ghi đè vật liệu
// theo tên (wood/woodDark/carpet/metal) sang bảng màu DESIGN.md — không giữ màu cam/đỏ đồ chơi của bộ gốc.
// KHÔNG vẽ sân khấu, đèn, chậu cây trang trí: dữ liệu không có vị trí sân khấu — vẽ vào là bịa bố cục phòng trà.
//
// VÌ SAO DỰNG TỪ 2D, KHÔNG TỪ layout3DX/Y/Z: toạ độ 3D của backend là MỘT ĐIỂM đánh dấu cho mô hình 3D phòng trà
// (model3DUrl), không có kích thước khu; Azure 03/10: 0 khu có toạ độ 3D.
//
// TƯƠNG TÁC: kéo xoay, cuộn/chụm phóng to (OrbitControls, không lật xuống dưới sàn); chạm thảm/bàn ghế = chọn khu.
// Danh sách khu ở KhongGianPhongTra là đường tương đương bàn phím — canvas aria-hidden.
// HIỆU NĂNG: chỉ vẽ khi camera đổi / chọn khu; bóng đổ chỉ bật trên máy không phải điện thoại; pixel ratio ≤ 2 (điện
// thoại 1,5); mô hình nạp một lần rồi clone (dùng chung geometry); dispose đủ khi rời.
import { useEffect, useRef, useState } from 'react'
import {
  WebGLRenderer, Scene, PerspectiveCamera, Mesh, Group, BoxGeometry, PlaneGeometry, MeshStandardMaterial,
  AmbientLight, DirectionalLight, HemisphereLight, Raycaster, Vector2, Vector3, Color, CanvasTexture,
  SRGBColorSpace, ACESFilmicToneMapping, RepeatWrapping, PCFSoftShadowMap, Box3,
} from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'

const SAN_RONG = 16, SAN_SAU = 9 // mặt sàn 16:9, khớp khung soạn sơ đồ của chủ phòng trà
const TL = 0.62 // tỉ lệ nội thất Kenney (≈ 1 đơn vị = 1 m) so với mặt sàn sơ đồ
const MAU_MAC_DINH = ['#C9A45C', '#8C7A6B', '#B3A899', '#6E5E50']
const VI_TRI_DAU = new Vector3(0, 9.5, 11.5)
const DUONG_MO_HINH = '/models/noi-that/'
const MO_HINH = ['tableRound', 'chairCushion', 'loungeSofa', 'tableCoffee', 'stoolBar', 'kitchenBar', 'rugRounded']

// Kiểu khu đoán theo TÊN chủ phòng trà đặt (dữ liệu thật) — không khớp thì bàn tròn.
const KIEU = {
  bar: { moiBo: 1, rong: 0.45, sau: 0.95 },
  sofa: { moiBo: 6, rong: 1.75, sau: 1.45 },
  ban: { moiBo: 4, rong: 1.3, sau: 1.3 },
}
const kieuKhu = (ten = '') => (/\bbar\b|quầy/i.test(ten) ? 'bar' : /sofa/i.test(ten) ? 'sofa' : 'ban')

// Sàn gỗ tối: ván dọc, sắc độ lệch nhẹ từng ván (seed cố định theo vị trí — hình không đổi giữa các lần dựng).
const veSan = () => {
  const c = document.createElement('canvas'); c.width = 1024; c.height = 576
  const g = c.getContext('2d'); const VAN = 36
  for (let x = 0, k = 0; x < c.width; x += VAN, k++) {
    const l = 13 + Math.abs(Math.sin(k * 12.9898)) * 5
    g.fillStyle = `hsl(24, 22%, ${l}%)`; g.fillRect(x, 0, VAN, c.height)
    g.fillStyle = 'rgba(0,0,0,0.35)'; g.fillRect(x, 0, 1.5, c.height)
    const noi = (Math.abs(Math.sin(k * 78.233)) * c.height) | 0
    g.fillRect(x, noi, VAN, 1.5)
  }
  return c
}

const SoDoCho3D = ({ zones, chon, onChon, lanDatLai = 0, onKhongHoTro }) => {
  const khungRef = useRef(null)
  const ref = useRef({})
  const [nhan, setNhan] = useState([])
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
    renderer.toneMappingExposure = 1.05
    const bong = !dienThoai
    renderer.shadowMap.enabled = bong
    renderer.shadowMap.type = PCFSoftShadowMap
    renderer.domElement.setAttribute('aria-hidden', 'true')
    renderer.domElement.style.display = 'block'
    khung.prepend(renderer.domElement)

    const scene = new Scene()
    const camera = new PerspectiveCamera(38, 16 / 9, 0.1, 100)
    camera.position.copy(VI_TRI_DAU)
    // Khung nhìn: mặc định cả mặt sàn; dựng xong khu thì thu về VỪA KHÍT cụm khu (Azure 03/10: các khu Ánh Dương chỉ
    // chiếm ~1/3 sàn — nhìn cả sàn thì bàn ghế bé như hạt).
    let vung = { tam: new Vector3(), rong: SAN_RONG, sau: SAN_SAU }
    const HUONG = VI_TRI_DAU.clone().normalize()
    const controls = new OrbitControls(camera, renderer.domElement)
    controls.enableDamping = !giam
    controls.dampingFactor = 0.08
    controls.enablePan = false
    // Phóng to VỀ PHÍA CON TRỎ (03/10): không kéo ngang được nên nếu phóng vào giữa thì khu ở rìa (quầy bar Ánh Dương)
    // không bao giờ xem gần được. Nút "Góc nhìn ban đầu" đưa tâm nhìn về lại.
    controls.zoomToCursor = true
    controls.minDistance = 2.5; controls.maxDistance = 22
    controls.minPolarAngle = 0.15; controls.maxPolarAngle = 1.32
    controls.update()

    // Ánh sáng phòng trà: nền ấm thấp + một đèn chính vàng chiếu xiên (đổ bóng mềm trên máy tính).
    scene.add(new HemisphereLight('#FFE9CC', '#2A1F18', 0.75))
    scene.add(new AmbientLight('#F2EAE0', 0.2))
    const den = new DirectionalLight('#FFD9A8', 2.4)
    den.position.set(-5, 11, 6)
    den.castShadow = bong
    den.shadow.mapSize.set(2048, 2048)
    Object.assign(den.shadow.camera, { left: -10, right: 10, top: 7, bottom: -7, near: 1, far: 30 })
    den.shadow.bias = -0.0005
    scene.add(den)

    const taiNguyen = []
    // Sàn gỗ + viền
    const texSan = new CanvasTexture(veSan()); texSan.colorSpace = SRGBColorSpace; texSan.wrapS = texSan.wrapT = RepeatWrapping
    const sanMat = new MeshStandardMaterial({ map: texSan, roughness: 0.78, metalness: 0 })
    const san = new Mesh(new PlaneGeometry(SAN_RONG, SAN_SAU), sanMat)
    san.rotation.x = -Math.PI / 2; san.receiveShadow = bong; scene.add(san)
    const vienMat = new MeshStandardMaterial({ color: '#5A4232', roughness: 0.6 })
    for (const [w, d, x, z] of [[SAN_RONG + 0.3, 0.15, 0, -SAN_SAU / 2 - 0.07], [SAN_RONG + 0.3, 0.15, 0, SAN_SAU / 2 + 0.07], [0.15, SAN_SAU, -SAN_RONG / 2 - 0.07, 0], [0.15, SAN_SAU, SAN_RONG / 2 + 0.07, 0]]) {
      const g = new BoxGeometry(w, 0.1, d); taiNguyen.push(g)
      const m = new Mesh(g, vienMat); m.position.set(x, 0.05, z); scene.add(m)
    }
    taiNguyen.push(san.geometry, sanMat, vienMat, texSan)

    // Vật liệu nội thất theo tên vật liệu trong GLB Kenney → bảng màu DESIGN.md.
    const VL = {
      wood: new MeshStandardMaterial({ color: '#7A4E33', roughness: 0.62 }),
      woodDark: new MeshStandardMaterial({ color: '#3E2A1E', roughness: 0.6 }),
      carpet: new MeshStandardMaterial({ color: '#E6D9C3', roughness: 0.9 }), // nệm ghế, sofa: màu ngà
      carpetDarker: new MeshStandardMaterial({ color: '#B3A899', roughness: 0.9 }),
      metal: new MeshStandardMaterial({ color: '#A8844E', roughness: 0.35, metalness: 0.6 }), // đồng thau
    }
    taiNguyen.push(...Object.values(VL))

    const bucs = [] // { id, ten, nhom, thamMat, mauGoc, tam }
    let huy = false
    const veNhan = () => {
      const r = khung.getBoundingClientRect()
      setNhan(bucs.map((b) => {
        const p = b.tam.clone().project(camera)
        return { id: b.id, ten: b.ten, x: (p.x * 0.5 + 0.5) * r.width, y: (-p.y * 0.5 + 0.5) * r.height, an: p.z > 1 }
      }))
    }
    const ve = () => { renderer.render(scene, camera); veNhan() }

    const loader = new GLTFLoader()
    Promise.all(MO_HINH.map((ten) => loader.loadAsync(DUONG_MO_HINH + ten + '.glb').then((g) => [ten, g.scene])))
      .then((ds) => {
        if (huy) return
        // Mô hình Kenney đặt gốc toạ độ ở GÓC, không ở tâm (đo 03/10: bản đầu bàn ghế lệch khỏi thảm) → bọc lại cho tâm
        // đáy nằm ở (0,0,0); mọi phép đặt bên dưới tính theo tâm.
        const goc = Object.fromEntries(ds.map(([ten, s]) => {
          const hop = new Box3().setFromObject(s); const c = hop.getCenter(new Vector3())
          s.position.set(-c.x, -hop.min.y, -c.z)
          const boc = new Group(); boc.add(s); return [ten, boc]
        }))
        ds.forEach(([, s]) => s.traverse((m) => { if (m.isMesh) taiNguyen.push(m.geometry, m.material) }))
        const tao = (ten, matRieng) => {
          const o = goc[ten].clone(true)
          o.traverse((m) => {
            if (!m.isMesh) return
            m.material = matRieng?.[m.material.name] ?? VL[m.material.name] ?? m.material
            m.castShadow = bong; m.receiveShadow = bong
          })
          o.scale.setScalar(TL)
          return o
        }

        zones.forEach((z, i) => {
          const w = ((z.layout2DWidth ?? 12) / 100) * SAN_RONG
          const d = ((z.layout2DHeight ?? 12) / 100) * SAN_SAU
          const cx = ((z.layout2DX + (z.layout2DWidth ?? 12) / 2) / 100) * SAN_RONG - SAN_RONG / 2
          const cz = ((z.layout2DY + (z.layout2DHeight ?? 12) / 2) / 100) * SAN_SAU - SAN_SAU / 2
          // Màu khu của chủ phòng trà, giảm bão hoà còn 45% và tối đi: vẫn nhận ra khu (khớp ô màu ở danh sách), không chói.
          const mauGoc = new Color(z.layoutColor || MAU_MAC_DINH[i % MAU_MAC_DINH.length])
          const hsl = mauGoc.getHSL({}); mauGoc.setHSL(hsl.h, hsl.s * 0.45, Math.min(0.4, hsl.l * 0.8))
          const thamMat = new MeshStandardMaterial({ color: mauGoc.clone(), roughness: 0.95, emissive: mauGoc.clone(), emissiveIntensity: 0 })
          const vienTham = new MeshStandardMaterial({ color: mauGoc.clone().multiplyScalar(0.6), roughness: 0.95 })
          taiNguyen.push(thamMat, vienTham)

          const nhom = new Group(); nhom.position.set(cx, 0, cz)
          nhom.rotation.y = -((z.layout2DRotationDeg ?? 0) * Math.PI) / 180
          nhom.userData.id = z.id
          scene.add(nhom)

          // Thảm: rugRounded gốc 1,57 × 0,92 — kéo giãn phủ 96% khu.
          const tham = tao('rugRounded', { carpet: thamMat, carpetDarker: vienTham })
          tham.scale.set((w * 0.96) / 1.57, 1, (d * 0.96) / 0.92)
          nhom.add(tham)

          const kieu = kieuKhu(z.name)
          const k = KIEU[kieu]
          const cot = Math.max(1, Math.floor((w * 0.9) / (k.rong * TL)))
          const hang = kieu === 'bar' ? 1 : Math.max(1, Math.floor((d * 0.9) / (k.sau * TL)))
          const soBo = Math.max(1, Math.min(Math.ceil((z.capacity || 1) / k.moiBo), cot * hang))
          const cotDung = Math.min(cot, soBo), hangDung = Math.ceil(soBo / cotDung)
          for (let b = 0; b < soBo; b++) {
            const c = b % cotDung, h = Math.floor(b / cotDung)
            const x = ((c + 0.5) / cotDung - 0.5) * cotDung * k.rong * TL
            const zz = ((h + 0.5) / hangDung - 0.5) * hangDung * k.sau * TL
            const bo = new Group(); bo.position.set(x, 0.01, kieu === 'bar' ? d * 0.08 : zz)
            if (kieu === 'ban') {
              bo.add(tao('tableRound'))
              for (const [gx, gz] of [[0, -0.55], [0, 0.55], [-0.55, 0], [0.55, 0]]) {
                const ghe = tao('chairCushion'); ghe.position.set(gx * TL, 0, gz * TL)
                ghe.rotation.y = Math.atan2(-gx, -gz) // mặt ghế (+z) quay vào bàn
                bo.add(ghe)
              }
            } else if (kieu === 'sofa') {
              bo.add(tao('tableCoffee'))
              const s1 = tao('loungeSofa'); s1.position.set(0, 0, -0.55 * TL); bo.add(s1)
              const s2 = tao('loungeSofa'); s2.rotation.y = Math.PI; s2.position.set(0, 0, 0.55 * TL); bo.add(s2)
            } else {
              bo.add(tao('stoolBar'))
            }
            nhom.add(bo)
          }
          if (kieu === 'bar') {
            // Quầy bar chạy dọc mép sau khu, ghế cao xếp trước quầy.
            const doan = Math.max(1, Math.round((w * 0.9) / (0.43 * TL)))
            for (let q = 0; q < doan; q++) {
              const quay = tao('kitchenBar')
              quay.position.set(((q + 0.5) / doan - 0.5) * w * 0.9, 0.01, -d * 0.22)
              nhom.add(quay)
            }
          }
          bucs.push({ id: z.id, ten: z.name, nhom, thamMat, mauGoc, tam: new Vector3(cx, 0.9, cz) })
        })
        const hop = new Box3(); bucs.forEach((b) => hop.expandByObject(b.nhom))
        if (!hop.isEmpty()) {
          const kt = hop.getSize(new Vector3())
          vung = { tam: hop.getCenter(new Vector3()).setY(0), rong: kt.x + 1.2, sau: kt.z + 1.2 }
          if (!ref.current.daXoay) datGoc()
        }
        toChon(ref.current.dangChon ?? null)
      })
      .catch(() => { if (!huy) onKhongHoTro?.() })

    const toChon = (id) => {
      ref.current.dangChon = id
      for (const b of bucs) {
        const dang = b.id === id
        b.thamMat.emissive.copy(b.mauGoc)
        b.thamMat.emissiveIntensity = dang ? 0.55 : 0
        b.thamMat.color.copy(b.mauGoc).multiplyScalar(id && !dang ? 0.55 : 1)
        b.nhom.position.y = dang ? 0.06 : 0
      }
      ve()
    }

    let dangKeo = false, dangChay = false
    const vong = () => { const doi = controls.update(); ve(); if (!dangKeo && !doi) { renderer.setAnimationLoop(null); dangChay = false } }
    controls.addEventListener('start', () => { ref.current.daXoay = true; dangKeo = true; dangChay = true; renderer.setAnimationLoop(vong) })
    controls.addEventListener('end', () => { dangKeo = false })
    controls.addEventListener('change', () => { if (!dangChay) ve() })

    // Chạm chọn khu: nhấn-thả không di chuyển (> 5px là kéo xoay). Trúng thảm hoặc bàn ghế đều tính — lần ngược lên nhóm khu.
    const ray = new Raycaster(); const p2 = new Vector2(); let xuong = null
    const khuTrung = (e) => {
      const r = renderer.domElement.getBoundingClientRect()
      p2.set(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1)
      ray.setFromCamera(p2, camera)
      const t = ray.intersectObjects(bucs.map((b) => b.nhom), true)[0]
      let o = t?.object
      while (o && !o.userData.id) o = o.parent
      return o?.userData.id ?? null
    }
    const nhan1 = (e) => { xuong = { x: e.clientX, y: e.clientY } }
    const tha = (e) => {
      if (!xuong || Math.hypot(e.clientX - xuong.x, e.clientY - xuong.y) > 5) { xuong = null; return }
      xuong = null
      ref.current.onChon?.(khuTrung(e))
    }
    const di = (e) => { renderer.domElement.style.cursor = khuTrung(e) ? 'pointer' : 'grab' }
    renderer.domElement.addEventListener('pointerdown', nhan1)
    renderer.domElement.addEventListener('pointerup', tha)
    renderer.domElement.addEventListener('pointermove', di)

    // Đặt camera theo hướng VI_TRI_DAU, lùi vừa đủ để vùng khu lọt khung (ngang theo FOV ngang, sâu theo FOV dọc, +15%).
    const datGoc = () => {
      const tanD = Math.tan((camera.fov * Math.PI) / 360), tanN = tanD * camera.aspect
      const xa = Math.max(vung.rong / 2 / tanN, (vung.sau * 0.8) / 2 / tanD) * 1.15 + 1.5
      controls.target.copy(vung.tam)
      camera.position.copy(vung.tam).addScaledVector(HUONG, Math.min(controls.maxDistance, Math.max(controls.minDistance, xa)))
      controls.update(); ve()
    }
    const doiCo = () => {
      const r = khung.getBoundingClientRect(); if (!r.width || !r.height) return
      renderer.setSize(r.width, r.height, false)
      renderer.domElement.style.width = '100%'; renderer.domElement.style.height = '100%'
      camera.aspect = r.width / r.height
      camera.updateProjectionMatrix()
      if (!ref.current.daXoay) datGoc(); else { controls.update(); ve() }
    }
    const ro = new ResizeObserver(doiCo); ro.observe(khung)

    ref.current.toChon = toChon
    ref.current.datLai = () => { ref.current.daXoay = false; datGoc() }
    doiCo()

    return () => {
      huy = true
      renderer.setAnimationLoop(null); ro.disconnect(); controls.dispose()
      renderer.domElement.removeEventListener('pointerdown', nhan1)
      renderer.domElement.removeEventListener('pointerup', tha)
      renderer.domElement.removeEventListener('pointermove', di)
      for (const t of new Set(taiNguyen)) t.dispose?.()
      renderer.dispose(); renderer.domElement.remove()
    }
  }, [zones, onKhongHoTro])

  useEffect(() => { ref.current.toChon?.(chon) }, [chon])
  useEffect(() => { if (lanDatLai) ref.current.datLai?.() }, [lanDatLai])

  return (
    <div ref={khungRef} className="absolute inset-0 touch-none">
      {/* Nhãn khu: HTML bám theo khu (chữ sắc nét, đúng font trang). aria-hidden — danh sách khu bên cạnh đã có tên. */}
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
