import assert from 'node:assert/strict'
import { laDuongQuay } from './khuQuay.js'

const ca = [
  ['/owner/operate', true],
  ['/owner/operate/', true],
  ['/owner/operate/abc', true],
  ['/owner/fnb-orders', true],
  ['/owner/operate-x', false],      // ranh giới đoạn
  ['/owner/fnb-orders-cu', false],
  ['/owner/fnb-menus', false],      // thực đơn là việc quản lý
  ['/owner/livestreams', false],    // chủ tạo phiên phát ở đây — việc quản lý
  ['/owner/shows', false],
  ['/owner', false],
  ['', false],
]
let dat = 0
for (const [p, mong] of ca) { assert.equal(laDuongQuay(p), mong, p); dat++ }
assert.equal(laDuongQuay(undefined), false); dat++
console.log(`khuQuay: ${dat}/${ca.length + 1} đạt`)
