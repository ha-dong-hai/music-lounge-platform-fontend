// node src/utils/thamSoHeThong.test.mjs
import assert from 'node:assert/strict'
import { moTaThamSo, hienGiaTri, giaTriSua, guiLen, gomTheoNhom, khopTim } from './thamSoHeThong.js'

let dat = 0
const t = (ten, f) => { f(); dat++; console.log('DAT', ten) }

const c = (configKey, configValue, dataType, isMoneyRate = false) => ({ configKey, configValue, dataType, isMoneyRate, description: 'mo ta be' })
const hoaHong = moTaThamSo(c('platform_commission_rate', '0.05', 'Decimal', true))
const giuCho = moTaThamSo(c('ticket_hold_minutes', '15', 'Integer'))

t('ti le hien phan tram', () => assert.equal(hienGiaTri(hoaHong, '0.05'), '5%'))
t('ti le 0.07 khong ra so le thua', () => assert.equal(hienGiaTri(hoaHong, '0.07'), '7%'))
t('so nguyen kem don vi', () => assert.equal(hienGiaTri(giuCho, '15'), '15 phút'))
t('bat tat', () => assert.equal(hienGiaTri(moTaThamSo(c('appeal_auto_approve', 'true', 'Boolean')), 'true'), 'Bật'))
t('tien vnd', () => assert.equal(hienGiaTri(moTaThamSo(c('donation_max_amount', '50000000', 'Decimal')), '50000000'), '50.000.000đ'))
t('ds tu rong', () => assert.equal(hienGiaTri(moTaThamSo(c('donation_message_blocked_words', '[]', 'Json')), '[]'), 'Chưa có từ nào'))
t('diem thap phan dau phay', () => assert.equal(hienGiaTri(moTaThamSo(c('settlement_tier_premium_min_score', '4.2', 'Decimal')), '4.2'), '4,2 điểm'))

t('o sua ti le = phan tram', () => assert.equal(giaTriSua(hoaHong, '0.05'), '5'))
t('o sua ti le 0.025 = 2,5', () => assert.equal(giaTriSua(hoaHong, '0.025'), '2,5'))
t('gui len ti le 5 -> 0.05', () => assert.deepEqual(guiLen(hoaHong, '5'), { ok: true, value: '0.05' }))
t('gui len ti le 2,5 -> 0.025', () => assert.deepEqual(guiLen(hoaHong, '2,5'), { ok: true, value: '0.025' }))
t('gui len ti le 7 khong ra so le thua', () => assert.deepEqual(guiLen(hoaHong, '7'), { ok: true, value: '0.07' }))
t('ti le > 100 bi chan', () => assert.equal(guiLen(hoaHong, '150').ok, false))
t('ti le chu bi chan', () => assert.equal(guiLen(hoaHong, 'abc').ok, false))
t('khu hoi ti le: sua -> gui = goc', () => { for (const v of ['0.05', '0.88', '0.7', '0', '0.025']) assert.equal(guiLen(hoaHong, giaTriSua(hoaHong, v)).value, String(Number(v))) })
t('so nguyen 0 bi chan', () => assert.equal(guiLen(giuCho, '0').ok, false))
t('so nguyen thap phan bi chan', () => assert.equal(guiLen(giuCho, '1,5').ok, false))
t('tien 50.000.000 -> 50000000', () => assert.deepEqual(guiLen(moTaThamSo(c('donation_max_amount', '1', 'Decimal')), '50.000.000'), { ok: true, value: '50000000' }))
t('ds tu: moi dong mot tu, bo trung va dong trong', () => assert.deepEqual(guiLen(moTaThamSo(c('donation_message_blocked_words', '[]', 'Json')), 'a\n\n b \na'), { ok: true, value: '["a","b"]' }))

t('khoa la van hien, roi vao nhom Khac', () => {
  const m = moTaThamSo(c('khoa_moi_xyz', '3', 'Integer'))
  assert.equal(m.ten, 'khoa_moi_xyz'); assert.equal(m.nhom, 'khac'); assert.equal(m.kieu, 'so')
})
t('gom nhom: khong mat tham so nao, ve truoc', () => {
  const ds = [c('khoa_moi_xyz', '3', 'Integer'), c('platform_commission_rate', '0.05', 'Decimal', true), c('ticket_hold_minutes', '15', 'Integer')]
  const g = gomTheoNhom(ds)
  assert.equal(g.reduce((s, n) => s + n.muc.length, 0), 3)
  assert.equal(g[0].id, 've')
  assert.equal(g.at(-1).id, 'khac')
})
t('tim khong dau', () => assert.equal(khopTim(hoaHong, c('platform_commission_rate', '0.05', 'Decimal'), 'hoa hong'), true))
t('tim theo khoa ky thuat', () => assert.equal(khopTim(giuCho, c('ticket_hold_minutes', '15', 'Integer'), 'ticket_hold'), true))
t('tim khong khop', () => assert.equal(khopTim(giuCho, c('ticket_hold_minutes', '15', 'Integer'), 'thue'), false))

console.log(`\n${dat} cau dat`)
