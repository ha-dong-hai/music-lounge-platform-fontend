import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { signInWithPopup } from 'firebase/auth';
import toast from 'react-hot-toast';
import * as aServices from '../services/aServices';
import { useAuthStore } from '../store/useAuthStore';
import { firebaseAuth, googleAuthProvider, isFirebaseConfigured } from '../config/firebase';

// Trang đích sau khi có token thật (login / verify-email) — theo role backend trả về
const destinationForRole = (role) => (role === 'Admin' ? '/admin' : '/');

export const useAuth = () => {
  const navigate = useNavigate();
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
        navigate(destinationForRole(res.data.role), { replace: true });
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
        navigate(destinationForRole(res.data.role), { replace: true });
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
      if (err?.code !== 'auth/popup-closed-by-user') {
        toast.error('Đăng nhập Google thất bại.');
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
        navigate(destinationForRole(res.data.role), { replace: true });
      }
      return res;
    } catch (err) {
      toast.error(err.response?.data?.message || 'Đăng nhập Google thất bại.');
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
