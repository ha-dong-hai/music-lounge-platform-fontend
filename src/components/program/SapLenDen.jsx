// src/components/program/SapLenDen.jsx
//
// SẮP LÊN ĐÈN (trang chủ, 03/10/2026) — MỘT buổi gần nhất CHƯA diễn tối nay, in thật lớn.
// Bỏ phần "Tiếp theo" (03/10, chủ dự án chọn phương án A khi thêm khối Dành cho bạn / Đang được quan tâm): các buổi còn lại
// nằm ở khối đó, xếp theo gu hoặc độ quan tâm — mỗi buổi chỉ in MỘT lần trên trang (GoiYChoBan loại buổi này ra).
// Vì sao: trang chủ chỉ có "Đêm nay" và "Lịch bảy ngày tới"; ngày 03/10 Azure có 2 buổi đang bán (22/10, 15/01) đều ngoài
// 7 ngày → trang chủ hiện 0 buổi diễn dù có vé bán. Mẫu "một nghệ sĩ nổi bật + danh sách theo ngày" của Village Vanguard
// và "Appearing tonight / Upcoming" của Blue Note (reports/Trang chủ - buổi diễn nổi bật.md) hợp khi số buổi còn ít.
//
// - "Gần nhất" là lý do chọn, đọc được ngay ở dòng đầu — không có ai "chọn hộ" (ý tưởng ban biên tập bị bỏ vì cần backend).
// - In đủ ngày giờ, nơi diễn, giá "từ", còn bao nhiêu vé (Baymard: thiếu giá/còn-hết làm người mua bỏ cuộc). Số vé lấy từ
//   sơ đồ khu (seating-map) — số thật; không có chữ "sắp hết", không đếm ngược (No-Pressure-Clock).
// - Người hát kèm câu giới thiệu: khách phòng trà chọn đêm theo AI HÁT (lịch phòng trà Saigon Times in tên ca sĩ).
//   Danh sách buổi chỉ có tên người hát → gọi chi tiết đúng MỘT buổi nổi bật; lỗi thì vẫn in tên, không chặn khối.
// - Ảnh: ảnh bìa buổi diễn; thiếu thì ảnh đại diện phòng trà (ghép theo tên, như bảng giờ diễn); thiếu nữa thì CoverFallback.
// - Không có buổi nào (sau khi bỏ buổi tối nay — "Đêm nay" đã in) → không in khối.
import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { getShowDetail, getShowSeatingMap } from '../../services/showServices'
import { thuVietHoa, ngayDayDu, khungGio } from '../../utils/ngayVietNam'
import CuongDatVe from './CuongDatVe'
import CoverFallback from '../shared/CoverFallback'

const SapLenDen = ({ buoi = [], anhPhongTra = {} }) => {
  const noiBat = buoi[0] ?? null
  const [chiTiet, setChiTiet] = useState(null) // { id, nguoiHat: [{ten, gioiThieu}], diaChi, conVe, soKhu }

  useEffect(() => {
    if (!noiBat) return undefined
    let huy = false
    Promise.allSettled([getShowDetail(noiBat.id), getShowSeatingMap(noiBat.id)]).then(([ct, sd]) => {
      if (huy) return
      const d = ct.status === 'fulfilled' && ct.value?.success ? ct.value.data : null
      const khu = sd.status === 'fulfilled' && sd.value?.success ? sd.value.data?.zones ?? [] : []
      setChiTiet({
        id: noiBat.id,
        nguoiHat: (d?.performers ?? []).map((p) => ({ ten: p.name, gioiThieu: p.bio })),
        diaChi: [d?.lounge?.street, d?.lounge?.ward].filter(Boolean).join(', '),
        // availableCount null = khu có giá không giới hạn → không cộng được thành một con số, thì không in số.
        conVe: khu.length > 0 && khu.every((z) => z.availableCount != null) ? khu.reduce((n, z) => n + z.availableCount, 0) : null,
        soKhu: khu.length,
      })
    })
    return () => { huy = true }
  }, [noiBat])

  if (!noiBat) return null
  const ct = chiTiet?.id === noiBat.id ? chiTiet : null
  const anh = noiBat.thumbnail || anhPhongTra[noiBat.loungeName]
  const nguoiHat = ct?.nguoiHat.length ? ct.nguoiHat : noiBat.performers.map((ten) => ({ ten, gioiThieu: null }))

  return (
    <div className="bg-board text-lamp p-5 sm:p-8 lg:p-10">
      <div className="grid gap-7 lg:gap-10 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)] items-start">
        <Link to={`/shows/${noiBat.id}`} tabIndex={-1} aria-hidden="true" className="block aspect-[4/3] overflow-hidden border border-lamp/20 bg-board-soft">
          {anh ? <img src={anh} alt="" width="800" height="600" className="w-full h-full object-cover" /> : <CoverFallback />}
        </Link>
        <div className="min-w-0">
          <p className="font-mono text-sm text-lamp-mute">
            Gần nhất · {thuVietHoa(noiBat.start_date)} {ngayDayDu(noiBat.start_date)} · {khungGio(noiBat.start_date, noiBat.end_date)}
          </p>
          <h3 className="font-display font-normal text-[clamp(2.1rem,4.2vw,3.4rem)] leading-[1.02] mt-3 mb-4 break-words">
            <Link to={`/shows/${noiBat.id}`} className="hover:text-stock">{noiBat.title}</Link>
          </h3>
          {nguoiHat.length > 0 && (
            <ul className="space-y-1.5">
              {nguoiHat.map((p) => (
                <li key={p.ten}><span className="font-semibold">{p.ten}</span>{p.gioiThieu && <span className="text-lamp-mute"> — {p.gioiThieu}</span>}</li>
              ))}
            </ul>
          )}
          <p className="mt-4">{noiBat.loungeName}{ct?.diaChi && <span className="text-lamp-mute"> · {ct.diaChi}</span>}</p>
          {ct && ct.soKhu > 0 && (
            <p className="font-mono text-sm text-lamp-mute mt-1">{ct.soKhu} khu{ct.conVe != null && ` · còn ${ct.conVe} vé`}</p>
          )}
          <div className="mt-6">
            <CuongDatVe nen="muc" to={`/shows/${noiBat.id}`} gia={noiBat.price || null} />
          </div>
        </div>
      </div>

    </div>
  )
}

export default SapLenDen
