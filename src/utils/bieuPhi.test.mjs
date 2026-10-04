// Chạy: node src/utils/bieuPhi.test.mjs
// MLACP-626: phép chia tiền in cho khách phải cộng đúng bằng số họ trả, và nhật ký thay đổi phải đọc được.
import { phanTram, gioVaNgay, chiaUngHo, chiaVe, dienGiaiThayDoi, dong } from './bieuPhi.js'

const results = []
const check = (name, ok, detail = '') => { results.push(ok); console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}${detail ? '  — ' + detail : ''}`) }

// Biểu phí đang chạy ngày 04/10/2026 (đọc từ GET /catalog/money-terms ở máy cục bộ)
const UNG_HO = { performerShareRate: 0.86, platformCommissionRate: 0.05, vatRate: 0.05, personalIncomeTaxRate: 0.02, venueShareRate: 0.02 }
const VE = { platformCommissionRate: 0.05, vatRate: 0.05, personalIncomeTaxRate: 0.02 }
const LICH = { newVenueFirstTrancheRate: 0.5, standardFirstTrancheRate: 0.7, premiumFirstTrancheRate: 0.8 }

check('phần trăm: 0.05 -> 5%, 0.125 -> 12,5%', phanTram(0.05) === '5%' && phanTram(0.125) === '12,5%', `${phanTram(0.05)} ${phanTram(0.125)}`)
check('giờ: 72 in kèm 3 ngày, 96 kèm 4 ngày, 20 chỉ in giờ', gioVaNgay(72) === '72 giờ (3 ngày)' && gioVaNgay(96) === '96 giờ (4 ngày)' && gioVaNgay(20) === '20 giờ')

{
  const c = chiaUngHo(UNG_HO, 100000)
  check('ủng hộ 100.000đ: nghệ sĩ 86.000, phí 5.000, GTGT 5.000, TNCN 2.000, phòng trà 2.000',
    c.ngheSi === 86000 && c.phi === 5000 && c.gtgt === 5000 && c.tncn === 2000 && c.phongTra === 2000, JSON.stringify(c))
  let ok = true, xau = ''
  for (const t of [10000, 12345, 33333, 50000, 99999, 1234567, 50000000]) {
    const x = chiaUngHo(UNG_HO, t)
    if (x.ngheSi + x.phi + x.gtgt + x.tncn + x.phongTra !== t || x.phongTra < 0) { ok = false; xau = `${t}: ${JSON.stringify(x)}` }
  }
  check('ủng hộ số lẻ: năm phần luôn cộng đúng bằng số khán giả trả, không âm', ok, xau)
  check('số tiền rác (rỗng, âm) -> 0, không sập', chiaUngHo(UNG_HO, '').tong === 0 && chiaUngHo(UNG_HO, -5).tong === 0)
}

{
  const v = chiaVe(VE, LICH, 100000)
  check('vé 100.000đ, phòng trà mới: nhận 88.000, đợt 1 44.000, đợt cuối 44.000', v.nhan === 88000 && v.dot1 === 44000 && v.dotCuoi === 44000, JSON.stringify(v))
  const cao = chiaVe(VE, LICH, 150000, LICH.premiumFirstTrancheRate)
  check('vé 150.000đ, hạng cao 80%: nhận 132.000, đợt 1 105.600, đợt cuối 26.400', cao.nhan === 132000 && cao.dot1 === 105600 && cao.dotCuoi === 26400, JSON.stringify(cao))
  let ok = true
  for (const t of [99999, 123457, 777777]) { const x = chiaVe(VE, LICH, t, 0.7); if (x.phi + x.gtgt + x.tncn + x.dot1 + x.dotCuoi !== t) ok = false }
  check('vé số lẻ: phí + thuế + hai đợt chi cộng đúng bằng giá vé', ok)
}

{
  const d = dienGiaiThayDoi({ key: 'donation_performer_share_rate', oldValue: '0.88', newValue: '0.86', effectiveFrom: '2026-10-04T09:07:46Z' })
  check('nhật ký: tỉ lệ in bằng phần trăm, có nhãn tiếng Việt', d.nhan === 'Phần nghệ sĩ nhận từ tiền ủng hộ' && d.cu === '88%' && d.moi === '86%', JSON.stringify(d))
  const p = dienGiaiThayDoi({ key: 'ticket_hold_minutes', oldValue: '20', newValue: '15', effectiveFrom: 'x' })
  check('nhật ký: phút giữ chỗ', p.cu === '20 phút' && p.moi === '15 phút')
  const la = dienGiaiThayDoi({ key: 'khoa_moi_chua_biet', oldValue: null, newValue: '7', effectiveFrom: 'x' })
  check('nhật ký: khoá lạ vẫn in (nhãn = khoá, giá trị nguyên), giá trị cũ rỗng in gạch', la.nhan === 'khoa_moi_chua_biet' && la.moi === '7' && la.cu === '—')
  check('tiền: 50000000 -> 50.000.000đ', dong(50000000) === '50.000.000đ', dong(50000000))
}

const fail = results.filter((x) => !x).length
console.log(`\n${results.length - fail}/${results.length} đạt`)
process.exit(fail ? 1 : 0)
