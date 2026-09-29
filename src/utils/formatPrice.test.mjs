// Chạy: node src/utils/formatPrice.test.mjs
import { formatMinPrice } from './formatPrice.js'
const cases = [
  [{ minPrice: null, maxPrice: null }, 'Chưa mở bán'],
  [{ minPrice: undefined }, 'Chưa mở bán'],
  [{ minPrice: 0, maxPrice: 0 }, 'Miễn phí'],
  [{ minPrice: 0, maxPrice: 150000 }, '0đ'],
  [{ minPrice: 350000, maxPrice: 550000 }, '350.000đ'],
  [undefined, 'Chưa mở bán'],
]
let fail = 0
for (const [input, want] of cases) {
  const got = formatMinPrice(input)
  const ok = got === want
  if (!ok) fail++
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${JSON.stringify(input)} -> "${got}"${ok ? '' : `  (mong đợi "${want}")`}`)
}
console.log(`\n${cases.length - fail}/${cases.length} đạt`)
process.exit(fail ? 1 : 0)
