import { Link } from 'react-router-dom';
import { Heart, MapPin, Calendar, Music } from 'lucide-react';
import { useState } from 'react';
import { wishlistService } from '../services/wishlistService';
import dayjs from 'dayjs';
import './ShowCard.css';

export default function ShowCard({ show, onWishlistChange }) {
  const [wishlisted, setWishlisted] = useState(show.isWishlisted || false);
  const [wishlistLoading, setWishlistLoading] = useState(false);

  const toggleWishlist = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    setWishlistLoading(true);
    try {
      if (wishlisted) {
        await wishlistService.removeFromWishlist(show.id);
      } else {
        await wishlistService.addToWishlist(show.id);
      }
      setWishlisted(!wishlisted);
      onWishlistChange?.(show.id, !wishlisted);
    } catch {
      // silently fail
    } finally {
      setWishlistLoading(false);
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

  const priceDisplay = () => {
    if (show.minPrice == null && show.maxPrice == null) return 'Free';
    if (show.minPrice === show.maxPrice) return formatPrice(show.minPrice);
    return `${formatPrice(show.minPrice)} – ${formatPrice(show.maxPrice)}`;
  };

  return (
    <Link to={`/shows/${show.id}`} className="show-card" id={`show-card-${show.id}`}>
      <div className="show-card-image">
        {show.coverImageUrl ? (
          <img src={show.coverImageUrl} alt={show.name} loading="lazy" />
        ) : (
          <div className="show-card-image-placeholder">
            <Music size={32} />
          </div>
        )}
        <button
          className={`show-card-wishlist ${wishlisted ? 'show-card-wishlist--active' : ''}`}
          onClick={toggleWishlist}
          disabled={wishlistLoading}
          aria-label={wishlisted ? 'Remove from wishlist' : 'Add to wishlist'}
        >
          <Heart size={18} fill={wishlisted ? 'currentColor' : 'none'} />
        </button>
        {show.format && (
          <span className={`show-card-format show-card-format--${show.format?.toLowerCase()}`}>
            {show.format}
          </span>
        )}
      </div>

      <div className="show-card-body">
        <h3 className="show-card-title">{show.name}</h3>
        <div className="show-card-meta">
          <span className="show-card-meta-item">
            <MapPin size={14} />
            {show.loungeName}{show.loungeDistrict ? `, ${show.loungeDistrict}` : ''}
          </span>
          <span className="show-card-meta-item">
            <Calendar size={14} />
            {dayjs(show.scheduledStart).format('DD/MM/YYYY · HH:mm')}
          </span>
        </div>

        {show.genres?.length > 0 && (
          <div className="show-card-tags">
            {show.genres.slice(0, 3).map((genre) => (
              <span key={genre.id} className="show-card-tag">{genre.name}</span>
            ))}
            {show.genres.length > 3 && (
              <span className="show-card-tag show-card-tag--more">
                +{show.genres.length - 3}
              </span>
            )}
          </div>
        )}

        <div className="show-card-footer">
          <span className="show-card-price">{priceDisplay()}</span>
          {show.performerNames?.length > 0 && (
            <span className="show-card-performers">
              {show.performerNames.slice(0, 2).join(', ')}
              {show.performerNames.length > 2 && ` +${show.performerNames.length - 2}`}
            </span>
          )}
        </div>
      </div>
    </Link>
  );
}
