import { useEffect, useState, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Search as SearchIcon, SlidersHorizontal, X, Loader2 } from 'lucide-react';
import { showService } from '../services/showService';
import ShowCard from '../components/ShowCard';
import Pagination from '../components/Pagination';
import './SearchPage.css';

const SORT_OPTIONS = [
  { value: 'Newest', label: 'Newest' },
  { value: 'Soonest', label: 'Soonest' },
  { value: 'PriceAsc', label: 'Price: Low to High' },
  { value: 'PriceDesc', label: 'Price: High to Low' },
];

export default function SearchPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [keyword, setKeyword] = useState(searchParams.get('keyword') || '');
  const [sortBy, setSortBy] = useState(searchParams.get('sortBy') || 'Newest');
  const [page, setPage] = useState(1);
  const [results, setResults] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [filterOptions, setFilterOptions] = useState(null);
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);

  // Filter state
  const [filters, setFilters] = useState({
    genreIds: [],
    city: '',
    format: '',
    minPrice: '',
    maxPrice: '',
  });

  // Load filter options
  useEffect(() => {
    showService.getFilterOptions().then((res) => {
      if (res.success) setFilterOptions(res.data);
    }).catch(() => {});
  }, []);

  // Search
  const doSearch = useCallback(async () => {
    setIsLoading(true);
    try {
      const params = {
        keyword: keyword || undefined,
        page,
        pageSize: 12,
        sortBy,
        ...(filters.genreIds.length > 0 && { genreIds: filters.genreIds }),
        ...(filters.city && { city: filters.city }),
        ...(filters.format && { format: filters.format }),
        ...(filters.minPrice && { minPrice: Number(filters.minPrice) }),
        ...(filters.maxPrice && { maxPrice: Number(filters.maxPrice) }),
      };
      const res = await showService.search(params);
      if (res.success) {
        setResults(res.data);
      }
    } catch (err) {
      console.error('Search failed:', err);
    } finally {
      setIsLoading(false);
    }
  }, [keyword, page, sortBy, filters]);

  useEffect(() => {
    doSearch();
  }, [doSearch]);

  // Autocomplete
  useEffect(() => {
    if (!keyword || keyword.length < 2) {
      setSuggestions([]);
      return;
    }
    const timer = setTimeout(async () => {
      try {
        const res = await showService.getSuggestions(keyword);
        if (res.success) setSuggestions(res.data || []);
      } catch {
        setSuggestions([]);
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [keyword]);

  const handleSearch = (e) => {
    e.preventDefault();
    setPage(1);
    setShowSuggestions(false);
    doSearch();
  };

  const toggleGenre = (id) => {
    setFilters((prev) => ({
      ...prev,
      genreIds: prev.genreIds.includes(id)
        ? prev.genreIds.filter((g) => g !== id)
        : [...prev.genreIds, id],
    }));
  };

  const clearFilters = () => {
    setFilters({ genreIds: [], city: '', format: '', minPrice: '', maxPrice: '' });
    setPage(1);
  };

  const hasActiveFilters = filters.genreIds.length > 0 || filters.city || filters.format || filters.minPrice || filters.maxPrice;

  return (
    <div className="search-page">
      {/* Search Bar */}
      <div className="search-bar-section">
        <form className="search-bar" onSubmit={handleSearch}>
          <SearchIcon size={20} className="search-bar-icon" />
          <input
            type="text"
            placeholder="Search shows, venues, performers..."
            value={keyword}
            onChange={(e) => {
              setKeyword(e.target.value);
              setShowSuggestions(true);
            }}
            onFocus={() => setShowSuggestions(true)}
            onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
            className="search-bar-input"
            id="search-input"
          />
          {keyword && (
            <button
              type="button"
              className="search-bar-clear"
              onClick={() => { setKeyword(''); setSuggestions([]); }}
            >
              <X size={16} />
            </button>
          )}
          <button
            type="button"
            className={`search-filter-toggle ${hasActiveFilters ? 'search-filter-toggle--active' : ''}`}
            onClick={() => setShowFilters(!showFilters)}
          >
            <SlidersHorizontal size={18} />
          </button>
        </form>

        {/* Suggestions dropdown */}
        {showSuggestions && suggestions.length > 0 && (
          <div className="search-suggestions">
            {suggestions.map((item, i) => (
              <button
                key={i}
                className="search-suggestion-item"
                onMouseDown={() => {
                  setKeyword(item.name || item);
                  setShowSuggestions(false);
                  setPage(1);
                }}
              >
                <SearchIcon size={14} />
                <span>{item.name || item}</span>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Filters Panel */}
      {showFilters && (
        <div className="search-filters">
          {/* Genre filter */}
          {filterOptions?.genres?.length > 0 && (
            <div className="search-filter-group">
              <label className="search-filter-label">Genre</label>
              <div className="search-filter-chips">
                {filterOptions.genres.map((genre) => (
                  <button
                    key={genre.id}
                    className={`search-chip ${filters.genreIds.includes(genre.id) ? 'search-chip--active' : ''}`}
                    onClick={() => toggleGenre(genre.id)}
                  >
                    {genre.name}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* City filter */}
          {filterOptions?.cities?.length > 0 && (
            <div className="search-filter-group">
              <label className="search-filter-label">City</label>
              <select
                className="search-filter-select"
                value={filters.city}
                onChange={(e) => setFilters((p) => ({ ...p, city: e.target.value }))}
              >
                <option value="">All Cities</option>
                {filterOptions.cities.map((city) => (
                  <option key={city} value={city}>{city}</option>
                ))}
              </select>
            </div>
          )}

          {/* Format filter */}
          <div className="search-filter-group">
            <label className="search-filter-label">Format</label>
            <select
              className="search-filter-select"
              value={filters.format}
              onChange={(e) => setFilters((p) => ({ ...p, format: e.target.value }))}
            >
              <option value="">All Formats</option>
              <option value="Offline">Offline</option>
              <option value="Online">Online</option>
              <option value="Hybrid">Hybrid</option>
            </select>
          </div>

          {/* Price range */}
          <div className="search-filter-group">
            <label className="search-filter-label">Price Range</label>
            <div className="search-price-range">
              <input
                type="number"
                placeholder="Min"
                value={filters.minPrice}
                onChange={(e) => setFilters((p) => ({ ...p, minPrice: e.target.value }))}
                className="search-filter-input"
              />
              <span className="search-price-sep">–</span>
              <input
                type="number"
                placeholder="Max"
                value={filters.maxPrice}
                onChange={(e) => setFilters((p) => ({ ...p, maxPrice: e.target.value }))}
                className="search-filter-input"
              />
            </div>
          </div>

          {hasActiveFilters && (
            <button className="search-clear-filters" onClick={clearFilters}>
              Clear all filters
            </button>
          )}
        </div>
      )}

      {/* Sort + Results Count */}
      <div className="search-toolbar">
        <span className="search-result-count">
          {results ? `${results.totalCount} show${results.totalCount !== 1 ? 's' : ''} found` : ''}
        </span>
        <select
          className="search-sort-select"
          value={sortBy}
          onChange={(e) => { setSortBy(e.target.value); setPage(1); }}
        >
          {SORT_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
        </select>
      </div>

      {/* Results */}
      {isLoading ? (
        <div className="search-loading">
          <Loader2 size={28} className="auth-btn-spinner" />
        </div>
      ) : results?.items?.length > 0 ? (
        <>
          <div className="search-results-grid">
            {results.items.map((show) => (
              <ShowCard key={show.id} show={show} />
            ))}
          </div>
          <Pagination
            page={results.page}
            totalPages={results.totalPages || Math.ceil(results.totalCount / results.pageSize)}
            onPageChange={setPage}
          />
        </>
      ) : (
        <div className="search-empty">
          <SearchIcon size={48} />
          <h3>No shows found</h3>
          <p>Try different keywords or adjust your filters</p>
        </div>
      )}
    </div>
  );
}
