import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Link, useNavigate } from 'react-router-dom';
import { Mail, Lock, Eye, EyeOff, Music, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { loginSchema } from '../schemas/authSchema';
import { authService } from '../services/authService';
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
      if (res.result === 1 && res.data) {
        setAuth(res.data);
        toast.success('Login successful!');
        navigate('/');
      } else {
        toast.error(res.error?.message || 'Login failed');
      }
    } catch (err) {
      const msg =
        err.response?.data?.error?.message ||
        err.response?.data?.message ||
        'Server connection error';
      toast.error(msg);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-bg"></div>


      <div className="auth-card">
        {}
        <div className="auth-logo">
          <div className="auth-logo-icon">
            <Music size={28} />
          </div>
          <h1 className="auth-logo-text">Music Lounge</h1>
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
