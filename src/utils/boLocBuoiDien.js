// src/utils/boLocBuoiDien.js
//
// BỘ LỌC CỦA TRANG BUỔI DIỄN — đọc/ghi từ ĐỊA CHỈ TRANG, đổi sang tham số API. Hàm thuần, kiểm được.
//
// VÌ SAO BỘ LỌC NẰM TRONG ĐỊA CHỈ: bản cũ giữ bộ lọc trong state của component (và truyền từ trang chủ qua
// location.state theo TÊN mục). Hệ quả: bấm vào một buổi rồi Quay lại là mất bộ lọc; tải lại trang là mất; không gửi
// được đường dẫn "bolero cuối tuần này" cho bạn; và Admin đổi tên một mục là bộ lọc đang chọn lặng lẽ rơi mất.
// Nay mọi thứ là tham số truy vấn theo ID. (Baymard: mất trạng thái khi Quay lại là lỗi phổ biến nhất của trang danh
// sách; DICE, Eventbrite, Songkick đều để thành phố / mốc ngày trong địa chỉ.)
//
// TÊN THAM SỐ (ngắn, tiếng Việt không dấu): q, the (dòng nhạc), tam (tâm trạng), kg (không gian), tp (thành phố),
// ht (hình thức), ngay (mốc nhanh) hoặc tu + den (YYYY-MM-DD), giaTu, giaDen, sap, trang.
// Tương thích đường dẫn cũ: ?keyword= và ?genreId= vẫn đọc được.
import dayjs from 'dayjs'
import { khoaNgay, ngayDayDu, ngayGon, ngayTrongLich } from './ngayVietNam.js'
import { chuanHoaKhoangLoc } from './rangBuocNgay.js'
import { td } from '../i18n/k.js'

// Nhãn hiển thị dùng GETTER + td() (src/i18n/k.js): đọc lúc vẽ nên theo ngôn ngữ đang chọn; chạy unit test bằng node thì
// td trả nguyên câu tiếng Việt.
export const CO_TRANG = 20

// Mặc định xếp theo ngày diễn gần nhất: với một buổi diễn, "khi nào" là câu hỏi đầu tiên (DICE, Ticketmaster đều
// xếp theo ngày tăng dần). Bản cũ mặc định "Mới nhất" — tức là theo lúc ĐĂNG, thứ khán giả không quan tâm.
export const CACH_SAP = [
  { value: 'StartingSoon', get label() { return td('Ngày diễn gần nhất') } },
  { value: 'PriceAsc', get label() { return td('Giá thấp đến cao') } },
  { value: 'PriceDesc', get label() { return td('Giá cao đến thấp') } },
  { value: 'Popular', get label() { return td('Được quan tâm nhiều') } },
  { value: 'Newest', get label() { return td('Mới đăng') } },
]
export const SAP_MAC_DINH = 'StartingSoon'

export const HINH_THUC = [
  { value: 'Offline', get label() { return td('Tại phòng trà') } },
  { value: 'Online', get label() { return td('Trực tuyến') } },
  { value: 'Hybrid', get label() { return td('Tại chỗ và trực tuyến') } },
]

// Mốc ngày nhanh — cách người ta thật sự hỏi ("tối nay có gì", "cuối tuần này"). Eventbrite: Today / Tomorrow /
// This weekend / Pick a date; Ticketmaster: This Weekend.
export const MOC_NGAY = [
  { value: 'hom-nay', get label() { return td('Hôm nay') } },
  { value: 'ngay-mai', get label() { return td('Ngày mai') } },
  { value: 'cuoi-tuan', get label() { return td('Cuối tuần này') } },
  { value: '7-ngay', get label() { return td('7 ngày tới') } },
]

// Khoảng [từ, đến] của một mốc nhanh. "Cuối tuần này" = thứ Sáu đến hết Chủ nhật của tuần đang chứa `moc`
// (đang là Chủ nhật thì là chính hôm nay); phần đã qua của cuối tuần bị cắt ở thời điểm hiện tại.
export const khoangCuaMoc = (moc, bayGio = dayjs()) => {
  const n = dayjs(bayGio)
  if (moc === 'hom-nay') return [n.startOf('day'), n.endOf('day')]
  if (moc === 'ngay-mai') return [n.add(1, 'day').startOf('day'), n.add(1, 'day').endOf('day')]
  if (moc === '7-ngay') return [n.startOf('day'), n.add(7, 'day').endOf('day')]
  if (moc === 'cuoi-tuan') {
    const thu = n.day() // 0 = Chủ nhật
    const chuNhat = thu === 0 ? n : n.add(7 - thu, 'day')
    const thuSau = chuNhat.subtract(2, 'day')
    return [(thuSau.isAfter(n) ? thuSau : n).startOf('day'), chuNhat.endOf('day')]
  }
  return null
}

// Mã danh mục (dòng nhạc, tâm trạng, không gian) là GUID từ MLACP-516. Bản trước đọc bằng parseInt và chỉ giữ số nguyên
// dương: parseInt('00000000-03ed-…') = 0 → MỌI mã bị bỏ, nên tích một ô dòng nhạc là ô tự bỏ tích, đường dẫn từ thẻ gu
// trang chủ không lọc gì (đo 03/10/2026). Nhận đúng dạng GUID, đưa về chữ thường (khớp chuỗi id API trả).
const GUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/
const dsMa = (chuoi) => String(chuoi ?? '').split(',').map((x) => x.trim().toLowerCase()).filter((x) => GUID.test(x))
// dayjs nhận cả '2026-13-99' (tự tràn sang tháng sau) nên isValid() không đủ: phải in ngược lại và so với chuỗi gốc.
const laNgay = (s) => /^\d{4}-\d{2}-\d{2}$/.test(s ?? '') && dayjs(s).format('YYYY-MM-DD') === s
const soTien = (s) => { const n = Number(s); return s !== '' && s != null && Number.isFinite(n) && n >= 0 && Number.isInteger(n) ? n : null }

export const BO_LOC_RONG = { q: '', the: [], tam: [], kg: [], tp: '', ht: '', ngay: '', tu: '', den: '', giaTu: null, giaDen: null, sap: SAP_MAC_DINH, trang: 1 }

// Đọc bộ lọc từ URLSearchParams. Giá trị hỏng bị BỎ (không ném lỗi): địa chỉ là thứ người dùng sửa tay được.
// Khoảng ngày đã qua (đường dẫn cũ được lưu/gửi lại) cũng bị bỏ hoặc cắt về hôm nay — xem chuanHoaKhoangLoc.
export const docBoLoc = (ts, bayGio = dayjs()) => {
  const lay = (k) => ts.get(k) ?? ''
  const sap = lay('sap')
  const ngay = lay('ngay')
  const ht = lay('ht')
  const trang = Number.parseInt(lay('trang'), 10)
  return {
    q: (lay('q') || lay('keyword')).trim(),
    the: [...new Set([...dsMa(lay('the')), ...dsMa(lay('genreId'))])],
    tam: dsMa(lay('tam')),
    kg: dsMa(lay('kg')),
    tp: lay('tp'),
    ht: HINH_THUC.some((h) => h.value === ht) ? ht : '',
    ngay: MOC_NGAY.some((m) => m.value === ngay) ? ngay : '',
    ...chuanHoaKhoangLoc({ tu: laNgay(lay('tu')) ? lay('tu') : '', den: laNgay(lay('den')) ? lay('den') : '' }, bayGio),
    giaTu: soTien(ts.get('giaTu')),
    giaDen: soTien(ts.get('giaDen')),
    sap: CACH_SAP.some((c) => c.value === sap) ? sap : SAP_MAC_DINH,
    trang: Number.isInteger(trang) && trang > 0 ? trang : 1,
  }
}

// Ghi bộ lọc thành URLSearchParams — chỉ ghi giá trị KHÁC mặc định, để địa chỉ trang trống bộ lọc là "/shows" trơn.
export const ghiBoLoc = (b) => {
  const ts = new URLSearchParams()
  if (b.q) ts.set('q', b.q)
  if (b.the.length) ts.set('the', b.the.join(','))
  if (b.tam.length) ts.set('tam', b.tam.join(','))
  if (b.kg.length) ts.set('kg', b.kg.join(','))
  if (b.tp) ts.set('tp', b.tp)
  if (b.ht) ts.set('ht', b.ht)
  if (b.ngay) ts.set('ngay', b.ngay)
  else {
    if (b.tu) ts.set('tu', b.tu)
    if (b.den) ts.set('den', b.den)
  }
  if (b.giaTu != null) ts.set('giaTu', String(b.giaTu))
  if (b.giaDen != null) ts.set('giaDen', String(b.giaDen))
  if (b.sap !== SAP_MAC_DINH) ts.set('sap', b.sap)
  if (b.trang > 1) ts.set('trang', String(b.trang))
  return ts
}

// Khoảng giá vô lý (đến < từ) thì KHÔNG gửi lên máy chủ: backend trả 400 và người dùng thấy một trang lỗi vì một ô gõ dở.
// Ô GIÁ TỰ NHẬP (03/10/2026). Bản trước dùng <input type="number" step="1000">: người Việt gõ "300.000" thì trình duyệt
// coi là 300,000 (ba trăm phẩy không), lệch bước 1.000 → CHẶN NGẦM việc gửi form, chỉ hiện bong bóng tiếng Anh "Please
// enter a valid value" — bấm "Áp dụng" không có gì xảy ra (chủ dự án báo; đo: "300.000" và "250500" đều bị chặn).
// Nay ô là chữ: chỉ giữ CHỮ SỐ (bỏ dấu chấm, phẩy, cách, "đ"), hiện lại có dấu chấm ngăn nghìn. Tiền đồng không có số lẻ
// nên dấu chấm/phẩy không bao giờ là dấu thập phân.
export const chuSoTien = (chuoi) => String(chuoi ?? '').replace(/\D/g, '').replace(/^0+(?=\d)/, '').slice(0, 10)
export const docTienGo = (chuoi) => { const s = chuSoTien(chuoi); return s === '' ? null : Number(s) }
export const inTienGo = (chuoi) => { const n = docTienGo(chuoi); return n == null ? '' : n.toLocaleString('vi-VN') }
// Nhãn nút "Giá" khi đang lọc theo khoảng tự nhập — in luôn khoảng, không in "tự chọn" chung chung.
export const nhanGiaTuNhap = ({ giaTu, giaDen }) => {
  const t = (n) => `${Number(n).toLocaleString('vi-VN')}đ`
  if (giaTu != null && giaDen != null) return `${t(giaTu)} – ${t(giaDen)}`
  return giaTu != null ? td('Từ {{x}}', { x: t(giaTu) }) : giaDen != null ? td('Đến {{x}}', { x: t(giaDen) }) : td('Giá')
}

export const loiKhoangGia = (b) => (b.giaTu != null && b.giaDen != null && b.giaDen < b.giaTu ? td('Giá "đến" phải lớn hơn hoặc bằng giá "từ".') : null)
export const loiKhoangNgay = (b) => (!b.ngay && b.tu && b.den && b.den < b.tu ? td('Ngày "đến" phải sau hoặc trùng ngày "từ".') : null)

// MỘT Ô LỊCH cho cả "một ngày" lẫn "khoảng ngày" (03/10/2026 — chủ dự án: hai ô Từ/Đến "quá phiền"). Bấm một ngày = chọn
// đúng ngày đó (tu = den); bấm ngày thứ hai = mở thành khoảng (tự xếp ngày sớm trước); bấm tiếp khi đã có khoảng = bắt
// đầu lại từ ngày vừa bấm; bấm lại chính ngày đang chọn = bỏ. Lý do tự viết bước này thay vì để mặc react-day-picker:
// mặc định của thư viện (utils/addToRange) bấm thêm sau một khoảng là KÉO DÀI khoảng đó — muốn chọn lại phải bấm đúng
// ngày đầu, không ai đoán được.
export const buocChonNgay = ({ tu, den }, ngay) => {
  if (tu && den && tu === den) {
    if (ngay === tu) return { tu: '', den: '' }
    return ngay < tu ? { tu: ngay, den: tu } : { tu, den: ngay }
  }
  return { tu: ngay, den: ngay }
}

// Nhãn của nút lịch: "Thứ năm 22/10" (một ngày) / "22/10 – 25/10" (khoảng). Khác năm thì in đủ năm.
export const nhanKhoangNgay = ({ tu, den }, bayGio = dayjs()) => {
  if (!tu && !den) return ''
  const gon = (d) => (dayjs(d).isSame(bayGio, 'year') ? ngayGon(d) : ngayDayDu(d))
  if (tu && den && tu === den) return ngayTrongLich(tu, bayGio)
  if (tu && den) return `${gon(tu)} – ${gon(den)}`
  return tu ? td('Từ {{x}}', { x: gon(tu) }) : td('Đến {{x}}', { x: gon(den) })
}

// Tham số gửi GET /lounge-shows/search.
export const thamSoApi = (b, bayGio = dayjs()) => {
  const p = { page: b.trang, pageSize: CO_TRANG, sortBy: b.sap, includeSoldOut: true }
  if (b.q) p.keyword = b.q
  if (b.the.length) p.genreIds = b.the
  if (b.tam.length) p.moodIds = b.tam
  if (b.kg.length) p.atmosphereIds = b.kg
  if (b.tp) p.city = b.tp
  if (b.ht) p.format = b.ht
  const khoang = b.ngay ? khoangCuaMoc(b.ngay, bayGio) : null
  if (khoang) {
    p.dateFrom = khoang[0].toISOString()
    p.dateTo = khoang[1].toISOString()
  } else if (!loiKhoangNgay(b)) {
    if (b.tu) p.dateFrom = dayjs(b.tu).startOf('day').toISOString()
    if (b.den) p.dateTo = dayjs(b.den).endOf('day').toISOString()
  }
  if (!loiKhoangGia(b)) {
    if (b.giaTu != null) p.minPrice = b.giaTu
    if (b.giaDen != null) p.maxPrice = b.giaDen
  }
  return p
}

const tien = (n) => `${Number(n).toLocaleString('vi-VN')}đ`

// Danh sách BỘ LỌC ĐANG ÁP để in thành các nút gỡ. Mỗi mục: { khoa, nhan, go(b) -> bộ lọc mới }.
// ID không còn trong danh mục (Admin đã xoá mục) vẫn in ra với nhãn "mục đã gỡ" để người dùng gỡ được — im lặng bỏ qua
// thì danh sách bị lọc theo một thứ không nhìn thấy.
export const boLocDangAp = (b, danhMuc = {}) => {
  const ten = (ds, id) => (ds ?? []).find((x) => x.id === id)?.name ?? td('mục đã gỡ')
  const kq = []
  if (b.q) kq.push({ khoa: 'q', nhan: `“${b.q}”`, go: (x) => ({ ...x, q: '' }) })
  if (b.ngay) kq.push({ khoa: 'ngay', nhan: MOC_NGAY.find((m) => m.value === b.ngay).label, go: (x) => ({ ...x, ngay: '' }) })
  else if (b.tu || b.den) {
    kq.push({
      khoa: 'khoang-ngay',
      nhan: b.tu && b.den && b.tu === b.den ? td('Ngày {{x}}', { x: ngayDayDu(b.tu) }) : b.tu && b.den ? td('{{a}} đến {{b}}', { a: ngayDayDu(b.tu), b: ngayDayDu(b.den) }) : b.tu ? td('Từ {{x}}', { x: ngayDayDu(b.tu) }) : td('Đến {{x}}', { x: ngayDayDu(b.den) }),
      go: (x) => ({ ...x, tu: '', den: '' }),
    })
  }
  for (const id of b.the) kq.push({ khoa: `the-${id}`, nhan: ten(danhMuc.genres, id), go: (x) => ({ ...x, the: x.the.filter((i) => i !== id) }) })
  for (const id of b.tam) kq.push({ khoa: `tam-${id}`, nhan: ten(danhMuc.moods, id), go: (x) => ({ ...x, tam: x.tam.filter((i) => i !== id) }) })
  for (const id of b.kg) kq.push({ khoa: `kg-${id}`, nhan: ten(danhMuc.atmospheres, id), go: (x) => ({ ...x, kg: x.kg.filter((i) => i !== id) }) })
  if (b.ht) kq.push({ khoa: 'ht', nhan: HINH_THUC.find((h) => h.value === b.ht).label, go: (x) => ({ ...x, ht: '' }) })
  if (b.tp) kq.push({ khoa: 'tp', nhan: b.tp, go: (x) => ({ ...x, tp: '' }) })
  if (b.giaTu != null || b.giaDen != null) {
    kq.push({
      khoa: 'gia',
      nhan: b.giaTu != null && b.giaDen != null ? td('{{a}} đến {{b}}', { a: tien(b.giaTu), b: tien(b.giaDen) }) : b.giaTu != null ? td('Từ {{x}}', { x: tien(b.giaTu) }) : td('Đến {{x}}', { x: tien(b.giaDen) }),
      go: (x) => ({ ...x, giaTu: null, giaDen: null }),
    })
  }
  return kq
}

// MỨC GIÁ GỢI Ý (thanh lọc ngang, 03/10/2026): hai ô "Từ/Đến" trống không gợi ý gì — người ta nghĩ theo mức ("dưới
// 300 nghìn"). Mức theo giá vé phòng trà thường gặp; vẫn còn ô tự nhập cho khoảng khác.
export const MUC_GIA = [
  { khoa: 'duoi-300', get label() { return td('Dưới 300.000đ') }, giaTu: null, giaDen: 300000 },
  { khoa: '300-500', label: '300.000đ – 500.000đ', giaTu: 300000, giaDen: 500000 },
  { khoa: '500-1tr', label: '500.000đ – 1.000.000đ', giaTu: 500000, giaDen: 1000000 },
  { khoa: 'tren-1tr', get label() { return td('Trên 1.000.000đ') }, giaTu: 1000000, giaDen: null },
]

// SỐ BUỔI CỦA TỪNG LỰA CHỌN — đếm ở trình duyệt trên MỘT lượt tải toàn bộ buổi sắp diễn (`ds`: dòng /lounge-shows/search).
// Đếm theo ĐÚNG luật lọc của backend (LoungeShowRepository.SearchAsync): dòng nhạc = buổi có ÍT NHẤT một dòng đã chọn;
// ngày = ScheduledStart trong khoảng; hình thức/thành phố = bằng. Số của một nhóm tính cùng bộ lọc của các NHÓM KHÁC đang
// áp (cách đếm facet chuẩn) → số in ra bằng số kết quả nếu bấm vào.
// KHÔNG đếm chính xác được khi đang lọc theo từ khoá (backend tìm cả mô tả; dòng danh sách không có), giá (backend xét TỪNG
// hạng vé; dòng danh sách chỉ có min/max) hay tâm trạng/không gian (dòng danh sách không có) → `chinhXac: false`, giao diện
// ẩn số thay vì in số sai. `coTrongSan` (dòng nhạc có ≥1 buổi trên toàn sàn) thì luôn đúng → lựa chọn 0 buổi luôn mờ.
// TRẦN: một lượt tải tối đa 100 buổi (backend kẹp pageSize ≤ 100). Đường nâng cấp: backend trả số đếm theo mục kèm kết quả.
export const demLuaChon = (ds = [], b = BO_LOC_RONG, bayGio = dayjs()) => {
  const chinhXac = !b.q && b.giaTu == null && b.giaDen == null && b.tam.length === 0 && b.kg.length === 0
  const theNho = (x) => (x.genres ?? []).map((g) => String(g.id).toLowerCase())
  // ngay: undefined = theo bộ lọc đang áp; null = BỎ QUA ngày; chuỗi = mốc nhanh đó.
  const khopNgay = (x, ngay) => {
    if (ngay === null) return true
    const k = ngay ? khoangCuaMoc(ngay, bayGio)
      : b.ngay ? khoangCuaMoc(b.ngay, bayGio)
        : (b.tu || b.den) ? [b.tu ? dayjs(b.tu).startOf('day') : null, b.den ? dayjs(b.den).endOf('day') : null] : null
    if (!k) return true
    const t = dayjs(x.scheduledStart)
    return (!k[0] || !t.isBefore(k[0])) && (!k[1] || !t.isAfter(k[1]))
  }
  const khop = (x, { ngay, the = b.the, ht = b.ht, tp = b.tp } = {}) => khopNgay(x, ngay)
    && (the.length === 0 || theNho(x).some((id) => the.includes(id)))
    && (!ht || x.format === ht)
    && (!tp || x.loungeCity === tp)
  const dem = (f) => ds.filter(f).length

  const coTrongSan = new Set(ds.flatMap(theNho))
  const ngay = { '': dem((x) => khop(x, { ngay: null })) }
  MOC_NGAY.forEach((m) => { ngay[m.value] = dem((x) => khop(x, { ngay: m.value })) })
  const the = {}
  coTrongSan.forEach((id) => { the[id] = dem((x) => khop(x, { the: [id] })) })
  const ht = { '': dem((x) => khop(x, { ht: '' })) }
  HINH_THUC.forEach((h) => { ht[h.value] = dem((x) => khop(x, { ht: h.value })) })
  const tp = {}
  new Set(ds.map((x) => x.loungeCity).filter(Boolean)).forEach((c) => { tp[c] = dem((x) => khop(x, { tp: c })) })
  // Ngày có ít nhất một buổi khớp các bộ lọc KHÁC (bỏ qua ngày) — để ô lịch chấm dấu ngày nào có đêm diễn.
  const ngayCoDien = new Set(ds.filter((x) => khop(x, { ngay: null })).map((x) => khoaNgay(x.scheduledStart)))
  return { chinhXac, coTrongSan, ngay, the, ht, tp, ngayCoDien }
}
