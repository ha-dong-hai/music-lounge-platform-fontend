import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  MapPin, Calendar, Clock, Users, Star, Heart, Loader2, Music,
  ArrowLeft, ExternalLink, Tag, Video
} from 'lucide-react';
import { showService } from '../services/showService';
import { wishlistService } from '../services/wishlistService';
import BookingModal from '../components/BookingModal';
import EventMap from '../components/mshow-detail/EventMap';
import dayjs from 'dayjs';
import toast from 'react-hot-toast';
import './ShowDetailPage.css';

export default function ShowDetailPage() {
  const { id } = useParams();
  const [show, setShow] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showBooking, setShowBooking] = useState(false);
  const [wishlisted, setWishlisted] = useState(false);

  useEffect(() => {
    const fetchDetail = async () => {
      setIsLoading(true);
      try {
        const res = await showService.getDetail(id);
        if (res.success && res.data) {
          setShow(res.data);
          setWishlisted(res.data.isWishlisted || false);
        }
      } catch (err) {
        console.error('Failed to load show:', err);
        toast.error('Failed to load show details');
      } finally {
        setIsLoading(false);
      }
    };
    fetchDetail();
  }, [id]);

  const toggleWishlist = async () => {
    try {
      if (wishlisted) {
        await wishlistService.removeFromWishlist(show.id);
      } else {
        await wishlistService.addToWishlist(show.id);
      }
      setWishlisted(!wishlisted);
    } catch {
      // silently fail
    }
  };

  const formatPrice = (price) => {
    if (price == null) return 'Free';
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
      maximumFractionDigits: 0,
    }).format(price);
  };

  if (isLoading) {
    return (
      <div className="show-detail-loading">
        <Loader2 size={32} className="auth-btn-spinner" />
        <span>Loading show details...</span>
      </div>
    );
  }

  if (!show) {
    return (
      <div className="show-detail-loading">
        <Music size={48} />
        <h3>Show not found</h3>
        <Link to="/" className="show-detail-back-link">Go back to Discover</Link>
      </div>
    );
  }

  return (
    <div className="show-detail-page">
      {/* Hero */}
      <div className="show-detail-hero">
        <div className="show-detail-hero-bg">
          {show.coverImageUrl ? (
            <img src={show.coverImageUrl} alt={show.name} />
          ) : (
            <div className="show-detail-hero-placeholder">
              <Music size={64} />
            </div>
          )}
          <div className="show-detail-hero-overlay" />
        </div>

        <div className="show-detail-hero-content">
          <Link to="/" className="show-detail-back">
            <ArrowLeft size={18} />
            Back
          </Link>

          <div className="show-detail-hero-info">
            <div className="show-detail-hero-badges">
              <span className={`show-detail-format show-detail-format--${show.format?.toLowerCase()}`}>
                {show.format}
              </span>
              {show.status && (
                <span className={`show-detail-status show-detail-status--${show.status?.toLowerCase()}`}>
                  {show.status}
                </span>
              )}
            </div>

            <h1 className="show-detail-title">{show.name}</h1>

            <div className="show-detail-hero-meta">
              <span>
                <Calendar size={16} />
                {dayjs(show.scheduledStart).format('dddd, DD/MM/YYYY')}
              </span>
              <span>
                <Clock size={16} />
                {dayjs(show.scheduledStart).format('HH:mm')}
                {show.scheduledEnd && ` – ${dayjs(show.scheduledEnd).format('HH:mm')}`}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="show-detail-content">
        <div className="show-detail-main">
          {/* Description */}
          {show.description && (
            <section className="show-detail-section">
              <h2>About This Show</h2>
              <p className="show-detail-description">{show.description}</p>
            </section>
          )}

          {/* Performers */}
          {show.performers?.length > 0 && (
            <section className="show-detail-section">
              <h2>Performers</h2>
              <div className="show-detail-performers">
                {show.performers.map((performer) => (
                  <div key={performer.id} className="show-detail-performer">
                    <div className="show-detail-performer-avatar">
                      {performer.avatarUrl ? (
                        <img src={performer.avatarUrl} alt={performer.name} />
                      ) : (
                        <span>{performer.name?.charAt(0)?.toUpperCase()}</span>
                      )}
                    </div>
                    <div className="show-detail-performer-info">
                      <span className="show-detail-performer-name">{performer.name}</span>
                      {performer.genres?.length > 0 && (
                        <span className="show-detail-performer-genres">
                          {performer.genres.map((g) => g.name).join(', ')}
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Genres */}
          {show.genres?.length > 0 && (
            <section className="show-detail-section">
              <h2>Genres</h2>
              <div className="show-detail-tags">
                {show.genres.map((genre) => (
                  <span key={genre.id} className="show-detail-tag">
                    <Tag size={12} />
                    {genre.name}
                  </span>
                ))}
              </div>
            </section>
          )}

          {/* Ratings */}
          {show.ratings && show.ratings.totalCount > 0 && (
            <section className="show-detail-section">
              <h2>Ratings</h2>
              <div className="show-detail-ratings">
                <div className="show-detail-rating-score">
                  <Star size={24} fill="currentColor" />
                  <span className="show-detail-rating-value">
                    {show.ratings.averageScore.toFixed(1)}
                  </span>
                  <span className="show-detail-rating-count">
                    ({show.ratings.totalCount} review{show.ratings.totalCount !== 1 ? 's' : ''})
                  </span>
                </div>
              </div>
            </section>
          )}
        </div>

        {/* Sidebar */}
        <aside className="show-detail-sidebar">
          {/* Venue Card */}
          {show.lounge && (
            <div className="show-detail-card">
              <h3>Venue</h3>
              <div className="show-detail-venue">
                {show.lounge.primaryImageUrl && (
                  <img
                    src={show.lounge.primaryImageUrl}
                    alt={show.lounge.name}
                    className="show-detail-venue-img"
                  />
                )}
                <div className="show-detail-venue-info">
                  <span className="show-detail-venue-name">{show.lounge.name}</span>
                  <span className="show-detail-venue-addr">
                    <MapPin size={14} />
                    {show.lounge.fullAddress || `${show.lounge.street}, ${show.lounge.ward}, ${show.lounge.district}, ${show.lounge.city}`}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Ticket Tiers */}
          <div className="show-detail-card">
            <h3>Tickets</h3>
            {show.ticketTiers?.length > 0 ? (
              <div className="show-detail-tiers">
                {show.ticketTiers.map((tier) => (
                  <div key={tier.id} className="show-detail-tier">
                    <div className="show-detail-tier-header">
                      <span className="show-detail-tier-name">{tier.name}</span>
                      <span className="show-detail-tier-type">{tier.accessType}</span>
                    </div>
                    {tier.prices?.map((price) => (
                      <div key={price.id} className="show-detail-tier-price">
                        <span>{price.name}</span>
                        <span className="show-detail-tier-amount">{formatPrice(price.price)}</span>
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            ) : (
              <p className="show-detail-no-tickets">No tickets available</p>
            )}

            <div className="show-detail-actions">
              {(show.format === 'Online' || show.format === 'Hybrid') && (
                <Link
                  to={`/shows/${show.id}/live`}
                  className="show-detail-book-btn"
                  style={{ background: '#ef4444', textDecoration: 'none', textAlign: 'center' }}
                >
                  <Video style={{ display: 'inline', marginRight: '8px' }} size={18} />
                  {show.isOngoing ? 'Watch Live Now' : 'Enter Live Room'}
                </Link>
              )}
              <button
                className="show-detail-book-btn"
                onClick={() => setShowBooking(true)}
                disabled={!show.ticketTiers?.length}
              >
                Book Now
              </button>
              <button
                className={`show-detail-wishlist-btn ${wishlisted ? 'show-detail-wishlist-btn--active' : ''}`}
                onClick={toggleWishlist}
              >
                <Heart size={18} fill={wishlisted ? 'currentColor' : 'none'} />
                {wishlisted ? 'Saved' : 'Save'}
              </button>
            </div>
          </div>
        </aside>
      </div>

      {/* Seating Map Section */}
      <div style={{ marginTop: '40px' }}>
        <h2 style={{ fontSize: '24px', fontWeight: 'bold', marginBottom: '24px' }}>Interactive Seating Map</h2>
        <EventMap />
      </div>

      {/* Booking Modal */}
      {showBooking && (
        <BookingModal
          show={show}
          onClose={() => setShowBooking(false)}
        />
      )}
    </div>
  );
}
