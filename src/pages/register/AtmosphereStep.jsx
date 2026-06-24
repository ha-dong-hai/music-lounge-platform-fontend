import TagSelector from '../../components/TagSelector';
import { ATMOSPHERES } from '../../constants/preferences';

export default function AtmosphereStep({ selectedAtmospheres, onToggleAtmosphere, onNext, onPrev }) {
  return (
    <div
      className="preference-step"
    >
      <h2 className="auth-title">A few things about you</h2>
      <p className="auth-subtitle">The spaces where you often enjoy music...</p>

      <div className="tag-selector-wrapper">
        <TagSelector
          tags={ATMOSPHERES}
          selectedIds={selectedAtmospheres}
          onToggle={onToggleAtmosphere}
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
          disabled={selectedAtmospheres.length === 0}
        >
          Confirm
        </button>
      </div>
    </div>
  );
}
