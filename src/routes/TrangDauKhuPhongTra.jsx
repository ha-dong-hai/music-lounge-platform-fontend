// src/routes/TrangDauKhuPhongTra.jsx
//
// MLACP-590: trang đầu của /owner theo vai. Chủ phòng trà là người quản lý nên vào thẳng danh sách buổi diễn; trước
// đây cả hai vai cùng rơi vào trang Phát trực tuyến — một trang vận hành. Nhân viên giữ như cũ.
import { Navigate } from 'react-router-dom'
import { useAuthStore } from '../store/useAuthStore'
import OwnerLivestreamsPage from '../pages/owner/OwnerLivestreamsPage'

const TrangDauKhuPhongTra = () => {
  const laChu = useAuthStore((s) => s.user?.role) === 'Owner'
  return laChu ? <Navigate to="/owner/shows" replace /> : <OwnerLivestreamsPage />
}

export default TrangDauKhuPhongTra
