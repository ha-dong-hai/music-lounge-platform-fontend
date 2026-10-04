// src/routes/TrangDauKhuPhongTra.jsx
//
// MLACP-590: trang đầu của /owner theo vai. Chủ phòng trà là người quản lý nên vào thẳng danh sách buổi diễn; trước
// đây cả hai vai cùng rơi vào trang Phát trực tuyến — một trang vận hành.
// MLACP-602: nhân viên vào thẳng Vận hành đêm diễn (soát vé, bán vé tại quầy) — việc họ làm mỗi tối. Trước đây họ rơi vào
// trang Phát trực tuyến đặt ở đường dẫn /owner: phần lớn phòng trà không phát trực tuyến nên chỉ thấy "chưa có buổi nào",
// và thực đơn không mục nào sáng vì /owner không phải đường dẫn của mục nào.
import { Navigate } from 'react-router-dom'
import { useAuthStore } from '../store/useAuthStore'

const TrangDauKhuPhongTra = () => {
  const laChu = useAuthStore((s) => s.user?.role) === 'Owner'
  return <Navigate to={laChu ? '/owner/shows' : '/owner/operate'} replace />
}

export default TrangDauKhuPhongTra
