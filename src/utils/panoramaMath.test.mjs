// Chạy: node src/utils/panoramaMath.test.mjs
// Cơ chế VERIFY cho trình xem 360°: kiểm quy ước hướng bằng CHÍNH three.js (không chỉ đại số), vì sai một
// dấu là hotspot của chủ phòng trà hiện lệch sang phía đối diện mà không ai hiểu vì sao.
import * as THREE from 'three'
import {
  verticalSpan, viewLimits, directionFromYawPitch, yawPitchFromDirection, dragToAngles, clampPitch, blackBorderCrop,
} from './panoramaMath.js'

const results = []
const check = (name, ok, detail = '') => { results.push(ok); console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}${detail ? '  — ' + detail : ''}`) }
const near = (a, b, t = 1e-6) => Math.abs(a - b) <= t
const vecNear = (a, b, t = 1e-6) => near(a.x, b.x, t) && near(a.y, b.y, t) && near(a.z, b.z, t)
const f = (v) => `(${v.x.toFixed(3)}, ${v.y.toFixed(3)}, ${v.z.toFixed(3)})`

// 1) Góc phủ dọc theo tỉ lệ ảnh
check('ảnh cầu chuẩn 2:1 -> phủ 180° dọc', near(verticalSpan(2) * 180 / Math.PI, 180, 1e-9))
const stripDeg = verticalSpan(7885 / 1237) * 180 / Math.PI
check('dải 7885x1237 (ảnh thật trên hệ thống) -> ~56.5° dọc', near(stripDeg, 56.5, 0.2), stripDeg.toFixed(2) + '°')
check('tỉ lệ rác (0, NaN) -> rơi về cả khối cầu, không sập', verticalSpan(0) === Math.PI && verticalSpan(NaN) === Math.PI)

// 2) Giới hạn góc nhìn: dải hẹp không được lộ khoảng trống
{
  const lim = viewLimits(7885 / 1237, 90)
  check('dải hẹp: FOV bị ép nhỏ hơn phần ảnh có thật', lim.fov <= lim.spanDeg && lim.fov < 60, `fov=${lim.fov.toFixed(1)}° trên ảnh ${lim.spanDeg.toFixed(1)}°`)
  check('dải hẹp: nhìn lên/xuống tối đa + FOV/2 vẫn nằm trong ảnh', lim.pitchMax + lim.fov / 2 <= lim.spanDeg / 2 + 1e-9)
  const full = viewLimits(2, 70)
  check('ảnh cầu đủ: giữ FOV 70°, nhìn lên xuống được tới 85°', full.fov === 70 && full.pitchMax === 85)
}

// 3) QUY ƯỚC HƯỚNG kiểm bằng camera thật của three.js
{
  const cam = new THREE.PerspectiveCamera(70, 16 / 9)
  cam.rotation.order = 'YXZ'
  let ok = true, worst = ''
  for (const yaw of [-170, -90, -45, 0, 30, 90, 135, 179]) {
    for (const pitch of [-60, -20, 0, 25, 70]) {
      cam.rotation.y = (90 - yaw) * Math.PI / 180
      cam.rotation.x = pitch * Math.PI / 180
      cam.updateMatrixWorld(true)
      const dir = new THREE.Vector3(); cam.getWorldDirection(dir)
      const mine = directionFromYawPitch(yaw, pitch)
      if (!vecNear(dir, mine, 1e-9)) { ok = false; worst = `yaw=${yaw} pitch=${pitch}: three=${f(dir)} mine=${f(mine)}` }
    }
  }
  check('40 tổ hợp (yaw,pitch): hướng camera three.js == directionFromYawPitch', ok, worst)
}

// 4) Ảnh thật lên mặt cầu: điểm GIỮA ảnh phải nằm đúng hướng yaw 0, điểm 3/4 chiều ngang đúng yaw +90
{
  const W = 96, H = 48
  const geo = new THREE.SphereGeometry(500, W, H, 0, Math.PI * 2, 0, Math.PI)
  geo.scale(-1, 1, 1) // lật để nhìn từ bên trong không bị ngược gương — đúng như trình xem sẽ làm
  const pos = geo.attributes.position
  const at = (ix, iy) => { const i = iy * (W + 1) + ix; return { x: pos.getX(i), y: pos.getY(i), z: pos.getZ(i) } }
  const centre = yawPitchFromDirection(at(W / 2, H / 2))
  const right = yawPitchFromDirection(at(Math.round(W * 0.75), H / 2))
  const left = yawPitchFromDirection(at(Math.round(W * 0.25), H / 2))
  check('giữa ảnh (u=0.5, v=0.5) -> yaw 0, pitch 0', near(centre.yaw, 0, 1e-6) && near(centre.pitch, 0, 1e-6), `yaw=${centre.yaw.toFixed(3)} pitch=${centre.pitch.toFixed(3)}`)
  check('3/4 chiều ngang -> yaw +90 (bên PHẢI giữa ảnh)', near(right.yaw, 90, 1e-6), `yaw=${right.yaw.toFixed(3)}`)
  check('1/4 chiều ngang -> yaw -90 (bên TRÁI giữa ảnh)', near(left.yaw, -90, 1e-6), `yaw=${left.yaw.toFixed(3)}`)
  const top = yawPitchFromDirection(at(W / 2, 0))
  check('mép trên ảnh (v=0) -> pitch +90 (nhìn LÊN)', near(top.pitch, 90, 1e-6), `pitch=${top.pitch.toFixed(3)}`)
}

// 5) Khứ hồi hướng <-> góc
{
  let ok = true
  for (const yaw of [-179, -120, -30, 0, 45, 100, 179]) for (const pitch of [-80, -10, 0, 33, 80]) {
    const back = yawPitchFromDirection(directionFromYawPitch(yaw, pitch))
    if (!near(back.yaw, yaw, 1e-6) || !near(back.pitch, pitch, 1e-6)) ok = false
  }
  check('khứ hồi yaw/pitch -> vectơ -> yaw/pitch chính xác', ok)
}

// 6) Kéo chuột & giới hạn
{
  const r = dragToAngles({ yaw: 0, pitch: 0 }, 100, 0, 70, 700) // kéo sang phải 100px, FOV 70 trên 700px => 10°
  check('kéo sang phải 100px -> yaw giảm 10° (nắm lấy thế giới)', near(r.yaw, -10, 1e-9), `yaw=${r.yaw}`)
  const wrap = dragToAngles({ yaw: -175, pitch: 0 }, 100, 0, 70, 700)
  check('quay qua mốc ±180° không nhảy vọt', near(wrap.yaw, 175, 1e-9), `yaw=${wrap.yaw}`)
  check('giới hạn pitch', clampPitch(40, 20) === 20 && clampPitch(-40, 20) === -20 && clampPitch(5, 20) === 5)
}

// 7) Cắt viền đen của ảnh ghép
{
  const rows = (n, f) => Array.from({ length: n }, (_, i) => f(i))
  check('ảnh không có viền đen -> không cắt', blackBorderCrop(rows(100, () => 0.01)) === 0)
  // 8% viền đen cong ở mỗi mép: tỉ lệ đen giảm dần từ 0.98 xuống 0.03 (đúng dạng ảnh thật đo được)
  const wavy = rows(1000, (i) => { const d = Math.min(i, 999 - i); return d < 80 ? 0.98 - (0.95 * d) / 80 : 0.01 })
  const c = blackBorderCrop(wavy)
  check('viền đen cong ~8% ở hai mép -> cắt ~8-9%', c > 0.07 && c < 0.10, c.toFixed(3))
  const asym = rows(1000, (i) => (i < 100 ? 0.9 : i > 960 ? 0.9 : 0.0))
  check('lệch (10% trên, 4% dưới) -> cắt theo mép sâu hơn, đối xứng', near(blackBorderCrop(asym), 0.11, 0.005), blackBorderCrop(asym).toFixed(3))
  check('ảnh đen hoàn toàn -> kẹp ở 25%, không cắt hết', blackBorderCrop(rows(100, () => 1)) === 0.25)
  check('quá ít hàng để đo -> không cắt', blackBorderCrop([1, 1, 1]) === 0)
}

const fail = results.filter((x) => !x).length
console.log(`\n${results.length - fail}/${results.length} đạt`)
process.exit(fail ? 1 : 0)
