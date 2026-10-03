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
//    nhận Tab (roving tabindex) — dùng chung hook usePhimTab với trang buổi diễn và Vé của tôi.
//  - Mỗi lúc chỉ dựng MỘT cách xem: hai cảnh WebGL cùng lúc là gấp đôi bộ nhớ GPU cho thứ khách không nhìn.
//  - Cả hai đều tải lười: three.js chỉ tải khi khối này hiện trên trang.
//  - Danh sách khu bên cạnh sơ đồ 3D là đường tương đương bàn phím/trình đọc màn hình (canvas aria-hidden), và là chỗ
//    duy nhất ghi đủ sức chứa + mô tả của khu.
import { lazy, Suspense, useCallback, useMemo, useState } from 'react'
import { Armchair, Rotate3d, RotateCcw } from 'lucide-react'
import usePhimTab from '../../hooks/usePhimTab'

const SoDoCho3D = lazy(() => import('./SoDoCho3D'))
const PanoramaViewer = lazy(() => import('./PanoramaViewer'))

const coSoDo2D = (z) => z.layout2DX != null && z.layout2DY != null

const CHO = (
  <div className="absolute inset-0 grid place-items-center bg-board text-lamp-mute text-sm" aria-busy="true">Đang dựng không gian…</div>
)

// NỐI 3D ↔ 360 (03/10/2026, chủ dự án: "chưa thấy được sự liên kết của view 360 với sơ đồ khu vực"): cảnh 360 nào chủ
// phòng trà đã đặt vị trí trên mặt bằng (positionX/Y, cùng hệ % với Layout2D) thì (1) hiện GHIM trên sơ đồ 3D — bấm mở
// tab 360 đúng cảnh đó; (2) trong 360 có BẢN ĐỒ NHỎ (PanoramaViewer › BanDoNho) chỉ chỗ đang đứng giữa các khu.
// Cảnh chưa đặt vị trí vẫn xem được ở tab 360, chỉ không có ghim.
const MAU_KHU = ['#C9A45C', '#8C7A6B', '#B3A899', '#6E5E50']
// lop / ghiChu: màn đặt vé (SeatingMapView) dùng lại khối này ở chế độ CHỈ XEM khi buổi diễn chưa có hạng vé nào gắn khu —
// bỏ khoảng đệm trên của trang phòng trà và in một dòng nói rõ vì sao không chọn khu được ở đây.
const KhongGianPhongTra = ({ zones = [], tourScenes = [], tenPhongTra = '', anhMatBang = null, lop = 'pt-16', ghiChu = null }) => {
  const khu = useMemo(() => zones.filter((z) => z.isActive !== false && coSoDo2D(z))
    .sort((a, b) => (a.displayOrder ?? 0) - (b.displayOrder ?? 0)), [zones])
  const cachXem = useMemo(() => [
    khu.length > 0 && { khoa: '3d', nhan: 'Sơ đồ chỗ ngồi 3D', Icon: Armchair, goiY: 'Kéo để xoay, cuộn hoặc chụm hai ngón để phóng to, chạm một khu để xem sức chứa.' },
    tourScenes.length > 0 && { khoa: '360', nhan: 'Tham quan 360°', Icon: Rotate3d, goiY: 'Đứng giữa phòng trà nhìn quanh: kéo để xoay, cuộn để phóng to.' },
  ].filter(Boolean), [khu.length, tourScenes.length])

  const [dangXem, setDangXem] = useState(null)
  const [canhMo, setCanhMo] = useState(null) // cảnh 360 mở từ ghim trên sơ đồ 3D
  const diem360 = useMemo(() => tourScenes.filter((s) => s.positionX != null && s.positionY != null)
    .map((s, i) => ({ id: s.id, ten: s.name || `Cảnh ${i + 1}`, x: s.positionX, y: s.positionY })), [tourScenes])
  const banDoNho = useMemo(() => ({
    anhMatBang,
    khu: khu.map((z, i) => ({ id: z.id, ten: z.name, x: z.layout2DX, y: z.layout2DY, w: z.layout2DWidth ?? 12, h: z.layout2DHeight ?? 12, mau: z.layoutColor || MAU_KHU[i % MAU_KHU.length] })),
  }), [anhMatBang, khu])
  const moCanh = useCallback((id) => { setCanhMo(id); setDangXem('360') }, [])
  const [chon, setChon] = useState(null)
  const [lanDatLai, setLanDatLai] = useState(0)
  const [co3D, setCo3D] = useState(true)
  const khongHoTro = useCallback(() => setCo3D(false), [])
  const dsKhoa = useMemo(() => cachXem.map((c) => c.khoa), [cachXem])
  const khoaHienTai = cachXem.find((c) => c.khoa === dangXem)?.khoa ?? dsKhoa[0]
  const phimTab = usePhimTab(dsKhoa, khoaHienTai, setDangXem) // gọi trước return sớm — luật hook

  if (cachXem.length === 0) return null
  const hienTai = cachXem.find((c) => c.khoa === khoaHienTai)
  const khuChon = khu.find((z) => z.id === chon)

  return (
    <section aria-labelledby="khong-gian-title" className={lop}>
      <div className="flex flex-wrap items-end justify-between gap-4 mb-2">
        <h2 id="khong-gian-title" className="text-4xl">Không gian và chỗ ngồi</h2>
        {cachXem.length > 1 && (
          <div role="tablist" aria-label="Cách xem không gian" className="inline-flex border-2 border-ink">
            {cachXem.map((c) => {
              const dang = c.khoa === hienTai.khoa
              return (
                <button key={c.khoa} type="button" role="tab" {...phimTab(c.khoa)}
                  id={`xem-${c.khoa}`} aria-selected={dang} aria-controls="khong-gian-panel"
                  onClick={() => setDangXem(c.khoa)}
                  className={`inline-flex items-center gap-2 min-h-[48px] px-4 text-sm font-semibold transition-colors ${dang ? 'bg-ink text-lamp' : 'text-ink hover:bg-card'}`}>
                  <c.Icon size={18} strokeWidth={1.75} aria-hidden="true" /> {c.nhan}
                </button>
              )
            })}
          </div>
        )}
      </div>
      {ghiChu && <p className="mb-3 border-l-4 border-ink pl-3 text-ink">{ghiChu}</p>}
      <p className="text-ink-soft mb-5">{hienTai.goiY}</p>

      <div id="khong-gian-panel" role={cachXem.length > 1 ? 'tabpanel' : undefined} aria-labelledby={cachXem.length > 1 ? `xem-${hienTai.khoa}` : 'khong-gian-title'}>
        {hienTai.khoa === '3d' && (
          <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_20rem]">
            <div className="relative w-full aspect-[4/3] sm:aspect-video border-2 border-ink bg-board overflow-hidden">
              {co3D ? (
                <Suspense fallback={CHO}>
                  <SoDoCho3D zones={khu} chon={chon} onChon={setChon} lanDatLai={lanDatLai} onKhongHoTro={khongHoTro}
                    diem360={diem360} onChonDiem={moCanh} />
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
                        style={{ backgroundColor: z.layoutColor || MAU_KHU[i % MAU_KHU.length] }} />
                      <span className="flex-1 min-w-0 truncate font-semibold">{z.name}</span>
                      <span className="font-mono text-sm whitespace-nowrap">{z.capacity} chỗ</span>
                    </button>
                  </li>
                ))}
              </ul>
              {diem360.length > 0 && (
                <div className="mt-5">
                  <h3 className="text-base font-bold mb-2">Đứng tại chỗ xem 360°</h3>
                  <ul className="flex flex-wrap gap-2">
                    {diem360.map((d) => (
                      <li key={d.id}>
                        <button type="button" onClick={() => moCanh(d.id)}
                          className="inline-flex items-center gap-1.5 min-h-[44px] px-3 border-2 border-ink text-sm font-semibold hover:bg-ink hover:text-lamp">
                          <Rotate3d size={16} strokeWidth={1.75} aria-hidden="true" /> {d.ten}
                        </button>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              {khuChon && (
                <div className="mt-4 border-2 border-ink bg-card p-4" aria-live="polite">
                  <p className="font-display text-2xl leading-tight">{khuChon.name}</p>
                  <p className="font-mono text-sm mt-1">Sức chứa {khuChon.capacity} chỗ</p>
                  {khuChon.description && <p className="text-ink-soft mt-2">{khuChon.description}</p>}
                  <p className="text-xs text-ink-mute mt-2">Bàn ghế trên hình 3D là minh hoạ cách bày trong khu, không đếm từng chỗ — sức chứa thật là con số ở trên.</p>
                  <p className="text-xs text-ink-mute mt-2">Giá vé theo từng buổi diễn — xem ở trang buổi diễn.</p>
                </div>
              )}
            </div>
          </div>
        )}

        {hienTai.khoa === '360' && (
          <Suspense fallback={<div className="w-full aspect-video border-2 border-ink/20 bg-ink/5 animate-pulse" aria-busy="true" aria-label="Đang tải trình xem 360°" />}>
            <PanoramaViewer key={canhMo ?? 'dau'} scenes={tourScenes} initialSceneId={canhMo} banDoNho={banDoNho} className="w-full aspect-video border-2 border-ink" />
          </Suspense>
        )}
      </div>
    </section>
  )
}

export default KhongGianPhongTra
