import { Navigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '../store/useAuthStore';
import NotFoundPage from '../pages/NotFoundPage';

const ProtectedRoute = ({ requiredRoles = [], children }) => {
  const { user, isTokenExpired, logout } = useAuthStore();
  const location = useLocation();

  // Đường dẫn người dùng đang muốn vào, gửi kèm sang trang đăng nhập để sau khi đăng nhập xong
  // quay lại đúng chỗ đó (hooks/useAuth.js đọc `state.from`).
  //
  // LỖI ĐÃ SỬA: bản trước chỉ `<Navigate to="/login" replace />`, không mang theo gì. Người dùng
  // bấm một liên kết vào trang cần đăng nhập → bị đẩy ra /login → đăng nhập xong rơi về trang mặc
  // định của vai, và phải tự gõ lại URL ban đầu. Gồm cả query string vì nhiều màn hình phụ thuộc
  // nó (ví dụ /account?tab=identity là cửa bắt buộc để bán vé).
  const dangMuonVao = `${location.pathname}${location.search}`;

  // Kiểm tra đã đăng nhập chưa
  if (!user) {
    return <Navigate to="/login" replace state={{ from: dangMuonVao }} />;
  }

  // Kiểm tra token có bị hết hạn không
  if (isTokenExpired()) {
    logout(); // Tự động xóa state và localStorage
    return <Navigate to="/login" replace state={{ from: dangMuonVao }} />;
  }

  // Kiểm tra Role 
  if (requiredRoles.length > 0 && !requiredRoles.includes(user.role)) {
    // MLACP-593: báo rõ "không có quyền" tại chỗ thay cho việc lặng lẽ đẩy về trang chủ (người dùng tưởng hệ thống hỏng).
    // Trang có lối đi tiếp đúng khu của vai này.
    return <NotFoundPage khongQuyen />;
  }

  // trả về cần render
  return children;
};

export default ProtectedRoute;