import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Heart, Loader2 } from 'lucide-react';
import { wishlistService } from '../services/wishlistService';
import ShowCard from '../components/ShowCard';
import Pagination from '../components/Pagination';
import './WishlistPage.css';

export default function WishlistPage() {
  const [wishlist, setWishlist] = useState(null);
  const [page, setPage] = useState(1);
  const [isLoading, setIsLoading] = useState(true);

  const fetchWishlist = async () => {
    setIsLoading(true);
    try {
      const res = await wishlistService.getMyWishlist({ page, pageSize: 12 });
      if (res.success) {
        setWishlist(res.data);
      }
    } catch (err) {
      console.error('Failed to fetch wishlist:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchWishlist();
  }, [page]);

  const handleWishlistChange = (showId, isWishlisted) => {
    if (!isWishlisted) {
      // If a show was removed from the wishlist, filter it out from the current view
      setWishlist((prev) => {
        if (!prev) return prev;
        const newItems = prev.items.filter((item) => item.id !== showId);
        return {
          ...prev,
          items: newItems,
          totalCount: prev.totalCount - 1,
        };
      });
      // Optionally refetch if the current page becomes empty and it's not page 1
    }
  };

  if (isLoading && !wishlist) {
    return (
      <div className="wishlist-loading">
        <Loader2 size={32} className="auth-btn-spinner" />
        <span>Loading your wishlist...</span>
      </div>
    );
  }

  return (
    <div className="wishlist-page">
      <div className="wishlist-header">
        <h1 className="wishlist-title">
          <Heart size={24} fill="var(--accent)" />
          My Wishlist
        </h1>
        <span className="wishlist-count">
          {wishlist?.totalCount || 0} saved show{(wishlist?.totalCount || 0) !== 1 ? 's' : ''}
        </span>
      </div>

      {wishlist?.items?.length > 0 ? (
        <>
          <div className="wishlist-grid">
            {wishlist.items.map((show) => (
              <ShowCard
                key={show.id}
                show={{ ...show, isWishlisted: true }} // Force initial state
                onWishlistChange={handleWishlistChange}
              />
            ))}
          </div>
          <Pagination
            page={wishlist.page}
            totalPages={Math.ceil(wishlist.totalCount / wishlist.pageSize)}
            onPageChange={setPage}
          />
        </>
      ) : (
        <div className="wishlist-empty">
          <div className="wishlist-empty-icon">
            <Heart size={48} />
          </div>
          <h3>Your wishlist is empty</h3>
          <p>Save shows you're interested in to easily find them later</p>
          <Link to="/" className="wishlist-discover-btn">Explore Shows</Link>
        </div>
      )}
    </div>
  );
}
