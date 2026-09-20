// src/pages/owner/OwnerTourPage.jsx
//
// GHI CHÚ CHO ĐỘI FE:
// - Tour 360° gồm nhiều SCENE (mỗi scene là một ảnh 360° tại một điểm đứng) và HOTSPOT (điểm bấm
//   trên ảnh để nhảy sang scene khác). Khán giả xem tour này ở trang phòng trà.
// - Có HAI cách tạo scene:
//     1. Tải thẳng một ảnh 360° đã có → xong ngay.
//     2. Ghép nhiều ảnh thường thành một ảnh 360° → việc ghép CHẠY NỀN và mất thời gian, backend trả
//        về một ĐƠN GHÉP (attempt) chứ không trả ảnh. Phải hỏi lại trạng thái, đừng chờ ảnh ngay.
// - HOTSPOT chỉ có Thêm và Xoá — backend không có endpoint sửa. Muốn đổi thì xoá rồi thêm lại.
// - Mô hình 3D là MỘT file .glb/.gltf cho cả không gian, tải qua endpoint riêng (/uploads/models),
//   khác endpoint ảnh.
// - VỊ TRÍ SCENE là chấm định vị TRÊN ẢNH MẶT BẰNG của phòng trà (ảnh đặt ở màn Khu vực chỗ ngồi),
//   theo phần trăm 0–100. Nó KHÔNG quyết định thứ tự hay hướng di chuyển — việc nhảy giữa các scene
//   do hotspot quyết định. Backend bắt X/Y phải cùng có hoặc cùng trống; trống cả hai = xoá chấm.
import { useState, useEffect, useCallback } from 'react'
import {
  Loader2, Plus, Trash2, Upload, Layers, Box, RefreshCw, Link2, X, AlertTriangle, Clock,
  MapPin, Save, Eraser,
} from 'lucide-react'
import toast from 'react-hot-toast'
import {
  getLounges, getLoungeDetail, getLoungeTour, addTourScene, stitchTourScene,
  getTourStitchAttempt, removeTourScene, addTourHotspot, removeTourHotspot, setLoungeModel3D,
  setTourScenePosition,
} from '../../services/loungeServices'
import { uploadImage, uploadModel } from '../../services/userServices'
import ConfirmModal from '../../components/shared/ConfirmModal'

const inputCls = 'mt-1 w-full px-3 py-2 bg-black border border-gray-700 rounded-lg text-sm text-white focus:outline-none focus:border-[#C3B665]/50'

const HotspotModal = ({ loungeId, scene, scenes, onClose, onSaved }) => {
  const [form, setForm] = useState({ targetSceneId: '', label: '', yaw: 0, pitch: 0 })
  const [isBusy, setIsBusy] = useState(false)
  const set = (k, v) => setForm((p) => ({ ...p, [k]: v }))

  const them = async (e) => {
    e.preventDefault()
    if (!form.targetSceneId) { toast.error('Chọn scene mà hotspot này dẫn tới.'); return }
    setIsBusy(true)
    try {
      await addTourHotspot(loungeId, scene.id, {
        targetSceneId: Number(form.targetSceneId),
        label: form.label.trim() || null,
        yaw: Number(form.yaw) || 0,
        pitch: Number(form.pitch) || 0,
      })
      toast.success('Đã thêm hotspot.')
      onSaved(); onClose()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Không thêm được hotspot.')
    } finally { setIsBusy(false) }
  }

  const khac = scenes.filter((x) => x.id !== scene.id)

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-gray-900 border border-gray-700 rounded-2xl w-full max-w-md shadow-2xl">
        <div className="flex justify-between items-center p-5 border-b border-gray-800">
          <h2 className="text-lg font-bold text-white truncate">Hotspot của {scene.name || `scene #${scene.id}`}</h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-800 rounded-full text-gray-400 flex-shrink-0"><X size={20} /></button>
        </div>

        <div className="p-5 space-y-4">
          {(scene.hotspots?.length ?? 0) > 0 && (
            <ul className="space-y-2">
              {scene.hotspots.map((h) => {
                const dich = scenes.find((x) => x.id === h.targetSceneId)
                return (
                  <li key={h.id} className="flex items-center justify-between gap-3 bg-black/40 border border-gray-800 rounded-lg p-3">
                    <div className="min-w-0">
                      <p className="text-sm text-white truncate">{h.label || 'Không nhãn'}</p>
                      <p className="text-xs text-gray-500">→ {dich?.name || `scene #${h.targetSceneId}`}</p>
                    </div>
                    <button onClick={async () => {
                      try {
                        await removeTourHotspot(loungeId, h.id)
                        toast.success('Đã xoá hotspot.')
                        onSaved()
                      } catch (err) {
                        toast.error(err.response?.data?.message || 'Không xoá được hotspot.')
                      }
                    }}
                      className="p-2 rounded-lg text-red-400 hover:bg-red-500/10 flex-shrink-0" title="Xoá">
                      <Trash2 size={14} />
                    </button>
                  </li>
                )
              })}
            </ul>
          )}

          {khac.length === 0 ? (
            <p className="text-sm text-gray-500">Cần ít nhất hai scene mới tạo được hotspot để nhảy qua lại.</p>
          ) : (
            <form onSubmit={them} className="pt-4 border-t border-gray-800 space-y-3">
              <p className="text-xs text-gray-500">
                Thêm hotspot mới. Muốn sửa một hotspot thì xoá rồi thêm lại — backend không có endpoint sửa.
              </p>
              <div>
                <label className="text-xs text-gray-500">Dẫn tới scene <span className="text-red-400">*</span></label>
                <select value={form.targetSceneId} onChange={(e) => set('targetSceneId', e.target.value)} className={inputCls}>
                  <option value="">— chọn scene —</option>
                  {khac.map((x) => <option key={x.id} value={x.id}>{x.name || `scene #${x.id}`}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs text-gray-500">Nhãn hiển thị</label>
                <input value={form.label} onChange={(e) => set('label', e.target.value)} className={inputCls} placeholder="VD: Sang khu sân khấu" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-gray-500">Hướng ngang (yaw)</label>
                  <input type="number" value={form.yaw} onChange={(e) => set('yaw', e.target.value)} className={inputCls} />
                </div>
                <div>
                  <label className="text-xs text-gray-500">Hướng dọc (pitch)</label>
                  <input type="number" value={form.pitch} onChange={(e) => set('pitch', e.target.value)} className={inputCls} />
                </div>
              </div>
              <button type="submit" disabled={isBusy}
                className="w-full py-2 rounded-lg border border-gray-700 text-gray-300 text-sm font-bold hover:bg-gray-800 flex items-center justify-center gap-2 disabled:opacity-50">
                {isBusy ? <Loader2 size={15} className="animate-spin" /> : <Plus size={15} />} Thêm hotspot
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  )
}

const OwnerTourPage = () => {
  const [lounge, setLounge] = useState(null)
  const [tour, setTour] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [busy, setBusy] = useState(null)
  // Chấm định vị của từng scene trên ảnh mặt bằng. Chuỗi rỗng = chưa đặt (khác với đặt ở 0,0).
  const [viTri, setViTri] = useState({}) // { [sceneId]: { x, y } }
  const [busyViTri, setBusyViTri] = useState(null)
  // Scene đang nhắm để bấm đặt chấm trên ảnh mặt bằng. null = không ở chế độ đặt.
  const [sceneDangDat, setSceneDangDat] = useState(null)
  const [xoaScene, setXoaScene] = useState(null)
  const [hotspotOf, setHotspotOf] = useState(null)
  const [donGhep, setDonGhep] = useState(null) // { id, status }
  const [anhGhep, setAnhGhep] = useState([])

  const load = useCallback(async () => {
    setIsLoading(true)
    try {
      const res = await getLounges({ mine: true })
      const ds = res.success ? (Array.isArray(res.data) ? res.data : res.data?.items) : null
      const cuaToi = ds?.[0] ?? null
      if (!cuaToi) { setLounge(null); return }

      const [ct, tRes] = await Promise.allSettled([getLoungeDetail(cuaToi.id), getLoungeTour(cuaToi.id)])
      setLounge(ct.status === 'fulfilled' && ct.value?.success ? ct.value.data : cuaToi)
      const duLieuTour = tRes.status === 'fulfilled' && tRes.value?.success ? tRes.value.data : null
      setTour(duLieuTour)

      // Nạp chấm định vị đang lưu. KHÔNG có giá trị mặc định: chưa đặt thì để trống thật, vì
      // backend phân biệt "chưa đặt" với "đặt ở góc trên bên trái (0,0)".
      const nhapViTri = {}
      ;(duLieuTour?.scenes ?? []).forEach((sc) => {
        nhapViTri[sc.id] = { x: sc.positionX ?? '', y: sc.positionY ?? '' }
      })
      setViTri(nhapViTri)
    } catch (err) {
      toast.error(err.response?.data?.message || 'Không tải được tour.')
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => { const chay = async () => { await load() }; chay() }, [load])

  const doiViTri = (sceneId, truc, value) => {
    setViTri((p) => ({ ...p, [sceneId]: { ...(p[sceneId] ?? {}), [truc]: value } }))
  }

  const luuViTri = async (sceneId) => {
    const o = viTri[sceneId] ?? {}
    const so = (v) => (v === '' || v == null ? null : Number(v))
    const [x, y] = [so(o.x), so(o.y)]
    const soOTrong = [x, y].filter((v) => v === null).length
    if (soOTrong === 1) {
      toast.error('X và Y phải điền cả hai, hoặc để trống cả hai để xoá chấm định vị.')
      return
    }
    if (soOTrong === 0 && [x, y].some((v) => v < 0 || v > 100)) {
      toast.error('X và Y là phần trăm, phải nằm trong khoảng 0–100.')
      return
    }
    setBusyViTri(sceneId)
    try {
      await setTourScenePosition(lounge.id, sceneId, { x, y })
      toast.success(soOTrong === 2 ? 'Đã xoá chấm định vị.' : 'Đã lưu vị trí scene.')
      await load()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Không lưu được vị trí scene.')
    } finally { setBusyViTri(null) }
  }

  const themScene = async (file) => {
    if (!file) return
    setBusy('scene')
    try {
      const up = await uploadImage(file)
      if (!up.success) throw new Error(up.message)
      await addTourScene(lounge.id, { imageUrl: up.data?.url ?? up.data })
      toast.success('Đã thêm scene.')
      await load()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Không thêm được scene.')
    } finally { setBusy(null) }
  }

  const themAnhGhep = async (file) => {
    if (!file) return
    setBusy('upload-ghep')
    try {
      const up = await uploadImage(file)
      if (!up.success) throw new Error(up.message)
      setAnhGhep((p) => [...p, up.data?.url ?? up.data])
    } catch (err) {
      toast.error(err.response?.data?.message || 'Không tải được ảnh.')
    } finally { setBusy(null) }
  }

  const ghepScene = async () => {
    if (anhGhep.length < 2) { toast.error('Cần ít nhất hai ảnh để ghép thành ảnh 360°.'); return }
    setBusy('ghep')
    try {
      const res = await stitchTourScene(lounge.id, { sourceImageUrls: anhGhep })
      // Ghép chạy nền — backend trả về đơn ghép, không trả ảnh. Giữ id để hỏi lại trạng thái.
      setDonGhep(res.data ?? null)
      setAnhGhep([])
      toast.success('Đã gửi yêu cầu ghép ảnh. Việc ghép chạy nền, bấm "Kiểm tra" để xem xong chưa.')
    } catch (err) {
      toast.error(err.response?.data?.message || 'Không gửi được yêu cầu ghép.')
    } finally { setBusy(null) }
  }

  const kiemTraDonGhep = async () => {
    if (!donGhep?.id) return
    setBusy('check')
    try {
      const res = await getTourStitchAttempt(lounge.id, donGhep.id)
      if (res.success) {
        setDonGhep(res.data)
        if (res.data.status === 'Succeeded') {
          toast.success('Ghép xong, scene đã được thêm.')
          setDonGhep(null)
          await load()
        } else if (res.data.status === 'Failed') {
          toast.error(res.data.errorMessage || 'Ghép ảnh thất bại.')
        }
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Không kiểm tra được đơn ghép.')
    } finally { setBusy(null) }
  }

  const xacNhanXoaScene = async () => {
    setBusy('xoa')
    try {
      await removeTourScene(lounge.id, xoaScene.id)
      toast.success('Đã xoá scene.')
      setXoaScene(null)
      await load()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Không xoá được scene.')
    } finally { setBusy(null) }
  }

  const taiMoHinh3D = async (file) => {
    if (!file) return
    setBusy('model')
    try {
      const up = await uploadModel(file)
      if (!up.success) throw new Error(up.message)
      await setLoungeModel3D(lounge.id, up.data?.url ?? up.data)
      toast.success('Đã đặt mô hình 3D.')
      await load()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Không tải được mô hình 3D.')
    } finally { setBusy(null) }
  }

  if (isLoading) {
    return <div className="py-20 flex justify-center"><Loader2 size={32} className="animate-spin text-[#C3B665]" /></div>
  }

  if (!lounge) {
    return (
      <div className="max-w-2xl">
        <h1 className="text-2xl font-bold text-white mb-1">Tour 360°</h1>
        <div className="mt-4 bg-gray-900 border border-gray-800 rounded-xl p-6">
          <p className="text-sm text-gray-400">Hãy tạo hồ sơ phòng trà trước.</p>
        </div>
      </div>
    )
  }

  const scenes = tour?.scenes ?? []

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white mb-1">Tour 360° &amp; mô hình 3D</h1>
        <p className="text-gray-400 text-sm leading-relaxed">
          Khán giả dùng tour này để xem trước không gian phòng trà trước khi mua vé.
        </p>
      </div>

      {/* === SCENE === */}
      <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
        <div className="flex flex-wrap items-start justify-between gap-3 mb-4">
          <div>
            <h2 className="text-base font-semibold text-white">Các điểm đứng (scene)</h2>
            <p className="text-xs text-gray-500 mt-0.5">Mỗi scene là một ảnh 360° tại một vị trí trong phòng trà.</p>
          </div>
          <label className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[#C3B665] text-black text-xs font-bold hover:bg-[#d4c87f] cursor-pointer flex-shrink-0">
            {busy === 'scene' ? <Loader2 size={13} className="animate-spin" /> : <Plus size={13} />}
            Thêm ảnh 360° có sẵn
            <input type="file" accept="image/*" className="hidden" disabled={busy !== null}
              onChange={(e) => themScene(e.target.files?.[0])} />
          </label>
        </div>

        {/* BẢN ĐỒ MẶT BẰNG — cùng ảnh mà màn Khu vực chỗ ngồi dùng để vẽ khu vực (backend cố ý
            dùng lại một ảnh chứ không thêm trường ảnh thứ hai). Bấm vào ảnh để đặt chấm cho scene
            đang nhắm; toạ độ lưu theo phần trăm nên ảnh co giãn thế nào chấm vẫn đúng chỗ. */}
        {tour?.floorPlanImageUrl ? (
          <div className="mb-5">
            <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
              <p className="text-xs text-gray-500">
                {sceneDangDat
                  ? 'Bấm vào ảnh để đặt chấm cho scene đang nhắm.'
                  : 'Chọn một scene bên dưới rồi bấm vào ảnh để đặt chấm định vị.'}
              </p>
              {sceneDangDat && (
                <button onClick={() => setSceneDangDat(null)}
                  className="px-2.5 py-1 rounded-lg border border-gray-700 text-gray-400 text-xs font-bold hover:bg-gray-800">
                  Thôi đặt
                </button>
              )}
            </div>

            <div
              onClick={(e) => {
                if (!sceneDangDat) return
                const r = e.currentTarget.getBoundingClientRect()
                // Làm tròn 1 chữ số: không ai cần độ chính xác hơn thế trên một bản đồ tương đối,
                // và số ngắn thì ô nhập bên dưới còn đọc được.
                const x = Math.round(((e.clientX - r.left) / r.width) * 1000) / 10
                const y = Math.round(((e.clientY - r.top) / r.height) * 1000) / 10
                doiViTri(sceneDangDat, 'x', String(x))
                doiViTri(sceneDangDat, 'y', String(y))
              }}
              className={`relative w-full rounded-xl overflow-hidden border ${sceneDangDat ? 'border-[#C3B665] cursor-crosshair' : 'border-gray-800'}`}
              style={{ aspectRatio: '16 / 9' }}
            >
              <img src={tour.floorPlanImageUrl} alt="Mặt bằng phòng trà"
                className="absolute inset-0 w-full h-full object-contain bg-black" />

              {scenes.map((sc) => {
                const o = viTri[sc.id] ?? {}
                if (o.x === '' || o.y === '' || o.x == null || o.y == null) return null
                const dangNham = sceneDangDat === sc.id
                return (
                  <span key={sc.id}
                    title={sc.name || `Scene #${sc.id}`}
                    className={`absolute -translate-x-1/2 -translate-y-1/2 px-1.5 py-0.5 rounded-md text-[10px] font-bold whitespace-nowrap ${
                      dangNham ? 'bg-[#C3B665] text-black ring-2 ring-white/50' : 'bg-black/80 text-[#C3B665] border border-[#C3B665]/50'
                    }`}
                    style={{ left: `${o.x}%`, top: `${o.y}%` }}>
                    {sc.name || `#${sc.id}`}
                  </span>
                )
              })}
            </div>
          </div>
        ) : scenes.length > 0 && (
          <p className="mb-4 text-xs text-gray-500 flex items-start gap-1.5 leading-relaxed">
            <AlertTriangle size={12} className="mt-0.5 flex-shrink-0 text-yellow-400" />
            Chưa có ảnh mặt bằng nên không xem được chấm định vị trên bản đồ. Tải ảnh ở màn Khu vực
            chỗ ngồi — backend dùng chung một ảnh cho cả hai màn.
          </p>
        )}

        {scenes.length === 0 ? (
          <p className="py-8 text-center text-sm text-gray-500">Chưa có scene nào.</p>
        ) : (
          <ul className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {scenes.map((sc) => (
              <li key={sc.id} className="bg-black/40 border border-gray-800 rounded-lg overflow-hidden">
                {sc.imageUrl && <img src={sc.imageUrl} alt="" className="w-full h-32 object-cover" />}
                <div className="p-3">
                  <p className="text-sm text-white font-medium truncate">{sc.name || `Scene #${sc.id}`}</p>
                  <p className="text-xs text-gray-500 mt-0.5">
                    {(sc.hotspots?.length ?? 0)} hotspot
                  </p>
                  <div className="mt-2 flex gap-2">
                    <button onClick={() => setHotspotOf(sc)}
                      className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-gray-700 text-gray-300 text-xs font-bold hover:bg-gray-800">
                      <Link2 size={12} /> Hotspot
                    </button>
                    <button onClick={() => setXoaScene(sc)}
                      className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-gray-700 text-red-400 text-xs font-bold hover:bg-red-500/10">
                      <Trash2 size={12} /> Xoá
                    </button>
                  </div>

                  {/* CHẤM ĐỊNH VỊ TRÊN ẢNH MẶT BẰNG — không liên quan tới hotspot hay thứ tự */}
                  <div className="mt-3 pt-3 border-t border-gray-800">
                    <p className="text-xs text-gray-500 flex items-center gap-1.5">
                      <MapPin size={12} /> Vị trí trên ảnh mặt bằng (%)
                    </p>
                    <div className="mt-2 flex flex-wrap items-end gap-2">
                      {['x', 'y'].map((truc) => (
                        <div key={truc} className="w-16">
                          <label className="text-xs text-gray-600 uppercase">{truc}</label>
                          <input type="number" step="any" min="0" max="100"
                            value={(viTri[sc.id] ?? {})[truc] ?? ''}
                            onChange={(e) => doiViTri(sc.id, truc, e.target.value)}
                            className="mt-1 w-full px-2 py-1.5 bg-black border border-gray-700 rounded-md text-xs text-white focus:outline-none focus:border-[#C3B665]/50 tabular-nums" />
                        </div>
                      ))}
                      <button onClick={() => luuViTri(sc.id)} disabled={busyViTri === sc.id}
                        className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-gray-700 text-gray-300 text-xs font-bold hover:bg-gray-800 disabled:opacity-50">
                        {busyViTri === sc.id ? <Loader2 size={12} className="animate-spin" /> : <Save size={12} />} Lưu
                      </button>
                      <button onClick={() => { doiViTri(sc.id, 'x', ''); doiViTri(sc.id, 'y', '') }}
                        disabled={busyViTri === sc.id}
                        title="Xoá trống cả hai ô rồi bấm Lưu để xoá chấm định vị"
                        className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-gray-700 text-gray-500 text-xs font-bold hover:bg-gray-800 disabled:opacity-50">
                        <Eraser size={12} />
                      </button>
                      {tour?.floorPlanImageUrl && (
                        <button onClick={() => setSceneDangDat(sceneDangDat === sc.id ? null : sc.id)}
                          className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border text-xs font-bold ${
                            sceneDangDat === sc.id
                              ? 'border-[#C3B665] bg-[#C3B665]/10 text-[#C3B665]'
                              : 'border-gray-700 text-gray-300 hover:bg-gray-800'
                          }`}>
                          <MapPin size={12} /> {sceneDangDat === sc.id ? 'Đang nhắm' : 'Đặt trên bản đồ'}
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* === GHÉP ẢNH THÀNH 360° === */}
      <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
        <h2 className="text-base font-semibold text-white flex items-center gap-2">
          <Layers size={16} /> Ghép ảnh thường thành ảnh 360°
        </h2>
        <p className="text-xs text-gray-500 mt-1 leading-relaxed">
          Chụp nhiều ảnh xoay quanh một điểm đứng rồi tải lên đây. Việc ghép chạy nền và mất một lúc —
          không có ảnh ngay sau khi bấm.
        </p>

        {donGhep ? (
          <div className="mt-4 bg-black/40 border border-gray-800 rounded-lg p-4">
            <p className="text-sm text-white flex items-center gap-2">
              <Clock size={14} className="text-yellow-400" /> Đơn ghép #{donGhep.id} — {donGhep.status}
            </p>
            {donGhep.errorMessage && <p className="text-xs text-red-400 mt-1">{donGhep.errorMessage}</p>}
            <button onClick={kiemTraDonGhep} disabled={busy !== null}
              className="mt-3 flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-gray-700 text-gray-300 text-xs font-bold hover:bg-gray-800 disabled:opacity-50">
              {busy === 'check' ? <Loader2 size={13} className="animate-spin" /> : <RefreshCw size={13} />} Kiểm tra
            </button>
          </div>
        ) : (
          <div className="mt-4 space-y-3">
            {anhGhep.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {anhGhep.map((url, i) => (
                  <span key={url} className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-black border border-gray-700 text-xs text-gray-300">
                    Ảnh {i + 1}
                    <button onClick={() => setAnhGhep((p) => p.filter((u) => u !== url))}
                      className="text-gray-500 hover:text-red-400"><X size={12} /></button>
                  </span>
                ))}
              </div>
            )}
            <div className="flex flex-wrap gap-2">
              <label className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border border-gray-700 text-gray-300 text-xs font-bold hover:bg-gray-800 cursor-pointer">
                {busy === 'upload-ghep' ? <Loader2 size={13} className="animate-spin" /> : <Upload size={13} />}
                Thêm ảnh nguồn
                <input type="file" accept="image/*" className="hidden" disabled={busy !== null}
                  onChange={(e) => themAnhGhep(e.target.files?.[0])} />
              </label>
              <button onClick={ghepScene} disabled={busy !== null || anhGhep.length < 2}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#C3B665] text-black text-xs font-bold hover:bg-[#d4c87f] disabled:opacity-40 disabled:cursor-not-allowed">
                {busy === 'ghep' ? <Loader2 size={13} className="animate-spin" /> : <Layers size={13} />}
                Ghép thành scene ({anhGhep.length} ảnh)
              </button>
            </div>
            {anhGhep.length === 1 && (
              <p className="text-xs text-yellow-400 flex items-start gap-1.5">
                <AlertTriangle size={12} className="mt-px flex-shrink-0" /> Cần ít nhất hai ảnh để ghép.
              </p>
            )}
          </div>
        )}
      </div>

      {/* === MÔ HÌNH 3D === */}
      <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
        <h2 className="text-base font-semibold text-white flex items-center gap-2">
          <Box size={16} /> Mô hình 3D không gian
        </h2>
        <p className="text-xs text-gray-500 mt-1 leading-relaxed">
          Một tệp .glb hoặc .gltf cho cả phòng trà. Dùng cho buổi diễn phát ở chế độ không gian 3D.
        </p>
        {lounge.model3DUrl && (
          <p className="text-xs text-green-400 mt-2">Đã có mô hình 3D.</p>
        )}
        <label className="mt-3 inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-gray-700 text-gray-300 text-sm font-medium hover:bg-gray-800 cursor-pointer">
          {busy === 'model' ? <Loader2 size={16} className="animate-spin" /> : <Upload size={16} />}
          {lounge.model3DUrl ? 'Đổi mô hình' : 'Tải mô hình lên'}
          <input type="file" accept=".glb,.gltf" className="hidden" disabled={busy !== null}
            onChange={(e) => taiMoHinh3D(e.target.files?.[0])} />
        </label>
      </div>

      {hotspotOf && (
        <HotspotModal loungeId={lounge.id} scene={hotspotOf} scenes={scenes}
          onClose={() => setHotspotOf(null)} onSaved={load} />
      )}
      {xoaScene && (
        <ConfirmModal
          isOpen
          title="Xoá scene này?"
          message={`"${xoaScene.name || `Scene #${xoaScene.id}`}" và các hotspot dẫn tới nó sẽ không còn trong tour.`}
          confirmText="Xoá"
          processingText="Đang xoá..."
          isProcessing={busy === 'xoa'}
          onConfirm={xacNhanXoaScene}
          onClose={() => setXoaScene(null)}
        />
      )}
    </div>
  )
}

export default OwnerTourPage
