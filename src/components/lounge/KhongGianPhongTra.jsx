// src/components/lounge/KhongGianPhongTra.jsx
//
// KHÔNG GIAN VÀ CHỖ NGỒI — một khối trên trang phòng trà, khách TỰ CHỌN cách xem (03/10/2026, chủ dự án):
//  - "Sơ đồ chỗ ngồi 3D" (SoDoCho3D): các khu nổi thành bục, số ghế = sức chứa, xoay/phóng to, chạm để chọn khu.
//  - "Tham quan 360°" (PanoramaViewer có sẵn): đứng giữa phòng trà nhìn quanh.
// Thay khối "Tham quan 360°" đứng riêng trước đây.
//
// QUY TẮC:
//  - Chỉ in những cách xem CÓ dữ liệu: khu nào có vị trí 2D mới dựng 3D; tour cần ít nhất một cảnh. Một cách xem → không
//    in nút chuyển (chọn một trong một là thừa). Không cách xem nào → không in khối.
//  - Nút chuyển là tablist theo WAI-ARIA APG (Tabs, kích hoạt tự động): mũi tên trái/phải, Home/End; chỉ tab đang chọn
//    nhận Tab (roving tabindex). Tablist có sẵn ở EventDetailPage chưa có phím mũi tên — chưa sửa ở đây.
//  - Mỗi lúc chỉ dựng MỘT cách xem: hai cảnh WebGL cùng lúc là gấp đôi bộ nhớ GPU cho thứ khách không nhìn.
//  - Cả hai đều tải lười: three.js chỉ tải khi khối này hiện trên trang.
//  - Danh sách khu bên cạnh sơ đồ 3D là đường tương đương bàn phím/trình đọc màn hình (canvas aria-hidden), và là chỗ
//    duy nhất ghi đủ sức chứa + mô tả của khu.
import { lazy, Suspense, useCallback, useMemo, useRef, useState } from 'react'
import { Armchair, Rotate3d, RotateCcw } from 'lucide-react'

const SoDoCho3D = lazy(() => import('./SoDoCho3D'))
const PanoramaViewer = lazy(() => import('./PanoramaViewer'))

const SO_GHE_TOI_DA = 80 // khớp SoDoCho3D — để ghi chú khi khu đông hơn số ghế vẽ được
const coSoDo2D = (z) => z.layout2DX != null && z.layout2DY != null

const CHO = (
  <div className="absolute inset-0 grid place-items-center bg-board text-lamp-mute text-sm" aria-busy="true">Đang dựng không gian…</div>
)

const KhongGianPhongTra = ({ zones = [], tourScenes = [], tenPhongTra = '' }) => {
  const khu = useMemo(() => zones.filter((z) => z.isActive !== false && coSoDo2D(z))
    .sort((a, b) => (a.displayOrder ?? 0) - (b.displayOrder ?? 0)), [zones])
  const cachXem = useMemo(() => [
    khu.length > 0 && { khoa: '3d', nhan: 'Sơ đồ chỗ ngồi 3D', Icon: Armchair, goiY: 'Kéo để xoay, cuộn hoặc chụm hai ngón để phóng to, chạm một khu để xem sức chứa.' },
    tourScenes.length > 0 && { khoa: '360', nhan: 'Tham quan 360°', Icon: Rotate3d, goiY: 'Đứng giữa phòng trà nhìn quanh: kéo để xoay, cuộn để phóng to.' },
  ].filter(Boolean), [khu.length, tourScenes.length])

  const [dangXem, setDangXem] = useState(null)
  const [chon, setChon] = useState(null)
  const [lanDatLai, setLanDatLai] = useState(0)
  const [co3D, setCo3D] = useState(true)
  const tabRef = useRef({})
  const khongHoTro = useCallback(() => setCo3D(false), [])

  if (cachXem.length === 0) return null
  const hienTai = cachXem.find((c) => c.khoa === dangXem) ?? cachXem[0]
  const khuChon = khu.find((z) => z.id === chon)

  const phim = (e, i) => {
    const n = cachXem.length
    const toi = { ArrowRight: (i + 1) % n, ArrowLeft: (i - 1 + n) % n, Home: 0, End: n - 1 }[e.key]
    if (toi == null) return
    e.preventDefault()
    setDangXem(cachXem[toi].khoa); tabRef.current[cachXem[toi].khoa]?.focus()
  }

  return (
    <section aria-labelledby="khong-gian-title" className="pt-16">
      <div className="flex flex-wrap items-end justify-between gap-4 mb-2">
        <h2 id="khong-gian-title" className="text-4xl">Không gian và chỗ ngồi</h2>
        {cachXem.length > 1 && (
          <div role="tablist" aria-label="Cách xem không gian" className="inline-flex border-2 border-ink">
            {cachXem.map((c, i) => {
              const dang = c.khoa === hienTai.khoa
              return (
                <button key={c.khoa} ref={(el) => { tabRef.current[c.khoa] = el }} type="button" role="tab"
                  id={`xem-${c.khoa}`} aria-selected={dang} aria-controls="khong-gian-panel" tabIndex={dang ? 0 : -1}
                  onClick={() => setDangXem(c.khoa)} onKeyDown={(e) => phim(e, i)}
                  className={`inline-flex items-center gap-2 min-h-[48px] px-4 text-sm font-semibold transition-colors ${dang ? 'bg-ink text-lamp' : 'text-ink hover:bg-card'}`}>
                  <c.Icon size={18} strokeWidth={1.75} aria-hidden="true" /> {c.nhan}
                </button>
              )
            })}
          </div>
        )}
      </div>
      <p className="text-ink-soft mb-5">{hienTai.goiY}</p>

      <div id="khong-gian-panel" role={cachXem.length > 1 ? 'tabpanel' : undefined} aria-labelledby={cachXem.length > 1 ? `xem-${hienTai.khoa}` : 'khong-gian-title'}>
        {hienTai.khoa === '3d' && (
          <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_20rem]">
            <div className="relative w-full aspect-[4/3] sm:aspect-video border-2 border-ink bg-board overflow-hidden">
              {co3D ? (
                <Suspense fallback={CHO}>
                  <SoDoCho3D zones={khu} chon={chon} onChon={setChon} lanDatLai={lanDatLai} onKhongHoTro={khongHoTro} />
                </Suspense>
              ) : (
                <p className="absolute inset-0 grid place-items-center p-6 text-center text-lamp-mute text-sm">
                  Trình duyệt này không dựng được hình 3D. Danh sách khu bên cạnh vẫn đủ thông tin.
                </p>
              )}
              {co3D && (
                <button type="button" onClick={() => setLanDatLai((n) => n + 1)}
                  className="absolute bottom-2 right-2 z-10 inline-flex items-center gap-1.5 min-h-[44px] px-3 bg-board/80 text-lamp text-sm font-semibold hover:text-stock">
                  <RotateCcw size={16} strokeWidth={1.75} aria-hidden="true" /> Góc nhìn ban đầu
                </button>
              )}
            </div>

            <div>
              <h3 className="text-base font-bold mb-2">Các khu của {tenPhongTra}</h3>
              <ul className="border-t-2 border-ink">
                {khu.map((z, i) => (
                  <li key={z.id} className="border-b border-ink/20">
                    <button type="button" aria-pressed={z.id === chon} onClick={() => setChon((v) => (v === z.id ? null : z.id))}
                      className={`w-full flex items-center gap-3 min-h-[48px] px-3 text-left transition-colors ${z.id === chon ? 'bg-ink text-lamp' : 'hover:bg-card'}`}>
                      <span aria-hidden="true" className="w-4 h-4 flex-shrink-0 border border-ink/30"
                        style={{ backgroundColor: z.layoutColor || ['#C9A45C', '#8C7A6B', '#B3A899', '#6E5E50'][i % 4] }} />
                      <span className="flex-1 min-w-0 truncate font-semibold">{z.name}</span>
                      <span className="font-mono text-sm whitespace-nowrap">{z.capacity} chỗ</span>
                    </button>
                  </li>
                ))}
              </ul>
              {khuChon && (
                <div className="mt-4 border-2 border-ink bg-card p-4" aria-live="polite">
                  <p className="font-display text-2xl leading-tight">{khuChon.name}</p>
                  <p className="font-mono text-sm mt-1">Sức chứa {khuChon.capacity} chỗ</p>
                  {khuChon.description && <p className="text-ink-soft mt-2">{khuChon.description}</p>}
                  {khuChon.capacity > SO_GHE_TOI_DA && (
                    <p className="text-xs text-ink-mute mt-2">Hình 3D vẽ tối đa {SO_GHE_TOI_DA} ghế mỗi khu cho nhẹ máy; sức chứa thật là {khuChon.capacity}.</p>
                  )}
                  <p className="text-xs text-ink-mute mt-2">Giá vé theo từng buổi diễn — xem ở trang buổi diễn.</p>
                </div>
              )}
            </div>
          </div>
        )}

        {hienTai.khoa === '360' && (
          <Suspense fallback={<div className="w-full aspect-video border-2 border-ink/20 bg-ink/5 animate-pulse" aria-busy="true" aria-label="Đang tải trình xem 360°" />}>
            <PanoramaViewer scenes={tourScenes} className="w-full aspect-video border-2 border-ink" />
          </Suspense>
        )}
      </div>
    </section>
  )
}

export default KhongGianPhongTra
