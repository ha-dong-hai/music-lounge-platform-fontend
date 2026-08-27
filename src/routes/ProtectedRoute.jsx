import { Navigate } from 'react-router-dom';
import { useAuthStore } from '../store/useAuthStore';

const ProtectedRoute = ({ requiredRoles = [], children }) => {
  const { user, isTokenExpired, logout } = useAuthStore();

  // Kiểm tra đã đăng nhập chưa
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // Kiểm tra token có bị hết hạn không
  if (isTokenExpired()) {
    logout(); // Tự động xóa state và localStorage
    return <Navigate to="/login" replace />;
  }

  // Kiểm tra Role 
  if (requiredRoles.length > 0 && !requiredRoles.includes(user.role)) {
    // Nếu không có quyền
    return <Navigate to="/" replace />;
  }

  // trả về cần render
  return children;
};

export default ProtectedRoute;