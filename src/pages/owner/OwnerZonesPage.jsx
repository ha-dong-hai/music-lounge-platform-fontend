// src/pages/owner/OwnerZonesPage.jsx
//
// GHI CHÚ CHO ĐỘI FE:
// - Khu vực là không gian vật lý trong phòng trà (sân khấu, tầng trên, ban công...). HẠNG VÉ trỏ tới
//   khu vực qua ZoneId, nên phải đặt khu vực TRƯỚC rồi mới tạo hạng vé gắn vào. Không có khu vực thì
//   không bán được vé theo chỗ.
// - "Xoá" khu vực thực chất là NGỪNG HOẠT ĐỘNG: vé đã bán còn tham chiếu tới khu vực đó, xoá thật là
//   làm hỏng vé cũ. Vì vậy nút ghi rõ là ngừng hoạt động.
// - Sơ đồ 2D: toạ độ và kích thước backend lưu là SỐ THỰC theo đơn vị của sơ đồ, không phải pixel.
//   Màn này quy đổi 1 đơn vị = 1% chiều rộng khung, nên sơ đồ tự co giãn theo kích thước màn hình
//   mà vị trí tương đối không đổi. Đổi quy ước này thì phải đổi cả chỗ đọc (ShowMap của khán giả).
// - Kéo để đặt vị trí, nhưng CHỈ lưu khi bấm Lưu sơ đồ — kéo tới đâu gọi API tới đó sẽ bắn hàng chục
//   request và khiến sơ đồ nhảy khi mạng chậm.
// - TOẠ ĐỘ 3D là endpoint RIÊNG (layout-3d) và không liên quan gì tới sơ đồ 2D: nó dùng cho mô hình
//   3D phòng trà, còn 2D dùng cho sơ đồ chọn chỗ của khán giả. Lưu 2D KHÔNG ghi 3D và ngược lại.
// - Backend BẮT X/Y/Z PHẢI CÙNG CÓ GIÁ TRỊ HOẶC CÙNG TRỐNG (trống cả ba = xoá vị trí 3D). Điền hai
//   ô rồi bỏ trống ô thứ ba là bị từ chối — cố tình như vậy để không lưu dữ liệu nửa vời.
import { useState, useEffect, useCallback, useRef } from 'react'
import { Loader2, Plus, Pencil, Ban, X, LayoutGrid, Save, Image as ImageIcon, Box, Eraser, PenTool, Undo2 } from 'lucide-react'
import toast from 'react-hot-toast'
import {
  getLounges, getLoungeZones, createZone, updateZone, deactivateZone,
  setZoneLayout2D, setZoneLayout3D, setAreaLayoutImage, getLoungeDetail,
} from '../../services/loungeServices'
import { uploadImage } from '../../services/userServices'
import ConfirmModal from '../../components/shared/ConfirmModal'
import ZoneSketchLayer from '../../components/owner/ZoneSketchLayer'

const inputCls = 'mt-1 w-full px-3 py-2 bg-page border border-line rounded-lg text-sm text-ink focus:outline-none focus:border-brand/50'

// Màu mặc định cho khu vực mới — lấy từ bảng màu đã kiểm của biểu đồ, vẫn thấy rõ cả khi tô mờ trên nền sáng.
const MAU_MAC_DINH = ['#3987e5', '#d95926', '#199e70', '#c98500', '#9085e9', '#d55181']

const ZoneFormModal = ({ initial, loungeId, onClose, onSaved }) => {
  const isEdit = !!initial
  const [form, setForm] = useState({
    name: initial?.name ?? '',
    description: initial?.description ?? '',
    capacity: initial?.capacity ?? '',
  })
  const [isBusy, setIsBusy] = useState(false)
  const set = (k, v) => setForm((p) => ({ ...p, [k]: v }))

  const submit = async (e) => {
    e.preventDefault()
    if (!form.name.trim() || form.capacity === '') {
      toast.error('Cần nhập tên khu vực và sức chứa.')
      return
    }
    setIsBusy(true)
    try {
      const payload = {
        name: form.name.trim(),
        description: form.description.trim() || null,
        capacity: Number(form.capacity),
      }
      if (isEdit) await updateZone(initial.id, payload)
      else await createZone(loungeId, payload)
      toast.success(isEdit ? 'Đã lưu khu vực.' : 'Đã thêm khu vực.')
      onSaved(); onClose()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Không lưu được khu vực.')
    } finally { setIsBusy(false) }
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-espresso/80 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-card border border-line rounded-2xl w-full max-w-md shadow-2xl">
        <div className="flex justify-between items-center p-5 border-b border-line">
          <h2 className="text-lg font-bold text-ink">{isEdit ? 'Sửa khu vực' : 'Thêm khu vực'}</h2>
          <button onClick={onClose} className="p-2 hover:bg-sunken rounded-full text-ink-soft"><X size={20} /></button>
        </div>
        <form onSubmit={submit} className="p-5 space-y-4">
          <div>
            <label className="text-xs text-ink-mute">Tên khu vực <span className="text-danger">*</span></label>
            <input value={form.name} onChange={(e) => set('name', e.target.value)} className={inputCls} placeholder="VD: Khu sân khấu" />
          </div>
          <div>
            <label className="text-xs text-ink-mute">Mô tả</label>
            <textarea value={form.description} onChange={(e) => set('description', e.target.value)} rows={2} className={`${inputCls} resize-none`} />
          </div>
          <div>
            <label className="text-xs text-ink-mute">Sức chứa <span className="text-danger">*</span></label>
            <input type="number" min="0" step="1" value={form.capacity} onChange={(e) => set('capacity', e.target.value)} className={inputCls} />
            <p className="text-xs text-ink-mute mt-1">Số chỗ tối đa của khu vực này.</p>
          </div>
          <button type="submit" disabled={isBusy}
            className="w-full py-2.5 bg-brand text-on-brand rounded-lg font-bold flex items-center justify-center gap-2 disabled:opacity-50">
            {isBusy && <Loader2 size={16} className="animate-spin" />} Lưu
          </button>
        </form>
      </div>
    </div>
  )
}

const OwnerZonesPage = () => {
  const [lounge, setLounge] = useState(null)
  const [zones, setZones] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [editing, setEditing] = useState(undefined)
  const [ngungTarget, setNgungTarget] = useState(null)
  const [isBusy, setIsBusy] = useState(false)

  // Sơ đồ 2D: giữ bản nháp trong state, chỉ gửi lên khi bấm Lưu sơ đồ.
  const [layout, setLayout] = useState({}) // { [zoneId]: {x,y,width,height,rotationDeg,color} }
  const [layout3D, setLayout3D] = useState({}) // { [zoneId]: {x,y,z} } — chuỗi, '' = chưa điền
  const [busy3D, setBusy3D] = useState(null)
  const [isSavingLayout, setIsSavingLayout] = useState(false)
  const [isUploadingBg, setIsUploadingBg] = useState(false)
  const keoRef = useRef(null) // { zoneId, offsetX, offsetY }
  const khungRef = useRef(null)

  // VẼ PHÁC: chủ vẽ tay một nét, hệ thống chỉnh thành hình chuẩn (src/utils/shapeRecognizer.js).
  const [veMode, setVeMode] = useState(false)
  const [veZoneId, setVeZoneId] = useState('')
  const [hutLuoi, setHutLuoi] = useState(true)
  const [coHoanTac, setCoHoanTac] = useState(false)
  const hoanTacRef = useRef(null) // { zoneId, truoc } — trạng thái khu vực ngay trước lần vẽ gần nhất

  const load = useCallback(async () => {
    setIsLoading(true)
    try {
      const res = await getLounges({ mine: true })
      const ds = res.success ? (Array.isArray(res.data) ? res.data : res.data?.items) : null
      const cuaToi = ds?.[0] ?? null
      if (!cuaToi) { setLounge(null); return }

      const [chiTiet, zRes] = await Promise.allSettled([
        getLoungeDetail(cuaToi.id),
        getLoungeZones(cuaToi.id, false), // false = lấy cả khu vực đã ngừng, để chủ còn thấy
      ])
      setLounge(chiTiet.status === 'fulfilled' && chiTiet.value?.success ? chiTiet.value.data : cuaToi)

      const dsZone = zRes.status === 'fulfilled' && zRes.value?.success ? (zRes.value.data ?? []) : []
      setZones(dsZone)
      // Nạp bản nháp sơ đồ từ giá trị đang lưu; khu vực chưa có vị trí thì xếp tạm thành hàng.
      const nhap = {}
      dsZone.forEach((z, i) => {
        nhap[z.id] = {
          x: z.layout2DX ?? 5 + (i % 4) * 24,
          y: z.layout2DY ?? 5 + Math.floor(i / 4) * 24,
          width: z.layout2DWidth ?? 20,
          height: z.layout2DHeight ?? 18,
          rotationDeg: z.layout2DRotationDeg ?? 0,
          color: z.layoutColor ?? MAU_MAC_DINH[i % MAU_MAC_DINH.length],
        }
      })
      setLayout(nhap)

      // Toạ độ 3D nạp riêng, KHÔNG có giá trị mặc định: chưa đặt thì để trống thật, vì backend
      // phân biệt "chưa đặt vị trí 3D" với "đặt ở gốc toạ độ 0,0,0".
      const nhap3D = {}
      dsZone.forEach((z) => {
        nhap3D[z.id] = {
          x: z.layout3DX ?? '',
          y: z.layout3DY ?? '',
          z: z.layout3DZ ?? '',
        }
      })
      setLayout3D(nhap3D)
    } catch (err) {
      toast.error(err.response?.data?.message || 'Không tải được khu vực.')
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => { const chay = async () => { await load() }; chay() }, [load])

  const xacNhanNgung = async () => {
    setIsBusy(true)
    try {
      await deactivateZone(ngungTarget.id)
      toast.success('Đã ngừng hoạt động khu vực.')
      setNgungTarget(null)
      await load()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Không ngừng được khu vực.')
    } finally { setIsBusy(false) }
  }

  // --- kéo thả trên sơ đồ ---
  const batDauKeo = (e, zoneId) => {
    const khung = khungRef.current?.getBoundingClientRect()
    if (!khung) return
    const o = layout[zoneId]
    keoRef.current = {
      zoneId,
      offsetX: ((e.clientX - khung.left) / khung.width) * 100 - o.x,
      offsetY: ((e.clientY - khung.top) / khung.height) * 100 - o.y,
    }
  }

  const dangKeo = (e) => {
    const keo = keoRef.current
    const khung = khungRef.current?.getBoundingClientRect()
    if (!keo || !khung) return
    const x = ((e.clientX - khung.left) / khung.width) * 100 - keo.offsetX
    const y = ((e.clientY - khung.top) / khung.height) * 100 - keo.offsetY
    setLayout((p) => ({
      ...p,
      [keo.zoneId]: {
        ...p[keo.zoneId],
        // Giữ khối nằm trong khung, tính cả kích thước của nó.
        x: Math.max(0, Math.min(100 - p[keo.zoneId].width, x)),
        y: Math.max(0, Math.min(100 - p[keo.zoneId].height, y)),
      },
    }))
  }

  const ketThucKeo = () => { keoRef.current = null }

  const doiKichThuoc = (zoneId, key, value) => {
    setLayout((p) => ({ ...p, [zoneId]: { ...p[zoneId], [key]: Number(value) } }))
  }

  // Toạ độ 3D giữ riêng khỏi `layout` (2D) vì hai endpoint khác nhau, lưu độc lập.
  // Chuỗi rỗng = chưa điền; chỉ gửi khi ĐỦ cả ba, hoặc gửi cả ba null để xoá.
  const doiToaDo3D = (zoneId, truc, value) => {
    setLayout3D((p) => ({ ...p, [zoneId]: { ...(p[zoneId] ?? {}), [truc]: value } }))
  }

  const luuToaDo3D = async (zoneId) => {
    const o = layout3D[zoneId] ?? {}
    const so = (v) => (v === '' || v == null ? null : Number(v))
    const [x, y, z] = [so(o.x), so(o.y), so(o.z)]
    const soOTrong = [x, y, z].filter((v) => v === null).length
    if (soOTrong !== 0 && soOTrong !== 3) {
      toast.error('X, Y, Z phải điền đủ cả ba, hoặc để trống cả ba để xoá vị trí 3D.')
      return
    }
    setBusy3D(zoneId)
    try {
      await setZoneLayout3D(lounge.id, zoneId, { x, y, z })
      toast.success(soOTrong === 3 ? 'Đã xoá vị trí 3D.' : 'Đã lưu vị trí 3D.')
      await load()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Không lưu được vị trí 3D.')
    } finally { setBusy3D(null) }
  }

  const luuSoDo = async () => {
    setIsSavingLayout(true)
    try {
      // Gửi tuần tự từng khu vực: backend có một endpoint cho mỗi khu vực, không có endpoint gộp.
      for (const z of zones.filter((x) => x.isActive)) {
        const o = layout[z.id]
        if (!o) continue
        await setZoneLayout2D(lounge.id, z.id, o)
      }
      toast.success('Đã lưu sơ đồ 2D.')
      await load()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Không lưu được sơ đồ.')
    } finally {
      setIsSavingLayout(false)
    }
  }

  const taiAnhNen = async (file) => {
    if (!file) return
    setIsUploadingBg(true)
    try {
      const up = await uploadImage(file)
      if (!up.success) throw new Error(up.message)
      await setAreaLayoutImage(lounge.id, up.data?.url ?? up.data)
      toast.success('Đã đặt ảnh sơ đồ mặt bằng làm nền.')
      await load()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Không tải được ảnh nền.')
    } finally { setIsUploadingBg(false) }
  }

  const boAnhNen = async () => {
    setIsUploadingBg(true)
    try {
      await setAreaLayoutImage(lounge.id, null)
      toast.success('Đã bỏ ảnh nền.')
      await load()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Không bỏ được ảnh nền.')
    } finally { setIsUploadingBg(false) }
  }

  // --- vẽ phác ---
  // Backend chỉ lưu khu vực dạng HÌNH CHỮ NHẬT (x, y, width, height, rotationDeg — theo % khung). Vẽ tròn
  // hay đa giác vẫn nhận diện được, nhưng lưu lại chỉ là khung chữ nhật bao quanh — và nói rõ điều đó
  // với người dùng thay vì để họ tưởng hình tròn đã được lưu.
  const apDungHinhVe = (shape, khung) => {
    if (!veZoneId || !layout[veZoneId]) return
    let cx, cy, w, h, rot = 0, ghiChu = null
    if (shape.type === 'rect') {
      ;({ x: cx, y: cy, width: w, height: h, rotation: rot } = shape)
    } else if (shape.type === 'ellipse') {
      cx = shape.cx; cy = shape.cy; w = shape.rx * 2; h = shape.ry * 2
      ghiChu = 'Hệ thống hiện chỉ lưu khu vực dạng chữ nhật, nên đã lấy khung chữ nhật bao quanh hình tròn.'
    } else if (shape.type === 'polygon') {
      const xs = shape.points.map((q) => q[0])
      const ys = shape.points.map((q) => q[1])
      w = Math.max(...xs) - Math.min(...xs)
      h = Math.max(...ys) - Math.min(...ys)
      cx = Math.min(...xs) + w / 2
      cy = Math.min(...ys) + h / 2
      ghiChu = 'Hệ thống hiện chỉ lưu khu vực dạng chữ nhật, nên đã lấy khung chữ nhật bao quanh hình vừa vẽ.'
    } else {
      toast.error('Đường thẳng không dùng làm khu vực được. Hãy vẽ một hình khép kín.')
      return
    }
    const lam = (v) => (hutLuoi ? Math.round(v / 2.5) * 2.5 : Math.round(v * 10) / 10)
    const width = Math.min(100, Math.max(5, lam((w / khung.width) * 100)))
    const height = Math.min(100, Math.max(5, lam((h / khung.height) * 100)))
    const x = Math.max(0, Math.min(100 - width, lam(((cx - w / 2) / khung.width) * 100)))
    const y = Math.max(0, Math.min(100 - height, lam(((cy - h / 2) / khung.height) * 100)))

    hoanTacRef.current = { zoneId: veZoneId, truoc: layout[veZoneId] }
    setCoHoanTac(true)
    setLayout((p) => ({ ...p, [veZoneId]: { ...p[veZoneId], x, y, width, height, rotationDeg: rot } }))
    toast.success(rot ? `Đã chỉnh thành hình chữ nhật, xoay ${rot}°.` : 'Đã chỉnh thành hình chữ nhật chuẩn.')
    if (ghiChu) toast(ghiChu, { duration: 6000 })
  }

  const hoanTacVe = () => {
    const h = hoanTacRef.current
    if (!h) return
    setLayout((p) => ({ ...p, [h.zoneId]: h.truoc }))
    hoanTacRef.current = null
    setCoHoanTac(false)
  }

  const batTatVe = () => {
    setVeMode((v) => {
      const bat = !v
      if (bat && !veZoneId) {
        const dau = zones.find((z) => z.isActive)
        if (dau) setVeZoneId(String(dau.id))
      }
      return bat
    })
  }

  if (isLoading) {
    return <div className="py-20 flex justify-center"><Loader2 size={32} className="animate-spin text-brand-text" /></div>
  }

  if (!lounge) {
    return (
      <div className="max-w-2xl">
        <h1 className="text-2xl font-bold text-ink mb-1">Khu vực chỗ ngồi</h1>
        <div className="mt-4 bg-card border border-line rounded-xl p-6">
          <p className="text-sm text-ink-soft">Hãy tạo hồ sơ phòng trà trước — khu vực thuộc về phòng trà.</p>
        </div>
      </div>
    )
  }

  const dangHoatDong = zones.filter((z) => z.isActive)
  const daNgung = zones.filter((z) => !z.isActive)

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-ink mb-1">Khu vực chỗ ngồi</h1>
          <p className="text-ink-soft text-sm leading-relaxed">
            Đặt khu vực trước, rồi tạo hạng vé gắn vào từng khu vực. Khán giả xem sơ đồ này khi chọn chỗ.
          </p>
        </div>
        <button onClick={() => setEditing(null)}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-brand text-on-brand rounded-lg text-xs font-bold hover:bg-brand-hover">
          <Plus size={14} /> Thêm khu vực
        </button>
      </div>

      {dangHoatDong.length === 0 ? (
        <div className="bg-card border border-line rounded-xl p-10 text-center">
          <LayoutGrid size={28} className="mx-auto mb-3 text-ink-mute" />
          <p className="text-sm text-ink-mute">Chưa có khu vực nào. Thêm khu vực để bắt đầu bán vé theo chỗ.</p>
        </div>
      ) : (
        <>
          {/* === SƠ ĐỒ 2D === */}
          <div className="bg-card border border-line rounded-xl p-6">
            <div className="flex flex-wrap items-start justify-between gap-3 mb-4">
              <div>
                <h2 className="text-base font-semibold text-ink">Sơ đồ 2D</h2>
                <p className="text-xs text-ink-mute mt-0.5 leading-relaxed">
                  Kéo từng khối để đặt vị trí, hoặc bấm Vẽ phác rồi vẽ tay hình khu vực — hệ thống tự chỉnh thành hình chuẩn. Chỉ lưu khi bấm nút — kéo tới đâu lưu tới đó sẽ làm sơ đồ nhảy khi mạng chậm.
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                <label className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-line text-ink-soft text-xs font-bold hover:bg-sunken cursor-pointer">
                  {isUploadingBg ? <Loader2 size={13} className="animate-spin" /> : <ImageIcon size={13} />}
                  {lounge.areaLayoutImageUrl ? 'Đổi ảnh nền' : 'Ảnh mặt bằng'}
                  <input type="file" accept="image/*" className="hidden" disabled={isUploadingBg}
                    onChange={(e) => taiAnhNen(e.target.files?.[0])} />
                </label>
                {lounge.areaLayoutImageUrl && (
                  <button onClick={boAnhNen} disabled={isUploadingBg}
                    className="px-3 py-1.5 rounded-lg border border-line text-ink-soft text-xs font-bold hover:bg-sunken disabled:opacity-50">
                    Bỏ ảnh nền
                  </button>
                )}
                <button onClick={batTatVe} aria-pressed={veMode}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-bold transition-colors ${veMode ? 'bg-espresso text-cream border-espresso' : 'border-line text-ink-soft hover:bg-sunken'}`}>
                  <PenTool size={13} /> {veMode ? 'Đang vẽ phác' : 'Vẽ phác'}
                </button>
                <button onClick={luuSoDo} disabled={isSavingLayout}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-brand text-on-brand text-xs font-bold hover:bg-brand-hover disabled:opacity-50">
                  {isSavingLayout ? <Loader2 size={13} className="animate-spin" /> : <Save size={13} />} Lưu sơ đồ
                </button>
              </div>
            </div>

            {veMode && (
              <div className="flex flex-wrap items-center gap-3 mb-3 px-3 py-2.5 rounded-lg bg-sunken/70 border border-line text-xs text-ink-soft">
                <label className="flex items-center gap-2">
                  <span className="font-semibold text-ink">Vẽ cho khu vực</span>
                  <select value={veZoneId} onChange={(e) => setVeZoneId(e.target.value)}
                    className="px-2 py-1 rounded-md border border-line bg-card text-ink text-xs">
                    {dangHoatDong.map((z) => <option key={z.id} value={z.id}>{z.name}</option>)}
                  </select>
                </label>
                <label className="flex items-center gap-1.5 cursor-pointer">
                  <input type="checkbox" checked={hutLuoi} onChange={(e) => setHutLuoi(e.target.checked)} />
                  Hút vào lưới
                </label>
                {coHoanTac && (
                  <button onClick={hoanTacVe}
                    className="inline-flex items-center gap-1 px-2 py-1 rounded-md border border-line bg-card text-ink font-semibold hover:bg-page">
                    <Undo2 size={12} /> Hoàn tác
                  </button>
                )}
                <span className="text-ink-mute">Vẽ một nét liền, khép kín (ví dụ một ô vuông). Thả tay ra là hệ thống chỉnh lại.</span>
              </div>
            )}

            <div
              ref={khungRef}
              onMouseMove={dangKeo}
              onMouseUp={ketThucKeo}
              onMouseLeave={ketThucKeo}
              className="relative w-full aspect-[16/9] rounded-lg border border-line bg-page overflow-hidden select-none"
              style={lounge.areaLayoutImageUrl
                ? { backgroundImage: `url(${lounge.areaLayoutImageUrl})`, backgroundSize: 'cover', backgroundPosition: 'center' }
                : undefined}
            >
              {dangHoatDong.map((z) => {
                const o = layout[z.id]
                if (!o) return null
                return (
                  <div
                    key={z.id}
                    onMouseDown={(e) => batDauKeo(e, z.id)}
                    className="absolute flex items-center justify-center rounded-md cursor-move border-2 text-xs font-bold text-ink text-center px-1 overflow-hidden"
                    style={{
                      left: `${o.x}%`, top: `${o.y}%`,
                      width: `${o.width}%`, height: `${o.height}%`,
                      transform: `rotate(${o.rotationDeg}deg)`,
                      backgroundColor: `${o.color}33`,
                      borderColor: o.color,
                    }}
                    title={`${z.name} · ${z.capacity} chỗ`}
                  >
                    <span className="truncate">{z.name}</span>
                  </div>
                )
              })}
              <ZoneSketchLayer
                enabled={veMode && !!veZoneId}
                frameRef={khungRef}
                onRecognized={apDungHinhVe}
                onRejected={() => toast.error('Chưa nhận ra hình. Hãy vẽ một nét liền và khép kín, ví dụ một ô vuông.')}
              />
            </div>
          </div>

          {/* === DANH SÁCH KHU VỰC === */}
          <div className="bg-card border border-line rounded-xl p-6">
            <h2 className="text-base font-semibold text-ink mb-4">Danh sách khu vực</h2>
            <ul className="space-y-3">
              {dangHoatDong.map((z) => {
                const o = layout[z.id] ?? {}
                return (
                  <li key={z.id} className="bg-sunken/70 border border-line rounded-lg p-4">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div className="flex items-start gap-3 min-w-0">
                        <span className="w-4 h-4 rounded-sm mt-0.5 flex-shrink-0" style={{ backgroundColor: o.color }} />
                        <div className="min-w-0">
                          <p className="text-ink font-medium">{z.name}</p>
                          <p className="text-xs text-ink-mute mt-0.5">{z.capacity} chỗ</p>
                          {z.description && <p className="text-xs text-ink-mute mt-0.5">{z.description}</p>}
                        </div>
                      </div>
                      <div className="flex gap-2 flex-shrink-0">
                        <button onClick={() => setEditing(z)}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-line text-ink-soft text-xs font-bold hover:bg-sunken">
                          <Pencil size={13} /> Sửa
                        </button>
                        <button onClick={() => setNgungTarget(z)}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-line text-danger text-xs font-bold hover:bg-red-500/10">
                          <Ban size={13} /> Ngừng
                        </button>
                      </div>
                    </div>

                    {/* Kích thước và góc quay nhập bằng số, vì kéo chỉ đặt được vị trí */}
                    <div className="mt-3 grid grid-cols-2 sm:grid-cols-4 gap-3">
                      {[['width', 'Rộng (%)'], ['height', 'Cao (%)'], ['rotationDeg', 'Góc quay (°)']].map(([key, label]) => (
                        <div key={key}>
                          <label className="text-xs text-ink-mute">{label}</label>
                          <input type="number" value={o[key] ?? 0}
                            onChange={(e) => doiKichThuoc(z.id, key, e.target.value)}
                            className="mt-1 w-full px-2 py-1.5 bg-page border border-line rounded-md text-xs text-ink focus:outline-none focus:border-brand/50 tabular-nums" />
                        </div>
                      ))}
                      <div>
                        <label className="text-xs text-ink-mute">Màu</label>
                        <input type="color" value={o.color ?? '#3987e5'}
                          onChange={(e) => setLayout((p) => ({ ...p, [z.id]: { ...p[z.id], color: e.target.value } }))}
                          className="mt-1 w-full h-[30px] bg-page border border-line rounded-md cursor-pointer" />
                      </div>
                    </div>

                    {/* VỊ TRÍ 3D — endpoint riêng, lưu riêng từng khu vực, không đi cùng nút Lưu sơ đồ 2D */}
                    <div className="mt-3 pt-3 border-t border-line">
                      <p className="text-xs text-ink-mute flex items-center gap-1.5">
                        <Box size={12} /> Vị trí trong mô hình 3D
                        <span className="text-ink-mute">— dùng cho mô hình 3D, không phải sơ đồ chọn chỗ</span>
                      </p>
                      <div className="mt-2 flex flex-wrap items-end gap-2">
                        {['x', 'y', 'z'].map((truc) => (
                          <div key={truc} className="w-20">
                            <label className="text-xs text-ink-mute uppercase">{truc}</label>
                            <input type="number" step="any"
                              value={(layout3D[z.id] ?? {})[truc] ?? ''}
                              onChange={(e) => doiToaDo3D(z.id, truc, e.target.value)}
                              className="mt-1 w-full px-2 py-1.5 bg-page border border-line rounded-md text-xs text-ink focus:outline-none focus:border-brand/50 tabular-nums" />
                          </div>
                        ))}
                        <button onClick={() => luuToaDo3D(z.id)} disabled={busy3D === z.id}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-line text-ink-soft text-xs font-bold hover:bg-sunken disabled:opacity-50">
                          {busy3D === z.id ? <Loader2 size={13} className="animate-spin" /> : <Save size={13} />} Lưu 3D
                        </button>
                        <button
                          onClick={() => { doiToaDo3D(z.id, 'x', ''); doiToaDo3D(z.id, 'y', ''); doiToaDo3D(z.id, 'z', '') }}
                          disabled={busy3D === z.id}
                          title="Xoá trống cả ba ô rồi bấm Lưu 3D để xoá vị trí"
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-line text-ink-mute text-xs font-bold hover:bg-sunken disabled:opacity-50">
                          <Eraser size={13} /> Xoá trống
                        </button>
                      </div>
                      <p className="text-[11px] text-ink-mute mt-1.5">
                        Phải điền đủ cả ba, hoặc để trống cả ba rồi Lưu để xoá vị trí 3D.
                      </p>
                    </div>
                  </li>
                )
              })}
            </ul>
          </div>
        </>
      )}

      {daNgung.length > 0 && (
        <div className="bg-card border border-line rounded-xl p-6">
          <h2 className="text-base font-semibold text-ink mb-1">Đã ngừng hoạt động ({daNgung.length})</h2>
          <p className="text-xs text-ink-mute mb-3">Giữ lại vì vé đã bán còn tham chiếu tới những khu vực này.</p>
          <ul className="space-y-2">
            {daNgung.map((z) => (
              <li key={z.id} className="flex items-center justify-between gap-3 bg-sunken/40 border border-line/60 rounded-lg p-3 opacity-70">
                <span className="text-sm text-ink-soft">{z.name}</span>
                <span className="text-xs text-ink-mute">{z.capacity} chỗ</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {editing !== undefined && (
        <ZoneFormModal initial={editing} loungeId={lounge.id}
          onClose={() => setEditing(undefined)} onSaved={load} />
      )}
      {ngungTarget && (
        <ConfirmModal
          isOpen
          title="Ngừng hoạt động khu vực này?"
          message={`"${ngungTarget.name}" sẽ không dùng được cho hạng vé mới. Vé đã bán không bị ảnh hưởng — bản ghi khu vực vẫn được giữ lại.`}
          confirmText="Ngừng hoạt động"
          processingText="Đang xử lý..."
          isProcessing={isBusy}
          onConfirm={xacNhanNgung}
          onClose={() => setNgungTarget(null)}
        />
      )}
    </div>
  )
}

export default OwnerZonesPage
