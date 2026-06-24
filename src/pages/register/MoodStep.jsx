import { Loader2 } from 'lucide-react';
import TagSelector from '../../components/TagSelector';
import { MOODS } from '../../constants/preferences';

export default function MoodStep({ selectedMoods, onToggleMood, onSubmit, onPrev, isLoading }) {
  return (
    <div
      className="preference-step"
    >
      <h2 className="auth-title">A few things about you</h2>
      <p className="auth-subtitle">Your mood when listening to music...</p>

      <div className="tag-selector-wrapper">
        <TagSelector
          tags={MOODS}
          selectedIds={selectedMoods}
          onToggle={onToggleMood}
        />
      </div>

      <div className="step-navigation">
        <button type="button" className="step-nav-btn step-nav-btn--outline" onClick={onPrev} disabled={isLoading}>
          Back
        </button>
        <button
          type="button"
          className="step-nav-btn"
          onClick={onSubmit}
          disabled={selectedMoods.length === 0 || isLoading}
        >
          {isLoading ? (
            <>
              <Loader2 size={18} className="auth-btn-spinner" />
              Registering...
            </>
          ) : (
            'Complete'
          )}
        </button>
      </div>
    </div>
  );
}
