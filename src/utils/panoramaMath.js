// src/utils/panoramaMath.js
//
// GHI CHÚ CHO ĐỘI FE — phần TOÁN của trình xem 360° (components/lounge/PanoramaViewer.jsx), tách riêng
// thành hàm thuần để test bằng node (panoramaMath.test.mjs) trước khi gắn vào giao diện.
//
// VÌ SAO CẦN: ảnh scene do chủ phòng trà tải lên KHÔNG đảm bảo là ảnh cầu chuẩn 2:1. Ảnh thật đang có
// trên hệ thống là một dải toàn cảnh 7885×1237 (6,4:1) — phủ đủ 360° chiều ngang nhưng chỉ ~56° chiều
// dọc. Ép nó lên cả khối cầu sẽ bị kéo giãn méo, và để người xem nhìn lên/xuống quá mép ảnh sẽ lộ ra
// khoảng trống. Nên trình xem phải suy ra góc phủ dọc từ tỉ lệ ảnh và giới hạn góc nhìn theo đó.
//
// QUY ƯỚC HƯỚNG (giống Pannellum / Photo Sphere Viewer để chủ phòng trà nhập hotspot không phải học lại):
//   yaw   : độ, 0 = giữa ảnh, dương = sang PHẢI, khoảng -180..180 (backend chặn đúng khoảng này)
//   pitch : độ, 0 = đường chân trời, dương = nhìn LÊN, khoảng -90..90

const DEG = Math.PI / 180

// Góc phủ dọc (radian) của ảnh có tỉ lệ rộng/cao = aspect, giả định cùng độ phân giải góc ở hai chiều
// (chiều ngang phủ 360° => mỗi pixel = 360°/rộng ở cả dọc lẫn ngang). Tối đa 180° (cả khối cầu).
export function verticalSpan(aspect) {
  if (!Number.isFinite(aspect) || aspect <= 0) return Math.PI
  return Math.min(Math.PI, (2 * Math.PI) / aspect)
}

// Các giới hạn góc nhìn cho một ảnh: FOV dọc (độ) được phép và góc nhìn lên/xuống tối đa (độ).
export function viewLimits(aspect, fovDeg) {
  const spanDeg = verticalSpan(aspect) / DEG
  const isFull = spanDeg >= 179.5
  // FOV không được lớn hơn phần ảnh có thật, nếu không mép trên/dưới lộ khoảng trống ngay cả khi nhìn thẳng.
  const fovMax = isFull ? 90 : Math.max(20, spanDeg * 0.98)
  const fovMin = Math.min(30, fovMax)
  const fov = Math.min(fovMax, Math.max(fovMin, fovDeg))
  const pitchMax = isFull ? 85 : Math.max(0, spanDeg / 2 - fov / 2)
  return { spanDeg, isFull, fov, fovMin, fovMax, pitchMax }
}

const wrapYaw = (y) => ((((y + 180) % 360) + 360) % 360) - 180

// (yaw, pitch) độ -> vectơ hướng đơn vị trong không gian three.js (camera mặc định nhìn về -Z).
// Camera dùng rotation.order = 'YXZ' với rotation.y = 90° - yaw, rotation.x = pitch, nên:
//   hướng = (-sin(ry)·cos(p), sin(p), -cos(ry)·cos(p))
// Kiểm: yaw 0 -> (-1, 0, 0) = giữa ảnh (mặt cầu đã lật gương nên u=0.5 nằm ở -X); yaw +90 -> (0, 0, -1).
export function directionFromYawPitch(yawDeg, pitchDeg) {
  const ry = (90 - yawDeg) * DEG
  const p = pitchDeg * DEG
  return { x: -Math.sin(ry) * Math.cos(p), y: Math.sin(p), z: -Math.cos(ry) * Math.cos(p) }
}

// Ngược lại: vectơ hướng -> (yaw, pitch) độ. Dùng cho test khứ hồi và để lấy toạ độ từ điểm bấm.
export function yawPitchFromDirection({ x, y, z }) {
  const len = Math.hypot(x, y, z) || 1
  const pitch = Math.asin(Math.max(-1, Math.min(1, y / len))) / DEG
  const ry = Math.atan2(-x, -z) // rotation.y
  return { yaw: wrapYaw(90 - ry / DEG), pitch }
}

// Bước quay khi kéo chuột: độ trên mỗi pixel = FOV dọc / chiều cao khung. Kéo sang phải thì hình ảnh
// trôi sang phải (cảm giác "nắm lấy thế giới") nên yaw GIẢM.
export function dragToAngles({ yaw, pitch }, dx, dy, fovDeg, heightPx) {
  const k = fovDeg / Math.max(1, heightPx)
  return { yaw: wrapYaw(yaw - dx * k), pitch: pitch + dy * k }
}

export const clampPitch = (pitch, pitchMax) => Math.max(-pitchMax, Math.min(pitchMax, pitch))

// ===== CẮT VIỀN ĐEN của ảnh toàn cảnh ghép =====
// Ảnh do chức năng "ghép nhiều ảnh thường thành 360°" tạo ra thường có viền đen cong ở mép trên/dưới (chỗ
// các ảnh nguồn không phủ tới). Dựng nguyên xi thì khách thấy hai mảng đen ngay lần nhìn đầu tiên.
// `darkRatios[i]` = tỉ lệ điểm ảnh gần đen ở hàng thứ i (từ trên xuống, 0..1). Trả về PHẦN TRĂM (0..maxCrop)
// cần cắt ở MỖI mép — đối xứng để đường chân trời vẫn ở giữa.
//   - Đi từ mép vào cho tới hàng đầu tiên có tỉ lệ đen <= threshold (viền cong thì hàng sâu nhất quyết định).
//   - Kẹp ở maxCrop: ảnh tối thật (quán tối, ảnh đen hoàn toàn) không được bị cắt gần hết.
export function blackBorderCrop(darkRatios, { threshold = 0.06, maxCrop = 0.25, margin = 0.01 } = {}) {
  const n = darkRatios.length
  if (n < 8) return 0
  let top = 0
  while (top < n && darkRatios[top] > threshold) top++
  let bottom = 0
  while (bottom < n && darkRatios[n - 1 - bottom] > threshold) bottom++
  if (top >= n) return maxCrop // toàn đen: cắt tối đa chứ không cắt hết
  const raw = Math.max(top, bottom) / n
  return raw === 0 ? 0 : Math.min(maxCrop, raw + margin)
}
