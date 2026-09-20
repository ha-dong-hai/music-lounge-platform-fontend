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
import { Loader2, Plus, Pencil, Ban, X, LayoutGrid, Save, Image as ImageIcon, Box, Eraser } from 'lucide-react'
import toast from 'react-hot-toast'
import {
  getLounges, getLoungeZones, createZone, updateZone, deactivateZone,
  setZoneLayout2D, setZoneLayout3D, setAreaLayoutImage, getLoungeDetail,
} from '../../services/loungeServices'
import { uploadImage } from '../../services/userServices'
import ConfirmModal from '../../components/shared/ConfirmModal'

const inputCls = 'mt-1 w-full px-3 py-2 bg-black border border-gray-700 rounded-lg text-sm text-white focus:outline-none focus:border-[#C3B665]/50'

// Màu mặc định cho khu vực mới — lấy từ bảng màu đã kiểm của biểu đồ, đủ tương phản trên nền tối.
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
      <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-gray-900 border border-gray-700 rounded-2xl w-full max-w-md shadow-2xl">
        <div className="flex justify-between items-center p-5 border-b border-gray-800">
          <h2 className="text-lg font-bold text-white">{isEdit ? 'Sửa khu vực' : 'Thêm khu vực'}</h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-800 rounded-full text-gray-400"><X size={20} /></button>
        </div>
        <form onSubmit={submit} className="p-5 space-y-4">
          <div>
            <label className="text-xs text-gray-500">Tên khu vực <span className="text-red-400">*</span></label>
            <input value={form.name} onChange={(e) => set('name', e.target.value)} className={inputCls} placeholder="VD: Khu sân khấu" />
          </div>
          <div>
            <label className="text-xs text-gray-500">Mô tả</label>
            <textarea value={form.description} onChange={(e) => set('description', e.target.value)} rows={2} className={`${inputCls} resize-none`} />
          </div>
          <div>
            <label className="text-xs text-gray-500">Sức chứa <span className="text-red-400">*</span></label>
            <input type="number" min="0" step="1" value={form.capacity} onChange={(e) => set('capacity', e.target.value)} className={inputCls} />
            <p className="text-xs text-gray-600 mt-1">Số chỗ tối đa của khu vực này.</p>
          </div>
          <button type="submit" disabled={isBusy}
            className="w-full py-2.5 bg-[#C3B665] text-black rounded-lg font-bold flex items-center justify-center gap-2 disabled:opacity-50">
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

  if (isLoading) {
    return <div className="py-20 flex justify-center"><Loader2 size={32} className="animate-spin text-[#C3B665]" /></div>
  }

  if (!lounge) {
    return (
      <div className="max-w-2xl">
        <h1 className="text-2xl font-bold text-white mb-1">Khu vực chỗ ngồi</h1>
        <div className="mt-4 bg-gray-900 border border-gray-800 rounded-xl p-6">
          <p className="text-sm text-gray-400">Hãy tạo hồ sơ phòng trà trước — khu vực thuộc về phòng trà.</p>
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
          <h1 className="text-2xl font-bold text-white mb-1">Khu vực chỗ ngồi</h1>
          <p className="text-gray-400 text-sm leading-relaxed">
            Đặt khu vực trước, rồi tạo hạng vé gắn vào từng khu vực. Khán giả xem sơ đồ này khi chọn chỗ.
          </p>
        </div>
        <button onClick={() => setEditing(null)}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-[#C3B665] text-black rounded-lg text-xs font-bold hover:bg-[#d4c87f]">
          <Plus size={14} /> Thêm khu vực
        </button>
      </div>

      {dangHoatDong.length === 0 ? (
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-10 text-center">
          <LayoutGrid size={28} className="mx-auto mb-3 text-gray-700" />
          <p className="text-sm text-gray-500">Chưa có khu vực nào. Thêm khu vực để bắt đầu bán vé theo chỗ.</p>
        </div>
      ) : (
        <>
          {/* === SƠ ĐỒ 2D === */}
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
            <div className="flex flex-wrap items-start justify-between gap-3 mb-4">
              <div>
                <h2 className="text-base font-semibold text-white">Sơ đồ 2D</h2>
                <p className="text-xs text-gray-500 mt-0.5 leading-relaxed">
                  Kéo từng khối để đặt vị trí. Chỉ lưu khi bấm nút — kéo tới đâu lưu tới đó sẽ làm sơ đồ nhảy khi mạng chậm.
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                <label className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-gray-700 text-gray-300 text-xs font-bold hover:bg-gray-800 cursor-pointer">
                  {isUploadingBg ? <Loader2 size={13} className="animate-spin" /> : <ImageIcon size={13} />}
                  {lounge.areaLayoutImageUrl ? 'Đổi ảnh nền' : 'Ảnh mặt bằng'}
                  <input type="file" accept="image/*" className="hidden" disabled={isUploadingBg}
                    onChange={(e) => taiAnhNen(e.target.files?.[0])} />
                </label>
                {lounge.areaLayoutImageUrl && (
                  <button onClick={boAnhNen} disabled={isUploadingBg}
                    className="px-3 py-1.5 rounded-lg border border-gray-700 text-gray-400 text-xs font-bold hover:bg-gray-800 disabled:opacity-50">
                    Bỏ ảnh nền
                  </button>
                )}
                <button onClick={luuSoDo} disabled={isSavingLayout}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#C3B665] text-black text-xs font-bold hover:bg-[#d4c87f] disabled:opacity-50">
                  {isSavingLayout ? <Loader2 size={13} className="animate-spin" /> : <Save size={13} />} Lưu sơ đồ
                </button>
              </div>
            </div>

            <div
              ref={khungRef}
              onMouseMove={dangKeo}
              onMouseUp={ketThucKeo}
              onMouseLeave={ketThucKeo}
              className="relative w-full aspect-[16/9] rounded-lg border border-gray-800 bg-black overflow-hidden select-none"
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
                    className="absolute flex items-center justify-center rounded-md cursor-move border-2 text-xs font-bold text-white text-center px-1 overflow-hidden"
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
            </div>
          </div>

          {/* === DANH SÁCH KHU VỰC === */}
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
            <h2 className="text-base font-semibold text-white mb-4">Danh sách khu vực</h2>
            <ul className="space-y-3">
              {dangHoatDong.map((z) => {
                const o = layout[z.id] ?? {}
                return (
                  <li key={z.id} className="bg-black/40 border border-gray-800 rounded-lg p-4">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div className="flex items-start gap-3 min-w-0">
                        <span className="w-4 h-4 rounded-sm mt-0.5 flex-shrink-0" style={{ backgroundColor: o.color }} />
                        <div className="min-w-0">
                          <p className="text-white font-medium">{z.name}</p>
                          <p className="text-xs text-gray-500 mt-0.5">{z.capacity} chỗ</p>
                          {z.description && <p className="text-xs text-gray-600 mt-0.5">{z.description}</p>}
                        </div>
                      </div>
                      <div className="flex gap-2 flex-shrink-0">
                        <button onClick={() => setEditing(z)}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-gray-700 text-gray-300 text-xs font-bold hover:bg-gray-800">
                          <Pencil size={13} /> Sửa
                        </button>
                        <button onClick={() => setNgungTarget(z)}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-gray-700 text-red-400 text-xs font-bold hover:bg-red-500/10">
                          <Ban size={13} /> Ngừng
                        </button>
                      </div>
                    </div>

                    {/* Kích thước và góc quay nhập bằng số, vì kéo chỉ đặt được vị trí */}
                    <div className="mt-3 grid grid-cols-2 sm:grid-cols-4 gap-3">
                      {[['width', 'Rộng (%)'], ['height', 'Cao (%)'], ['rotationDeg', 'Góc quay (°)']].map(([key, label]) => (
                        <div key={key}>
                          <label className="text-xs text-gray-600">{label}</label>
                          <input type="number" value={o[key] ?? 0}
                            onChange={(e) => doiKichThuoc(z.id, key, e.target.value)}
                            className="mt-1 w-full px-2 py-1.5 bg-black border border-gray-700 rounded-md text-xs text-white focus:outline-none focus:border-[#C3B665]/50 tabular-nums" />
                        </div>
                      ))}
                      <div>
                        <label className="text-xs text-gray-600">Màu</label>
                        <input type="color" value={o.color ?? '#3987e5'}
                          onChange={(e) => setLayout((p) => ({ ...p, [z.id]: { ...p[z.id], color: e.target.value } }))}
                          className="mt-1 w-full h-[30px] bg-black border border-gray-700 rounded-md cursor-pointer" />
                      </div>
                    </div>

                    {/* VỊ TRÍ 3D — endpoint riêng, lưu riêng từng khu vực, không đi cùng nút Lưu sơ đồ 2D */}
                    <div className="mt-3 pt-3 border-t border-gray-800">
                      <p className="text-xs text-gray-500 flex items-center gap-1.5">
                        <Box size={12} /> Vị trí trong mô hình 3D
                        <span className="text-gray-700">— dùng cho mô hình 3D, không phải sơ đồ chọn chỗ</span>
                      </p>
                      <div className="mt-2 flex flex-wrap items-end gap-2">
                        {['x', 'y', 'z'].map((truc) => (
                          <div key={truc} className="w-20">
                            <label className="text-xs text-gray-600 uppercase">{truc}</label>
                            <input type="number" step="any"
                              value={(layout3D[z.id] ?? {})[truc] ?? ''}
                              onChange={(e) => doiToaDo3D(z.id, truc, e.target.value)}
                              className="mt-1 w-full px-2 py-1.5 bg-black border border-gray-700 rounded-md text-xs text-white focus:outline-none focus:border-[#C3B665]/50 tabular-nums" />
                          </div>
                        ))}
                        <button onClick={() => luuToaDo3D(z.id)} disabled={busy3D === z.id}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-gray-700 text-gray-300 text-xs font-bold hover:bg-gray-800 disabled:opacity-50">
                          {busy3D === z.id ? <Loader2 size={13} className="animate-spin" /> : <Save size={13} />} Lưu 3D
                        </button>
                        <button
                          onClick={() => { doiToaDo3D(z.id, 'x', ''); doiToaDo3D(z.id, 'y', ''); doiToaDo3D(z.id, 'z', '') }}
                          disabled={busy3D === z.id}
                          title="Xoá trống cả ba ô rồi bấm Lưu 3D để xoá vị trí"
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-gray-700 text-gray-500 text-xs font-bold hover:bg-gray-800 disabled:opacity-50">
                          <Eraser size={13} /> Xoá trống
                        </button>
                      </div>
                      <p className="text-[11px] text-gray-600 mt-1.5">
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
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
          <h2 className="text-base font-semibold text-white mb-1">Đã ngừng hoạt động ({daNgung.length})</h2>
          <p className="text-xs text-gray-500 mb-3">Giữ lại vì vé đã bán còn tham chiếu tới những khu vực này.</p>
          <ul className="space-y-2">
            {daNgung.map((z) => (
              <li key={z.id} className="flex items-center justify-between gap-3 bg-black/20 border border-gray-800/60 rounded-lg p-3 opacity-70">
                <span className="text-sm text-gray-300">{z.name}</span>
                <span className="text-xs text-gray-600">{z.capacity} chỗ</span>
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
