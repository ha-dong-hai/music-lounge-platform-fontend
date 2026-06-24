import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Music, LogOut, User, Mail, Phone, Shield, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuthStore } from '../store/useAuthStore';
import { authService } from '../services/authService';
import './auth.css';

export default function HomePage() {
  const { user, isAuthenticated, logout, setUser } = useAuthStore();
  const navigate = useNavigate();
  const [isLoadingProfile, setIsLoadingProfile] = useState(false);

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }

    
    const fetchProfile = async () => {
      setIsLoadingProfile(true);
      try {
        const res = await authService.getProfile();
        if (res.result === 1 && res.data) {
          setUser(res.data);
        }
      } catch {
        
      } finally {
        setIsLoadingProfile(false);
      }
    };

    fetchProfile();
  }, [isAuthenticated, navigate, setUser]);

  const handleLogout = () => {
    logout();
    toast.success('Đã đăng xuất');
    navigate('/login');
  };

  if (!user) return null;

  return (
    <div className="home-page">
      {}
      <div className="auth-bg">
        <div className="auth-bg-orb auth-bg-orb--1" />
        <div className="auth-bg-orb auth-bg-orb--2" />
        <div className="auth-bg-orb auth-bg-orb--3" />
      </div>

      {}
      <motion.nav
        className="home-nav"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        <div className="home-nav-brand">
          <div className="auth-logo-icon auth-logo-icon--small">
            <Music size={20} />
          </div>
          <span className="home-nav-title">Music Lounge</span>
        </div>
        <motion.button
          className="home-logout-btn"
          onClick={handleLogout}
          whileHover={{ scale: 1.04 }}
          whileTap={{ scale: 0.96 }}
          id="logout-btn"
        >
          <LogOut size={18} />
          Đăng xuất
        </motion.button>
      </motion.nav>

      {}
      <div className="home-content">
        <motion.div
          className="home-welcome-card"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
        >
          <div className="home-welcome-header">
            <div className="home-avatar">
              {user.avatarUrl ? (
                <img src={user.avatarUrl} alt={user.fullName} className="home-avatar-img" />
              ) : (
                <div className="home-avatar-placeholder">
                  {user.fullName?.charAt(0)?.toUpperCase() || 'U'}
                </div>
              )}
              <div className="home-avatar-status" />
            </div>
            <div className="home-welcome-text">
              <h1 className="home-greeting">
                Xin chào, <span className="home-name">{user.fullName}</span>! 👋
              </h1>
              <p className="home-role-badge">
                <Shield size={14} />
                {user.role || 'Audience'}
              </p>
            </div>
          </div>
        </motion.div>

        {}
        <motion.div
          className="home-profile-card"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.25 }}
        >
          <h2 className="home-section-title">Thông tin tài khoản</h2>

          {isLoadingProfile ? (
            <div className="home-loading">
              <Loader2 size={24} className="auth-btn-spinner" />
              <span>Đang tải thông tin...</span>
            </div>
          ) : (
            <div className="home-profile-grid">
              <div className="home-profile-item">
                <div className="home-profile-icon">
                  <User size={18} />
                </div>
                <div>
                  <span className="home-profile-label">Họ tên</span>
                  <span className="home-profile-value">{user.fullName}</span>
                </div>
              </div>

              <div className="home-profile-item">
                <div className="home-profile-icon">
                  <Mail size={18} />
                </div>
                <div>
                  <span className="home-profile-label">Email</span>
                  <span className="home-profile-value">{user.email}</span>
                  {user.isEmailVerified && (
                    <span className="home-verified-badge">✓ Đã xác thực</span>
                  )}
                </div>
              </div>

              {user.phone && (
                <div className="home-profile-item">
                  <div className="home-profile-icon">
                    <Phone size={18} />
                  </div>
                  <div>
                    <span className="home-profile-label">Điện thoại</span>
                    <span className="home-profile-value">{user.phone}</span>
                  </div>
                </div>
              )}

              <div className="home-profile-item">
                <div className="home-profile-icon">
                  <Shield size={18} />
                </div>
                <div>
                  <span className="home-profile-label">Vai trò</span>
                  <span className="home-profile-value">{user.role || 'Audience'}</span>
                </div>
              </div>
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
}
