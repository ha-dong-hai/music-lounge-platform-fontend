// src/components/program/BoLocBuoiDien.jsx
//
// KHỐI BỘ LỌC của trang Buổi diễn. Dùng ở hai nơi với CÙNG một bộ lọc: cột bên trái (màn lớn) và hộp phủ (màn nhỏ).
//
// BẢN CŨ (FilterModal): nút đang chọn và chưa chọn gần như giống hệt nhau (cùng nền, chỉ khác sắc chữ); ô giá in chữ
// màu sáng trên nền sáng — gõ vào không nhìn thấy số; các lựa chọn là <button> không có trạng thái cho trình đọc màn
// hình; dòng nhạc nằm trong một dải cuộn ngang.
//
// QUYẾT ĐỊNH (reports/Form lọc vé và màn vận hành.md):
//  - ÁP NGAY, không có nút "Áp dụng": NN/g — áp ngay hợp khi người dùng đang khám phá và kết quả về nhanh. Trên màn
//    nhỏ hộp phủ có nút "Xem N buổi diễn" để đóng (NN/g: số kết quả luôn nhìn thấy).
//  - Ô chọn là <input type="checkbox"> / radio THẬT trong <fieldset><legend>: trạng thái chọn do trình duyệt vẽ và đọc,
//    không phụ thuộc màu.
//  - Nhóm dài tự thu gọn theo luật chung của DESIGN.md (tới 8 mục in hết; nhiều hơn in 6 + "Xem thêm N"); mục ĐANG CHỌN
//    luôn được in ra dù nằm trong phần ẩn — giấu một bộ lọc đang áp là giấu lý do danh sách ngắn lại.
//  - Ngày: mốc nhanh ("Hôm nay", "Cuối tuần này"…) trước, tự chọn khoảng ngày sau — đúng cách Eventbrite,
//    Ticketmaster làm, và là cách người ta hỏi.
//  - Giá chỉ áp khi RỜI ô hoặc bấm Enter: áp theo từng phím là gửi một truy vấn cho mỗi chữ số.
//  - KHÔNG có lọc theo quận: cấp quận/huyện đã bỏ từ 01/07/2025 và API không trả danh sách quận.
//  - Thành phố chỉ hiện khi sàn có từ hai thành phố trở lên.
import { useId, useState } from 'react'
import { HINH_THUC, MOC_NGAY, loiKhoangGia, loiKhoangNgay } from '../../utils/boLocBuoiDien'
import { SO_HIEN, NGUONG_KHONG_CAT } from '../../utils/nhomGu'
import IconMoRong from '../shared/IconMoRong'

const O_CHON = 'flex items-center gap-2.5 min-h-[40px] cursor-pointer'
const O_TICH = 'w-5 h-5 flex-shrink-0 accent-ink'
const O_NHAP = 'w-full min-h-[44px] px-3 bg-card border-2 border-ink text-ink focus:outline-none focus:ring-2 focus:ring-ink focus:ring-offset-2 focus:ring-offset-stock'
const LEGEND = 'font-semibold text-ink mb-1'

const NhomTich = ({ tieuDe, ds = [], chon = [], onDoi }) => {
  const id = useId()
  const [moHet, setMoHet] = useState(false)
  if (ds.length === 0) return null
  const cat = ds.length > NGUONG_KHONG_CAT
  const dangIn = !cat || moHet ? ds : ds.filter((x, i) => i < SO_HIEN || chon.includes(x.id))
  const an = ds.length - dangIn.length
  return (
    <fieldset className="min-w-0">
      <legend className={LEGEND}>{tieuDe}</legend>
      <div id={`${id}-ds`}>
        {dangIn.map((x) => (
          <label key={x.id} className={O_CHON}>
            <input type="checkbox" className={O_TICH} checked={chon.includes(x.id)}
              onChange={() => onDoi(chon.includes(x.id) ? chon.filter((i) => i !== x.id) : [...chon, x.id])} />
            <span>{x.name}</span>
          </label>
        ))}
      </div>
      {cat && (
        <button type="button" onClick={() => setMoHet((v) => !v)} aria-expanded={moHet} aria-controls={`${id}-ds`}
          className="inline-flex items-center gap-1.5 min-h-[44px] text-sm font-semibold text-ink hover:text-board">
          {moHet ? <><IconMoRong mo /> Thu gọn</> : <><IconMoRong /> Xem thêm {an} {tieuDe.toLowerCase()}</>}
        </button>
      )}
    </fieldset>
  )
}

const BoLocBuoiDien = ({ boLoc, danhMuc, onDoi }) => {
  const id = useId()
  const tuChon = !boLoc.ngay && Boolean(boLoc.tu || boLoc.den)
  const [moTuChon, setMoTuChon] = useState(tuChon)
  // Ô giá giữ chữ đang gõ ở đây; chỉ đẩy lên bộ lọc khi rời ô / Enter. Bộ lọc đổi từ ngoài (bấm nút gỡ) thì đồng bộ lại —
  // nhưng CHỈ ô nào thật sự đổi ở phía trên và khác với thứ đang gõ. Bản đầu đồng bộ cả hai ô mỗi lần: gõ "Từ" rồi sang
  // gõ "Đến" thì lượt áp của ô "Từ" quay về và XOÁ ô "Đến" đang gõ dở (bài kiểm trình duyệt bắt được, lúc có lúc không).
  const so = (v) => (v === '' || v == null ? null : Math.max(0, Math.trunc(Number(v)) || 0))
  const [giaTu, setGiaTu] = useState(boLoc.giaTu ?? '')
  const [giaDen, setGiaDen] = useState(boLoc.giaDen ?? '')
  const [goc, setGoc] = useState([boLoc.giaTu, boLoc.giaDen])
  if (goc[0] !== boLoc.giaTu || goc[1] !== boLoc.giaDen) {
    setGoc([boLoc.giaTu, boLoc.giaDen])
    if (goc[0] !== boLoc.giaTu && so(giaTu) !== boLoc.giaTu) setGiaTu(boLoc.giaTu ?? '')
    if (goc[1] !== boLoc.giaDen && so(giaDen) !== boLoc.giaDen) setGiaDen(boLoc.giaDen ?? '')
  }

  const apGia = () => {
    const moi = { ...boLoc, giaTu: so(giaTu), giaDen: so(giaDen) }
    if (moi.giaTu !== boLoc.giaTu || moi.giaDen !== boLoc.giaDen) onDoi(moi)
  }
  const loiGia = loiKhoangGia({ giaTu: so(giaTu), giaDen: so(giaDen) })
  const loiNgay = loiKhoangNgay(boLoc)
  const mocDangChon = boLoc.ngay || (moTuChon || tuChon ? 'tu-chon' : '')

  return (
    <div className="space-y-7">
      <fieldset className="min-w-0">
        <legend className={LEGEND}>Ngày diễn</legend>
        {[{ value: '', label: 'Ngày nào cũng được' }, ...MOC_NGAY, { value: 'tu-chon', label: 'Chọn khoảng ngày' }].map((m) => (
          <label key={m.value} className={O_CHON}>
            <input type="radio" name={`${id}-ngay`} className={O_TICH} checked={mocDangChon === m.value}
              onChange={() => {
                if (m.value === 'tu-chon') { setMoTuChon(true); if (boLoc.ngay) onDoi({ ...boLoc, ngay: '' }) }
                else { setMoTuChon(false); onDoi({ ...boLoc, ngay: m.value, tu: '', den: '' }) }
              }} />
            <span>{m.label}</span>
          </label>
        ))}
        {mocDangChon === 'tu-chon' && (
          <div className="grid grid-cols-2 gap-3 mt-2">
            <label className="block text-sm">Từ ngày
              <input type="date" value={boLoc.tu} max={boLoc.den || undefined} onChange={(e) => onDoi({ ...boLoc, ngay: '', tu: e.target.value })}
                aria-invalid={loiNgay ? 'true' : undefined} aria-describedby={loiNgay ? `${id}-loi-ngay` : undefined} className={`${O_NHAP} mt-1`} />
            </label>
            <label className="block text-sm">Đến ngày
              <input type="date" value={boLoc.den} min={boLoc.tu || undefined} onChange={(e) => onDoi({ ...boLoc, ngay: '', den: e.target.value })}
                aria-invalid={loiNgay ? 'true' : undefined} aria-describedby={loiNgay ? `${id}-loi-ngay` : undefined} className={`${O_NHAP} mt-1`} />
            </label>
            {loiNgay && <p id={`${id}-loi-ngay`} className="col-span-2 text-sm font-semibold text-danger">{loiNgay}</p>}
          </div>
        )}
      </fieldset>

      <NhomTich tieuDe="Dòng nhạc" ds={danhMuc.genres} chon={boLoc.the} onDoi={(the) => onDoi({ ...boLoc, the })} />
      <NhomTich tieuDe="Tâm trạng" ds={danhMuc.moods} chon={boLoc.tam} onDoi={(tam) => onDoi({ ...boLoc, tam })} />
      <NhomTich tieuDe="Không gian" ds={danhMuc.atmospheres} chon={boLoc.kg} onDoi={(kg) => onDoi({ ...boLoc, kg })} />

      <fieldset className="min-w-0">
        <legend className={LEGEND}>Hình thức</legend>
        {[{ value: '', label: 'Tất cả' }, ...HINH_THUC].map((h) => (
          <label key={h.value} className={O_CHON}>
            <input type="radio" name={`${id}-ht`} className={O_TICH} checked={boLoc.ht === h.value} onChange={() => onDoi({ ...boLoc, ht: h.value })} />
            <span>{h.label}</span>
          </label>
        ))}
      </fieldset>

      <fieldset className="min-w-0">
        <legend className={LEGEND}>Giá vé (đồng)</legend>
        <div className="grid grid-cols-2 gap-3">
          <label className="block text-sm">Từ
            <input type="number" inputMode="numeric" min="0" step="1000" value={giaTu} onChange={(e) => setGiaTu(e.target.value)} onBlur={apGia}
              onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); apGia() } }}
              aria-invalid={loiGia ? 'true' : undefined} aria-describedby={loiGia ? `${id}-loi-gia` : undefined} className={`${O_NHAP} no-spin mt-1 font-mono`} />
          </label>
          <label className="block text-sm">Đến
            <input type="number" inputMode="numeric" min="0" step="1000" value={giaDen} onChange={(e) => setGiaDen(e.target.value)} onBlur={apGia}
              onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); apGia() } }}
              aria-invalid={loiGia ? 'true' : undefined} aria-describedby={loiGia ? `${id}-loi-gia` : undefined} className={`${O_NHAP} no-spin mt-1 font-mono`} />
          </label>
        </div>
        {loiGia && <p id={`${id}-loi-gia`} className="mt-1.5 text-sm font-semibold text-danger">{loiGia}</p>}
      </fieldset>

      {(danhMuc.cities?.length ?? 0) > 1 && (
        <label className="block font-semibold text-ink">Thành phố
          <select value={boLoc.tp} onChange={(e) => onDoi({ ...boLoc, tp: e.target.value })} className={`${O_NHAP} mt-1 font-normal`}>
            <option value="">Mọi thành phố</option>
            {danhMuc.cities.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
        </label>
      )}
    </div>
  )
}

export default BoLocBuoiDien
