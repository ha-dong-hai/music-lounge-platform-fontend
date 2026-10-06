import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import { loungeService } from '../../services/loungeService';
import { useAuthStore } from '../../store/useAuthStore';

// This page auto-detects the owner's lounge and redirects to LoungeManagerPage
export default function OwnerDashboardPage() {
  const navigate = useNavigate();
  const { user, setUser } = useAuthStore();
  const [error, setError] = useState(false);

  useEffect(() => {
    // If loungeId already in store, redirect immediately
    if (user?.loungeId) {
      navigate(`/owner/lounges/${user.loungeId}`, { replace: true });
      return;
    }

    // Otherwise fetch it
    const fetchLounge = async () => {
      try {
        const res = await loungeService.getMine({ page: 1, pageSize: 1 });
        if (res.success && res.data?.items?.length > 0) {
          const loungeId = res.data.items[0].id;
          setUser({ loungeId });
          navigate(`/owner/lounges/${loungeId}`, { replace: true });
        } else {
          setError(true);
        }
      } catch {
        setError(true);
      }
    };
    fetchLounge();
  }, [user?.loungeId, navigate, setUser]);

  if (error) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '50vh', color: '#9ca3af', gap: 12 }}>
        <p style={{ fontSize: 18 }}>Chưa có lounge nào</p>
        <p style={{ fontSize: 14 }}>Lounge được tạo khi đăng ký tài khoản Owner.</p>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '50vh', color: '#9ca3af', gap: 12 }}>
      <Loader2 size={32} className="auth-btn-spinner" />
      <span>Đang tải...</span>
    </div>
  );
}
