// MLACP-672: tên đối tượng bị khiếu nại thay cho mã (backend trả targetName). Không có tên = đối tượng đã bị xoá — nói
// thẳng như vậy, không in mã ra thay. Để ở utils (không ở ComplaintBadges.jsx) vì file .jsx chỉ nên xuất component.
import { TARGET_TYPE_LABELS } from '../components/admin/complaints/ComplaintBadges'

export const tenDoiTuong = (c) =>
  `${TARGET_TYPE_LABELS[c.targetType] || c.targetType}: ${c.targetName || '(không còn tồn tại)'}`
