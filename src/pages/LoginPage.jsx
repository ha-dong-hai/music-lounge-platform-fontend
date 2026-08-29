import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Link, useNavigate } from 'react-router-dom';
import { Mail, Lock, Eye, EyeOff, Music, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { loginSchema } from '../schemas/authSchema';
import { authService } from '../services/authService';
import { loungeService } from '../services/loungeService';
import { useAuthStore } from '../store/useAuthStore';
import './auth.css';

export default function LoginPage() {
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const setAuth = useAuthStore((s) => s.setAuth);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: '', password: '' },
  });

  const onSubmit = async (data) => {
    setIsLoading(true);
    try {
      const res = await authService.login(data);
      if ((res.success || res.result === 1) && res.data) {
        setAuth(res.data);
        toast.success('Login successful!');

        const role = res.data.role;

        // Auto-create pending lounge if Owner
        if (role === 'Owner') {
          const pendingStr = localStorage.getItem('pendingOwnerLounge');
          if (pendingStr) {
            try {
              const pendingLounge = JSON.parse(pendingStr);
              const loungeRes = await loungeService.create({
                name: pendingLounge.name || 'My Lounge',
                description: pendingLounge.description || 'Lounge tạo mới từ lúc đăng ký',
                atmosphereId: pendingLounge.atmosphereId || null,
                street: pendingLounge.street || 'N/A',
                ward: pendingLounge.ward || 'N/A',
                district: pendingLounge.district || 'N/A',
                city: pendingLounge.city || 'N/A'
              });
              
              if (loungeRes.success || loungeRes.data) {
                const loungeId = loungeRes.data;
                // Add business license if exists
                if (pendingLounge.documentUrl) {
                  await loungeService.setBusinessLicense(loungeId, pendingLounge.documentUrl);
                }
                
                // Also create an initial zone based on capacity if capacity > 0
                if (pendingLounge.capacity > 0) {
                  await loungeService.createZone(loungeId, {
                    name: "Khu vực chung",
                    description: "Khu vực mặc định tạo lúc đăng ký",
                    capacity: pendingLounge.capacity
                  });
                }
                
                toast.success('Lounge của bạn đã được tạo thành công!');
              }
            } catch (err) {
              console.error('Failed to auto-create lounge:', err);
              if (err.response?.data?.errors) {
                const firstError = Object.values(err.response.data.errors)[0][0];
                toast.error(`Lỗi tạo Lounge: ${firstError}`);
              } else if (err.response?.data?.error?.message) {
                toast.error(`Lỗi tạo Lounge: ${err.response.data.error.message}`);
              } else {
                toast.error('Không thể tạo tự động Lounge từ thông tin đăng ký.');
              }
            } finally {
              localStorage.removeItem('pendingOwnerLounge');
            }
          }
        }

        // Role-based navigation
        if (role === 'Admin') {
          navigate('/admin/dashboard', { replace: true });
        } else if (role === 'Owner') {
          navigate('/owner/revenue', { replace: true });
        } else {
          navigate('/', { replace: true });
        }
      } else {
        toast.error(res.error?.message || 'Login failed');
      }
    } catch (err) {
      console.error(err);
      if (err.response?.data?.errors) {
        const firstError = Object.values(err.response.data.errors)[0][0];
        toast.error(firstError);
      } else {
        const msg = err.response?.data?.error?.message || err.response?.data?.title || 'Login failed';
        toast.error(msg);
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="auth-page">



      <div className="auth-card">
        {}
        <div className="auth-logo">
          <div className="auth-logo-icon">
            <Music size={28} />
          </div>
          <h1 className="auth-logo-text">TuneRoom</h1>
        </div>

        <h2 className="auth-title">Welcome back</h2>
        <p className="auth-subtitle">Log in to continue your music journey</p>

        <form onSubmit={handleSubmit(onSubmit)} className="auth-form" id="login-form">
          {}
          <div className="auth-field">
            <label htmlFor="login-email" className="auth-label">Email</label>
            <div className={`auth-input-wrapper ${errors.email ? 'auth-input-wrapper--error' : ''}`}>
              <Mail size={18} className="auth-input-icon" />
              <input
                id="login-email"
                type="email"
                placeholder="you@example.com"
                autoComplete="email"
                {...register('email')}
                className="auth-input"
              />
            </div>
            {errors.email && (
              <span className="auth-error">
                {errors.email.message}
              </span>
            )}
          </div>

          {}
          <div className="auth-field">
            <label htmlFor="login-password" className="auth-label">Password</label>
            <div className={`auth-input-wrapper ${errors.password ? 'auth-input-wrapper--error' : ''}`}>
              <Lock size={18} className="auth-input-icon" />
              <input
                id="login-password"
                type={showPassword ? 'text' : 'password'}
                placeholder="••••••••"
                autoComplete="current-password"
                {...register('password')}
                className="auth-input"
              />
              <button
                type="button"
                className="auth-input-toggle"
                onClick={() => setShowPassword(!showPassword)}
                tabIndex={-1}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
            {errors.password && (
              <span className="auth-error">
                {errors.password.message}
              </span>
            )}
          </div>

          {}
          <button
            type="submit"
            className="auth-btn"
            id="login-submit"
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <Loader2 size={20} className="auth-btn-spinner" />
                Logging in...
              </>
            ) : (
              'Login'
            )}
          </button>
        </form>

        <p className="auth-footer">
          Don't have an account?{' '}
          <Link to="/register" className="auth-link" id="goto-register">
            Sign up now
          </Link>
        </p>
      </div>
    </div>
  );
}
