// src/components/mshow-detail/SeatingMapView.jsx
//
// CHỌN KHU (tab "Vé và chỗ ngồi" của buổi diễn) — MLACP-556, 03/10/2026.
// Chủ dự án: "làm sao để từ view 360 và view 3d, view 2D chọn được ghế và tiến hành mua vé" → chốt CHỌN KHU (không
// phải từng ghế: hệ thống bán theo khu, PhysicalTicketDetail.SeatInfo không ai ghi) trên CẢ BA cách xem:
//  - 2D: ô khu theo sơ đồ chủ phòng trà vẽ, khung CẮT VỪA cụm khu (bản cũ để cả mặt sàn 16:9 — 3 ô nhỏ trong một
//    khung trống lớn, chủ dự án tưởng "chưa có 2D");
//  - 3D: SoDoCho3D (bàn ghế thật) — dùng chung với trang phòng trà;
//  - 360°: PanoramaViewer + điểm "Khu" (hotspot type Zone, MLACP-555) chủ phòng trà đặt trên ảnh.
// Một trạng thái chọn duy nhất (selectedZoneId ở ShowMap) cho cả ba + danh sách khu bên cạnh: chọn ở view nào thì
// danh sách và hai view kia cùng theo. Danh sách là đường bàn phím/trình đọc màn hình (canvas 3D aria-hidden).
// Chọn khu CHỈ lọc hạng vé bên dưới — giữ chỗ và thanh toán vẫn đi đường cũ (ShowMap).
// Chỉ in cách xem có dữ liệu: 2D/3D cần ít nhất một khu có vị trí; 360° cần tour có cảnh. Sơ đồ lỗi/không có → không
// chặn việc mua vé (vẫn mua theo danh sách hạng vé).
import { lazy, Suspense, useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Loader2, Map as IconMap, Armchair, Rotate3d, RotateCcw } from 'lucide-react'
import { getShowSeatingMap } from '../../services/showServices'
import { getLoungeTour, getLoungeZones } from '../../services/loungeServices'
import KhongGianPhongTra from '../lounge/KhongGianPhongTra'
import usePhimTab from '../../hooks/usePhimTab'

const SoDoCho3D = lazy(() => import('../lounge/SoDoCho3D'))
const PanoramaViewer = lazy(() => import('../lounge/PanoramaViewer'))

const MAU_MAC_DINH = ['#C9A45C', '#8C7A6B', '#B3A899', '#6E5E50'] // khớp SoDoCho3D
const fmtTien = (v) => `${Number(v || 0).toLocaleString('vi-VN')}đ`
const khoangGia = (z) => {
  if (z.minPrice == null && z.maxPrice == null) return null
  if (z.minPrice === z.maxPrice) return fmtTien(z.minPrice)
  return `${fmtTien(z.minPrice)} – ${fmtTien(z.maxPrice)}`
}
const nhanConLai = (z) => {
  if (z.availableCount == null) return 'Còn vé'
  if (z.availableCount <= 0) return 'Hết vé'
  return `Còn ${z.availableCount}`
}
const coViTri = (z) => z.layout2DX != null && z.layout2DY != null

const KHONG_HANG_VE = {}
const CHO = <div className="absolute inset-0 grid place-items-center bg-board text-lamp-mute text-sm" aria-busy="true">Đang dựng…</div>

// 2D: chỉ khung quanh cụm khu (+ lề 4%). Tỉ lệ khung KẸP về 1,2–2 (không giữ đúng tỉ lệ mặt sàn): Ánh Dương xếp 3 khu
// thành một dải ngang tỉ lệ ~5:1 — giữ đúng tỉ lệ thì ô khu chỉ cao ~1/3 khung, lại thành "ô nhỏ giữa khung trống"
// (đo 03/10). Đây là sơ đồ minh hoạ vị trí tương đối, giãn dọc không làm sai thứ tự hay hàng xóm của khu.
function SoDo2D({ zones, chon, onChon, hangVe = {} }) {
  const vung = useMemo(() => {
    const x0 = Math.min(...zones.map((z) => z.layout2DX)), y0 = Math.min(...zones.map((z) => z.layout2DY))
    const x1 = Math.max(...zones.map((z) => z.layout2DX + (z.layout2DWidth ?? 12)))
    const y1 = Math.max(...zones.map((z) => z.layout2DY + (z.layout2DHeight ?? 12)))
    const L = 4
    const x = Math.max(0, x0 - L), y = Math.max(0, y0 - L)
    const w = Math.min(100, x1 + L) - x, h = Math.min(100, y1 + L) - y
    return { x, y, w, h, tiLe: Math.min(2, Math.max(1.2, (w * 16) / (h * 9))) }
  }, [zones])

  return (
    <div className="absolute inset-0 grid place-items-center bg-board p-4 sm:p-6">
      <div className="relative w-full max-h-full" style={{ aspectRatio: String(vung.tiLe) }}>
        {zones.map((z, i) => {
          const dang = z.zoneId === chon
          const het = z.availableCount != null && z.availableCount <= 0
          const mau = z.color || MAU_MAC_DINH[i % MAU_MAC_DINH.length]
          return (
            <button key={z.zoneId} type="button" aria-hidden="true" tabIndex={-1}
              onClick={() => onChon(dang ? null : z.zoneId)}
              className={`absolute flex flex-col items-center justify-center gap-0.5 px-1 border-2 overflow-hidden transition-colors ${dang ? 'border-lamp z-10' : 'border-transparent hover:border-lamp/60'} ${het ? 'opacity-40' : ''}`}
              style={{
                left: `${((z.layout2DX - vung.x) / vung.w) * 100}%`,
                top: `${((z.layout2DY - vung.y) / vung.h) * 100}%`,
                width: `${((z.layout2DWidth ?? 12) / vung.w) * 100}%`,
                height: `${((z.layout2DHeight ?? 12) / vung.h) * 100}%`,
                transform: `rotate(${z.layout2DRotationDeg ?? 0}deg)`,
                backgroundColor: `color-mix(in srgb, ${mau} ${dang ? 70 : 38}%, #2A1F18)`,
              }}>
              <span className="text-xs sm:text-sm font-semibold text-stock leading-tight text-center line-clamp-2">{hangVe[z.zoneId] ?? z.name}</span>
              <span className="font-mono text-xs text-stock/80">{[khoangGia(z), nhanConLai(z)].filter(Boolean).join(' · ')}</span>
            </button>
          )
        })}
      </div>
    </div>
  )
}

// hangVeTheoKhu { [zoneId]: tên hạng vé } + onTaiKhu({ [zoneId]: tên khu }) — MLACP-589: mỗi khu một hạng vé, nên sơ đồ in
// TÊN HẠNG VÉ và giá ngay trên khu, và chạm khu là chọn luôn hạng vé đó (ShowMap.chonKhu).
const SeatingMapView = ({ showId, loungeId, tenPhongTra = '', selectedZoneId, onSelectZone, hangVeTheoKhu = KHONG_HANG_VE, onTaiKhu }) => {
  const [data, setData] = useState(null)
  const [canh, setCanh] = useState([])
  const [matBang, setMatBang] = useState(null)
  const [khuPhongTra, setKhuPhongTra] = useState([]) // khu của PHÒNG TRÀ — chỉ dùng khi buổi chưa có hạng vé gắn khu
  const [isLoading, setIsLoading] = useState(true)
  const [dangXem, setDangXem] = useState(null)
  const [lanDatLai, setLanDatLai] = useState(0)
  const [co3D, setCo3D] = useState(true)
  // Gọi báo tên khu qua ref: hàm của cha đổi mỗi lần vẽ, không được kéo effect tải dữ liệu chạy lại.
  const onTaiKhuRef = useRef(onTaiKhu)
  useEffect(() => { onTaiKhuRef.current = onTaiKhu })
  const khongHoTro = useCallback(() => setCo3D(false), [])

  useEffect(() => {
    if (!showId) return undefined
    let huy = false
    const chay = async () => {
      setIsLoading(true)
      // Tour lỗi không được làm mất sơ đồ (và ngược lại) — tải song song, mỗi bên tự rơi về rỗng.
      const [sd, tour, kpt] = await Promise.allSettled([
        getShowSeatingMap(showId),
        loungeId ? getLoungeTour(loungeId) : Promise.resolve(null),
        loungeId ? getLoungeZones(loungeId) : Promise.resolve(null),
      ])
      if (huy) return
      const duLieu = sd.status === 'fulfilled' && sd.value?.success ? sd.value.data : null
      setData(duLieu)
      onTaiKhuRef.current?.(Object.fromEntries((duLieu?.zones ?? []).map((z) => [z.zoneId, z.name])))
      setMatBang(tour.status === 'fulfilled' && tour.value?.success ? tour.value.data?.floorPlanImageUrl ?? null : null)
      setKhuPhongTra(kpt.status === 'fulfilled' && kpt.value?.success && Array.isArray(kpt.value.data) ? kpt.value.data : [])
      setCanh(tour.status === 'fulfilled' && tour.value?.success ? tour.value.data?.scenes ?? [] : [])
      setIsLoading(false)
    }
    chay()
    return () => { huy = true }
  }, [showId, loungeId])

  const zones = useMemo(() => data?.zones ?? [], [data])
  const khuViTri = useMemo(() => zones.filter(coViTri), [zones])
  // SoDoCho3D đọc hình dạng khu của trang phòng trà (id/name/layoutColor) — đổi tên trường, không đổi dữ liệu.
  // `nhan` = chữ in trên khu trong 3D: tên hạng vé (kiểu bàn ghế vẫn đoán theo TÊN KHU — xem SoDoCho3D).
  const khu3D = useMemo(() => khuViTri.map((z) => ({ ...z, id: z.zoneId, layoutColor: z.color, nhan: hangVeTheoKhu[z.zoneId] ?? z.name })), [khuViTri, hangVeTheoKhu])
  const khuBan = useMemo(() => new Set(zones.map((z) => z.zoneId)), [zones])
  const soDiemKhu = canh.reduce((n, s) => n + (s.hotspots ?? []).filter((h) => h.type === 'Zone' && khuBan.has(h.zoneId)).length, 0)

  const cachXem = useMemo(() => [
    khuViTri.length > 0 && { khoa: '2d', nhan: '2D', Icon: IconMap },
    khuViTri.length > 0 && { khoa: '3d', nhan: '3D', Icon: Armchair },
    canh.length > 0 && { khoa: '360', nhan: '360°', Icon: Rotate3d },
  ].filter(Boolean), [khuViTri.length, canh.length])
  const dsKhoa = useMemo(() => cachXem.map((c) => c.khoa), [cachXem])
  const khoa = cachXem.find((c) => c.khoa === dangXem)?.khoa ?? dsKhoa[0]
  const phimTab = usePhimTab(dsKhoa, khoa, setDangXem)

  if (isLoading) {
    return <div className="bg-card border border-line py-16 flex justify-center"><Loader2 size={26} className="animate-spin text-ink" /></div>
  }
  // BUỔI CHƯA CÓ HẠNG VÉ NÀO GẮN KHU (04/10/2026). Bản trước `return null`: màn đặt vé không có sơ đồ lẫn 360° dù trang
  // phòng trà có đủ — chủ dự án: "bên chỗ đặt vé là chỗ đặc biệt cần được xem". API sơ đồ của buổi chỉ trả khu ĐÃ gắn vào
  // hạng vé (GetShowSeatingMapQueryHandler: `.Where(t => t.ZoneId.HasValue)`), nên ở đây dùng khu và tour của PHÒNG TRÀ ở
  // chế độ CHỈ XEM: không có gì để chọn (không hạng vé nào thuộc khu nào), và nói rõ điều đó thay vì giả là chọn được.
  if (zones.length === 0) {
    return (
      <KhongGianPhongTra zones={khuPhongTra} tourScenes={canh.filter((s) => s.imageUrl)} tenPhongTra={tenPhongTra} anhMatBang={matBang ?? data?.areaLayoutImageUrl ?? null}
        lop="bg-card border border-line p-4 md:p-6"
        ghiChu="Buổi này chưa bán vé theo từng khu: hình dưới đây để bạn xem không gian phòng trà. Chọn hạng vé ở danh sách bên dưới." />
    )
  }

  const chon = (id) => onSelectZone?.(id)
  const goiY = {
    '2d': 'Mỗi khu là một hạng vé. Chạm một khu trên sơ đồ hoặc trong danh sách để chọn vé của khu đó.',
    '3d': 'Mỗi khu là một hạng vé. Kéo để xoay, cuộn để phóng to; chạm một khu để chọn vé của khu đó.',
    '360': soDiemKhu > 0
      ? 'Nhìn quanh phòng trà; chạm nhãn có biểu tượng ghế để chọn khu đó.'
      : 'Ảnh 360° chưa được đánh dấu khu — nhìn không gian ở đây, chọn khu ở danh sách bên cạnh.',
  }

  return (
    <section aria-labelledby="chon-khu-td" className="bg-card border border-line p-4 md:p-6">
      <div className="flex flex-wrap items-end justify-between gap-3 mb-2">
        <h3 id="chon-khu-td" className="text-lg font-bold text-ink">Chọn khu</h3>
        {cachXem.length > 1 && (
          <div role="tablist" aria-label="Cách xem sơ đồ" className="inline-flex border-2 border-ink">
            {cachXem.map((c) => (
              <button key={c.khoa} type="button" role="tab" {...phimTab(c.khoa)} id={`xem-khu-${c.khoa}`}
                aria-selected={c.khoa === khoa} aria-controls="chon-khu-panel" onClick={() => setDangXem(c.khoa)}
                className={`inline-flex items-center gap-1.5 min-h-[44px] px-3.5 text-sm font-semibold transition-colors ${c.khoa === khoa ? 'bg-ink text-lamp' : 'text-ink hover:bg-sunken'}`}>
                <c.Icon size={16} strokeWidth={1.75} aria-hidden="true" /> {c.nhan}
              </button>
            ))}
          </div>
        )}
      </div>
      {khoa && <p className="text-sm text-ink-soft mb-4">{goiY[khoa]}</p>}

      <div className={`grid gap-5 ${khoa ? 'lg:grid-cols-[minmax(0,1fr)_19rem]' : ''}`}>
        {khoa && (
          <div id="chon-khu-panel" role={cachXem.length > 1 ? 'tabpanel' : undefined} aria-labelledby={cachXem.length > 1 ? `xem-khu-${khoa}` : 'chon-khu-td'}
            className="relative w-full aspect-[4/3] sm:aspect-video border-2 border-ink bg-board overflow-hidden">
            {khoa === '2d' && <SoDo2D zones={khuViTri} chon={selectedZoneId} onChon={chon} hangVe={hangVeTheoKhu} />}
            {khoa === '3d' && (co3D ? (
              <Suspense fallback={CHO}>
                <SoDoCho3D zones={khu3D} chon={selectedZoneId} onChon={chon} lanDatLai={lanDatLai} onKhongHoTro={khongHoTro} />
              </Suspense>
            ) : (
              <p className="absolute inset-0 grid place-items-center p-6 text-center text-lamp-mute text-sm">Trình duyệt này không dựng được hình 3D — chọn khu ở danh sách bên cạnh.</p>
            ))}
            {khoa === '3d' && co3D && (
              <button type="button" onClick={() => setLanDatLai((n) => n + 1)}
                className="absolute bottom-2 right-2 z-10 inline-flex items-center gap-1.5 min-h-[44px] px-3 bg-board/80 text-lamp text-sm font-semibold hover:text-stock">
                <RotateCcw size={16} strokeWidth={1.75} aria-hidden="true" /> Góc nhìn ban đầu
              </button>
            )}
            {khoa === '360' && (
              <Suspense fallback={CHO}>
                <PanoramaViewer scenes={canh} className="w-full h-full" autoRotate={false}
                  onChonKhu={(id) => chon(id === selectedZoneId ? null : id)} khuDangChon={selectedZoneId} khuBan={khuBan} />
              </Suspense>
            )}
          </div>
        )}

        <div>
          <ul className="border-t-2 border-ink" aria-label="Các khu đang bán vé">
            {zones.map((z, i) => {
              const dang = z.zoneId === selectedZoneId
              const gia = khoangGia(z)
              return (
                <li key={z.zoneId} className="border-b border-ink/20">
                  <button type="button" aria-pressed={dang} onClick={() => chon(dang ? null : z.zoneId)}
                    className={`w-full flex items-center gap-3 min-h-[52px] px-3 py-2 text-left transition-colors ${dang ? 'bg-ink text-lamp' : 'hover:bg-sunken'}`}>
                    <span aria-hidden="true" className="w-4 h-4 flex-shrink-0 border border-ink/30" style={{ backgroundColor: z.color || MAU_MAC_DINH[i % MAU_MAC_DINH.length] }} />
                    <span className="flex-1 min-w-0">
                      <span className="block font-semibold truncate">{hangVeTheoKhu[z.zoneId] ?? z.name}</span>
                      {hangVeTheoKhu[z.zoneId] && hangVeTheoKhu[z.zoneId] !== z.name && <span className={`block text-xs truncate ${dang ? 'text-lamp/80' : 'text-ink-soft'}`}>{z.name}</span>}
                      <span className={`block font-mono text-xs ${dang ? 'text-lamp/80' : 'text-ink-mute'}`}>{gia && `${gia} · `}{nhanConLai(z)}</span>
                    </span>
                  </button>
                </li>
              )
            })}
          </ul>
          {selectedZoneId != null && (
            <button type="button" onClick={() => chon(null)}
              className="mt-3 inline-flex items-center min-h-[44px] px-3 text-sm font-semibold text-ink hover:bg-sunken">
              Bỏ chọn khu
            </button>
          )}
        </div>
      </div>
    </section>
  )
}

export default SeatingMapView
