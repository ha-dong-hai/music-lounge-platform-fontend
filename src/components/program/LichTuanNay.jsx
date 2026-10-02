// src/components/program/LichTuanNay.jsx
//
// LỊCH DIỄN TUẦN NÀY — trục thời gian HẠ XUỐNG thứ cấp (venue-first §7.1 khối 4), in như trang trong của tờ chương
// trình: một bảng thẳng cột, gom theo ngày. Giờ bằng chữ số dạng bảng (kỷ luật "lưới số cố định").
// Dữ liệu là CÙNG mảng trang chủ đã tải (sortBy StartingSoon), bỏ đêm nay (đã có ở bảng giờ diễn), lấy 7 ngày tới.
import dayjs from 'dayjs'
import CuongDatVe from './CuongDatVe'
import LienKetMuiTen from '../shared/LienKetMuiTen'
import { thuVietHoa, ngayGon, gioTrongNgay } from '../../utils/ngayVietNam'

const LichTuanNay = ({ buoiDien = [], dangTai }) => {
  const hetHomNay = dayjs().endOf('day')
  const hetTuan = dayjs().add(7, 'day').endOf('day')
  const ds = buoiDien.filter((b) => {
    const t = dayjs(b.start_date)
    return t.isAfter(hetHomNay) && t.isBefore(hetTuan)
  })

  if (dangTai) return <div className="h-64 border-2 border-ink/20 bg-ink/5 animate-pulse" aria-busy="true" aria-label="Đang tải lịch tuần" />
  if (ds.length === 0) {
    return <div className="border-2 border-ink p-5 flex flex-wrap items-center gap-x-6 gap-y-2"><p>Bảy ngày tới chưa có buổi diễn nào mở bán.</p><LienKetMuiTen to="/shows">Xem mọi buổi diễn</LienKetMuiTen></div>
  }

  return (
    // `relative` là BẮT BUỘC: bảng có nhãn sr-only (position: absolute). Khung cuộn không phải khối chứa của nó thì
    // nhãn thoát khỏi vùng cắt overflow và kéo CẢ TRANG rộng ra (đo 30/09: 530px trên màn 390px — chỉ lộ khi bảng có dữ liệu).
    <div className="relative border-2 border-ink overflow-x-auto">
      <table className="w-full min-w-[760px] text-left">
        <caption className="sr-only">Lịch diễn bảy ngày tới, theo ngày và giờ</caption>
        <thead className="bg-ink text-lamp text-sm">
          <tr>
            <th scope="col" className="font-semibold px-4 py-3 w-40">Ngày</th>
            <th scope="col" className="font-semibold px-4 py-3">Phòng trà</th>
            <th scope="col" className="font-semibold px-4 py-3">Buổi diễn</th>
            <th scope="col" className="font-semibold px-4 py-3 w-24">Giờ</th>
            <th scope="col" className="px-4 py-3 w-56"><span className="sr-only">Đặt vé</span></th>
          </tr>
        </thead>
        <tbody>
          {ds.map((b, i) => {
            const ngayMoi = i === 0 || !dayjs(ds[i - 1].start_date).isSame(b.start_date, 'day')
            return (
              <tr key={b.id} className={`border-t ${ngayMoi ? 'border-ink' : 'border-ink/20'}`}>
                <td className="px-4 py-3 font-mono text-sm align-top">
                  {ngayMoi ? `${thuVietHoa(dayjs(b.start_date))} ${ngayGon(b.start_date)}` : ''}
                </td>
                <td className="px-4 py-3">
                  <span className="font-display text-xl leading-none">{b.loungeName || b.title}</span>
                  {b.district && <span className="block text-xs text-ink-soft mt-1">{b.district}</span>}
                </td>
                {/* TÊN BUỔI trước, người hát sau: bản trước chỉ in người hát, nên có dữ liệu thật (30/09) mới lộ ra là
                    khán giả không biết đêm đó diễn gì. Chưa có line-up thì chỉ in tên buổi, không in câu giữ chỗ. */}
                <td className="px-4 py-3">
                  <span className="block font-semibold">{b.title}</span>
                  {b.performers?.length > 0 && <span className="block text-sm text-ink-soft mt-0.5">{b.performers.join(', ')}</span>}
                </td>
                <td className="px-4 py-3 font-mono">{gioTrongNgay(b.start_date)}</td>
                <td className="px-4 py-3 text-right">
                  {/* Cuống đặt vé (giá + "Đặt vé") thay chữ gạch dưới "Xem và đặt" — 02/10/2026. Cột w-56 + bảng tối thiểu
                      760px để cuống không gãy dòng; ở màn hẹp bảng đã cuộn ngang trong khung riêng. */}
                  <CuongDatVe to={`/shows/${b.id}`} gia={b.price || null} />
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}

export default LichTuanNay
