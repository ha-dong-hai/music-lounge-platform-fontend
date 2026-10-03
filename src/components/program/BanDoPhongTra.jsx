// src/components/program/BanDoPhongTra.jsx
//
// PHÒNG TRÀ TRÊN BẢN ĐỒ (trang chủ, 03/10/2026) — bản đồ thật (OpenStreetMap + Leaflet, chủ dự án chọn) ghim từng phòng
// trà kèm đêm diễn kế tiếp; bên cạnh là danh sách (đường bàn phím/trình đọc màn hình, và chỗ cho phòng trà chưa có toạ độ).
// Cảm hứng: "Concerts near you" của Songkick, duyệt theo nơi của Eventbrite (reports/Trang chủ - buổi diễn nổi bật.md).
//
// GIỚI HẠN ĐÃ BIẾT (ghi rõ, không giấu):
//  - /lounges (danh sách) KHÔNG trả latitude/longitude → HomePage gọi chi tiết TỪNG phòng trà (5 = 5 lượt, song song; dùng
//    chung với DemDaQua) và truyền vào qua `chiTiet`.
//    Trần: vài chục phòng trà. Đường nâng cấp: thêm Latitude/Longitude vào LoungeListItemDto ở backend rồi bỏ vòng gọi này.
//  - Danh sách buổi diễn không có loungeId → "đêm kế tiếp" ghép theo TÊN phòng trà (như bảng giờ diễn ghép ảnh).
//  - Ô bản đồ lấy từ tile.openstreetmap.org: miễn phí, phải ghi "© OpenStreetMap", chính sách OSM không cho tải nặng.
//    Lên production đông người → đổi sang nhà cung cấp ô bản đồ có hợp đồng (chỉ đổi URL ô).
//  - Phòng trà chưa có toạ độ (Ánh Dương, 03/10) không ghim được — danh sách vẫn in, kèm câu "chưa có vị trí".
// HIỆU NĂNG: Leaflet + CSS chỉ tải khi khối sắp vào màn hình (IntersectionObserver). Cuộn trang không bị bản đồ "nuốt":
// tắt phóng bằng con lăn (scrollWheelZoom false), dùng nút +/−.
import { useEffect, useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { thuVietHoa, ngayGon, gioTrongNgay } from '../../utils/ngayVietNam'
import CuongDatVe from './CuongDatVe'

const TAM_SAI_GON = [10.7769, 106.7009]

const BanDoPhongTra = ({ phongTra = [], buoi = [], chiTiet = {} }) => {
  const khungRef = useRef(null)
  const navigate = useNavigate()
  const [gan, setGan] = useState(false)
  const [loiBanDo, setLoiBanDo] = useState(false)

  // Chỉ tải Leaflet khi khối sắp vào màn hình.
  useEffect(() => {
    const el = khungRef.current
    if (!el || gan) return undefined
    const io = new IntersectionObserver(([e]) => { if (e.isIntersecting) { setGan(true); io.disconnect() } }, { rootMargin: '300px' })
    io.observe(el)
    return () => io.disconnect()
  }, [gan])

  const keTiep = (l) => buoi.find((b) => b.loungeName === l.name) ?? null
  const coToaDo = phongTra.filter((l) => chiTiet[l.id]?.lat != null && chiTiet[l.id]?.lng != null)

  useEffect(() => {
    if (!gan || !khungRef.current) return undefined
    let map = null
    let huy = false
    Promise.all([import('leaflet'), import('leaflet/dist/leaflet.css')]).then(([{ default: L }]) => {
      if (huy || !khungRef.current) return
      map = L.map(khungRef.current, { scrollWheelZoom: false, attributionControl: true }).setView(TAM_SAI_GON, 14)
      L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19,
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
      }).addTo(map)
      const diem = []
      coToaDo.forEach((l) => {
        const { lat, lng } = chiTiet[l.id]
        const b = keTiep(l)
        // Nhãn dựng bằng textContent — tên phòng trà là dữ liệu người dùng nhập, không chèn thành HTML.
        const nhan = document.createElement('span')
        nhan.className = `ghim-phong-tra${b ? ' co-dem' : ''}`
        nhan.textContent = l.name.replace(/^Phòng trà\s+/i, '') + (b ? ` · ${ngayGon(b.start_date)}` : '')
        const icon = L.divIcon({ html: nhan, className: '', iconSize: null, iconAnchor: [0, 0] })
        L.marker([lat, lng], { icon, title: l.name, keyboard: false }).addTo(map)
          .on('click', () => navigate(`/lounge/${l.id}`))
        diem.push([lat, lng])
      })
      if (diem.length > 1) map.fitBounds(diem, { paddingTopLeft: [90, 48], paddingBottomRight: [90, 24], maxZoom: 15 }) // lề ngang rộng hơn: nhãn ghim dài, bản 48px cắt "Aqua" ở mép trái (đo 03/10)
      else if (diem.length === 1) map.setView(diem[0], 15)
    }).catch(() => { if (!huy) setLoiBanDo(true) })
    return () => { huy = true; map?.remove() }
    // coToaDo/keTiep suy từ chiTiet + buoi: dựng lại bản đồ khi hai thứ đó đổi.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [gan, chiTiet, buoi])

  if (phongTra.length === 0) return null

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1.25fr)_minmax(0,1fr)]">
      <div className="relative border-2 border-ink bg-sunken aspect-[4/3] lg:aspect-auto lg:min-h-[440px]">
        <div ref={khungRef} role="region" aria-label="Bản đồ các phòng trà ở Sài Gòn" className="absolute inset-0 ban-do-giay" />
        {loiBanDo && <p className="absolute inset-0 grid place-items-center p-6 text-center text-sm text-ink-mute">Chưa tải được bản đồ — danh sách bên cạnh vẫn đủ địa chỉ.</p>}
      </div>
      <ul className="border-t-2 border-ink">
        {phongTra.map((l) => {
          const b = keTiep(l)
          const ct = chiTiet[l.id]
          return (
            <li key={l.id} className="flex flex-wrap items-center justify-between gap-x-4 gap-y-3 py-4 border-b border-ink/20">
              <div className="min-w-0 flex-1 basis-56">
                <Link to={`/lounge/${l.id}`} className="font-semibold hover:underline">{l.name}</Link>
                <p className="text-sm text-ink-mute">
                  {ct?.diaChi || [l.street, l.district, l.city].filter(Boolean).join(', ')}
                  {ct && ct.lat == null && ' · chưa có vị trí trên bản đồ'}
                </p>
                <p className="font-mono text-sm mt-0.5">
                  {b ? `Đêm kế: ${thuVietHoa(b.start_date)} ${ngayGon(b.start_date)} · ${gioTrongNgay(b.start_date)}` : 'Chưa có đêm diễn mới'}
                </p>
              </div>
              {b && <CuongDatVe to={`/shows/${b.id}`} gia={b.price || null} />}
            </li>
          )
        })}
      </ul>
    </div>
  )
}

export default BanDoPhongTra
