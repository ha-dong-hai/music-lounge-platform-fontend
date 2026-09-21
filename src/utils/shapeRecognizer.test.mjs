// Chạy: node src/utils/shapeRecognizer.test.mjs
// Cơ chế VERIFY cho công cụ vẽ khu vực: không gắn vào giao diện khi bộ này chưa đạt hết.
// Nét vẽ tổng hợp có nhiễu (seed cố định để lần nào chạy cũng cho cùng kết quả).
import { recognizeShape } from './shapeRecognizer.js'

let seed = 12345
const rnd = () => { seed = (seed * 1664525 + 1013904223) % 4294967296; return seed / 4294967296 }
const jitter = (j) => (rnd() * 2 - 1) * j

// Đi dọc chu vi một đa giác, mỗi ~4px một điểm, có nhiễu, và để hở một khe nhỏ ở chỗ đóng (như tay vẽ thật).
function strokeAlong(poly, j, step = 4, closeGap = 0.03) {
  const pts = []
  const n = poly.length
  for (let i = 0; i < n; i++) {
    const a = poly[i]
    const b = poly[(i + 1) % n]
    const len = Math.hypot(b[0] - a[0], b[1] - a[1])
    const k = Math.max(1, Math.round(len / step))
    for (let s = 0; s < k; s++) {
      const t = s / k
      pts.push({ x: a[0] + (b[0] - a[0]) * t + jitter(j), y: a[1] + (b[1] - a[1]) * t + jitter(j) })
    }
  }
  return pts.slice(0, Math.floor(pts.length * (1 - closeGap)))
}
const rotate = (poly, deg, cx, cy) => {
  const r = (deg * Math.PI) / 180
  return poly.map(([x, y]) => [cx + (x - cx) * Math.cos(r) - (y - cy) * Math.sin(r), cy + (x - cx) * Math.sin(r) + (y - cy) * Math.cos(r)])
}
const rectPoly = (cx, cy, w, h) => [[cx - w / 2, cy - h / 2], [cx + w / 2, cy - h / 2], [cx + w / 2, cy + h / 2], [cx - w / 2, cy + h / 2]]
const circleStroke = (cx, cy, rx, ry, j) => {
  const pts = []
  for (let a = 0; a < 2 * Math.PI * 0.97; a += 0.07) pts.push({ x: cx + rx * Math.cos(a) + jitter(j), y: cy + ry * Math.sin(a) + jitter(j) })
  return pts
}

const results = []
const check = (name, ok, detail = '') => { results.push({ name, ok }); console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}${detail ? '  — ' + detail : ''}`) }
const close = (a, b, tol) => Math.abs(a - b) <= tol

// 1) Chữ nhật vẽ xấu, nằm ngang
{
  const s = recognizeShape(strokeAlong(rectPoly(200, 150, 160, 90), 3))
  check('chữ nhật xấu -> rect', s?.type === 'rect', JSON.stringify(s && { ...s, x: Math.round(s.x), y: Math.round(s.y), width: Math.round(s.width), height: Math.round(s.height) }))
  check('  ...kích thước gần đúng 160x90, không xoay', s && close(s.width, 160, 12) && close(s.height, 90, 12) && s.rotation === 0)
}
// 2) "Ô vuông bị xấu" -> vuông thật (đúng ví dụ của người dùng)
{
  const s = recognizeShape(strokeAlong(rectPoly(120, 120, 100, 94), 3))
  check('ô vuông xấu (100x94) -> vuông thật', s?.type === 'rect' && s.width === s.height, s && `${s.width.toFixed(1)}x${s.height.toFixed(1)}`)
}
// 3) Chữ nhật nghiêng 30° -> giữ đúng góc 30 (bội của 15)
{
  const s = recognizeShape(strokeAlong(rotate(rectPoly(300, 200, 180, 80), 30, 300, 200), 2.5))
  check('chữ nhật nghiêng 30° -> rect xoay 30°', s?.type === 'rect' && close(s.rotation, 30, 0.01), s && `rotation=${s.rotation}`)
}
// 4) Nghiêng gần 0° (tay run 4°) -> snap về 0°
{
  const s = recognizeShape(strokeAlong(rotate(rectPoly(200, 200, 150, 100), 4, 200, 200), 2))
  check('hơi nghiêng 4° -> snap về 0°', s?.type === 'rect' && s.rotation === 0, s && `rotation=${s.rotation}`)
}
// 5) Vòng tròn / elip
{
  const c = recognizeShape(circleStroke(150, 150, 60, 58, 2))
  check('vòng tròn -> ellipse tròn', c?.type === 'ellipse' && close(c.rx, c.ry, 0.001), c && `rx=${c.rx.toFixed(1)} ry=${c.ry.toFixed(1)}`)
  const e = recognizeShape(circleStroke(150, 150, 90, 45, 2))
  check('elip -> ellipse dẹt', e?.type === 'ellipse' && e.rx > e.ry * 1.5, e && `rx=${e.rx.toFixed(1)} ry=${e.ry.toFixed(1)}`)
}
// 6) Tam giác
{
  const s = recognizeShape(strokeAlong([[100, 200], [220, 200], [160, 90]], 2.5))
  check('tam giác -> polygon 3 điểm', s?.type === 'polygon' && s.points.length === 3, s && `${s.points.length} điểm`)
}
// 7) Đường thẳng, lệch nhẹ -> snap ngang
{
  const pts = []
  for (let x = 50; x <= 250; x += 4) pts.push({ x, y: 100 + x * 0.03 + jitter(1.2) })
  const s = recognizeShape(pts)
  check('đường thẳng gần ngang -> line ngang', s?.type === 'line' && close(s.points[0][1], s.points[1][1], 0.01), s && JSON.stringify(s.points.map(p => p.map(Math.round))))
}
// 8) TỪ CHỐI: nguệch ngoạc
{
  const pts = []
  let x = 100, y = 100
  for (let i = 0; i < 120; i++) { x += jitter(14); y += jitter(14); pts.push({ x, y }) }
  const s = recognizeShape(pts)
  check('nét nguệch ngoạc -> null (từ chối, không đoán bừa)', s === null, s && `bị nhận nhầm thành ${s.type}`)
}
// 9) TỪ CHỐI: đầu vào quá ít điểm / chấm click nhầm
{
  check('vài điểm rời rạc -> null', recognizeShape([{ x: 1, y: 1 }, { x: 2, y: 2 }]) === null)
  const dot = Array.from({ length: 12 }, (_, i) => ({ x: 50 + jitter(2), y: 50 + jitter(2) + i * 0.1 }))
  check('chấm nhỏ (click nhầm) -> null', recognizeShape(dot) === null)
}
// 10) Snap lưới
{
  const s = recognizeShape(strokeAlong(rectPoly(203, 147, 158, 93), 2), { grid: 10 })
  check('snap lưới 10px: mọi số đo là bội của 10', s?.type === 'rect' && [s.x, s.y, s.width, s.height].every(v => v % 10 === 0), s && `${s.x},${s.y} ${s.width}x${s.height}`)
}
// 11) Độ ổn định: 40 lần vẽ chữ nhật nhiễu khác nhau đều phải ra rect (không "chập chờn")
{
  let ok = 0
  for (let i = 0; i < 40; i++) {
    const s = recognizeShape(strokeAlong(rectPoly(200, 150, 140 + rnd() * 60, 70 + rnd() * 50), 2 + rnd() * 2))
    if (s?.type === 'rect') ok++
  }
  check(`ổn định: ${ok}/40 lần chữ nhật nhiễu ra rect`, ok >= 38, `ngưỡng đạt >= 38`)
}

const fail = results.filter(r => !r.ok).length
console.log(`\n${results.length - fail}/${results.length} đạt`)
process.exit(fail ? 1 : 0)
