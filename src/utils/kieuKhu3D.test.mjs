// node src/utils/kieuKhu3D.test.mjs
import assert from 'node:assert/strict'
import { kieuKhu } from './kieuKhu3D.js'

const ca = [
  ['Ghế bar', 'bar'], ['Quầy rượu', 'bar'], ['BAR', 'bar'], ['Minibar', 'ban'],
  ['Sofa', 'sofa'], ['Khu sofa VIP', 'sofa'], ['Sofa cạnh bar', 'bar'],
  ['Hàng A–C VIP', 'hang'], ['Khán phòng tầng 1', 'hang'], ['Rạp nhỏ', 'hang'],
  ['Bàn đôi', 'doi'], ['Góc cặp đôi', 'doi'],
  ['Bàn dài nhóm', 'nhom'], ['Khu tiệc', 'nhom'], ['Gia đình', 'nhom'],
  ['Khu VIP gần sân khấu', 'vip'], ['vip', 'vip'], ['Vipper', 'ban'],
  ['Khu giữa', 'ban'], ['', 'ban'], [undefined, 'ban'],
]
let dat = 0
for (const [ten, mong] of ca) { assert.equal(kieuKhu(ten), mong, `${ten} -> ${kieuKhu(ten)}, mong ${mong}`); dat++ }
console.log(`kieuKhu3D: ${dat}/${ca.length} dat`)
