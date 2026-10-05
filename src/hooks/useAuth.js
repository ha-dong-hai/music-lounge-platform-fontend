import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { signInWithPopup } from 'firebase/auth';
import toast from 'react-hot-toast';
import * as aServices from '../services/aServices';
import { useAuthStore } from '../store/useAuthStore';
import { firebaseAuth, googleAuthProvider, isFirebaseConfigured } from '../config/firebase';

// LỖI ĐÃ SỬA: bản trước là `role === 'Admin' ? '/admin' : '/'`, nghĩa là CHỈ Admin được đưa về khu
// của mình; Owner và Staff đăng nhập xong rơi về trang chủ công khai và phải tự gõ URL `/owner`.
// Bảng đích theo vai và hàm chọn đích nằm ở utils/authRedirect.js — tách ra để chạy kiểm thử được
// bằng node (xem utils/authRedirect.test.mjs), vì file này kéo theo firebase + react-router.
import { dichSauDangNhap } from '../utils/authRedirect';

export const useAuth = () => {
  const navigate = useNavigate();
  const location = useLocation();
  // Trang người dùng đang muốn vào trước khi bị ProtectedRoute chặn (nếu có).
  const trangDinhVao = location.state?.from;
  const storeLogin = useAuthStore((s) => s.login);
  const storeLogout = useAuthStore((s) => s.logout);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleLogin = async (email, password) => {
    setIsSubmitting(true);
    try {
      const res = await aServices.login(email, password);
      if (res.success) {
        storeLogin(res.data);
        toast.success(`Chào mừng trở lại, ${res.data.fullName}!`);
        navigate(dichSauDangNhap(res.data.role, trangDinhVao), { replace: true });
      }
      return res;
    } catch (err) {
      toast.error(err.response?.data?.message || 'Email hoặc mật khẩu không đúng.');
      throw err;
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRegister = async (payload) => {
    setIsSubmitting(true);
    try {
      const res = await aServices.register(payload);
      if (res.success) {
        toast.success('Đăng ký thành công! Vui lòng kiểm tra email để lấy mã xác thực.');
        navigate('/verify-email', {
          state: {
            email: payload.email,
            verificationCodeExpiresAt: res.data.verificationCodeExpiresAt,
          },
        });
      }
      return res;
    } catch (err) {
      toast.error(err.response?.data?.message || 'Đăng ký thất bại.');
      throw err;
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleVerifyEmail = async (email, code) => {
    setIsSubmitting(true);
    try {
      const res = await aServices.verifyEmail({ email, code });
      if (res.success) {
        storeLogin(res.data);
        toast.success('Xác thực thành công!');
        navigate(dichSauDangNhap(res.data.role, trangDinhVao), { replace: true });
      }
      return res;
    } catch (err) {
      toast.error(err.response?.data?.message || 'Mã xác thực không đúng hoặc đã hết hạn.');
      throw err;
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResendCode = async (email) => {
    try {
      const res = await aServices.resendVerificationCode(email);
      toast.success('Đã gửi lại mã xác thực.');
      return res;
    } catch (err) {
      toast.error(err.response?.data?.message || 'Không thể gửi lại mã.');
      throw err;
    }
  };

  // Lỗi Firebase thường gặp khi chạy trên tên miền mới — mã lấy từ tài liệu Firebase Auth (AuthErrorCodes).
  const cauLoiFirebase = (ma) => ({
    'auth/unauthorized-domain': 'Tên miền này chưa được phép đăng nhập Google (Firebase → Authentication → Authorized domains).',
    'auth/popup-blocked': 'Trình duyệt đã chặn cửa sổ đăng nhập Google — hãy cho phép cửa sổ bật lên rồi thử lại.',
    'auth/network-request-failed': 'Mất kết nối tới Google — kiểm tra mạng rồi thử lại.',
    'auth/operation-not-allowed': 'Đăng nhập Google chưa được bật trong Firebase (Authentication → Sign-in method).',
  }[ma] || `Đăng nhập Google thất bại${ma ? ` (mã: ${ma})` : ''}.`);

  // Mở popup đăng nhập Google qua Firebase, lấy Firebase ID token rồi gửi cho backend — không dùng
  // trực tiếp token của thư viện Google OAuth thuần vì backend chỉ verify được Firebase ID token.
  const handleGoogleSignIn = async (acceptTerms = false) => {
    if (!isFirebaseConfigured) {
      toast.error('Đăng nhập Google chưa được cấu hình (thiếu Firebase Web config).');
      return;
    }
    setIsSubmitting(true);
    try {
      const credential = await signInWithPopup(firebaseAuth, googleAuthProvider);
      const idToken = await credential.user.getIdToken();
      return await handleGoogleLogin(idToken, acceptTerms);
    } catch (err) {
      // 05/10/2026: bản cũ in một câu chung cho MỌI lỗi (Firebase lẫn backend) — trên web vừa deploy không ai biết hỏng ở
      // đâu. Nay: lỗi backend đã được handleGoogleLogin báo (err.daBao), lỗi Firebase báo kèm mã gốc.
      if (err?.code !== 'auth/popup-closed-by-user' && !err?.daBao) {
        toast.error(cauLoiFirebase(err?.code));
      }
      throw err;
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleGoogleLogin = async (idToken, acceptTerms = false) => {
    setIsSubmitting(true);
    try {
      const res = await aServices.googleLogin(idToken, acceptTerms);
      if (res.success) {
        storeLogin(res.data);
        toast.success(`Chào mừng, ${res.data.fullName}!`);
        navigate(dichSauDangNhap(res.data.role, trangDinhVao), { replace: true });
      }
      return res;
    } catch (err) {
      // Không có câu từ backend thì nói rõ là backend trả mã gì, hay không phản hồi (mất mạng / CORS chặn).
      toast.error(err.response?.data?.message
        || (err.response ? `Máy chủ từ chối đăng nhập Google (mã ${err.response.status}).` : 'Không kết nối được máy chủ để hoàn tất đăng nhập Google.'));
      err.daBao = true;
      throw err;
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleLogout = async () => {
    try {
      await aServices.logout();
    } catch {
      // token có thể đã hết hạn — vẫn xoá session ở client như bình thường
    } finally {
      storeLogout();
      navigate('/login', { replace: true });
    }
  };

  return {
    isSubmitting,
    isGoogleLoginAvailable: isFirebaseConfigured,
    handleLogin,
    handleRegister,
    handleVerifyEmail,
    handleResendCode,
    handleGoogleSignIn,
    handleLogout,
  };
};
