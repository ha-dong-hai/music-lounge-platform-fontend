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
import { ngayDayDu } from './ngayVietNam.js'

export const CO_TRANG = 20

// Mặc định xếp theo ngày diễn gần nhất: với một buổi diễn, "khi nào" là câu hỏi đầu tiên (DICE, Ticketmaster đều
// xếp theo ngày tăng dần). Bản cũ mặc định "Mới nhất" — tức là theo lúc ĐĂNG, thứ khán giả không quan tâm.
export const CACH_SAP = [
  { value: 'StartingSoon', label: 'Ngày diễn gần nhất' },
  { value: 'PriceAsc', label: 'Giá thấp đến cao' },
  { value: 'PriceDesc', label: 'Giá cao đến thấp' },
  { value: 'Popular', label: 'Được quan tâm nhiều' },
  { value: 'Newest', label: 'Mới đăng' },
]
export const SAP_MAC_DINH = 'StartingSoon'

export const HINH_THUC = [
  { value: 'Offline', label: 'Tại phòng trà' },
  { value: 'Online', label: 'Trực tuyến' },
  { value: 'Hybrid', label: 'Tại chỗ và trực tuyến' },
]

// Mốc ngày nhanh — cách người ta thật sự hỏi ("tối nay có gì", "cuối tuần này"). Eventbrite: Today / Tomorrow /
// This weekend / Pick a date; Ticketmaster: This Weekend.
export const MOC_NGAY = [
  { value: 'hom-nay', label: 'Hôm nay' },
  { value: 'ngay-mai', label: 'Ngày mai' },
  { value: 'cuoi-tuan', label: 'Cuối tuần này' },
  { value: '7-ngay', label: '7 ngày tới' },
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

const dsSo = (chuoi) => String(chuoi ?? '').split(',').map((x) => Number.parseInt(x, 10)).filter((x) => Number.isInteger(x) && x > 0)
// dayjs nhận cả '2026-13-99' (tự tràn sang tháng sau) nên isValid() không đủ: phải in ngược lại và so với chuỗi gốc.
const laNgay = (s) => /^\d{4}-\d{2}-\d{2}$/.test(s ?? '') && dayjs(s).format('YYYY-MM-DD') === s
const soTien = (s) => { const n = Number(s); return s !== '' && s != null && Number.isFinite(n) && n >= 0 && Number.isInteger(n) ? n : null }

export const BO_LOC_RONG = { q: '', the: [], tam: [], kg: [], tp: '', ht: '', ngay: '', tu: '', den: '', giaTu: null, giaDen: null, sap: SAP_MAC_DINH, trang: 1 }

// Đọc bộ lọc từ URLSearchParams. Giá trị hỏng bị BỎ (không ném lỗi): địa chỉ là thứ người dùng sửa tay được.
export const docBoLoc = (ts) => {
  const lay = (k) => ts.get(k) ?? ''
  const sap = lay('sap')
  const ngay = lay('ngay')
  const ht = lay('ht')
  const trang = Number.parseInt(lay('trang'), 10)
  return {
    q: (lay('q') || lay('keyword')).trim(),
    the: [...new Set([...dsSo(lay('the')), ...dsSo(lay('genreId'))])],
    tam: dsSo(lay('tam')),
    kg: dsSo(lay('kg')),
    tp: lay('tp'),
    ht: HINH_THUC.some((h) => h.value === ht) ? ht : '',
    ngay: MOC_NGAY.some((m) => m.value === ngay) ? ngay : '',
    tu: laNgay(lay('tu')) ? lay('tu') : '',
    den: laNgay(lay('den')) ? lay('den') : '',
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
export const loiKhoangGia = (b) => (b.giaTu != null && b.giaDen != null && b.giaDen < b.giaTu ? 'Giá "đến" phải lớn hơn hoặc bằng giá "từ".' : null)
export const loiKhoangNgay = (b) => (!b.ngay && b.tu && b.den && b.den < b.tu ? 'Ngày "đến" phải sau hoặc trùng ngày "từ".' : null)

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
  const ten = (ds, id) => (ds ?? []).find((x) => x.id === id)?.name ?? 'mục đã gỡ'
  const kq = []
  if (b.q) kq.push({ khoa: 'q', nhan: `“${b.q}”`, go: (x) => ({ ...x, q: '' }) })
  if (b.ngay) kq.push({ khoa: 'ngay', nhan: MOC_NGAY.find((m) => m.value === b.ngay).label, go: (x) => ({ ...x, ngay: '' }) })
  else if (b.tu || b.den) {
    kq.push({
      khoa: 'khoang-ngay',
      nhan: b.tu && b.den ? `${ngayDayDu(b.tu)} đến ${ngayDayDu(b.den)}` : b.tu ? `Từ ${ngayDayDu(b.tu)}` : `Đến ${ngayDayDu(b.den)}`,
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
      nhan: b.giaTu != null && b.giaDen != null ? `${tien(b.giaTu)} đến ${tien(b.giaDen)}` : b.giaTu != null ? `Từ ${tien(b.giaTu)}` : `Đến ${tien(b.giaDen)}`,
      go: (x) => ({ ...x, giaTu: null, giaDen: null }),
    })
  }
  return kq
}
