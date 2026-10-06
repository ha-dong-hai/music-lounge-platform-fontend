import { Mic, Crown } from 'lucide-react';

export default function RoleSelection({ onSelectRole }) {
  return (
    <div className="role-selection">
      <h2 className="auth-title">Sign Up</h2>
      <p className="auth-subtitle">You want to register as...</p>

      <div className="role-cards-container">
        <button
          className="role-card"
          onClick={() => onSelectRole('Audience')}
        >
          <div className="role-card-icon">
            <Mic size={32} />
          </div>
          <h3 className="role-card-title">Audience</h3>
          <p className="role-card-desc">Discover & enjoy live music events</p>
        </button>

        <button
          className="role-card"
          onClick={() => onSelectRole('Owner')}
        >
          <div className="role-card-icon">
            <Crown size={32} />
          </div>
          <h3 className="role-card-title">Event Owner</h3>
          <p className="role-card-desc">Host & manage your own music events</p>
        </button>
      </div>
    </div>
  );
}

