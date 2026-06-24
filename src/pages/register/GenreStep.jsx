import TagSelector from '../../components/TagSelector';
import { MUSIC_GENRES } from '../../constants/preferences';

export default function GenreStep({ selectedGenres, onToggleGenre, onNext, onPrev }) {
  return (
    <div
      className="preference-step"
    >
      <h2 className="auth-title">A few things about you</h2>
      <p className="auth-subtitle">Your favorite music genres include...</p>

      <div className="tag-selector-wrapper">
        <TagSelector
          tags={MUSIC_GENRES}
          selectedIds={selectedGenres}
          onToggle={onToggleGenre}
        />
      </div>

      <div className="step-navigation">
        <button type="button" className="step-nav-btn step-nav-btn--outline" onClick={onPrev}>
          Back
        </button>
        <button
          type="button"
          className="step-nav-btn"
          onClick={onNext}
          disabled={selectedGenres.length === 0}
        >
          Confirm
        </button>
      </div>
    </div>
  );
}
