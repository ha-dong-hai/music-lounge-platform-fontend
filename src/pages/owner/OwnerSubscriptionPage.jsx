import { useEffect, useState } from 'react';
import { CreditCard, CheckCircle2, AlertCircle, Loader2, Star } from 'lucide-react';
import { subscriptionService } from '../../services/subscriptionService';
import toast from 'react-hot-toast';
import dayjs from 'dayjs';
import './OwnerSubscriptionPage.css';

export default function OwnerSubscriptionPage() {
  const [packages, setPackages] = useState([]);
  const [mySub, setMySub] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [subscribingId, setSubscribingId] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [pkgRes, subRes] = await Promise.all([
          subscriptionService.getPackages(true),
          subscriptionService.getMySubscription().catch(() => ({ success: true, data: null })), // If no sub, might return 404 or null
        ]);

        if (pkgRes.success) {
          setPackages(pkgRes.data);
        }
        if (subRes && subRes.success) {
          setMySub(subRes.data);
        }
      } catch (err) {
        toast.error('Failed to load subscription data');
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, []);

  const handleSubscribe = async (packageId) => {
    setSubscribingId(packageId);
    try {
      const res = await subscriptionService.subscribe(packageId);
      if (res.success && res.data?.paymentUrl) {
        window.location.href = res.data.paymentUrl;
      } else {
        toast.error('Failed to initiate payment');
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to initiate payment');
    } finally {
      setSubscribingId(null);
    }
  };

  if (isLoading) {
    return (
      <div className="owner-sub-page">
        <div className="owner-sub-loading">
          <Loader2 size={32} className="spinner-icon" />
          <span>Loading subscriptions...</span>
        </div>
      </div>
    );
  }

  const isSubActive = mySub && mySub.status === 'Active' && dayjs(mySub.expiresAt).isAfter(dayjs());

  return (
    <div className="owner-sub-page">
      <div className="owner-sub-header">
        <div className="owner-sub-title-group">
          <CreditCard size={28} className="owner-sub-icon" />
          <div>
            <h1 className="owner-sub-title">Subscriptions</h1>
            <p className="owner-sub-subtitle">Manage your billing and packages</p>
          </div>
        </div>
      </div>

      <div className="current-sub-card">
        <div className="current-sub-info">
          <h3>Current Plan: {mySub ? mySub.packageName : 'Free / None'}</h3>
          {mySub ? (
            <p>
              Valid until: {dayjs(mySub.expiresAt).format('DD/MM/YYYY')}
              <span className={`sub-status-badge ${isSubActive ? 'active' : 'expired'}`}>
                {isSubActive ? 'Active' : 'Expired'}
              </span>
            </p>
          ) : (
            <p>You don't have an active subscription. Subscribe to a plan to create events.</p>
          )}
        </div>
      </div>

      <section className="packages-section">
        <h2>Available Packages</h2>
        <div className="packages-grid">
          {packages.map((pkg) => (
            <div key={pkg.id} className="package-card">
              <div className="package-header">
                <h3 className="package-name">{pkg.description || `Package #${pkg.id}`}</h3>
                <div className="package-price">
                  <span className="price-amount">{pkg.price.toLocaleString('vi-VN')}</span>
                  <span className="price-currency">VND</span>
                </div>
                <p className="package-desc">For 30 days access</p>
              </div>

              <ul className="package-features">
                <li>
                  <CheckCircle2 size={18} className="feature-icon" />
                  <span>Unlimited event creation for 30 days</span>
                </li>
                <li>
                  <CheckCircle2 size={18} className="feature-icon" />
                  <span>Max {pkg.maxTicketsPerEvent} tickets per event</span>
                </li>
                {pkg.hasAiPoster && (
                  <li>
                    <Star size={18} className="feature-icon" />
                    <span>AI Poster generation included</span>
                  </li>
                )}
              </ul>

              <button
                className="btn-subscribe"
                onClick={() => handleSubscribe(pkg.id)}
                disabled={subscribingId === pkg.id}
              >
                {subscribingId === pkg.id ? (
                  <>
                    <Loader2 size={18} className="spinner-icon" />
                    Processing...
                  </>
                ) : (
                  'Subscribe Now'
                )}
              </button>
            </div>
          ))}
        </div>
        {packages.length === 0 && (
          <p style={{ textAlign: 'center', color: '#9ca3af' }}>No packages available right now.</p>
        )}
      </section>
    </div>
  );
}
