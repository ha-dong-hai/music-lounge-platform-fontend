import { useEffect, useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { DollarSign, Loader2, Building2, Music, Ticket, TrendingUp } from 'lucide-react';
import { loungeService } from '../../services/loungeService';
import { analyticsService } from '../../services/analyticsService';
import dayjs from 'dayjs';
import './OwnerRevenuePage.css';

export default function OwnerRevenuePage() {
  const [loungesData, setLoungesData] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchAll = async () => {
      setIsLoading(true);
      try {
        const loungeRes = await loungeService.getMine({ page: 1, pageSize: 50 });
        if (!loungeRes.success || !loungeRes.data?.items?.length) {
          setLoungesData([]);
          return;
        }

        const lounges = loungeRes.data.items;

        const results = await Promise.all(
          lounges.map(async (lounge) => {
            try {
              const analyticsRes = await analyticsService.getOwnerAnalytics(lounge.id);
              if (analyticsRes.success && analyticsRes.data) {
                return { lounge, analytics: analyticsRes.data };
              }
              return { lounge, analytics: null };
            } catch {
              return { lounge, analytics: null };
            }
          })
        );

        setLoungesData(results);
      } catch (err) {
        console.error('Failed to fetch revenue data:', err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchAll();
  }, []);

  const stats = useMemo(() => {
    let totalShows = 0;
    let totalOrders = 0;
    let totalRevenue = 0;

    loungesData.forEach(({ analytics }) => {
      if (analytics) {
        totalShows += analytics.totalShows || 0;
        totalOrders += analytics.totalTicketsSold || 0;
        totalRevenue += analytics.totalRevenue || 0;
      }
    });

    return { totalLounges: loungesData.length, totalShows, totalOrders, totalRevenue };
  }, [loungesData]);

  const formatCurrency = (num) => {
    if (num >= 1_000_000) return `${(num / 1_000_000).toFixed(1)}M đ`;
    if (num >= 1_000) return `${(num / 1_000).toFixed(0)}K đ`;
    return `${num.toLocaleString('vi-VN')} đ`;
  };

  if (isLoading) {
    return (
      <div className="owner-revenue-loading">
        <Loader2 size={32} className="auth-btn-spinner" />
        <span>Đang tải dữ liệu doanh thu...</span>
      </div>
    );
  }

  return (
    <div className="owner-revenue-page">
      {/* Header */}
      <div className="owner-revenue-header">
        <DollarSign size={28} />
        <div>
          <h1 className="owner-revenue-title">Tổng quan doanh thu</h1>
          <p className="owner-revenue-subtitle">Thống kê doanh thu từ tất cả lounges và shows của bạn</p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="owner-revenue-stats">
        <div className="owner-revenue-stat-card">
          <div className="owner-revenue-stat-icon" style={{ background: 'rgba(195, 182, 101, 0.1)' }}>
            <Building2 size={22} style={{ color: '#C3B665' }} />
          </div>
          <div>
            <p className="owner-revenue-stat-label">Tổng Lounges</p>
            <p className="owner-revenue-stat-value">{stats.totalLounges}</p>
          </div>
        </div>

        <div className="owner-revenue-stat-card">
          <div className="owner-revenue-stat-icon" style={{ background: 'rgba(59, 130, 246, 0.1)' }}>
            <Music size={22} style={{ color: '#3b82f6' }} />
          </div>
          <div>
            <p className="owner-revenue-stat-label">Tổng Shows</p>
            <p className="owner-revenue-stat-value">{stats.totalShows}</p>
          </div>
        </div>

        <div className="owner-revenue-stat-card">
          <div className="owner-revenue-stat-icon" style={{ background: 'rgba(16, 185, 129, 0.1)' }}>
            <Ticket size={22} style={{ color: '#10b981' }} />
          </div>
          <div>
            <p className="owner-revenue-stat-label">Tổng vé đã bán</p>
            <p className="owner-revenue-stat-value">{stats.totalOrders}</p>
          </div>
        </div>

        <div className="owner-revenue-stat-card">
          <div className="owner-revenue-stat-icon" style={{ background: 'rgba(245, 158, 11, 0.1)' }}>
            <TrendingUp size={22} style={{ color: '#f59e0b' }} />
          </div>
          <div>
            <p className="owner-revenue-stat-label">Tổng doanh thu</p>
            <p className="owner-revenue-stat-value">{formatCurrency(stats.totalRevenue)}</p>
          </div>
        </div>
      </div>

      {/* Per-Lounge Breakdown */}
      {loungesData.length === 0 ? (
        <div className="owner-revenue-empty">
          <h3>Chưa có lounge nào</h3>
          <p>Hãy tạo lounge đầu tiên để bắt đầu kinh doanh</p>
        </div>
      ) : (
        loungesData.map(({ lounge, analytics }) => {
          return (
            <div key={lounge.id} className="owner-revenue-lounge-section">
              <div className="owner-revenue-lounge-header">
                <h2 className="owner-revenue-lounge-name">
                  <Building2 size={18} />
                  {lounge.name}
                </h2>
                <span className="owner-revenue-lounge-total">
                  Tổng: {formatCurrency(analytics?.totalRevenue || 0)}
                </span>
              </div>

              {!analytics || !analytics.topShows || analytics.topShows.length === 0 ? (
                <p style={{ color: '#6b7280', fontSize: 14, padding: '12px 0' }}>
                  Chưa có dữ liệu show nổi bật cho lounge này
                </p>
              ) : (
                <table className="owner-revenue-table">
                  <thead>
                    <tr>
                      <th>Show nổi bật</th>
                      <th>Ngày</th>
                      <th>Nghệ sĩ</th>
                      <th>Vé đã bán</th>
                      <th>Doanh thu</th>
                    </tr>
                  </thead>
                  <tbody>
                    {analytics.topShows.map((show) => (
                      <tr key={show.showId}>
                        <td className="show-name-cell">
                          <Link to={`/owner/shows/${show.showId}`} style={{ color: 'white', textDecoration: 'none' }}>
                            {show.name}
                          </Link>
                        </td>
                        <td>{dayjs(show.scheduledStart).format('DD/MM/YYYY HH:mm')}</td>
                        <td>{show.mainPerformerName || '—'}</td>
                        <td>{show.ticketsSold} / {show.totalCapacity || '—'}</td>
                        <td className="revenue-cell">{formatCurrency(show.revenue)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          );
        })
      )}
    </div>
  );
}
