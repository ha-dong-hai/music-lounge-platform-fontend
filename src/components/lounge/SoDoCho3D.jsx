// src/components/lounge/SoDoCho3D.jsx
//
// SƠ ĐỒ CHỖ NGỒI 3D (three.js, tải lười) — dựng từ sơ đồ 2D chủ phòng trà đã xếp ở trang Khu vực chỗ ngồi
// (layout2DX/Y/Width/Height theo % mặt sàn 16:9 như OwnerZonesPage:450, xoay layout2DRotationDeg, màu layoutColor).
//
// BẢN 2 (03/10/2026) — chủ dự án: "mấy cái khu xấu quá… 3D vậy không được". Bản 1 là khối màu bão hoà + cột trụ làm ghế
// (trông như đồ chơi xếp hình). Nay in như MỘT PHÒNG TRÀ THẬT nhìn từ trên xuống (tham khảo sơ đồ nhà hàng isometric —
// icograms.com/templates/1188): mỗi khu là một TẤM THẢM mang màu khu (đã làm dịu), trên đó bàn ghế thật:
//  - khu tên có "bar"/"quầy"                    → quầy bar + ghế cao, mỗi ghế 1 chỗ;
//  - khu tên có "sofa"                          → bàn trà + 2 sofa đối diện, mỗi bộ 6 chỗ;
//  - "hàng"/"khán phòng"/"rạp"                  → hàng ghế quay về phía sân khấu (phía TRÊN sơ đồ), mỗi ghế 1 chỗ;
//  - "đôi"/"cặp"                                → bàn nhỏ + 2 ghế đối diện, mỗi bộ 2 chỗ;
//  - "nhóm"/"tiệc"/"bàn dài"/"gia đình"         → bàn chữ nhật + 8 ghế, mỗi bộ 8 chỗ;
//  - "vip"                                      → bàn trải khăn + 4 ghế bọc + đèn bàn, mỗi bộ 4 chỗ;
//  - còn lại                                    → bàn tròn + 4 ghế nệm, mỗi bộ 4 chỗ.
//  Thứ tự xét như trên (03/10/2026, chủ dự án chọn 4 kiểu mới): "Hàng A–C VIP" ra HÀNG GHẾ, "Khu VIP" ra bàn khăn trải.
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
import { kieuKhu } from '../../utils/kieuKhu3D'

const SAN_RONG = 16, SAN_SAU = 9 // mặt sàn 16:9, khớp khung soạn sơ đồ của chủ phòng trà
const TL = 0.62 // tỉ lệ nội thất Kenney (≈ 1 đơn vị = 1 m) so với mặt sàn sơ đồ
const MAU_MAC_DINH = ['#C9A45C', '#8C7A6B', '#B3A899', '#6E5E50']
const VI_TRI_DAU = new Vector3(0, 9.5, 11.5)
const DUONG_MO_HINH = '/models/noi-that/'
const MO_HINH = ['tableRound', 'chairCushion', 'loungeSofa', 'tableCoffee', 'stoolBar', 'kitchenBar', 'rugRounded',
  'tableCrossCloth', 'chairModernFrameCushion', 'lampRoundTable', 'chairModernCushion', 'table']

// Kiểu khu đoán theo TÊN chủ phòng trà đặt (dữ liệu thật) — không khớp thì bàn tròn.
const KIEU = {
  bar: { moiBo: 1, rong: 0.45, sau: 0.95 },
  sofa: { moiBo: 6, rong: 1.75, sau: 1.45 },
  hang: { moiBo: 1, rong: 0.62, sau: 0.8 },
  doi: { moiBo: 2, rong: 1.0, sau: 1.35 },
  nhom: { moiBo: 8, rong: 2.5, sau: 1.75 },
  vip: { moiBo: 4, rong: 1.6, sau: 1.6 },
  ban: { moiBo: 4, rong: 1.3, sau: 1.3 },
}

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

// diem360: [{ id, ten, x, y }] — cảnh tham quan 360° đã được chủ phòng trà đặt trên mặt bằng (x, y: % như Layout2D).
// In thành GHIM (nút HTML bám theo vị trí 3D, bấm được bằng bàn phím); onChonDiem(id) mở cảnh đó.
// Mặc định phải là MỘT mảng cố định: `diem360 = []` tạo mảng mới mỗi lần vẽ → effect dựng cảnh (phụ thuộc diem360) chạy
// lại vô hạn ("Maximum update depth exceeded" — lộ ra khi chạy đột biến 03/10 với nơi gọi không truyền ghim).
const KHONG_GHIM = []
const SoDoCho3D = ({ zones, chon, onChon, lanDatLai = 0, onKhongHoTro, diem360 = KHONG_GHIM, onChonDiem }) => {
  const khungRef = useRef(null)
  const ref = useRef({})
  const [nhan, setNhan] = useState([])
  const [ghim, setGhim] = useState([])
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
    // Điểm đứng 360° trên sàn (cùng quy đổi % → mặt sàn như khu). Chỉ là toạ độ — hình ghim là nút HTML ở dưới.
    const diemSan = diem360.map((d) => ({ ...d, v: new Vector3((d.x / 100) * SAN_RONG - SAN_RONG / 2, 1.1, (d.y / 100) * SAN_SAU - SAN_SAU / 2) }))
    const veNhan = () => {
      const r = khung.getBoundingClientRect()
      const chieu = (v) => { const p = v.clone().project(camera); return { x: (p.x * 0.5 + 0.5) * r.width, y: (-p.y * 0.5 + 0.5) * r.height, an: p.z > 1 } }
      setNhan(bucs.map((b) => ({ id: b.id, ten: b.ten, ...chieu(b.tam) })))
      setGhim(diemSan.map((d) => ({ id: d.id, ten: d.ten, ...chieu(d.v) })))
    }
    const ve = () => { renderer.render(scene, camera); veNhan() }

    const loader = new GLTFLoader()
    Promise.all(MO_HINH.map((ten) => loader.loadAsync(DUONG_MO_HINH + ten + '.glb').then((g) => [ten, g.scene])))
      .then((ds) => {
        if (huy) return
        // Mô hình Kenney đặt gốc toạ độ ở GÓC, không ở tâm (đo 03/10: bản đầu bàn ghế lệch khỏi thảm) → bọc lại cho tâm
        // đáy nằm ở (0,0,0); mọi phép đặt bên dưới tính theo tâm.
        const kt = {} // kích thước thật của từng mẫu (m, trước khi thu theo TL) — đặt đèn lên đúng mặt bàn
        const goc = Object.fromEntries(ds.map(([ten, s]) => {
          const hop = new Box3().setFromObject(s); const c = hop.getCenter(new Vector3())
          kt[ten] = hop.getSize(new Vector3())
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
          // Ghế quanh bàn: mặt ghế Kenney hướng +z → xoay để quay vào tâm bàn.
          const gheQuanh = (bo, ten, ds) => ds.forEach(([gx, gz]) => {
            const g = tao(ten); g.position.set(gx * TL, 0, gz * TL); g.rotation.y = Math.atan2(-gx, -gz); bo.add(g)
          })
          const soBo = Math.max(1, Math.min(Math.ceil((z.capacity || 1) / k.moiBo), cot * hang))
          const cotDung = Math.min(cot, soBo), hangDung = Math.ceil(soBo / cotDung)
          for (let b = 0; b < soBo; b++) {
            const c = b % cotDung, h = Math.floor(b / cotDung)
            const x = ((c + 0.5) / cotDung - 0.5) * cotDung * k.rong * TL
            const zz = ((h + 0.5) / hangDung - 0.5) * hangDung * k.sau * TL
            const bo = new Group(); bo.position.set(x, 0.01, kieu === 'bar' ? d * 0.08 : zz)
            if (kieu === 'ban') {
              bo.add(tao('tableRound'))
              gheQuanh(bo, 'chairCushion', [[0, -0.55], [0, 0.55], [-0.55, 0], [0.55, 0]])
            } else if (kieu === 'vip') {
              bo.add(tao('tableCrossCloth'))
              const den = tao('lampRoundTable'); den.position.y = (kt.tableCrossCloth?.y ?? 0.75) * TL; bo.add(den)
              gheQuanh(bo, 'chairModernFrameCushion', [[0, -0.62], [0, 0.62], [-0.62, 0], [0.62, 0]])
            } else if (kieu === 'doi') {
              const ban = tao('tableRound'); ban.scale.multiplyScalar(0.75); bo.add(ban)
              gheQuanh(bo, 'chairCushion', [[0, -0.48], [0, 0.48]])
            } else if (kieu === 'nhom') {
              const ban = tao('table'); ban.scale.set(TL * (1.9 / (kt.table?.x || 1)), TL, TL * (0.85 / (kt.table?.z || 1))); bo.add(ban)
              gheQuanh(bo, 'chairCushion', [[-0.65, -0.68], [0, -0.68], [0.65, -0.68], [-0.65, 0.68], [0, 0.68], [0.65, 0.68], [-1.2, 0], [1.2, 0]])
            } else if (kieu === 'hang') {
              // Ghế khán phòng quay về phía trên sơ đồ (sân khấu thường vẽ ở mép trên): mặt ghế +z → xoay 180°.
              const ghe = tao('chairModernCushion'); ghe.rotation.y = Math.PI; bo.add(ghe)
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
          bucs.push({ id: z.id, ten: z.nhan ?? z.name, nhom, thamMat, mauGoc, tam: new Vector3(cx, 0.9, cz) })
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
  }, [zones, onKhongHoTro, diem360])

  useEffect(() => { ref.current.toChon?.(chon) }, [chon])
  useEffect(() => { if (lanDatLai) ref.current.datLai?.() }, [lanDatLai])

  return (
    <div ref={khungRef} className="absolute inset-0 touch-none">
      {/* GHIM 360° — nút thật (Tab tới được), bám theo điểm đứng trên sàn. Bấm = mở Tham quan 360° tại cảnh đó. */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden z-10">
        {ghim.filter((g) => !g.an).map((g) => (
          <button key={g.id} type="button" onClick={() => onChonDiem?.(g.id)} style={{ left: g.x, top: g.y }}
            aria-label={`Xem 360° tại ${g.ten}`}
            className="pointer-events-auto absolute -translate-x-1/2 -translate-y-full inline-flex items-center gap-1 min-h-[44px] px-2 bg-ember text-board text-xs font-bold border-2 border-board shadow-lift hover:bg-lamp focus-visible:outline-lamp">
            <span aria-hidden="true">◉ 360°</span><span className="max-w-[7rem] truncate font-semibold">{g.ten}</span>
          </button>
        ))}
      </div>
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
