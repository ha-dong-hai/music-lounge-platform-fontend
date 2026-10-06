// src/utils/shapeRecognizer.js
//
// GHI CHÚ CHO ĐỘI FE — nhận diện một nét vẽ tay thành hình chuẩn (dùng cho công cụ vẽ khu vực chỗ ngồi).
//
// VÌ SAO TỰ VIẾT thay vì mua SDK: quy trình công khai (SaneNotes #277) gồm RDP đơn giản hoá → phân loại →
// khớp hình + snap góc, không cần thư viện ngoài, không phát sinh chi phí, và chạy ngay trên canvas Konva
// đang có ở trang Khu vực chỗ ngồi. Phần này là LOGIC THUẦN (không đụng DOM/Konva) để test được bằng node:
// xem src/utils/shapeRecognizer.test.mjs — bộ test dùng nét vẽ nhiễu tổng hợp, PHẢI chạy đạt trước khi gắn
// vào giao diện (cơ chế verify của dự án, xem docs/design/TRANG-CHU-BRIEF.md).
//
// Đầu vào : mảng điểm [{ x, y }] của MỘT nét vẽ liền.
// Đầu ra  : một trong các dạng dưới đây, hoặc null nếu là nét nguệch ngoạc không phải hình (cố ý từ chối
//           thay vì đoán bừa — đoán sai một khu vực chỗ ngồi tệ hơn việc bắt vẽ lại):
//   { type: 'rect',    x, y, width, height, rotation }   // x,y = TÂM; rotation tính bằng độ, bội số của 15
//   { type: 'ellipse', cx, cy, rx, ry }
//   { type: 'polygon', points: [[x, y], ...] }           // tam giác / đa giác 5-10 cạnh
//   { type: 'line',    points: [[x1, y1], [x2, y2]] }
// Tuỳ chọn { grid }: làm tròn kết quả vào lưới (px) — để các khu vực thẳng hàng với nhau.

const dist = (a, b) => Math.hypot(a.x - b.x, a.y - b.y)

const pathLength = (pts) => {
  let L = 0
  for (let i = 1; i < pts.length; i++) L += dist(pts[i - 1], pts[i])
  return L
}

// Khoảng cách từ p tới ĐƯỜNG THẲNG qua a-b. Nếu a,b trùng nhau thì rơi về khoảng cách điểm-điểm.
const perpDist = (p, a, b) => {
  const dx = b.x - a.x
  const dy = b.y - a.y
  const len = Math.hypot(dx, dy)
  if (len < 1e-9) return dist(p, a)
  return Math.abs(dy * p.x - dx * p.y + b.x * a.y - b.y * a.x) / len
}

// Ramer–Douglas–Peucker cho chuỗi HỞ.
function rdp(pts, eps) {
  if (pts.length < 3) return pts.slice()
  let dmax = 0
  let idx = 0
  for (let i = 1; i < pts.length - 1; i++) {
    const d = perpDist(pts[i], pts[0], pts[pts.length - 1])
    if (d > dmax) { dmax = d; idx = i }
  }
  if (dmax > eps) {
    const left = rdp(pts.slice(0, idx + 1), eps)
    const right = rdp(pts.slice(idx), eps)
    return left.slice(0, -1).concat(right)
  }
  return [pts[0], pts[pts.length - 1]]
}

// RDP cho vòng KÍN. Không chạy thẳng trên chuỗi vì hai đầu nét gần trùng nhau nên "đường thẳng đầu-cuối"
// có hướng tuỳ ý (đo khoảng cách sai). Cắt vòng tại điểm xa điểm đầu nhất rồi đơn giản hoá từng nửa.
function rdpClosed(pts, eps) {
  let far = 0
  let dmax = 0
  for (let i = 1; i < pts.length; i++) {
    const d = dist(pts[i], pts[0])
    if (d > dmax) { dmax = d; far = i }
  }
  const a = rdp(pts.slice(0, far + 1), eps)
  const b = rdp(pts.slice(far).concat([pts[0]]), eps)
  // a kết thúc tại pts[far], b bắt đầu tại pts[far] và kết thúc tại pts[0] — nối lại rồi bỏ điểm đóng lặp.
  return a.slice(0, -1).concat(b.slice(0, -1))
}

// Góc trong (độ) tại đỉnh b của chuỗi a-b-c.
function angleAt(a, b, c) {
  const v1 = { x: a.x - b.x, y: a.y - b.y }
  const v2 = { x: c.x - b.x, y: c.y - b.y }
  const l1 = Math.hypot(v1.x, v1.y)
  const l2 = Math.hypot(v2.x, v2.y)
  if (l1 < 1e-9 || l2 < 1e-9) return 180
  const cos = Math.max(-1, Math.min(1, (v1.x * v2.x + v1.y * v2.y) / (l1 * l2)))
  return (Math.acos(cos) * 180) / Math.PI
}

// Gộp các đỉnh gần như thẳng hàng (góc > 160°) và các cạnh quá ngắn — còn lại là các GÓC THẬT của hình.
function pruneCorners(poly, perimeter) {
  let pts = poly.slice()
  let changed = true
  while (changed && pts.length > 3) {
    changed = false
    for (let i = 0; i < pts.length; i++) {
      const prev = pts[(i - 1 + pts.length) % pts.length]
      const cur = pts[i]
      const next = pts[(i + 1) % pts.length]
      const tooShort = dist(cur, next) < perimeter * 0.06
      const nearlyStraight = angleAt(prev, cur, next) > 160
      if (tooShort || nearlyStraight) {
        pts.splice(tooShort ? (i + 1) % pts.length : i, 1)
        changed = true
        break
      }
    }
  }
  return pts
}

const toDeg = (r) => (r * 180) / Math.PI
const snapAngle = (deg, step) => Math.round(deg / step) * step

// Đưa góc về khoảng (-45, 45] — hình chữ nhật quay 90° chỉ là hoán đổi rộng/cao.
function normalizeRectAngle(deg) {
  let d = ((deg % 90) + 90) % 90
  if (d > 45) d -= 90
  return d
}

function fitRect(poly) {
  // Hướng chủ đạo (mod 90°) bằng trung bình vòng của 4θ — bền vững với việc cạnh nào được vẽ trước.
  let sx = 0
  let sy = 0
  for (let i = 0; i < poly.length; i++) {
    const a = poly[i]
    const b = poly[(i + 1) % poly.length]
    const theta = Math.atan2(b.y - a.y, b.x - a.x)
    const w = dist(a, b)
    sx += Math.cos(4 * theta) * w
    sy += Math.sin(4 * theta) * w
  }
  const phi = toDeg(Math.atan2(sy, sx) / 4)
  const rot = normalizeRectAngle(snapAngle(phi, 15))

  const r = (rot * Math.PI) / 180
  const cos = Math.cos(-r)
  const sin = Math.sin(-r)
  let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity
  for (const p of poly) {
    const x = p.x * cos - p.y * sin
    const y = p.x * sin + p.y * cos
    minX = Math.min(minX, x); maxX = Math.max(maxX, x)
    minY = Math.min(minY, y); maxY = Math.max(maxY, y)
  }
  let width = maxX - minX
  let height = maxY - minY
  // "Ô vuông vẽ xấu" -> vuông thật: chênh dưới 12% thì coi là hình vuông.
  if (Math.abs(width - height) / Math.max(width, height) < 0.12) {
    width = height = (width + height) / 2
  }
  const cxr = (minX + maxX) / 2
  const cyr = (minY + maxY) / 2
  // quay tâm về hệ toạ độ gốc
  const cx = cxr * Math.cos(r) - cyr * Math.sin(r)
  const cy = cxr * Math.sin(r) + cyr * Math.cos(r)
  return { type: 'rect', x: cx, y: cy, width, height, rotation: rot }
}

// Sai lệch trung bình so với elip khít bbox: điểm thuộc elip có r chuẩn hoá = 1; hình chữ nhật có
// r = 1 ở giữa cạnh và ~1.41 ở góc nên sai lệch lớn hơn hẳn — đó là cách phân biệt tròn với chữ nhật.
function ellipseError(pts) {
  let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity
  for (const p of pts) {
    minX = Math.min(minX, p.x); maxX = Math.max(maxX, p.x)
    minY = Math.min(minY, p.y); maxY = Math.max(maxY, p.y)
  }
  const cx = (minX + maxX) / 2
  const cy = (minY + maxY) / 2
  const rx = (maxX - minX) / 2
  const ry = (maxY - minY) / 2
  if (rx < 1 || ry < 1) return { err: Infinity, cx, cy, rx, ry }
  let sum = 0
  for (const p of pts) {
    sum += Math.abs(Math.hypot((p.x - cx) / rx, (p.y - cy) / ry) - 1)
  }
  return { err: sum / pts.length, cx, cy, rx, ry }
}

// Khoảng cách từ điểm p tới đoạn a-b.
const distToSegment = (p, a, b) => {
  const dx = b.x - a.x
  const dy = b.y - a.y
  const len2 = dx * dx + dy * dy
  if (len2 < 1e-9) return dist(p, a)
  const t = Math.max(0, Math.min(1, ((p.x - a.x) * dx + (p.y - a.y) * dy) / len2))
  return dist(p, { x: a.x + t * dx, y: a.y + t * dy })
}

// ĐỘ BÁM CẠNH: khoảng cách trung bình từ các điểm của nét vẽ tới chu vi đa giác đã khớp. Nét vẽ thật
// (kể cả run tay) bám sát cạnh nên số này nhỏ; nét nguệch ngoạc ngẫu nhiên tình cờ khép kín thì lang
// thang xa các cạnh. Bộ test bắt được lỗi nhận nhầm nguệch ngoạc thành đa giác trước khi có bước này.
function meanEdgeDistance(pts, poly) {
  let sum = 0
  for (const p of pts) {
    let best = Infinity
    for (let i = 0; i < poly.length; i++) {
      best = Math.min(best, distToSegment(p, poly[i], poly[(i + 1) % poly.length]))
    }
    sum += best
  }
  return sum / pts.length
}

const snapTo = (v, grid) => (grid ? Math.round(v / grid) * grid : v)

function applyGrid(shape, grid) {
  if (!grid || !shape) return shape
  switch (shape.type) {
    case 'rect':
      return { ...shape, x: snapTo(shape.x, grid), y: snapTo(shape.y, grid), width: Math.max(grid, snapTo(shape.width, grid)), height: Math.max(grid, snapTo(shape.height, grid)) }
    case 'ellipse':
      return { ...shape, cx: snapTo(shape.cx, grid), cy: snapTo(shape.cy, grid), rx: Math.max(grid / 2, snapTo(shape.rx, grid / 2)), ry: Math.max(grid / 2, snapTo(shape.ry, grid / 2)) }
    case 'polygon':
    case 'line':
      return { ...shape, points: shape.points.map(([x, y]) => [snapTo(x, grid), snapTo(y, grid)]) }
    default:
      return shape
  }
}

export function recognizeShape(rawPoints, { grid = 0 } = {}) {
  if (!Array.isArray(rawPoints) || rawPoints.length < 8) return null

  // Bỏ điểm trùng gần nhau (chuột đứng yên) để không làm lệch độ dài đường đi.
  const pts = [rawPoints[0]]
  for (let i = 1; i < rawPoints.length; i++) {
    if (dist(rawPoints[i], pts[pts.length - 1]) >= 1.5) pts.push(rawPoints[i])
  }
  if (pts.length < 8) return null

  const length = pathLength(pts)
  let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity
  for (const p of pts) {
    minX = Math.min(minX, p.x); maxX = Math.max(maxX, p.x)
    minY = Math.min(minY, p.y); maxY = Math.max(maxY, p.y)
  }
  const diag = Math.hypot(maxX - minX, maxY - minY)
  if (diag < 12) return null // chấm nhỏ/click nhầm, không phải hình

  const gap = dist(pts[0], pts[pts.length - 1])
  const isClosed = gap < length * 0.22

  if (!isClosed) {
    // Nét hở: chỉ nhận là ĐƯỜNG THẲNG nếu đủ thẳng, còn lại là nét tự do -> từ chối.
    if (gap / length > 0.9) {
      const a = pts[0]
      const b = pts[pts.length - 1]
      let angle = toDeg(Math.atan2(b.y - a.y, b.x - a.x))
      const snapped = snapAngle(angle, 45)
      if (Math.abs(angle - snapped) < 8) {
        const len = dist(a, b)
        const r = (snapped * Math.PI) / 180
        return applyGrid({ type: 'line', points: [[a.x, a.y], [a.x + len * Math.cos(r), a.y + len * Math.sin(r)]] }, grid)
      }
      return applyGrid({ type: 'line', points: [[a.x, a.y], [b.x, b.y]] }, grid)
    }
    return null
  }

  // Tròn/elip: kiểm TRƯỚC vì đa giác nhiều cạnh xấp xỉ tròn dễ bị nhận nhầm thành đa giác.
  const ell = ellipseError(pts)
  const corners = pruneCorners(rdpClosed(pts, diag * 0.04), length)
  if (ell.err < 0.1 && corners.length >= 6) {
    const round = Math.abs(ell.rx - ell.ry) / Math.max(ell.rx, ell.ry) < 0.12
    const r = round ? (ell.rx + ell.ry) / 2 : null
    return applyGrid({ type: 'ellipse', cx: ell.cx, cy: ell.cy, rx: r ?? ell.rx, ry: r ?? ell.ry }, grid)
  }

  // Các dạng đa giác chỉ được nhận khi nét vẽ thật sự bám sát cạnh (xem meanEdgeDistance).
  const bamCanh = meanEdgeDistance(pts, corners) / diag < 0.07
  if (!bamCanh) return null

  if (corners.length === 4) {
    const okAngles = corners.every((c, i) =>
      Math.abs(angleAt(corners[(i - 1 + 4) % 4], c, corners[(i + 1) % 4]) - 90) < 28
    )
    if (okAngles) return applyGrid(fitRect(corners), grid)
  }
  if (corners.length === 3) {
    return applyGrid({ type: 'polygon', points: corners.map((p) => [p.x, p.y]) }, grid)
  }
  if (corners.length >= 5 && corners.length <= 10) {
    return applyGrid({ type: 'polygon', points: corners.map((p) => [p.x, p.y]) }, grid)
  }
  return null
}
