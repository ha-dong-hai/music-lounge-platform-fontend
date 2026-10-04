import assert from 'node:assert/strict'
import dayjs from 'dayjs'
import { sapXepTheoUuTien, moTaHan, nhanDocCua, duongDanCua } from './viecCho.js'

const B = dayjs('2026-10-04T12:00:00+07:00')
let dat = 0
const ca = (fn) => { fn(); dat++ }

const ds = [
  { key: 'venues', count: 9, overdueCount: null, nextDueAt: null },
  { key: 'refunds', count: 2, overdueCount: 0, nextDueAt: '2026-10-04T20:00:00+07:00' },
  { key: 'complaint', count: 3, overdueCount: 1, nextDueAt: null },
  { key: 'kyc-reviews', count: 0, overdueCount: null, nextDueAt: null },
  { key: 'content-reports', count: 1, overdueCount: 0, nextDueAt: '2026-10-04T14:00:00+07:00' },
  { key: 'penalty-appeals', count: 4, overdueCount: 2, nextDueAt: null },
  { key: 'bank-accounts', count: 1, overdueCount: null, nextDueAt: null },
]

// quá hạn nhiều → quá hạn ít → hạn gần → hạn xa → không hạn (nhiều việc trước); hàng 0 việc bị bỏ
ca(() => assert.deepEqual(sapXepTheoUuTien(ds).map((v) => v.key),
  ['penalty-appeals', 'complaint', 'content-reports', 'refunds', 'venues', 'bank-accounts']))
ca(() => assert.equal(ds[0].key, 'venues'))   // không đổi mảng gốc
ca(() => assert.deepEqual(sapXepTheoUuTien([]), []))
ca(() => assert.deepEqual(sapXepTheoUuTien(undefined), []))

ca(() => assert.deepEqual(moTaHan(ds[2], B), { quaHan: true, chu: '1 việc quá hạn' }))
ca(() => assert.deepEqual(moTaHan(ds[1], B), { quaHan: false, chu: 'Hạn gần nhất còn 8 giờ' }))
ca(() => assert.equal(moTaHan(ds[0], B), null))                                   // không có thời hạn → không bịa
ca(() => assert.equal(moTaHan({ count: 1, overdueCount: 0, nextDueAt: 'abc' }, B), null))

ca(() => assert.equal(nhanDocCua(ds[2]), '3 việc đang chờ, 1 quá hạn'))
ca(() => assert.equal(nhanDocCua(ds[0]), '9 việc đang chờ'))
ca(() => assert.equal(nhanDocCua(ds[3]), ''))
ca(() => assert.equal(duongDanCua('complaint'), '/admin/complaint'))
console.log(`viecCho: ${dat}/12 đạt`)
